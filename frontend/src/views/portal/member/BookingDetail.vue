<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBookingsStore, type Booking } from '@/stores/bookings'
import BookingProgress from '@/components/portal/BookingProgress.vue'
import { venues as mockVenues } from '@/services/venueService'
import {
  toZhDate, formatBookingDate, formatBookingTime, RENTAL_MODE_LABELS,
} from '@/utils/bookingFormat'
import {
  REFUND_STEPS, getRefundStepState, REFUND_TYPE_LABELS, REFUND_STATUS_LABELS
} from '@/utils/bookingStatus'

const route = useRoute()
const authStore = useAuthStore()
const bookingsStore = useBookingsStore()

const bookingId = Number(route.params.id)

const booking = computed<Booking | undefined>(() => {
  if (!authStore.isLoggedIn) return undefined
  return bookingsStore.getById(bookingId)
})

const contact = computed(() => ({
  name: authStore.user?.name ?? '—',
  phone: authStore.user?.phone ?? '—',
  email: authStore.user?.email ?? '—',
}))

const today = new Date().toISOString().slice(0, 10)

const venue = computed(() => {
  if (!booking.value) return null
  return mockVenues.find(v => v.id === booking.value!.venueId) ?? null
})
const cancellationDeadlineDays = computed(() => (venue.value as any)?.cancellationDeadlineDays ?? 7)

const cancellationDeadlineDate = computed(() => {
  if (!booking.value) return null
  const eventDate = booking.value.startDate ?? booking.value.date
  const d = new Date(eventDate)
  d.setDate(d.getDate() - cancellationDeadlineDays.value)
  return d.toISOString().slice(0, 10)
})

