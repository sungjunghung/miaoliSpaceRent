<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import MonthCalendar from "@/components/portal/calendar/MonthCalendar.vue";

const router = useRouter();

const emit = defineEmits<{
  (e: 'search'): void;
}>();

// 取得當前日期並格式化為 YYYY-MM-DD
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 取得N天後的日期
const getDateAfterDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayDate = getTodayString();
const sevenDaysLater = getDateAfterDays(7);

// 租借方式由父層(protailHeader)的 tabs 控制,透過 v-model:mode 雙向綁定
const searchMode = defineModel<"daily" | "multi">("mode", { default: "daily" });
const searchDate = ref(todayDate);
const searchStartTime = ref("");
const searchStartDate = ref(sevenDaysLater);
const searchEndDate = ref(getDateAfterDays(8));
const activeCalendar = ref<"single" | "start" | "end" | null>(null);
// 日曆彈出層節點:用來判斷點擊是否落在彈窗內(失焦關閉)
const popupEl = ref<HTMLElement | null>(null);

const hourOptions = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// 動態計算可用時間選項（當日需提前2小時，其他日期無限制）
const availableTimeOptions = computed(() => {
  // 如果選擇的日期不是今天，返回所有時段
  if (searchDate.value !== todayDate) {
    return hourOptions;
  }

  // 當日情況：計算當前時間 + 2小時後的時段
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 計算2小時後的時間（以小時為單位，向上取整）
  const minHour = currentMinute > 0 ? currentHour + 3 : currentHour + 2;

  // 過濾出符合條件的時段
  return hourOptions.filter((time) => {
    const [hour] = time.split(":").map(Number);
    return hour !== undefined && hour >= minHour;
  });
});

// 監聽可用時間選項變化，自動設置為第一個可用時段
watch(
  availableTimeOptions,
  (newOptions) => {
    if (newOptions.length > 0 && !searchStartTime.value) {
      searchStartTime.value = newOptions[0] || "";
    }
  },
  { immediate: true }
);

// 監聽日期變化，重置時間選擇
watch(searchDate, () => {
  if (availableTimeOptions.value.length > 0) {
    searchStartTime.value = availableTimeOptions.value[0] || "";
  }
});

watch(searchMode, () => {
  activeCalendar.value = null;
});

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "選擇日期";
  return dateStr.replaceAll("-", "/");
}

function toggleCalendar(calendar: "single" | "start" | "end"): void {
  activeCalendar.value = activeCalendar.value === calendar ? null : calendar;
}

function selectSingleDate(dateStr: string): void {
  // 任何模式選日期都「不」自動關閉,只有失焦(點擊彈出層外)才關
  searchDate.value = dateStr;
}

// 失焦關閉:只有點在日曆彈窗內或欄位按鈕上才保持開啟,
// 點時間選單、其他欄位以外的任何地方都關閉
function handleClickOutside(e: MouseEvent): void {
  if (!activeCalendar.value) return;
  const target = e.target as HTMLElement;
  if (popupEl.value?.contains(target)) return; // 點日曆內(選日期)→ 保持
  if (target.closest("[data-cal-trigger]")) return; // 點欄位按鈕 → 交給按鈕自己 toggle/切換
  activeCalendar.value = null;
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));

function selectRangeDate(dateStr: string): void {
  if (!searchStartDate.value || (searchStartDate.value && searchEndDate.value)) {
    searchStartDate.value = dateStr;
    searchEndDate.value = "";
    return;
  }

  if (dateStr < searchStartDate.value) {
    searchStartDate.value = dateStr;
    searchEndDate.value = "";
    return;
  }

  // 多日租借:選完結束日期「不」關閉日曆,讓使用者能繼續微調範圍
  searchEndDate.value = dateStr;
}

const handleSearch = (): void => {
  emit('search');
  if (searchMode.value === "multi") {
    if (!searchStartDate.value) return;
    const endDate = searchEndDate.value || searchStartDate.value;

    router.push({
      name: "venue-list",
      query: {
        mode: "daily",
        startDate: searchStartDate.value,
        endDate: endDate,
      },
    });
    return;
  }

  router.push({
    name: "venue-list",
    query: {
      mode: "hourly",
      date: searchDate.value,
      time: searchStartTime.value,
    },
  });
};
</script>

<template>


      <div class="relative flex flex-col gap-3 md:flex-row md:items-end">
        <!-- Daily Mode -->
        <div v-if="searchMode === 'daily'" key="daily" class="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 flex-1">
          <label class="form-control gap-1">
            <button
              id="search-date"
              data-cal-trigger
              type="button"
              class="input w-full h-12"
              :class="{ 'input-primary': activeCalendar === 'single' }"
              @click="toggleCalendar('single')"
            >
            <span class="material-symbols-outlined text-base-content/50 text-xl">calendar_month</span>
              <span>{{ formatDateLabel(searchDate) }}</span>
            </button>
          </label>

          <label class="select w-full h-12">
            <span class="material-symbols-outlined text-base-content/50 z-10 text-xl">schedule</span>
            <select id="search-start-time" v-model="searchStartTime" >
              <option value="" disabled>選擇開始時間</option>
              <option v-for="option in availableTimeOptions" :key="`start-${option}`" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
        </div>

        <!-- Multi Mode -->
        <div v-else key="multi" class="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 flex-1">
          <label class="form-control gap-1">
            <button
              id="search-start-date"
              data-cal-trigger
              type="button"
              class="input w-full h-12"
              :class="{ 'input-primary': activeCalendar === 'start' }"
              @click="toggleCalendar('start')"
            >
            <span class="material-symbols-outlined text-base-content/50 text-xl">calendar_month</span>
              <span>{{ formatDateLabel(searchStartDate) }}</span>
            </button>
          </label>

          <label class="form-control gap-1">
            <button
              id="search-end-date"
              data-cal-trigger
              type="button"
              class="input w-full h-12"
              :class="{ 'input-primary': activeCalendar === 'end' }"
              @click="toggleCalendar('end')"
            >
              <span class="material-symbols-outlined text-base-content/50 text-xl">calendar_month</span>
              <span>{{ searchEndDate ? formatDateLabel(searchEndDate) : "選擇結束日期" }}</span>
            </button>
          </label>
        </div>

        <!-- Action Button -->
        <button type="button" class="btn btn-primary lg:btn-square lg:btn-lg" @click="handleSearch">
          <span class="material-symbols-outlined text-2xl">search</span>
          <span class="lg:hidden">搜尋場館</span>
        </button>

        <!-- 共用日曆彈出層:錨定整條搜尋列,寬度與搜尋範圍一致;放在 label 之外避免點擊被轉發 -->
        <div
          v-if="activeCalendar"
          ref="popupEl"
          class="absolute left-0 right-0 top-full z-50 mt-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl"
        >
          <MonthCalendar
            v-if="searchMode === 'daily'"
            lock-view="month"
            :selected-start="searchDate"
            :view-date="searchDate"
            :show-legend="false"
            @select-date="selectSingleDate"
          />
          <MonthCalendar
            v-else
            lock-view="month"
            :selected-start="searchStartDate"
            :selected-end="searchEndDate"
            :view-date="activeCalendar === 'end' ? (searchEndDate || searchStartDate) : searchStartDate"
            :show-legend="true"
            @select-date="selectRangeDate"
          />
        </div>
      </div>


</template>
