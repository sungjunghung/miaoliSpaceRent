import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { refundRecords as mockRefunds } from '@/services/refundService'

import type { RefundSourceType, RefundStatus, RefundRole, RefundRequest, NewRetainedDepositRefund, NewBookingCancellationRefund } from '@/types/refund'

export type {
  RefundSourceType,
  RefundStatus,
  RefundRole,
  RefundBankAccount,
  RefundRequest,
  NewRetainedDepositRefund,
  NewBookingCancellationRefund,
} from '@/types/refund'

export const REFUND_TYPE_LABELS: Record<RefundSourceType, string> = {
  booking_cancellation: '訂單取消退款',
  retained_deposit: '預留保證金退款',
}

export const REFUND_STATUS_LABELS: Record<RefundStatus, { label: string; className: string; roleLabel: string }> = {
  admin_review: { label: '承辦初審', className: 'badge-warning', roleLabel: '承辦' },
  accounting_review: { label: '會計核定', className: 'badge-info', roleLabel: '會計' },
  cashier_processing: { label: '出納撥款', className: 'badge-accent', roleLabel: '出納' },
  completed: { label: '退款完成', className: 'badge-success', roleLabel: '已完成' },
  rejected: { label: '已駁回', className: 'badge-error', roleLabel: '已結案' },
}

export const REFUND_STEPS: Array<{ key: Exclude<RefundStatus, 'rejected'>; label: string }> = [
  { key: 'admin_review', label: '承辦初審' },
  { key: 'accounting_review', label: '會計核定' },
  { key: 'cashier_processing', label: '出納撥款' },
  { key: 'completed', label: '退款完成' },
]

const STEP_ORDER = REFUND_STEPS.map(step => step.key)

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextRefundId(count: number): string {
  return `RF-2026-${String(count + 1).padStart(4, '0')}`
}

export function getRefundStepState(status: RefundStatus, stepKey: Exclude<RefundStatus, 'rejected'>) {
  if (status === 'rejected') return 'future'
  const currentIndex = STEP_ORDER.indexOf(status)
  const stepIndex = STEP_ORDER.indexOf(stepKey)
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return stepKey === 'completed' ? 'done' : 'active'
  return 'future'
}

export function refundTodoRole(status: RefundStatus): RefundRole | null {
  if (status === 'admin_review') return 'admin'
  if (status === 'accounting_review') return 'accounting'
  if (status === 'cashier_processing') return 'cashier'
  return null
}

export const useRefundsStore = defineStore('refunds', () => {
  const records = ref<RefundRequest[]>(mockRefunds as unknown as RefundRequest[])

  const refunds = computed(() => records.value)

  function getById(id: string): RefundRequest | undefined {
    return records.value.find(refund => refund.id === id)
  }

  function getByMemberId(memberId: string): RefundRequest[] {
    return records.value.filter(refund => refund.memberId === memberId)
  }

  function createRetainedDepositRefund(input: NewRetainedDepositRefund): RefundRequest {
    const refund: RefundRequest = {
      id: nextRefundId(records.value.length),
      type: 'retained_deposit',
      status: 'admin_review',
      memberId: input.memberId,
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      memberPhone: input.memberPhone,
      bookingId: null,
      amountRequested: input.amount,
      amountApproved: null,
      reason: input.reason,
      requestedAt: todayString(),
      bankAccount: input.bankAccount,
      bankbookImage: null,
      adminApprovedAt: null,
      accountingApprovedAt: null,
      cashierCompletedAt: null,
      rejectedAt: null,
      rejectedReason: null,
      notes: '由會員前台送出預留保證金退款申請。',
    }
    records.value.unshift(refund)
    return refund
  }

  function createBookingCancellationRefund(input: NewBookingCancellationRefund): RefundRequest {
    const refund: RefundRequest = {
      id: nextRefundId(records.value.length),
      type: 'booking_cancellation',
      status: 'admin_review',
      memberId: input.memberId,
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      memberPhone: input.memberPhone,
      bookingId: input.bookingId,
      amountRequested: input.amount,
      amountApproved: null,
      reason: input.reason,
      requestedAt: todayString(),
      bankAccount: input.bankAccount,
      bankbookImage: null,
      adminApprovedAt: null,
      accountingApprovedAt: null,
      cashierCompletedAt: null,
      rejectedAt: null,
      rejectedReason: null,
      notes: '由後台管理員取消訂單並發起退款。',
      refundMethod: input.refundMethod,
    }
    records.value.unshift(refund)
    return refund
  }

  function approveAdmin(id: string, approvedAmount: number) {
    const refund = getById(id)
    if (!refund) return
    refund.amountApproved = approvedAmount
    refund.status = 'accounting_review'
    refund.adminApprovedAt = todayString()
    refund.rejectedAt = null
    refund.rejectedReason = null
  }

  function approveAccounting(id: string) {
    const refund = getById(id)
    if (!refund) return
    refund.status = 'cashier_processing'
    refund.accountingApprovedAt = todayString()
  }

  function completeCashier(id: string) {
    const refund = getById(id)
    if (!refund) return
    refund.status = 'completed'
    refund.cashierCompletedAt = todayString()
  }

  function rejectRefund(id: string, reason: string) {
    const refund = getById(id)
    if (!refund) return
    refund.status = 'rejected'
    refund.rejectedAt = todayString()
    refund.rejectedReason = reason
  }

  return {
    refunds,
    getById,
    getByMemberId,
    createRetainedDepositRefund,
    createBookingCancellationRefund,
    approveAdmin,
    approveAccounting,
    completeCashier,
    rejectRefund,
  }
})
