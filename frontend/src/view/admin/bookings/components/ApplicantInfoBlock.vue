<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'

defineProps<{
  booking: Booking
  member: any
}>()
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base">申請帳號</h3>
        <table class="table">
          <tbody>
            <tr><td class="text-base-content/50 w-28">姓名</td><td class="font-medium">{{ booking.applicant }}</td></tr>
            <tr v-if="member"><td class="text-base-content/50">電話</td><td>{{ member.phone }}</td></tr>
            <tr v-if="member"><td class="text-base-content/50">電子信箱</td><td>{{ member.email }}</td></tr>
          </tbody>
        </table>
        <p v-if="booking.note" class="bg-base-200 rounded px-3 py-2 mt-1">
          <span class="text-base-content/50">備註：</span>{{ booking.note }}
        </p>
      </div>
    </div>
</template>
