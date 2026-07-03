import { reactive } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = reactive<ToastItem[]>([])
let seq = 0

export function useToast() {
  function showToast(message: string, type: ToastItem['type'] = 'success') {
    const id = ++seq
    toasts.push({ id, message, type })
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id)
      if (index !== -1) toasts.splice(index, 1)
    }, 2500)
  }

  return { toasts, showToast }
}
