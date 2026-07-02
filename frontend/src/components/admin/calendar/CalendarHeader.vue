<script setup lang="ts">
import { inject, computed } from 'vue';
import type { CalendarState } from '@/composables/useCalendarState';
import VenueFilterDropdown from '@/components/admin/VenueFilterDropdown.vue';

const emit = defineEmits<{
  addNote: [];
  addBlocked: [];
}>();

const calendar = inject<CalendarState>('calendar')!;

// 橋接：CalendarState 用 Set<number> | null，VenueFilterDropdown 用 number[]
const venueFilterModel = computed({
  get() {
    const set = calendar.selectedVenueIds.value
    if (!set) return []  // null = 全選 = 空陣列
    return [...set]
  },
  set(val: number[]) {
    if (val.length === 0) calendar.selectedVenueIds.value = null
    else calendar.selectedVenueIds.value = new Set(val)
  },
})
</script>

<template>
  <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4">
    <div class="flex items-center gap-4">
      <div class="tabs tabs-sm tabs-box">
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'day' }"
          @click="calendar.setViewMode('day')">日</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'week' }"
          @click="calendar.setViewMode('week')">週</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'month' }"
          @click="calendar.setViewMode('month')">月</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'year' }"
          @click="calendar.setViewMode('year')">年</button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-sm btn-ghost" @click="calendar.goPrevious()">上一個</button>
        <button class="btn btn-sm btn-outline" @click="calendar.goToday()">今天</button>
        <button class="btn btn-sm btn-ghost" @click="calendar.goNext()">下一個</button>
      </div>
    </div>

    <div class="text-lg font-semibold text-base-content">{{ calendar.periodTitle.value }}</div>

    <div class="flex flex-wrap items-center gap-3">
      <!-- Venue Filter Dropdown -->
      <VenueFilterDropdown v-model="venueFilterModel" />

      <button class="btn btn-neutral btn-sm" @click="emit('addNote')">
        <span class="material-symbols-outlined text-">note_add</span>
        新增註記
      </button>
      <button class="btn btn-neutral btn-sm" @click="emit('addBlocked')">
        <span class="material-symbols-outlined">block</span>
        時段保留
      </button>
    </div>
  </div>
</template>
