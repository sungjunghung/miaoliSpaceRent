<template>
  <div class="space-y-4">
    <RoleSimulationPanel v-model="currentRole" />

    <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat bg-base-100 border border-base-200 rounded-box">
        <div class="stat-title">退款申請</div>
        <div class="stat-value text-2xl">{{ refunds.length }}</div>
      </div>
      <div class="stat bg-base-100 border border-base-200 rounded-box">
        <div class="stat-title">待承辦</div>
        <div class="stat-value text-2xl">{{ countByStatus('admin_review') }}</div>
      </div>
      <div class="stat bg-base-100 border border-base-200 rounded-box">
        <div class="stat-title">待會計</div>
        <div class="stat-value text-2xl">{{ countByStatus('accounting_review') }}</div>
      </div>
      <div class="stat bg-base-100 border border-base-200 rounded-box">
        <div class="stat-title">待出納</div>
        <div class="stat-value text-2xl">{{ countByStatus('cashier_processing') }}</div>
      </div>
    </section>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body gap-4">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h2 class="card-title">退款作業清單</h2>
          <p class="text-sm text-base-content/50">共 {{ filteredRefunds.length }} 筆符合條件</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <input v-model="search" type="text" class="input min-w-64 flex-1" placeholder="搜尋申請人、編號、Email、原因" />
          <select v-model="filterType" class="select w-fit min-w-44">
            <option value="">全部來源</option>
            <option value="booking_cancellation">訂單取消退款</option>
            <option value="retained_deposit">預留保證金退款</option>
          </select>
          <select v-model="filterStatus" class="select w-fit min-w-40">
            <option value="">全部狀態</option>
            <option value="admin_review">承辦初審</option>
            <option value="accounting_review">會計核定</option>
            <option value="cashier_processing">出納撥款</option>
            <option value="completed">退款完成</option>
            <option value="rejected">已駁回</option>
          </select>
          <select v-model="filterTodoRole" class="select w-fit min-w-40">
            <option value="">全部待辦角色</option>
            <option value="admin">承辦</option>
            <option value="accounting">會計</option>
            <option value="cashier">出納</option>
          </select>
        </div>

        <div class="overflow-x-auto border border-base-200 rounded-box">
          <table class="table">
            <thead>
              <tr>
                <th>狀態</th>
                <th>退款編號</th>
                <th>來源</th>
                <th>申請人</th>
                <th>申請日期</th>
                <th class="text-right">金額</th>
                <th>待辦</th>
                <th class="w-px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="refund in filteredRefunds" :key="refund.id" class="hover">
                <td>
                  <span :class="['badge', REFUND_STATUS_LABELS[refund.status].className]">
                    {{ REFUND_STATUS_LABELS[refund.status].label }}
                  </span>
                </td>
                <td class="font-mono text-base-content/70">{{ refund.id }}</td>
                <td>
                  <span class="badge badge-outline">{{ REFUND_TYPE_LABELS[refund.type] }}</span>
                  <p v-if="refund.bookingId" class="text-xs text-base-content/40 mt-1">訂單 #{{ refund.bookingId }}</p>
                </td>
                <td>
                  <p class="font-medium">{{ refund.memberName }}</p>
                  <p class="text-xs text-base-content/50">{{ refund.memberEmail }}</p>
                </td>
                <td class="whitespace-nowrap">{{ formatDate(refund.requestedAt) }}</td>
                <td class="text-right font-semibold whitespace-nowrap">
                  NT$ {{ (refund.amountApproved ?? refund.amountRequested).toLocaleString() }}
                </td>
                <td>
                  <span v-if="refundTodoRole(refund.status)" class="badge badge-outline">
                    {{ REFUND_STATUS_LABELS[refund.status].roleLabel }}
                  </span>
                  <span v-else class="text-base-content/30">—</span>
                </td>
                <td>
                  <button class="btn btn-ghost btn-square tooltip" title="檢視" data-tip="檢視" @click="openRefund(refund.id)">
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredRefunds.length === 0">
                <td colspan="8" class="text-center text-base-content/40 py-10">找不到符合條件的退款申請</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <AdminSlideDrawer
      v-if="selectedRefund"
      eyebrow="退款詳情"
      :title="selectedRefund.id"
      max-width-class="max-w-2xl"
      body-class="p-6 space-y-6"
      aria-label="關閉退款詳情"
      @close="closeDrawer"
    >
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-outline">{{ REFUND_TYPE_LABELS[selectedRefund.type] }}</span>
            <span :class="['badge', REFUND_STATUS_LABELS[selectedRefund.status].className]">
              {{ REFUND_STATUS_LABELS[selectedRefund.status].label }}
            </span>
            <span class="badge badge-ghost">目前角色：{{ ROLE_LABELS[currentRole] }}</span>
          </div>

          <ul v-if="selectedRefund.status !== 'rejected'" class="steps steps-vertical lg:steps-horizontal w-full">
            <li
              v-for="step in REFUND_STEPS"
              :key="step.key"
              class="step"
              :class="{
                'step-success': getRefundStepState(selectedRefund.status, step.key) === 'done',
                'step-warning': getRefundStepState(selectedRefund.status, step.key) === 'active',
              }"
            >
              {{ step.label }}
            </li>
          </ul>

          <div v-else class="alert alert-error alert-soft">
            <span class="material-symbols-outlined">cancel</span>
            <span>{{ selectedRefund.rejectedReason ?? '此退款申請已駁回。' }}</span>
          </div>

          <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="font-bold">申請人</h3>
                <p class="text-lg font-semibold">{{ selectedRefund.memberName }}</p>
                <p>{{ selectedRefund.memberPhone }}</p>
                <p class="text-base-content/60">{{ selectedRefund.memberEmail }}</p>
                <router-link
                  :to="{ name: 'admin-member-detail', params: { id: selectedRefund.memberId } }"
                  class="btn btn-sm btn-outline w-fit mt-2"
                >
                  查看會員
                </router-link>
              </div>
            </div>
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="font-bold">退款金額</h3>
                <p class="text-2xl font-bold">NT$ {{ selectedRefund.amountRequested.toLocaleString() }}</p>
                <p v-if="selectedRefund.amountApproved" class="text-success">
                  核定：NT$ {{ selectedRefund.amountApproved.toLocaleString() }}
                </p>
              </div>
            </div>
          </section>

          <section class="card bg-base-100 border border-base-200">
            <div class="card-body">
              <h3 class="font-bold">申請內容</h3>
              <table class="table">
                <tbody>
                  <tr>
                    <td class="text-base-content/50 w-32">申請日期</td>
                    <td>{{ formatDate(selectedRefund.requestedAt) }}</td>
                  </tr>
                  <tr>
                    <td class="text-base-content/50">退款原因</td>
                    <td>{{ selectedRefund.reason }}</td>
                  </tr>
                  <tr>
                    <td class="text-base-content/50">收款帳戶</td>
                    <td>
                      {{ selectedRefund.bankAccount.bankName }} {{ selectedRefund.bankAccount.branchName }}<br>
                      {{ selectedRefund.bankAccount.accountName }} / {{ selectedRefund.bankAccount.accountNumber }}
                    </td>
                  </tr>
                  <tr v-if="selectedRefund.bankbookImage">
                    <td class="text-base-content/50">存摺封面</td>
                    <td class="flex items-center justify-between gap-2">
                      <span>{{ selectedRefund.bankbookImage }}</span>
                      <button class="btn btn-ghost btn-sm">檢視</button>
                    </td>
                  </tr>
                  <tr v-if="selectedBooking">
                    <td class="text-base-content/50">關聯訂單</td>
                    <td>
                      <router-link
                        :to="{ name: 'admin-booking-detail', params: { id: selectedBooking.id } }"
                        class="link link-primary"
                      >
                        {{ selectedBooking.reservationId }} {{ selectedBooking.venueName }}
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card bg-base-100 border border-base-200">
            <div class="card-body">
              <h3 class="font-bold">處理紀錄</h3>
              <ul class="timeline timeline-vertical">
                <li>
                  <div class="timeline-start">{{ formatDate(selectedRefund.requestedAt) }}</div>
                  <div class="timeline-middle"><span class="material-symbols-outlined text-base">radio_button_checked</span></div>
                  <div class="timeline-end timeline-box">會員送出申請</div>
                  <hr>
                </li>
                <li v-if="selectedRefund.adminApprovedAt">
                  <div class="timeline-start">{{ formatDate(selectedRefund.adminApprovedAt) }}</div>
                  <div class="timeline-middle"><span class="material-symbols-outlined text-base">check_circle</span></div>
                  <div class="timeline-end timeline-box">承辦核定</div>
                  <hr>
                </li>
                <li v-if="selectedRefund.accountingApprovedAt">
                  <div class="timeline-start">{{ formatDate(selectedRefund.accountingApprovedAt) }}</div>
                  <div class="timeline-middle"><span class="material-symbols-outlined text-base">check_circle</span></div>
                  <div class="timeline-end timeline-box">會計核定</div>
                  <hr>
                </li>
                <li v-if="selectedRefund.cashierCompletedAt">
                  <div class="timeline-start">{{ formatDate(selectedRefund.cashierCompletedAt) }}</div>
                  <div class="timeline-middle"><span class="material-symbols-outlined text-base text-success">paid</span></div>
                  <div class="timeline-end timeline-box">出納完成撥款</div>
                </li>
                <li v-if="selectedRefund.rejectedAt">
                  <div class="timeline-start">{{ formatDate(selectedRefund.rejectedAt) }}</div>
                  <div class="timeline-middle"><span class="material-symbols-outlined text-base text-error">cancel</span></div>
                  <div class="timeline-end timeline-box">已駁回：{{ selectedRefund.rejectedReason }}</div>
                </li>
              </ul>
            </div>
          </section>

          <section class="card bg-base-100 border border-base-200">
            <div class="card-body">
              <h3 class="font-bold">簽核操作</h3>

              <template v-if="selectedRefund.status === 'admin_review'">
                <div v-if="currentRole === 'admin'" class="space-y-3">
                  <fieldset class="fieldset">
                    <label class="label">核定退款金額</label>
                    <label class="input w-full max-w-xs">
                      <span class="text-base-content/50">NT$</span>
                      <input v-model.number="approvedAmountInput" type="number" min="1" :max="selectedRefund.amountRequested" />
                    </label>
                  </fieldset>
                  <div class="flex justify-end gap-2">
                    <button class="btn btn-error" @click="rejectSelected">駁回</button>
                    <button class="btn btn-primary" :disabled="!approvedAmountInput" @click="approveSelectedAdmin">
                      核准交會計
                    </button>
                  </div>
                </div>
                <LockedStage v-else stage="承辦初審" />
              </template>

              <template v-else-if="selectedRefund.status === 'accounting_review'">
                <div v-if="currentRole === 'accounting'" class="space-y-3">
                  <div class="alert alert-info alert-soft">
                    <span class="material-symbols-outlined">info</span>
                    <span>承辦核定金額：NT$ {{ (selectedRefund.amountApproved ?? 0).toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-end gap-2">
                    <button class="btn btn-error" @click="rejectSelected">駁回</button>
                    <button class="btn btn-primary" @click="approveSelectedAccounting">核定無誤</button>
                  </div>
                </div>
                <LockedStage v-else stage="會計核定" />
              </template>

              <template v-else-if="selectedRefund.status === 'cashier_processing'">
                <div v-if="currentRole === 'cashier'" class="space-y-3">
                  <div class="alert alert-info alert-soft">
                    <span class="material-symbols-outlined">payments</span>
                    <span>請依收款帳戶完成撥款後再結案。</span>
                  </div>
                  <div class="flex justify-end">
                    <button class="btn btn-primary" @click="completeSelectedCashier">確認已撥款</button>
                  </div>
                </div>
                <LockedStage v-else stage="出納撥款" />
              </template>

              <div v-else class="alert alert-success alert-soft">
                <span class="material-symbols-outlined">task_alt</span>
                <span>此退款申請已結案，無待辦操作。</span>
              </div>

              <fieldset v-if="selectedRefund.status !== 'completed' && selectedRefund.status !== 'rejected'" class="fieldset mt-2">
                <label class="label">駁回原因</label>
                <textarea v-model="rejectReason" class="textarea w-full" rows="2"></textarea>
              </fieldset>
            </div>
          </section>
    </AdminSlideDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RoleSimulationPanel from './bookings/components/RoleSimulationPanel.vue'
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue'
import { useBookingsStore } from '@/stores/bookings'
import {
  REFUND_STATUS_LABELS,
  REFUND_STEPS,
  REFUND_TYPE_LABELS,
  getRefundStepState,
  refundTodoRole,
  useRefundsStore,
  type RefundRole,
  type RefundSourceType,
  type RefundStatus,
} from '@/stores/refunds'

const LockedStage = defineComponent({
  props: {
    stage: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'alert alert-warning alert-soft' }, [
      h('span', { class: 'material-symbols-outlined' }, 'lock'),
      h('span', `${props.stage} 階段僅對應角色可操作。`),
    ])
  },
})

