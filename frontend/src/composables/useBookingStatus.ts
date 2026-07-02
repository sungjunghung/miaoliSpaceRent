import type { RefundStatus } from '../stores/bookings'

export interface StatusDisplay {
  label: string
  className: string
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

/** 退費流程狀態 → 標籤 + badge 顏色 */
export const REFUND_STATUS_LABELS: Record<RefundStatus, StatusDisplay> = {
  none:               { label: '無',       className: 'badge-ghost'   },
  admin_review:       { label: '承辦初審', className: 'badge-warning' },
  accounting_review:  { label: '會計核定', className: 'badge-info'    },
  cashier_processing: { label: '出納撥款', className: 'badge-accent'  },
  completed:          { label: '退款完成', className: 'badge-success' },
}

/** 退費流程步驟定義（用於 steps UI） */
export const REFUND_STEPS: { key: RefundStatus; label: string }[] = [
  { key: 'admin_review',       label: '承辦初審' },
  { key: 'accounting_review',  label: '會計核定' },
  { key: 'cashier_processing', label: '出納撥款' },
  { key: 'completed',          label: '退款完成' },
]

/** 計算退費步驟狀態：'done' | 'active' | 'future' */
export function getRefundStepState(currentStatus: RefundStatus, stepKey: RefundStatus): string {
  const order: RefundStatus[] = ['admin_review', 'accounting_review', 'cashier_processing', 'completed']
  const currentIdx = order.indexOf(currentStatus)
  const stepIdx = order.indexOf(stepKey)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return stepKey === 'completed' ? 'done' : 'active'
  return 'future'
}

/** 退費類型標籤 */
export const REFUND_TYPE_LABELS: Record<string, string> = {
  cancellation: '取消退費',
}

export const CANCELLED_STATUSES = ['cancelled', 'cancelled_expired', 'cancelled_rejected']

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
