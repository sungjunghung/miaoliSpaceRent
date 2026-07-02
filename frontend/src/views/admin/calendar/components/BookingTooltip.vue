<script setup lang="ts">
import { computed, inject } from 'vue';
import type { EventTooltipState } from '@/composables/useEventTooltip';

const tooltip = inject<EventTooltipState>('eventTooltip')!;

const SESSION_LABEL: Record<string, string> = {
  morning: '上午（08:00–12:00）',
  afternoon: '下午（13:00–17:00）',
  evening: '晚上（18:00–22:00）',
};

const MODE_LABEL: Record<string, string> = {
  daily: '全日租借',
  session: '時段租借',
  hourly: '計時租借',
};

// 與日曆事件顏色／圖例一致的統一標示（不暴露內部細狀態）
const TYPE_STATUS: Record<string, { label: string; class: string }> = {
  rented: { label: '已租借', class: 'badge-success' },
  unavailable: { label: '預約處理中', class: 'badge-neutral' },
  closed: { label: '休館日', class: 'badge-error' },
  note: { label: '註記', class: 'badge-info' },
  blocked: { label: '時段保留', class: 'badge-warning' },
};

const meta = computed(() => tooltip.activeEvent.value?.metadata ?? {});

const statusInfo = computed(() => {
  const t = tooltip.activeEvent.value?.type as string;
  return TYPE_STATUS[t] ?? { label: '—', class: 'badge-ghost' };
});

const timeDisplay = computed(() => {
  const m = meta.value;
  if (m.rentalMode === 'daily') {
    if (m.startDate && m.endDate && m.startDate !== m.endDate) {
      return `${m.startDate} ~ ${m.endDate}`;
    }
    return m.date ?? '';
  }
  if (m.rentalMode === 'session') {
    return `${m.date}　${SESSION_LABEL[m.session] ?? m.session}`;
  }
  if (m.rentalMode === 'hourly') {
    return `${m.date}　${m.startTime} – ${m.endTime}`;
  }
  return m.date ?? '';
});

const positionStyle = computed(() => {
  const offset = 12;
  return {
    position: 'fixed' as const,
    left: `${tooltip.x.value + offset}px`,
    top: `${tooltip.y.value + offset}px`,
    zIndex: 9999,
    pointerEvents: 'none' as const,
  };
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="tooltip.visible.value && tooltip.activeEvent.value"
        :style="positionStyle"
        class="card card-border bg-base-100 shadow-lg w-72"
      >
        <div class="card-body p-3 gap-2">
          <!-- 標題列 -->
          <div class="flex items-center justify-between gap-2">
            <h3 class="card-title text-sm truncate">
              {{ meta.applicant ?? tooltip.activeEvent.value.title }}
            </h3>
            <span class="badge badge-sm" :class="statusInfo.class">
              {{ statusInfo.label }}
            </span>
          </div>

          <div class="divider my-0"></div>

          <!-- 資訊列 -->
          <table class="text-xs text-base-content/80">
            <tbody>
              <tr v-if="meta.venueName">
                <td class="pr-3 py-0.5 font-medium text-base-content/60 whitespace-nowrap">場地</td>
                <td class="py-0.5">{{ meta.venueName }}</td>
              </tr>
              <tr v-if="meta.purpose">
                <td class="pr-3 py-0.5 font-medium text-base-content/60 whitespace-nowrap">用途</td>
                <td class="py-0.5">{{ meta.purpose }}</td>
              </tr>
              <tr>
                <td class="pr-3 py-0.5 font-medium text-base-content/60 whitespace-nowrap">模式</td>
                <td class="py-0.5">{{ MODE_LABEL[meta.rentalMode] ?? meta.rentalMode }}</td>
              </tr>
              <tr>
                <td class="pr-3 py-0.5 font-medium text-base-content/60 whitespace-nowrap">時間</td>
                <td class="py-0.5">{{ timeDisplay }}</td>
              </tr>
              <tr v-if="meta.createdAt">
                <td class="pr-3 py-0.5 font-medium text-base-content/60 whitespace-nowrap">申請日</td>
                <td class="py-0.5">{{ meta.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
