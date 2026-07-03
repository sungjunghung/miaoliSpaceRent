<script setup lang="ts">
import { inject } from 'vue';
import type { CalendarState } from '@/composables/useCalendarState';
import type { CalendarEvent } from '@/types/calendar';
import { isSameMonth, isSameDay, getMiniMonthGrid, pad } from '@/utils/calendar';

const calendar = inject<CalendarState>('calendar')!;
const weekDayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

function isSingleDayEvent(e: CalendarEvent): boolean {
  return isSameDay(new Date(e.start), new Date(e.end));
}

function hasEvents(day: Date): boolean {
  return (calendar.filteredEvents.value ?? []).some(e => isSingleDayEvent(e) && isSameDay(new Date(e.start), day));
}

function getDayEvents(day: Date) {
  return (calendar.filteredEvents.value ?? []).filter(e => isSingleDayEvent(e) && isSameDay(new Date(e.start), day));
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getEventVenue(e: CalendarEvent): string {
  return e.location ?? e.metadata?.venueName ?? e.metadata?.venueLabel ?? '未指定場館';
}

function isWeekend(day: Date): boolean {
  const weekDay = day.getDay();
  return weekDay === 0 || weekDay === 6;
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1">
    <div v-for="month in calendar.yearMonths.value" :key="month.toISOString()"
      class="basis-box py-4"
      @click="calendar.handleMonthClick(month)">
      <div class="text-sm font-semibold mb-3 text-primary text-center">{{ month.getFullYear() }} / {{ pad(month.getMonth() + 1) }}</div>
      <div class="grid grid-cols-7 text-sm">
        <span v-for="label in weekDayLabels" :key="label" class="text-center">{{ label.slice(1) }}</span>
      </div>
      <div class="grid grid-cols-7 mt-1">
        <div v-for="day in getMiniMonthGrid(month)" :key="day.toISOString()"
          class="relative text-center py-0.5 rounded flex flex-col items-center group" >
          <template v-if="isSameMonth(day, month)">
            <span class=" w-7 h-7 aspect-square flex justify-center items-center text-sm leading-none" :class="{
              'text-base-content/60': isWeekend(day) && !isSameDay(day, new Date()),
              'bg-primary text-primary-content rounded-box': isSameDay(day, new Date()),
              'border border-primary text-primary rounded-box': hasEvents(day)
            }">
              {{ day.getDate() }}
            </span>
            <!-- <div class="h-4 flex justify-center items-center w-full ">
              <span v-if="hasEvents(day)" class="status status-primary"></span>
            </div> -->
          </template>
          <span v-else class="w-7 h-7 aspect-square"></span>
          <!-- hover tooltip -->
          <div
            v-if="isSameMonth(day, month) && hasEvents(day)"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 hidden group-hover:block min-w-40 max-w-72 bg-base-100 border border-base-300 rounded-lg shadow-lg p-2 text-left text-sm text-base-content"
            @click.stop
          >
            <div v-for="e in getDayEvents(day)" :key="e.id" class="py-0.5 border-b border-base-200 last:border-0 whitespace-nowrap">
              <span class="font-semibold">{{ formatEventTime(e.start) }}</span>
              <span class="ml-1 text-base-content/70">{{ getEventVenue(e) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