const ROLE_LABELS: Record<RefundRole, string> = {
  admin: '承辦',
  accounting: '會計',
  cashier: '出納',
}

const refundsStore = useRefundsStore()
const bookingsStore = useBookingsStore()
const route = useRoute()

const currentRole = ref<RefundRole>('admin')
const filterType = ref<'' | RefundSourceType>('')
const filterStatus = ref<'' | RefundStatus>('')
const filterTodoRole = ref<'' | RefundRole>('')
const search = ref('')
const selectedRefundId = ref<string | null>(null)
const approvedAmountInput = ref<number | null>(null)
const rejectReason = ref('資料不齊或不符合退款規定。')

const refunds = computed(() => refundsStore.refunds)
const selectedRefund = computed(() => selectedRefundId.value ? refundsStore.getById(selectedRefundId.value) : null)
const selectedBooking = computed(() =>
  selectedRefund.value?.bookingId ? bookingsStore.getById(selectedRefund.value.bookingId) : null
)

const filteredRefunds = computed(() =>
  refunds.value
    .filter(refund => {
      if (filterType.value && refund.type !== filterType.value) return false
      if (filterStatus.value && refund.status !== filterStatus.value) return false
      if (filterTodoRole.value && refundTodoRole(refund.status) !== filterTodoRole.value) return false
      const q = search.value.trim().toLowerCase()
      if (!q) return true
      return [
        refund.id,
        refund.memberName,
        refund.memberEmail,
        refund.memberPhone,
        refund.reason,
        refund.bookingId ? String(refund.bookingId) : '',
      ].some(value => value.toLowerCase().includes(q))
    })
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
)

