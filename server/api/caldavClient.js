import ICAL from 'ical.js'

function authHeader(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

function stripCData(text) {
  return String(text).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function parseICSEvents(icsText) {
  const events = []
  try {
    const cleaned = stripCData(icsText)
    const jCal = ICAL.parse(cleaned)
    const comp = new ICAL.Component(jCal)
    const vevents = comp.getAllSubcomponents('vevent')
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)
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
    console.warn('[caldav] ICS parse error:', e.message)
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
  let calFullUrl
  if (calendarUrl.startsWith('http')) {
    calFullUrl = calendarUrl
  } else {
    const base = new URL(baseUrl)
    calFullUrl = base.origin + calendarUrl
  }
  if (!calFullUrl.endsWith('/')) calFullUrl += '/'

  const headers = {
    'Authorization': authHeader(username, password),
    'Depth': '1',
    'Content-Type': 'application/xml; charset=utf-8'
  }

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
    const respBody = await res.text().catch(() => '')
    throw new Error(`Fetch events failed: HTTP ${res.status} from ${calFullUrl}${respBody ? ' — ' + respBody.slice(0, 200) : ''}`)
  }

  const xml = await res.text()
  const events = []
  const dataRegex = /<[^>:]*:calendar-data>([\s\S]*?)<\/[^>:]*:calendar-data>/gi
  let match
  while ((match = dataRegex.exec(xml)) !== null) {
    const icsData = stripCData(match[1])
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

function generateUID() {
  return 'dashhub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function formatCalDAVDate(date) {
  const d = new Date(date)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function createEvent(baseUrl, username, password, calendarUrl, event) {
  let calFullUrl
  if (calendarUrl.startsWith('http')) {
    calFullUrl = calendarUrl
  } else {
    const base = new URL(baseUrl)
    calFullUrl = base.origin + calendarUrl
  }
  if (!calFullUrl.endsWith('/')) calFullUrl += '/'

  const uid = generateUID()
  const now = formatCalDAVDate(new Date())
  const startStr = formatCalDAVDate(event.start)
  const endStr = formatCalDAVDate(event.end)

  const description = (event.description || '').replace(/\r?\n/g, '\\n')
  const summary = (event.summary || '(No title)').replace(/\r?\n/g, '\\n')
  const location = (event.location || '').replace(/\r?\n/g, '\\n')

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DashHub//CalDAV//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${summary}`
  if (location) ics += `\nLOCATION:${location}`
  if (description) ics += `\nDESCRIPTION:${description}`
  ics += `\nEND:VEVENT\nEND:VCALENDAR`

  const eventUrl = calFullUrl + uid + '.ics'

  const headers = {
    'Authorization': authHeader(username, password),
    'Content-Type': 'text/calendar; charset=utf-8'
  }


  const res = await fetch(eventUrl, { method: 'PUT', headers, body: ics })
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const respBody = await res.text().catch(() => '')
    throw new Error(`Create event failed: HTTP ${res.status}${respBody ? ' — ' + respBody.slice(0, 200) : ''}`)
  }

  return { uid }
}

export async function deleteEvent(baseUrl, username, password, calendarUrl, eventUid) {
  let calFullUrl
  if (calendarUrl.startsWith('http')) {
    calFullUrl = calendarUrl
  } else {
    const base = new URL(baseUrl)
    calFullUrl = base.origin + calendarUrl
  }
  if (!calFullUrl.endsWith('/')) calFullUrl += '/'

  const eventUrl = calFullUrl + eventUid + '.ics'

  const headers = {
    'Authorization': authHeader(username, password)
  }


  const res = await fetch(eventUrl, { method: 'DELETE', headers })
  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const respBody = await res.text().catch(() => '')
    throw new Error(`Delete event failed: HTTP ${res.status}${respBody ? ' — ' + respBody.slice(0, 200) : ''}`)
  }

  return { ok: true }
}
