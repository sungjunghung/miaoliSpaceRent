<script setup lang="ts">
import { inject } from 'vue';
import type { CalendarState } from '@/composables/useCalendarState';
import { isSameMonth, isSameDay, getMiniMonthGrid, pad } from '@/utils/calendar';

const calendar = inject<CalendarState>('calendar')!;
const weekDayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

function hasEvents(day: Date): boolean {
  return (calendar.filteredEvents.value ?? []).some(e => isSameDay(new Date(e.start), day));
}

function getDayEvents(day: Date) {
  return (calendar.filteredEvents.value ?? []).filter(e => isSameDay(new Date(e.start), day));
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4  gap-4">
    <button v-for="month in calendar.yearMonths.value" :key="month.toISOString()"
      class="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition"
      @click="calendar.handleMonthClick(month)">
      <div class="text-sm font-semibold mb-3">{{ month.getFullYear() }} / {{ pad(month.getMonth() + 1) }}</div>
      <div class="grid grid-cols-7 gap-1 text-[10px] text-base-content/50">
        <span v-for="label in weekDayLabels" :key="label" class="text-center">{{ label.slice(1) }}</span>
      </div>
      <div class="grid grid-cols-7 gap-1 mt-1 text-[11px]">
        <span v-for="day in getMiniMonthGrid(month)" :key="day.toISOString()"
          class="relative text-center py-1 rounded flex flex-col items-center group" :class="{
            'text-base-content/30': !isSameMonth(day, month),
            'bg-primary/10 text-primary': isSameDay(day, new Date()),
          }">
          {{ day.getDate() }}
          <span v-if="hasEvents(day)" class="status status-sm status-success"></span>
          <!-- hover tooltip -->
          <div
            v-if="hasEvents(day)"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 hidden group-hover:block w-40 bg-base-100 border border-base-300 rounded-lg shadow-lg p-2 text-left text-[10px] text-base-content"
            @click.stop
          >
            <div v-for="e in getDayEvents(day)" :key="e.id" class="py-0.5 border-b border-base-200 last:border-0 truncate">
              <span class="font-semibold">{{ formatEventTime(e.start) }}</span> {{ e.title }}
            </div>
          </div>
        </span>
      </div>
    </button>
  </div>
</template>
