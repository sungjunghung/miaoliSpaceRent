<script setup lang="ts">
import { inject, computed, ref, type Ref } from 'vue';
import RentalModeCollapse from './RentalModeCollapse.vue';

interface SessionDef {
  name: string;
  startTime: string;
  endTime: string;
  weekday: number;
  weekend: number;
  // 每個時段各自一張身份價格表（一個時段一組）
  identityRows: IdentityRow[];
}

// 場館自訂的身份價格列（各場館各自定義，非共用清單）
interface IdentityRow {
  label: string;
  weekday: number;
  weekend: number;
}

interface ModePricing {
  weekday: number;
  weekend: number;
  identityRows: IdentityRow[];
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
  setupTeardownEnabled: boolean;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
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
    daily: ModePricing;
    hourly: ModePricing;
  };
  pricePerHour: number;
  // 假日價格為場館層級共用
  weekendPricingEnabled: boolean;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

type ModeKey = 'daily' | 'session' | 'hourly';

const formData = inject<Ref<Venue>>('venueFormData')!;
const venueDefaults = formData.value as Venue & Record<string, any>;

const MODE_LABELS: Record<ModeKey, string> = { daily: '整日租借', session: '時段租借', hourly: '計時租借' };
const modeTabs = (['daily', 'session', 'hourly'] as const).map((key) => ({ key, label: MODE_LABELS[key] }));
const activeMode = ref<ModeKey>('daily');

// 假日價格是否啟用 = 場館層級開關（各處假日欄位依此顯示）
const weekendPricingEnabled = computed(() => formData.value.weekendPricingEnabled);

// 確保每個租借方式都有各自管理的欄位（含申請與期限）
for (const mode of ['daily', 'session', 'hourly'] as const) {
  const rm = formData.value.rentalModes[mode] as any;
  if (!('depositEnabled' in rm)) rm.depositEnabled = false;
  rm.depositAmount ??= 0;
  if (!('setupTeardownEnabled' in rm)) rm.setupTeardownEnabled = true;
  rm.setupAllowanceHours ??= 1;
  rm.teardownAllowanceHours ??= 1;
  rm.setupOverageUnitMinutes ??= 30;
  rm.teardownOverageUnitMinutes ??= 30;
  rm.setupOverageFeePerUnit ??= 0;
  rm.teardownOverageFeePerUnit ??= 0;
  rm.advanceBookingDays ??= venueDefaults.advanceBookingDays ?? 7;
  rm.latestBookingDays ??= venueDefaults.latestBookingDays ?? 1;
  rm.cancellationDeadlineDays ??= venueDefaults.cancellationDeadlineDays ?? 7;
  rm.receiptUploadDeadlineDays ??= venueDefaults.receiptUploadDeadlineDays ?? 3;
  rm.documentUploadDeadlineDays ??= venueDefaults.documentUploadDeadlineDays ?? 7;
}

// 場館層級假日價格預設（既有資料：已設定星期或含國定假日者視為已啟用）
venueDefaults.weekendPricingEnabled ??=
  (venueDefaults.weekendDays?.length ?? 0) > 0 || !!venueDefaults.weekendIncludeHolidays;
venueDefaults.weekendDays ??= [0, 6];
venueDefaults.weekendIncludeHolidays ??= false;

// 身份價格預設（整日/計時各一張表；時段則每個時段各一張，見下方 sessions）
for (const mode of ['daily', 'hourly'] as const) {
  const p = (formData.value.pricing[mode] ??= {} as any);
  p.identityRows ??= [];
}

// 確保 sessions 是新格式（陣列物件）
function ensureSessionFormat() {
  const s = formData.value.rentalModes.session;
  if (!Array.isArray(s.sessions) || (s.sessions.length > 0 && typeof s.sessions[0] === 'string')) {
    (s as any).sessions = [];
  }
}
ensureSessionFormat();
// 既有時段補上各自的身份價格表預設
for (const s of formData.value.rentalModes.session.sessions) {
  (s as any).identityRows ??= [];
}

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

function addIdentityRow(mode: 'daily' | 'hourly') {
  formData.value.pricing[mode].identityRows.push({ label: '', weekday: 0, weekend: 0 });
}

function removeIdentityRow(mode: 'daily' | 'hourly', index: number) {
  formData.value.pricing[mode].identityRows.splice(index, 1);
}

// 時段：每個時段各自的身份價格列
function addSessionIdentityRow(session: SessionDef) {
  session.identityRows.push({ label: '', weekday: 0, weekend: 0 });
}

