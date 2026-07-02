import type { CalendarEvent } from '@/types/calendar'

// ── 時間常數 ──────────────────────────────────────
export const dayStartHour = 7
export const dayEndHour = 22
export const dayStartMinutes = dayStartHour * 60
export const dayEndMinutes = dayEndHour * 60
export const slotMinutes = 30
export const slotHeight = 24 // px per slot

// ── 格式化 ────────────────────────────────────────
export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${pad(h)}:${pad(m)}`
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

export function formatInputDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseISO(iso: string): Date {
  return new Date(iso)
}

export function buildISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`
}

// ── 日期比較 ──────────────────────────────────────
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

// ── 週 / 月 格格 ──────────────────────────────────
export function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function getMonthWeeks(anchor: Date): Date[][] {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(1 - startOffset)
  const weeks: Date[][] = []
  let cur = new Date(start)
  while (weeks.length < 6) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur.getMonth() !== month && weeks.length >= 4) break
  }
  return weeks
}

export function getMiniMonthGrid(anchor: Date): Date[] {
  return getMonthWeeks(anchor).flat()
}

export function getYearMonths(anchor: Date): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(anchor.getFullYear(), i, 1))
}

// ── 事件查詢 (空列表用) ───────────────────────────
export function getMonthCellEvents(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0)
  const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)
  return events.filter(e => {
    const start = parseISO(e.start)
    const end   = parseISO(e.end)
    return start <= dayEnd && end >= dayStart
  })
}

export function getAllDayEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter(e => e.allDay && isSameDay(parseISO(e.start), day))
}

// ── 日/週視圖 layout ──────────────────────────────
export interface EventLayout {
  event: CalendarEvent
  startMinutes: number
  endMinutes: number
  column: number
  totalColumns: number
}

export function layoutEvents(
  events: CalendarEvent[],
  day: Date,
  opts?: { excludeMultiDay?: boolean }
): EventLayout[] {
  const timed = events.filter(e => {
    if (e.allDay) return false
    const start = parseISO(e.start)
    if (!isSameDay(start, day)) return false
    if (opts?.excludeMultiDay) {
      const end = parseISO(e.end)
      if (!isSameDay(start, end)) return false
    }
    return true
  })

  const layouts: EventLayout[] = timed.map(e => {
    const start = parseISO(e.start)
    const end = parseISO(e.end)
    return {
      event: e,
      startMinutes: start.getHours() * 60 + start.getMinutes(),
      endMinutes: end.getHours() * 60 + end.getMinutes(),
      column: 0,
      totalColumns: 1,
    }
  })

  // simple column assignment
  for (let i = 0; i < layouts.length; i++) {
    const cols: number[] = []
    for (let j = 0; j < i; j++) {
      if (layouts[j].startMinutes < layouts[i].endMinutes &&
        layouts[j].endMinutes > layouts[i].startMinutes) {
        cols.push(layouts[j].column)
      }
    }
    let col = 0
    while (cols.includes(col)) col++
    layouts[i].column = col
  }
  const max = layouts.reduce((m, l) => Math.max(m, l.column + 1), 1)
  layouts.forEach(l => l.totalColumns = max)
  return layouts
}

export function eventBlockStyle(layout: EventLayout): Record<string, string> {
  const total = dayEndMinutes - dayStartMinutes
  const top = ((layout.startMinutes - dayStartMinutes) / total) * 100
  const height = ((layout.endMinutes - layout.startMinutes) / total) * 100
  const width = 100 / layout.totalColumns
  return {
    top: `${top}%`,
    height: `${Math.max(height, 2)}%`,
    left: `${layout.column * width}%`,
    width: `${width}%`,
  }
}

/**
 * 統一排版：整日事件與時段事件一起均分欄位
 * 整日事件以 dayStartMinutes ~ dayEndMinutes 全高計算
 */
export function layoutAllEvents(
  events: CalendarEvent[],
  day: Date,
): EventLayout[] {
  const dayEvents = events.filter(e => {
    const start = parseISO(e.start)
    return isSameDay(start, day)
  })

  const layouts: EventLayout[] = dayEvents.map(e => {
    if (e.allDay) {
      return {
        event: e,
        startMinutes: dayStartMinutes,
        endMinutes: dayEndMinutes,
        column: 0,
        totalColumns: 1,
      }
    }
    const start = parseISO(e.start)
    const end = parseISO(e.end)
    return {
      event: e,
      startMinutes: start.getHours() * 60 + start.getMinutes(),
      endMinutes: end.getHours() * 60 + end.getMinutes(),
      column: 0,
      totalColumns: 1,
    }
  })

  // column assignment (same greedy algorithm)
  for (let i = 0; i < layouts.length; i++) {
    const cols: number[] = []
    for (let j = 0; j < i; j++) {
      if (layouts[j].startMinutes < layouts[i].endMinutes &&
        layouts[j].endMinutes > layouts[i].startMinutes) {
        cols.push(layouts[j].column)
      }
    }
    let col = 0
    while (cols.includes(col)) col++
    layouts[i].column = col
  }
  const max = layouts.reduce((m, l) => Math.max(m, l.column + 1), 1)
  layouts.forEach(l => l.totalColumns = max)
  return layouts
}

export function minutesToOffset(minutes: number): number {
  return ((minutes - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) * 100
}

export function positionToMinutes(y: number, height: number): number {
  const ratio = Math.max(0, Math.min(1, y / height))
  const raw = dayStartMinutes + ratio * (dayEndMinutes - dayStartMinutes)
  return Math.round(raw / slotMinutes) * slotMinutes
}

// ── 週視圖 all-day rows ────────────────────────────
export interface AllDaySegment {
  event: CalendarEvent
  startIndex: number
  span: number
}

export function buildAllDayRows(
  events: CalendarEvent[],
  _firstDay: Date,
  weekDays: Date[]
): AllDaySegment[][] {
  const allDay = events.filter(e => e.allDay)
  const rows: AllDaySegment[][] = []
  for (const e of allDay) {
    const eStart = parseISO(e.start)
    const eEnd = parseISO(e.end)
    let startIndex = weekDays.findIndex(d => isSameDay(d, eStart))
    if (startIndex < 0) startIndex = 0
    let endIndex = -1
    for (let i = weekDays.length - 1; i >= 0; i -= 1) {
      if (weekDays[i] <= eEnd) {
        endIndex = i
        break
      }
    }
    if (endIndex < 0) endIndex = weekDays.length - 1
    const span = endIndex - startIndex + 1
    const seg: AllDaySegment = { event: e, startIndex, span }
    let placed = false
    for (const row of rows) {
      const overlap = row.some(s => s.startIndex < startIndex + span && s.startIndex + s.span > startIndex)
      if (!overlap) { row.push(seg); placed = true; break }
    }
    if (!placed) rows.push([seg])
  }
  return rows
}
