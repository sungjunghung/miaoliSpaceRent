<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'
import { RENTAL_MODE_LABELS, formatBookingDate } from '../../../../composables/useBookingFormat'

defineProps<{
  booking: Booking
}>()

const emit = defineEmits<{
  (e: 'editSchedule'): void
}>()

const today = new Date().toISOString().slice(0, 10)
const formatDate = (b: Booking) => formatBookingDate(b, true)
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base">預約資訊</h3>
          </div>
        </div>
        <table class="table">
          <tbody>
            <tr><td class="text-base-content/50 w-28">訂單編號</td><td >{{ booking.reservationId }}</td></tr>
            <tr><td class="text-base-content/50">建立時間</td><td>{{ booking.createdAt }}</td></tr>
            <tr><td class="text-base-content/50 w-28">場館</td><td class="font-medium">{{ booking.venueName }}</td></tr>
            <tr><td class="text-base-content/50">租借方式</td><td>{{ RENTAL_MODE_LABELS[booking.rentalMode] }}</td></tr>
            <tr>
              <td class="text-base-content/50">使用日期</td>
              <td class="flex items-center justify-between">{{ formatDate(booking) }}
                <button v-if="!['cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(booking.status)"
                  class="btn btn-ghost gap-1" @click="emit('editSchedule')"
                  :disabled="(booking.endDate ?? booking.date) < today">
                  <span class="material-symbols-outlined">edit_calendar</span>異動
                </button>
              </td>
            </tr>
            <tr v-if="booking.purpose"><td class="text-base-content/50">使用目的</td><td>{{ booking.purpose }}</td></tr>
            <tr v-if="booking.peopleCount"><td class="text-base-content/50">預計人數</td><td>{{ booking.peopleCount }} 人</td></tr>
          </tbody>
        </table>
      </div>
    </div>
</template>
