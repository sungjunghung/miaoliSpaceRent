<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

type RentalStatus = 'available' | 'partial' | 'rented' | 'closed';

interface TimeSlot {
  hour: number;
  status: RentalStatus;
}

interface DayColumn {
  date: Date;
  isClosed: boolean;
  isPast: boolean;
  slots: TimeSlot[];
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

interface SessionDef {
  name: string;
  startTime: string;
  endTime: string;
}

interface Props {
  closedWeekdays?: number[];
  closedDates?: string[];
  bookings?: BookingRecord[];
  /** 互動模式: 'view' 純檢視, 'session' 時段選取, 'hourly' 起迄時間選取 */
  interactMode?: 'view' | 'session' | 'hourly';
  /** session 模式：場次定義（含名稱、起迄時間） */
  sessionDefs?: SessionDef[];
  /** session 模式：可用的場次代碼（已棄用，請改用 sessionDefs） */
  availableSessions?: string[];
  /** 已選取的日期 */
  selectedDate?: string;
  /** session 模式：已選取的場次 */
  selectedSession?: string | null;
  /** hourly 模式：已選取的開始時間 (HH:00) */
  selectedStartTime?: string;
  /** hourly 模式：已選取的結束時間 (HH:00) */
  selectedEndTime?: string;
  minHours?: number;
  maxHours?: number;
}

const props = withDefaults(defineProps<Props>(), {
  closedWeekdays: () => [],
  closedDates: () => [],
  bookings: () => [],
  interactMode: 'view',
  sessionDefs: () => [],
  availableSessions: () => [],
  selectedDate: '',
  selectedSession: null,
  selectedStartTime: '',
  selectedEndTime: '',
  minHours: 1,
  maxHours: 999,
});

const emit = defineEmits<{
  (e: 'select-date', dateStr: string): void;
  (e: 'select-session', payload: { date: string; session: string }): void;
  (e: 'select-time', payload: { date: string; startTime: string; endTime: string }): void;
}>();

const currentWeekStart = ref(new Date());

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 ~ 21:00
const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// 從 sessionDefs 動態計算場次 → 小時對應
const sessionHoursMap = computed<Record<string, number[]>>(() => {
  const map: Record<string, number[]> = {};
  for (const sd of props.sessionDefs) {
    const sh = parseInt(sd.startTime.split(':')[0]);
    const eh = parseInt(sd.endTime.split(':')[0]);
    const hours: number[] = [];
    for (let h = sh; h < eh; h++) hours.push(h);
    map[sd.name] = hours;
  }
  return map;
});

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

function getRentedHours(dateStr: string): Set<number> {
  const rented = new Set<number>();
  for (const b of props.bookings) {
    if (b.rentalMode === 'daily') {
      const start = b.startDate ?? b.date;
      const end = b.endDate ?? b.date;
      if (dateStr >= start && dateStr <= end) {
        HOURS.forEach(h => rented.add(h));
      }
    } else if (b.rentalMode === 'session' && b.date === dateStr && b.session) {
      const hours = sessionHoursMap.value[b.session];
      if (hours) hours.forEach(h => rented.add(h));
    } else if (b.rentalMode === 'hourly' && b.date === dateStr && b.startTime && b.endTime) {
      const sh = parseInt(b.startTime.split(':')[0]);
      const eh = parseInt(b.endTime.split(':')[0]);
      for (let h = sh; h < eh; h++) rented.add(h);
    }
  }
  return rented;
}

function generateSlots(date: Date, dayClosed: boolean): TimeSlot[] {
  if (dayClosed) return HOURS.map(hour => ({ hour, status: 'closed' as const }));
  const rented = getRentedHours(formatDate(date));
  return HOURS.map(hour => ({
    hour,
    status: rented.has(hour) ? 'rented' : 'available',
  }));
}

const initializeWeek = (): void => {
  // 有指定 selectedDate 就錨定它所在的那一週,否則用今天(YYYY-MM-DD 以 local 解析避免時區位移)
  let base = new Date();
  if (props.selectedDate) {
    const [y, m, d] = props.selectedDate.split('-').map(Number);
    base = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  }
  const day = base.getDay();
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  currentWeekStart.value = weekStart;
};

const todayStr = computed(() => formatDate(new Date()));

function isDatePast(date: Date): boolean {
  return formatDate(date) < todayStr.value;
}

const columns = computed<DayColumn[]>(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart.value);
    date.setDate(date.getDate() + i);
    const isClosed = isDayClosed(date);
    const isPast = isDatePast(date);
    return { date, isClosed, isPast, slots: generateSlots(date, isClosed) };
  })
);

