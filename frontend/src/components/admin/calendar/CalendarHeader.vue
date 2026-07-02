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

// 事件類型（狀態）篩選：null = 顯示全部
const EVENT_TYPES = [
  { type: 'rented', label: '已租借' },
  { type: 'unavailable', label: '預約處理中' },
  { type: 'closed', label: '休館日' },
  { type: 'note', label: '註記' },
  { type: 'blocked', label: '時段保留' },
]
const ALL_TYPES = EVENT_TYPES.map(t => t.type)

const allTypesSelected = computed(() => calendar.selectedEventTypes.value === null)

function isTypeSelected(type: string) {
  const s = calendar.selectedEventTypes.value
  return s === null || s.has(type)
}

function toggleType(type: string) {
  const s = calendar.selectedEventTypes.value
  const set = s === null ? new Set(ALL_TYPES) : new Set(s)
  if (set.has(type)) set.delete(type)
  else set.add(type)
  // 全部都選 → 回到 null（顯示全部）
  calendar.selectedEventTypes.value = set.size === ALL_TYPES.length ? null : set
}

function toggleAllTypes() {
  // 目前全選 → 全不選（空 Set）；否則 → 全選（null）
  calendar.selectedEventTypes.value = allTypesSelected.value ? new Set<string>() : null
}

const typeFilterLabel = computed(() => {
  const s = calendar.selectedEventTypes.value
  if (s === null) return '所有狀態'
  if (s.size === 0) return '未選狀態'
  if (s.size === 1) return EVENT_TYPES.find(t => t.type === [...s][0])?.label ?? '已選 1 種'
  return `已選 ${s.size} 種狀態`
})
</script>

<template>
  <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4">
    <div class="flex items-center gap-4 ">
      <div class="tabs tabs-sm tabs-box bg-base-300">
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'day' }"
          @click="calendar.setViewMode('day')">日</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'week' }"
          @click="calendar.setViewMode('week')">週</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'month' }"
          @click="calendar.setViewMode('month')">月</button>
        <button class="tab" :class="{ 'tab-active': calendar.viewMode.value === 'year' }"
          @click="calendar.setViewMode('year')">年</button>
      </div>
      <button class="btn" @click="calendar.goToday()">今天</button>

      <button class="btn btn-ghost btn-square" aria-label="上一個" @click="calendar.goPrevious()">
        <span class="material-symbols-outlined text-xl">chevron_left</span>
      </button>
      <div class="text-xl font-semibold text-base-content text-center">{{ calendar.periodTitle.value }}</div>
      <button class="btn btn-ghost btn-square" aria-label="下一個" @click="calendar.goNext()">
        <span class="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <!-- Venue Filter Dropdown -->
      <VenueFilterDropdown v-model="venueFilterModel" />

      <!-- 事件狀態篩選 -->
      <details class="dropdown dropdown-end">
        <summary class="select w-fit min-w-36">
          <span class="flex-1 text-left truncate">{{ typeFilterLabel }}</span>
        </summary>
        <div tabindex="0" class="dropdown-content z-10 mt-1 bg-base-100 border border-base-200 shadow-lg rounded-box w-52">
          <ul class="menu menu-sm p-2">
            <li>
              <label class="flex items-center gap-2 select-none">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" :checked="allTypesSelected"
                  @change="toggleAllTypes" />
                <span class="font-medium">所有狀態</span>
              </label>
            </li>
            <div class="divider my-0.5"></div>
            <li v-for="t in EVENT_TYPES" :key="t.type">
              <label class="flex items-center gap-2 select-none">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" :checked="isTypeSelected(t.type)"
                  @change="toggleType(t.type)" />
                <span>{{ t.label }}</span>
              </label>
            </li>
          </ul>
        </div>
      </details>

      <button class="btn btn-neutral" @click="emit('addNote')">
        <span class="material-symbols-outlined text-">note_add</span>
        新增註記
      </button>
      <button class="btn btn-neutral" @click="emit('addBlocked')">
        <span class="material-symbols-outlined">block</span>
        時段保留
      </button>
    </div>
  </div>
</template>
