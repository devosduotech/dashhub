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

function extractTag(xml, tag) {
  const re = new RegExp(`<[^>:]*:${tag}[^>]*>([\\s\\S]*?)</[^>:]*:${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : null
}

function extractHref(xml) {
  return extractTag(xml, 'href')
}

function extractDisplayname(xml) {
  return extractTag(xml, 'displayname')
}

function hasCalendarResource(xml) {
  return /<[^>:]*:resourcetype>[\s\S]*?<[^>:]*:calendar\s*\/>[\s\S]*?<\/[^>:]*:resourcetype>/i.test(xml)
}

function findAllResponseBlocks(xml) {
  const blocks = []
  const re = /<[^>:]*:response>([\s\S]*?)<\/[^>:]*:response>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    blocks.push(m[0])
  }
  return blocks
}

export async function discoverCalendars(baseUrl, username, password) {
  const url = baseUrl.replace(/\/+$/, '')
  const headers = {
    'Authorization': authHeader(username, password),
    'Depth': '1',
    'Content-Type': 'application/xml; charset=utf-8'
  }

  const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/" xmlns:NC="http://nextcloud.org/ns">
  <D:prop>
    <D:displayname />
    <D:resourcetype />
    <CS:getctag />
    <C:supported-calendar-component-set />
    <D:calendar-home-set />
  </D:prop>
</D:propfind>`

  const res = await fetch(url + '/', { method: 'PROPFIND', headers, body: propfindBody })
  if (!res.ok && res.status !== 207) {
    throw new Error(`Discovery failed: HTTP ${res.status}`)
  }

  const xml = await res.text()
  const calendars = []

  // Step 1: Check if response has calendar resources directly
  const blocks = findAllResponseBlocks(xml)
  for (const block of blocks) {
    if (hasCalendarResource(block)) {
      const href = extractHref(block)
      const name = extractDisplayname(block)
      if (href) {
        calendars.push({ url: href, name: name || href })
      }
    }
  }

  if (calendars.length > 0) return calendars

  // Step 2: Look for calendar-home-set (Nextcloud pattern)
  const homeSetRaw = extractTag(xml, 'calendar-home-set')
  if (homeSetRaw) {
    const hrefMatch = homeSetRaw.match(/<[^>:]*:href[^>]*>([\s\S]*?)<\/[^>:]*:href>/i)
    if (hrefMatch) {
      let homeUrl = hrefMatch[1].trim()
      if (homeUrl.startsWith('/')) {
        const origin = new URL(url)
        homeUrl = origin.origin + homeUrl
      }
      const calRes = await fetch(homeUrl, { method: 'PROPFIND', headers, body: propfindBody })
      if (calRes.ok || calRes.status === 207) {
        const calXml = await calRes.text()
        const calBlocks = findAllResponseBlocks(calXml)
        for (const block of calBlocks) {
          if (hasCalendarResource(block)) {
            const href = extractHref(block)
            const name = extractDisplayname(block)
            if (href) {
              calendars.push({ url: href, name: name || href })
            }
          }
        }
      }
    }
  }

  if (calendars.length > 0) return calendars

  // Step 3: Try Nextcloud direct calendars path
  if (url.includes('/remote.php/dav')) {
    const calUrl = url.replace(/\/$/, '') + '/calendars/' + username + '/'
    const calRes = await fetch(calUrl, { method: 'PROPFIND', headers, body: propfindBody })
    if (calRes.ok || calRes.status === 207) {
      const calXml = await calRes.text()
      const calBlocks = findAllResponseBlocks(calXml)
      for (const block of calBlocks) {
        if (hasCalendarResource(block)) {
          const href = extractHref(block)
          const name = extractDisplayname(block)
          if (href) {
            calendars.push({ url: href, name: name || href })
          }
        }
      }
    }
  }

  return calendars
}

export async function fetchEvents(baseUrl, username, password, calendarUrl, start, end) {
  let calFullUrl = calendarUrl.startsWith('http') ? calendarUrl : baseUrl.replace(/\/+$/, '') + calendarUrl
  if (!calFullUrl.endsWith('/')) calFullUrl += '/'

  const headers = {
    'Authorization': authHeader(username, password),
    'Depth': '1',
    'Content-Type': 'application/xml; charset=utf-8'
  }

  // Validate calendar URL with PROPFIND first
  try {
    const probe = await fetch(calFullUrl, {
      method: 'PROPFIND',
      headers: { ...headers, Depth: '0' },
      body: '<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype /></D:prop></D:propfind>'
    })
    if (probe.status === 404) {
      const stripped = calFullUrl.replace(/\/+$/, '')
      const altRes = await fetch(stripped, {
        method: 'PROPFIND',
        headers: { ...headers, Depth: '0' },
        body: '<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype /></D:prop></D:propfind>'
      })
      if (altRes.ok || altRes.status === 207) {
        calFullUrl = stripped
      }
    }
  } catch {
    // proceed anyway
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
    const body = await res.text().catch(() => '')
    throw new Error(`Fetch events failed: HTTP ${res.status} from ${calFullUrl}${body ? ' — ' + body.slice(0, 200) : ''}`)
  }

  const xml = await res.text()
  const events = []
  const dataRegex = /<[^>:]*:calendar-data>([\s\S]*?)<\/[^>:]*:calendar-data>/gi
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
