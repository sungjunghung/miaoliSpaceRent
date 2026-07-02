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
  bankAccount: RefundBankAccount
  bankbookImage: string | null
  adminApprovedAt: string | null
  accountingApprovedAt: string | null
  cashierCompletedAt: string | null
  rejectedAt: string | null
  rejectedReason: string | null
  notes: string | null
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
