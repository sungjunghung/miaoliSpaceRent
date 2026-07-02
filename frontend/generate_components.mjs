import fs from 'fs';
import path from 'path';

const dir = './src/view/admin/bookings/components';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = {
  'BookingInfoBlock.vue': `<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'
import { RENTAL_MODE_LABELS, formatBookingDate } from '../../../../composables/useBookingFormat'

defineProps<{
  booking: Booking
}>()

const emit = defineEmits<{
  (e: 'editSchedule'): void
}>()

const today = new Date().toISOString().slice(0, 10)
const formatDate = (b: Booking) => formatBookingDate(b, true)
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base">預約資訊</h3>
          </div>
        </div>
        <table class="table ">
          <tbody>
            <tr><td class="text-base-content/50 w-28">訂單編號</td><td class="font-mono text-sm">{{ booking.reservationId }}</td></tr>
            <tr><td class="text-base-content/50">建立時間</td><td>{{ booking.createdAt }}</td></tr>
            <tr><td class="text-base-content/50 w-28">場館</td><td class="font-medium">{{ booking.venueName }}</td></tr>
            <tr><td class="text-base-content/50">租借方式</td><td>{{ RENTAL_MODE_LABELS[booking.rentalMode] }}</td></tr>
            <tr>
              <td class="text-base-content/50">使用日期</td>
              <td class="flex items-center justify-between">{{ formatDate(booking) }}
                <button v-if="!['cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(booking.status)"
                  class="btn btn-ghost btn-sm gap-1" @click="emit('editSchedule')"
                  :disabled="(booking.endDate ?? booking.date) < today">
                  <span class="material-symbols-outlined text-sm">edit_calendar</span>異動
                </button>
              </td>
            </tr>
            <tr v-if="booking.purpose"><td class="text-base-content/50">使用目的</td><td>{{ booking.purpose }}</td></tr>
            <tr v-if="booking.peopleCount"><td class="text-base-content/50">預計人數</td><td>{{ booking.peopleCount }} 人</td></tr>
          </tbody>
        </table>
      </div>
    </div>
</template>
`,

  'ApplicantInfoBlock.vue': `<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'

defineProps<{
  booking: Booking
  member: any
}>()
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base">申請帳號</h3>
        <table class="table">
          <tbody>
            <tr><td class="text-base-content/50 w-28">姓名</td><td class="font-medium">{{ booking.applicant }}</td></tr>
            <tr v-if="member"><td class="text-base-content/50">電話</td><td>{{ member.phone }}</td></tr>
            <tr v-if="member"><td class="text-base-content/50">電子信箱</td><td>{{ member.email }}</td></tr>
          </tbody>
        </table>
        <p v-if="booking.note" class="text-sm bg-base-200 rounded px-3 py-2 mt-1">
          <span class="text-base-content/50 text-xs">備註：</span>{{ booking.note }}
        </p>
      </div>
    </div>
</template>
`,

  'DocumentReviewBlock.vue': `<script setup lang="ts">
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
                <span class="material-symbols-outlined text-xl" :class="doc.uploaded ? 'text-success' : 'text-error'">
                  {{ doc.uploaded ? 'check_circle' : 'cancel' }}
                </span>
              </td>
              <td>{{ doc.label }}</td>
              <td class="text-right">
                <template v-if="doc.uploaded">
                  <button class="btn btn-ghost btn-sm">檢視</button>
                  <button class="btn btn-ghost btn-sm">下載</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="booking.documentRejectReason" class="alert alert-error py-2 text-sm mt-2">
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
`,

  'FeeDetailsBlock.vue': `<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'
import { RENTAL_MODE_LABELS } from '../../../../composables/useBookingFormat'

defineProps<{
  booking: Booking
}>()
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base">費用明細</h3>
        <table class="table ">
          <tbody>
            <tr>
              <td class="text-base-content/50">場地費（{{ RENTAL_MODE_LABELS[booking.rentalMode] }}）</td>
              <td class="text-right">NT$ {{ booking.baseFee.toLocaleString() }}</td>
            </tr>
            <tr v-if="booking.deposit">
              <td class="text-base-content/50">保證金</td>
              <td class="text-right">NT$ {{ booking.deposit.toLocaleString() }}</td>
            </tr>
            <tr v-for="fee in booking.additionalFees" :key="fee.label">
              <td class="text-base-content/50">{{ fee.label }}　{{ fee.unit ?? '' }}</td>
              <td class="text-right">NT$ {{ fee.amount.toLocaleString() }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-bold border-t border-base-200">
              <td>合計</td>
              <td class="text-right">NT$ {{ booking.totalPrice.toLocaleString() }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
</template>
`,

  'PaymentReviewBlock.vue': `<script setup lang="ts">
import type { Booking } from '../../../../stores/bookings'

defineProps<{
  booking: Booking
  currentRole: 'admin' | 'cashier' | 'accounting'
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
                <tr><td class="text-base-content/50">末五碼</td><td class="font-mono">{{ booking.remittance.last5 }}</td></tr>
                <tr><td class="text-base-content/50">金額</td><td>NT$ {{ booking.remittance.amount.toLocaleString() }}</td></tr>
                <tr><td class="text-base-content/50">時間</td><td>{{ booking.remittance.datetime }}</td></tr>
                <tr v-if="booking.remittance.note"><td class="text-base-content/50">備註</td><td>{{ booking.remittance.note }}</td></tr>
                <tr v-if="booking.remittance.receiptImage">
                  <td class="text-base-content/50">匯款圖片</td>
                  <td class="flex items-center justify-between">
                    {{ booking.remittance.receiptImage }}
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm">檢視</button>
                      <button class="btn btn-ghost btn-sm">下載</button>
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
            <template v-else-if="currentRole === 'cashier'">
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
`,

  'AdminNoteBlock.vue': `<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Booking } from '../../../../stores/bookings'

const props = defineProps<{
  booking: Booking
}>()

const adminNoteEdit = ref(false)
const adminNoteVal = ref('')

watch(() => props.booking, b => {
  if (b) adminNoteVal.value = b.adminNote ?? ''
}, { immediate: true })
</script>
<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-base">管理員備注</h3>
          <button class="btn btn-ghost btn-xs" @click="adminNoteEdit = !adminNoteEdit">
            {{ adminNoteEdit ? '取消' : '編輯' }}
          </button>
        </div>
        <textarea v-if="adminNoteEdit" v-model="adminNoteVal" class="textarea textarea-bordered w-full" rows="3"
          placeholder="輸入管理員備注..."></textarea>
        <p v-else class="text-sm text-base-content/70 min-h-8">
          {{ adminNoteVal || '（無備注）' }}
        </p>
        <div v-if="adminNoteEdit" class="flex justify-end">
          <button class="btn btn-primary btn-sm" @click="adminNoteEdit = false">儲存</button>
        </div>
      </div>
    </div>
</template>
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, filename), content);
}
