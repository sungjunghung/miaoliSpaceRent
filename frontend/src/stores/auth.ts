import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mockUsers from '../mocks/users.json'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  retainedDeposit?: number
  identityType?: string
  identityDocument?: string
  provider?: 'email' | 'google' | 'line'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => user.value !== null)

  function login(email: string, password: string): boolean {
    const found = mockUsers.find(u => u.email === email && u.password === password)
    if (!found) return false
    const { password: _, ...safeUser } = found
    user.value = safeUser as User
    return true
  }

  function logout() {
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
})
