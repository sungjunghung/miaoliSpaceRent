<template>
  <div class="space-y-4 p-4">

    <!-- 年份 + 月份 + 篩選 -->
    <div class="flex items-center justify-between gap-2 flex-wrap">
   

      <!-- 左：搜尋 + 場館 + 狀態 -->
      <div class="flex-1 flex items-center gap-2 flex-wrap">
      
        <!-- 場館複選 -->
        <VenueFilterDropdown v-model="filterVenueIds" class="w-fit min-w-36" :end="false" />
        
        <label class="input">
          <span class="material-symbols-outlined text-lg">search</span>
          <input v-model="search" type="text" placeholder="搜尋申請人、場館或目的" />
        </label>

        <select v-model="filterStatus" class="select w-fit min-w-36">
          <option value="">全部狀態</option>
          <option value="__active">預訂中</option>
          <option value="__confirmed">預訂成功</option>
          <option value="completed">已使用</option>
          <option value="__cancelled">已取消</option>
        </select>

        <select v-model="filterTodo" class="select w-fit min-w-36">
          <option value="">全部待辦</option>
          <option value="doc_review">需審核文件</option>
          <option value="pay_review">需審核繳費</option>
          <option value="cancel_review">待審核取消</option>
          <option value="refund_pending">退費處理中</option>
          <option value="wait_user">等待用戶</option>
        </select>
      </div>

      <!-- 右：年份切換 + 月份 -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center">
          <button class="btn btn-ghost btn-square" @click="selectYear(filterYear - 1)">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="w-14 text-center font-medium">{{ filterYear }}</span>
          <button class="btn btn-ghost btn-square" @click="selectYear(filterYear + 1)"
            :disabled="filterYear >= today.getFullYear()">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div class="tabs tabs-box bg-base-300">
          <button v-for="m in 12" :key="m" class="tab"
            :class="[filterMonth === m ? 'tab-active' : 'btn-ghost', isMonthDisabled(m) ? 'opacity-30' : '']"
            @click="filterMonth = m">{{ m }}月</button>
        </div>
      </div>
    </div>

    <div class="basis-table-container">
      <table class="table">
        <thead>
          <tr>
            <th>狀態</th>
            <th>訂單編號</th>
            <th>申請日期</th>
            <th>場館</th>
            <th>使用日期</th>
            <th>申請人</th>
            <th>待辦</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in paginated" :key="b.id" class="hover" @click="openBookingDrawer(b.id)">
            <td>
              <span :class="['badge ', statusLabel(b).cls]">{{ statusLabel(b).label }}</span>
            </td>
            <td class="text-base-content/50">{{ b.reservationId }}</td>
            <td class="text-base-content/50 whitespace-nowrap">{{ formatShortDate(b.createdAt) }}</td>
            <td>
              <span class="font-semibold">{{ b.venueName }}</span>
            </td>
            <td class="whitespace-nowrap">
              {{ formatDate(b) }}
              <p class="text-base-content/40">{{ rentalModeLabel(b.rentalMode) }} <span v-if="b.purpose"
                  class="text-base-content/40 truncate max-w-36">｜{{ b.purpose }}</span></p>
            </td>
            <td>
              <p>{{ b.applicant }}</p>

            </td>
            <!-- 待辦 -->
            <td>
              <template v-if="todoDisplay(b)">
                <span class="badge badge-outline" :class="todoDisplay(b)!.cls">
                  {{ todoDisplay(b)!.label }}
                </span>
              </template>
              <template v-else>
                <span class="text-base-content/30">—</span>
              </template>
            </td>
            <td class="font-semibold whitespace-nowrap">NT$ {{ b.totalPrice.toLocaleString() }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" class="text-center text-base-content/40 py-10">找不到符合的預約</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁 -->
    <div class="flex items-center justify-between">
      <p class="text-base-content/40">共 {{ filtered.length }} 筆，第 {{ currentPage }} / {{ totalPages }} 頁</p>
      <div class="join">
        <button class="join-item btn" :disabled="currentPage === 1" @click="currentPage--">«</button>
        <button v-for="p in totalPages" :key="p" class="join-item btn" :class="{ 'btn-active': p === currentPage }"
          @click="currentPage = p">{{ p }}</button>
        <button class="join-item btn" :disabled="currentPage === totalPages" @click="currentPage++">»</button>
      </div>
    </div>

    <AdminSlideDrawer
      v-if="selectedBooking"
      eyebrow="預約詳情"
      :title="`${selectedBooking.reservationId} ${selectedBooking.venueName}`"
      :subtitle="`${selectedBooking.applicant}｜${formatDate(selectedBooking)}`"
      :open-to="{ name: 'admin-booking-detail', params: { id: selectedBooking.id } }"
      aria-label="關閉預約詳情"
      @close="closeBookingDrawer"
    >
      <BookingDetailContent :booking="selectedBooking" />
    </AdminSlideDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBookingsStore, type Booking } from '@/stores/bookings'
import { formatBookingDate, RENTAL_MODE_LABELS_SHORT } from '@/utils/bookingFormat'
import { CANCELLED_STATUSES } from '@/utils/bookingStatus'
import VenueFilterDropdown from '@/components/admin/VenueFilterDropdown.vue'
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue'
import BookingDetailContent from './components/BookingDetailContent.vue'