const canCancel = computed(() => {
  if (!booking.value) return false
  const s = booking.value.status
  if (['confirmed', 'completed', 'cancellation_requested',
    'cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(s)) return false
  // 需要文件審核且文件已通過 → 需走申請取消流程，不可直接取消
  if (booking.value.requireDocuments && booking.value.documentApprovedAt) return false
  return !booking.value.cancelDeadline || booking.value.cancelDeadline >= today
})

const canRequestCancellation = computed(() => {
  if (!booking.value) return false
  const s = booking.value.status
  if (['completed', 'cancellation_requested',
    'cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(s)) return false
  // confirmed：一定走申請取消
  if (s === 'confirmed') {
    return !cancellationDeadlineDate.value || today <= cancellationDeadlineDate.value
  }
  // 需要文件且文件已通過（pending_payment / payment_review）：也需申請取消
  if (booking.value.requireDocuments && booking.value.documentApprovedAt) {
    return !booking.value.cancelDeadline || booking.value.cancelDeadline >= today
  }
  return false
})

const cancelModalOpen = ref(false)
const cancelReason = ref('')

const remittance = ref({ last5: '', amount: '', datetime: '', senderName: '', note: '' })
const uploadError = ref('')
const paymentProof = ref<string | null>(null)

const handleReceiptUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!validTypes.includes(file.type)) { uploadError.value = '僅支援 JPG、PNG 或 PDF 格式'; return }
  if (file.size > 5 * 1024 * 1024) { uploadError.value = '檔案大小不能超過 5MB'; return }
  uploadError.value = ''
  paymentProof.value = file.name // TODO: 串接上傳 API
  input.value = ''
}

const formatDate = (b: Booking) => formatBookingDate(b, false)
const formatTime = (b: Booking) => formatBookingTime(b)
const rentalModeLabel = computed(() => RENTAL_MODE_LABELS[booking.value?.rentalMode ?? ''] ?? '')

function submitCancellationRequest() {
  // TODO: 串接取消申請 API → status 變為 cancellation_requested
  cancelModalOpen.value = false
}

const ACTIVE_STATUSES = ['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review']

// 狀態樣態:label=文字、pill=狀態膠囊配色、borderCls=左側色條(與我的預約一致)
function statusBadge(b: Booking): { label: string; pill: string; borderCls: string } {
  if (ACTIVE_STATUSES.includes(b.status))
    return { label: '預訂中', pill: 'bg-warning/15 text-warning', borderCls: 'border-warning' }
  if (b.status === 'confirmed' || b.status === 'cancellation_requested')
    return { label: '預訂成功', pill: 'bg-success/15 text-success', borderCls: 'border-success' }
  if (b.status === 'completed')
    return { label: '已使用', pill: 'bg-base-300 text-base-content/70', borderCls: 'border-base-300' }
  if (['cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(b.status))
    return { label: '已取消', pill: 'bg-error/15 text-error', borderCls: 'border-error' }
  return { label: b.status, pill: 'bg-base-200 text-base-content/60', borderCls: 'border-base-300' }
}

function cancelReasonLabel(b: Booking): string | null {
  if (b.status === 'cancelled') return '取消成功'
  if (b.status === 'cancelled_expired') {
    if (b.requireDocuments && !b.documentApprovedAt) return '文件逾期'
    return '繳費逾期'
  }
  if (b.status === 'cancelled_rejected') return '文件審核未通過'
  return null
}

function activeStageLabel(b: Booking): string | null {
  if (b.status === 'reserved') {
    return b.requireDocuments ? '待上傳文件' : '待繳費'
  }
  if (b.status === 'document_review') return '文件審核中'
  if (b.status === 'documents_rejected') return '文件退件'
  if (b.status === 'pending_payment') return '待繳費'
  if (b.status === 'payment_review') return '繳費審核中'
  return null
}

const hasDocumentPhase = computed(() => booking.value?.requireDocuments ?? false)

const showDocumentSection = computed(() => {
  if (!hasDocumentPhase.value) return false
  const s = booking.value?.status
  return s && ['reserved', 'document_review', 'documents_rejected',
    'pending_payment', 'payment_review', 'confirmed', 'completed',
    'cancellation_requested', 'cancelled_expired', 'cancelled_rejected', 'cancelled'].includes(s)
})

const showPaymentSection = computed(() => {
  const s = booking.value?.status
  if (!s) return false
  if (['pending_payment', 'payment_review', 'confirmed', 'completed',
    'cancellation_requested', 'cancelled'].includes(s)) return true
  // 不需文件審核：從 reserved 起就可繳費
  if (s === 'reserved' && !booking.value?.requireDocuments) return true
  return false
})

const canUploadDocuments = computed(() => {
  const s = booking.value?.status
  return s === 'reserved' || s === 'documents_rejected'
})

// ── 退費相關 ──
const hasRefund = computed(() => !!booking.value?.refund && booking.value.refund.status !== 'none')

function getStepState(stepKey: string) {
  if (!booking.value?.refund) return 'future'
  return getRefundStepState(booking.value.refund.status, stepKey as any)
}

const handleDocUpload = (_docKey: string, event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!validTypes.includes(file.type)) { alert('僅支援 JPG、PNG 或 PDF 格式'); return }
  if (file.size > 5 * 1024 * 1024) { alert('檔案大小不能超過 5MB'); return }
  // TODO: 串接上傳 API
  input.value = ''
}
</script>

<template>
  <!-- Not found -->
  <div v-if="!booking" class="mx-auto container max-w-4xl px-4 py-12">
    <div class="rounded-box border border-base-200 bg-base-100 p-8 text-center shadow-sm">
      <span class="material-symbols-outlined text-5xl text-base-content/25">search_off</span>
      <h1 class="mt-3 text-xl font-bold">找不到此預約資料</h1>
      <router-link to="/member/bookings" class="btn btn-primary mt-6">返回我的預約</router-link>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="mx-auto container max-w-4xl px-4 py-8 lg:py-12 space-y-4">
    <!-- 頂部:返回 + 編號 + 狀態 -->
    <div class="flex flex-wrap items-center gap-3">
      <router-link to="/member/bookings"
        class="grid size-9 shrink-0 place-items-center rounded-full border border-base-200 bg-base-100 transition-colors hover:bg-base-200">
        <span class="material-symbols-outlined text-xl">arrow_back</span>
      </router-link>
      <h1 class="font-heading text-lg font-black tracking-wide text-secondary">{{ booking.reservationId }}</h1>
      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <span v-if="booking.refund && booking.refund.status !== 'none'"
          class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/60">
          {{ REFUND_TYPE_LABELS[booking.refund.refundType] ?? '退費' }}·{{
            REFUND_STATUS_LABELS[booking.refund.status]?.label ?? booking.refund.status }}
        </span>
        <span v-if="activeStageLabel(booking)"
          class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/60">
          {{ activeStageLabel(booking) }}
        </span>
        <span v-if="booking.status === 'cancellation_requested'"
          class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/60">
          申請取消中
        </span>
        <span v-if="cancelReasonLabel(booking)"
          class="rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
          {{ cancelReasonLabel(booking) }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="statusBadge(booking).pill">
          <span class="size-1.5 rounded-full bg-current"></span>{{ statusBadge(booking).label }}
        </span>
      </div>
    </div>

    <!-- 狀態提示:已使用 -->
    <div v-if="booking.status === 'completed'"
      class="flex items-start gap-3 rounded-box border border-base-200 bg-base-100 p-4 shadow-sm">
      <span class="material-symbols-outlined shrink-0 text-3xl text-secondary">check_circle</span>
      <div>
        <h4 class="font-bold">租借已結束</h4>
        <p class="mt-1 text-sm text-base-content/60">感謝您的使用,本次租借已圓滿完成。</p>
      </div>
    </div>

    <!-- 狀態提示:已取消 -->
    <div v-if="booking.status.startsWith('cancelled')"
      class="flex items-start gap-3 rounded-box border border-error/30 bg-error/5 p-4 shadow-sm">
      <span class="material-symbols-outlined shrink-0 text-3xl text-error">cancel</span>
      <div>
        <h4 class="font-bold text-error">預約已取消</h4>
        <p class="mt-1 text-sm text-base-content/70">{{ booking.cancelReason || '逾期或未符合資格,系統/管理員已取消。' }}</p>
      </div>
    </div>

    <!-- ① 進度 -->
    <section
      v-if="['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review'].includes(booking.status)"
      class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm">
      <h3 class="mb-4 font-heading text-base font-black text-secondary">預約進度</h3>
      <BookingProgress :booking="booking" :compact="false" />
    </section>

    <!-- ② 場館 + 預訂資訊 -->
    <section class="overflow-hidden rounded-box border border-base-200 bg-base-100 shadow-sm">
      <figure class="h-44 overflow-hidden bg-base-300">
        <img :src="booking.venueImage" :alt="booking.venueName" class="h-full w-full object-cover" />
      </figure>
      <div class="p-5 sm:p-6">
        <h3 class="mb-1 font-heading text-base font-black text-secondary">預訂資訊</h3>
        <h2 class="font-heading text-xl font-black leading-snug text-base-content">{{ booking.venueName }}</h2>
        <p v-if="booking.venueLocation" class="mt-0.5 inline-flex items-center gap-1 text-sm text-base-content/50">
          <span class="material-symbols-outlined text-sm">location_on</span>{{ booking.venueLocation }}
        </p>

        <dl class="mt-4 divide-y divide-base-200 border-y border-base-200 text-sm">
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">使用日期</dt>
            <dd class="text-right font-medium">{{ formatDate(booking) }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">使用時間</dt>
            <dd class="text-right font-medium">{{ formatTime(booking) }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">租借方式</dt>
            <dd class="text-right font-medium">{{ rentalModeLabel }}</dd>
          </div>
          <div v-if="booking.totalHours" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">租借時數</dt>
            <dd class="text-right font-medium">{{ booking.totalHours }} 小時</dd>
          </div>
          <div v-if="booking.rentalDays" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">租借天數</dt>
            <dd class="text-right font-medium">{{ booking.rentalDays }} 天</dd>
          </div>
          <div v-if="booking.peopleCount" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">預估人數</dt>
            <dd class="text-right font-medium">{{ booking.peopleCount }} 人</dd>
          </div>
          <div v-if="booking.purpose" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">使用目的</dt>
            <dd class="text-right font-medium">{{ booking.purpose }}</dd>
          </div>
          <div v-if="booking.cancelDeadline && !booking.status.startsWith('cancelled')"
            class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">取消期限</dt>
            <dd class="text-right font-medium text-error">{{ toZhDate(booking.cancelDeadline) }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">申請日期</dt>
            <dd class="text-right font-medium">{{ toZhDate(booking.createdAt) }}</dd>
          </div>
        </dl>

        <!-- 操作按鈕 -->
        <div v-if="canCancel || canRequestCancellation" class="mt-4 flex justify-end gap-2">
          <button v-if="canCancel" class="btn btn-error">取消預約</button>
          <button v-if="canRequestCancellation" class="btn btn-neutral" @click="cancelModalOpen = true">
            <span class="material-symbols-outlined text-base">event_busy</span>
            申請取消預約
          </button>
        </div>

        <!-- 取消申請中 -->
        <div v-if="booking.status === 'cancellation_requested'"
          class="mt-4 flex items-start gap-3 rounded-box border border-warning/30 bg-warning/5 p-3">
          <span class="material-symbols-outlined shrink-0 text-warning">hourglass_top</span>
          <div>
            <p class="font-semibold">取消申請已送出,等待承辦人員審核</p>
            <p v-if="booking.cancelReason" class="mt-1 text-sm text-base-content/60">取消原因:{{ booking.cancelReason }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ③ 申請文件 -->
    <section v-if="showDocumentSection && booking.documents?.length"
      class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="font-heading text-base font-black text-secondary">申請文件</h3>
        <span class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
          {{booking.documents.filter(d => d.uploaded).length}} / {{booking.documents.filter(d => d.required).length}} 必要項已上傳
        </span>
      </div>

      <p v-if="booking.documentUploadDeadline"
        class="mb-3 inline-flex items-center gap-1 text-xs text-base-content/50">
        <span class="material-symbols-outlined text-sm">schedule</span>
        文件上傳截止:{{ toZhDate(booking.documentUploadDeadline) }}
      </p>

      <!-- 退件理由 -->
      <div v-if="booking.status === 'documents_rejected' && booking.documentRejectReason"
        class="mb-4 flex items-start gap-3 rounded-box border border-error/30 bg-error/5 p-3">
        <span class="material-symbols-outlined shrink-0 text-error">error</span>
        <div>
          <p class="font-bold text-error">文件需補件/修改</p>
          <p class="mt-1 text-sm text-base-content/70">{{ booking.documentRejectReason }}</p>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="doc in booking.documents.filter(d => d.required)" :key="doc.key"
          class="flex items-center gap-3 rounded-box border border-base-200 p-3"
          :class="doc.uploaded ? 'bg-success/5 border-success/30' : 'bg-base-200/40'">
          <span class="material-symbols-outlined shrink-0 text-2xl"
            :class="doc.uploaded ? 'text-success' : 'text-base-content/40'">
            {{ doc.uploaded ? 'check_circle' : 'upload_file' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{{ doc.label }}</p>
            <p v-if="doc.uploaded && doc.fileName" class="truncate text-xs text-base-content/50">{{ doc.fileName }}</p>
            <p v-if="doc.uploaded && doc.uploadedAt" class="text-xs text-base-content/50">上傳於 {{ toZhDate(doc.uploadedAt) }}</p>
          </div>
          <template v-if="canUploadDocuments">
            <label v-if="!doc.uploaded" class="btn btn-sm btn-neutral">
              <span class="material-symbols-outlined text-base">upload</span>上傳
              <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleDocUpload(doc.key, $event)" />
            </label>
            <label v-else class="btn btn-sm btn-ghost cursor-pointer gap-1">
              <span class="material-symbols-outlined text-base">refresh</span>重新上傳
              <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleDocUpload(doc.key, $event)" />
            </label>
          </template>
          <template v-else>
            <span v-if="doc.uploaded" class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">已上傳</span>
            <span v-else class="rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">待上傳</span>
          </template>
        </div>
      </div>

      <p v-if="canUploadDocuments" class="mt-3 text-xs text-base-content/50">支援 JPG、PNG、PDF,每個檔案最大 5MB</p>
    </section>

    <!-- ④ 費用明細 -->
    <section class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 class="mb-3 font-heading text-base font-black text-secondary">費用明細</h3>
      <div class="divide-y divide-base-200 border-y border-base-200">
        <!-- 場地費:計時 -->
        <div v-if="booking.rentalMode === 'hourly' && booking.pricePerHour && booking.totalHours"
          class="flex items-center justify-between gap-4 py-2.5">
          <div class="min-w-0">
            <p class="text-sm">場地費(計時)</p>
            <p class="text-xs text-base-content/50">NT$ {{ booking.pricePerHour.toLocaleString() }} × {{ booking.totalHours }} 小時</p>
          </div>
          <span class="shrink-0 font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</span>
        </div>
        <!-- 場地費:全日 -->
        <div v-else-if="booking.rentalMode === 'daily' && booking.pricePerDay && booking.rentalDays"
          class="flex items-center justify-between gap-4 py-2.5">
          <div class="min-w-0">
            <p class="text-sm">場地費(全日)</p>
            <p class="text-xs text-base-content/50">NT$ {{ booking.pricePerDay.toLocaleString() }} × {{ booking.rentalDays }} 天</p>
          </div>
          <span class="shrink-0 font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</span>
        </div>
        <!-- 場地費:場次 -->
        <div v-else-if="booking.rentalMode === 'session' && booking.session"
          class="flex items-center justify-between gap-4 py-2.5">
          <p class="text-sm">場地費({{ { morning: '上午場', afternoon: '下午場', evening: '晚間場' }[booking.session] }})</p>
          <span class="shrink-0 font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</span>
        </div>
        <!-- 附加費用 -->
        <div v-for="fee in booking.additionalFees" :key="fee.label" class="flex items-center justify-between gap-4 py-2.5">
          <div class="min-w-0">
            <p class="text-sm">{{ fee.label }}</p>
            <p class="text-xs text-base-content/50">{{ fee.unit }}</p>
          </div>
          <span class="shrink-0 font-medium">NT$ {{ fee.amount.toLocaleString() }}</span>
        </div>
        <!-- 保證金 -->
        <div v-if="booking.deposit" class="flex items-center justify-between gap-4 py-2.5">
          <p class="text-sm">保證金</p>
          <span class="shrink-0 font-medium">NT$ {{ booking.deposit.toLocaleString() }}</span>
        </div>
      </div>
      <!-- 合計 -->
      <div class="mt-3 flex items-center justify-between">
        <span class="font-semibold text-base-content/60">合計</span>
        <span class="font-heading text-2xl font-bold text-primary">NT$ {{ booking.totalPrice.toLocaleString() }}</span>
      </div>
      <p class="mt-3 text-center text-xs text-base-content/40">實際費用以場館確認為準。</p>
    </section>

    <!-- ⑤ 繳款證明 -->
    <section v-if="showPaymentSection" class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 class="mb-3 font-heading text-base font-black text-secondary">繳款證明</h3>

      <!-- 已確認 / 確認中:顯示匯款資訊 -->
      <template
        v-if="booking.remittance && ['confirmed', 'completed', 'payment_review', 'cancellation_requested', 'cancelled'].includes(booking.status)">
        <div v-if="['confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(booking.status)"
          class="flex items-start gap-3 rounded-box border border-success/30 bg-success/5 p-3">
          <span class="material-symbols-outlined shrink-0 text-2xl text-success">check_circle</span>
          <div>
            <p class="font-bold">繳款已確認</p>
            <p class="text-sm text-base-content/60">款項已核對完成,感謝您的配合。</p>
          </div>
        </div>
        <div v-else class="flex items-start gap-3 rounded-box border border-warning/30 bg-warning/5 p-3">
          <span class="material-symbols-outlined shrink-0 text-2xl text-warning">hourglass_top</span>
          <div>
            <p class="font-bold">等待管理員確認中</p>
            <p class="text-sm text-base-content/60">已收到您的匯款資訊,正在核對中。</p>
          </div>
        </div>
        <dl v-if="booking.remittance" class="mt-3 divide-y divide-base-200 border-y border-base-200 text-sm">
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">帳號後五碼</dt>
            <dd class="font-mono font-medium">{{ booking.remittance.last5 }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">匯款金額</dt>
            <dd class="font-medium">NT$ {{ booking.remittance.amount.toLocaleString() }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">匯款時間</dt>
            <dd class="font-medium">{{ booking.remittance.datetime.replace('T', ' ') }}</dd>
          </div>
          <div v-if="booking.remittance.senderName" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">匯款人</dt>
            <dd class="font-medium">{{ booking.remittance.senderName }}</dd>
          </div>
          <div v-if="booking.remittance.note" class="flex justify-between gap-4 py-2.5">
            <dt class="text-base-content/50">補充說明</dt>
            <dd class="font-medium">{{ booking.remittance.note }}</dd>
          </div>
        </dl>
      </template>

      <!-- 待付款:繳費說明 + 匯款表單 -->
      <template v-else>
        <div class="mb-4 rounded-box border border-warning/30 bg-warning/5 p-4 space-y-1 text-sm">
          <p class="font-semibold">請完成匯款後上傳證明</p>
          <p>銀行匯款｜玉山銀行(808)帳號:1234-567-890123</p>
          <p>戶名:苗栗縣政府體育場</p>
          <p class="text-base-content/60">匯款後請務必保留收據並上傳證明,以利核帳。</p>
        </div>

        <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <fieldset class="fieldset">
            <label class="label">帳號後五碼 <span class="text-error">*</span></label>
            <input v-model="remittance.last5" type="text" inputmode="numeric" maxlength="5" placeholder="例:12345" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <label class="label">匯款金額 <span class="text-error">*</span></label>
            <input v-model="remittance.amount" type="number" min="0" placeholder="例:3500" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <label class="label">匯款時間</label>
            <input v-model="remittance.datetime" type="datetime-local" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <label class="label">匯款人姓名</label>
            <input v-model="remittance.senderName" type="text" placeholder="若與申請人不同請填寫" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset sm:col-span-2">
            <label class="label">補充說明</label>
            <input v-model="remittance.note" type="text" placeholder="例:分兩筆匯入" class="input w-full" />
          </fieldset>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-3 rounded-box border p-3"
            :class="paymentProof ? 'border-success/40 bg-success/5' : 'border-base-200 bg-base-200/40'">
            <span class="material-symbols-outlined shrink-0 text-lg"
              :class="paymentProof ? 'text-success' : 'text-base-content/40'">
              {{ paymentProof ? 'check_circle' : 'upload_file' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">繳費收據或證明</p>
              <p v-if="paymentProof" class="truncate text-xs text-base-content/50">{{ paymentProof }}</p>
            </div>
            <label v-if="!paymentProof" class="btn btn-sm btn-primary cursor-pointer gap-1">
              <span class="material-symbols-outlined text-base">upload</span>上傳
              <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleReceiptUpload" />
            </label>
            <label v-else class="btn btn-sm btn-ghost cursor-pointer gap-1">
              <span class="material-symbols-outlined text-base">refresh</span>重新上傳
              <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleReceiptUpload" />
            </label>
          </div>
          <div v-if="uploadError" class="rounded-box border border-error/30 bg-error/5 p-2 text-sm text-error">{{ uploadError }}</div>
        </div>

        <p class="mt-3 text-xs text-base-content/50">支援 JPG、PNG、PDF,每個檔案最大 5MB</p>
      </template>
    </section>

    <!-- ⑥ 聯絡資訊 -->
    <section class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 class="mb-3 font-heading text-base font-black text-secondary">聯絡資訊</h3>
      <dl class="divide-y divide-base-200 border-y border-base-200 text-sm">
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">聯絡人</dt>
          <dd class="font-medium">{{ contact.name }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">電話</dt>
          <dd class="font-medium">{{ contact.phone }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">Email</dt>
          <dd class="font-medium">{{ contact.email }}</dd>
        </div>
      </dl>
    </section>

    <!-- ⑦ 取消退款 -->
    <section v-if="hasRefund" class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <div class="mb-4 flex items-center gap-2">
        <h3 class="font-heading text-base font-black text-secondary">取消退款</h3>
        <span v-if="booking.refund?.status === 'completed'"
          class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">已完成</span>
        <span v-else class="rounded-full bg-info/15 px-2.5 py-1 text-xs font-semibold text-info">處理中</span>
      </div>
      <router-link to="/member/refunds" class="btn btn-outline btn-sm mb-4 w-fit">
        <span class="material-symbols-outlined text-base">receipt_long</span>查看我的退款紀錄
      </router-link>

      <ul v-if="booking.refund?.status !== 'completed'" class="steps steps-vertical lg:steps-horizontal mb-4 w-full">
        <li v-for="step in REFUND_STEPS" :key="step.key" class="step" :class="{
          'step-success': getStepState(step.key) === 'done',
          'step-warning': getStepState(step.key) === 'active',
        }">
          <span v-if="getStepState(step.key) === 'done'" class="step-icon material-symbols-outlined" style="font-size:16px;">check</span>
          <span v-else-if="getStepState(step.key) === 'active'" class="step-icon material-symbols-outlined" style="font-size:16px;">hourglass_top</span>
          {{ step.label }}
        </li>
      </ul>

      <dl class="divide-y divide-base-200 border-y border-base-200 text-sm">
        <div v-if="booking.refund?.amount != null" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">核定金額</dt>
          <dd class="font-bold">NT$ {{ booking.refund!.amount!.toLocaleString() }}</dd>
        </div>
        <div v-if="booking.refund?.refundMethod" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">退費方式</dt>
          <dd class="font-medium">{{ booking.refund!.refundMethod === 'transfer' ? '匯款退款' : '支票退款' }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">申請日期</dt>
          <dd class="font-medium">{{ booking.refund?.requestedAt ? toZhDate(booking.refund.requestedAt) : '—' }}</dd>
        </div>
        <div v-if="booking.refund?.adminApprovedAt" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">承辦核准</dt>
          <dd class="font-medium">{{ toZhDate(booking.refund.adminApprovedAt) }}</dd>
        </div>
        <div v-if="booking.refund?.accountingApprovedAt" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">會計核定</dt>
          <dd class="font-medium">{{ toZhDate(booking.refund.accountingApprovedAt) }}</dd>
        </div>
        <div v-if="booking.refund?.completedAt" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base-content/50">撥款完成</dt>
          <dd class="font-medium text-success">{{ toZhDate(booking.refund.completedAt) }}</dd>
        </div>
      </dl>
    </section>

    <!-- ⑧ 備註 -->
    <section v-if="booking.note" class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 class="mb-2 font-heading text-base font-black text-secondary">備註</h3>
      <p class="rounded-box bg-base-200/60 p-3 leading-relaxed">{{ booking.note }}</p>
    </section>

    <!-- ⑨ 管理員備註 -->
    <section v-if="booking.adminNote" class="rounded-box border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
      <h3 class="mb-2 font-heading text-base font-black text-secondary">管理員備註</h3>
      <p class="rounded-box border border-warning/30 bg-warning/5 p-3 leading-relaxed">{{ booking.adminNote }}</p>
    </section>

    <div class="pt-2">
      <router-link to="/member/bookings" class="btn btn-ghost btn-sm">← 返回列表</router-link>
    </div>

    <!-- 取消預約申請 Modal -->
    <dialog class="modal" :class="{ 'modal-open': cancelModalOpen }">
      <div class="modal-box max-w-md">
        <h3 class="mb-4 text-lg font-bold">申請取消預約</h3>
        <div class="space-y-4">
          <div class="flex items-start gap-3 rounded-box border border-warning/30 bg-warning/5 p-3">
            <span class="material-symbols-outlined shrink-0 text-warning">info</span>
            <div>
              <p class="font-semibold">取消申請將由承辦人員審核</p>
              <p class="mt-1 text-sm text-base-content/70">提交後預約將暫時凍結,審核通過後訂單狀態會變更為「已取消」,届時可申請退還已繳費用。</p>
            </div>
          </div>
          <div class="space-y-1 rounded-box bg-base-200 p-3 text-sm">
            <p><span class="text-base-content/50">預約場館:</span>{{ booking.venueName }}</p>
            <p><span class="text-base-content/50">使用日期:</span>{{ formatDate(booking) }}</p>
            <p><span class="text-base-content/50">取消期限:</span>須於使用日 <strong>{{ cancellationDeadlineDays }}</strong> 天前提出申請</p>
          </div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">取消原因 <span class="text-error">*</span></legend>
            <textarea v-model="cancelReason" class="textarea textarea-bordered w-full" rows="3"
              placeholder="請說明取消原因,例如:活動因故延期、天候因素無法舉行..."></textarea>
          </fieldset>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="cancelModalOpen = false">返回</button>
          <button class="btn btn-warning" :disabled="!cancelReason.trim()" @click="submitCancellationRequest">
            確認送出取消申請
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelModalOpen = false"></form>
    </dialog>
  </div>
</template>

<style scoped></style>
