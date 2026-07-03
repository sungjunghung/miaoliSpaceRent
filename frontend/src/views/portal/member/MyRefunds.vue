<template>
  <PageHeaderBasic
    title="我的退款"
    description="查看訂單取消與預留保證金退款申請進度。"
  />

  <main class="container lg:max-w-5xl mx-auto py-10 px-4 space-y-6">
    <section class="space-y-4">
      <div v-if="memberRefunds.length === 0" class="card bg-base-100 border border-base-200">
        <div class="card-body items-center text-center py-12">
          <span class="material-symbols-outlined text-5xl text-base-content/30">receipt_long</span>
          <p class="font-medium">目前沒有退款申請</p>
          <router-link to="/member/profile" class="btn btn-primary btn-sm mt-2">前往個人資料申請保證金退款</router-link>
        </div>
      </div>

      <article
        v-for="refund in memberRefunds"
        :key="refund.id"
        class="card bg-base-100 border border-base-200 shadow-sm"
      >
        <div class="card-body gap-4">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="card-title">{{ refund.id }}</h3>
            <span class="badge badge-outline">{{ REFUND_TYPE_LABELS[refund.type] }}</span>
            <span :class="['badge', getPortalRefundStatusDisplay(refund.status).className]">
              {{ getPortalRefundStatusDisplay(refund.status).label }}
            </span>
          </div>

          <div v-if="refund.status === 'rejected'" class="alert alert-error alert-soft">
            <span class="material-symbols-outlined">cancel</span>
            <span>{{ refund.rejectedReason ?? '此退款申請已駁回。' }}</span>
          </div>

          <div class="overflow-x-auto" data-lenis-prevent>
            <table class="table">
              <tbody>
                <tr>
                  <td class="text-base-content/50 w-32">申請日期</td>
                  <td>{{ formatDate(refund.requestedAt) }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/50">退款原因</td>
                  <td>{{ refund.reason }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/50">申請金額</td>
                  <td class="font-semibold">NT$ {{ refund.amountRequested.toLocaleString() }}</td>
                </tr>
                <tr v-if="refund.amountApproved">
                  <td class="text-base-content/50">核定金額</td>
                  <td class="font-semibold">NT$ {{ refund.amountApproved.toLocaleString() }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/50">收款帳戶</td>
                  <td v-if="refund.bankAccount">{{ refund.bankAccount.bankName }} {{ refund.bankAccount.branchName }} / {{ refund.bankAccount.accountName }} / {{ refund.bankAccount.accountNumber }}</td>
                  <td v-else class="text-base-content/50">待補（承辦人員將與您聯繫確認）</td>
                </tr>
                <tr v-if="refund.bookingId">
                  <td class="text-base-content/50">關聯訂單</td>
                  <td>
                    <router-link :to="{ name: 'booking-detail', params: { id: refund.bookingId } }" class="link link-primary">
                      查看預約 #{{ refund.bookingId }}
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHeaderBasic from '@/components/portal/PageHeaderBasic.vue'
import { useAuthStore } from '@/stores/auth'
import { REFUND_TYPE_LABELS, useRefundsStore } from '@/stores/refunds'
import { getPortalRefundStatusDisplay } from '@/utils/bookingStatus'
import { users as mockUsers } from '@/services/userService'

const authStore = useAuthStore()
const refundsStore = useRefundsStore()

const demoUser = mockUsers[0]
const currentUser = computed(() => authStore.user ?? demoUser)

const memberRefunds = computed(() =>
  refundsStore.getByMemberId(currentUser.value.id)
    .slice()
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
)

function formatDate(date: string | null) {
  if (!date) return '—'
  return date.replaceAll('-', '/')
}
</script>
