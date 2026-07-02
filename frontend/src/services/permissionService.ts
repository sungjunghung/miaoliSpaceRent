import mockPermissionGroups from '@/mocks/permissionGroups.json'

export type PermissionGroup = (typeof mockPermissionGroups)[number]

export const permissionGroups = mockPermissionGroups
