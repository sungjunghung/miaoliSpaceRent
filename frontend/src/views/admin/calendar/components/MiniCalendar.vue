<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type { CalendarState } from '@/composables/useCalendarState';
import { isSameDay, isSameMonth, getMonthWeeks, pad } from '@/utils/calendar';

const props = withDefaults(defineProps<{ mode?: 'day' | 'week' }>(), { mode: 'day' });

const calendar = inject<CalendarState>('calendar')!;

const miniAnchor = ref(new Date(calendar.anchorDate.value ?? new Date()));
const miniWeeks = computed(() => getMonthWeeks(miniAnchor.value));
const miniTitle = computed(() => `${miniAnchor.value.getFullYear()} 年 ${pad(miniAnchor.value.getMonth() + 1)} 月`);
const weekdayHeaders = ['一', '二', '三', '四', '五', '六', '日'];

function isInCurrentWeek(day: Date): boolean {
  if (props.mode !== 'week') return false;
  const days = calendar.weekDays.value;
  if (!days || days.length === 0) return false;
  return day >= days[0] && day <= days[6];
}

function miniPrev() {
  const d = new Date(miniAnchor.value);
  d.setMonth(d.getMonth() - 1);
  miniAnchor.value = d;
}
function miniNext() {
  const d = new Date(miniAnchor.value);
  d.setMonth(d.getMonth() + 1);
  miniAnchor.value = d;
}
function selectDay(day: Date) {
  calendar.anchorDate.value = day;
  miniAnchor.value = new Date(day);
}

const isSelectedDay = (day: Date) =>
  props.mode === 'day' && isSameDay(day, calendar.anchorDate.value ?? new Date());

const isToday = (day: Date) =>
  isSameDay(day, calendar.now.value ?? new Date());

function dayClass(day: Date): string[] {
  const classes: string[] = [];

  if (isSelectedDay(day)) {
    classes.push('btn-primary');
  } else if (isToday(day)) {
    classes.push('btn-outline btn-primary');
  } else if (isInCurrentWeek(day)) {
    classes.push('btn-ghost font-bold text-primary');
  } else {
    classes.push('btn-ghost');
  }

  if (
    !isSameMonth(day, miniAnchor.value) &&
    !isSelectedDay(day) &&
    !isToday(day) &&
    !isInCurrentWeek(day)
  ) {
    classes.push('text-base-content/30');
  }

  return classes;
}

function weekRowClass(week: Date[]): string {
  if (props.mode === 'week' && week.some(d => isInCurrentWeek(d))) {
    return 'bg-primary/10';
  }
  return '';
}
</script>

<template>
  <div class="w-64 shrink-0 basis-box p-3 select-none">
    <div class="flex items-center justify-between mb-2">
      <button class="btn btn-ghost btn-xs btn-square" @click="miniPrev">
        <span class="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      <span class="text-sm font-semibold">{{ miniTitle }}</span>
      <button class="btn btn-ghost btn-xs btn-square" @click="miniNext">
        <span class="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
    <div class="grid grid-cols-7 text-center text-xs text-base-content/50 mb-1">
      <div v-for="h in weekdayHeaders" :key="h">{{ h }}</div>
    </div>
    <div
      v-for="(week, wi) in miniWeeks"
      :key="wi"
      class="grid grid-cols-7 text-center rounded-lg"
      :class="weekRowClass(week)"
    >
      <button
        v-for="day in week"
        :key="day.toISOString()"
        class="btn btn-xs btn-square text-xs"
        :class="dayClass(day)"
        @click="selectDay(day)"
      >
        {{ day.getDate() }}
      </button>
    </div>
  </div>
</template>
