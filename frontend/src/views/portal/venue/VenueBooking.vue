<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { venues as venues } from '@/services/venueService'
import { venueRentalModes as venueRentalModes } from '@/services/venueEditService'
import { rawBookings as allBookings } from '@/services/bookingService'
import { calendarNotes as calendarNotes } from '@/services/calendarNoteService'
import DailyBookingPanel from './components/DailyBookingPanel.vue'
import SessionBookingPanel from './components/SessionBookingPanel.vue'
import HourlyBookingPanel from './components/HourlyBookingPanel.vue'
import SetupTeardownSection from './components/SetupTeardownSection.vue'
import AdditionalItemsSection from './components/AdditionalItemsSection.vue'

const route = useRoute()
const router = useRouter()

const venue = computed(() => {
  const id = Number(route.params.id)
  return venues.find(v => v.id === id)
})

type RentalMode = 'daily' | 'session' | 'hourly'

// 啟用的租借模式
const enabledModes = computed<{ value: RentalMode; label: string }[]>(() => {
  if (!venue.value) return []
  const modes: { value: RentalMode; label: string }[] = []
  const rm = venue.value.rentalModes
  if (rm.daily?.enabled) modes.push({ value: 'daily', label: '全日租借' })
  if (rm.session?.enabled) modes.push({ value: 'session', label: '時段租借' })
  if (rm.hourly?.enabled) modes.push({ value: 'hourly', label: '小時租借' })
  return modes
})

const rentalMode = ref<RentalMode>(enabledModes.value[0]?.value ?? 'daily')

const selectedDate = ref('')
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const startTime = ref('')
const endTime = ref('')
const selectedSession = ref<string | null>(null)
const feeQuantities = ref<Record<string, number>>({})

// 從場館列表的搜尋帶入日期:在 setup 階段(子日曆 mount 前)預填,
// 讓月曆/週曆直接跳到使用者搜尋的那天
function applySearchPrefill() {
  const q = route.query
  const date = typeof q.date === 'string' ? q.date : ''
  const startDate = typeof q.startDate === 'string' ? q.startDate : ''
  const endDate = typeof q.endDate === 'string' ? q.endDate : ''
  const hasMode = (m: RentalMode) => enabledModes.value.some(e => e.value === m)

  if (startDate) {
    // 多日搜尋 → 對應全日租借
    if (hasMode('daily')) {
      rentalMode.value = 'daily'
      selectedStartDate.value = startDate
      selectedEndDate.value = endDate
    }
    return
  }
  if (date) {
    // 單日搜尋 → 優先小時、其次時段,皆無則用全日的起始日
    if (hasMode('hourly')) { rentalMode.value = 'hourly'; selectedDate.value = date }
    else if (hasMode('session')) { rentalMode.value = 'session'; selectedDate.value = date }
    else if (hasMode('daily')) { rentalMode.value = 'daily'; selectedStartDate.value = date }
  }
}
applySearchPrefill()

const additionalFeesTotal = computed(() => {
  if (!venue.value?.rentalItems) return 0
  return venue.value.rentalItems
    .filter(f => feeQuantities.value[f.label])
    .reduce((sum, f) => sum + (f.amount * feeQuantities.value[f.label]), 0)
})

// 場佈與撤場
const currentModeSettings = computed(() => {
  if (!venue.value) return null
  const modeKey = rentalMode.value === 'session' ? 'timeslot' : rentalMode.value
  return (venueRentalModes as any[]).find(r => r.venueId === venue.value!.id && r.mode === modeKey) ?? null
})

const setupAllowanceHours = computed(() => currentModeSettings.value?.setupAllowanceHours ?? 1)
const teardownAllowanceHours = computed(() => currentModeSettings.value?.teardownAllowanceHours ?? 1)
const setupOverageUnitMinutes = computed(() => currentModeSettings.value?.setupOverageUnitMinutes ?? 30)
const teardownOverageUnitMinutes = computed(() => currentModeSettings.value?.teardownOverageUnitMinutes ?? 30)
const setupOverageFeePerUnit = computed(() => currentModeSettings.value?.setupOverageFeePerUnit ?? 0)
const teardownOverageFeePerUnit = computed(() => currentModeSettings.value?.teardownOverageFeePerUnit ?? 0)

