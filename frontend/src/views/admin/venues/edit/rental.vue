<script setup lang="ts">
import { inject, computed, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import RentalModeSettings from './components/RentalModeSettings.vue';
import IdentityPricingTable from './components/IdentityPricingTable.vue';
import type { RequiredDocument, VenueEditFormData } from '@/services/venueEditService';

type ModeKey = 'daily' | 'session' | 'hourly';

const formData = inject<Ref<VenueEditFormData>>('venueFormData')!;

const MODE_LABELS: Record<ModeKey, string> = { daily: '整日租借', session: '時段租借', hourly: '計時租借' };
// 模式由路由參數決定（頂層頁籤：整日/時段/計時共用本頁）
const route = useRoute();
const activeMode = computed<ModeKey>(() => (route.params.mode as ModeKey) || 'daily');

// 假日價格是否啟用 = 場館層級開關（各處假日欄位依此顯示）
const weekendPricingEnabled = computed(() => formData.value.weekendPricingEnabled);

function addSession() {
  formData.value.rentalModes.session.sessions.push({
    name: '',
    startTime: '08:00',
    endTime: '12:00',
    weekday: 0,
    weekend: 0,
    identityRows: [],
  });
}

function removeSession(index: number) {
  formData.value.rentalModes.session.sessions.splice(index, 1);
}

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

// 一鍵套用：把「規則類」設定（非定價）從來源模式複製到目標模式
const SHARED_KEYS = [
  'depositEnabled', 'depositAmount',
  'setupTeardownEnabled',
  'setupAllowanceHours', 'teardownAllowanceHours',
  'setupOverageUnitMinutes', 'teardownOverageUnitMinutes',
  'setupOverageFeePerUnit', 'teardownOverageFeePerUnit',
  'advanceBookingDays', 'latestBookingDays', 'cancellationDeadlineDays',
  'receiptUploadDeadlineDays', 'documentUploadDeadlineDays', 'requireDocuments',
] as const;

const copiedMsg = ref('');
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
function showCopied(msg: string) {
  copiedMsg.value = msg;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copiedMsg.value = ''), 2600);
}

function copyModeSettings({ from, to }: { from: string; to: string }) {
  const src = formData.value.rentalModes[from as ModeKey] as any;
  const targets = (to === 'all'
    ? (['daily', 'session', 'hourly'] as const).filter((m) => m !== from)
    : [to as ModeKey]);
  for (const t of targets) {
    const dst = formData.value.rentalModes[t] as any;
    for (const k of SHARED_KEYS) dst[k] = src[k];
    dst.requiredDocuments = (src.requiredDocuments ?? []).map((d: RequiredDocument, i: number) => ({
      ...d,
      key: `${t}-${Date.now()}-${i}`,
    }));
  }
  const toLabel = to === 'all' ? '其他所有模式' : MODE_LABELS[to as ModeKey];
  showCopied(`已將「${MODE_LABELS[from as ModeKey]}」的規則設定套用到${toLabel}（不含定價）`);
}

function handleSave() {
  alert('租借方式儲存成功（prototype 模擬）');
}
</script>

<template>
  <div class="admin-container-info">
    <!-- 整日租借 -->
    <RentalModeSettings v-if="activeMode === 'daily'" mode-key="daily" @copy="copyModeSettings">
      <template #limits>
        <fieldset class="fieldset append">
          <label class="label">最少租借天數</label>
          <div class="input">
            <input v-model.number="formData.rentalModes.daily.minDays" type="number" min="1" class="grow text-end" />
            <span>天</span>
          </div>
        </fieldset>
        <fieldset class="fieldset append">
          <label class="label">最多租借天數</label>
          <div class="input">
            <input v-model.number="formData.rentalModes.daily.maxDays" type="number" min="1" class="grow text-end" />
            <span>天</span>
          </div>
        </fieldset>
      </template>

      <!-- 價格表：「一般民眾」為基準列，可自訂新增身份 -->
      <IdentityPricingTable :pricing="formData.pricing.daily" :weekend-pricing-enabled="weekendPricingEnabled" />
    </RentalModeSettings>

    <!-- 時段租借 -->
    <RentalModeSettings v-if="activeMode === 'session'" mode-key="session" @copy="copyModeSettings">
      <p class="text-sm text-base-content/50 mb-2">自訂租借時段；每個時段可各自設定名稱、時間與身份價格。</p>

      <div v-if="!formData.rentalModes.session.sessions.length" class="text-center text-base-content/30 italic py-4">
        尚未新增時段
      </div>

      <div v-for="(session, index) in formData.rentalModes.session.sessions" :key="index" class="basis-box p-4 space-y-3">
        <!-- 時段基本資料 -->
        <div class="flex items-center gap-2">
          <input v-model="session.name" type="text" placeholder="時段名稱" class="input flex-1" />
          <select v-model="session.startTime" class="select flex-1">
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <span class="text-base-content/50">~</span>
          <select v-model="session.endTime" class="select flex-1">
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button type="button" class="btn btn-error btn-ghost btn-square btn-sm ml-auto" @click="removeSession(index)">
            <span class="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>

        <!-- 該時段的身份價格表：一般民眾為基準列 -->
        <IdentityPricingTable :pricing="session" :weekend-pricing-enabled="weekendPricingEnabled" />
      </div>

      <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addSession">＋ 新增時段</button>
    </RentalModeSettings>

    <!-- 計時租借 -->
    <RentalModeSettings v-if="activeMode === 'hourly'" mode-key="hourly" @copy="copyModeSettings">
      <template #limits>
        <fieldset class="fieldset append">
          <label class="label">最低時數</label>
          <div class="input">
            <input v-model.number="formData.rentalModes.hourly.minHours" type="number" min="1" class="grow text-end" />
            <span>小時</span>
          </div>
        </fieldset>
        <fieldset class="fieldset append">
          <label class="label">最多時數</label>
          <div class="input">
            <input v-model.number="formData.rentalModes.hourly.maxHours" type="number" min="1" class="grow text-end" />
            <span>小時</span>
          </div>
        </fieldset>
      </template>

      <!-- 價格表：「一般民眾」為基準列，可自訂新增身份 -->
      <IdentityPricingTable :pricing="formData.pricing.hourly" :weekend-pricing-enabled="weekendPricingEnabled" />
    </RentalModeSettings>

  </div>
  <!-- 儲存（sticky） -->
  <div class="sticky bottom-0 z-10 mt-6 flex justify-end border-t border-base-300 bg-base-100/90 py-3 backdrop-blur">
    <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存租借方式</button>
  </div>
  <!-- 套用提示 -->
  <div v-if="copiedMsg" class="toast toast-end z-50">
    <div class="alert alert-success">
      <span class="material-symbols-outlined">check_circle</span>
      <span>{{ copiedMsg }}</span>
    </div>
  </div>
</template>
