<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking } from '@/stores/bookings'
import { RENTAL_MODE_LABELS } from '@/utils/bookingFormat'
import mockVenues from '@/mocks/venues.json'

const props = defineProps<{
  booking: Booking
}>()

const isEditing = ref(false)
const localBaseFee = ref(0)
const localDeposit = ref(0)
// Using any[] for simplicity to avoid importing AdditionalFee type if it's not exported
const localAdditionalFees = ref<any[]>([])

const currentVenue = computed(() => mockVenues.find(v => v.id === props.booking.venueId))
const systemItemMap = computed(() => {
  const map = new Map<string, { label: string; unit: string; amount: number; maxPerBooking: number }>()
  ;((currentVenue.value as any)?.rentalItems ?? []).forEach((item: any) => {
    map.set(item.label, {
      label: item.label,
      unit: item.unit,
      amount: item.amount,
      maxPerBooking: item.maxPerBooking ?? 1,
    })
  })
  return map
})

function enrichAdditionalFee(rawFee: any) {
  const fee = { ...rawFee }
  const matched = systemItemMap.value.get(fee.label)
  if (!matched) return { ...fee, isSystemItem: false }

  const unitPrice = matched.amount
  const inferredQty = fee.quantity && fee.quantity > 0
    ? fee.quantity
    : unitPrice > 0
      ? Math.max(1, Math.round((fee.amount ?? 0) / unitPrice))
      : 1
  const quantity = Math.min(inferredQty, matched.maxPerBooking)

  return {
    ...fee,
    isSystemItem: true,
    quantity,
    unitPrice,
    unit: matched.unit,
    amount: unitPrice * quantity,
    maxPerBooking: matched.maxPerBooking,
  }
}

function updateSystemFeeQuantity(fee: any, nextQuantity: number) {
  const safeQuantity = Math.max(1, Math.min(nextQuantity, fee.maxPerBooking ?? 1))
  fee.quantity = safeQuantity
  fee.amount = (fee.unitPrice ?? 0) * safeQuantity
}

function startEdit() {
  localBaseFee.value = props.booking.baseFee
  localDeposit.value = props.booking.deposit ?? 0
  localAdditionalFees.value = JSON.parse(JSON.stringify(props.booking.additionalFees ?? []))
    .map(enrichAdditionalFee)
  isEditing.value = true
}

function saveEdit() {
  props.booking.baseFee = localBaseFee.value
  props.booking.deposit = localDeposit.value
  props.booking.additionalFees = localAdditionalFees.value
  // Update total price
  props.booking.totalPrice = localBaseFee.value + localDeposit.value + localAdditionalFees.value.reduce((sum, f) => sum + (f.amount || 0), 0)
  isEditing.value = false
}

const computedTotal = computed(() => {
  if (!isEditing.value) return props.booking.totalPrice
  return localBaseFee.value + localDeposit.value + localAdditionalFees.value.reduce((sum, f) => sum + (f.amount || 0), 0)
})
</script>

<template>
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-base">費用明細</h3>
          <button v-if="!isEditing" class="btn btn-ghost" @click="startEdit">編輯</button>
        </div>
        <table class="table">
          <tbody>
            <tr>
              <td class="text-base-content/50">場地費（{{ RENTAL_MODE_LABELS[booking.rentalMode] }}）</td>
              <td class="text-right">
                <template v-if="!isEditing">NT$ {{ booking.baseFee.toLocaleString() }}</template>
                <div v-else class="flex items-center justify-end gap-2">
                  <span >NT$</span>
                  <input v-model.number="localBaseFee" type="number" class="input input-bordered w-24 text-right" />
                </div>
              </td>
            </tr>
            <tr v-if="!isEditing ? booking.deposit : true">
              <td class="text-base-content/50">保證金</td>
              <td class="text-right">
                <template v-if="!isEditing">NT$ {{ (booking.deposit || 0).toLocaleString() }}</template>
                <div v-else class="flex items-center justify-end gap-2">
                  <span >NT$</span>
                  <input v-model.number="localDeposit" type="number" class="input input-bordered w-24 text-right" />
                </div>
              </td>
            </tr>
            <!-- Display Mode for additional fees -->
            <template v-if="!isEditing">
              <tr v-for="fee in booking.additionalFees" :key="fee.label">
                <td class="text-base-content/50">{{ fee.label }}　{{ fee.unit ?? '' }}</td>
                <td class="text-right">NT$ {{ fee.amount.toLocaleString() }}</td>
              </tr>
            </template>
            <!-- Edit Mode for additional fees -->
            <template v-else>
              <tr v-for="(fee, index) in localAdditionalFees" :key="index">
                <td class="text-base-content/50">
                  <div v-if="fee.isSystemItem" class="flex items-center gap-2">
                    <span class="font-medium">{{ fee.label }}</span>
                    <span class="text-base-content/60">/{{ fee.unit }}</span>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <input v-model="fee.label" type="text" class="input input-bordered w-28" placeholder="項目名稱" />
                    <input v-model="fee.unit" type="text" class="input input-bordered w-20" placeholder="單位(選填)" />
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <template v-if="fee.isSystemItem">
                      <span>單價 NT$ {{ (fee.unitPrice ?? 0).toLocaleString() }}</span>
                      <span>×</span>
                      <input :value="fee.quantity" type="number" min="1" :max="fee.maxPerBooking"
                        class="input input-bordered w-20 text-right"
                        @input="updateSystemFeeQuantity(fee, Number(($event.target as HTMLInputElement).value))" />
                    </template>
                    <template v-else>
                      <span>NT$</span>
                      <input v-model.number="fee.amount" type="number" class="input input-bordered w-24 text-right" />
                    </template>
                    <button class="btn btn-ghost text-error btn-square" @click="localAdditionalFees.splice(index, 1)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <button class="btn btn-ghost w-full border-dashed border border-base-300" @click="localAdditionalFees.push({ label: '新增項目', amount: 0, unit: '' })">
                    <span class="material-symbols-outlined">add</span> 新增收費項目
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="font-bold border-t border-base-200">
              <td>合計</td>
              <td class="text-right">NT$ {{ computedTotal.toLocaleString() }}</td>
            </tr>
          </tfoot>
        </table>

        <div v-if="isEditing" class="flex justify-end gap-2 mt-4">
          <button class="btn btn-ghost" @click="isEditing = false">取消</button>
          <button class="btn btn-primary" @click="saveEdit">儲存變更</button>
        </div>
      </div>
    </div>
</template>
