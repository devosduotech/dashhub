import { runSshCommand } from './sshUtils.js'

function parseServiceOutput(stdout) {
  const services = []
  const lines = stdout.trim().split('\n')
  for (const line of lines) {
    const parts = line.split('|')
    if (parts.length >= 2) {
      const name = parts[0].trim()
      const state = parts[1].trim()
      const since = parts[2] ? parts[2].trim() : ''
      services.push({
        name,
        active: state === 'active',
        state,
        since
      })
    }
  }
  return services
}

export async function fetchServiceStatus(connId, services) {
  const serviceList = services.map(s => `"${s}"`).join(' ')
  const cmd = `for s in ${serviceList}; do STATUS=$(systemctl is-active "$s" 2>/dev/null); RC=$?; if [ $RC -ne 0 ]; then STATUS="inactive"; fi; SINCE=$(systemctl show "$s" --property=ActiveEnterTimestamp --value 2>/dev/null || echo ""); printf '%s|%s|%s\n' "$s" "$STATUS" "$SINCE"; done`
  const stdout = await runSshCommand(connId, cmd, 30000)
  return parseServiceOutput(stdout)
}
