<script setup lang="ts">
import { ref, computed, watch } from 'vue';

type RentalStatus = 'available' | 'partial' | 'rented' | 'closed';

interface CalendarDay {
  date: Date;
  status: RentalStatus;
}

interface BookingRecord {
  rentalMode: string;
  date: string;
  startDate?: string | null;
  endDate?: string | null;
  session?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
}

interface Props {
  closedWeekdays?: number[];
  closedDates?: string[];
  selectedStart?: string;
  selectedEnd?: string;
  /** 開啟時要顯示的月份(對齊點擊欄位的日期);未指定則顯示當月 */
  viewDate?: string;
  bookings?: BookingRecord[];
  /** 該日有多少筆預約(熱度模式);與 bookings 互斥,通常用在「全部場館」聚合視圖 */
  counts?: Record<string, number>;
  /** 檢視模式:所有非空日期都可點(用於展示用途,例如點日期看當日預約清單) */
  viewable?: boolean;
  /** 桌機版要在每格直接顯示的事件標籤(label = 主要文字,time = 第二行時間);手機版會自動隱藏並透過 click 開 modal */
  cellEvents?: Record<string, { label: string; time?: string }[]>;
  minDays?: number;
  maxDays?: number;
  showLegend?: boolean;
  /** 鎖定檢視模式;設定後固定顯示該模式並隱藏「週/月」切換(例:搜尋只顯示月) */
  lockView?: 'month' | 'week';
  /** 初始檢視模式;未設定時為月 */
  defaultView?: 'month' | 'week';
  /** 是否顯示「週/月」切換鈕;預設不顯示,有需要切換才開啟 */
  showViewToggle?: boolean;
  /** 是否顯示「本週/本月」快速回到今天的按鈕;預設不顯示 */
  showTodayButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closedWeekdays: () => [],
  closedDates: () => [],
  selectedStart: '',
  selectedEnd: '',
  viewDate: '',
  bookings: () => [],
  counts: () => ({}),
  viewable: false,
  cellEvents: () => ({}),
  minDays: 1,
  maxDays: 999,
  showLegend: true,
  lockView: undefined,
  defaultView: 'month',
  showViewToggle: false,
  showTodayButton: false,
});

// 是否有任何事件要顯示在格子裡(影響桌機版的格子高度與排版)
const hasCellEvents = computed(() => Object.keys(props.cellEvents).length > 0)
// 熱度模式(有 counts) = 全部場館視圖;只有這個情境的週視圖才需要事件 pill 換行
const isHeatmapMode = computed(() => Object.keys(props.counts).length > 0)

// 依預約場館數決定背景紅色濃淡(5 階)
function heatBgClassFor(date: Date): string {
  const count = props.counts[formatDate(date)] ?? 0;
  if (!count) return '';
  if (count >= 10) return 'bg-error/80 text-error-content';
  if (count >= 7) return 'bg-error/60 text-error-content';
  if (count >= 4) return 'bg-error/40';
  if (count >= 2) return 'bg-error/25';
  return 'bg-error/15';
}

function isSelected(date: Date): boolean {
  const ds = formatDate(date);
  return ds === props.selectedStart || ds === props.selectedEnd;
}

function isInRange(date: Date): boolean {
  if (!props.selectedStart || !props.selectedEnd) return false;
  const ds = formatDate(date);
  return ds > props.selectedStart && ds < props.selectedEnd;
}

function isRangeStart(date: Date): boolean {
  return formatDate(date) === props.selectedStart && !!props.selectedStart;
}

function isRangeEnd(date: Date): boolean {
  return formatDate(date) === props.selectedEnd && !!props.selectedEnd;
}

const emit = defineEmits<{
  (e: 'select-date', dateStr: string): void;
}>();

// YYYY-MM-DD を local date として解析(new Date(str) は UTC 扱いで月境界がずれるため)
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
const currentMonth = ref(props.viewDate ? parseLocalDate(props.viewDate) : new Date());

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDayClosed(date: Date): boolean {
  return props.closedWeekdays.includes(date.getDay()) ||
    props.closedDates.includes(formatDate(date));
}

