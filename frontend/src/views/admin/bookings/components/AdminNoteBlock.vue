<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Booking } from '@/stores/bookings'

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
          <button class="btn btn-primary" @click="adminNoteEdit = false">儲存</button>
        </div>
      </div>
    </div>
</template>
