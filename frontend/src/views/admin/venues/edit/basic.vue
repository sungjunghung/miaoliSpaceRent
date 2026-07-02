<script setup lang="ts">
import { inject, ref, computed, type Ref, type ComputedRef } from 'vue';
import OpeningHoursEditor from './components/OpeningHoursEditor.vue';

interface Venue {
  id: number;
  parentId: number | null;
  name: string;
  status: string;
  capacity: number;
  location: string;
  type: string;
  description: string;
  facilities: string[];
  openingHours: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }>;
  closedWeekdays: number[];
  closedDates: string[];
  notices: string[];
  isActive?: boolean;
}

const formData = inject<Ref<Venue>>('venueFormData')!;
const allVenues = inject<ComputedRef<Venue[]>>('allVenues')!;

const topLevelVenues = computed(() =>
  allVenues.value.filter((v) => v.parentId === null && v.id !== formData.value.id),
);

function getVenueDepth(v: Venue): number {
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
  <div class="space-y-4 p-4">
    <!-- 基本資訊 -->
    <div class="card bg-base-100 shadow-sm">
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

    <!-- 設施 -->
    <div class="card bg-base-100 shadow-sm">
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
    <div class="card bg-base-100 shadow-sm">
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
