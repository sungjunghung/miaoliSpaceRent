import { computed, ref, type Ref, type ComputedRef } from 'vue'
import type { CalendarEvent } from '@/types/calendar'
import {
  getWeekDays,
  getMonthWeeks,
  getYearMonths,
  pad,
} from '@/utils/calendar'

export type ViewMode = 'day' | 'week' | 'month' | 'year'

export interface CalendarState {
  viewMode: Ref<ViewMode>
  anchorDate: Ref<Date>
  now: Ref<Date>
  events: Ref<CalendarEvent[]>
  filteredEvents: ComputedRef<CalendarEvent[]>
  selectedVenueIds: Ref<Set<number> | null>
  selectedEventTypes: Ref<Set<string> | null>
  weekDays: ComputedRef<Date[]>
  monthWeeks: ComputedRef<Date[][]>
  yearMonths: ComputedRef<Date[]>
  periodTitle: ComputedRef<string>
  setViewMode: (mode: ViewMode) => void
  goNext: () => void
  goPrevious: () => void
  goToday: () => void
  handleDayClick: (day: Date) => void
  handleMonthClick: (month: Date) => void
  initialize: () => void
  cleanup: () => void
}

export function useCalendarState(_venueId?: number): CalendarState {
  const viewMode = ref<ViewMode>('month')
  const anchorDate = ref(new Date())
  const now = ref(new Date())
  const events = ref<CalendarEvent[]>([])
  // null = 顯示全部；空 Set = 全部隱藏；有 ID = 只顯示指定場館
  const selectedVenueIds = ref<Set<number> | null>(null)
  // null = 顯示全部類型；有值 = 只顯示指定事件類型（rented/unavailable/closed/note/blocked）
  const selectedEventTypes = ref<Set<string> | null>(null)

  const filteredEvents = computed<CalendarEvent[]>(() => {
    let result = events.value ?? []

    // 場館過濾
    if (selectedVenueIds.value !== null) {
      const ids = selectedVenueIds.value
      if (ids.size === 0) {
        result = result.filter(e => e.metadata?.venueId == null)
      } else {
        result = result.filter(e => {
          const vid = e.metadata?.venueId
          if (vid == null) return true  // global notes / closed days — always show
          return ids.has(vid)
        })
      }
    }

    // 事件類型過濾
    if (selectedEventTypes.value !== null) {
      const types = selectedEventTypes.value
      result = result.filter(e => types.has(e.type))
    }

    return result
  })

  let timer: ReturnType<typeof setInterval> | null = null

  const weekDays = computed(() => getWeekDays(anchorDate.value))
  const monthWeeks = computed(() => getMonthWeeks(anchorDate.value))
  const yearMonths = computed(() => getYearMonths(anchorDate.value))

  const periodTitle = computed(() => {
    const d = anchorDate.value
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    if (viewMode.value === 'year') return `${y} 年`
    if (viewMode.value === 'month') return `${y} 年 ${m} 月`
    if (viewMode.value === 'week') {
      const days = weekDays.value
      const first = days[0]
      const last = days[6]
      return `${first.getFullYear()}/${pad(first.getMonth() + 1)}/${pad(first.getDate())} – ${pad(last.getMonth() + 1)}/${pad(last.getDate())}`
    }
    return `${y}/${m}/${pad(d.getDate())}`
  })

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  function goNext() {
    const d = new Date(anchorDate.value)
    if (viewMode.value === 'day') d.setDate(d.getDate() + 1)
    else if (viewMode.value === 'week') d.setDate(d.getDate() + 7)
    else if (viewMode.value === 'month') d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    anchorDate.value = d
  }

  function goPrevious() {
    const d = new Date(anchorDate.value)
    if (viewMode.value === 'day') d.setDate(d.getDate() - 1)
    else if (viewMode.value === 'week') d.setDate(d.getDate() - 7)
    else if (viewMode.value === 'month') d.setMonth(d.getMonth() - 1)
    else d.setFullYear(d.getFullYear() - 1)
    anchorDate.value = d
  }

  function goToday() {
    anchorDate.value = new Date()
  }

  function handleDayClick(day: Date) {
    anchorDate.value = day
    viewMode.value = 'day'
  }

  function handleMonthClick(month: Date) {
    anchorDate.value = month
    viewMode.value = 'month'
  }

  function initialize() {
    timer = setInterval(() => { now.value = new Date() }, 60000)
  }

  function cleanup() {
    if (timer) clearInterval(timer)
  }

  return {
    viewMode,
    anchorDate,
    now,
    events,
    filteredEvents,
    selectedVenueIds,
    selectedEventTypes,
    weekDays,
    monthWeeks,
    yearMonths,
    periodTitle,
    setViewMode,
    goNext,
    goPrevious,
    goToday,
    handleDayClick,
    handleMonthClick,
    initialize,
    cleanup,
  }
}
