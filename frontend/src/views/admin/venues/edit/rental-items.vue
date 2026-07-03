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

// 單位量詞選項（涵蓋常見租借設備：桌椅、影音器材、帳篷、舞台等）
const unitOptions = ['個', '張', '把', '台', '組', '套', '支', '面', '頂', '座', '塊', '條', '架', '間', '箱', '捲', '次'];

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
    <div class="admin-container-flush">
      <div role="alert" class="alert alert-info alert-soft">
        <span class="material-symbols-outlined">info</span>
        <span>設定場地可租借的設備或額外收費項目，金額為 0 表示免費提供；可拖曳排序。</span>
      </div>
      <button type="button" class="btn btn-neutral" @click="addItem">
        <span class="material-symbols-outlined">add</span> 新增附加項目
      </button>
      <div v-if="formData.rentalItems?.length" class="basis-table">
        <table class="table table-sm w-full">
          <thead>
            <tr>
              <th>項目名稱</th>
              <th>單位</th>
              <th>金額</th>
              <th>數量</th>
              <th>租借上限</th>
              <th class="w-px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in formData.rentalItems" :key="index"
              class="cursor-grab select-none transition-all" :class="{
                'opacity-60 cursor-grabbing': dragIndex === index,
                'bg-primary/10': dragOverIndex === index,
              }" draggable="true" @dragstart="onDragStart(index)" @dragover.prevent="onDragOver(index)"
              @drop="onDrop(index)" @dragend="onDragEnd">
              <td><input v-model="item.label" type="text" placeholder="例如：摺疊桌" class="input w-full min-w-48" /></td>
              <td>
                <select v-model="item.unit" class="select w-24">
                  <option v-for="u in unitOptions" :key="u" :value="u">{{ u }}</option>
                </select>
              </td>
              <td>
                <label class="input w-32">
                  <input v-model.number="item.amount" type="number" min="0" class="grow min-w-0 text-end" />
                  <span class="shrink-0">元</span>
                </label>
              </td>
              <td>
                <label class="input w-28">
                  <input v-model.number="item.quantity" type="number" min="1" class="grow min-w-0 text-end" />
                  <span class="shrink-0">{{ item.unit }}</span>
                </label>
              </td>
              <td>
                <label class="input w-28">
                  <input v-model.number="item.maxPerBooking" type="number" min="1" :max="item.quantity"
                    class="grow min-w-0 text-end" />
                  <span class="shrink-0">{{ item.unit }}</span>
                </label>
              </td>
              <td>
                <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeItem(index)">
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!formData.rentalItems?.length" class="text-base-content/30 italic p-3">尚未設定附加項目</div>

    </div>

    <div class="sticky bottom-0 z-10 flex justify-end border-t border-base-300 bg-base-100/90 py-3 backdrop-blur">
      <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存附加項目</button>
    </div>

</template>