const selectedSetupHours = ref(1)
const selectedTeardownHours = ref(1)

watch(currentModeSettings, (settings) => {
  selectedSetupHours.value = settings?.setupAllowanceHours ?? 1
  selectedTeardownHours.value = settings?.teardownAllowanceHours ?? 1
}, { immediate: true })

const setupTimeOptions = computed(() => {
  const step = setupOverageUnitMinutes.value / 60
  const result: number[] = []
  for (let i = 0; i <= 4 / step; i++) result.push(Math.round(i * step * 10) / 10)
  return result
})

const teardownTimeOptions = computed(() => {
  const step = teardownOverageUnitMinutes.value / 60
  const result: number[] = []
  for (let i = 0; i <= 4 / step; i++) result.push(Math.round(i * step * 10) / 10)
  return result
})

function getSetupCost(hours: number): number {
  const free = setupAllowanceHours.value
  if (hours <= free) return 0
  const unitHours = setupOverageUnitMinutes.value / 60
  return Math.ceil((hours - free) / unitHours) * setupOverageFeePerUnit.value
}

function getTeardownCost(hours: number): number {
  const free = teardownAllowanceHours.value
  if (hours <= free) return 0
  const unitHours = teardownOverageUnitMinutes.value / 60
  return Math.ceil((hours - free) / unitHours) * teardownOverageFeePerUnit.value
}

const setupTeardownTotal = computed(() =>
  getSetupCost(selectedSetupHours.value) + getTeardownCost(selectedTeardownHours.value)
)

const setupCost = computed(() => getSetupCost(selectedSetupHours.value))
const teardownCost = computed(() => getTeardownCost(selectedTeardownHours.value))

const availableSessions = computed(() => {
  const sessions = venue.value?.rentalModes.session?.sessions ?? []
  return sessions.map(s => ({
    code: s.name,
    label: s.name,
    time: `${s.startTime} - ${s.endTime}`,
    weekday: s.weekday,
    weekend: s.weekend,
  }))
})

// 小時租借的時間選項
const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
]

// 判斷平假日
function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false
  return [0, 6].includes(new Date(dateStr).getDay())
}

const totalPrice = computed(() => {
  if (!venue.value) return 0
  const pricing = venue.value.pricing
  let base = 0

  if (rentalMode.value === 'daily') {
    if (!selectedStartDate.value || !selectedEndDate.value) return additionalFeesTotal.value
    const start = new Date(selectedStartDate.value)
    const end = new Date(selectedEndDate.value)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    const dayType = isWeekend(selectedStartDate.value) ? 'weekend' : 'weekday'
    base = (pricing.daily?.[dayType] ?? 0) * days
  } else if (rentalMode.value === 'session') {
    if (!selectedDate.value || !selectedSession.value) return additionalFeesTotal.value
    const dayType = isWeekend(selectedDate.value) ? 'weekend' : 'weekday'
    const slot = availableSessions.value.find(s => s.code === selectedSession.value)
    if (!slot) return additionalFeesTotal.value
    base = slot[dayType] ?? 0
  } else if (rentalMode.value === 'hourly') {
    if (!selectedDate.value || !startTime.value || !endTime.value) return additionalFeesTotal.value
    const si = timeOptions.indexOf(startTime.value)
    const ei = timeOptions.indexOf(endTime.value)
    if (si < 0 || ei < 0 || ei <= si) return additionalFeesTotal.value
    const hours = ei - si
    const dayType = isWeekend(selectedDate.value) ? 'weekend' : 'weekday'
    base = (pricing.hourly?.[dayType] ?? venue.value.pricePerHour ?? 0) * hours
  }

  return base + additionalFeesTotal.value + setupTeardownTotal.value
})

// 總天數
const totalDays = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) return 0
  const start = new Date(selectedStartDate.value)
  const end = new Date(selectedEndDate.value)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
})

