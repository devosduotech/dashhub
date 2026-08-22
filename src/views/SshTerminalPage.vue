<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  connectionId: string
}>()

const term = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)
const containerEl = ref<HTMLElement | null>(null)
const connected = ref(false)
const connecting = ref(true)
const errorMsg = ref<string | null>(null)
const connName = ref('')
const connInfo = ref('')
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

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const connId = encodeURIComponent(props.connectionId)
  return `${proto}//${host}/api/ssh?id=${connId}&cols=80&rows=24`
}

function getTheme() {
  return THEMES.monokai
}

async function init() {
  await nextTick()
  if (!containerEl.value) return

  const t = new Terminal({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, Menlo, Consolas, monospace',
    cursorBlink: true,
    theme: getTheme(),
    cols: 80,
    rows: 24
  })
  const fa = new FitAddon()
  t.loadAddon(fa)
  t.loadAddon(new WebLinksAddon())
  t.open(containerEl.value)
  try { fa.fit() } catch { /* ignore */ }

  term.value = t
  fitAddon.value = fa

  t.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }))
    }
  })

  resizeObserver = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      fitAddon.value?.fit()
      if (term.value && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.value.cols, rows: term.value.rows }))
      }
    }, 100)
  })
  resizeObserver.observe(containerEl.value)

  t.write('Connecting...\r\n')
  connect()
}

function connect() {
  if (!term.value) return
  ws = new WebSocket(getWsUrl())

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'connected') {
        connected.value = true
        connecting.value = false
        connName.value = msg.host
        connInfo.value = `${msg.host}:${msg.port}`
        term.value?.write(`\r\n\x1b[32mConnected to ${msg.host}:${msg.port}\x1b[0m\r\n\r\n`)
      } else if (msg.type === 'data') {
        term.value?.write(msg.data)
      } else if (msg.type === 'error') {
        errorMsg.value = msg.message
        connecting.value = false
        term.value?.write(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`)
      } else if (msg.type === 'host-key') {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'host-key-accept' }))
        }
      } else if (msg.type === 'closed') {
        connected.value = false
        term.value?.write(`\r\n\x1b[33mConnection closed.\x1b[0m\r\n`)
      }
    } catch { /* ignore */ }
  }

  ws.onerror = () => {
    errorMsg.value = 'WebSocket connection failed'
    connecting.value = false
    term.value?.write(`\r\n\x1b[31mCannot connect to SSH bridge.\x1b[0m\r\n`)
  }

  ws.onclose = () => { connected.value = false }
}

function reconnect() {
  errorMsg.value = null
  connecting.value = true
  if (term.value) {
    term.value.clear()
    term.value.write('Reconnecting...\r\n')
  }
  connect()
}

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  if (ws) { ws.close(); ws = null }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  if (resizeTimer) { clearTimeout(resizeTimer) }
  if (term.value) { term.value.dispose(); term.value = null }
})
</script>

<template>
  <div class="ssh-page">
    <div class="ssh-header">
      <div class="header-left">
        <span class="header-title">DashHub SSH</span>
        <span class="header-conn" v-if="connInfo">{{ connInfo }}</span>
      </div>
      <div class="header-right">
        <span v-if="connected" class="status online">● Connected</span>
        <span v-else-if="connecting" class="status connecting">● Connecting</span>
        <span v-else-if="errorMsg" class="status error">● {{ errorMsg }}</span>
        <span v-else class="status disconnected">● Disconnected</span>
        <button v-if="!connected && !connecting" class="header-btn" @click="reconnect" title="Reconnect">
          <AppIcon name="refresh" :size="14" /> Reconnect
        </button>
      </div>
    </div>
    <div ref="containerEl" class="ssh-terminal"></div>
  </div>
</template>

<style scoped lang="scss">
.ssh-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #272822;
  overflow: hidden;
}

.ssh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: #1e1e1e;
  border-bottom: 1px solid #3e3e3e;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #f8f8f2;
  font-family: 'JetBrains Mono', monospace;
}

.header-conn {
  font-size: 0.75rem;
  color: #75715e;
  font-family: 'JetBrains Mono', monospace;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status {
  font-size: 0.75rem;
  &.online { color: #a6e22e; }
  &.connecting { color: #f4bf75; }
  &.error { color: #f92672; }
  &.disconnected { color: #75715e; }
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background-color: #3e3e3e;
  border: 1px solid #5e5e5e;
  border-radius: 4px;
  color: #f8f8f2;
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { background-color: #4e4e4e; }
}

.ssh-terminal {
  flex: 1;
  padding: 0.5rem;
  overflow: hidden;
}
</style>
