<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
  openTo?: RouteLocationRaw
  maxWidthClass?: string
  bodyClass?: string
  ariaLabel?: string
}>(), {
  maxWidthClass: 'max-w-4xl',
  bodyClass: 'bg-base-200 min-h-[calc(100%-73px)]',
  ariaLabel: '關閉側邊欄',
})

const emit = defineEmits<{
  close: []
}>()

const isOpen = ref(false)
let openFrame = 0
let closeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  openFrame = requestAnimationFrame(() => {
    isOpen.value = true
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(openFrame)
  if (closeTimer) clearTimeout(closeTimer)
})

function requestClose() {
  if (!isOpen.value) return
  isOpen.value = false
  closeTimer = setTimeout(() => emit('close'), 220)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 pointer-events-none">
      <button
        class="absolute inset-0 bg-black/30 cursor-default pointer-events-auto transition-opacity duration-200 ease-out"
        :class="isOpen ? 'opacity-100' : 'opacity-0'"
        :aria-label="ariaLabel"
        @click="requestClose"
      ></button>

      <aside
        class="absolute inset-y-0 right-0 w-full bg-base-100 shadow-2xl overflow-y-auto pointer-events-auto transition-transform duration-200 ease-out"
        :class="[maxWidthClass, isOpen ? 'translate-x-0' : 'translate-x-full']"
      >
        <div class="sticky top-0 z-10 bg-base-100 border-b border-base-200 px-6 py-4 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p v-if="eyebrow" class="text-sm text-base-content/50">{{ eyebrow }}</p>
            <h2 class="font-bold text-xl truncate">{{ title }}</h2>
            <p v-if="subtitle" class="text-sm text-base-content/60 truncate">{{ subtitle }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <router-link v-if="openTo" :to="openTo" class="btn btn-ghost btn-sm">
              <span class="material-symbols-outlined text-base">open_in_new</span>
              開啟頁面
            </router-link>
            <button class="btn btn-ghost btn-circle" @click="requestClose">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div :class="bodyClass">
          <slot />
        </div>
      </aside>
    </div>
  </Teleport>
</template>
