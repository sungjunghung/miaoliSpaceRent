<script setup lang="ts">
import { inject, ref, computed, type Ref, type ComputedRef } from 'vue';
import OpeningHoursEditor from './components/OpeningHoursEditor.vue';
import type { VenueBaseRecord, VenueEditFormData } from '@/services/venueEditService';

const formData = inject<Ref<VenueEditFormData>>('venueFormData')!;
const allVenues = inject<ComputedRef<VenueBaseRecord[]>>('allVenues')!;

const topLevelVenues = computed(() =>
  allVenues.value.filter((v) => v.parentId === null && v.id !== formData.value.id),
);

function getVenueDepth(v: VenueBaseRecord): number {
  let depth = 0;
  let current = v;
  while (current.parentId !== null) {
    depth++;
    const parent = allVenues.value.find((p) => p.id === current.parentId);
    if (!parent) break;
    current = parent;
  }
  return depth;
}

// 設施管理
const newFacility = ref('');
const facilityDragIndex = ref<number | null>(null);
const facilityDragOverIndex = ref<number | null>(null);

function normalizeFacility(value: string) {
  return value.trim().toLowerCase();
}

function ensureFacilities() {
  if (!formData.value.facilities) formData.value.facilities = [];
}

function parseFacilities(raw: string) {
  return raw
    .split(/[\n,，、]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function addFacilities(values: string[]) {
  ensureFacilities();
  const existed = new Set(formData.value.facilities.map(normalizeFacility));
  for (const val of values) {
    const normalized = normalizeFacility(val);
    if (!normalized || existed.has(normalized)) continue;
    formData.value.facilities.push(val.trim());
    existed.add(normalized);
  }
}

function addFacility() {
  addFacilities(parseFacilities(newFacility.value));
  newFacility.value = '';
}

function removeFacility(index: number) {
  formData.value.facilities.splice(index, 1);
}

function onFacilityDragStart(index: number) {
  facilityDragIndex.value = index;
}

function onFacilityDragOver(index: number) {
  if (facilityDragIndex.value === null || facilityDragIndex.value === index) return;
  facilityDragOverIndex.value = index;
}

function onFacilityDrop(targetIndex: number) {
  if (facilityDragIndex.value === null || facilityDragIndex.value === targetIndex) return;
  const moved = formData.value.facilities.splice(facilityDragIndex.value, 1)[0];
  formData.value.facilities.splice(targetIndex, 0, moved);
  facilityDragIndex.value = null;
  facilityDragOverIndex.value = null;
}

function onFacilityDragEnd() {
  facilityDragIndex.value = null;
  facilityDragOverIndex.value = null;
}

// 假日定義（場館層級共用，影響各模式假日價格）
const weekdayOptions = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
];

function toggleWeekendDay(day: number) {
  const days = formData.value.weekendDays;
  const idx = days.indexOf(day);
  if (idx >= 0) {
    days.splice(idx, 1);
  } else {
    days.push(day);
  }
}

// 注意事項管理
const newNotice = ref('');
const noticeDragIndex = ref<number | null>(null);
const noticeDragOverIndex = ref<number | null>(null);

function addNotice() {
  const val = newNotice.value.trim();
  if (!val) return;
  if (!formData.value.notices) formData.value.notices = [];
  formData.value.notices.push(val);
  newNotice.value = '';
}

function removeNotice(index: number) {
  formData.value.notices.splice(index, 1);
}

function onNoticeDragStart(index: number) {
  noticeDragIndex.value = index;
}

function onNoticeDragOver(index: number) {
  if (noticeDragIndex.value === null || noticeDragIndex.value === index) return;
  noticeDragOverIndex.value = index;
}

function onNoticeDrop(targetIndex: number) {
  if (noticeDragIndex.value === null || noticeDragIndex.value === targetIndex) return;
  const moved = formData.value.notices.splice(noticeDragIndex.value, 1)[0];
  formData.value.notices.splice(targetIndex, 0, moved);
  noticeDragIndex.value = null;
  noticeDragOverIndex.value = null;
}

function onNoticeDragEnd() {
  noticeDragIndex.value = null;
  noticeDragOverIndex.value = null;
}

function handleSave() {
  alert('基礎資料儲存成功（prototype 模擬）');
}
</script>

<template>
  <div class="admin-container-info">
    <!-- 基本資訊 -->
    <div class="card basic-card">
      <div class="card-body">
        <h2 class="card-title">基本資訊</h2>
        <fieldset class="fieldset append">

          <label class="label">所屬場館（父層）</label>
          <select v-model="formData.parentId" class="select">
            <option :value="null">頂層場館</option>
            <option v-for="v in topLevelVenues" :key="v.id" :value="v.id">
              {{ '　'.repeat(getVenueDepth(v)) }}{{ v.name }}
            </option>
          </select>

          <label class="label">場館名稱</label>
          <input v-model="formData.name" type="text" placeholder="例如：風雨籃球場" class="input" />

          <label class="label">可容納人數</label>
          <input v-model.number="formData.capacity" type="number" min="1" placeholder="50" class="input" />

          <label class="label">場館地址</label>
          <input v-model="formData.location" type="text" placeholder="例如：苗栗縣竹南鎮體育路1號" class="input" />

          <label class="label">描述</label>
          <textarea v-model="formData.description" placeholder="請輸入場館描述…"
            class="textarea min-h-32 max-w-3xl w-full"></textarea>

        </fieldset>
      </div>
    </div>

    <!-- 營運時間 -->
    <OpeningHoursEditor v-model="formData.openingHours" />

    <!-- 假日定義（各租借模式共用） -->
    <div class="card basic-card">
      <div class="card-body space-y-3">
        <h2 class="card-title">
          <span class="material-symbols-outlined text-primary">calendar_month</span>
          啟用假日價格
        </h2>
        <label class="label cursor-pointer justify-start gap-3 w-fit">
          <input type="checkbox" class="toggle toggle-primary" v-model="formData.weekendPricingEnabled" />
          <span>此場館使用假日價格</span>
        </label>
        <template v-if="formData.weekendPricingEnabled">
          <p class="text-sm text-base-content/50">勾選的星期將適用假日價格，所有租借模式共用此設定</p>
          <div class="flex flex-wrap gap-8">
            <label v-for="wd in weekdayOptions" :key="wd.value" class="label cursor-pointer gap-2">
              <input type="checkbox" class="checkbox checkbox-success"
                :checked="formData.weekendDays?.includes(wd.value)" @change="toggleWeekendDay(wd.value)" />
              <span>{{ wd.label }}</span>
            </label>
            <label class="label cursor-pointer gap-2">
              <input type="checkbox" class="checkbox checkbox-success" v-model="formData.weekendIncludeHolidays" />
              <span>法定國定假日</span>
            </label>
          </div>
        </template>
      </div>
    </div>

    <!-- 設施 -->
    <div class="card basic-card">
      <div class="card-body">
        <h2 class="card-title">場館設施</h2>
        <p class="text-sm text-base-content/60">可拖曳調整排序</p>
        <div class="flex gap-2 mb-3">
          <input v-model="newFacility" type="text" placeholder="輸入設施後按 Enter 或點擊新增（支援逗號/換行）" class="input input-bordered flex-1"
            @keyup.enter="addFacility" />
          <button type="button" class="btn btn-primary" @click="addFacility">新增</button>
        </div>
        <div class="space-y-2">
          <div v-if="!formData.facilities?.length" class="text-base-content/30 italic p-3">尚未新增任何設施</div>
          <div v-for="(facility, index) in formData.facilities" :key="index"
            class="flex items-center gap-3 p-2 bg-base-200/50 rounded-lg cursor-grab select-none transition-all"
            :class="{
              'opacity-60 cursor-grabbing': facilityDragIndex === index,
              'ring-2 ring-primary': facilityDragOverIndex === index,
            }"
            draggable="true"
            @dragstart="onFacilityDragStart(index)"
            @dragover.prevent="onFacilityDragOver(index)"
            @drop="onFacilityDrop(index)"
            @dragend="onFacilityDragEnd">
            <button type="button" class="btn btn-ghost btn-circle btn-xs" @click="removeFacility(index)">✕</button>
            <span class="badge badge-neutral">{{ index + 1 }}</span>
            <p class="flex-1">{{ facility }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 注意事項 -->
    <div class="card basic-card">
      <div class="card-body">
        <h2 class="card-title">注意事項</h2>
        <p class="text-sm text-base-content/60">可拖曳調整排序</p>
        <div class="flex gap-2 mb-3">
          <input v-model="newNotice" type="text" placeholder="輸入注意事項後按 Enter 或點擊新增" class="input input-bordered flex-1"
            @keyup.enter="addNotice" />
          <button type="button" class="btn btn-primary" @click="addNotice">新增</button>
        </div>
        <div class="space-y-2">
          <div v-if="!formData.notices?.length" class="text-base-content/30 italic p-3">尚未設定注意事項</div>
          <div v-for="(notice, index) in formData.notices" :key="index"
            class="flex items-center gap-3 p-2 bg-base-200/50 rounded-lg cursor-grab select-none transition-all"
            :class="{
              'opacity-60 cursor-grabbing': noticeDragIndex === index,
              'ring-2 ring-primary': noticeDragOverIndex === index,
            }"
            draggable="true"
            @dragstart="onNoticeDragStart(index)"
            @dragover.prevent="onNoticeDragOver(index)"
            @drop="onNoticeDrop(index)"
            @dragend="onNoticeDragEnd">
            <button type="button" class="btn btn-ghost btn-circle btn-xs" @click="removeNotice(index)">✕</button>
            <span class="badge badge-neutral">{{ index + 1 }}</span>
            <p class="flex-1">{{ notice }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
  <!-- 儲存（sticky） -->
  <div class="sticky bottom-0 z-10 flex justify-end border-t border-base-300 bg-base-100/90 py-3 backdrop-blur">
    <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存基礎資料</button>
  </div>
</template>
