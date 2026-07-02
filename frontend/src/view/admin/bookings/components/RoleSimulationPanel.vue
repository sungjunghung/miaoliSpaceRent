<script setup lang="ts">
defineProps<{
  modelValue: 'admin' | 'cashier' | 'accounting'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'admin' | 'cashier' | 'accounting'): void
}>()
</script>

<template>
  <div class="alert alert-info alert-soft flex justify-around mb-4">
    <div class="flex items-center gap-2 flex-1">
      <span class="material-symbols-outlined">admin_panel_settings</span>
      <div>
        <h4 class="font-bold">實機操作展示：對帳權限隔離機制</h4>
        <p class="opacity-80">您現在可以切換下方角色，測試跨處室按鈕把關流程。</p>
        <span v-if="modelValue === 'admin'" class="badge badge-outline">目前登入：承辦</span>
        <span v-if="modelValue === 'accounting'" class="badge badge-outline">目前登入：會計</span>
        <span v-if="modelValue === 'cashier'" class="badge badge-outline">目前登入：出納</span>
      </div>
    </div>
    <div class="tabs tabs-box">
      <input class="tab" type="radio" name="demo_role_action" aria-label="承辦行政端" :checked="modelValue === 'admin'"
        @change="emit('update:modelValue', 'admin')" />
      <input class="tab" type="radio" name="demo_role_action" aria-label="會計核定端" :checked="modelValue === 'accounting'"
        @change="emit('update:modelValue', 'accounting')" />
      <input class="tab" type="radio" name="demo_role_action" aria-label="財務出納端" :checked="modelValue === 'cashier'"
        @change="emit('update:modelValue', 'cashier')" />
    </div>
  </div>
</template>