// 總時數
const totalHours = computed(() => {
  if (!startTime.value || !endTime.value) return 0
  const si = timeOptions.indexOf(startTime.value)
  const ei = timeOptions.indexOf(endTime.value)
  return ei > si ? ei - si : 0
})

// 今天日期字串（用於 date input 的 min）
const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
})

// 限制與驗證
const dailyMinDays = computed(() => venue.value?.rentalModes.daily?.minDays ?? 1)
const dailyMaxDays = computed(() => venue.value?.rentalModes.daily?.maxDays ?? 999)
const hourlyMinHours = computed(() => venue.value?.rentalModes.hourly?.minHours ?? 1)
const hourlyMaxHours = computed(() => venue.value?.rentalModes.hourly?.maxHours ?? 999)

const endDateMin = computed(() => {
  if (!selectedStartDate.value) return todayStr.value
  const d = new Date(selectedStartDate.value)
  d.setDate(d.getDate() + dailyMinDays.value - 1)
  return d.toISOString().split('T')[0]
})

const endDateMax = computed(() => {
  if (!selectedStartDate.value || dailyMaxDays.value === 999) return ''
  const d = new Date(selectedStartDate.value)
  d.setDate(d.getDate() + dailyMaxDays.value - 1)
  return d.toISOString().split('T')[0]
})

// 是否可預約
const canBook = computed(() => {
  if (rentalMode.value === 'daily') return !!selectedStartDate.value && !!selectedEndDate.value && totalDays.value >= dailyMinDays.value && totalDays.value <= dailyMaxDays.value
  if (rentalMode.value === 'session') return !!selectedDate.value && !!selectedSession.value
  if (rentalMode.value === 'hourly') return !!selectedDate.value && !!startTime.value && !!endTime.value && totalHours.value >= hourlyMinHours.value && totalHours.value <= hourlyMaxHours.value
  return false
})

// 模式切換
function switchMode(mode: RentalMode) {
  rentalMode.value = mode
  selectedDate.value = ''
  selectedStartDate.value = ''
  selectedEndDate.value = ''
  startTime.value = ''
  endTime.value = ''
  selectedSession.value = null
}


function goToConfirm() {
  if (!venue.value) return
  router.push('/venues/' + venue.value.id + '/confirm')
}

const closedWeekdays = computed(() => venue.value?.closedWeekdays ?? [])
const closedDates = computed(() => venue.value?.closedDates ?? [])
const venueBookings = computed(() => {
  if (!venue.value) return []
  const realBookings = allBookings.filter(b => b.venueId === venue.value!.id)
  // 將時段保留轉為假的 booking record
  const blocked = calendarNotes
    .filter((n: any) => n.type === 'blocked' && n.venueId === venue.value!.id)
    .map((n: any) => ({
      id: `blocked-${n.id}`,
      venueId: n.venueId,
      date: n.date,
      rentalMode: n.allDay ? 'daily' : 'hourly',
      startDate: n.allDay ? n.date : undefined,
      endDate: n.allDay ? n.date : undefined,
      startTime: n.startTime ?? undefined,
      endTime: n.endTime ?? undefined,
      session: n.allDay ? undefined : undefined,
      status: 'confirmed',
      applicant: n.title,
      purpose: n.description,
    }))
  return [...realBookings, ...blocked]
})

// 可用場次代碼
const sessionDefs = computed(() => (venue.value?.rentalModes.session?.sessions ?? []).map(s => ({ name: s.name, startTime: s.startTime, endTime: s.endTime })))
</script>

