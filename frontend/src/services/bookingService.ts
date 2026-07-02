import generatedBookings from '@/mocks/generateBookings'

export type RawBooking = (typeof generatedBookings)[number]

export const rawBookings = generatedBookings
