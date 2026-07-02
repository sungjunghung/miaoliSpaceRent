<script setup lang="ts">
defineProps<{
  setupAllowanceHours: number
  teardownAllowanceHours: number
  setupOverageUnitMinutes: number
  setupTimeOptions: number[]
  teardownTimeOptions: number[]
  selectedSetupHours: number
  selectedTeardownHours: number
  setupCost: number
  teardownCost: number
}>()

const emit = defineEmits<{
  'update:selectedSetupHours': [value: number]
  'update:selectedTeardownHours': [value: number]
}>()

function formatHours(h: number): string {
  if (h === 0) return '不需要'
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  if (whole > 0 && mins > 0) return `${whole}小時${mins}分鐘`
  if (whole > 0) return `${whole}小時`
  return `${mins}分鐘`
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3 border-b border-base-200 pb-2">
      <div class="aspect-square bg-neutral w-8 flex items-center justify-center rounded text-base-100">
        <span class="material-symbols-outlined">build</span>
      </div>
      <div>
        <h3 class="text-lg font-bold text-base-content">場佈與撤場時間</h3>
        <p>超出免費時數後，每 {{ setupOverageUnitMinutes }} 分鐘另計費用</p>
      </div>
    </div>
    <div class="space-y-2">
      <!-- 場佈 -->
      <div class="flex items-center gap-3 p-3 rounded-box border transition"
        :class="setupCost > 0 ? 'border-primary shadow-md' : 'border-base-200 hover:border-base-300'">
        <div class="flex items-center gap-3 shrink-0 min-w-32">
          <span class="material-symbols-outlined text-base">construction</span>
          <span>
            場佈時間
            <span class="badge badge-sm badge-success ml-1">前 {{ setupAllowanceHours }} 小時免費</span>
          </span>
        </div>
        <div class="flex-1 flex justify-end items-center gap-3">
          <select :value="selectedSetupHours" class="select select-bordered w-36"
            @change="emit('update:selectedSetupHours', Number(($event.target as HTMLSelectElement).value))">
            <option v-for="h in setupTimeOptions" :key="h" :value="h">{{ formatHours(h) }}</option>
          </select>
          <span class="font-bold shrink-0 text-right w-32">
            {{ setupCost > 0 ? `+$${setupCost.toLocaleString()}` : '免費' }}
          </span>
        </div>
      </div>
      <!-- 撤場 -->
      <div class="flex items-center gap-3 p-3 rounded-box border transition"
        :class="teardownCost > 0 ? 'border-primary shadow-md' : 'border-base-200 hover:border-base-300'">
        <div class="flex items-center gap-3 shrink-0 min-w-32">
          <span class="material-symbols-outlined text-base">move_item</span>
          <span>
            撤場時間
            <span class="badge badge-sm badge-success ml-1">前 {{ teardownAllowanceHours }} 小時免費</span>
          </span>
        </div>
        <div class="flex-1 flex justify-end items-center gap-3">
          <select :value="selectedTeardownHours" class="select select-bordered w-36"
            @change="emit('update:selectedTeardownHours', Number(($event.target as HTMLSelectElement).value))">
            <option v-for="h in teardownTimeOptions" :key="h" :value="h">{{ formatHours(h) }}</option>
          </select>
          <span class="font-bold shrink-0 text-right w-32">
            {{ teardownCost > 0 ? `+$${teardownCost.toLocaleString()}` : '免費' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
