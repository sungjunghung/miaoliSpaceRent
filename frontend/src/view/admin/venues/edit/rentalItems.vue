<script setup lang="ts">
import { inject, ref, type Ref } from 'vue';

interface RentalItem {
  label: string;
  unit: string;
  amount: number;
  quantity: number;
  maxPerBooking: number;
}

interface Venue {
  rentalItems: RentalItem[];
}

const formData = inject<Ref<Venue>>('venueFormData')!;
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

if (!('rentalItems' in formData.value)) {
  (formData.value as any).rentalItems = [];
}

function addItem() {
  formData.value.rentalItems.push({ label: '', unit: '個', amount: 0, quantity: 1, maxPerBooking: 1 });
}

function removeItem(index: number) {
  formData.value.rentalItems.splice(index, 1);
}

function onDragStart(index: number) {
  dragIndex.value = index;
}

function onDragOver(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return;
  dragOverIndex.value = index;
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;
  const moved = formData.value.rentalItems.splice(dragIndex.value, 1)[0];
  formData.value.rentalItems.splice(targetIndex, 0, moved);
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function handleSave() {
  alert('附加項目儲存成功（prototype 模擬）');
}
</script>

<template>
  <div class="space-y-3">
    <div role="alert" class="alert alert-info">
      <span class="material-symbols-outlined">info</span>
      <span>設定場地可租借的設備或額外收費項目，金額為 0 表示免費提供；可拖曳排序。</span>
    </div>

    <div v-for="(item, index) in formData.rentalItems" :key="index"
      class="bg-base-100 rounded p-4 relative cursor-grab select-none transition-all"
      :class="{
        'opacity-60 cursor-grabbing': dragIndex === index,
        'ring-2 ring-primary': dragOverIndex === index,
      }"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent="onDragOver(index)"
      @drop="onDrop(index)"
      @dragend="onDragEnd">
      <div class="fieldset flex gap-4">
        <button type="button" class="btn btn-error btn-ghost btn-square self-end" @click="removeItem(index)">
          <span class="material-symbols-outlined">delete</span>
        </button>
        <div class="form-control">
          <label class="label">項目名稱</label>
          <div class="input">
            <input v-model="item.label" type="text" placeholder="例如：摺疊桌" class="input" />
          </div>
        </div>
        <div class="form-control">
          <label class="label">單位</label>
          <div class="input">
            <input v-model="item.unit" type="text" placeholder="張、台、組…" class="input" />
          </div>
        </div>
        <div class="form-control">
          <label class="label">金額</label>
          <div class="input">
            <input v-model.number="item.amount" type="number" min="0" class="input text-end" />
            <span>{{ item.amount === 0 ? '免費' : '元' }}</span>
          </div>
        </div>
        <div class="form-control">
          <label class="label">數量</label>
          <div class="input">
            <input v-model.number="item.quantity" type="number" min="1" class="input text-end" />
            <span>{{ item.unit }}</span>
          </div>
        </div>
        <div class="form-control">
          <label class="label">租借上限</label>
          <div class="input">
            <input v-model.number="item.maxPerBooking" type="number" min="1" :max="item.quantity"
              class="input text-end" />
            <span>{{ item.unit }}/次</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!formData.rentalItems?.length" class="text-base-content/30 italic p-3">尚未設定附加項目</div>
    <button type="button" class="btn btn-neutral w-fit" @click="addItem">＋ 新增項目</button>
  </div>

  <div class="flex justify-end">
    <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存附加項目</button>
  </div>
</template>
