import identityTypes from '@/mocks/identityTypes.json'

export interface IdentityType {
  id: string
  name: string
  requiresDocument: boolean
  isDefault: boolean
}

export const IDENTITY_TYPES = identityTypes as IdentityType[]

// 註冊預設身份別（一般民眾）
export const DEFAULT_IDENTITY_TYPE_ID =
  IDENTITY_TYPES.find(t => t.isDefault)?.id ?? IDENTITY_TYPES[0].id

export function getIdentityType(id?: string): IdentityType | undefined {
  return IDENTITY_TYPES.find(t => t.id === (id || DEFAULT_IDENTITY_TYPE_ID))
}

export function identityName(id?: string): string {
  return getIdentityType(id)?.name ?? getIdentityType(DEFAULT_IDENTITY_TYPE_ID)!.name
}

// general 以外才需要證明文件；由資料驅動，不再寫死判斷
export function identityRequiresDocument(id?: string): boolean {
  return getIdentityType(id)?.requiresDocument ?? false
}