// 根據 bookings 資料判斷該日是否有租借記錄
function isDayRented(date: Date): boolean {
  const ds = formatDate(date);
  return props.bookings.some(b => {
    if (b.rentalMode === 'daily') {
      const start = b.startDate ?? b.date;
      const end = b.endDate ?? b.date;
      return ds >= start && ds <= end;
    }
    return b.date === ds;
  });
}

// 顯示模式:月(預設,完整月格)或週(7 天一字排開),由 defaultView 決定初始值
// lockView 有設時固定為該模式(寫入會被忽略,因為切換鈕已隱藏)
const internalView = ref<'month' | 'week'>(props.defaultView);
// defaultView 改變(例如響應式斷點切換)時跟著更新初始檢視
watch(() => props.defaultView, (v) => { internalView.value = v });
const view = computed<'month' | 'week'>({
  get: () => props.lockView ?? internalView.value,
  set: (v) => { internalView.value = v },
});

function buildDay(date: Date): CalendarDay {
  let status: RentalStatus = 'available';
  if (isDayClosed(date)) status = 'closed';
  else if (isDayRented(date)) status = 'rented';
  return { date, status };
}

// 當前錨點日期所在週的週日;用來定位週視圖起點與標題
function weekStartOf(d: Date): Date {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

const getDays = computed<(CalendarDay | null)[]>(() => {
  if (view.value === 'week') {
    const start = weekStartOf(currentMonth.value);
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(buildDay(date));
    }
    return days;
  }
  // month
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (CalendarDay | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(buildDay(new Date(year, month, d)));
  return days;
});

const headerTitle = computed(() => {
  if (view.value === 'week') {
    const start = weekStartOf(currentMonth.value);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.getFullYear()}年${start.getMonth() + 1}月 ${start.getDate()}–${end.getDate()}日`;
    }
    return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
  }
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth() + 1;
  return `${year}年${month}月`;
});

const goPrev = (): void => {
  if (view.value === 'week') {
    const d = new Date(currentMonth.value);
    d.setDate(d.getDate() - 7);
    currentMonth.value = d;
  } else {
    const y = currentMonth.value.getFullYear();
    const m = currentMonth.value.getMonth();
    currentMonth.value = new Date(y, m - 1, 1);
  }
};

const goNext = (): void => {
  if (view.value === 'week') {
    const d = new Date(currentMonth.value);
    d.setDate(d.getDate() + 7);
    currentMonth.value = d;
  } else {
    const y = currentMonth.value.getFullYear();
    const m = currentMonth.value.getMonth();
    currentMonth.value = new Date(y, m + 1, 1);
  }
};

// 回到今天:週視圖跳到本週、月視圖跳到本月
const goToday = (): void => {
  currentMonth.value = new Date();
};
const todayLabel = computed(() => (view.value === 'week' ? '本週' : '本月'));
// 目前錨點已經落在今天所在的週/月時,按鈕無需強調(disabled)
const isOnCurrentPeriod = computed(() => {
  const now = new Date();
  if (view.value === 'week') {
    return weekStartOf(currentMonth.value).getTime() === weekStartOf(now).getTime();
  }
  return currentMonth.value.getFullYear() === now.getFullYear() &&
    currentMonth.value.getMonth() === now.getMonth();
});

const isToday = (date: Date): boolean =>
  date.toDateString() === new Date().toDateString();

function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function canSelectDate(date: Date): boolean {
  if (isPastDate(date)) return false;
  if (isDayClosed(date) || isDayRented(date)) return false;

  const ds = formatDate(date);
  if (props.selectedStart && !props.selectedEnd) {
    const start = props.selectedStart;
    const minDateStr = ds < start ? ds : start;
    const maxDateStr = ds > start ? ds : start;

    const startD = new Date(minDateStr);
    const endD = new Date(maxDateStr);
    
    // 檢查範圍內是否有任何休館或已租借的日子
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      if (isDayClosed(d) || isDayRented(d)) return false;
    }

    const diffMs = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.round(diffMs / 86400000) + 1;
    
    if (diffDays > props.maxDays) return false;
    if (diffDays < props.minDays && minDateStr !== maxDateStr) return false;
  }
  return true;
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-2 mb-4">
      <div class="flex items-center gap-2">
        <button @click="goPrev" class="btn btn-square btn-ghost">
          <span class="material-symbols-outlined text-base-content shrink-0 mt-0.5">chevron_left</span>
        </button>
        <span class="text-xl font-medium text-base-content min-w-32 text-center">{{ headerTitle }}</span>
        <button @click="goNext" class="btn btn-square btn-ghost">
          <span class="material-symbols-outlined text-base-content shrink-0 mt-0.5">chevron_right</span>
        </button>
        <button
          v-if="showTodayButton"
          type="button"
          class="btn btn-sm btn-outline ml-1"
          :disabled="isOnCurrentPeriod"
          @click="goToday"
        >{{ todayLabel }}</button>
      </div>
      <div v-if="showViewToggle && !lockView" role="tablist" class="tabs tabs-box tabs-sm hidden lg:flex">
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'tab-active': view === 'week' }"
          :aria-selected="view === 'week'"
          @click="view = 'week'"
        >週</button>
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'tab-active': view === 'month' }"
          :aria-selected="view === 'month'"
          @click="view = 'month'"
        >月</button>
      </div>
    </div>

    <!-- 手機 + 週視圖:直式列表(每天一橫列),桌機與月視圖隱藏此區 -->
    <div v-if="view === 'week'" class="lg:hidden divide-y divide-base-200 border-y border-base-200">
      <div
        v-for="(day, index) in getDays"
        :key="`vlist-${index}`"
        v-show="day"
        class="flex items-start gap-3 px-3 py-3 transition-colors"
        :class="day ? [
          {
            'bg-base-200/70 text-base-content/60': day.status === 'closed' || isPastDate(day.date),
            'bg-error/15': day.status === 'rented' && !isPastDate(day.date) && hasCellEvents,
          },
          viewable || canSelectDate(day.date) ? 'cursor-pointer active:bg-base-200' : '',
        ] : ''"
        @click="day && (viewable || canSelectDate(day.date)) && emit('select-date', formatDate(day.date))"
      >
        <template v-if="day">
          <div class="w-12 shrink-0 text-center">
            <div class="text-xs text-base-content/60">{{ ['日','一','二','三','四','五','六'][day.date.getDay()] }}</div>
            <div
              class="text-2xl font-bold leading-none mt-1"
              :class="isToday(day.date) ? 'text-success' : ''"
            >{{ day.date.getDate() }}</div>
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            <template v-if="cellEvents[formatDate(day.date)]?.length">
              <div
                v-for="(ev, ei) in cellEvents[formatDate(day.date)]"
                :key="ei"
                class="rounded px-2 py-1 mb-1 last:mb-0 bg-base-100/80 text-sm"
              >
                <div>{{ ev.label }}</div>
                <div v-if="ev.time" class="text-xs text-base-content/60">{{ ev.time }}</div>
              </div>
            </template>
            <div v-else class="text-sm text-base-content/40 pt-1">
              {{ day.status === 'closed' ? '休館' : '無預約' }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 桌機 + 全部視圖:既有的 grid(週視圖在手機被上方列表取代,所以這層加 hidden lg:block) -->
    <div :class="view === 'week' ? 'hidden lg:grid' : 'grid'" class="grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
        :key="day"
        class="text-center text-sm font-medium text-base-content py-2"
      >
        {{ day }}
      </div>
    </div>

    <div :class="view === 'week' ? 'hidden lg:grid' : 'grid'" class="grid-cols-7 gap-0 border-t border-l border-base-300">
      <div
        v-for="(day, index) in getDays"
        :key="index"
        class="h-14 text-base font-medium flex flex-col items-center justify-center transition-colors relative border-b border-r border-base-200"
        :class="day ? [
          {
            'bg-base-200 text-base-content cursor-not-allowed': day.status === 'closed' || isPastDate(day.date),
            // 整格紅:只有「日期選擇」用途才需要(picker 場景),如果有事件標籤就不再塗紅,讓事件 pill 自己表達
            'bg-error text-error-content cursor-not-allowed': day.status === 'rented' && !isPastDate(day.date) && !hasCellEvents,
            'bg-base-200 text-base-content/50 cursor-not-allowed': day.status === 'available' && !isPastDate(day.date) && !canSelectDate(day.date),
            'ring-2 ring-success ring-offset-1 z-10': isToday(day.date) && day.status !== 'closed' && !isSelected(day.date),
            'bg-success text-success-content font-bold z-10': isSelected(day.date),
            'bg-success/15': isInRange(day.date) && day.status === 'available' && !isPastDate(day.date),
            // 預設可選底色:正常 available 日
            'bg-base-100 text-base-content cursor-pointer hover:bg-base-200': day.status === 'available' && !isPastDate(day.date) && !isSelected(day.date) && !isInRange(day.date) && canSelectDate(day.date),
            // 有事件 + rented(特定場館視圖):整格淡紅底色,而不是 picker 的整格實心紅
            'bg-error/15 text-base-content cursor-pointer hover:bg-error/25': day.status === 'rented' && !isPastDate(day.date) && hasCellEvents,
          },
          // 熱度模式:在「可選」狀態上疊加紅色濃淡
          day.status === 'available' && !isPastDate(day.date) && !isSelected(day.date) && !isInRange(day.date) ? heatBgClassFor(day.date) : '',
          // 檢視模式:強制 cursor-pointer + hover 提示;Tailwind v4 使用 ! 後綴強制覆寫 cursor-not-allowed
          viewable ? 'cursor-pointer! hover:opacity-80' : '',
          // 有事件時桌機版加高、頂部對齊以容納事件清單(手機版維持 h-12)
          hasCellEvents ? 'lg:min-h-32 lg:h-auto lg:items-stretch lg:justify-start lg:p-2' : '',
        ] : 'invisible'"
        @click="day && (viewable || canSelectDate(day.date)) && emit('select-date', formatDate(day.date))"
      >
        <template v-if="day">
          <span :class="hasCellEvents ? 'lg:self-start lg:px-1 lg:text-sm lg:opacity-80' : ''">{{ day.date.getDate() }}</span>
          <span v-if="isRangeStart(day.date) && selectedEnd" class="text-[10px] leading-none font-normal mt-0.5">起</span>
          <span v-else-if="isRangeEnd(day.date)" class="text-[10px] leading-none font-normal mt-0.5">迄</span>
          <span v-else-if="day.status === 'closed'" class="text-[11px] leading-none text-base-content font-normal">休</span>
          <span v-else-if="day.status === 'rented' && !hasCellEvents" class="w-1.5 h-1.5 rounded-full bg-error-content mt-0.5"></span>
          <span v-else-if="!isPastDate(day.date) && counts[formatDate(day.date)]" :class="hasCellEvents ? 'lg:hidden text-xs leading-none font-bold mt-0.5' : 'text-xs leading-none font-bold mt-0.5'">{{ counts[formatDate(day.date)] }}</span>

          <!-- 桌機版:在格子內顯示當日全部事件(手機版隱藏,改用 modal) -->
          <!-- 週視圖:文字完整換行;月視圖:每行 truncate 避免格子被撐爆 -->
          <div v-if="cellEvents[formatDate(day.date)]?.length" class="hidden lg:flex flex-col gap-0.5 mt-1 w-full text-xs font-normal leading-tight">
            <div v-for="(ev, i) in cellEvents[formatDate(day.date)]" :key="i" class="rounded px-1.5 py-0.5 bg-base-100/80 text-base-content/80">
              <div :class="(view === 'week' && isHeatmapMode) ? 'wrap-break-word whitespace-normal' : 'truncate'">{{ ev.label }}</div>
              <div v-if="ev.time" class="text-[11px] text-base-content/60" :class="(view === 'week' && isHeatmapMode) ? 'wrap-break-word whitespace-normal' : 'truncate'">{{ ev.time }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 圖例 -->
    <div v-if="showLegend" class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-base-content">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-100 border border-base-300"></span>
        可租借
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-error border border-error"></span>
        已有租借
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-200 border border-base-300"></span>
        休館日
      </div>
      <div v-if="selectedStart" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-success"></span>
        已選取
      </div>
      <div v-if="selectedStart && selectedEnd" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-success/15 border border-success"></span>
        選取範圍
      </div>
    </div>
  </div>
</template>
