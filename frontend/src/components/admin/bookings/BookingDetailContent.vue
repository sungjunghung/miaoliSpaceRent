<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Booking } from '@/stores/bookings'
import { useRefundsStore } from '@/stores/refunds'
import { getBookingStatusDisplay, getAdminTodoDisplay, CANCELLED_STATUSES } from '@/utils/bookingStatus'
import { users as mockUsers } from '@/services/userService'

import RefundProcessingBlock from './RefundProcessingBlock.vue'
import BookingInfoBlock from './BookingInfoBlock.vue'
import ApplicantInfoBlock from './ApplicantInfoBlock.vue'
import DocumentReviewBlock from './DocumentReviewBlock.vue'
import FeeDetailsBlock from './FeeDetailsBlock.vue'
import PaymentReviewBlock from './PaymentReviewBlock.vue'
import AdminNoteBlock from './AdminNoteBlock.vue'
import ScheduleEditModal from './ScheduleEditModal.vue'
import CancelBookingModal from './CancelBookingModal.vue'

const props = defineProps<{
  booking: Booking
}>()

const member = computed(() =>
  props.booking.userId ? mockUsers.find(user => user.id === props.booking.userId) : null
)

const refundsStore = useRefundsStore()
const statusDisplay = computed(() => getBookingStatusDisplay(props.booking))
const todoDisplay = computed(() => getAdminTodoDisplay(
  props.booking,
  refundsStore.refunds.find(r => r.type === 'booking_cancellation' && r.bookingId === props.booking.id),
))
const isCancelled = computed(() => CANCELLED_STATUSES.includes(props.booking.status))

const scheduleEditModal = ref<InstanceType<typeof ScheduleEditModal> | null>(null)
const cancelBookingModal = ref<InstanceType<typeof CancelBookingModal> | null>(null)

// 可取消 = 租借開始日前一天為止 + 非已完成/已取消
const today = new Date().toISOString().slice(0, 10)
const cancellable = computed(() => {
  const start = props.booking.startDate ?? props.booking.date
  if (start <= today) return false
  return !['completed', 'cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(props.booking.status)
})
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- 狀態列：訂單狀態 + 待辦提示 + 取消操作 -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge" :class="statusDisplay.className">{{ statusDisplay.label }}</span>
      <span v-if="todoDisplay" class="badge badge-outline" :class="todoDisplay.className">{{ todoDisplay.label }}</span>
      <button v-if="cancellable" class="btn btn-error btn-outline btn-sm ml-auto" @click="cancelBookingModal?.openModal()">
        <span class="material-symbols-outlined text-base">event_busy</span>
        {{ booking.status === 'cancellation_requested' ? '核准取消' : '取消訂單' }}
      </button>
    </div>

    <!-- 已取消：顯示取消原因 -->
    <div v-if="isCancelled" role="alert" class="alert alert-error alert-soft">
      <span class="material-symbols-outlined text-base shrink-0">event_busy</span>
      <span>此訂單已取消{{ booking.cancelReason ? `，原因：${booking.cancelReason}` : '' }}</span>
    </div>

    <!-- 取消/退款摘要；實際退款作業集中於退款作業頁 -->
    <RefundProcessingBlock :booking="booking" />

    <!-- 場館 + 時間 -->
    <BookingInfoBlock :booking="booking" @editSchedule="scheduleEditModal?.openModal()" />

    <!-- 申請人 / 會員 -->
    <ApplicantInfoBlock :booking="booking" :member="member" />

    <!-- 申請文件 -->
    <DocumentReviewBlock :booking="booking" />

    <!-- 費用明細 -->
    <FeeDetailsBlock :booking="booking" />

    <!-- 匯款資訊 / 繳費狀態 -->
    <PaymentReviewBlock :booking="booking" />

    <!-- 管理員備注 -->
    <AdminNoteBlock :booking="booking" />

    <!-- 日期/時段異動 Modal -->
    <ScheduleEditModal ref="scheduleEditModal" :booking="booking" />

    <!-- 取消訂單 Modal -->
    <CancelBookingModal ref="cancelBookingModal" :booking="booking" />
  </div>
</template>
