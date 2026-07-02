<script setup lang="ts">
import WeekCalendar from '@/components/portal/calendar/WeekCalendar.vue'

interface SessionDef { name: string; startTime: string; endTime: string }

const props = defineProps<{
  closedWeekdays: number[]
  closedDates: string[]
  bookings: any[]
  sessionDefs: SessionDef[]
  selectedDate: string
  startTime: string
  endTime: string
  minHours: number
  maxHours: number
  todayStr: string
  timeOptions: string[]
  totalHours: number
}>()

const emit = defineEmits<{
  'update:selectedDate': [value: string]
  'update:startTime': [value: string]
  'update:endTime': [value: string]
}>()

function isEndTimeDisabled(t: string): boolean {
  if (!props.startTime) return false
  if (t <= props.startTime) return true
  const si = props.timeOptions.indexOf(props.startTime)
  const ei = props.timeOptions.indexOf(t)
  const diffHours = ei - si
  return diffHours < props.minHours || diffHours > props.maxHours
}

function onCalendarSelectTime(payload: { date: string; startTime: string; endTime: string }) {
  emit('update:selectedDate', payload.date)
  emit('update:startTime', payload.startTime)
  emit('update:endTime', payload.endTime)
}
</script>

<template>
  <div class="space-y-8">
    <!-- 行事曆參考 -->
    <section class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">calendar_today</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">租借狀況一覽</h3>
          <p>點選起迄時間直接選取</p>
        </div>
      </div>
      <div class="bg-base-200 rounded-box p-4 border border-base-200">
        <WeekCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="bookings"
          interact-mode="hourly" :session-defs="sessionDefs" :selected-date="selectedDate"
          :selected-start-time="startTime" :selected-end-time="endTime" :min-hours="minHours"
          :max-hours="maxHours" @select-time="onCalendarSelectTime" />
      </div>
    </section>

    <!-- 選擇日期 -->
    <section class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">edit_calendar</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">選擇日期</h3>
          <p>也可直接輸入日期</p>
        </div>
      </div>
      <input type="date" :value="selectedDate" :min="todayStr" class="input input-bordered w-full"
        @change="emit('update:selectedDate', ($event.target as HTMLInputElement).value)" />
    </section>

    <!-- 選擇時間 -->
    <section class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">schedule</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">選擇時間</h3>
          <p>點選開始與結束時間</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label"><span class="label-text">開始時間</span></label>
          <select :value="startTime" class="select select-bordered w-full"
            @change="emit('update:startTime', ($event.target as HTMLSelectElement).value)">
            <option value="">請選擇</option>
            <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">結束時間</span></label>
          <select :value="endTime" class="select select-bordered w-full"
            @change="emit('update:endTime', ($event.target as HTMLSelectElement).value)">
            <option value="">請選擇</option>
            <option v-for="t in timeOptions" :key="t" :value="t" :disabled="!!startTime && isEndTimeDisabled(t)">{{ t }}</option>
          </select>
        </div>
      </div>
      <div v-if="totalHours > 0">共 <span class="font-bold">{{ totalHours }}</span> 小時</div>
    </section>
  </div>
</template>
