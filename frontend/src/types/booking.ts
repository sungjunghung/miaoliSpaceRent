export interface RentalItemSelection {
  label: string
  unit: string
  amount: number
  quantity: number
}

export interface Remittance {
  last5: string
  amount: number
  datetime: string
  senderName: string
  note: string
  receiptImage?: string | null
}

export interface BookingDocument {
  key: string
  label: string
  required: boolean
  uploaded: boolean
  fileName?: string
  uploadedAt?: string
}

export type BookingStatus =
  | 'reserved'
  | 'document_review'
  | 'documents_rejected'
  | 'pending_payment'
  | 'payment_review'
  | 'confirmed'
  | 'completed'
  | 'cancellation_requested'
  | 'cancelled_expired'
  | 'cancelled_rejected'
  | 'cancelled'

export interface Booking {
  id: number
  reservationId: string
  userId?: string
  venueId: number
  rentalMode: 'daily' | 'session' | 'hourly'
  date: string
  startDate: string | null
  endDate: string | null
  session: string | null
  startTime: string | null
  endTime: string | null
  applicant: string
  purpose: string
  status: BookingStatus
  cancelDeadline?: string
  createdAt: string
  venueName: string
  venueLocation: string
  venueImage: string
  baseFee: number
  deposit: number
  additionalFees: RentalItemSelection[]
  totalPrice: number
  pricePerHour?: number
  pricePerDay?: number
  totalHours?: number
  rentalDays?: number
  peopleCount?: number
  note?: string | null
  adminNote?: string | null
  cancelReason?: string | null
  documentRejectReason?: string | null
  documentApprovedAt?: string | null
  paymentApprovedAt?: string | null
  remittance?: Remittance | null
  documents?: BookingDocument[]
  requireDocuments: boolean
  documentUploadDeadline?: string
  receiptUploadDeadline?: string
  documentUploadDeadlineDays?: number
  receiptUploadDeadlineDays?: number
}
