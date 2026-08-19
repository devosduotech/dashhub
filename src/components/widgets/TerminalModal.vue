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

const termContainer = ref<HTMLElement | null>(null)
const statusMsg = ref<string>('Connecting...')
const connected = ref(false)
const errorMsg = ref<string | null>(null)
const hostKeyPrompt = ref<{ host: string; port: number; fingerprint: string } | null>(null)
const tabs = ref<{ id: number; name: string }[]>([{ id: 0, name: props.conn.name }])
const activeTab = ref(0)

let term: Terminal | null = null
let fitAddon: FitAddon | null = null
let ws: WebSocket | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null

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

function getWsUrl(conn: SshConnection): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const connId = encodeURIComponent(conn.id || conn.name)
  return `${proto}//${host}/api/ssh?id=${connId}&cols=80&rows=24`
}

function acceptHostKey() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'host-key-accept' }))
  }
  hostKeyPrompt.value = null
}

function rejectHostKey() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'host-key-reject' }))
  }
  hostKeyPrompt.value = null
}

function connect() {
  if (!term) return
  const url = getWsUrl(props.conn)
  ws = new WebSocket(url)

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'connected') {
        connected.value = true
        statusMsg.value = ''
        term?.write(`\r\n\x1b[32mConnected to ${msg.host}:${msg.port}\x1b[0m\r\n\r\n`)
      } else if (msg.type === 'data') {
        term?.write(msg.data)
      } else if (msg.type === 'error') {
        errorMsg.value = msg.message
        statusMsg.value = msg.message
        term?.write(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`)
      } else if (msg.type === 'host-key') {
        hostKeyPrompt.value = { host: msg.host, port: msg.port, fingerprint: msg.fingerprint }
        statusMsg.value = 'Host key verification required'
        term?.write(`\r\n\x1b[33mHost authenticity cannot be established.\r\nPlease review the fingerprint below.\x1b[0m\r\n`)
      } else if (msg.type === 'closed') {
        connected.value = false
        statusMsg.value = 'Connection closed'
        term?.write(`\r\n\x1b[33mConnection closed.\x1b[0m\r\n`)
      }
    } catch (e) {
      // ignore
    }
  }

  ws.onerror = () => {
    errorMsg.value = 'WebSocket connection failed'
    statusMsg.value = 'WebSocket error - cannot reach SSH bridge'
    term?.write(`\r\n\x1b[31mCannot connect to SSH bridge. Is the API server running?\x1b[0m\r\n`)
  }

  ws.onclose = () => {
    connected.value = false
  }
}

function sendInput(data: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'input', data }))
  }
}

function sendResize() {
  if (!term || !fitAddon) return
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
  }
}

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    fitAddon?.fit()
    sendResize()
  }, 100)
}

function closeTerminal() {
  if (ws) {
    ws.close()
    ws = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (term) {
    term.dispose()
    term = null
  }
  emit('close')
}

function newTab() {
  const id = tabs.value.length
  tabs.value.push({ id, name: props.conn.name })
  activeTab.value = id
  term?.write('\r\n\x1b[33mMulti-tab support coming soon.\x1b[0m\r\n')
}

onMounted(async () => {
  await nextTick()
  if (!termContainer.value) return

  const themeName = props.theme || 'monokai'
  const theme = THEMES[themeName] || THEMES.monokai

  term = new Terminal({
    fontSize: props.fontSize || 14,
    fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, Menlo, Consolas, monospace',
    cursorBlink: true,
    theme,
    cols: 80,
    rows: 24
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.loadAddon(new WebLinksAddon())
  term.open(termContainer.value)

  try {
    fitAddon.fit()
  } catch (e) {
    // ignore fit errors on initial mount
  }

  term.onData((data) => sendInput(data))

  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(termContainer.value)

  term.write('Connecting...\r\n')
  connect()
})

onBeforeUnmount(() => {
  closeTerminal()
})
</script>

<template>
  <Teleport to="body">
    <div class="terminal-overlay" @click.self="closeTerminal">
      <div class="terminal-modal">
        <div class="terminal-header">
          <span class="terminal-title">
            {{ conn.name }} - {{ conn.username }}@{{ conn.host }}:{{ conn.port }}
          </span>
          <span v-if="connected" class="terminal-status online">● Online</span>
          <span v-else-if="errorMsg" class="terminal-status error">● Error</span>
          <span v-else class="terminal-status connecting">● Connecting</span>
          <div class="terminal-header-actions">
            <button class="terminal-btn" title="New tab" @click="newTab"><AppIcon name="plus" :size="14" /></button>
            <button class="terminal-btn" @click="closeTerminal" title="Close"><AppIcon name="close" :size="14" /></button>
          </div>
        </div>
        <div ref="termContainer" class="terminal-body"></div>
        <div v-if="hostKeyPrompt" class="host-key-prompt">
          <div class="host-key-content">
            <div class="host-key-head">
              <span class="host-key-shield"><AppIcon name="shield" :size="20" /></span>
              <div>
                <div class="host-key-title">Verify SSH Host</div>
                <div class="host-key-subtitle">Host key verification required</div>
              </div>
            </div>
            <div class="host-key-conn">
              <span class="host-key-conn-name">{{ conn.name }}</span>
              <span class="host-key-detail">{{ hostKeyPrompt.host }}:{{ hostKeyPrompt.port }}</span>
            </div>
            <p class="host-key-explainer">
              The identity of this server could not be verified yet. Compare the
              fingerprint below with the one shown by your server administrator.
            </p>
            <div class="host-key-fingerprint">
              <span class="host-key-fp-label">SHA256 Fingerprint</span>
              <code>{{ hostKeyPrompt.fingerprint }}</code>
            </div>
            <p class="host-key-note">
              <AppIcon name="warning" :size="13" />
              Verify this fingerprint before accepting the server's identity. Accepting stores it
              in known_hosts for automatic verification on future connections.
            </p>
            <div class="host-key-actions">
              <button class="hk-btn hk-btn-danger" @click="rejectHostKey">Cancel</button>
              <button class="hk-btn hk-btn-primary" @click="acceptHostKey">
                <AppIcon name="shield-check" :size="14" />
                Accept and Save
              </button>
            </div>
          </div>
        </div>
        <div class="terminal-footer">
          <span
            v-for="tab in tabs"
            :key="tab.id"
            class="terminal-tab"
            :class="{ active: tab.id === activeTab }"
            @click="activeTab = tab.id"
          >Tab {{ tab.id + 1 }}: {{ tab.name }}</span>
        </div>
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
  padding: 2rem;
}

.terminal-modal {
  background-color: #1e1e1e;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  border-radius: 12px 12px 0 0;
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

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }
}

.terminal-body {
  flex: 1;
  padding: 0.5rem;
  overflow: hidden;
  background-color: #1e1e1e;
}

.host-key-prompt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.78);
  z-index: 10;
  padding: 1.5rem;
}

.host-key-content {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-warning);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.host-key-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.host-key-shield {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  background-color: rgba(255, 176, 32, 0.15);
  color: var(--color-warning);
  flex-shrink: 0;
}

.host-key-title {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text);
  line-height: 1.2;
}

.host-key-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.host-key-conn {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.host-key-conn-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.host-key-detail {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.host-key-explainer {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.host-key-fingerprint {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
}

.host-key-fp-label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-dim);
}

.host-key-fingerprint code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text);
  word-break: break-all;
}

.host-key-note {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-warning);
  line-height: 1.4;
}

.host-key-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.hk-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  background-color: var(--color-surface);

  &:hover { background-color: var(--color-bg-hover); }
}

.hk-btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;

  &:hover { background-color: var(--color-primary-hover); }
}

.hk-btn-danger {
  color: var(--color-text-muted);

  &:hover { background-color: var(--color-bg-hover); color: var(--color-text); }
}

.terminal-body :deep(.xterm) {
  height: 100%;
}

.terminal-footer {
  display: flex;
  align-items: center;
  padding: 0.375rem 1rem;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 12px 12px;
  gap: 0.5rem;
  overflow-x: auto;
}

.terminal-tab {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding: 0.25rem 0.75rem;
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
</style>