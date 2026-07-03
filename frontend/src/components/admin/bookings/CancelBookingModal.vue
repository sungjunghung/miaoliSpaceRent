<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBookingsStore, type Booking } from '@/stores/bookings'
import { useRefundsStore } from '@/stores/refunds'
import { users as mockUsers } from '@/services/userService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  booking: Booking
  /** 只發起退款，不執行取消（給已取消但當時未建退款單的訂單） */
  refundOnly?: boolean
}>()

const bookingsStore = useBookingsStore()
const refundsStore = useRefundsStore()
const { showToast } = useToast()

const modalOpen = ref(false)
const cancelReason = ref('')
const needRefund = ref<'yes' | 'no'>('yes')
const refundAmount = ref(0)
const refundMethod = ref<'transfer' | 'check'>('transfer')
const bankName = ref('')
const branchName = ref('')
const accountName = ref('')
const accountNumber = ref('')

// 已上傳匯款證明即視為可能已付款（款項或已匯出），一律進入退款詢問
const isPaid = computed(() => !!props.booking.remittance || !!props.booking.paymentApprovedAt)

// 防呆：同一訂單已有退款單就不再建第二張
const existingRefund = computed(() =>
  refundsStore.refunds.find(r => r.type === 'booking_cancellation' && r.bookingId === props.booking.id) ?? null
)

const askRefund = computed(() => isPaid.value && !existingRefund.value)

const showRefundFields = computed(() =>
  props.refundOnly || (askRefund.value && needRefund.value === 'yes')
)

const canConfirm = computed(() => {
  if (!cancelReason.value.trim()) return false
  if (showRefundFields.value && refundAmount.value <= 0) return false
  return true
})

function openModal() {
  cancelReason.value = props.refundOnly || props.booking.status === 'cancellation_requested'
    ? (props.booking.cancelReason ?? '')
    : ''
  needRefund.value = 'yes'
  refundAmount.value = props.booking.totalPrice
  refundMethod.value = 'transfer'
  bankName.value = ''
  branchName.value = ''
  accountName.value = ''
  accountNumber.value = ''
  modalOpen.value = true
}

function confirmCancel() {
  if (!canConfirm.value) return

  if (showRefundFields.value && !existingRefund.value) {
    const member = props.booking.userId ? mockUsers.find(u => u.id === props.booking.userId) : null
    const hasBankInput = bankName.value.trim() && accountName.value.trim() && accountNumber.value.trim()
    refundsStore.createBookingCancellationRefund({
      memberId: props.booking.userId ?? '',
      memberName: props.booking.applicant,
      memberEmail: member?.email ?? '',
      memberPhone: member?.phone ?? '',
      bookingId: props.booking.id,
      amount: refundAmount.value,
      reason: cancelReason.value.trim(),
      refundMethod: refundMethod.value,
      bankAccount: hasBankInput
        ? {
            bankName: bankName.value.trim(),
            branchName: branchName.value.trim(),
            accountName: accountName.value.trim(),
            accountNumber: accountNumber.value.trim(),
          }
        : null,
    })
  }

  if (!props.refundOnly) {
    bookingsStore.cancelBooking(props.booking.id, cancelReason.value.trim())
    showToast(askRefund.value && needRefund.value === 'yes' ? '訂單已取消，退款單已建立' : '訂單已取消')
  } else {
    showToast('退款單已建立')
  }
  modalOpen.value = false
}

defineExpose({ openModal })
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': modalOpen }">
    <div class="modal-box max-w-md">
      <h3 class="font-bold mb-1">{{ refundOnly ? '發起退款' : '取消訂單' }}</h3>
      <p class="text-sm text-base-content/60 mb-4">{{ booking.reservationId }}・{{ booking.venueName }}</p>

      <fieldset class="fieldset mb-3">
        <legend class="fieldset-legend">{{ refundOnly ? '退款原因（必填）' : '取消原因（必填）' }}</legend>
        <textarea v-model="cancelReason" class="textarea textarea-bordered w-full" rows="2"
          :placeholder="refundOnly ? '例：會員申訴成功，補發退款⋯' : '例：場館臨時維修、會員來電要求取消⋯'"></textarea>
      </fieldset>

      <template v-if="!refundOnly">
        <!-- 未付款：直接取消 -->
        <div v-if="!isPaid" class="alert alert-soft alert-info py-2 mb-3">
          <span class="material-symbols-outlined text-base">info</span>
          <span>此訂單尚未繳費，取消後不需退款。</span>
        </div>

        <!-- 已有退款單：不再重複建立 -->
        <div v-else-if="existingRefund" class="alert alert-soft alert-warning py-2 mb-3">
          <span class="material-symbols-outlined text-base">request_quote</span>
          <span>此訂單已有退款單（{{ existingRefund.id }}），取消後請至退款作業處理。</span>
        </div>

        <!-- 已付款：詢問是否退款 -->
        <template v-else>
          <div v-if="!booking.paymentApprovedAt" class="alert alert-soft alert-warning py-2 mb-3">
            <span class="material-symbols-outlined text-base">warning</span>
            <span>此訂單已上傳匯款證明但尚未核准，款項可能已匯出，請先確認是否入帳。</span>
          </div>

          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">是否退款</legend>
            <div class="flex gap-4">
              <label class="label cursor-pointer gap-2">
                <input v-model="needRefund" type="radio" value="yes" class="radio radio-sm radio-primary" />
                <span>建立退款單</span>
              </label>
              <label class="label cursor-pointer gap-2">
                <input v-model="needRefund" type="radio" value="no" class="radio radio-sm" />
                <span>不退款</span>
              </label>
            </div>
          </fieldset>
        </template>
      </template>

      <template v-if="showRefundFields">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">申請金額</legend>
              <input v-model.number="refundAmount" type="number" min="1" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">退款方式</legend>
              <select v-model="refundMethod" class="select select-bordered w-full">
                <option value="transfer">匯款退款</option>
                <option value="check">支票退款</option>
              </select>
            </fieldset>
          </div>
          <p class="text-xs text-base-content/50 mb-2">
            預設帶入已繳總額（含保證金），可依規定調整；實際核定金額由承辦初審時決定。
          </p>

          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">受款帳戶（可留空，由承辦後續向會員取得）</legend>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="bankName" type="text" class="input input-bordered w-full" placeholder="銀行" />
              <input v-model="branchName" type="text" class="input input-bordered w-full" placeholder="分行" />
              <input v-model="accountName" type="text" class="input input-bordered w-full" placeholder="戶名" />
              <input v-model="accountNumber" type="text" class="input input-bordered w-full" placeholder="帳號" />
            </div>
          </fieldset>
      </template>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="modalOpen = false">返回</button>
        <button class="btn btn-error" :disabled="!canConfirm" @click="confirmCancel">
          {{ refundOnly ? '確認發起退款' : '確認取消訂單' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalOpen = false"></form>
  </dialog>
</template>