const bookingsStore = useBookingsStore()

const ACTIVE_STATUSES = ['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review']
const CONFIRMED_STATUSES = ['confirmed', 'cancellation_requested']

const today = new Date()
const filterYear = ref(today.getFullYear())
const filterMonth = ref(today.getMonth() + 1)
const search = ref('')
const filterStatus = ref('')
const filterTodo = ref('')
const filterVenueIds = ref<number[]>([])
const currentPage = ref(1)
const selectedBookingId = ref<number | null>(null)
const PAGE_SIZE = 10


function selectYear(y: number) {
  if (y !== filterYear.value) {
    filterYear.value = y
    if (y < today.getFullYear()) {
      filterMonth.value = 1
    } else if (filterMonth.value > today.getMonth() + 1) {
      filterMonth.value = today.getMonth() + 1
    }
  }
}

function isMonthDisabled(m: number): boolean {
  return filterYear.value === today.getFullYear() && m > today.getMonth() + 1
}

const filtered = computed(() =>
  bookingsStore.bookings.filter(b => {
    const dateStr = b.date ?? ''
    const y = parseInt(dateStr.slice(0, 4))
    const m = parseInt(dateStr.slice(5, 7))
    if (y !== filterYear.value || m !== filterMonth.value) return false
    if (filterVenueIds.value.length > 0 && !filterVenueIds.value.includes(b.venueId)) return false
    if (filterStatus.value) {
      if (filterStatus.value === '__active') {
        if (!ACTIVE_STATUSES.includes(b.status)) return false
      } else if (filterStatus.value === '__confirmed') {
        if (!CONFIRMED_STATUSES.includes(b.status)) return false
      } else if (filterStatus.value === '__cancelled' || filterStatus.value === 'cancelled') {
        if (!CANCELLED_STATUSES.includes(b.status)) return false
      } else {
        if (b.status !== filterStatus.value) return false
      }
    }
    if (filterTodo.value) {
      if (filterTodo.value === 'doc_review') {
        if (b.status !== 'document_review') return false
      } else if (filterTodo.value === 'pay_review') {
        if (b.status !== 'payment_review') return false
      } else if (filterTodo.value === 'cancel_review') {
        if (b.status !== 'cancellation_requested') return false
      } else if (filterTodo.value === 'refund_pending') {
        if (!b.refund || b.refund.status === 'none' || b.refund.status === 'completed') return false
      } else if (filterTodo.value === 'wait_user') {
        if (!['reserved', 'documents_rejected', 'pending_payment'].includes(b.status)) return false
      }
    }
    const q = search.value
    if (q && !b.applicant.includes(q) && !b.venueName.includes(q) && !(b.purpose ?? '').includes(q)) return false
    return true
  }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
)

watch([filterYear, filterMonth, search, filterStatus, filterTodo, filterVenueIds], () => { currentPage.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const selectedBooking = computed(() =>
  selectedBookingId.value ? bookingsStore.getById(selectedBookingId.value) : null
)

function openBookingDrawer(id: number) {
  selectedBookingId.value = id
}

function closeBookingDrawer() {
  selectedBookingId.value = null
}

function rentalModeLabel(mode: string) { return RENTAL_MODE_LABELS_SHORT[mode] ?? mode }

function formatShortDate(dateStr: string) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.slice(0, 10).split('-')
  return `${y}/${parseInt(m)}/${parseInt(d)}`
}

const formatDate = (b: Booking) => formatBookingDate(b, true)

function statusLabel(b: Booking): { label: string; cls: string } {
  if (ACTIVE_STATUSES.includes(b.status)) return { label: '預訂中', cls: 'badge-warning' }
  if (b.status === 'confirmed') return { label: '預訂成功', cls: 'badge-success' }
  if (b.status === 'cancellation_requested') return { label: '預訂成功', cls: 'badge-success' }
  if (b.status === 'completed') return { label: '已使用', cls: 'badge-neutral' }
  if (CANCELLED_STATUSES.includes(b.status)) return { label: '已取消', cls: 'badge-error' }
  return { label: b.status, cls: 'badge-ghost' }
}

function todoDisplay(b: Booking): { label: string; cls: string } | null {
  if (b.refund && b.refund.status !== 'none') {
    if (b.refund.status === 'completed') return { label: '取消退費已完成', cls: 'badge-success' }
    return {
      label: {
        admin_review: '退費待承辦審',
        accounting_review: '退費待會計',
        cashier_processing: '退費待出納',
      }[b.refund.status] ?? '退費處理中',
      cls: 'badge-info',
    }
  }

  if (b.status === 'cancellation_requested') return { label: '待審核取消', cls: 'badge-warning' }
  if (b.status === 'document_review') return { label: '需審核文件', cls: 'badge-info' }
  if (b.status === 'payment_review') return { label: '需審核繳費', cls: 'badge-info' }
  if (b.status === 'documents_rejected') return { label: '等待重傳', cls: 'badge-error' }
  if (b.status === 'pending_payment') return { label: '等待繳費', cls: 'badge-warning' }
  if (b.status === 'reserved') return { label: '等待用戶', cls: 'badge-warning' }

  return null
}
</script>
