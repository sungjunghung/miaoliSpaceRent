<script setup lang="ts">
/**
 * 場館行事曆（後台）
 *
 * 跨場館的整合行事曆，可選擇性地用網址 query（?id=場館ID）聚焦單一場館。
 * 三類事件由 mock 資料組合而成（見 buildEvents）：
 *   1. 預約（bookings）      → 點擊以側邊 drawer 展開詳情
 *   2. 休館日／例行休館       → 唯讀顯示
 *   3. 管理員註記／時段保留    → 點擊開啟 EventModal 編輯
 * 檢視模式（日／週／月／年）與所選場館由 useCalendarState 管理並 provide 給子元件。
 */
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCalendarState } from '@/composables/useCalendarState';
import { useEventTooltip } from '@/composables/useEventTooltip';
import { useBookingsStore } from '@/stores/bookings';
import { formatBookingDate } from '@/composables/useBookingFormat';
import type { CalendarEvent } from '@/types/calendar';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader.vue';
import DayView from '@/components/admin/calendar/DayView.vue';
import WeekView from '@/components/admin/calendar/WeekView.vue';
import MonthView from '@/components/admin/calendar/MonthView.vue';
import YearView from '@/components/admin/calendar/YearView.vue';
import BookingTooltip from '@/components/admin/calendar/BookingTooltip.vue';
import EventModal from '@/components/admin/calendar/EventModal.vue';
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue';
import BookingDetailContent from './bookings/components/BookingDetailContent.vue';
import mockBookings from '@/mocks/generateBookings';
import mockVenues from '@/mocks/venues.json';
import mockCalendarNotes from '@/mocks/calendarNotes.json';

// 網址帶 ?id=場館ID 時，行事曆初始聚焦該場館；否則顯示全部
const route = useRoute();
const venueId = Number(route.query.id) || undefined;
const calendar = useCalendarState(venueId);
provide('calendar', calendar);

// 預約詳情側邊 drawer：點擊預約事件時開啟，顯示對應 booking
const bookingsStore = useBookingsStore();
const selectedBookingId = ref<number | null>(null);
const selectedBooking = computed(() =>
  selectedBookingId.value ? bookingsStore.getById(selectedBookingId.value) : null
);

function closeBookingDrawer() {
  selectedBookingId.value = null;
}

// 事件 hover 提示（供子檢視元件注入使用）
const eventTooltip = useEventTooltip();
provide('eventTooltip', eventTooltip);

// 註記／時段保留的新增與編輯 modal；noteIdCounter 為前台原型的臨時流水號
const eventModalRef = ref<InstanceType<typeof EventModal> | null>(null);
let noteIdCounter = 1000;

// 依事件 id 前綴分派點擊行為：note-／blocked- 開 modal 編輯，booking- 開側邊詳情
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
  // 預約事件 → 側邊展開詳情
  const match = event.id.match(/^booking-(\d+)$/);
  if (match) {
    selectedBookingId.value = Number(match[1]);
  }
}

// 於指定日期／時間區間開啟「新增註記」modal
function handleCreateEvent(date: Date, startMinutes?: number, endMinutes?: number) {
  eventModalRef.value?.openNewEventModal(date, startMinutes, endMinutes, 'note');
}

// 於指定日期／時間區間開啟「新增時段保留」modal
function handleCreateBlocked(date: Date, startMinutes?: number, endMinutes?: number) {
  eventModalRef.value?.openNewEventModal(date, startMinutes, endMinutes, 'blocked');
}

// modal 儲存回呼：有 id 則更新既有事件，否則新增（依 type 決定 blocked/note 前綴）
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

// modal 刪除回呼：由事件陣列中移除該筆
function handleDeleteNote(id: string) {
  calendar.events.value = (calendar.events.value ?? []).filter(e => e.id !== id);
}

// ── 產生初始 events：把三類 mock 資料組成統一的 CalendarEvent 陣列 ───────────────────────────────
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
    // 僅「確認已租借」（預訂成功／已使用）標為 rented；其餘皆為 unavailable（預約處理中）
    const type: CalendarEvent['type'] = status === 'confirmed' || status === 'completed' ? 'rented' : 'unavailable'

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

// 事件顏色圖例（對應各檢視元件的 getEventColor / getEventLabel）
const EVENT_LEGEND = [
  { label: '已租借', swatch: 'bg-orange-50 border-orange-200' },
  { label: '預約處理中', swatch: 'bg-slate-100 border-slate-200' },
  { label: '休館日', swatch: 'bg-red-50 border-red-200' },
  { label: '註記', swatch: 'bg-info/10 border-info/30' },
  { label: '時段保留', swatch: 'bg-warning/10 border-warning/30' },
];

// 掛載時初始化行事曆狀態並載入事件；卸載時清理（移除監聽等）
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

  <!-- 表頭：檢視模式切換、日期導覽、場館篩選、新增註記／時段保留 -->
  <CalendarHeader @add-note="handleCreateEvent(calendar.anchorDate.value ?? new Date())" @add-blocked="handleCreateBlocked(calendar.anchorDate.value ?? new Date())" />



  <!-- 依當前檢視模式切換對應的行事曆視圖 -->
  <div class="p-4">
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
  
  <!-- 顏色圖例：說明各事件狀態的顏色意義（年曆不顯示） -->
  <div v-if="calendar.viewMode.value !== 'year'" class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-1 text-sm">
    <span v-for="item in EVENT_LEGEND" :key="item.label" class="inline-flex items-center gap-1.5">
      <span class="inline-block w-3.5 h-3.5 rounded border" :class="item.swatch"></span>
      {{ item.label }}
    </span>
  </div>
  <!-- 事件 hover 提示 -->
  <BookingTooltip />

  <!-- 新增／編輯註記與時段保留的 modal -->
  <EventModal ref="eventModalRef" :venue-id="venueId ?? null" @save="handleSaveNote" @delete="handleDeleteNote" />

  <!-- 點擊預約事件時展開的側邊詳情；「開啟頁面」可跳轉至完整預約頁 -->
  <AdminSlideDrawer
    v-if="selectedBooking"
    eyebrow="預約詳情"
    :title="`${selectedBooking.reservationId} ${selectedBooking.venueName}`"
    :subtitle="`${selectedBooking.applicant}｜${formatBookingDate(selectedBooking, true)}`"
    :open-to="{ name: 'admin-booking-detail', params: { id: selectedBooking.id } }"
    aria-label="關閉預約詳情"
    @close="closeBookingDrawer"
  >
    <BookingDetailContent :booking="selectedBooking" />
  </AdminSlideDrawer>

</template>
