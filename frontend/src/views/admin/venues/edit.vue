<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAllVenueBaseRecords, getVenueEditFormData, type VenueEditFormData } from '@/services/venueEditService';

const route = useRoute();
const router = useRouter();

const venueId = computed(() => Number(route.params.id));
const formData = ref<VenueEditFormData>({
  id: 0,
  parentId: null,
  name: '',
  status: 'available',
  capacity: 0,
  location: '',
  type: '',
  description: '',
  mainImageUrl: '',
  gallery: [],
  pricePerHour: 0,
  facilities: [],
  openingHours: {},
  rentalModes: {
    daily: {
      enabled: false,
      minDays: 0,
      maxDays: 0,
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
    session: {
      enabled: false,
      sessions: [],
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
    hourly: {
      enabled: false,
      minHours: 0,
      maxHours: 0,
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
  },
  pricing: { daily: {}, session: {}, hourly: {} },
  closedWeekdays: [],
  closedDates: [],
  rentalItems: [],
  notices: [],
  isActive: true,
  advanceBookingDays: 7,
  latestBookingDays: 1,
  receiptUploadDeadlineDays: 3,
  documentUploadDeadlineDays: 7,
  cancellationDeadlineDays: 7,
  weekendDays: [0, 6],
  weekendIncludeHolidays: false,
  weekendPricingEnabled: false,
  requiredDocuments: [],
});

onMounted(() => {
  const venue = getVenueEditFormData(venueId.value);
  if (venue) {
    formData.value = venue;
  }
});

const allVenues = computed(() => getAllVenueBaseRecords());

provide('venueFormData', formData);
provide('allVenues', allVenues);

const tabs = [
  { key: 'basic', label: '場館資料', routeName: 'admin-venue-edit-basic' },
  { key: 'rental', label: '租借方式', routeName: 'admin-venue-edit-rental' },
  { key: 'rental-items', label: '附加項目', routeName: 'admin-venue-edit-rental-items' },
  { key: 'photos', label: '場館場館照片', routeName: 'admin-venue-edit-photos' },
];

const activeTab = computed(() => {
  const name = route.name as string;
  const tab = tabs.find((t) => t.routeName === name);
  return tab?.key ?? 'basic';
});

function navigateTab(tab: (typeof tabs)[number]) {
  router.replace({ name: tab.routeName, params: { id: venueId.value } });
}

// 場館層級：狀態變更（單一真理來源，取代原 isActive 開關）
const STATUS_OPTIONS = [
  { value: 'available', label: '開放中' },
  { value: 'maintenance', label: '維護中' },
  { value: 'closed', label: '已關閉' },
];
function statusLabel(s: string) {
  return { available: '開放中', maintenance: '維護中', closed: '已關閉' }[s] ?? s;
}
function statusClass(s: string) {
  return { available: 'badge-success', maintenance: 'badge-warning', closed: 'badge-error' }[s] ?? '';
}
function dotClass(s: string) {
  return { available: 'bg-success', maintenance: 'bg-warning', closed: 'bg-error' }[s] ?? 'bg-base-300';
}
function setStatus(value: string) {
  formData.value.status = value;
  (document.activeElement as HTMLElement)?.blur();
}

// 場館層級：刪除
const deleteOpen = ref(false);
const childCount = computed(
  () => allVenues.value.filter((v) => v.parentId === venueId.value).length,
);
function confirmDelete() {
  deleteOpen.value = false;
  // 原型：實際刪除待接後端；先返回場館列表
  router.push({ name: 'admin-venues' });
}
</script>

<template>
  <!-- 頁籤以上區塊（動作列 + 頁籤）固定在頂部 -->
  <div class="sticky top-0 z-20 bg-base-100 border-b border-base-300 ">
    <!-- 場館層級動作列：名稱 + 狀態變更 + 刪除 -->
    <div class="flex flex-wrap items-center gap-3 bg-base-100 px-4 py-3">
      <div class="flex items-center gap-2">
        <!-- <span class="text-sm text-base-content/60">狀態</span> -->
        <div class="dropdown">
          <button type="button" tabindex="0" class="btn btn-sm btn-outline gap-2">
            <span class="inline-block w-2 h-2 rounded-full" :class="dotClass(formData.status)"></span>
            {{ statusLabel(formData.status) }}
            <span class="material-symbols-outlined text-base">expand_more</span>
          </button>
          <ul tabindex="0"
            class="dropdown-content menu z-10 mt-1 w-36 rounded-box bg-base-100 p-1 shadow border border-base-300">
            <li v-for="s in STATUS_OPTIONS" :key="s.value">
              <a :class="{ active: formData.status === s.value }" @click="setStatus(s.value)">
                <span class="inline-block w-2 h-2 rounded-full" :class="dotClass(s.value)"></span>{{ s.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <h1 class="text-lg font-bold truncate">{{ formData.name || '未命名場館' }}</h1>
      <button type="button" class="btn btn-error btn-outline btn-sm ml-auto gap-1" @click="deleteOpen = true">
        <span class="material-symbols-outlined text-sm">delete</span>
        刪除場館
      </button>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-border bg-base-100 px-2">
      <button v-for="tab in tabs" :key="tab.key" role="tab" class="tab" :class="{ 'tab-active': activeTab === tab.key }"
        @click="navigateTab(tab)">
        {{ tab.label }}
      </button>
    </div>
  </div>
  <!-- Sub-page content -->
  <router-view />

  <!-- 刪除確認 -->
  <dialog class="modal" :class="{ 'modal-open': deleteOpen }">
    <div class="modal-box">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-error">warning</span>
        刪除場館
      </h3>
      <p class="py-4">
        確定要刪除「<span class="font-semibold">{{ formData.name || '未命名場館' }}</span>」嗎？此操作無法復原。
      </p>
      <div v-if="childCount" role="alert" class="alert alert-warning">
        <span class="material-symbols-outlined">error</span>
        <span>此場館含 {{ childCount }} 個子場地，將一併刪除。</span>
      </div>
      <div class="modal-action">
        <button type="button" class="btn" @click="deleteOpen = false">取消</button>
        <button type="button" class="btn btn-error" @click="confirmDelete">刪除</button>
      </div>
    </div>
    <button type="button" class="modal-backdrop" aria-label="關閉" @click="deleteOpen = false"></button>
  </dialog>
</template>
