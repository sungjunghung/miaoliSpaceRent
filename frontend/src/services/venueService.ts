import mockVenues from '@/mocks/venues.json'

export type Venue = (typeof mockVenues)[number]

export const venues = mockVenues

export function getVenueById(id: number): Venue | undefined {
  return venues.find(v => v.id === id)
}
