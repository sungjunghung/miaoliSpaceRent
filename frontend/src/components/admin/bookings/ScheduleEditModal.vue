<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookingsStore, type Booking } from '@/stores/bookings'
import { CANCELLED_STATUSES } from '@/utils/bookingStatus'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  booking: Booking
}>()

const bookingsStore = useBookingsStore()
const { showToast } = useToast()
const scheduleModalOpen = ref(false)

const editDate = ref('')
const editStartDate = ref('')
const editEndDate = ref('')
const editSession = ref('')
const editStartTime = ref('')
const editEndTime = ref('')

const today = new Date().toISOString().slice(0, 10)

const venueBookings = computed(() => {
  if (!props.booking) return []
  const vid = props.booking.venueId
  return bookingsStore.bookings.filter(
    b => b.venueId === vid && b.id !== props.booking.id && !CANCELLED_STATUSES.includes(b.status)
  )
})

const bookedSessions = computed(() =>
  venueBookings.value
    .filter(b => b.rentalMode === 'session' && b.date === editDate.value && b.session)
    .map(b => b.session!)
)

const bookedTimeRanges = computed(() =>
  venueBookings.value
    .filter(b => b.rentalMode === 'hourly' && b.date === editDate.value && b.startTime && b.endTime)
    .map(b => ({ start: b.startTime!, end: b.endTime! }))
)

const hasTimeConflict = computed(() => {
  if (!editStartTime.value || !editEndTime.value) return false
  return bookedTimeRanges.value.some(r => editStartTime.value < r.end && editEndTime.value > r.start)
})

const bookedDailyDates = computed(() => {
  const dates = new Set<string>()
  venueBookings.value.filter(b => b.rentalMode === 'daily').forEach(b => {
    const start = new Date(b.startDate ?? b.date)
    const end = new Date(b.endDate ?? b.date)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.add(d.toISOString().slice(0, 10))
    }
  })
  return dates
})

const hasDailyConflict = computed(() => {
  if (!editStartDate.value) return false
  const end = editEndDate.value || editStartDate.value
  const s = new Date(editStartDate.value), e = new Date(end)
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (bookedDailyDates.value.has(d.toISOString().slice(0, 10))) return true
  }
  return false
})

const scheduleHasConflict = computed(() => {
  if (!props.booking) return true
  if (props.booking.rentalMode === 'session') return bookedSessions.value.includes(editSession.value)
  if (props.booking.rentalMode === 'hourly') return hasTimeConflict.value
  if (props.booking.rentalMode === 'daily') return hasDailyConflict.value
  return false
})

function openModal() {
  if (!props.booking) return
  const b = props.booking
  editDate.value = b.date
  editStartDate.value = b.startDate ?? ''
  editEndDate.value = b.endDate ?? ''
  editSession.value = b.session ?? ''
  editStartTime.value = b.startTime ?? ''
  editEndTime.value = b.endTime ?? ''
  scheduleModalOpen.value = true
}

function saveSchedule() {
  const b = props.booking
  if (b.rentalMode === 'session') {
    bookingsStore.updateSchedule(b.id, { date: editDate.value, session: editSession.value })
  } else if (b.rentalMode === 'hourly') {
    bookingsStore.updateSchedule(b.id, { date: editDate.value, startTime: editStartTime.value, endTime: editEndTime.value })
  } else {
    bookingsStore.updateSchedule(b.id, {
      date: editStartDate.value,
      startDate: editStartDate.value,
      endDate: editEndDate.value || editStartDate.value,
    })
  }
  showToast('日期/時段已異動')
  scheduleModalOpen.value = false
}

defineExpose({ openModal })
</script>

<template>
    <dialog class="modal" :class="{ 'modal-open': scheduleModalOpen }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold mb-4">異動日期 / 時段</h3>

        <!-- session 模式 -->
        <template v-if="booking.rentalMode === 'session'">
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">使用日期</legend>
            <input v-model="editDate" type="date" class="input input-bordered w-full" :min="today" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">場次</legend>
            <select v-model="editSession" class="select select-bordered w-full">
              <option value="morning" :disabled="bookedSessions.includes('morning')">
                上午場（08:00–12:00）{{ bookedSessions.includes('morning') ? '　已被預訂' : '' }}
              </option>
              <option value="afternoon" :disabled="bookedSessions.includes('afternoon')">
                下午場（13:00–17:00）{{ bookedSessions.includes('afternoon') ? '　已被預訂' : '' }}
              </option>
              <option value="evening" :disabled="bookedSessions.includes('evening')">
                晚間場（18:00–22:00）{{ bookedSessions.includes('evening') ? '　已被預訂' : '' }}
              </option>
            </select>
          </fieldset>
          <div v-if="bookedSessions.includes(editSession)" class="alert alert-warning py-2 mt-2">
            <span class="material-symbols-outlined text-base">warning</span>
            <span>此場次已被其他預約佔用，請選擇其他場次</span>
          </div>
        </template>

        <!-- daily 模式 -->
        <template v-else-if="booking.rentalMode === 'daily'">
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">起始日期</legend>
            <input v-model="editStartDate" type="date" class="input input-bordered w-full" :min="today" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">結束日期</legend>
            <input v-model="editEndDate" type="date" class="input input-bordered w-full"
              :min="editStartDate || today" />
          </fieldset>
          <div v-if="hasDailyConflict" class="alert alert-warning py-2 mt-2">
            <span class="material-symbols-outlined text-base">warning</span>
            <span>所選日期範圍與其他預約衝突，請調整日期</span>
          </div>
        </template>

        <!-- hourly 模式 -->
        <template v-else-if="booking.rentalMode === 'hourly'">
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">使用日期</legend>
            <input v-model="editDate" type="date" class="input input-bordered w-full" :min="today" />
          </fieldset>
          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">開始時間</legend>
              <input v-model="editStartTime" type="time" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">結束時間</legend>
              <input v-model="editEndTime" type="time" class="input input-bordered w-full" :min="editStartTime" />
            </fieldset>
          </div>
          <div v-if="bookedTimeRanges.length && editDate" class="mt-2 text-base-content/50">
            <p class="mb-1">該日已預訂時段：</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="r in bookedTimeRanges" :key="r.start" class="badge badge-outline badge-error">
                {{ r.start }} – {{ r.end }}
              </span>
            </div>
          </div>
          <div v-if="hasTimeConflict" class="alert alert-warning py-2 mt-2">
            <span class="material-symbols-outlined text-base">warning</span>
            <span>所選時段與其他預約衝突，請調整時間</span>
          </div>
        </template>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="scheduleModalOpen = false">取消</button>
          <button class="btn btn-primary" :disabled="scheduleHasConflict" @click="saveSchedule">確認異動</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="scheduleModalOpen = false"></form>
    </dialog>
</template>
