import { runSshCommand } from './sshUtils.js'

function parsePsOutput(stdout) {
  const lines = stdout.trim().split('\n')
  if (lines.length < 2) return []
  const processes = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const parts = line.split(/\s+/)
    if (parts.length < 11) continue
    const user = parts[0]
    const pid = parseInt(parts[1])
    const cpu = parseFloat(parts[2])
    const mem = parseFloat(parts[3])
    const vsz = parseInt(parts[4])
    const rss = parseInt(parts[5])
    const stat = parts[7]
    const start = parts[8]
    const time = parts[9]
    const command = parts.slice(10).join(' ')
    const name = command.split('/').pop().split(' ')[0]
    processes.push({ user, pid, cpu, mem, vsz, rss, stat, start, time, command, name })
  }
  return processes
}

export async function fetchProcesses(connId, sortBy = 'cpu', sortOrder = 'desc', maxProcesses = 25) {
  const sortField = sortBy === 'mem' ? '%mem' : sortBy === 'pid' ? 'pid' : '%cpu'
  const cmd = `ps aux --sort=${sortOrder === 'asc' ? '' : '-'}${sortField} | head -n ${maxProcesses + 1}`
  const stdout = await runSshCommand(connId, cmd)
  return parsePsOutput(stdout)
}
