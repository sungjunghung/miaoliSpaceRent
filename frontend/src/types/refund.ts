export type RefundSourceType = 'booking_cancellation' | 'retained_deposit'
export type RefundStatus = 'admin_review' | 'accounting_review' | 'cashier_processing' | 'completed' | 'rejected'
export type RefundRole = 'admin' | 'accounting' | 'cashier'

export interface RefundBankAccount {
  bankName: string
  branchName: string
  accountName: string
  accountNumber: string
}

export interface RefundRequest {
  id: string
  type: RefundSourceType
  status: RefundStatus
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone: string
  bookingId: number | null
  amountRequested: number
  amountApproved: number | null
  reason: string
  requestedAt: string
  /** 管理員代會員發起取消退款時可能尚未取得帳戶資料，null 表示待補 */
  bankAccount: RefundBankAccount | null
  bankbookImage: string | null
  adminApprovedAt: string | null
  accountingApprovedAt: string | null
  cashierCompletedAt: string | null
  rejectedAt: string | null
  rejectedReason: string | null
  notes: string | null
  refundMethod?: 'transfer' | 'check' | null
}

export interface NewRetainedDepositRefund {
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone: string
  amount: number
  reason: string
  bankAccount: RefundBankAccount
}

export interface NewBookingCancellationRefund {
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone: string
  bookingId: number
  amount: number
  reason: string
  refundMethod: 'transfer' | 'check' | null
  bankAccount: RefundBankAccount | null
}
