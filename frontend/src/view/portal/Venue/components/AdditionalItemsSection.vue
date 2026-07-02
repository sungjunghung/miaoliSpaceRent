<script setup lang="ts">
interface RentalItem {
  label: string
  unit: string
  amount: number
  quantity: number
  maxPerBooking: number
}

const props = defineProps<{
  items: RentalItem[]
  modelValue: Record<string, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, number>]
}>()

function toggleFee(label: string, defaultValue = 1) {
  const next = { ...props.modelValue }
  if (next[label]) {
    delete next[label]
  } else {
    next[label] = defaultValue
  }
  emit('update:modelValue', next)
}

function updateFeeQuantity(label: string, qty: number) {
  const next = { ...props.modelValue }
  if (qty <= 0) {
    delete next[label]
  } else {
    next[label] = qty
  }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3 border-b border-base-200 pb-2">
      <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
        <span class="material-symbols-outlined">receipt_long</span>
      </div>
      <div>
        <h3 class="text-lg font-bold text-base-content">附加項目</h3>
        <p>依需求勾選附加項目</p>
      </div>
    </div>
    <div class="space-y-2">
      <div v-for="item in items" :key="item.label"
        class="flex items-center gap-3 p-3 rounded-box border transition"
        :class="modelValue[item.label] ? 'border-primary shadow-md' : 'border-base-200 hover:border-base-300'">
        <label class="flex items-center gap-3 cursor-pointer shrink-0 min-w-32">
          <input type="checkbox" class="checkbox checkbox-success" :checked="!!modelValue[item.label]"
            @change="toggleFee(item.label, 1)" />
          <span>
            {{ item.label }}
            <span v-if="item.amount === 0" class="badge badge-sm badge-success ml-1">免費</span>
          </span>
        </label>
        <div class="flex-1 flex justify-end items-center gap-3 text-nowrap">
          <div v-show="modelValue[item.label] && item.maxPerBooking > 1" class="join">
            <button class="join-item btn btn-outline"
              @click="updateFeeQuantity(item.label, (modelValue[item.label] || 1) - 1)">-</button>
            <input type="number" class="join-item input input-bordered w-16 text-center" min="1"
              :max="item.maxPerBooking" :value="modelValue[item.label]"
              @input="(e) => updateFeeQuantity(item.label, Math.min(Number((e.target as HTMLInputElement).value), item.maxPerBooking))" />
            <button class="join-item btn btn-outline"
              @click="updateFeeQuantity(item.label, Math.min((modelValue[item.label] || 1) + 1, item.maxPerBooking))">+</button>
          </div>
          <span v-if="item.amount > 0" class="font-bold text-base-content shrink-0 text-right w-32">${{ item.amount.toLocaleString() }} / {{ item.unit }}</span>
          <span v-else class="text-success shrink-0 text-right w-32">免費 / {{ item.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>``
