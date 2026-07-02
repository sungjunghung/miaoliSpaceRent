import mockAdmins from '@/mocks/admins.json'

export type Admin = (typeof mockAdmins)[number]

export const admins = mockAdmins

export function getAdminById(id: string): Admin | undefined {
  return admins.find(a => a.id === id)
}
