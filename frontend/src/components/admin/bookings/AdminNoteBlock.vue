<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBookingsStore, type Booking } from '@/stores/bookings'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  booking: Booking
}>()

const bookingsStore = useBookingsStore()
const { showToast } = useToast()

const adminNoteEdit = ref(false)
const adminNoteVal = ref('')

watch(() => props.booking, b => {
  if (b) adminNoteVal.value = b.adminNote ?? ''
}, { immediate: true })

function saveNote() {
  bookingsStore.updateAdminNote(props.booking.id, adminNoteVal.value)
  adminNoteEdit.value = false
  showToast('備註已儲存')
}
</script>
<template>
    <div class="card basic-card">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h3 class="card-title">管理員備注</h3>
          <button class="btn btn-ghost" @click="adminNoteEdit = !adminNoteEdit">
            {{ adminNoteEdit ? '取消' : '編輯' }}
          </button>
        </div>
        <textarea v-if="adminNoteEdit" v-model="adminNoteVal" class="textarea textarea-bordered w-full" rows="3"
          placeholder="輸入管理員備注..."></textarea>
        <p v-else class="text-base-content/70 min-h-8">
          {{ adminNoteVal || '（無備注）' }}
        </p>
        <div v-if="adminNoteEdit" class="flex justify-end">
          <button class="btn btn-primary" @click="saveNote">儲存</button>
        </div>
      </div>
    </div>
</template>
