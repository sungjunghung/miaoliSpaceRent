<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type { CalendarEvent, DragState } from '@/types/calendar';
import type { CalendarState } from '@/composables/useCalendarState';
import type { EventTooltipState } from '@/composables/useEventTooltip';
import MiniCalendar from './MiniCalendar.vue';
import {
  dayStartMinutes,
  slotMinutes,
  dayEndMinutes,
  slotHeight,
  dayStartHour,
  dayEndHour,
  formatTime,
  pad,
  layoutAllEvents,
  eventBlockStyle,
  positionToMinutes,
  minutesToOffset,
  isSameDay,
} from '@/utils/calendar';

function getEventColor(type: 'rented' | 'unavailable' | 'closed' | 'maintenance' | 'note' | 'blocked'): string {
  switch (type) {
    case 'rented':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'unavailable':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'closed':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'maintenance':
      return 'bg-stone-100 text-stone-700 border-stone-200';
    case 'note':
      return 'bg-info/10 text-info border-info/30';
    case 'blocked':
      return 'bg-warning/10 text-warning border-warning/30';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  createEvent: [date: Date, startMinutes: number, endMinutes: number];
}>();

const calendar = inject<CalendarState>('calendar')!;
const eventTooltip = inject<EventTooltipState>('eventTooltip')!;

const dragState = ref<DragState>({
  active: false,
  date: null,
  startMinutes: dayStartMinutes,
  endMinutes: dayStartMinutes + slotMinutes,
  columnRect: null,
});

const timeSlots = computed(() => {
  const slots: number[] = [];
  for (let minutes = dayStartMinutes; minutes < dayEndMinutes; minutes += slotMinutes) {
    slots.push(minutes);
  }
  return slots;
});

const timeLabels = computed(() => {
  const labels: number[] = [];
  for (let hour = dayStartHour; hour < dayEndHour; hour += 1) {
    labels.push(hour * 60);
  }
  return labels;
});

const gridHeight = computed(() => {
  const slotCount = (dayEndMinutes - dayStartMinutes) / slotMinutes;
  return slotCount * slotHeight;
});

const nowIndicatorTop = computed(() => {
  const now = calendar.now.value ?? new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < dayStartMinutes || minutes > dayEndMinutes) return null;
  return minutesToOffset(minutes);
});


function getUnifiedLayouts(day: Date) {
  return layoutAllEvents(calendar.filteredEvents.value ?? [], day);
}

function startDrag(date: Date, event: PointerEvent) {
  if ((event.target as HTMLElement).closest('[data-event-block="true"]')) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const minutes = positionToMinutes(y, rect.height);
  dragState.value = {
    active: true,
    date,
    startMinutes: minutes,
    endMinutes: minutes + slotMinutes,
    columnRect: rect,
  };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
}

function onDragMove(event: PointerEvent) {
  if (!dragState.value.active || !dragState.value.columnRect) return;
  const rect = dragState.value.columnRect;
  const y = event.clientY - rect.top;
  const minutes = positionToMinutes(y, rect.height);
  dragState.value.endMinutes = minutes;
}

function onDragEnd() {
  if (!dragState.value.active || !dragState.value.date) return;
  const startMinutes = Math.min(dragState.value.startMinutes, dragState.value.endMinutes);
  let endMinutes = Math.max(dragState.value.startMinutes, dragState.value.endMinutes);
  if (endMinutes - startMinutes < slotMinutes) {
    endMinutes = startMinutes + slotMinutes;
  }
  const date = new Date(dragState.value.date);
  dragState.value.active = false;
  dragState.value.date = null;
  dragState.value.columnRect = null;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  emit('createEvent', date, startMinutes, endMinutes);
}

function selectionStyle(date: Date) {
  if (!dragState.value.active || !dragState.value.date) return {};
  if (!isSameDay(date, dragState.value.date)) return {};
  const start = Math.min(dragState.value.startMinutes, dragState.value.endMinutes);
  const end = Math.max(dragState.value.startMinutes, dragState.value.endMinutes);
  const top = ((start - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) * 100;
  const height = ((end - start) / (dayEndMinutes - dayStartMinutes)) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
}

</script>

<template>
  <div class="flex items-start gap-4">


    <div class="grid grid-cols-[50px_1fr] gap-2 flex-1">
      <div></div>
      <div class="grid grid-cols-7 gap-2">
        <div v-for="day in calendar.weekDays.value" :key="day.toISOString()"
          class="px-2 py-2 text-sm font-semibold border border-base-300 rounded-lg bg-base-200">
          {{ pad(day.getMonth() + 1) }}/{{ pad(day.getDate()) }}（{{ WEEKDAY_LABELS[day.getDay()] }}）
        </div>
      </div>
      <div class="text-xs text-base-content/50">
        <div v-for="label in timeLabels" :key="label" class="flex items-start"
          :style="{ height: `${slotHeight * 2}px` }">
          {{ formatTime(label) }}
        </div>
      </div>
      <div class="bg-base-100">
        <!-- 時間軸（整日 + 時段共存） -->
        <div class="relative grid grid-cols-7 gap-2">
          <div v-if="nowIndicatorTop !== null"
            class="absolute left-0 right-0 z-10 border-t-2 border-dashed border-red-400/60 pointer-events-none"
            :style="{ top: `${nowIndicatorTop}%` }"></div>
          <div v-for="day in calendar.weekDays.value" :key="day.toISOString()"
            class="border border-base-300 rounded-lg overflow-hidden">
            <div class="relative bg-base-100" :style="{ height: `${gridHeight}px` }"
              @pointerdown="startDrag(day, $event)">
              <div class="absolute inset-0">
                <div v-for="slot in timeSlots" :key="slot"
                  :class="slot % 60 === 0 ? 'border-t border-base-300' : 'border-t border-base-200'"
                  :style="{ height: `${slotHeight}px` }"></div>
              </div>
              <div class="absolute left-0 right-0 bg-primary/20" :style="selectionStyle(day)"></div>
              <!-- 所有事件統一排版 -->
              <div v-for="layout in getUnifiedLayouts(day)" :key="layout.event.id" class="absolute p-0.5"
                :style="eventBlockStyle(layout)">
                <button
                  class="w-full h-full text-left text-xs rounded border px-1 py-0.5 shadow-sm hover:shadow overflow-hidden"
                  :class="[getEventColor(layout.event.type), { '[writing-mode:vertical-lr]': layout.totalColumns >= 3 }]"
                  data-event-block="true" @click.stop="emit('eventClick', layout.event)"
                  @mouseenter="eventTooltip.show(layout.event, $event.clientX, $event.clientY)"
                  @mousemove="eventTooltip.move($event.clientX, $event.clientY)" @mouseleave="eventTooltip.hide()">
                  <div class="font-semibold truncate">{{ layout.event.title }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <MiniCalendar mode="week" />
  </div>
</template>
