<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Booking } from '../../../../stores/bookings'

const props = defineProps<{
  booking: Booking
  currentRole: 'admin' | 'cashier' | 'accounting'
}>()

const rejectReasonEdit = ref(false)
const rejectReasonVal = ref('')

watch(() => props.booking, b => {
  if (b) rejectReasonVal.value = b.documentRejectReason ?? ''
}, { immediate: true })
</script>
<template>
    <div v-if="booking.documents?.length" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title">申請文件</h3>
        <table class="table">
          <tbody>
            <tr v-for="doc in booking.documents" :key="doc.key">
              <td class="w-6 pr-0">
                <span class="material-symbols-outlined" :class="doc.uploaded ? 'text-success' : 'text-error'">
                  {{ doc.uploaded ? 'check_circle' : 'cancel' }}
                </span>
              </td>
              <td>{{ doc.label }}</td>
              <td class="text-right">
                <template v-if="doc.uploaded">
                  <button class="btn btn-ghost">檢視</button>
                  <button class="btn btn-ghost">下載</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="booking.documentRejectReason" class="alert alert-error py-2 mt-2">
          <span class="material-symbols-outlined text-base shrink-0">info</span>
          <span>退件原因：{{ booking.documentRejectReason }}</span>
        </div>
        <div v-if="booking.documentUploadDeadline && !booking.documents?.every(d => d.uploaded)" role="alert"
          class="alert alert-error alert-soft">
          <span class="material-symbols-outlined text-base-content/30">hourglass_empty</span>
          <span>文件尚未全數上傳，上傳截止：{{ booking.documentUploadDeadline }}</span>
        </div>
        <div v-if="booking.documentApprovedAt" role="alert" class="alert alert-soft alert-success">
          <span class="material-symbols-outlined text-base shrink-0">check_circle</span>
          <span>文件已全數上傳並審核通過！審核通過：{{ booking.documentApprovedAt }}</span>
        </div>
        <template v-if="booking.status === 'document_review' && currentRole === 'admin'">
          <div class="divider"></div>
          <div v-if="!rejectReasonEdit" class="flex justify-end gap-2">
            <button class="btn" @click="rejectReasonEdit = true">退件</button>
            <button class="btn">審核通過（進入繳費）</button>
          </div>
          <div v-if="rejectReasonEdit" class="mt-3 space-y-2">
            <label class="label">退件原因</label>
            <textarea v-model="rejectReasonVal" class="textarea textarea-bordered w-full" rows="2" placeholder="請輸入退件原因..."></textarea>
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost" @click="rejectReasonEdit = false">取消</button>
              <button class="btn btn-error" :disabled="!rejectReasonVal.trim()">確認退件</button>
            </div>
          </div>
        </template>
      </div>
    </div>
</template>
