<script setup lang="ts">
import { ref, watch } from "vue";

interface DaySchedule {
  open: string;
  close: string;
  isClosed?: boolean;
}

const props = defineProps<{
  modelValue?: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }>];
}>();

const weekDays = [
  { key: "monday", label: "一", fullLabel: "星期一" },
  { key: "tuesday", label: "二", fullLabel: "星期二" },
  { key: "wednesday", label: "三", fullLabel: "星期三" },
  { key: "thursday", label: "四", fullLabel: "星期四" },
  { key: "friday", label: "五", fullLabel: "星期五" },
  { key: "saturday", label: "六", fullLabel: "星期六" },
  { key: "sunday", label: "日", fullLabel: "星期日" },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

const schedule = ref<Record<string, DaySchedule>>({});
const hasLunchBreak = ref(false);
const lunchBreakStart = ref("12:00");
const lunchBreakEnd = ref("13:00");

let lastEmitted: string | null = null;
let suppressEmit = false;

function initSchedule() {
  const defaultSchedule: Record<string, DaySchedule> = {};
  const existingLunchBreak = Object.values(props.modelValue ?? {}).find(
    (d) => d.lunchBreakStart && d.lunchBreakEnd,
  );

  weekDays.forEach((day) => {
    const existing = props.modelValue?.[day.key];
    if (existing) {
      defaultSchedule[day.key] = {
        open: existing.open,
        close: existing.close,
        isClosed: false,
      };
    } else {
      defaultSchedule[day.key] = {
        open: "08:00",
        close: "22:00",
        isClosed: true,
      };
    }
  });

  suppressEmit = true;
  schedule.value = defaultSchedule;
  hasLunchBreak.value = !!existingLunchBreak;
  lunchBreakStart.value = existingLunchBreak?.lunchBreakStart ?? "12:00";
  lunchBreakEnd.value = existingLunchBreak?.lunchBreakEnd ?? "13:00";
}

watch(
  () => props.modelValue,
  (val) => {
    // 若 modelValue 變更是來自我們自己的 emit，跳過 re-init，避免循環
    if (val && JSON.stringify(val) === lastEmitted) return;
    initSchedule();
  },
  { immediate: true, deep: true },
);

watch(
  [schedule, hasLunchBreak, lunchBreakStart, lunchBreakEnd],
  (newSchedule) => {
    if (suppressEmit) {
      suppressEmit = false;
      return;
    }
    const result: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }> = {};

    Object.entries(newSchedule[0]).forEach(([day, config]) => {
      if (!config.isClosed) {
        result[day] = {
          open: config.open,
          close: config.close,
        };
        if (hasLunchBreak.value) {
          result[day].lunchBreakStart = lunchBreakStart.value;
          result[day].lunchBreakEnd = lunchBreakEnd.value;
        }
      }
    });

    lastEmitted = JSON.stringify(result);
    emit("update:modelValue", result);
  },
  { deep: true },
);

function parseHour(timeString: string | undefined): number {
  if (!timeString) return 8;
  const parts = timeString.split(":");
  const hour = parseInt(parts[0] || "8");
  return isNaN(hour) ? 8 : hour;
}

function formatHourToTime(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}
</script>

<template>
  <div class="card basic-card">
    <div class="card-body">
      <h2 class="card-title">開放時間</h2>
      <div class="space-y-2">

        <div v-for="day in weekDays" :key="day.key"
          class="flex items-center justify-start py-2 border-b border-base-200 last:border-0 gap-4">
          <!-- 左側：日期與開關 -->

          <label class="label">
            <input type="checkbox" class="toggle toggle-success toggle-sm" :checked="!schedule[day.key]?.isClosed"
              @change="
                () => {
                  const daySchedule = schedule[day.key];
                  if (daySchedule) daySchedule.isClosed = !daySchedule.isClosed;
                }
              " />
            <span class="font-medium" :class="{ 'text-base-content/50': schedule[day.key]?.isClosed }">
              {{ day.fullLabel }}
            </span>
          </label>

          <!-- 右側：時間選擇 -->
          <div class="flex items-center gap-2">
            <template v-if="schedule[day.key] && !schedule[day.key]?.isClosed">
              <select :value="parseHour(schedule[day.key]?.open)" @change="
                (e) => {
                  const daySchedule = schedule[day.key];
                  if (daySchedule)
                    daySchedule.open = formatHourToTime(
                      parseInt((e.target as HTMLSelectElement).value),
                    );
                }
              " class="select select-bordered select-sm w-24">
                <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <span class="text-base-content/40">至</span>
              <select :value="parseHour(schedule[day.key]?.close)" @change="
                (e) => {
                  const daySchedule = schedule[day.key];
                  if (daySchedule)
                    daySchedule.close = formatHourToTime(
                      parseInt((e.target as HTMLSelectElement).value),
                    );
                }
              " class="select select-bordered select-sm w-24">
                <option v-for="opt in hourOptions.filter(
                  (h) => h.value > parseHour(schedule[day.key]?.open),
                )" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </template>
            <div v-else class="text-sm text-base-content/40 italic pr-2">
              休館
            </div>
          </div>
        </div>

      </div>
      <div class="bg-base-200/40 rounded-box p-3 flex flex-wrap items-center gap-2 mt-3">
        <label class="label gap-2 p-0">
          <input v-model="hasLunchBreak" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="text-sm font-medium">中午休息時間</span>
        </label>
        <select v-model="lunchBreakStart" :disabled="!hasLunchBreak" class="select select-bordered select-sm w-24 disabled:opacity-40">
          <option v-for="opt in hourOptions" :key="`global-lunch-start-${opt.value}`" :value="formatHourToTime(opt.value)">
            {{ opt.label }}
          </option>
        </select>
        <span class="text-base-content/40">至</span>
        <select v-model="lunchBreakEnd" :disabled="!hasLunchBreak" class="select select-bordered select-sm w-24 disabled:opacity-40">
          <option v-for="opt in hourOptions.filter((h) => h.value > parseHour(lunchBreakStart))"
            :key="`global-lunch-end-${opt.value}`" :value="formatHourToTime(opt.value)">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
