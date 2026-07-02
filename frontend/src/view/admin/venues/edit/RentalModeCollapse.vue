<script setup lang="ts">
import { inject, computed, ref, watch, type Ref } from 'vue';

interface RequiredDocument {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  templateFile?: string | null;
}

interface RentalModeBase {
  enabled: boolean;
  depositAmount: number;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
  overageRoundingMode: 'ceil' | 'floor' | 'nearest';
  // 申請與期限（每模式各自設定）
  advanceBookingDays: number;
  latestBookingDays: number;
  cancellationDeadlineDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  // 需檢附文件（每模式各自管理，含各自範本）
  requireDocuments: boolean;
  requiredDocuments: RequiredDocument[];
}

const props = defineProps<{
  modeKey: 'daily' | 'session' | 'hourly';
  label: string;
}>();

const emit = defineEmits<{ (e: 'copy', payload: { from: string; to: string }): void }>();

const formData = inject<Ref<any>>('venueFormData')!;

const mode = computed<RentalModeBase>(() => formData.value.rentalModes[props.modeKey]);

const MODE_LABELS: Record<string, string> = { daily: '整日', session: '時段', hourly: '計時' };
const otherModes = computed(() =>
  (['daily', 'session', 'hourly'] as const)
    .filter((m) => m !== props.modeKey)
    .map((m) => ({ key: m, label: MODE_LABELS[m] })),
);

const halfHourOptions = Array.from({ length: 13 }, (_, i) => {
  const value = i * 0.5;
  const minutes = i * 30;
  return { value, label: value === 0 ? '0 小時' : `${minutes} 分鐘 (${value} 小時)` };
});

const overageUnitOptions = Array.from({ length: 8 }, (_, i) => {
  const minutes = (i + 1) * 30;
  return { value: minutes, label: `${minutes} 分鐘/單位` };
});

// 需檢附文件（此模式各自管理）
if (!Array.isArray(mode.value.requiredDocuments)) mode.value.requiredDocuments = [];
if (typeof mode.value.requireDocuments !== 'boolean') mode.value.requireDocuments = false;

// 超時費用開關（進階，預設依現值判定；關閉時歸零，隱藏細項）
const chargeOverage = ref(false);
watch(
  () => mode.value,
  (m) => {
    chargeOverage.value = m.setupOverageFeePerUnit > 0 || m.teardownOverageFeePerUnit > 0;
  },
  { immediate: true },
);
function onToggleOverage() {
  if (!chargeOverage.value) {
    mode.value.setupOverageFeePerUnit = 0;
    mode.value.teardownOverageFeePerUnit = 0;
  }
}

const newDocLabel = ref('');

function addDocument() {
  const label = newDocLabel.value.trim();
  if (!label) return;
  mode.value.requiredDocuments.push({
    key: `${props.modeKey}-${Date.now()}`,
    label,
    hint: '',
    required: true,
    templateFile: '',
  });
  newDocLabel.value = '';
}

function removeDocument(index: number) {
  mode.value.requiredDocuments.splice(index, 1);
}

function handleTemplateUpload(event: Event, doc: RequiredDocument) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    doc.templateFile = file.name;
    target.value = '';
  }
}

function copyTo(to: string) {
  emit('copy', { from: props.modeKey, to });
  (document.activeElement as HTMLElement)?.blur();
}
</script>

