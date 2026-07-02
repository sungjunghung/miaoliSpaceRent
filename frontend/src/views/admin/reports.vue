<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookingsStore } from '@/stores/bookings'
import mockVenues from '@/mocks/venues.json'
import { RENTAL_MODE_LABELS } from '@/utils/bookingFormat'
import { CANCELLED_STATUSES } from '@/utils/bookingStatus'

const bookings = useBookingsStore().bookings
const venues = (mockVenues as any[]).filter(v => v.parentId === null)

// ── 篩選條件 ───────────────────────────────────────────────────────────────
const today = new Date()
const filterYear = ref(today.getFullYear())
const filterVenue = ref<number | ''>('')
const filterStatus = ref('')
const filterMode = ref('')

function selectYear(y: number) {
  if (y <= today.getFullYear()) filterYear.value = y
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// ── 過濾後訂單 ─────────────────────────────────────────────────────────────
const filtered = computed(() =>
  bookings.filter(b => {
    if (!(b.date ?? '').startsWith(String(filterYear.value))) return false
    if (filterVenue.value !== '' && b.venueId !== filterVenue.value) return false
    if (filterStatus.value) {
      if (filterStatus.value === 'cancelled') return CANCELLED_STATUSES.includes(b.status)
      return b.status === filterStatus.value
    }
    if (filterMode.value && b.rentalMode !== filterMode.value) return false
    return true
  })
)

// ── 年度摘要表（Jan–Dec 橫向）─────────────────────────────────────────────
const annualSummary = computed(() =>
  MONTHS.map(m => {
    const mStr = `${filterYear.value}-${String(m).padStart(2, '0')}`
    const mb = filtered.value.filter(b => (b.date ?? '').startsWith(mStr))
    const confirmed = mb.filter(b => ['confirmed', 'completed'].includes(b.status))
    return {
      month: m,
      count: mb.length,
      confirmed: confirmed.length,
      cancelled: mb.filter(b => CANCELLED_STATUSES.includes(b.status)).length,
      revenue: confirmed.reduce((s, b) => s + (b.totalPrice ?? 0), 0),
    }
  })
)

const annualTotal = computed(() => ({
  count: annualSummary.value.reduce((s, m) => s + m.count, 0),
  confirmed: annualSummary.value.reduce((s, m) => s + m.confirmed, 0),
  cancelled: annualSummary.value.reduce((s, m) => s + m.cancelled, 0),
  revenue: annualSummary.value.reduce((s, m) => s + m.revenue, 0),
}))

// ── 場館年度對比 ───────────────────────────────────────────────────────────
const venueStats = computed(() =>
  venues.map(v => {
    const vb = filtered.value.filter(b => b.venueId === v.id)
    const confirmed = vb.filter(b => ['confirmed', 'completed'].includes(b.status))
    const cancelled = vb.filter(b => CANCELLED_STATUSES.includes(b.status))
    return {
      id: v.id,
      name: v.name,
      count: vb.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      cancelRate: vb.length ? Math.round((cancelled.length / vb.length) * 100) : 0,
      revenue: confirmed.reduce((s, b) => s + (b.totalPrice ?? 0), 0),
    }
  }).filter(v => v.count > 0).sort((a, b) => b.count - a.count)
)

// ── 收款明細表 ─────────────────────────────────────────────────────────────
const invoiceList = computed(() =>
  filtered.value
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
)

// ── CSV 匯出 ───────────────────────────────────────────────────────────────
function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportAnnual() {
  downloadCSV(
    [
      ['月份', '預約數', '已確認', '已取消', '收款（NT$）'],
      ...annualSummary.value.map(m => [`${m.month}月`, m.count, m.confirmed, m.cancelled, m.revenue]),
      ['合計', annualTotal.value.count, annualTotal.value.confirmed, annualTotal.value.cancelled, annualTotal.value.revenue],
    ],
    `年度摘要_${filterYear.value}.csv`
  )
}

function exportVenue() {
  downloadCSV(
    [
      ['場館', '預約數', '已確認', '已取消', '取消率', '收款（NT$）'],
      ...venueStats.value.map(v => [v.name, v.count, v.confirmed, v.cancelled, `${v.cancelRate}%`, v.revenue]),
    ],
    `場館統計_${filterYear.value}.csv`
  )
}

function exportInvoice() {
  downloadCSV(
    [
      ['訂單編號', '場館', '申請人', '使用日期', '租借方式', '狀態', '金額（NT$）'],
      ...invoiceList.value.map(b => [
        b.reservationId, b.venueName, b.applicant, b.date,
        RENTAL_MODE_LABELS[b.rentalMode] ?? b.rentalMode, b.status, b.totalPrice,
      ]),
    ],
    `收款明細_${filterYear.value}.csv`
  )
}
</script>

<template>
  <div class="space-y-4 p-4">

    <!-- Header + 篩選 -->
    <div class="flex items-center justify-between flex-wrap gap-3">

      <div class="flex items-center gap-2 w-full flex-wrap">
        <!-- 年份 -->
        <div class="flex items-center">
          <button class="btn btn-ghost btn-square" @click="selectYear(filterYear - 1)">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="w-16 text-center font-semibold">{{ filterYear }}</span>
          <button class="btn btn-ghost btn-square" :disabled="filterYear >= today.getFullYear()"
            @click="selectYear(filterYear + 1)">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <!-- 場館 -->
        <select v-model="filterVenue" class="select">
          <option value="">全部場館</option>
          <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
        <!-- 狀態 -->
        <select v-model="filterStatus" class="select">
          <option value="">全部狀態</option>
          <option value="confirmed">預訂成功</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        <!-- 租借方式 -->
        <select v-model="filterMode" class="select">
          <option value="">全部方式</option>
          <option value="daily">全日</option>
          <option value="session">場次</option>
          <option value="hourly">計時</option>
        </select>
      </div>
    </div>

    <!-- 年度摘要表（Jan–Dec 橫向） -->
    <div class="card card-basic">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">{{ filterYear }} 年度摘要</h2>
          <button class="btn btn-outline gap-1" @click="exportAnnual">
            <span class="material-symbols-outlined">download</span>匯出
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th class="w-20">項目</th>
                <th v-for="m in MONTHS" :key="m" class="text-right min-w-12">{{ m }}月</th>
                <th class="text-right bg-base-200">合計</th>
              </tr>
            </thead>
            <tbody>
              <tr class="hover">
                <td class="text-base-content/50">預約數</td>
                <td v-for="m in annualSummary" :key="m.month" class="text-right tabular-nums">
                  {{ m.count || '—' }}
                </td>
                <td class="text-right font-semibold bg-base-200">{{ annualTotal.count }}</td>
              </tr>
              <tr class="hover">
                <td class="text-base-content/50">已確認</td>
                <td v-for="m in annualSummary" :key="m.month" class="text-right tabular-nums text-success">
                  {{ m.confirmed || '—' }}
                </td>
                <td class="text-right font-semibold bg-base-200 text-success">{{ annualTotal.confirmed }}</td>
              </tr>
              <tr class="hover">
                <td class="text-base-content/50">已取消</td>
                <td v-for="m in annualSummary" :key="m.month" class="text-right tabular-nums"
                  :class="m.cancelled > 0 ? 'text-error' : 'text-base-content/30'">
                  {{ m.cancelled || '—' }}
                </td>
                <td class="text-right font-semibold bg-base-200 text-error">{{ annualTotal.cancelled }}</td>
              </tr>
              <tr class="hover">
                <td class="text-base-content/50">收款（NT$）</td>
                <td v-for="m in annualSummary" :key="m.month" class="text-right tabular-nums">
                  {{ m.revenue > 0 ? m.revenue.toLocaleString() : '—' }}
                </td>
                <td class="text-right font-bold bg-base-200">{{ annualTotal.revenue.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 場館年度對比 -->
    <div class="card card-basic">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">場館年度對比</h2>
          <button class="btn btn-outline gap-1" @click="exportVenue">
            <span class="material-symbols-outlined">download</span>匯出
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>場館</th>
                <th class="text-right">預約數</th>
                <th class="text-right">已確認</th>
                <th class="text-right">已取消</th>
                <th class="text-right">取消率</th>
                <th class="text-right">收款（NT$）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in venueStats" :key="v.id" class="hover">
                <td class="font-medium">{{ v.name }}</td>
                <td class="text-right tabular-nums">{{ v.count }}</td>
                <td class="text-right tabular-nums text-success">{{ v.confirmed }}</td>
                <td class="text-right tabular-nums" :class="v.cancelled > 0 ? 'text-error' : 'text-base-content/30'">{{
                  v.cancelled || '—' }}</td>
                <td class="text-right tabular-nums">
                  <span v-if="v.cancelRate > 0" class="badge"
                    :class="v.cancelRate >= 20 ? 'badge-error' : 'badge-neutral'">{{ v.cancelRate }}%</span>
                  <span v-else class="text-base-content/30">—</span>
                </td>
                <td class="text-right tabular-nums font-semibold">NT$ {{ v.revenue.toLocaleString() }}</td>
              </tr>
              <tr v-if="venueStats.length === 0">
                <td colspan="6" class="text-center text-base-content/40 py-6">無資料</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 收款明細 -->
    <div class="card card-basic">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="font-semibold">收款明細</h2>
            <p class="text-base-content/40 mt-0.5">僅顯示已確認／已完成訂單，共 {{ invoiceList.length }} 筆</p>
          </div>
          <button class="btn btn-outline gap-1" @click="exportInvoice">
            <span class="material-symbols-outlined">download</span>匯出
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>場館</th>
                <th>申請人</th>
                <th>使用日期</th>
                <th>租借方式</th>
                <th>狀態</th>
                <th class="text-right">金額（NT$）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in invoiceList" :key="b.id" class="hover">
                <td class="text-base-content/50">{{ b.reservationId }}</td>
                <td>{{ b.venueName }}</td>
                <td>{{ b.applicant }}</td>
                <td class="whitespace-nowrap">{{ b.date }}</td>
                <td><span class="badge badge-ghost">{{ RENTAL_MODE_LABELS[b.rentalMode] ?? b.rentalMode
                    }}</span></td>
                <td><span class="badge" :class="b.status === 'completed' ? 'badge-neutral' : 'badge-success'">{{
                  b.status === 'completed' ?
                    '已完成' : '預訂成功' }}</span></td>
                <td class="text-right font-semibold tabular-nums">{{ (b.totalPrice ?? 0).toLocaleString()
                  }}</td>
              </tr>
              <tr v-if="invoiceList.length === 0">
                <td colspan="7" class="text-center text-base-content/40 py-6">無資料</td>
              </tr>
            </tbody>
            <tfoot v-if="invoiceList.length > 0">
              <tr class="border-t-2 border-base-300">
                <td colspan="6" class="font-semibold text-right">合計</td>
                <td class="text-right font-bold tabular-nums">
                  {{invoiceList.reduce((s, b) => s + (b.totalPrice ?? 0), 0).toLocaleString()}}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>
