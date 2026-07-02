import mockRefunds from '@/mocks/refunds.json'
import { rawBookings } from '@/services/bookingService'
import { users } from '@/services/userService'
import type { RefundRequest } from '@/types/refund'

const handWritten = mockRefunds as unknown as RefundRequest[]
const coveredBookingIds = new Set(
  handWritten.filter(r => r.bookingId != null).map(r => r.bookingId),
)

const MOCK_BANKS = [
  { bankName: '台灣銀行', branchName: '苗栗分行' },
  { bankName: '土地銀行', branchName: '頭份分行' },
  { bankName: '合作金庫', branchName: '竹南分行' },
]

// 由 mock 訂單的內嵌退款資料衍生 RefundRequest，與 refunds.json 合併為單一來源
const derived: RefundRequest[] = rawBookings
  .filter(b => b.refund && !coveredBookingIds.has(b.id))
  .map(b => {
    const r = b.refund!
    const status = r.status as RefundRequest['status']
    const user = users.find(u => u.id === b.userId)
    const bank = MOCK_BANKS[b.id % MOCK_BANKS.length]
    const approved = ['accounting_review', 'cashier_processing', 'completed'].includes(status)
    return {
      id: `RF-2026-${String(1000 + b.id)}`,
      type: 'booking_cancellation',
      status,
      memberId: b.userId,
      memberName: b.applicant,
      memberEmail: user?.email ?? '',
      memberPhone: user?.phone ?? '',
      bookingId: b.id,
      amountRequested: r.amount,
      amountApproved: approved ? r.amount : null,
      reason: r.reason,
      requestedAt: r.requestedAt ?? b.createdAt,
      bankAccount: {
        ...bank,
        accountName: b.applicant,
        accountNumber: String(56800000000 + b.id * 9973),
      },
      bankbookImage: r.bankbookImage,
      adminApprovedAt: r.adminApprovedAt,
      accountingApprovedAt: r.accountingApprovedAt,
      cashierCompletedAt: r.completedAt,
      rejectedAt: null,
      rejectedReason: null,
      notes: null,
      refundMethod: (r.refundMethod as RefundRequest['refundMethod']) ?? null,
    }
  })

export const refundRecords: RefundRequest[] = [...handWritten, ...derived]
