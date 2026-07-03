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

/** 狀態語意色調：badge、前台膠囊、行事曆曆格共用同一套色調 */
export type BookingStatusTone = 'success' | 'warning' | 'info' | 'error' | 'neutral' | 'ghost'

export interface BookingStatusMeta {
  label: string
  tone: BookingStatusTone
}

/** 訂單主狀態 → 標籤 + 語意色調（所有狀態顯示的單一來源） */
export function getBookingStatusMeta(b: {
  status: string
  requireDocuments?: boolean
}): BookingStatusMeta {
  if (b.status === 'reserved') {
    return b.requireDocuments
      ? { label: '待上傳文件', tone: 'warning' }
      : { label: '待繳費',     tone: 'warning' }
  }
  return ({
    document_review:        { label: '文件審核中',  tone: 'info'    },
    documents_rejected:     { label: '文件退件',    tone: 'warning' },
    pending_payment:        { label: '等待繳費',    tone: 'warning' },
    payment_review:         { label: '繳費審核中',  tone: 'info'    },
    confirmed:              { label: '預訂成功',    tone: 'success' },
    completed:              { label: '已完成',      tone: 'neutral' },
    cancellation_requested: { label: '取消申請中',  tone: 'warning' },
    cancelled_expired:      { label: '逾期取消',    tone: 'error'   },
    cancelled_rejected:     { label: '退件取消',    tone: 'error'   },
    cancelled:              { label: '已取消',      tone: 'error'   },
  } as Record<string, BookingStatusMeta>)[b.status] ?? { label: b.status, tone: 'ghost' }
}

const BADGE_BY_TONE: Record<BookingStatusTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  info:    'badge-info',
  error:   'badge-error',
  neutral: 'badge-neutral',
  ghost:   'badge-ghost',
}

/** 訂單主狀態 → 標籤 + badge 顏色（admin 與 portal 共用） */
export function getBookingStatusDisplay(b: {
  status: string
  requireDocuments?: boolean
}): StatusDisplay {
  const meta = getBookingStatusMeta(b)
  return { label: meta.label, className: BADGE_BY_TONE[meta.tone] }
}

/** 前台訂單卡片的膠囊與左側色條（我的預約、預約詳情共用），色調與 badge 一致 */
const PILL_BY_TONE: Record<BookingStatusTone, { pill: string; borderCls: string }> = {
  success: { pill: 'bg-success/15 text-success',       borderCls: 'border-success'  },
  warning: { pill: 'bg-warning/15 text-warning',       borderCls: 'border-warning'  },
  info:    { pill: 'bg-info/15 text-info',             borderCls: 'border-info'     },
  error:   { pill: 'bg-error/15 text-error',           borderCls: 'border-error'    },
  neutral: { pill: 'bg-base-300 text-base-content/70', borderCls: 'border-base-300' },
  ghost:   { pill: 'bg-base-200 text-base-content/60', borderCls: 'border-base-300' },
}

export function getBookingStatusPill(b: {
  status: string
  requireDocuments?: boolean
}): { label: string; pill: string; borderCls: string } {
  const meta = getBookingStatusMeta(b)
  return { label: meta.label, ...PILL_BY_TONE[meta.tone] }
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