<template>
  <div v-if="!venue" class="flex items-center justify-center min-h-screen bg-base-200">
    <div class="text-center space-y-4">
      <span class="material-symbols-outlined text-6xl ">error</span>
      <p class="">找不到該場館</p>
      <router-link to="/venues" class="btn btn-neutral btn-sm">返回場館列表</router-link>
    </div>
  </div>

  <template v-else>
    <!-- <PageHeaderBasic title="場地預約" /> -->
    <!-- Booking Content -->
    <main class="container mx-auto px-4 max-w-5xl pt-8 pb-28 lg:pb-14">
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body p-6 md:p-8 space-y-8">
          <h1 class="card-title">{{ venue.name }}</h1>
          <!-- Rental Mode Tabs -->
          <div v-if="enabledModes.length > 0" class="tabs tabs-box">
            <button v-for="mode in enabledModes" :key="mode.value" class="tab flex-1"
              :class="{ 'tab-active bg-secondary text-secondary-content': rentalMode === mode.value }" @click="switchMode(mode.value)">{{ mode.label
              }}</button>
          </div>
          <div v-else class="alert alert-warning">
            <span class="material-symbols-outlined">warning</span>
            該場館目前沒有啟用任何租借模式。
          </div>

          <HourlyBookingPanel v-if="rentalMode === 'hourly'"
            :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
            :session-defs="sessionDefs" :selected-date="selectedDate" :start-time="startTime" :end-time="endTime"
            :min-hours="hourlyMinHours" :max-hours="hourlyMaxHours" :today-str="todayStr"
            :time-options="timeOptions" :total-hours="totalHours"
            @update:selected-date="selectedDate = $event"
            @update:start-time="startTime = $event"
            @update:end-time="endTime = $event" />

          <SessionBookingPanel v-else-if="rentalMode === 'session'"
            :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
            :session-defs="sessionDefs" :available-sessions="availableSessions"
            :selected-date="selectedDate" :selected-session="selectedSession" :today-str="todayStr"
            @update:selected-date="selectedDate = $event"
            @update:selected-session="selectedSession = $event" />

          <DailyBookingPanel v-else
            :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
            :selected-start-date="selectedStartDate" :selected-end-date="selectedEndDate"
            :min-days="dailyMinDays" :max-days="dailyMaxDays" :today-str="todayStr"
            :total-days="totalDays" :end-date-min="endDateMin" :end-date-max="endDateMax"
            @update:selected-start-date="selectedStartDate = $event"
            @update:selected-end-date="selectedEndDate = $event" />

          <SetupTeardownSection v-if="currentModeSettings"
            :setup-allowance-hours="setupAllowanceHours" :teardown-allowance-hours="teardownAllowanceHours"
            :setup-overage-unit-minutes="setupOverageUnitMinutes"
            :setup-time-options="setupTimeOptions" :teardown-time-options="teardownTimeOptions"
            :selected-setup-hours="selectedSetupHours" :selected-teardown-hours="selectedTeardownHours"
            :setup-cost="setupCost" :teardown-cost="teardownCost"
            @update:selected-setup-hours="selectedSetupHours = $event"
            @update:selected-teardown-hours="selectedTeardownHours = $event" />

          <AdditionalItemsSection v-if="venue.rentalItems?.length"
            :items="venue.rentalItems" v-model="feeQuantities" />

          <!-- 桌機版:預估費用與下一步(手機改用下方 sticky footer) -->
          <div class="hidden lg:flex items-center justify-between gap-4 border-t border-base-200 pt-6">
            <div>
              <div v-if="totalPrice > 0" class="space-y-0.5">
                <p class="text-xs">場館預估費用</p>
                <p class="text-2xl font-black">${{ totalPrice.toLocaleString() }}</p>
              </div>
              <p v-else class="text-sm">請選擇租借日期與時段</p>
            </div>
            <button class="btn btn-neutral btn-lg min-w-40" :disabled="!canBook" @click="goToConfirm">
              <span class="material-symbols-outlined">check_circle</span>
              下一步
            </button>
          </div>

        </div>
      </div>
    </main>

    <!-- Sticky Footer -->
    <div class="mt-8 flex flex-wrap gap-3 fixed bottom-20 left-0 right-0 p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-200 lg:hidden justify-center z-20">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <div v-if="totalPrice > 0" class="space-y-0.5">
              <p class="text-xs">場館預估費用</p>
              <p class="text-2xl font-black">${{ totalPrice.toLocaleString() }}</p>
            </div>
            <p v-else class="text-sm ">請選擇租借日期與時段</p>
          </div>
          <button class="btn btn-neutral btn-lg min-w-40" :disabled="!canBook" @click="goToConfirm">
            <span class="material-symbols-outlined">check_circle</span>
            下一步
          </button>
        </div>
    
    </div>
  </template>
</template>
