<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import type { SshConnection } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  conn: SshConnection
  defaultShell?: string
  theme?: string
  fontSize?: number
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

interface TabState {
  id: number
  name: string
  containerEl: HTMLElement | null
  term: Terminal | null
  fitAddon: FitAddon | null
  ws: WebSocket | null
  resizeObserver: ResizeObserver | null
  resizeTimer: ReturnType<typeof setTimeout> | null
  connected: boolean
  statusMsg: string
  errorMsg: string | null
  hostKeyPrompt: { host: string; port: number; fingerprint: string } | null
}

const tabs = ref<TabState[]>([])
const activeTabId = ref(0)
let tabIdCounter = 0

const modalWidth = ref(900)
const modalHeight = ref(600)
const STORAGE_KEY = 'dashhub-terminal-size'
let resizing = false
let resizeStartX = 0
let resizeStartY = 0
let resizeStartW = 0
let resizeStartH = 0

const THEMES: Record<string, Record<string, string>> = {
  monokai: {
    background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f2',
    black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
    blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2'
  },
  'solarized-dark': {
    background: '#002b36', foreground: '#839496', cursor: '#839496',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5'
  },
  dracula: {
    background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2',
    black: '#000000', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2'
  },
  nord: {
    background: '#2e3440', foreground: '#d8dee9', cursor: '#d8dee9',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0'
  }
}

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const connId = encodeURIComponent(props.conn.id || props.conn.name)
  return `${proto}//${host}/api/ssh?id=${connId}&cols=80&rows=24`
}

function getTheme() {
  return THEMES[props.theme || 'monokai'] || THEMES.monokai
}

function initTerminal(tab: TabState) {
  if (!tab.containerEl) return
  const term = new Terminal({
    fontSize: props.fontSize || 14,
    fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, Menlo, Consolas, monospace',
    cursorBlink: true,
    theme: getTheme(),
    cols: 80,
    rows: 24
  })
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.loadAddon(new WebLinksAddon())
  term.open(tab.containerEl)
  try { fitAddon.fit() } catch { /* ignore */ }

  tab.term = term
  tab.fitAddon = fitAddon

  term.onData((data) => {
    if (tab.ws && tab.ws.readyState === WebSocket.OPEN) {
      tab.ws.send(JSON.stringify({ type: 'input', data }))
    }
  })

  tab.resizeObserver = new ResizeObserver(() => {
    if (tab.resizeTimer) clearTimeout(tab.resizeTimer)
    tab.resizeTimer = setTimeout(() => {
      tab.fitAddon?.fit()
      if (tab.term && tab.ws && tab.ws.readyState === WebSocket.OPEN) {
        tab.ws.send(JSON.stringify({ type: 'resize', cols: tab.term.cols, rows: tab.term.rows }))
      }
    }, 100)
  })
  tab.resizeObserver.observe(tab.containerEl)

  connectTab(tab)
}

function connectTab(tab: TabState) {
  if (!tab.term) return
  const ws = new WebSocket(getWsUrl())
  tab.ws = ws

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'connected') {
        tab.connected = true
        tab.statusMsg = ''
        tab.term?.write(`\r\n\x1b[32mConnected to ${msg.host}:${msg.port}\x1b[0m\r\n\r\n`)
      } else if (msg.type === 'data') {
        tab.term?.write(msg.data)
      } else if (msg.type === 'error') {
        tab.errorMsg = msg.message
        tab.statusMsg = msg.message
        tab.term?.write(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`)
      } else if (msg.type === 'host-key') {
        tab.hostKeyPrompt = { host: msg.host, port: msg.port, fingerprint: msg.fingerprint }
        tab.statusMsg = 'Verifying host key...'
        tab.term?.write(`\r\n\x1b[33mVerifying host key...\x1b[0m\r\n`)
        if (tab.ws && tab.ws.readyState === WebSocket.OPEN) {
          tab.ws.send(JSON.stringify({ type: 'host-key-accept' }))
        }
        tab.hostKeyPrompt = null
      } else if (msg.type === 'closed') {
        tab.connected = false
        tab.statusMsg = 'Connection closed'
        tab.term?.write(`\r\n\x1b[33mConnection closed.\x1b[0m\r\n`)
      }
    } catch { /* ignore */ }
  }
  ws.onerror = () => {
    tab.errorMsg = 'WebSocket connection failed'
    tab.statusMsg = 'WebSocket error'
    tab.term?.write(`\r\n\x1b[31mCannot connect to SSH bridge.\x1b[0m\r\n`)
  }
  ws.onclose = () => { tab.connected = false }
}

function disposeTab(tab: TabState) {
  if (tab.ws) { tab.ws.close(); tab.ws = null }
  if (tab.resizeObserver) { tab.resizeObserver.disconnect(); tab.resizeObserver = null }
  if (tab.resizeTimer) { clearTimeout(tab.resizeTimer); tab.resizeTimer = null }
  if (tab.term) { tab.term.dispose(); tab.term = null }
}

function closeTab(id: number) {
  const idx = tabs.value.findIndex(t => t.id === id)
  if (idx < 0) return
  disposeTab(tabs.value[idx])
  tabs.value.splice(idx, 1)
  if (tabs.value.length === 0) { emit('close'); return }
  if (activeTabId.value === id) {
    const newIdx = Math.min(idx, tabs.value.length - 1)
    switchTab(tabs.value[newIdx].id)
  }
}

function switchTab(id: number) {
  activeTabId.value = id
  nextTick(() => {
    const tab = tabs.value.find(t => t.id === id)
    if (tab?.fitAddon) { try { tab.fitAddon.fit() } catch { /* ignore */ } }
  })
}

async function newTab() {
  const name = tabs.value.length === 0 ? props.conn.name : `${props.conn.name} #${tabs.value.length + 1}`
  const container = document.createElement('div')
  container.style.cssText = 'position:absolute;inset:0;padding:0.5rem;overflow:hidden;display:none;background:#1e1e1e;'
  const body = document.querySelector('.terminal-body')
  if (body) body.appendChild(container)

  const tab: TabState = {
    id: tabIdCounter++, name, containerEl: container,
    term: null, fitAddon: null, ws: null, resizeObserver: null, resizeTimer: null,
    connected: false, statusMsg: 'Connecting...', errorMsg: null, hostKeyPrompt: null
  }
  tabs.value.push(tab)
  activeTabId.value = tab.id
  await nextTick()
  initTerminal(tab)
}

function closeAllTabs() {
  for (const tab of tabs.value) disposeTab(tab)
  tabs.value = []
  emit('close')
}

function onResizeStart(e: MouseEvent) {
  resizing = true
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeStartW = modalWidth.value
  resizeStartH = modalHeight.value
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e: MouseEvent) {
  if (!resizing) return
  modalWidth.value = Math.max(600, Math.min(window.innerWidth * 0.95, resizeStartW + (e.clientX - resizeStartX)))
  modalHeight.value = Math.max(400, Math.min(window.innerHeight * 0.9, resizeStartH + (e.clientY - resizeStartY)))
}

function onResizeEnd() {
  resizing = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ w: modalWidth.value, h: modalHeight.value }))
  const active = tabs.value.find(t => t.id === activeTabId.value)
  if (active?.fitAddon) { try { active.fitAddon.fit() } catch { /* ignore */ } }
}

onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const { w, h } = JSON.parse(saved)
      if (w && h) { modalWidth.value = w; modalHeight.value = h }
    } catch { /* ignore */ }
  }
  await nextTick()
  const container = document.querySelector('.terminal-body')
  if (!container) return
  const tab: TabState = {
    id: tabIdCounter++, name: props.conn.name,
    containerEl: container as HTMLElement,
    term: null, fitAddon: null, ws: null, resizeObserver: null, resizeTimer: null,
    connected: false, statusMsg: 'Connecting...', errorMsg: null, hostKeyPrompt: null
  }
  tabs.value.push(tab)
  activeTabId.value = tab.id
  initTerminal(tab)
})

