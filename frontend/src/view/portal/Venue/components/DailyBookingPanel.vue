<script setup lang="ts">
import MonthCalendar from '@/components/portal/calendar/MonthCalendar.vue'

const props = defineProps<{
  closedWeekdays: number[]
  closedDates: string[]
  bookings: any[]
  selectedStartDate: string
  selectedEndDate: string
  minDays: number
  maxDays: number
  todayStr: string
  totalDays: number
  endDateMin: string
  endDateMax: string
}>()

const emit = defineEmits<{
  'update:selectedStartDate': [value: string]
  'update:selectedEndDate': [value: string]
}>()

function onCalendarSelectDate(dateStr: string) {
  if (!props.selectedStartDate) {
    emit('update:selectedStartDate', dateStr)
  } else if (!props.selectedEndDate) {
    if (dateStr < props.selectedStartDate) {
      emit('update:selectedEndDate', props.selectedStartDate)
      emit('update:selectedStartDate', dateStr)
    } else {
      emit('update:selectedEndDate', dateStr)
    }
  } else {
    emit('update:selectedStartDate', dateStr)
    emit('update:selectedEndDate', '')
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- 月曆參考 -->
    <section class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">calendar_month</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">租借狀況一覽</h3>
          <p>查看本月各日期租借狀態</p>
        </div>
      </div>
      <div class="bg-base-200 rounded-box p-4 border border-base-200">
        <MonthCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="bookings"
          :selected-start="selectedStartDate" :selected-end="selectedEndDate" :view-date="selectedStartDate"
          :min-days="minDays" :max-days="maxDays" @select-date="onCalendarSelectDate" />
      </div>
    </section>

    <!-- 日期範圍輸入 -->
    <section class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">date_range</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">選擇日期範圍</h3>
          <p>也可直接輸入起迄日</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label"><span class="label-text">開始日期</span></label>
          <input type="date" :value="selectedStartDate" :min="todayStr" class="input input-bordered w-full"
            @change="emit('update:selectedStartDate', ($event.target as HTMLInputElement).value)" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">結束日期</span></label>
          <input type="date" :value="selectedEndDate" class="input input-bordered w-full" :min="endDateMin"
            :max="endDateMax || undefined"
            @change="emit('update:selectedEndDate', ($event.target as HTMLInputElement).value)" />
        </div>
      </div>
      <div v-if="totalDays > 0">共 <span class="font-bold">{{ totalDays }}</span> 天</div>
    </section>
  </div>
</template>
