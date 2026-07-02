<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import Lenis from 'lenis'
import PortalHeader from '@/components/portal/PortalHeader.vue'
import PortalFooter from '@/components/portal/PortalFooter.vue'

let lenis: Lenis | null = null
let rafId: number | null = null

function raf(time: number) {
  lenis?.raf(time)
  rafId = requestAnimationFrame(raf)
}

onMounted(() => {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
  })
  ;(window as any).__lenis = lenis
  rafId = requestAnimationFrame(raf)
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  lenis?.destroy()
  lenis = null
  delete (window as any).__lenis
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base-200">
    <PortalHeader />
    <!-- 手機底部固定 dock 高度 5rem;統一在此預留,各頁不需各自處理 -->
    <main class="flex flex-1 flex-col min-h-0 pb-20 md:pb-0">
      <router-view />
    </main>
    <PortalFooter />
  </div>

</template>

<style scoped></style>
