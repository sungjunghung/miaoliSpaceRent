<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCalendarState } from '@/composables/useCalendarState';
import { useEventTooltip } from '@/composables/useEventTooltip';
import type { CalendarEvent } from '@/types/calendar';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader.vue';
import DayView from '@/components/admin/calendar/DayView.vue';
import WeekView from '@/components/admin/calendar/WeekView.vue';
import MonthView from '@/components/admin/calendar/MonthView.vue';
import YearView from '@/components/admin/calendar/YearView.vue';
import BookingTooltip from '@/components/admin/calendar/BookingTooltip.vue';
import EventModal from '@/components/admin/calendar/EventModal.vue';
import mockBookings from '@/mocks/generateBookings';
import mockVenues from '@/mocks/venues.json';
import mockCalendarNotes from '@/mocks/calendarNotes.json';

const route = useRoute();
const router = useRouter();
const venueId = Number(route.query.id) || undefined;
const calendar = useCalendarState(venueId);
provide('calendar', calendar);

const eventTooltip = useEventTooltip();
provide('eventTooltip', eventTooltip);

const eventModalRef = ref<InstanceType<typeof EventModal> | null>(null);
let noteIdCounter = 1000;

function handleEventClick(event: CalendarEvent) {
  // 註記事件 → 打開編輯 modal
  if (event.id.startsWith('note-')) {
    eventModalRef.value?.openEditEventModal(event);
    return;
  }
  // 時段保留事件 → 打開編輯 modal
  if (event.id.startsWith('blocked-')) {
    eventModalRef.value?.openEditEventModal(event);
    return;
  }
  // 預約事件 → 跳轉詳情
  const match = event.id.match(/^booking-(\d+)$/);
  if (match) {
    router.push({ name: 'admin-booking-detail', params: { id: match[1] } });
  }
}

function handleCreateEvent(date: Date, startMinutes?: number, endMinutes?: number) {
  eventModalRef.value?.openNewEventModal(date, startMinutes, endMinutes, 'note');
}

function handleCreateBlocked(date: Date, startMinutes?: number, endMinutes?: number) {
  eventModalRef.value?.openNewEventModal(date, startMinutes, endMinutes, 'blocked');
}

function handleSaveNote(payload: Omit<CalendarEvent, 'id'> & { id?: string }) {
  const events = calendar.events.value ?? [];
  const isBlocked = payload.type === 'blocked';
  if (payload.id) {
    // 編輯現有
    const idx = events.findIndex(e => e.id === payload.id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...payload, id: payload.id };
      calendar.events.value = [...events];
    }
  } else {
    // 新增
    const prefix = isBlocked ? 'blocked' : 'note';
    const newEvent: CalendarEvent = {
      ...payload,
      id: `${prefix}-${++noteIdCounter}`,
      type: payload.type,
    };
    calendar.events.value = [...events, newEvent];
  }
}

function handleDeleteNote(id: string) {
  calendar.events.value = (calendar.events.value ?? []).filter(e => e.id !== id);
}

// ── 產生初始 events ───────────────────────────────
const SESSION_TIME: Record<string, [string, string]> = {
  morning: ['08:00', '12:00'],
  afternoon: ['13:00', '17:00'],
  evening: ['18:00', '22:00'],
}

function buildEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // 1. 預約（全部載入，由 selectedVenueIds 過濾）
  for (const b of mockBookings) {
    const raw = b as any
    const status: string = raw.status ?? 'confirmed'
    const type: CalendarEvent['type'] = status === 'confirmed' || status === 'completed' || status === 'payment_review' ? 'rented' : 'unavailable'

    let start: string
    let end: string
    let allDay = false

    if (b.rentalMode === 'daily') {
      const s = b.startDate ?? b.date
      const e = b.endDate ?? b.date
      start = `${s}T00:00:00`
      end = `${e}T23:59:00`
      allDay = true
    } else if (b.rentalMode === 'session' && b.session) {
      const [sh, eh] = SESSION_TIME[b.session] ?? ['08:00', '12:00']
      start = `${b.date}T${sh}:00`
      end = `${b.date}T${eh}:00`
    } else if (b.rentalMode === 'hourly' && b.startTime && b.endTime) {
      start = `${b.date}T${b.startTime}:00`
      end = `${b.date}T${b.endTime}:00`
    } else {
      start = `${b.date}T00:00:00`
      end = `${b.date}T23:59:00`
      allDay = true
    }

    const matchedVenue = mockVenues.find(v => v.id === b.venueId)
    events.push({
      id: `booking-${b.id}`,
      title: `${b.applicant} · ${matchedVenue?.name ?? ''}`,
      type,
      start,
      end,
      allDay,
      description: b.purpose ?? '',
      metadata: {
        bookingId: b.id,
        venueId: b.venueId,
        applicant: b.applicant,
        purpose: b.purpose,
        status,
        rentalMode: b.rentalMode,
        session: b.session,
        venueName: matchedVenue?.name ?? '',
        date: b.date,
        startDate: b.startDate,
        endDate: b.endDate,
        startTime: b.startTime,
        endTime: b.endTime,
        createdAt: (b as any).createdAt,
      },
    })
  }

  // 2. 休館日 & 固定休館星期 — 所有場館
  const today = new Date()
  const threeMonths = new Date(today)
  threeMonths.setMonth(threeMonths.getMonth() + 3)

  for (const venue of mockVenues) {
    // 休館日（closedDates）
    for (const date of (venue.closedDates ?? [])) {
      events.push({
        id: `closed-${venue.id}-${date}`,
        title: `休館日 · ${venue.name}`,
        type: 'closed',
        start: `${date}T00:00:00`,
        end: `${date}T23:59:00`,
        allDay: true,
        metadata: { venueId: venue.id, isRecurringClosed: false },
      })
    }

    // 固定休館星期（closedWeekdays）
    const closedWeekdays: number[] = (venue as any).closedWeekdays ?? []
    if (closedWeekdays.length) {
      const cur = new Date(today)
      cur.setDate(1)
      while (cur <= threeMonths) {
        if (closedWeekdays.includes(cur.getDay())) {
          const ds = cur.toISOString().slice(0, 10)
          const closedId = `weekday-closed-${venue.id}-${ds}`
          if (!events.find(e => e.id === closedId)) {
            events.push({
              id: closedId,
              title: `例行休館 · ${venue.name}`,
              type: 'closed',
              start: `${ds}T00:00:00`,
              end: `${ds}T23:59:00`,
              allDay: true,
              metadata: { venueId: venue.id, isRecurringClosed: true },
            })
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    }
  }

  // 3. 管理員註記 & 時段保留（calendarNotes）— 全部載入
  for (const n of mockCalendarNotes) {
    let start: string
    let end: string
    let allDay = false

    if (n.allDay || !n.startTime || !n.endTime) {
      start = `${n.date}T00:00:00`
      end = `${n.date}T23:59:00`
      allDay = true
    } else {
      start = `${n.date}T${n.startTime}:00`
      end = `${n.date}T${n.endTime}:00`
    }

    const isBlocked = (n as any).type === 'blocked'
    const prefix = isBlocked ? 'blocked' : 'note'

    events.push({
      id: `${prefix}-${n.id}`,
      title: n.title,
      type: isBlocked ? 'blocked' : 'note',
      start,
      end,
      allDay,
      description: n.description ?? '',
      metadata: isBlocked ? { venueId: n.venueId } : undefined,
    })
  }

  return events
}

onMounted(() => {
  calendar.initialize()
  calendar.events.value = buildEvents()
  // 從 query param 設定初始場館選取
  if (venueId) {
    calendar.selectedVenueIds.value = new Set([venueId])
  }
});
onBeforeUnmount(() => { calendar.cleanup(); });
</script>

<template>


  <CalendarHeader @add-note="handleCreateEvent(calendar.anchorDate.value ?? new Date())" @add-blocked="handleCreateBlocked(calendar.anchorDate.value ?? new Date())" />
  <div class="bg-base-100 p-4 rounded-box shadow-sm mb-2">
    <div v-if="calendar.viewMode.value === 'month'">
      <MonthView @event-click="handleEventClick" @create-event="(date: Date) => handleCreateEvent(date)" />
    </div>

    <div v-else-if="calendar.viewMode.value === 'week'">
      <WeekView @event-click="handleEventClick"
        @create-event="(date: Date, s: number, e: number) => handleCreateEvent(date, s, e)" />
    </div>

    <div v-else-if="calendar.viewMode.value === 'day'">
      <DayView @event-click="handleEventClick"
        @create-event="(date: Date, s: number, e: number) => handleCreateEvent(date, s, e)" />
    </div>

    <div v-else>
      <YearView />
    </div>
  </div>


  <BookingTooltip />
  <EventModal ref="eventModalRef" :venue-id="venueId ?? null" @save="handleSaveNote" @delete="handleDeleteNote" />

</template>
