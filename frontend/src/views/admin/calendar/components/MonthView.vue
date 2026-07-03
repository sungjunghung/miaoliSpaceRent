<script setup lang="ts">
import { inject } from 'vue';
import type { CalendarEvent } from '@/types/calendar';
import type { CalendarState } from '@/composables/useCalendarState';
import type { EventTooltipState } from '@/composables/useEventTooltip';
import { isSameMonth, isSameDay, getMonthCellEvents, getEventColor } from '@/utils/calendar';

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
  // 格子背景僅以週末淺灰底標示；事件顏色改由格子內的事件條呈現，不套用於整格
  if (isWeekend(day)) {
    return 'bg-base-200/50';
  }
  return '';
}

function getGovernmentHolidayLabel(day: Date): string {
  const holiday = (calendar.filteredEvents.value ?? []).find(
    (eventItem) => eventItem.metadata?.isGovernmentHoliday && isSameDay(new Date(eventItem.start), day),
  );
  return holiday?.metadata?.holidayName ?? '';
}

function getVisibleEvents(day: Date): CalendarEvent[] {
  return getMonthCellEvents(calendar.filteredEvents.value ?? [], day).filter(
    (eventItem) => !eventItem.metadata?.isGovernmentHoliday,
  );
}
</script>

<template>
  <div class="grid grid-cols-7 mb-1 gap-0.5">
    <div v-for="label in weekDayLabels" :key="label" class="text-sm font-semibold border border-base-300 rounded-box bg-base-200 p-2 text-end">
      {{ label }}
    </div>
  </div>
  <div class="overflow-hidden space-y-0.5">
    <div v-for="(week, weekIndex) in calendar.monthWeeks.value" :key="`week-${weekIndex}`"
      class="grid grid-cols-7 gap-0.5">
      <button v-for="day in week" :key="day.toISOString()"
        class="basis-box p-2 min-h-30 text-left transition flex flex-col bg-base-100"
        :class="[getDayBackgroundClass(day) || 'hover:bg-base-200']" @click="calendar.handleDayClick(day)"
        @dblclick.stop="emit('createEvent', day)">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center justify-between w-full gap-1 ">
            <span class="text-sm font-semibold" :class="{
              'text-base-content/40': !isSameMonth(day, calendar.anchorDate.value ?? new Date()),
              'text-primary': isSameDay(day, new Date()),
            }">
              {{ day.getDate() }}
            </span>
            <span v-if="getGovernmentHolidayLabel(day)" class="text-[11px] text-error truncate">
              {{ getGovernmentHolidayLabel(day) }}
            </span>
            <span v-if="isSameDay(day, new Date())" class="badge badge-primary badge-xs">
              今日
            </span>
          </div>
        </div>
        <div class="space-y-1 flex-1">
          <ol class="space-y-0.5">
            <li v-for="eventItem in getVisibleEvents(day).slice(0, 3)"
              :key="eventItem.id"
              class="text-xs rounded px-1.5 py-0.5 border truncate block cursor-pointer hover:brightness-95"
              :class="getEventColor(eventItem)" data-event-block="true"
              @click.stop="emit('eventClick', eventItem)"
              @mouseenter="eventTooltip.show(eventItem, $event.clientX, $event.clientY)"
              @mousemove="eventTooltip.move($event.clientX, $event.clientY)" @mouseleave="eventTooltip.hide()">
              {{ eventItem.title }}
            </li>
            <li v-if="getVisibleEvents(day).length > 3"
              class="text-xs text-base-content/50 px-1">
              +{{ getVisibleEvents(day).length - 3 }} 項
            </li>
          </ol>
        </div>
      </button>
    </div>
  </div>

</template>
