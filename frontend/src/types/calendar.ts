export type EventType = 'rented' | 'unavailable' | 'closed' | 'maintenance' | 'note' | 'blocked'

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  start: string
  end: string
  allDay: boolean
  description?: string
  location?: string
  metadata?: Record<string, any>
}

export interface DragState {
  active: boolean
  date: Date | null
  startMinutes: number
  endMinutes: number
  columnRect: DOMRect | null
}
