<script setup lang="ts">
import type { Booking } from '@/stores/bookings'

defineProps<{
  booking: Booking
}>()
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base">繳費狀態</h3>
        <template v-if="booking.documents?.some(d => d.required) && !booking.documentApprovedAt">
          <div role="alert" class="alert alert-soft alert-info">
            <span class="material-symbols-outlined text-base shrink-0">info</span>
            <span>尚未完成申請文件上傳與確認，待文件審核通過後，將進入繳費流程。</span>
          </div>
        </template>
        <template v-else>
          <template v-if="booking.remittance">
            <table class="table">
              <tbody>
                <tr><td class="text-base-content/50 w-28">戶名</td><td>{{ booking.remittance.senderName }}</td></tr>
                <tr><td class="text-base-content/50">末五碼</td><td >{{ booking.remittance.last5 }}</td></tr>
                <tr><td class="text-base-content/50">金額</td><td>NT$ {{ booking.remittance.amount.toLocaleString() }}</td></tr>
                <tr><td class="text-base-content/50">時間</td><td>{{ booking.remittance.datetime }}</td></tr>
                <tr v-if="booking.remittance.note"><td class="text-base-content/50">備註</td><td>{{ booking.remittance.note }}</td></tr>
                <tr v-if="booking.remittance.receiptImage">
                  <td class="text-base-content/50">匯款圖片</td>
                  <td class="flex items-center justify-between">
                    {{ booking.remittance.receiptImage }}
                    <div class="flex gap-1">
                      <button class="btn btn-ghost">檢視</button>
                      <button class="btn btn-ghost">下載</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <template v-if="booking.paymentApprovedAt">
              <div role="alert" class="alert alert-soft alert-success">
                <span class="material-symbols-outlined text-base shrink-0">check_circle</span>
                <span>匯款已確認，確認日期：{{ booking.paymentApprovedAt }}</span>
              </div>
            </template>
            <template v-else>
              <div class="divider"></div>
              <div class="flex justify-end gap-2">
                <button class="btn">帳款不符退回</button>
                <button class="btn">確認核銷入帳（預訂成功）</button>
              </div>
            </template>
          </template>
          <template v-else>
            <div role="alert" class="alert alert-error alert-soft">
              <span class="material-symbols-outlined text-base-content/30">hourglass_empty</span>
              <span>用戶尚未提交繳費資訊，繳費截止：{{ booking.receiptUploadDeadline }}</span>
            </div>
          </template>
        </template>
      </div>
    </div>
</template>
