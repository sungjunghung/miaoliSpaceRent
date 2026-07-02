export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  retainedDeposit?: number
  provider?: 'email' | 'google' | 'line'
}
