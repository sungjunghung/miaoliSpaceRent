import mockCalendarNotes from '@/mocks/calendarNotes.json'

export type CalendarNote = (typeof mockCalendarNotes)[number]

export const calendarNotes = mockCalendarNotes
