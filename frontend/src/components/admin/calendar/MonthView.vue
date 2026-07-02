<script setup lang="ts">
import { inject } from 'vue';
import type { CalendarEvent } from '@/types/calendar';
import type { CalendarState } from '@/composables/useCalendarState';
import type { EventTooltipState } from '@/composables/useEventTooltip';
import { isSameMonth, isSameDay, getMonthCellEvents } from '@/utils/calendar';

function getEventColor(type: 'rented' | 'unavailable' | 'closed' | 'maintenance' | 'note' | 'blocked', event?: CalendarEvent): string {
  switch (type) {
    case 'rented':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'unavailable':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'closed':
      // 區分三種 closed 類型
      if (event?.metadata?.overrideType === 'open') {
        return 'bg-green-50 text-green-700 border-green-200'; // 開館覆寫
      } else if (event?.metadata?.overrideType === 'closed') {
        return 'bg-red-100 text-red-800 border-red-300'; // 閉館覆寫（深色）
      } else if (event?.metadata?.isRecurringClosed) {
        return 'bg-red-50 text-red-800 border-red-200'; // OpeningHours 休館日（淺色）
      }
      return 'bg-red-50 text-red-700 border-red-200';
    case 'maintenance':
      return 'text-red-800 border-red-300'; // 不可租借時段（紅色）
    case 'note':
      return 'bg-info/10 text-info border-info/30';
    case 'blocked':
      return 'bg-warning/10 text-warning border-warning/30';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  createEvent: [date: Date];
}>();

const calendar = inject<CalendarState>('calendar')!;
const eventTooltip = inject<EventTooltipState>('eventTooltip')!;

const weekDayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

function isWeekend(day: Date): boolean {
  const dayOfWeek = day.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = 週日, 6 = 週六
}

function getDayBackgroundClass(day: Date): string {
  const dayEvents = getMonthCellEvents(calendar.filteredEvents.value ?? [], day);
  const allDayEvent = dayEvents.find(event => event.allDay);

  if (allDayEvent) {
    if (allDayEvent.type === 'rented') {
      return 'bg-orange-50';
    } else if (allDayEvent.type === 'unavailable') {
      return 'bg-base-200';
    } else if (allDayEvent.type === 'closed') {
      // 開館覆寫使用正常背景色（不改變）
      if (allDayEvent.metadata?.overrideType === 'open') {
        return isWeekend(day) ? 'bg-base-200/50' : '';
      }
      return 'bg-red-50';
    }
  }

  // 如果沒有全天事件，週末顯示淺灰色背景
  if (isWeekend(day)) {
    return 'bg-base-200/50';
  }

  return '';
}
</script>

<template>
  <div class="grid grid-cols-7 text-sm text-base-content/60">
    <div v-for="label in weekDayLabels" :key="label" class="px-2 py-2 font-medium">
      {{ label }}
    </div>
  </div>
  <div class="border border-base-300 overflow-hidden">
    <div v-for="(week, weekIndex) in calendar.monthWeeks.value" :key="`week-${weekIndex}`"
      class="grid grid-cols-7 border-b border-base-300 last:border-b-0">
      <button v-for="day in week" :key="day.toISOString()"
        class="border border-base-200 p-2 min-h-30 text-left transition flex flex-col bg-base-100"
        :class="[getDayBackgroundClass(day) || 'hover:bg-base-200']" @click="calendar.handleDayClick(day)"
        @dblclick.stop="emit('createEvent', day)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold" :class="{
            'text-base-content/40': !isSameMonth(day, calendar.anchorDate.value ?? new Date()),
            'text-primary': isSameDay(day, new Date()),
          }">
            {{ day.getDate() }}
          </span>
          <span v-if="isSameDay(day, new Date())" class="badge badge-primary badge-xs">
            今日
          </span>
        </div>
        <div class="space-y-1 flex-1">
          <ol class="space-y-0.5">
            <li v-for="eventItem in getMonthCellEvents(calendar.filteredEvents.value ?? [], day).slice(0, 3)"
              :key="eventItem.id"
              class="text-xs rounded px-1.5 py-0.5 border truncate block cursor-pointer hover:brightness-95"
              :class="getEventColor(eventItem.type, eventItem)" data-event-block="true"
              @click.stop="emit('eventClick', eventItem)"
              @mouseenter="eventTooltip.show(eventItem, $event.clientX, $event.clientY)"
              @mousemove="eventTooltip.move($event.clientX, $event.clientY)" @mouseleave="eventTooltip.hide()">
              {{ eventItem.title }}
            </li>
            <li v-if="getMonthCellEvents(calendar.filteredEvents.value ?? [], day).length > 3"
              class="text-xs text-base-content/50 px-1">
              +{{ getMonthCellEvents(calendar.filteredEvents.value ?? [], day).length - 3 }} 項
            </li>
          </ol>
        </div>
      </button>
    </div>
  </div>

</template>
