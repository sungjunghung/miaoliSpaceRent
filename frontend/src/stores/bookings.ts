import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { rawBookings as mockBookings } from '@/services/bookingService'
import { venues as mockVenues } from '@/services/venueService'
import { publicImageUrl } from '@/utils/assets'
import type { Booking, RentalItemSelection } from '@/types/booking'

export type {
  RentalItemSelection,
  Remittance,
  BookingDocument,
  BookingStatus,
  Booking,
} from '@/types/booking'

function calcBaseFee(b: Omit<typeof mockBookings[0], 'refund'>, venue: typeof mockVenues[0] | undefined): number {
  if (!venue) return 0
  const pricing = venue.pricing as unknown as Record<string, Record<string, number | Record<string, number>>>
  const isWeekend = [0, 6].includes(new Date(b.date).getDay())
  const dayKey = isWeekend ? 'weekend' : 'weekday'

  if (b.rentalMode === 'daily') {
    const start = new Date(b.startDate ?? b.date)
    const end = new Date(b.endDate ?? b.date)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    return ((pricing.daily as Record<string, number>)?.[dayKey] ?? 0) * days
  }
  if (b.rentalMode === 'session' && b.session) {
    // Session prices are stored in rentalModes.session.sessions[], not pricing.session
    const sessions: any[] = (venue.rentalModes as any)?.session?.sessions ?? []
    const sd = sessions.find((s: any) => s.name === b.session)
    return sd?.[dayKey] ?? 0
  }
  if (b.rentalMode === 'hourly' && b.startTime && b.endTime) {
    const [sh, sm] = b.startTime.split(':').map(Number)
    const [eh, em] = b.endTime.split(':').map(Number)
    const hours = (eh * 60 + em - sh * 60 - sm) / 60
    return ((pricing.hourly as Record<string, number>)?.[dayKey] ?? 0) * hours
  }
  return 0
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const useBookingsStore = defineStore('bookings', () => {
  const bookings: Booking[] = reactive(mockBookings.map(({ refund: _refund, ...b }) => {
    const venue = mockVenues.find(v => v.id === b.venueId)
    const raw = b as any
    const baseFee = calcBaseFee(b, venue)
    const deposit: number = raw.deposit ?? 0
    const additionalFees: RentalItemSelection[] = raw.additionalFees ?? []
    const extraSum = additionalFees.reduce((s, f) => s + f.amount, 0)

    const sessionDef = b.rentalMode === 'session' && b.session
      ? (venue?.rentalModes?.session?.sessions ?? []).find((s: any) => s.name === b.session)
      : null

    return {
      ...b,
      startTime: b.startTime ?? (sessionDef as any)?.startTime ?? null,
      endTime: b.endTime ?? (sessionDef as any)?.endTime ?? null,
      reservationId: `BK-${String(b.id).padStart(6, '0')}`,
      rentalMode: b.rentalMode as Booking['rentalMode'],
      status: (() => {
        const s = raw.status ?? 'reserved'
        if (s === 'pending') return 'reserved'
        if (s === 'pending_documents') return 'reserved'
        if (s === 'documents_reviewing') return 'document_review'
        if (s === 'confirming') return 'payment_review'
        return s
      })() as Booking['status'],
      venueName: venue?.name ?? '',
      venueLocation: venue?.location ?? '',
      venueImage: publicImageUrl(venue?.mainImageUrl ?? ''),
      cancelDeadline: raw.cancelDeadline,
      peopleCount: raw.peopleCount,
      note: raw.note,
      adminNote: raw.adminNote,
      cancelReason: raw.cancelReason,
      remittance: raw.remittance ?? null,
      documentRejectReason: raw.documentRejectReason ?? null,
      documentApprovedAt: raw.documentApprovedAt ?? null,
      paymentApprovedAt: raw.paymentApprovedAt ?? null,
      documents: raw.documents ?? undefined,
      requireDocuments: (venue?.rentalModes as any)?.[b.rentalMode]?.requireDocuments ?? false,
      documentUploadDeadline: raw.documentUploadDeadline ?? addDays(b.createdAt, (venue as any)?.documentUploadDeadlineDays ?? 7),
      receiptUploadDeadline: raw.receiptUploadDeadline ?? addDays(b.createdAt, (venue as any)?.receiptUploadDeadlineDays ?? 3),
      documentUploadDeadlineDays: (venue as any)?.documentUploadDeadlineDays,
      receiptUploadDeadlineDays: (venue as any)?.receiptUploadDeadlineDays,
      baseFee,
      deposit,
      additionalFees,
      totalPrice: baseFee + deposit + extraSum,
      pricePerHour: b.rentalMode === 'hourly' ? (venue?.pricing?.hourly as any)?.weekday : undefined,
      pricePerDay: b.rentalMode === 'daily' ? (venue?.pricing?.daily as any)?.weekday : undefined,
      totalHours: b.startTime && b.endTime ? (() => {
        const [sh, sm] = b.startTime!.split(':').map(Number)
        const [eh, em] = b.endTime!.split(':').map(Number)
        return (eh * 60 + em - sh * 60 - sm) / 60
      })() : undefined,
      rentalDays: b.startDate && b.endDate
        ? Math.max(1, Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000) + 1)
        : undefined,
    }
  }))

  function getByUserId(userId: string): Booking[] {
    return bookings.filter(b => b.userId === userId)
  }

  function getById(id: number): Booking | undefined {
    return bookings.find(b => b.id === id)
  }

  function cancelBooking(id: number, reason: string) {
    const booking = getById(id)
    if (!booking) return
    booking.status = 'cancelled'
    booking.cancelReason = reason
  }

  function requestCancellation(id: number, reason: string) {
    const booking = getById(id)
    if (!booking) return
    booking.status = 'cancellation_requested'
    booking.cancelReason = reason
  }

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
  }

  function approveDocuments(id: number) {
    const booking = getById(id)
    if (!booking || booking.status !== 'document_review') return
    booking.status = 'pending_payment'
    booking.documentApprovedAt = todayStr()
    booking.documentRejectReason = null
  }

  function rejectDocuments(id: number, reason: string) {
    const booking = getById(id)
    if (!booking || booking.status !== 'document_review') return
    booking.status = 'documents_rejected'
    booking.documentRejectReason = reason
  }

  function approvePayment(id: number) {
    const booking = getById(id)
    if (!booking || booking.status !== 'payment_review') return
    booking.status = 'confirmed'
    booking.paymentApprovedAt = todayStr()
  }

  // 帳款不符退回：清除匯款資訊，回到等待繳費讓會員重新提交
  function rejectPayment(id: number) {
    const booking = getById(id)
    if (!booking || booking.status !== 'payment_review') return
    booking.status = 'pending_payment'
    booking.remittance = null
    booking.paymentApprovedAt = null
  }

  function updateAdminNote(id: number, note: string) {
    const booking = getById(id)
    if (!booking) return
    booking.adminNote = note.trim() || null
  }

  function updateSchedule(
    id: number,
    patch: Partial<Pick<Booking, 'date' | 'startDate' | 'endDate' | 'session' | 'startTime' | 'endTime'>>,
  ) {
    const booking = getById(id)
    if (!booking) return
    Object.assign(booking, patch)
  }

  return {
    bookings,
    getByUserId,
    getById,
    cancelBooking,
    requestCancellation,
    approveDocuments,
    rejectDocuments,
    approvePayment,
    rejectPayment,
    updateAdminNote,
    updateSchedule,
  }
})