function removeSessionIdentityRow(session: SessionDef, index: number) {
  session.identityRows.splice(index, 1);
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
  <div class="space-y-4 p-4">
    <!-- ========== 假日定義（各模式共用） ========== -->
    <div class="card bg-base-100 shadow-sm mb-6">
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
  <!-- ========== 模式分段切換 ========== -->
  <div role="tablist" class="tabs tabs-border bg-base-100 mb-0">
    <button v-for="t in modeTabs" :key="t.key" class="tab"
      :class="{ 'tab-active': activeMode === t.key }" @click="activeMode = t.key">
      {{ t.label }}
    </button>
  </div>

  <!-- 整日租借 -->
  <div  v-show="activeMode === 'daily'">
    <RentalModeCollapse mode-key="daily" @copy="copyModeSettings">
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
      <div class="overflow-x-auto">
        <table class="table table-sm w-auto">
          <thead>
            <tr>
              <th>身份別</th>
              <th class="text-end">平日價</th>
              <th v-if="weekendPricingEnabled" class="text-end">假日價</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-medium">一般民眾</td>
              <td class="text-end"><input v-model.number="formData.pricing.daily.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="formData.pricing.daily.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td></td>
            </tr>
            <tr v-for="(row, i) in formData.pricing.daily.identityRows" :key="i">
              <td><input v-model="row.label" type="text" placeholder="例如：在地居民" class="input input-sm w-32" /></td>
              <td class="text-end"><input v-model.number="row.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="row.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td>
                <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeIdentityRow('daily', i)">
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addIdentityRow('daily')">＋ 新增身份</button>
    </RentalModeCollapse>
  </div>

  <!-- 時段租借 -->
  <div v-show="activeMode === 'session'">
    <RentalModeCollapse mode-key="session" @copy="copyModeSettings">
      <p class="text-sm text-base-content/50 mb-2">自訂租借時段；每個時段可各自設定名稱、時間與身份價格。</p>

      <div v-if="!formData.rentalModes.session.sessions.length" class="text-center text-base-content/30 italic py-4">
        尚未新增時段
      </div>

      <div v-for="(session, index) in formData.rentalModes.session.sessions" :key="index"
        class="border border-base-300 rounded-box p-4 mb-4 space-y-3">
        <!-- 時段基本資料 -->
        <div class="flex items-center gap-2">
          <input v-model="session.name" type="text" placeholder="時段名稱" class="input input-sm w-40" />
          <select v-model="session.startTime" class="select select-sm">
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <span class="text-base-content/50">~</span>
          <select v-model="session.endTime" class="select select-sm">
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button type="button" class="btn btn-error btn-ghost btn-square btn-sm ml-auto" @click="removeSession(index)">
            <span class="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>

        <!-- 該時段的身份價格表：一般民眾為基準列 -->
        <div class="overflow-x-auto">
          <table class="table table-sm w-auto">
            <thead>
              <tr>
                <th>身份別</th>
                <th class="text-end">平日價</th>
                <th v-if="weekendPricingEnabled" class="text-end">假日價</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-medium">一般民眾</td>
                <td class="text-end"><input v-model.number="session.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
                <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="session.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
                <td></td>
              </tr>
              <tr v-for="(row, i) in session.identityRows" :key="i">
                <td><input v-model="row.label" type="text" placeholder="例如：在地居民" class="input input-sm w-32" /></td>
                <td class="text-end"><input v-model.number="row.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
                <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="row.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
                <td>
                  <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeSessionIdentityRow(session, i)">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" class="btn btn-neutral btn-sm w-fit" @click="addSessionIdentityRow(session)">＋ 新增身份</button>
      </div>

      <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addSession">＋ 新增時段</button>
    </RentalModeCollapse>
  </div>

  <!-- 計時租借 -->
  <div v-show="activeMode === 'hourly'">
    <RentalModeCollapse mode-key="hourly" @copy="copyModeSettings">
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
      <div class="overflow-x-auto">
        <table class="table table-sm w-auto">
          <thead>
            <tr>
              <th>身份別</th>
              <th class="text-end">平日價</th>
              <th v-if="weekendPricingEnabled" class="text-end">假日價</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-medium">一般民眾</td>
              <td class="text-end"><input v-model.number="formData.pricing.hourly.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="formData.pricing.hourly.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td></td>
            </tr>
            <tr v-for="(row, i) in formData.pricing.hourly.identityRows" :key="i">
              <td><input v-model="row.label" type="text" placeholder="例如：在地居民" class="input input-sm w-32" /></td>
              <td class="text-end"><input v-model.number="row.weekday" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td v-if="weekendPricingEnabled" class="text-end"><input v-model.number="row.weekend" type="number" min="0" class="input input-sm w-24 text-end" /></td>
              <td>
                <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeIdentityRow('hourly', i)">
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addIdentityRow('hourly')">＋ 新增身份</button>
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
