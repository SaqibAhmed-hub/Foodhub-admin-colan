// Everything the backend calls "today" or "now" is in the organisation's timezone, not the browser's.
// Keep this in sync with `app.timezone` in the backend.
export const ORG_TZ = 'Asia/Kolkata'

function parts(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORG_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  const out = {}
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value
  return out
}

/** { date: 'YYYY-MM-DD', time: 'HH:mm' } in the organisation's timezone. */
export function orgNow(date = new Date()) {
  const p = parts(date)
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

/** '13:00:00' -> '13:00' (the backend sends seconds; <input type="time"> and the API accept HH:mm). */
export const hm = (t) => (t ? String(t).slice(0, 5) : '')

export function addMinutes(time, delta) {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(Math.max(h * 60 + m + delta, 0), 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** '13:00' -> '1:00 PM' */
export function time12(t) {
  if (!t) return ''
  const [h, m] = hm(t).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** '2026-11-06' -> 'Fri, 6 Nov 2026' (no timezone shifting: it is a calendar date). */
export function dateLabel(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

export function dayOffset(dateStr, todayStr) {
  const toDays = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000 }
  return toDays(dateStr) - toDays(todayStr)
}

export function relativeDay(dateStr, todayStr) {
  const n = dayOffset(dateStr, todayStr)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  return null
}

export function greeting(time) {
  const h = Number(time.slice(0, 2))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
