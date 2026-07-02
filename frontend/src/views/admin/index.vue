<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { useBookingsStore } from '@/stores/bookings'
import { venues as mockVenues } from '@/services/venueService'
import { RENTAL_MODE_LABELS, formatBookingTime } from '@/utils/bookingFormat'
import { getBookingStatusDisplay, CANCELLED_STATUSES } from '@/utils/bookingStatus'
import VenueFilterDropdown from '@/components/admin/VenueFilterDropdown.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const router = useRouter()
const allBookings = useBookingsStore().bookings
const venues = (mockVenues as any[]).filter(v => v.parentId === null)

const venueFilter = ref<number[]>([])
const bookings = computed(() => {
  if (venueFilter.value.length === 0) return allBookings
  return allBookings.filter(b => venueFilter.value.includes(b.venueId))
})

const today = new Date()
const todayStr = today.toISOString().slice(0, 10)
const weekEnd = (() => {
  const d = new Date(today)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
})()

// ── Action Items ───────────────────────────────────────────────────────────
const docItems = computed(() =>
  bookings.value.filter(b => ['document_review', 'documents_rejected'].includes(b.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)
const payItems = computed(() =>
  bookings.value.filter(b => b.status === 'payment_review' && b.remittance)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)
const refundItems = computed(() =>
  bookings.value.filter(b => b.refund && !['none', 'completed'].includes(b.refund.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)
const totalActionCount = computed(() => docItems.value.length + payItems.value.length + refundItems.value.length)

// ── Monthly Trend (last 6 months) ─────────────────────────────────────────
const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1)
  return d.toISOString().slice(0, 7)
})
const MONTH_LABELS = MONTHS.map(m => {
  const [, mo] = m.split('-')
  return `${parseInt(mo)}月`
})

const monthlyTrend = computed(() =>
  MONTHS.map(m => ({
    label: MONTH_LABELS[MONTHS.indexOf(m)],
    count: bookings.value.filter(b => b.createdAt?.startsWith(m)).length,
    revenue: bookings.value
      .filter(b => b.createdAt?.startsWith(m) && ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0),
  }))
)

const trendChartData = computed(() => ({
  labels: monthlyTrend.value.map(m => m.label),
  datasets: [
    {
      label: '預約數',
      data: monthlyTrend.value.map(m => m.count),
      borderColor: 'oklch(0.616 0.161 40.67)',
      backgroundColor: 'oklch(0.616 0.161 40.67 / 0.1)',
      fill: true,
      tension: 0.4,
      yAxisID: 'y',
    },
    {
      label: '收款（確認）',
      data: monthlyTrend.value.map(m => m.revenue),
      borderColor: 'oklch(0.448 0.131 255.29)',
      backgroundColor: 'oklch(0.448 0.131 255.29 / 0.05)',
      fill: false,
      tension: 0.4,
      yAxisID: 'y1',
    },
  ],
}))

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 11 } } } },
  scales: {
    y: { type: 'linear' as const, position: 'left' as const, title: { display: true, text: '預約數', font: { size: 10 } }, beginAtZero: true },
    y1: { type: 'linear' as const, position: 'right' as const, title: { display: true, text: '金額（NT$）', font: { size: 10 } }, grid: { drawOnChartArea: false }, beginAtZero: true },
  },
}

// ── Status Doughnut ────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string }> = {
  confirmed: { label: '預訂成功', color: 'oklch(0.702 0.094 156.6)' },
  completed: { label: '已完成', color: 'oklch(0.616 0.161 40.67)' },
  reserved: { label: '已接受預訂', color: 'oklch(0.775 0.115 81.52)' },
  document_review: { label: '文件審核', color: 'oklch(0.626 0.143 240.0)' },
  documents_rejected: { label: '文件退件', color: 'oklch(0.516 0.146 29.67)' },
  payment_review: { label: '繳費審核', color: 'oklch(0.626 0.143 240.0)' },
  cancelled: { label: '已取消', color: 'oklch(0.75 0 0)' },
}

const statusDistribution = computed(() =>
  Object.entries(STATUS_META)
    .map(([key, meta]) => ({ key, ...meta, count: bookings.value.filter(b => b.status === key).length }))
    .filter(s => s.count > 0)
)

const doughnutData = computed(() => ({
  labels: statusDistribution.value.map(s => s.label),
  datasets: [{
    data: statusDistribution.value.map(s => s.count),
    backgroundColor: statusDistribution.value.map(s => s.color),
    borderWidth: 1,
  }],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } },
  },
}

const totalBookings = computed(() => bookings.value.length)