onBeforeUnmount(() => {
  for (const tab of tabs.value) disposeTab(tab)
  tabs.value = []
})
</script>

<template>
  <Teleport to="body">
    <div class="terminal-overlay">
      <div class="terminal-modal" :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }">
        <div class="terminal-header">
          <span class="terminal-title">
            {{ conn.name }} - {{ conn.username }}@{{ conn.host }}:{{ conn.port }}
          </span>
          <span v-if="tabs.find(t => t.id === activeTabId)?.connected" class="terminal-status online">● Online</span>
          <span v-else-if="tabs.find(t => t.id === activeTabId)?.errorMsg" class="terminal-status error">● Error</span>
          <span v-else class="terminal-status connecting">● Connecting</span>
          <div class="terminal-header-actions">
            <button class="terminal-btn" title="New tab" @click="newTab"><AppIcon name="plus" :size="14" /></button>
            <button class="terminal-btn" @click="closeAllTabs" title="Close"><AppIcon name="close" :size="14" /></button>
          </div>
        </div>
        <div class="terminal-body">
          <template v-for="tab in tabs" :key="tab.id">
            <div
              v-show="tab.id === activeTabId"
              class="tab-pane"
            ></div>
          </template>
        </div>
        <div class="terminal-footer">
          <span
            v-for="tab in tabs"
            :key="tab.id"
            class="terminal-tab"
            :class="{ active: tab.id === activeTabId }"
            @click="switchTab(tab.id)"
          >
            <span class="tab-dot" :class="{ online: tab.connected }"></span>
            {{ tab.name }}
            <button v-if="tabs.length > 1" class="tab-close" @click.stop="closeTab(tab.id)">
              <AppIcon name="close" :size="10" />
            </button>
          </span>
        </div>
        <div class="resize-handle" @mousedown="onResizeStart"></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.terminal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
  padding: 1rem;
}

.terminal-modal {
  position: relative;
  background-color: #1e1e1e;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
  min-width: 600px;
  min-height: 400px;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.terminal-title {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.terminal-status {
  font-size: 0.75rem;
  white-space: nowrap;
  &.online { color: var(--color-success); }
  &.connecting { color: var(--color-warning); }
  &.error { color: var(--color-danger); }
}

.terminal-header-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.terminal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); color: var(--color-text); }
}

.terminal-body {
  position: relative;
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
}

.tab-pane {
  position: absolute;
  inset: 0;
  padding: 0.5rem;
  overflow: hidden;
}

.terminal-footer {
  display: flex;
  align-items: center;
  padding: 0.375rem 1rem;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 12px 12px;
  gap: 0.375rem;
  overflow-x: auto;
  flex-shrink: 0;
}

.terminal-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding: 0.25rem 0.625rem;
  background-color: var(--color-surface);
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid var(--color-border);
  &.active {
    color: var(--color-text);
    border-color: var(--color-primary);
    background-color: var(--color-primary-dim);
  }
}

.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-text-dim);
  &.online { background-color: var(--color-success); }
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0;
  margin-left: 0.125rem;
  cursor: pointer;
  border-radius: 2px;
  &:hover { color: var(--color-danger); background-color: rgba(255,255,255,0.1); }
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 20;
}
</style>
