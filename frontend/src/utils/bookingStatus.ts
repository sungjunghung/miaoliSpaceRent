import type { RefundStatus } from '@/types/refund'

export interface StatusDisplay {
  label: string
  className: string
}

/** 前台退款狀態：不揭露內部簽核過程（承辦/會計/出納），只呈現退款中/退款完成/已駁回 */
export function getPortalRefundStatusDisplay(status: RefundStatus): StatusDisplay {
  if (status === 'completed') return { label: '退款完成', className: 'badge-success' }
  if (status === 'rejected') return { label: '已駁回', className: 'badge-error' }
  return { label: '退款中', className: 'badge-info' }
}

/** 訂單主狀態 → 標籤 + badge 顏色（admin 與 portal 共用） */
export function getBookingStatusDisplay(b: {
  status: string
  requireDocuments?: boolean
}): StatusDisplay {
  if (b.status === 'reserved') {
    return b.requireDocuments
      ? { label: '待上傳文件', className: 'badge-warning' }
      : { label: '待繳費',     className: 'badge-warning' }
  }
  return ({
    document_review:        { label: '文件審核中',  className: 'badge-info'    },
    documents_rejected:     { label: '文件退件',    className: 'badge-warning' },
    pending_payment:        { label: '等待繳費',    className: 'badge-warning' },
    payment_review:         { label: '繳費審核中',  className: 'badge-info'    },
    confirmed:              { label: '預訂成功',    className: 'badge-success' },
    completed:              { label: '已完成',      className: 'badge-neutral' },
    cancellation_requested: { label: '取消申請中',  className: 'badge-warning' },
    cancelled_expired:      { label: '逾期取消',    className: 'badge-error'   },
    cancelled_rejected:     { label: '退件取消',    className: 'badge-error'   },
    cancelled:              { label: '已取消',      className: 'badge-error'   },
  } as Record<string, StatusDisplay>)[b.status] ?? { label: b.status, className: 'badge-ghost' }
}

export const CANCELLED_STATUSES = ['cancelled', 'cancelled_expired', 'cancelled_rejected']

/** 後台待辦提示：這筆訂單目前卡在誰手上（訂單列表與詳情共用） */
export function getAdminTodoDisplay(
  booking: { status: string },
  refund?: { status: RefundStatus } | null,
): StatusDisplay | null {
  if (refund) {
    if (refund.status === 'completed') return { label: '取消退費已完成', className: 'badge-success' }
    if (refund.status === 'rejected') return { label: '退費已駁回', className: 'badge-error' }
    return {
      label: {
        admin_review: '退費待承辦審',
        accounting_review: '退費待會計',
        cashier_processing: '退費待出納',
      }[refund.status] ?? '退費處理中',
      className: 'badge-info',
    }
  }
  if (booking.status === 'cancellation_requested') return { label: '待審核取消', className: 'badge-warning' }
  if (booking.status === 'document_review') return { label: '需審核文件', className: 'badge-info' }
  if (booking.status === 'payment_review') return { label: '需審核繳費', className: 'badge-info' }
  if (booking.status === 'documents_rejected') return { label: '等待重傳', className: 'badge-error' }
  if (booking.status === 'pending_payment') return { label: '等待繳費', className: 'badge-warning' }
  if (booking.status === 'reserved') return { label: '等待用戶', className: 'badge-warning' }
  return null
}

/** 前台（Portal）簡化狀態顯示 */
export function getPortalStatusDisplay(status: string): StatusDisplay {
  if (['confirmed', 'cancellation_requested'].includes(status)) {
    return { label: '預訂成功', className: 'badge-success' }
  }
  if (status === 'completed') {
    return { label: '已完成', className: 'badge-neutral' }
  }
  if (CANCELLED_STATUSES.includes(status)) {
    return { label: '已取消', className: 'badge-error' }
  }
  return { label: '進行中', className: 'badge-warning' }
}
