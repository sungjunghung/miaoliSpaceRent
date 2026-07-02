import type { Booking } from '@/stores/bookings'

export const SESSION_LABELS: Record<string, string> = {
  morning: '上午場',
  afternoon: '下午場',
  evening: '晚間場',
}

export const SESSION_LABELS_LONG: Record<string, string> = {
  morning: '上午場（08:00–12:00）',
  afternoon: '下午場（13:00–17:00）',
  evening: '晚間場（18:00–22:00）',
}

export const RENTAL_MODE_LABELS: Record<string, string> = {
  daily: '全日租借',
  session: '場次租借',
  hourly: '計時租借',
}

export const RENTAL_MODE_LABELS_SHORT: Record<string, string> = {
  daily: '全日',
  session: '場次',
  hourly: '計時',
}

export function toZhDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

export function toZhTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '上午' : '下午'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
}

/** 格式化預約日期。short=true 輸出 yyyy-mm-dd，false 輸出中文年月日 */
export function formatBookingDate(b: Booking, short = false): string {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return short
        ? `${b.startDate} ~ ${b.endDate}`
        : `${toZhDate(b.startDate)} 至 ${toZhDate(b.endDate)}`
    }
    const d = b.startDate ?? b.date
    return short ? d : toZhDate(d)
  }
  if (b.session) {
    return short ? b.date : toZhDate(b.date)
  }
  if (b.startTime && b.endTime) {
    return short ? b.date : toZhDate(b.date)
  }
  return short ? b.date : toZhDate(b.date)
}

/** 格式化預約時間段（不含日期） */
export function formatBookingTime(b: Booking): string {
  if (b.startTime && b.endTime) return `${toZhTime(b.startTime)} 至 ${toZhTime(b.endTime)}`
  if (b.session) return SESSION_LABELS[b.session] ?? b.session
  return '全天'
}