// ── Upcoming Bookings ──────────────────────────────────────────────────────
const upcomingBookings = computed(() =>
  bookings.value
    .filter(b => b.date >= todayStr && b.date <= weekEnd && !CANCELLED_STATUSES.includes(b.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
)

function getVenueName(venueId: number) {
  return venues.find(v => v.id === venueId)?.name ?? `場館 #${venueId}`
}

function formatTime(b: any) {
  return formatBookingTime(b)
}
</script>

<template>
  
  <div class="space-y-4 p-4">

    <!-- ── Filter ──────────────────────────────────────────────── -->
    <div class="flex items-center justify-end">
      <VenueFilterDropdown v-model="venueFilter" />
    </div>

    <!-- ── Row 2: Trend + Status ────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <div class="lg:col-span-2 card card-basic">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">近 6 個月趨勢</h2>
            <span>預約數 ＆ 已確認收款</span>
          </div>
          <div style="height: 200px">
            <Line :data="trendChartData" :options="trendChartOptions" />
          </div>
        </div>
      </div>

      <div class="card card-basic">
        <div class="card-body">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-semibold">預約狀態分佈</h2>
            <span>共 {{ totalBookings }} 筆</span>
          </div>
          <div style="height: 220px">
            <Doughnut :data="doughnutData" :options="doughnutOptions" />
          </div>
        </div>
      </div>

    </div>

    <!-- ── Row 3: Venue + Action Items ────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- ── Upcoming Bookings ────────────────────────────────────── -->
      <div class="lg:col-span-2 card card-basic">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="font-semibold">近 7 日預約行程</h2>
              <p class="mt-0.5">{{ todayStr }} ~ {{ weekEnd }}</p>
            </div>
            <router-link :to="{ name: 'admin-calendar' }" class="btn btn-outline gap-1">
              <span class="material-symbols-outlined">calendar_month</span>
              行事曆
            </router-link>
          </div>

          <div v-if="upcomingBookings.length === 0" class="text-center text-base-content/30 py-8">
            近 7 日無預約記錄
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>訂單</th>
                  <th>日期</th>
                  <th>場館</th>
                  <th>申請人</th>
                  <th>類型</th>
                  <th>時段</th>
                  <th>狀態</th>
                  <th class="w-px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in upcomingBookings" :key="b.id" class="hover cursor-pointer"
                  @click="router.push({ name: 'admin-booking-detail', params: { id: b.id } })">
                  <td class="text-base-content/50">{{ b.reservationId }}</td>
                  <td>
                    <span class="font-medium" :class="b.date === todayStr ? 'text-neutral' : ''">
                      {{ b.date }}
                      <span v-if="b.date === todayStr" class="badge badge-primary ml-1">今日</span>
                    </span>
                  </td>
                  <td class="max-w-35"><span class="truncate block">{{ getVenueName(b.venueId) }}</span></td>
                  <td>{{ b.applicant }}</td>
                  <td><span class="badge badge-ghost">{{ RENTAL_MODE_LABELS[b.rentalMode] }}</span></td>
                  <td class="text-base-content/60">{{ formatTime(b) }}</td>
                  <td>
                    <span class="badge" :class="getBookingStatusDisplay(b).className">
                      {{ getBookingStatusDisplay(b).label }}
                    </span>
                  </td>
                  <td>
                    <span class="material-symbols-outlined text-base-content/30">chevron_right</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Action Items (分類) -->
      <div class="card card-basic">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">待處理事項</h2>
            <router-link :to="{ name: 'admin-bookings' }" class="hover:underline">查看全部</router-link>
          </div>

          <div v-if="totalActionCount === 0"
            class="flex flex-col items-center justify-center py-8 text-base-content/30">
            <span class="material-symbols-outlined text-4xl mb-2">check_circle</span>
            <p>所有事項已處理完畢</p>
          </div>

          <template v-else>
            <!-- 文件審核 -->
            <template v-if="docItems.length > 0">
              <p class="font-semibold text-info mt-1 mb-1.5 flex items-center gap-1">
                <span class="material-symbols-outlined">description</span> 文件審核（{{ docItems.length }}）
              </p>
              <router-link v-for="b in docItems.slice(0, 2)" :key="b.id"
                :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
                class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-base-300 hover:bg-base-200/50 hover:border-info/30 transition-colors mb-1 group">
                <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="b.status === 'document_review' ? 'bg-info' : 'bg-error'"></span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ b.applicant }}</p>
                  <p class="truncate">{{ getVenueName(b.venueId) }}・{{ b.date }}</p>
                </div>
                <span class="badge badge-outline"
                  :class="b.status === 'document_review' ? 'badge-info' : 'badge-error'">
                  {{ b.status === 'document_review' ? '需審核文件' : '等待重傳' }}
                </span>
              </router-link>
              <p v-if="docItems.length > 2" class="mb-2 pl-2">還有 {{ docItems.length - 2 }} 筆⋯</p>
            </template>

            <!-- 繳費審核 -->
            <template v-if="payItems.length > 0">
              <p class="font-semibold text-info mt-2 mb-1.5 flex items-center gap-1">
                <span class="material-symbols-outlined">receipt</span> 繳費審核（{{ payItems.length }}）
              </p>
              <router-link v-for="b in payItems.slice(0, 2)" :key="b.id"
                :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
                class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-base-200 hover:bg-base-200/50 hover:border-info/30 transition-colors mb-1 group">
                <span class="w-1.5 h-1.5 rounded-full bg-info shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ b.applicant }}</p>
                  <p class="truncate">{{ getVenueName(b.venueId) }}・{{ b.date }}</p>
                </div>
                <span class="badge badge-info badge-outline">需審核繳費</span>
              </router-link>
              <p v-if="payItems.length > 2" class="mb-2 pl-2">還有 {{ payItems.length - 2 }} 筆⋯</p>
            </template>

            <!-- 退費申請 -->
            <template v-if="refundItems.length > 0">
              <p class="font-semibold text-info mt-2 mb-1.5 flex items-center gap-1">
                <span class="material-symbols-outlined">currency_exchange</span> 退費處理（{{ refundItems.length }}）
              </p>
              <router-link v-for="b in refundItems.slice(0, 2)" :key="b.id"
                :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
                class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-base-200 hover:bg-base-200/50 hover:border-info/30 transition-colors mb-1 group">
                <span class="w-1.5 h-1.5 rounded-full bg-info shrink-0"></span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ b.applicant }}</p>
                  <p class="truncate">{{ getVenueName(b.venueId) }}・{{ b.date }}</p>
                </div>
                <span class="badge badge-info badge-outline">{{ b.refund?.refundType === 'cancellation' ? '退費處理中' :
                  '保證金處理中' }}</span>
              </router-link>
              <p v-if="refundItems.length > 2" class="pl-2">還有 {{ refundItems.length - 2 }} 筆⋯</p>
            </template>
          </template>
        </div>
      </div>

    </div>


  </div>
</template>