watch(selectedRefund, refund => {
  approvedAmountInput.value = refund?.amountApproved ?? refund?.amountRequested ?? null
})

watch(() => route.query, query => {
  const refundIdParam = query.refundId
  const refundId = Array.isArray(refundIdParam) ? refundIdParam[0] : refundIdParam
  if (typeof refundId === 'string' && refundsStore.getById(refundId)) {
    selectedRefundId.value = refundId
    return
  }

  const bookingIdParam = query.bookingId
  const bookingIdRaw = Array.isArray(bookingIdParam) ? bookingIdParam[0] : bookingIdParam
  const bookingId = typeof bookingIdRaw === 'string' ? Number(bookingIdRaw) : NaN
  if (!Number.isNaN(bookingId)) {
    const matched = refunds.value.find(refund =>
      refund.type === 'booking_cancellation' &&
      refund.bookingId === bookingId
    )
    if (matched) {
      selectedRefundId.value = matched.id
      return
    }
    search.value = String(bookingId)
  }
}, { immediate: true })

function countByStatus(status: RefundStatus) {
  return refunds.value.filter(refund => refund.status === status).length
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return date.replaceAll('-', '/')
}

function openRefund(id: string) {
  selectedRefundId.value = id
}

function closeDrawer() {
  selectedRefundId.value = null
}

function approveSelectedAdmin() {
  if (!selectedRefund.value || !approvedAmountInput.value) return
  refundsStore.approveAdmin(selectedRefund.value.id, approvedAmountInput.value)
}

function approveSelectedAccounting() {
  if (!selectedRefund.value) return
  refundsStore.approveAccounting(selectedRefund.value.id)
}

function completeSelectedCashier() {
  if (!selectedRefund.value) return
  refundsStore.completeCashier(selectedRefund.value.id)
}

function rejectSelected() {
  if (!selectedRefund.value) return
  refundsStore.rejectRefund(selectedRefund.value.id, rejectReason.value || '不符合退款規定。')
}
</script>