const weekRange = computed(() => {
  const start = currentWeekStart.value;
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} - ${fmt(end)}`;
});

const previousWeek = (): void => {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
};

const nextWeek = (): void => {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
};

const isToday = (date: Date): boolean =>
  date.toDateString() === new Date().toDateString();

const isCurrentHour = (date: Date, hour: number): boolean =>
  isToday(date) && new Date().getHours() === hour;

const formatHour = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

// ── Session 互動 ──
function getSessionForHour(hour: number): string | null {
  for (const [name, hours] of Object.entries(sessionHoursMap.value)) {
    if (hours.includes(hour)) return name;
  }
  return null;
}

function isSessionSlot(hour: number): boolean {
  return props.interactMode === 'session' && getSessionForHour(hour) !== null;
}

function isSessionFirstHour(hour: number): boolean {
  if (props.interactMode !== 'session') return false;
  const code = getSessionForHour(hour);
  return code !== null && sessionHoursMap.value[code]?.[0] === hour;
}

function isSessionLastHour(hour: number): boolean {
  if (props.interactMode !== 'session') return false;
  const code = getSessionForHour(hour);
  if (!code) return false;
  const hours = sessionHoursMap.value[code];
  return hours[hours.length - 1] === hour;
}

function isSessionSelected(dateStr: string, hour: number): boolean {
  if (props.interactMode !== 'session') return false;
  const code = getSessionForHour(hour);
  return code !== null && props.selectedDate === dateStr && props.selectedSession === code;
}

function isSessionRented(dateStr: string, hour: number): boolean {
  const code = getSessionForHour(hour);
  if (!code) return false;
  const hours = sessionHoursMap.value[code];
  const rented = getRentedHours(dateStr);
  return hours.some(h => rented.has(h));
}

function onSessionClick(day: DayColumn, hour: number) {
  if (day.isClosed || day.isPast) return;
  const code = getSessionForHour(hour);
  if (!code) return;
  const dateStr = formatDate(day.date);
  if (isSessionRented(dateStr, hour)) return;
  emit('select-session', { date: dateStr, session: code });
}

// ── Hourly 互動 ──
// 暫存第一次點擊
const hourlyFirstClick = ref<{ date: string; hour: number } | null>(null);

function isHourSelected(dateStr: string, hour: number): boolean {
  if (props.interactMode !== 'hourly') return false;
  if (!props.selectedDate || !props.selectedStartTime || !props.selectedEndTime) return false;
  if (dateStr !== props.selectedDate) return false;
  const sh = parseInt(props.selectedStartTime.split(':')[0]);
  const eh = parseInt(props.selectedEndTime.split(':')[0]);
  return hour >= sh && hour < eh;
}

function isHourRangeStart(dateStr: string, hour: number): boolean {
  if (!props.selectedDate || !props.selectedStartTime) return false;
  if (dateStr !== props.selectedDate) return false;
  return hour === parseInt(props.selectedStartTime.split(':')[0]);
}

function isHourRangeEnd(dateStr: string, hour: number): boolean {
  if (!props.selectedDate || !props.selectedEndTime) return false;
  if (dateStr !== props.selectedDate) return false;
  return hour === parseInt(props.selectedEndTime.split(':')[0]) - 1;
}

function isFirstClickPending(dateStr: string, hour: number): boolean {
  if (!hourlyFirstClick.value) return false;
  return hourlyFirstClick.value.date === dateStr && hourlyFirstClick.value.hour === hour;
}

function canSelectHour(dateStr: string, hour: number, day: DayColumn): boolean {
  if (day.isClosed || day.isPast) return false;
  const s = day.slots.find(x => x.hour === hour);
  if (!s || s.status === 'rented' || s.status === 'closed') return false;

  if (hourlyFirstClick.value && hourlyFirstClick.value.date === dateStr) {
    const startH = Math.min(hourlyFirstClick.value.hour, hour);
    const endH = Math.max(hourlyFirstClick.value.hour, hour);
    for (let h = startH; h <= endH; h++) {
       const sl = day.slots.find(x => x.hour === h);
       if (!sl || sl.status === 'rented' || sl.status === 'closed') return false;
    }
    
    const diffHours = endH - startH + 1;
    if (diffHours > props.maxHours) return false;
    if (diffHours < props.minHours && startH !== endH) return false;
  }
  return true;
}

function onHourlyClick(day: DayColumn, slot: TimeSlot) {
  if (day.isClosed || day.isPast || slot.status === 'rented' || slot.status === 'closed') return;
  const dateStr = formatDate(day.date);
  const hour = slot.hour;

  if (!hourlyFirstClick.value || hourlyFirstClick.value.date !== dateStr) {
    // 第一次點擊（或換日期重選）
    hourlyFirstClick.value = { date: dateStr, hour };
  } else {
    // 檢查是否跨越已租借或休館時段
    const startH = Math.min(hourlyFirstClick.value.hour, hour);
    const endH = Math.max(hourlyFirstClick.value.hour, hour);
    for (let h = startH; h <= endH; h++) {
       const s = day.slots.find(x => x.hour === h);
       if (!s || s.status === 'rented' || s.status === 'closed') {
         // 若跨越了不能租的時段，則視為重新點擊此時段
         hourlyFirstClick.value = { date: dateStr, hour };
         return;
       }
    }

    // 第二次點擊
    const startTime = `${String(startH).padStart(2, '0')}:00`;
    const endTime = `${String(endH + 1).padStart(2, '0')}:00`;
    emit('select-time', { date: dateStr, startTime, endTime });
    hourlyFirstClick.value = null;
  }
}

// ── 通用點擊 ──
function onSlotClick(day: DayColumn, slot: TimeSlot) {
  if (day.isClosed || day.isPast) return;
  if (props.interactMode === 'session') {
    onSessionClick(day, slot.hour);
  } else if (props.interactMode === 'hourly') {
    onHourlyClick(day, slot);
  }
}

function onDayClick(day: DayColumn) {
  if (day.isClosed || day.isPast) return;
  if (props.interactMode === 'view') {
    emit('select-date', formatDate(day.date));
  }
  // session / hourly 由 slot 點擊處理
}

onMounted(() => {
  initializeWeek();
});
</script>

<template>
  <div>
    <!-- 週導覽 -->
    <div class="flex justify-center items-center gap-2 mb-4">
      <button @click="previousWeek" class="btn btn-square btn-ghost btn-sm">
        <span class="material-symbols-outlined text-base-content">chevron_left</span>
      </button>
      <span class="text-lg font-medium text-base-content min-w-32 text-center">{{ weekRange }}</span>
      <button @click="nextWeek" class="btn btn-square btn-ghost btn-sm">
        <span class="material-symbols-outlined text-base-content">chevron_right</span>
      </button>
    </div>

    <!-- 時段格 -->
    <div class="flex overflow-x-auto border border-base-300" data-lenis-prevent>

      <!-- 時間標籤欄 -->
      <div class="w-14 shrink-0 border-r border-base-300">
        <div class="h-14 border-b border-base-300"></div>
        <div
          v-for="hour in HOURS"
          :key="hour"
          class="h-10 flex items-start pt-1 pr-2 justify-end border-b border-base-200 last:border-b-0"
        >
          <span class="text-xs text-base-content">{{ formatHour(hour) }}</span>
        </div>
      </div>

      <!-- 各天欄位 -->
      <div
        v-for="day in columns"
        :key="day.date.toISOString()"
        class="flex-1 min-w-0 border-r border-base-200 last:border-r-0"
        :class="{ 'bg-base-200': day.isClosed || day.isPast }"
        @click="onDayClick(day)"
      >
        <!-- 日期標頭 -->
        <div
          class="h-14 flex flex-col items-center justify-center border-b border-base-300 sticky top-0 z-10 transition-colors"
          :class="{
            'bg-base-300': day.isClosed || day.isPast,
            'bg-base-200': isToday(day.date) && !day.isClosed,
            'bg-base-100 hover:bg-base-200': !day.isClosed && !day.isPast && !isToday(day.date),
          }"
        >
          <span class="text-xs font-medium text-base-content">
            {{ DAY_NAMES[day.date.getDay()] }}
          </span>
          <span
            class="w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full mt-0.5"
            :class="{
              'bg-success text-success-content': isToday(day.date) && !day.isClosed,
              'text-base-content/30': day.isClosed || day.isPast,
              'text-base-content': !isToday(day.date) && !day.isClosed && !day.isPast,
            }"
          >
            {{ day.date.getDate() }}
          </span>
          <span
            v-if="day.isClosed"
            class="text-[9px] leading-none text-base-content font-medium mt-0.5"
          >休館</span>
        </div>

        <!-- 時段格子 -->
        <div
          v-for="slot in day.slots"
          :key="slot.hour"
          class="h-10 border-b border-base-200 last:border-b-0 relative transition-colors"
          :class="[
            // 基底狀態
            day.isPast ? 'bg-base-200' : '',
            !day.isPast && slot.status === 'closed' ? 'bg-base-300' : '',
            !day.isPast && slot.status === 'rented' ? 'bg-error text-error-content border-base-200/40 ' : '',
            !day.isPast && slot.status === 'partial' ? 'bg-warning text-warning-content ' : '',
            !day.isPast && slot.status === 'available' ? 'bg-base-100 border-base-200/40' : '',
            !day.isPast && slot.status === 'available' && isCurrentHour(day.date, slot.hour) ? 'bg-base-200' : '',

            // Session 模式 - 未選取且可租借時用中性框線標示時段區塊
            interactMode === 'session' && isSessionSlot(slot.hour) && !isSessionSelected(formatDate(day.date), slot.hour) && !day.isClosed && !day.isPast && !isSessionRented(formatDate(day.date), slot.hour)
              ? 'border-l-2 border-r-2 border-base-300'
              : '',
            interactMode === 'session' && isSessionFirstHour(slot.hour) && !isSessionSelected(formatDate(day.date), slot.hour) && !day.isClosed && !day.isPast && !isSessionRented(formatDate(day.date), slot.hour)
              ? 'border-t-2 border-t-base-300'
              : '',
            interactMode === 'session' && isSessionLastHour(slot.hour) && !isSessionSelected(formatDate(day.date), slot.hour) && !day.isClosed && !day.isPast && !isSessionRented(formatDate(day.date), slot.hour)
              ? 'border-b-2 border-b-base-300'
              : '',
            // Session 可點擊（未過期、未休館、未租借）
            interactMode === 'session' && isSessionSlot(slot.hour) && !day.isClosed && !day.isPast && !isSessionRented(formatDate(day.date), slot.hour)
              ? 'cursor-pointer hover:bg-base-200'
              : '',
            // Session 選取中 - 整個區塊實色
            isSessionSelected(formatDate(day.date), slot.hour) ? 'bg-success text-success-content' : '',
            isSessionSelected(formatDate(day.date), slot.hour) && isSessionFirstHour(slot.hour)
              ? 'border-t-2 border-t-success border-l-2 border-r-2 border-l-success border-r-success'
              : '',
            isSessionSelected(formatDate(day.date), slot.hour) && isSessionLastHour(slot.hour)
              ? 'border-b-2 border-b-success border-l-2 border-r-2 border-l-success border-r-success'
              : '',
            isSessionSelected(formatDate(day.date), slot.hour) && !isSessionFirstHour(slot.hour) && !isSessionLastHour(slot.hour)
              ? 'border-l-2 border-r-2 border-l-success border-r-success'
              : '',

            // Hourly 模式 - 可點擊
            interactMode === 'hourly' && canSelectHour(formatDate(day.date), slot.hour, day)
              ? 'cursor-pointer hover:bg-base-200'
              : '',
            interactMode === 'hourly' && !canSelectHour(formatDate(day.date), slot.hour, day) && slot.status === 'available' && !day.isPast && !day.isClosed
              ? 'cursor-not-allowed opacity-50 bg-base-200'
              : '',
            // Hourly 選取範圍
            isHourSelected(formatDate(day.date), slot.hour) && (isHourRangeStart(formatDate(day.date), slot.hour) || isHourRangeEnd(formatDate(day.date), slot.hour))
              ? 'bg-success text-success-content' : '',
            isHourSelected(formatDate(day.date), slot.hour) && !isHourRangeStart(formatDate(day.date), slot.hour) && !isHourRangeEnd(formatDate(day.date), slot.hour)
              ? 'bg-success/15 border-l-2 border-r-2 border-l-success border-r-success' : '',
            isHourRangeStart(formatDate(day.date), slot.hour) ? 'border-t-2 border-t-success border-l-2 border-r-2 border-l-success border-r-success' : '',
            isHourRangeEnd(formatDate(day.date), slot.hour) ? 'border-b-2 border-b-success border-l-2 border-r-2 border-l-success border-r-success' : '',
            // Hourly 第一次點擊待選
            isFirstClickPending(formatDate(day.date), slot.hour) ? 'bg-success text-success-content ring-2 ring-success ring-inset' : '',
          ]"
          @click.stop="onSlotClick(day, slot)"
        >
          <!-- 已租借標記 -->
          <div
            v-if="slot.status === 'rented'"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <!-- <div class="w-4 h-0.5 bg-error-content rounded-full"></div> -->
          </div>

          <!-- Session 標籤 (顯示在第一格) -->
          <div
            v-if="interactMode === 'session' && isSessionFirstHour(slot.hour) && !day.isClosed && !day.isPast && !isSessionRented(formatDate(day.date), slot.hour)"
            class="absolute inset-0 flex items-start justify-center pt-0.5 pointer-events-none"
          >
            <span class="text-[9px] font-bold text-base-content/50 leading-none">{{ getSessionForHour(slot.hour) }}</span>
          </div>

          <!-- Hourly 起/迄標籤 -->
          <div
            v-if="isHourRangeStart(formatDate(day.date), slot.hour)"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span class="text-[9px] font-bold text-success-content leading-none">起</span>
          </div>
          <div
            v-if="isHourRangeEnd(formatDate(day.date), slot.hour)"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span class="text-[9px] font-bold text-success-content leading-none">迄</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖例 -->
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-base-content">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-200 border border-base-300"></span>
        休館日
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-error border border-error"></span>
        已租借
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-100 border border-base-300"></span>
        可租借
      </div>
      <div v-if="interactMode === 'session'" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded border-2 border-base-300 bg-base-100"></span>
        可選時段
      </div>
      <div v-if="interactMode !== 'view' && (selectedDate || hourlyFirstClick)" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-success/15 border border-success"></span>
        已選取
      </div>
    </div>
  </div>
</template>
