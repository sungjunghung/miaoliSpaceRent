<template>
  <div class="mx-auto container max-w-4xl px-4 py-8 lg:py-12">
    <!-- 頁首(桌機;手機由頂部列顯示頁名) -->
    <header class="hidden lg:block mb-8">
      <p class="sport-eyebrow">MY BOOKINGS</p>
      <h1 class="mt-3 font-heading font-black text-4xl xl:text-5xl leading-none text-secondary">我的預約</h1>
      <p class="mt-3 text-base-content/60">查看預約紀錄、管理訂單與申請退費。</p>
    </header>

    <!-- 狀態篩選 -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button v-for="f in statusFilters" :key="f.value ?? 'all'" type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
        :class="selectedStatus === f.value
          ? 'bg-primary text-primary-content'
          : 'bg-base-100 border border-base-200 text-base-content/70 hover:border-primary/40'"
        @click="selectedStatus = f.value">
        {{ f.label }}
        <span class="text-xs" :class="selectedStatus === f.value ? 'opacity-80' : 'opacity-60'">{{ f.count }}</span>
      </button>
    </div>

    <!-- 空狀態 -->
    <div v-if="bookings.length === 0"
      class="rounded-box border border-base-200 bg-base-100 p-12 text-center shadow-sm">
      <span class="material-symbols-outlined text-5xl text-base-content/25">event_busy</span>
      <p class="mt-3 font-semibold">目前沒有預約紀錄</p>
      <router-link to="/venues" class="btn btn-primary btn-sm mt-5">前往租借場地</router-link>
    </div>

    <!-- 訂單列表 -->
    <section v-else class="space-y-4">
      <article v-for="booking in bookings" :key="booking.id"
        class="group cursor-pointer rounded-box border border-base-200 border-l-4 bg-base-100 shadow-sm transition-shadow hover:shadow-md"
        :class="statusBadge(booking).borderCls"
        @click="goToDetail(booking.id)">
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:gap-6 sm:p-6">
          <!-- 左:主要資訊 -->
          <div class="min-w-0 flex-1">
            <!-- 狀態列 -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusBadge(booking).pill">
                <span class="size-1.5 rounded-full bg-current"></span>{{ statusBadge(booking).label }}
              </span>
              <span v-if="activeStageLabel(booking)"
                class="rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium text-base-content/60">
                {{ activeStageLabel(booking) }}
              </span>
              <span v-if="booking.status === 'cancellation_requested'"
                class="rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium text-base-content/60">
                申請取消中
              </span>
              <span v-if="cancelReasonLabel(booking)"
                class="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                {{ cancelReasonLabel(booking) }}
              </span>
              <span class="ml-auto font-heading text-xs tracking-wider text-base-content/40">{{ booking.reservationId }}</span>
            </div>

            <!-- 場館名稱 -->
            <h2 class="mt-3 font-heading font-black text-xl sm:text-2xl leading-snug text-secondary">{{ booking.venueName }}</h2>

            <!-- 日期 / 時間 -->
            <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-base-content/60">
              <span class="inline-flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-base-content/40">calendar_today</span>
                {{ formatDate(booking) }}
              </span>
              <span v-if="booking.startTime && booking.endTime" class="inline-flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-base-content/40">schedule</span>
                {{ formatTime(booking) }}
              </span>
            </div>

            <!-- 取消期限 -->
            <p v-if="booking.status === 'confirmed' && booking.cancelDeadline && booking.cancelDeadline >= today"
              class="mt-2 inline-flex items-center gap-1.5 text-sm text-error">
              <span class="material-symbols-outlined text-base">event_busy</span>
              {{ toZhDate(booking.cancelDeadline) }} 前可申請取消
            </p>

            <!-- 預約進度 -->
            <div v-if="ACTIVE_STATUSES.includes(booking.status)"
              class="mt-4 rounded-box border border-base-200 bg-base-200/40 p-3">
              <BookingProgress :booking="booking" :compact="true" />
            </div>

            <!-- 階段截止 -->
            <div v-if="stageDeadline(booking)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
              <span class="material-symbols-outlined text-sm">schedule</span>
              {{ stageDeadline(booking) }}
            </div>
          </div>

          <!-- 右:金額 -->
          <div
            class="flex shrink-0 items-end justify-between border-t border-base-200 pt-4 sm:w-40 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pt-0 sm:pl-6">
            <span class="text-xs text-base-content/50 sm:mb-1">總金額</span>
            <div class="text-right">
              <p class="font-heading text-2xl font-bold leading-none text-base-content">NT$ {{ booking.totalPrice.toLocaleString() }}</p>
              <p v-if="booking.deposit" class="mt-1.5 text-xs text-base-content/50">含保證金 NT$ {{ booking.deposit.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useBookingsStore, type Booking } from '../../../stores/bookings'
import BookingProgress from '../../../components/portal/BookingProgress.vue'
import { toZhDate, formatBookingDate, formatBookingTime } from '../../../composables/useBookingFormat'

const router = useRouter()
const authStore = useAuthStore()
const bookingsStore = useBookingsStore()

const today = new Date().toISOString().slice(0, 10)

const allBookings = computed(() =>
  authStore.user ? bookingsStore.getByUserId(authStore.user.id) : []
)

const selectedStatus = ref<string | null>(null)

const ACTIVE_STATUSES = ['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review']
const CONFIRMED_STATUSES = ['confirmed', 'cancellation_requested']
const CANCELLED_STATUSES = ['cancelled', 'cancelled_expired', 'cancelled_rejected']

const bookings = computed(() => {
  const s = selectedStatus.value
  if (!s) return allBookings.value
  if (s === '__active') return allBookings.value.filter(b => ACTIVE_STATUSES.includes(b.status))
  if (s === '__confirmed') return allBookings.value.filter(b => CONFIRMED_STATUSES.includes(b.status))
  if (s === '__cancelled') return allBookings.value.filter(b => CANCELLED_STATUSES.includes(b.status))
  return allBookings.value.filter(b => b.status === s)
})

const statusFilters = computed(() => [
  { value: null, label: '全部', count: allBookings.value.length },
  { value: '__active', label: '預訂中', count: allBookings.value.filter(b => ACTIVE_STATUSES.includes(b.status)).length },
  { value: '__confirmed', label: '預訂成功', count: allBookings.value.filter(b => CONFIRMED_STATUSES.includes(b.status)).length },
  { value: 'completed', label: '已使用', count: allBookings.value.filter(b => b.status === 'completed').length },
  { value: '__cancelled', label: '已取消', count: allBookings.value.filter(b => CANCELLED_STATUSES.includes(b.status)).length },
])

function goToDetail(id: number) {
  router.push(`/member/bookings/${id}`)
}

// 狀態樣態:label=文字、pill=狀態膠囊配色、borderCls=左側色條;四種狀態一眼分清
function statusBadge(booking: Booking): { label: string; pill: string; borderCls: string } {
  if (ACTIVE_STATUSES.includes(booking.status))
    return { label: '預訂中', pill: 'bg-warning/15 text-warning', borderCls: 'border-warning' }
  if (booking.status === 'confirmed' || booking.status === 'cancellation_requested')
    return { label: '預訂成功', pill: 'bg-success/15 text-success', borderCls: 'border-success' }
  if (booking.status === 'completed')
    return { label: '已使用', pill: 'bg-base-300 text-base-content/70', borderCls: 'border-base-300' }
  if (CANCELLED_STATUSES.includes(booking.status))
    return { label: '已取消', pill: 'bg-error/15 text-error', borderCls: 'border-error' }
  return { label: booking.status, pill: 'bg-base-200 text-base-content/60', borderCls: 'border-base-300' }
}

function cancelReasonLabel(booking: Booking): string | null {
  if (booking.status === 'cancelled') return '取消成功'
  if (booking.status === 'cancelled_expired') {
    if (booking.requireDocuments && !booking.documentApprovedAt) return '文件逾期'
    return '繳費逾期'
  }
  if (booking.status === 'cancelled_rejected') return '文件審核未通過'
  return null
}

function activeStageLabel(booking: Booking): string | null {
  if (booking.status === 'reserved') {
    return booking.requireDocuments ? '待上傳文件' : '待繳費'
  }
  if (booking.status === 'document_review') return '文件審核中'
  if (booking.status === 'documents_rejected') return '文件退件'
  if (booking.status === 'pending_payment') return '待繳費'
  if (booking.status === 'payment_review') return '繳費審核中'
  return null
}

const formatDate = (b: Booking) => formatBookingDate(b, false)
const formatTime = (b: Booking) => formatBookingTime(b)

function stageDeadline(booking: Booking): string | null {
  if (booking.status === 'reserved' && booking.requireDocuments && booking.documentUploadDeadline) {
    return `文件上傳截止：${toZhDate(booking.documentUploadDeadline)}`
  }
  if (booking.status === 'reserved' && !booking.requireDocuments && booking.receiptUploadDeadline) {
    return `繳費截止：${toZhDate(booking.receiptUploadDeadline)}`
  }
  if (booking.status === 'documents_rejected' && booking.documentUploadDeadline) {
    return `重新上傳截止：${toZhDate(booking.documentUploadDeadline)}`
  }
  if (booking.status === 'pending_payment' && booking.receiptUploadDeadline) {
    return `繳費截止：${toZhDate(booking.receiptUploadDeadline)}`
  }
  return null
}
</script>
