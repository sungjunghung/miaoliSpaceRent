<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import BookingDetailContent from '@/components/admin/bookings/BookingDetailContent.vue'

const route = useRoute()
const bookingsStore = useBookingsStore()

const id = Number(route.params.id)
const booking = computed(() => bookingsStore.getById(id))
</script>

<template>
  <div v-if="booking" class="space-y-4 max-w-3xl mx-auto">
    <BookingDetailContent :booking="booking" />
  </div>

  <div v-else class="py-20 text-center text-base-content/40">
    找不到此預約紀錄
  </div>
</template>
