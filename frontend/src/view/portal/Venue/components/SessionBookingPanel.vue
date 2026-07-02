<script setup lang="ts">
import WeekCalendar from '@/components/portal/calendar/WeekCalendar.vue'

interface SessionDef { name: string; startTime: string; endTime: string }
interface AvailableSession { code: string; label: string; time: string; weekday: number; weekend: number }

const props = defineProps<{
  closedWeekdays: number[]
  closedDates: string[]
  bookings: any[]
  sessionDefs: SessionDef[]
  availableSessions: AvailableSession[]
  selectedDate: string
  selectedSession: string | null
  todayStr: string
}>()

const emit = defineEmits<{
  'update:selectedDate': [value: string]
  'update:selectedSession': [value: string | null]
}>()

function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false
  return [0, 6].includes(new Date(dateStr).getDay())
}

function isSessionBooked(sessionCode: string): boolean {
  if (!props.selectedDate) return false
  const slot = props.availableSessions.find(s => s.code === sessionCode)
  const sessionStart = slot?.time.split(' - ')[0] ?? '00:00'
  const sessionEnd = slot?.time.split(' - ')[1] ?? '23:59'
  const directConflict = props.bookings.some(
    b => b.rentalMode === 'session' && b.date === props.selectedDate && b.session === sessionCode
  )
  if (directConflict) return true
  return props.bookings.some(b => {
    if (b.date !== props.selectedDate) return false
    if (b.rentalMode === 'daily') return true
    if (b.rentalMode === 'hourly' && b.startTime && b.endTime) {
      return b.startTime < sessionEnd && b.endTime > sessionStart
    }
    return false
  })
}

function onCalendarSelectSession(payload: { date: string; session: string }) {
  emit('update:selectedDate', payload.date)
  emit('update:selectedSession', payload.session)
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
          <p>點擊時段區塊直接選取場次</p>
        </div>
      </div>
      <div class="bg-base-200 rounded-box p-4 border border-base-200">
        <WeekCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="bookings"
          interact-mode="session" :session-defs="sessionDefs" :selected-date="selectedDate"
          :selected-session="selectedSession" @select-session="onCalendarSelectSession" />
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

    <!-- 選擇場次 -->
    <section v-if="selectedDate" class="space-y-4">
      <div class="flex items-center gap-3 border-b border-base-200 pb-2">
        <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
          <span class="material-symbols-outlined">access_time</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-base-content">選擇場次</h3>
          <p>選擇想租借的時間段</p>
        </div>
      </div>
      <div class="space-y-2">
        <label v-for="slot in availableSessions" :key="slot.code"
          class="flex items-center gap-3 p-3 rounded-box border transition-colors"
          :class="isSessionBooked(slot.code)
            ? 'border-base-300 cursor-not-allowed opacity-60'
            : selectedSession === slot.code
              ? 'border-primary shadow-md cursor-pointer'
              : 'border-base-200 hover:border-base-300 cursor-pointer'"
          @click="!isSessionBooked(slot.code) && emit('update:selectedSession', slot.code)">
          <input type="radio" name="session" class="radio radio-success"
            :checked="selectedSession === slot.code" :disabled="isSessionBooked(slot.code)" />
          <span class="flex-1">
            {{ slot.label }}
            <span class="text-xs ml-1">{{ slot.time }}</span>
            <span v-if="isSessionBooked(slot.code)" class="badge badge-sm badge-error ml-1">已租借</span>
          </span>
          <span class="font-bold text-base-content">
            ${{ (slot[isWeekend(selectedDate) ? 'weekend' : 'weekday'] ?? 0).toLocaleString() }}
          </span>
        </label>
      </div>
    </section>
  </div>
</template>
