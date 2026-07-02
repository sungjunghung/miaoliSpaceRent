<script setup lang="ts">
import { computed } from 'vue'
import type { Booking } from '../../stores/bookings'

const props = defineProps<{
  booking: Booking
  compact?: boolean
}>()

const STEPS_WITH_DOCS = [
  { label: '建立預約' },
  { label: '文件審核' },
  { label: '繳費確認' },
  { label: '預約成立' },
]

const STEPS_WITHOUT_DOCS = [
  { label: '建立預約' },
  { label: '繳費確認' },
  { label: '預約成立' },
]

const hasDocumentPhase = computed(() => props.booking.requireDocuments)
const steps = computed(() => hasDocumentPhase.value ? STEPS_WITH_DOCS : STEPS_WITHOUT_DOCS)

// currentStep > steps.length → 全部 done
const STATUS_STEP_WITH_DOCS: Record<string, number> = {
  reserved: 2,  // 建立預約 done → 文件審核 active（等待上傳）
  document_review: 2,  // 文件審核 active
  documents_rejected: 2,  // 文件審核 active-error
  pending_payment: 3,  // 繳費確認 active（等待上傳）
  payment_review: 3,  // 繳費確認 active（審核中）
  confirmed: 5,  // 全部 done（預約成立）
  completed: 5,  // 全部 done（已使用）
  cancellation_requested: 5,  // 全部 done（申請取消中，預約曾成立）
  cancelled_expired: 3,  // 繳費確認 cancelled-here（逾期未繳費）
  cancelled_rejected: 2,  // 文件審核 cancelled-here（退件後未補件）
  cancelled: 4,  // 預約成立 cancelled-here（繳費後取消）
}

const STATUS_STEP_WITHOUT_DOCS: Record<string, number> = {
  reserved: 2,          // 建立預約 done → 繳費確認 active（等待上傳）
  pending_payment: 2,
  payment_review: 2,
  confirmed: 4,  // 全部 done
  completed: 4,
  cancellation_requested: 4,
  cancelled_expired: 2,  // 繳費確認 cancelled-here
  cancelled_rejected: 2,  // 繳費確認 cancelled-here（不需文件但意外出現此狀態）
  cancelled: 3,  // 預約成立 cancelled-here
}

const CANCELLED_STATUSES = new Set(['cancelled_expired', 'cancelled_rejected', 'cancelled'])
const isCancelled = computed(() => CANCELLED_STATUSES.has(props.booking.status))
const isRejected = computed(() => props.booking.status === 'documents_rejected')

const currentStep = computed(() => {
  const map = hasDocumentPhase.value ? STATUS_STEP_WITH_DOCS : STATUS_STEP_WITHOUT_DOCS
  return map[props.booking.status] ?? 1
})

// 'done' | 'active' | 'active-error' | 'cancelled-here' | 'future'
function getStepState(index: number) {
  const step = index + 1
  if (isCancelled.value) {
    if (step < currentStep.value) return 'done'
    if (step === currentStep.value) return 'cancelled-here'
    return 'future'
  }
  if (step < currentStep.value) return 'done'
  if (step === currentStep.value) return isRejected.value ? 'active-error' : 'active'
  return 'future'
}

const STATUS_MESSAGES: Record<string, { text: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
  reserved: { text: '您的預約已獲得受理，請盡快完成所需作業。', type: 'info' },
  document_review: { text: '文件審核中，請耐心等候，審核通過後將通知您進行繳費。', type: 'info' },
  documents_rejected: { text: '文件審核未通過，請查看退件原因並於期限內重新上傳。', type: 'error' },
  payment_review: { text: '繳費審核中，請耐心等候管理員核對。', type: 'info' },
  confirmed: { text: '繳費確認完成，預約已正式成立，祝您活動順利！', type: 'success' },
  completed: { text: '租借已結束，感謝您的使用！', type: 'success' },
  cancellation_requested: { text: '取消申請已送出，等待承辦人員審核。', type: 'warning' },
  cancelled_expired: { text: '逾期未完成必要程序，預約已自動取消。', type: 'error' },
  cancelled_rejected: { text: '文件審核未通過，且未於期限內重新上傳，預約已取消。', type: 'error' },
  cancelled: { text: '預約已取消。', type: 'error' },
}

const statusMsg = computed(() => {
  if (props.booking.status === 'pending_payment') {
    const msg = hasDocumentPhase.value
      ? '文件審核已通過，請完成匯款並上傳繳費證明。'
      : '請完成匯款並上傳繳費證明，以利後續審核。'
    return { text: msg, type: 'warning' as const }
  }
  return STATUS_MESSAGES[props.booking.status]
})
function stepIcon(index: number): string | undefined {
  const state = getStepState(index)
  if (state === 'done') return 'check'
  if (state === 'cancelled-here') return 'close'
  if (state === 'active' || state === 'active-error') {
    const s = props.booking.status
    if (s === 'documents_rejected') return 'priority_high'
    if (s === 'document_review' || s === 'payment_review') return 'hourglass_top'
    return 'upload'
  }
  return undefined
}
</script>

<template>
  <!-- Steps -->
  <ul :class="['steps w-full', compact ? 'text-xs' : 'text-sm']">
    <li v-for="(step, i) in steps" :key="i" class="step" :class="{
      'step-success': getStepState(i) === 'done',
      'step-warning': getStepState(i) === 'active' && (booking.status === 'document_review' || booking.status === 'payment_review'),
      'step-error': getStepState(i) === 'active-error' || getStepState(i) === 'cancelled-here',
    }">
      <span v-if="stepIcon(i)" class="step-icon material-symbols-outlined" style="font-size:16px;">{{ stepIcon(i)
      }}</span>
      {{ (i === steps.length - 1 && isCancelled) ? '預約中止' : step.label }}
    </li>
  </ul>

  <!-- 狀態訊息（full 版才顯示）-->
  <div v-if="!compact && statusMsg" class="mt-3 space-y-2">
    <div class="alert py-2 text-sm " :class="{
      'alert-info': statusMsg.type === 'info',
      'alert-success': statusMsg.type === 'success',
      'alert-warning': statusMsg.type === 'warning',
      'alert-error': statusMsg.type === 'error',
    }">{{ statusMsg.text }}</div>

    <!-- <div
      v-if="(booking.status === 'documents_rejected' || booking.status === 'cancelled_rejected') && booking.documentRejectReason"
      class="alert alert-error py-2 text-sm gap-2">
      <span class="material-symbols-outlined text-base shrink-0">info</span>
      <span>退件原因：{{ booking.documentRejectReason }}</span>
    </div> -->

    <div v-if="isCancelled && booking.cancelReason && booking.status !== 'cancelled_rejected'"
      class="alert alert-error py-2 text-sm">{{ booking.cancelReason }}</div>
  </div>
</template>