<template>
  <div class="bg-base-100">
    <!-- 標題列：啟用 + 套用到其他模式 -->
    <div class="flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3">
      <span class="text-lg font-medium">{{ label }}</span>
      <span v-if="mode.enabled" class="badge badge-success badge-sm">已啟用</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="label cursor-pointer gap-2">
          <input type="checkbox" v-model="mode.enabled" class="toggle toggle-primary toggle-sm mb-0!" />
          <span class="text-sm">啟用此模式</span>
        </label>
        <div v-if="mode.enabled" class="dropdown dropdown-end">
          <button type="button" tabindex="0" class="btn btn-sm btn-outline gap-1">
            <span class="material-symbols-outlined text-sm">content_copy</span>
            套用到其他模式
          </button>
          <ul tabindex="0" class="dropdown-content menu z-10 mt-1 w-52 rounded-box bg-base-100 p-2 shadow border border-base-300">
            <li class="menu-title text-xs">複製此模式的規則設定</li>
            <li><a @click="copyTo('all')">全部其他模式</a></li>
            <li v-for="m in otherModes" :key="m.key"><a @click="copyTo(m.key)">複製到「{{ m.label }}」</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="mode.enabled" class="space-y-6 p-4">

      <!-- ── 價格設定（各模式獨有） ── -->
      <div class="bg-base-200/30 rounded-box p-4 space-y-3">
        <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">payments</span>
          價格設定
        </h3>
        <fieldset class="fieldset append">
          <slot />
        </fieldset>
      </div>

      <!-- ── 保證金 ── -->
      <div class="bg-base-200/30 rounded-box p-4 space-y-3">
        <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">shield</span>
          保證金
        </h3>
        <fieldset class="fieldset append">
          <label class="label">保證金金額</label>
          <div class="input">
            <input v-model.number="mode.depositAmount" type="number" min="0" step="1000" class="grow text-end" />
            <span>元</span>
          </div>
          <p class="label text-base-content/50">輸入 0 表示不需要保證金；活動結束且場地復原確認後可申請退還</p>
        </fieldset>
      </div>

      <!-- ── 申請與期限（2 欄） ── -->
      <div class="bg-base-200/30 rounded-box p-4 space-y-3">
        <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">event_available</span>
          申請與期限
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <fieldset class="fieldset append">
            <label class="label">最早可申請時間</label>
            <div class="input">
              使用日前
              <input v-model.number="mode.advanceBookingDays" type="number" min="0" class="grow text-end" />
              <span>天</span>
            </div>
          </fieldset>
          <fieldset class="fieldset append">
            <label class="label">最晚可預約期限</label>
            <div class="input">
              使用日前
              <input v-model.number="mode.latestBookingDays" type="number" min="0" class="grow text-end" />
              <span>天</span>
            </div>
          </fieldset>
          <fieldset class="fieldset append">
            <label class="label">最晚取消期限</label>
            <div class="input">
              使用日前
              <input v-model.number="mode.cancellationDeadlineDays" type="number" min="1" class="grow text-end" />
              <span>天</span>
            </div>
          </fieldset>
          <fieldset class="fieldset append">
            <label class="label">匯款資料上傳期限</label>
            <div class="input">
              確認後
              <input v-model.number="mode.receiptUploadDeadlineDays" type="number" min="1" class="grow text-end" />
              <span>天內</span>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- ── 場佈與撤場（超時計費為進階，預設收合） ── -->
      <div class="bg-base-200/30 rounded-box p-4 space-y-3">
        <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">construction</span>
          場佈與撤場
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <fieldset class="fieldset">
            <label class="label">場佈容許時數</label>
            <select v-model.number="mode.setupAllowanceHours" class="select">
              <option v-for="opt in halfHourOptions" :key="`setup-allowance-${opt.value}`" :value="opt.value">{{ opt.label }}</option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <label class="label">撤場容許時數</label>
            <select v-model.number="mode.teardownAllowanceHours" class="select">
              <option v-for="opt in halfHourOptions" :key="`teardown-allowance-${opt.value}`" :value="opt.value">{{ opt.label }}</option>
            </select>
          </fieldset>
        </div>

        <label class="label cursor-pointer w-fit gap-2">
          <input type="checkbox" v-model="chargeOverage" @change="onToggleOverage" class="toggle toggle-primary toggle-sm mb-0!" />
          <span class="text-sm">超過容許時數需另外收費</span>
        </label>

        <div v-if="chargeOverage" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1">
          <fieldset class="fieldset">
            <label class="label">場佈超時計費單位</label>
            <select v-model.number="mode.setupOverageUnitMinutes" class="select">
              <option v-for="opt in overageUnitOptions" :key="`setup-unit-${opt.value}`" :value="opt.value">{{ opt.label }}</option>
            </select>
          </fieldset>
          <fieldset class="fieldset append">
            <label class="label">場佈超時每單位費用</label>
            <div class="input">
              <input v-model.number="mode.setupOverageFeePerUnit" type="number" min="0" step="1" class="grow text-end" />
              <span>元</span>
            </div>
          </fieldset>
          <fieldset class="fieldset">
            <label class="label">撤場超時計費單位</label>
            <select v-model.number="mode.teardownOverageUnitMinutes" class="select">
              <option v-for="opt in overageUnitOptions" :key="`teardown-unit-${opt.value}`" :value="opt.value">{{ opt.label }}</option>
            </select>
          </fieldset>
          <fieldset class="fieldset append">
            <label class="label">撤場超時每單位費用</label>
            <div class="input">
              <input v-model.number="mode.teardownOverageFeePerUnit" type="number" min="0" step="1" class="grow text-end" />
              <span>元</span>
            </div>
          </fieldset>
          <fieldset class="fieldset sm:col-span-2">
            <label class="label">超時進位規則</label>
            <select v-model="mode.overageRoundingMode" class="select">
              <option value="ceil">無條件進位</option>
              <option value="nearest">四捨五入</option>
              <option value="floor">無條件捨去</option>
            </select>
          </fieldset>
        </div>
      </div>

      <!-- ── 需檢附文件（含文件上傳期限、各自範本） ── -->
      <div class="bg-base-200/30 rounded-box p-4 space-y-3">
        <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">description</span>
          需檢附文件
        </h3>
        <label class="label cursor-pointer w-fit gap-2">
          <input type="checkbox" v-model="mode.requireDocuments" class="toggle toggle-primary toggle-sm mb-0!" />
          <span class="text-sm">此租借模式需要檢附文件</span>
        </label>
        <p class="text-xs text-base-content/50">各租借模式的申請書與範本可不同，於此獨立設定</p>

        <template v-if="mode.requireDocuments">
          <fieldset class="fieldset append w-fit">
            <label class="label">文件上傳期限</label>
            <div class="input">
              審核通過後
              <input v-model.number="mode.documentUploadDeadlineDays" type="number" min="1" class="grow text-end" />
              <span>天內須上傳</span>
            </div>
          </fieldset>

          <div class="flex gap-2 mt-2">
            <input v-model="newDocLabel" type="text" placeholder="輸入文件名稱後按 Enter 或點擊新增"
              class="input input-bordered flex-1" @keyup.enter="addDocument" />
            <button type="button" class="btn btn-primary" @click="addDocument">新增</button>
          </div>
          <div class="space-y-2">
            <div v-if="!mode.requiredDocuments.length" class="text-base-content/30 italic p-3">尚未新增任何文件</div>
            <div v-for="(doc, index) in mode.requiredDocuments" :key="doc.key"
              class="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-300">
              <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="removeDocument(index)">✕</button>
              <span class="badge badge-neutral">{{ index + 1 }}</span>
              <p class="flex-1 text-base truncate font-medium">{{ doc.label }}</p>
              <label class="label cursor-pointer gap-1.5">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" v-model="doc.required" />
                <span class="text-sm">必繳</span>
              </label>
              <div class="flex items-center gap-2">
                <span v-if="!doc.templateFile" class="text-xs text-base-content/50">尚未上傳範本</span>
                <div v-else class="flex items-center gap-1.5 bg-base-100 px-2 py-1 rounded border border-base-300">
                  <span class="material-symbols-outlined text-sm text-primary">description</span>
                  <span class="text-xs truncate max-w-40 font-medium">{{ doc.templateFile }}</span>
                  <button type="button" class="btn btn-ghost btn-xs btn-circle text-error" @click="doc.templateFile = ''">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <button type="button" class="btn btn-outline btn-sm bg-base-100"
                  @click="($refs['docFile_' + index] as HTMLInputElement[])[0]?.click()">
                  <span class="material-symbols-outlined text-sm">upload_file</span>
                  範本
                </button>
                <input type="file" :ref="'docFile_' + index" class="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                  @change="(e) => handleTemplateUpload(e, doc)" />
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>
