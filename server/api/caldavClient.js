import ICAL from 'ical.js'

function authHeader(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

function parseICSEvents(icsText) {
  const events = []
  try {
    const jCal = ICAL.parse(icsText)
    const comp = new ICAL.Component(jCal)
    const vevents = comp.getAllSubcomponents('vevent')
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)
      if (event.isRecurrence()) continue
      events.push({
        uid: event.uid,
        summary: event.summary || '(No title)',
        description: event.description || '',
        location: event.location || '',
        start: event.startDate ? event.startDate.toJSDate().toISOString() : null,
        end: event.endDate ? event.endDate.toJSDate().toISOString() : null,
        allDay: vevent.getFirstPropertyValue('dtstart') &&
          vevent.getFirstPropertyValue('dtstart').isDate
      })
    }
  } catch (e) {
    // Ignore parse errors for individual events
  }
  return events
}

export async function discoverCalendars(baseUrl, username, password) {
  const url = baseUrl.replace(/\/+$/, '')
  const headers = {
    'Authorization': authHeader(username, password),
    'Depth': '1',
    'Content-Type': 'application/xml; charset=utf-8'
  }

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:displayname />
    <D:resourcetype />
    <CS:getctag />
    <C:supported-calendar-component-set />
  </D:prop>
</D:propfind>`

  const res = await fetch(url + '/', { method: 'PROPFIND', headers, body })
  if (!res.ok && res.status !== 207) {
    throw new Error(`Discovery failed: HTTP ${res.status}`)
  }

  const xml = await res.text()
  const calendars = []
  const responseRegex = /<D:response>([\s\S]*?)<\/D:response>/g
  let match
  while ((match = responseRegex.exec(xml)) !== null) {
    const block = match[1]
    if (block.includes('<C:calendar/>')) {
      const hrefMatch = block.match(/<D:href>([\s\S]*?)<\/D:href>/)
      const nameMatch = block.match(/<D:displayname>([\s\S]*?)<\/D:displayname>/)
      if (hrefMatch) {
        calendars.push({
          url: hrefMatch[1],
          name: nameMatch ? nameMatch[1] : hrefMatch[1]
        })
      }
    }
  }
  return calendars
}

export async function fetchEvents(baseUrl, username, password, calendarUrl, start, end) {
  const calFullUrl = calendarUrl.startsWith('http') ? calendarUrl : baseUrl.replace(/\/+$/, '') + calendarUrl
  const headers = {
    'Authorization': authHeader(username, password),
    'Depth': '1',
    'Content-Type': 'application/xml; charset=utf-8'
  }

  const startStr = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const endStr = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag />
    <C:calendar-data />
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${startStr}" end="${endStr}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`

  const res = await fetch(calFullUrl, { method: 'REPORT', headers, body })
  if (!res.ok && res.status !== 207) {
    throw new Error(`Fetch events failed: HTTP ${res.status}`)
  }

  const xml = await res.text()
  const events = []
  const dataRegex = /<C:calendar-data>([\s\S]*?)<\/C:calendar-data>/g
  let match
  while ((match = dataRegex.exec(xml)) !== null) {
    const icsData = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    const parsed = parseICSEvents(icsData)
    events.push(...parsed)
  }

  events.sort((a, b) => {
    if (!a.start) return 1
    if (!b.start) return -1
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })

  return events
}
