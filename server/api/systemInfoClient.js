import { runSshCommand } from './sshUtils.js'

function parseSystemInfo(stdout) {
  const result = {
    cpu: { cores: 0, model: '', usagePercent: 0, loadAvg: [0, 0, 0] },
    memory: { totalMb: 0, usedMb: 0, percent: 0 },
    disk: [],
    network: []
  }

  const cpuMatch = stdout.match(/==CPU==([\s\S]*?)==MEM==/)
  const memMatch = stdout.match(/==MEM==([\s\S]*?)==DISK==/)
  const diskMatch = stdout.match(/==DISK==([\s\S]*?)==NET==/)
  const netMatch = stdout.match(/==NET==([\s\S]*?)$/)

  if (cpuMatch) {
    const lines = cpuMatch[1].trim().split('\n')
    for (const line of lines) {
      if (/^\d+$/.test(line.trim())) {
        result.cpu.cores = parseInt(line.trim())
      } else if (line.includes('model name')) {
        result.cpu.model = line.split(':').slice(1).join(':').trim()
      } else if (line.includes('%Cpu') || line.includes('Cpu(s)')) {
        const match = line.match(/(\d+\.?\d*)\s*id/)
        if (match) result.cpu.usagePercent = Math.round((100 - parseFloat(match[1])) * 10) / 10
      } else if (line.includes('load average') || line.includes('Load average')) {
        const match = line.match(/[Ll]oad average:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/)
        if (match) {
          result.cpu.loadAvg = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]
        }
      }
    }
  }

  if (memMatch) {
    const lines = memMatch[1].trim().split('\n')
    for (const line of lines) {
      if (line.includes('Mem:')) {
        const parts = line.split(/\s+/)
        result.memory.totalMb = parseInt(parts[1]) || 0
        result.memory.usedMb = parseInt(parts[2]) || 0
        result.memory.percent = result.memory.totalMb > 0
          ? Math.round((result.memory.usedMb / result.memory.totalMb) * 1000) / 10
          : 0
      }
    }
  }

  if (diskMatch) {
    const lines = diskMatch[1].trim().split('\n')
    for (const line of lines) {
      if (!line.trim() || line.startsWith('Filesystem')) continue
      const parts = line.split(/\s+/)
      if (parts.length >= 6 && parts[0].startsWith('/')) {
        result.disk.push({
          mount: parts[parts.length - 1],
          total: parts[parts.length - 5],
          used: parts[parts.length - 4],
          percent: parseInt(parts[parts.length - 3]) || 0
        })
      }
    }
  }

  if (netMatch) {
    const lines = netMatch[1].trim().split('\n')
    for (const line of lines) {
      if (!line.trim() || line.includes('face') || line.startsWith('lo:')) continue
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const iface = line.substring(0, colonIdx).trim()
      if (!iface || iface === 'lo') continue
      const nums = line.substring(colonIdx + 1).trim().split(/\s+/).map(Number)
      if (nums.length >= 10) {
        result.network.push({
          interface: iface,
          ip: '',
          rxMb: Math.round((nums[0] || 0) / 1048576 * 10) / 10,
          txMb: Math.round((nums[8] || 0) / 1048576 * 10) / 10
        })
      }
    }
  }

  return result
}

export async function fetchSystemInfo(connId) {
  const cmd = [
    'echo "==CPU=="',
    'nproc',
    'cat /proc/cpuinfo 2>/dev/null | grep "model name" | head -1',
    'top -bn1 2>/dev/null | head -5',
    'echo "==MEM=="',
    'free -m',
    'echo "==DISK=="',
    'df -h 2>/dev/null | grep "^/"',
    'echo "==NET=="',
    'cat /proc/net/dev 2>/dev/null | tail -n+3'
  ].join(' ; ')

  const stdout = await runSshCommand(connId, cmd)
  return parseSystemInfo(stdout)
}
