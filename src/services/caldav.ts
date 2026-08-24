export interface CalDAVCalendar {
  url: string
  name: string
}

export interface CalDAVEvent {
  uid: string
  summary: string
  description: string
  location: string
  start: string | null
  end: string | null
  allDay: boolean
}

export async function discoverCalendars(
  baseUrl: string,
  username: string,
  password: string,
  widgetId?: string
): Promise<CalDAVCalendar[]> {
  const res = await fetch('/api/caldav/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, username, password, widgetId })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Discovery failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.calendars
}

export async function fetchEvents(
  baseUrl: string,
  username: string,
  password: string,
  calendarUrl: string,
  start: Date,
  end: Date,
  widgetId?: string
): Promise<CalDAVEvent[]> {
  const res = await fetch('/api/caldav/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, username, password, calendarUrl, start: start.toISOString(), end: end.toISOString(), widgetId })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Fetch failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.events
}

export async function createEvent(
  baseUrl: string,
  username: string,
  password: string,
  calendarUrl: string,
  event: { summary: string; description: string; location: string; start: Date; end: Date },
  widgetId?: string
): Promise<{ uid: string }> {
  const res = await fetch('/api/caldav/create-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseUrl, username, password, calendarUrl, widgetId,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start.toISOString(),
      end: event.end.toISOString()
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create failed: HTTP ${res.status}`)
  }
  return res.json()
}

export async function deleteEvent(
  baseUrl: string,
  username: string,
  password: string,
  calendarUrl: string,
  eventUid: string,
  widgetId?: string
): Promise<{ ok: boolean }> {
  const res = await fetch('/api/caldav/delete-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, username, password, calendarUrl, eventUid, widgetId })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete failed: HTTP ${res.status}`)
  }
  return res.json()
}

export function formatEventDate(isoStr: string, allDay: boolean): string {
  const d = new Date(isoStr)
  if (allDay) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isTomorrow) return `Tomorrow ${time}`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + time
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getMonthDays(year: number, month: number): Array<{ date: Date; inMonth: boolean }> {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const days: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, inMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), inMonth: true })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), inMonth: false })
  }
  return days
}
