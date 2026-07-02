<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Booking } from '../../../../stores/bookings'
import mockUsers from '../../../../mocks/users.json'

import RoleSimulationPanel from './RoleSimulationPanel.vue'
import RefundProcessingBlock from './RefundProcessingBlock.vue'
import BookingInfoBlock from './BookingInfoBlock.vue'
import ApplicantInfoBlock from './ApplicantInfoBlock.vue'
import DocumentReviewBlock from './DocumentReviewBlock.vue'
import FeeDetailsBlock from './FeeDetailsBlock.vue'
import PaymentReviewBlock from './PaymentReviewBlock.vue'
import AdminNoteBlock from './AdminNoteBlock.vue'
import ScheduleEditModal from './ScheduleEditModal.vue'

const props = defineProps<{
  booking: Booking
}>()

const member = computed(() =>
  props.booking.userId ? mockUsers.find(user => user.id === props.booking.userId) : null
)

// 角色切換（prototype 展示用，上線前改為從 auth store 讀取）
const currentRole = ref<'admin' | 'cashier' | 'accounting'>('admin')

const scheduleEditModal = ref<InstanceType<typeof ScheduleEditModal> | null>(null)
</script>

<template>
  <div class="space-y-4">
    <!-- 實機操作展示：對帳權限隔離機制 -->
    <RoleSimulationPanel v-model="currentRole" />

    <!-- 取消/退款摘要；實際退款作業集中於退款作業頁 -->
    <RefundProcessingBlock :booking="booking" />

    <!-- 場館 + 時間 -->
    <BookingInfoBlock :booking="booking" @editSchedule="scheduleEditModal?.openModal()" />

    <!-- 申請人 / 會員 -->
    <ApplicantInfoBlock :booking="booking" :member="member" />

    <!-- 申請文件 -->
    <DocumentReviewBlock :booking="booking" :currentRole="currentRole" />

    <!-- 費用明細 -->
    <FeeDetailsBlock :booking="booking" />

    <!-- 匯款資訊 / 繳費狀態 -->
    <PaymentReviewBlock :booking="booking" :currentRole="currentRole" />

    <!-- 管理員備注 -->
    <AdminNoteBlock :booking="booking" />

    <!-- 日期/時段異動 Modal -->
    <ScheduleEditModal ref="scheduleEditModal" :booking="booking" />
  </div>
</template>
