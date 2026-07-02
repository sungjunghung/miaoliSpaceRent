import { ref } from 'vue'
import type { CalendarEvent } from '@/types/calendar'

export function useEventTooltip() {
  const visible = ref(false)
  const activeEvent = ref<CalendarEvent | null>(null)
  const x = ref(0)
  const y = ref(0)

  function show(event: CalendarEvent, clientX: number, clientY: number) {
    if (!event.id.startsWith('booking-')) return
    activeEvent.value = event
    x.value = clientX
    y.value = clientY
    visible.value = true
  }

  function hide() {
    visible.value = false
    activeEvent.value = null
  }

  function move(clientX: number, clientY: number) {
    x.value = clientX
    y.value = clientY
  }

  return { visible, activeEvent, x, y, show, hide, move }
}

export type EventTooltipState = ReturnType<typeof useEventTooltip>
