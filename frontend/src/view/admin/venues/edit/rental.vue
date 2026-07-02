<script setup lang="ts">
import { inject, computed, ref, type Ref } from 'vue';
import RentalModeCollapse from './RentalModeCollapse.vue';

interface SessionDef {
  name: string;
  startTime: string;
  endTime: string;
  weekday: number;
  weekend: number;
}

interface RequiredDocument {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  templateFile?: string | null;
}

interface RentalModeBase {
  enabled: boolean;
  requireDocuments: boolean;
  requiredDocuments: RequiredDocument[];
  depositEnabled: boolean;
  depositAmount: number;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
  overageRoundingMode: 'ceil' | 'floor' | 'nearest';
  advanceBookingDays: number;
  latestBookingDays: number;
  cancellationDeadlineDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
}

interface Venue {
  rentalModes: {
    daily: RentalModeBase & { minDays: number; maxDays: number };
    session: RentalModeBase & { sessions: SessionDef[] };
    hourly: RentalModeBase & { minHours: number; maxHours: number };
  };
  pricing: {
    daily: Record<string, number>;
    hourly: Record<string, number>;
  };
  pricePerHour: number;
  // 假日定義為場館層級共用
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

type ModeKey = 'daily' | 'session' | 'hourly';

const formData = inject<Ref<Venue>>('venueFormData')!;
const venueDefaults = formData.value as Venue & Record<string, any>;

const MODE_LABELS: Record<ModeKey, string> = { daily: '整日租借', session: '時段租借', hourly: '計時租借' };
const modeTabs = (['daily', 'session', 'hourly'] as const).map((key) => ({ key, label: MODE_LABELS[key] }));
const activeMode = ref<ModeKey>('daily');

// 假日價格是否啟用 = 場館層級假日定義是否有內容
const weekendPricingEnabled = computed(
  () => (formData.value.weekendDays?.length ?? 0) > 0 || formData.value.weekendIncludeHolidays,
);

// 確保每個租借方式都有各自管理的欄位（含申請與期限）
for (const mode of ['daily', 'session', 'hourly'] as const) {
  const rm = formData.value.rentalModes[mode] as any;
  if (!('depositEnabled' in rm)) rm.depositEnabled = false;
  rm.depositAmount ??= 0;
  rm.setupAllowanceHours ??= 1;
  rm.teardownAllowanceHours ??= 1;
  rm.setupOverageUnitMinutes ??= 30;
  rm.teardownOverageUnitMinutes ??= 30;
  rm.setupOverageFeePerUnit ??= 0;
  rm.teardownOverageFeePerUnit ??= 0;
  rm.overageRoundingMode ??= 'ceil';
  rm.advanceBookingDays ??= venueDefaults.advanceBookingDays ?? 7;
  rm.latestBookingDays ??= venueDefaults.latestBookingDays ?? 1;
  rm.cancellationDeadlineDays ??= venueDefaults.cancellationDeadlineDays ?? 7;
  rm.receiptUploadDeadlineDays ??= venueDefaults.receiptUploadDeadlineDays ?? 3;
  rm.documentUploadDeadlineDays ??= venueDefaults.documentUploadDeadlineDays ?? 7;
}

// 場館層級假日定義預設
venueDefaults.weekendDays ??= [0, 6];
venueDefaults.weekendIncludeHolidays ??= false;

// 確保 sessions 是新格式（陣列物件）
function ensureSessionFormat() {
  const s = formData.value.rentalModes.session;
  if (!Array.isArray(s.sessions) || (s.sessions.length > 0 && typeof s.sessions[0] === 'string')) {
    (s as any).sessions = [];
  }
}
ensureSessionFormat();

function addSession() {
  formData.value.rentalModes.session.sessions.push({
    name: '',
    startTime: '08:00',
    endTime: '12:00',
    weekday: 0,
    weekend: 0,
  });
}

function removeSession(index: number) {
  formData.value.rentalModes.session.sessions.splice(index, 1);
}

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

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

// 一鍵套用：把「規則類」設定（非定價）從來源模式複製到目標模式
const SHARED_KEYS = [
  'depositEnabled', 'depositAmount',
  'setupAllowanceHours', 'teardownAllowanceHours',
  'setupOverageUnitMinutes', 'teardownOverageUnitMinutes',
  'setupOverageFeePerUnit', 'teardownOverageFeePerUnit', 'overageRoundingMode',
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
  <div class="space-y-4 px-4">
    <!-- ========== 假日定義（各模式共用） ========== -->
    <div class="card bg-base-100 shadow-sm mb-6">
      <div class="card-body space-y-3">
        <h2 class="card-title">
          <span class="material-symbols-outlined text-primary">calendar_month</span>
          假日定義
        </h2>
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
      </div>
    </div>
  
  
    
  <!-- ========== 模式分段切換 ========== -->
  <div role="tablist" class="tabs tabs-border bg-base-100 mb-0">
    <button v-for="t in modeTabs" :key="t.key" class="tab"
      :class="{ 'tab-active': activeMode === t.key }" @click="activeMode = t.key">
      {{ t.label }}
      <span v-if="formData.rentalModes[t.key]?.enabled" class="badge badge-success badge-xs ml-1">啟用</span>
    </button>
  </div>

  <!-- 整日租借 -->
  <div  v-show="activeMode === 'daily'">
    <RentalModeCollapse mode-key="daily" label="整日租借" @copy="copyModeSettings">
      <label class="label">最少租借天數</label>
      <div class="input">
        <input v-model.number="formData.rentalModes.daily.minDays" type="number" min="1" class="input text-end" />
        <span>天</span>
      </div>
      <label class="label">最多租借天數</label>
      <div class="input">
        <input v-model.number="formData.rentalModes.daily.maxDays" type="number" min="1" class="input text-end" />
        <span>天</span>
      </div>
      <label class="label">價格（元/日）</label>
      <div class="input">
        <input v-model.number="formData.pricing.daily.weekday" type="number" min="0" class="input text-end" />
        <span>元/日</span>
      </div>
      <template v-if="weekendPricingEnabled">
        <label class="label">假日價格</label>
        <div class="input">
          <input v-model.number="formData.pricing.daily.weekend" type="number" min="0" class="input text-end" />
          <span>元/日</span>
        </div>
      </template>
    </RentalModeCollapse>
  </div>

  <!-- 時段租借 -->
  <div v-show="activeMode === 'session'">
    <RentalModeCollapse mode-key="session" label="時段租借" @copy="copyModeSettings">
      <p class="text-sm text-base-content/50 mb-2">自訂租借時段，設定各時段的名稱、時間範圍與價格</p>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>時段名稱</th>
              <th>開始</th>
              <th>結束</th>
              <th class="text-end">平日價</th>
              <th v-if="weekendPricingEnabled" class="text-end">假日價</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(session, index) in formData.rentalModes.session.sessions" :key="index">
              <td><input v-model="session.name" type="text" placeholder="例如：上午" class="input input-sm w-28" /></td>
              <td>
                <select v-model="session.startTime" class="select select-sm">
                  <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </td>
              <td>
                <select v-model="session.endTime" class="select select-sm">
                  <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </td>
              <td><input v-model.number="session.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td v-if="weekendPricingEnabled"><input v-model.number="session.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td>
                <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeSession(index)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </td>
            </tr>
            <tr v-if="!formData.rentalModes.session.sessions.length">
              <td colspan="6" class="text-center text-base-content/30 italic">尚未新增時段</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addSession">＋ 新增時段</button>
    </RentalModeCollapse>
  </div>

  <!-- 計時租借 -->
  <div v-show="activeMode === 'hourly'">
    <RentalModeCollapse mode-key="hourly" label="計時租借" @copy="copyModeSettings">
      <label class="label">最低時數</label>
      <div class="input">
        <input v-model.number="formData.rentalModes.hourly.minHours" type="number" min="1" class="input text-end" />
        <span>小時</span>
      </div>
      <label class="label">最多時數</label>
      <div class="input">
        <input v-model.number="formData.rentalModes.hourly.maxHours" type="number" min="1" class="input text-end" />
        <span>小時</span>
      </div>
      <label class="label">價格</label>
      <div class="input">
        <input v-model.number="formData.pricing.hourly.weekday" type="number" min="0" class="input text-end" />
        <span>元/時</span>
      </div>
      <template v-if="weekendPricingEnabled">
        <label class="label">假日價格</label>
        <div class="input">
          <input v-model.number="formData.pricing.hourly.weekend" type="number" min="0" class="input text-end" />
          <span>元/時</span>
        </div>
      </template>
    </RentalModeCollapse>
  </div>
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
