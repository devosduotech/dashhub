import { runSshCommand } from './sshUtils.js'

function parseSystemInfo(stdout) {
  const result = {
    cpu: { cores: 0, model: '', usagePercent: 0, loadAvg: [0, 0, 0] },
    memory: { totalMb: 0, usedMb: 0, percent: 0 },
    disk: [],
    network: []
  }

  const sections = stdout.split('===')
  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.startsWith('CPU')) {
      const lines = trimmed.split('\n').slice(1)
      for (const line of lines) {
        if (/^\d+$/.test(line.trim())) {
          result.cpu.cores = parseInt(line.trim())
        } else if (line.includes('model name')) {
          result.cpu.model = line.split(':').slice(1).join(':').trim()
        } else if (line.includes('Cpu(s)') || line.includes('%Cpu')) {
          const match = line.match(/(\d+\.?\d*)\s*id/)
          if (match) result.cpu.usagePercent = Math.round((100 - parseFloat(match[1])) * 10) / 10
        } else if (line.includes('load average')) {
          const match = line.match(/load average:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/)
          if (match) {
            result.cpu.loadAvg = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]
          }
        }
      }
    } else if (trimmed.startsWith('MEM')) {
      const lines = trimmed.split('\n').slice(1)
      for (const line of lines) {
        if (line.startsWith('Mem:')) {
          const parts = line.split(/\s+/)
          result.memory.totalMb = parseInt(parts[1]) || 0
          result.memory.usedMb = parseInt(parts[2]) || 0
          result.memory.percent = result.memory.totalMb > 0
            ? Math.round((result.memory.usedMb / result.memory.totalMb) * 1000) / 10
            : 0
        }
      }
    } else if (trimmed.startsWith('DISK')) {
      const lines = trimmed.split('\n').slice(1)
      for (const line of lines) {
        if (line.startsWith('Filesystem') || !line.trim()) continue
        const parts = line.split(/\s+/)
        if (parts.length >= 6) {
          const total = parts[1]
          const used = parts[2]
          const percent = parseInt(parts[4]) || 0
          const mount = parts[5]
          if (mount && mount.startsWith('/')) {
            result.disk.push({ mount, total, used, percent })
          }
        }
      }
    } else if (trimmed.startsWith('NET')) {
      const lines = trimmed.split('\n').slice(1)
      let netDevs = []
      for (const line of lines) {
        const ifaceMatch = line.match(/^(\S+)\s+(\S+)/)
        if (ifaceMatch && !ifaceMatch[1].includes(':') && ifaceMatch[1] !== 'lo') {
          netDevs.push({ interface: ifaceMatch[1], ip: ifaceMatch[2] })
        }
      }
      const rxTxLines = lines.filter(l => l.includes(':') && !l.includes('face'))
      for (let i = 0; i < rxTxLines.length && i < netDevs.length; i++) {
        const parts = rxTxLines[i].split(':')
        if (parts.length === 2) {
          const vals = parts[1].trim().split(/\s+/).map(Number)
          netDevs[i].rxMb = Math.round((vals[0] || 0) / 1048576 * 10) / 10
          netDevs[i].txMb = Math.round((vals[8] || 0) / 1048576 * 10) / 10
        }
      }
      result.network = netDevs
    }
  }

  return result
}

export async function fetchSystemInfo(connId) {
  const cmd = [
    'echo "===CPU==="',
    'nproc',
    'cat /proc/cpuinfo 2>/dev/null | grep "model name" | head -1',
    'top -bn1 2>/dev/null | head -5 || echo ""',
    'echo "===MEM==="',
    'free -m',
    'echo "===DISK==="',
    'df -h 2>/dev/null | grep -E "^/|^Filesystem"',
    'echo "===NET==="',
    'ip -brief addr show 2>/dev/null || ifconfig 2>/dev/null || echo ""',
    'cat /proc/net/dev 2>/dev/null | tail -n+3 || echo ""'
  ].join(' ; ')

  const stdout = await runSshCommand(connId, cmd)
  return parseSystemInfo(stdout)
}
