<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const ALERT_CLASSES: Record<string, string> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
}
</script>

<template>
  <div v-if="toasts.length" class="toast toast-end toast-bottom z-100">
    <div v-for="toast in toasts" :key="toast.id" class="alert shadow-lg" :class="ALERT_CLASSES[toast.type]">
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>
