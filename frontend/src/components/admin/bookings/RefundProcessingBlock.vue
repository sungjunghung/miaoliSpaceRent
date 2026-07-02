<script setup lang="ts">
import { computed } from 'vue'
import type { Booking } from '@/stores/bookings'
import {
  REFUND_STATUS_LABELS,
  REFUND_STEPS,
  REFUND_TYPE_LABELS,
  getRefundStepState,
  useRefundsStore,
} from '@/stores/refunds'

const props = defineProps<{
  booking: Booking
}>()

const refundsStore = useRefundsStore()

const centralizedRefund = computed(() =>
  refundsStore.refunds.find(refund =>
    refund.type === 'booking_cancellation' &&
    refund.bookingId === props.booking.id
  ) ?? null
)

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return date.replaceAll('-', '/')
}
</script>

<template>
  <div class="space-y-4">
    <!-- 取消申請屬於預約生命週期；退款簽核已集中到退款作業。 -->
    <div v-if="booking.status === 'cancellation_requested'" role="alert" class="alert alert-warning">
      <span class="material-symbols-outlined text-base">event_busy</span>
      <div>
        <h3 class="font-bold">用戶申請取消預約</h3>
        <div v-if="booking.cancelReason">取消原因：{{ booking.cancelReason }}</div>
        <p class="text-base-content/60">取消審核屬於預約管理；核准後的退款金額核定與撥款統一至退款作業處理。</p>
      </div>
    </div>

    <div v-if="centralizedRefund" class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 class="font-bold text-base flex items-center gap-2">
              <span class="material-symbols-outlined">request_quote</span>
              退款摘要
            </h3>
            <p class="text-sm text-base-content/60 mt-1">退款簽核已集中管理，此處僅顯示目前狀態。</p>
          </div>
          <router-link
            :to="{ name: 'admin-refunds', query: { refundId: centralizedRefund.id } }"
            class="btn btn-primary btn-sm"
          >
            <span class="material-symbols-outlined text-base">open_in_new</span>
            前往退款作業
          </router-link>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge badge-outline">{{ centralizedRefund.id }}</span>
          <span class="badge badge-outline">{{ REFUND_TYPE_LABELS[centralizedRefund.type] }}</span>
          <span :class="['badge', REFUND_STATUS_LABELS[centralizedRefund.status].className]">
            {{ REFUND_STATUS_LABELS[centralizedRefund.status].label }}
          </span>
        </div>

        <ul v-if="centralizedRefund.status !== 'rejected'" class="steps steps-horizontal w-full">
          <li
            v-for="step in REFUND_STEPS"
            :key="step.key"
            class="step"
            :class="{
              'step-success': getRefundStepState(centralizedRefund.status, step.key) === 'done',
              'step-warning': getRefundStepState(centralizedRefund.status, step.key) === 'active',
            }"
          >
            {{ step.label }}
          </li>
        </ul>

        <div v-else class="alert alert-error alert-soft">
          <span class="material-symbols-outlined">cancel</span>
          <span>{{ centralizedRefund.rejectedReason ?? '此退款申請已駁回。' }}</span>
        </div>

        <table class="table">
          <tbody>
            <tr>
              <td class="text-base-content/50 w-32">申請金額</td>
              <td class="font-semibold">NT$ {{ centralizedRefund.amountRequested.toLocaleString() }}</td>
            </tr>
            <tr v-if="centralizedRefund.amountApproved">
              <td class="text-base-content/50">核定金額</td>
              <td class="font-semibold text-success">NT$ {{ centralizedRefund.amountApproved.toLocaleString() }}</td>
            </tr>
            <tr>
              <td class="text-base-content/50">申請日期</td>
              <td>{{ formatDate(centralizedRefund.requestedAt) }}</td>
            </tr>
            <tr>
              <td class="text-base-content/50">退款原因</td>
              <td>{{ centralizedRefund.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
