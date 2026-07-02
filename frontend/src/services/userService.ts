import mockUsers from '@/mocks/users.json'

export type UserRecord = (typeof mockUsers)[number]

export const users = mockUsers

export function getUserById(id: string): UserRecord | undefined {
  return users.find(u => u.id === id)
}
