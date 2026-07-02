<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type { CalendarEvent } from '@/types/calendar';
import { buildISO, formatInputDate, formatTime, parseISO, dayStartMinutes, slotMinutes } from '@/utils/calendar';
import mockVenues from '@/mocks/venues.json';

const props = defineProps<{
  /** When set, venue is fixed (opened from a venue page) */
  venueId?: number | null;
}>();

const emit = defineEmits<{
  save: [event: Omit<CalendarEvent, 'id'> & { id?: string }];
  delete: [id: string];
  close: [];
}>();

const venueOptions = mockVenues.map(v => ({ id: v.id, name: v.name }));

const modalRef = ref<HTMLDialogElement | null>(null);
const isEditing = ref(false);
const formError = ref('');
const eventType = ref<'note' | 'blocked'>('note');

/** Whether a venue selector should be shown (blocked + no fixed venueId) */
const needsVenueSelector = computed(() => eventType.value === 'blocked' && props.venueId == null);

const form = reactive({
  id: '',
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  allDay: true,
  description: '',
  venueId: null as number | null,
});

function openNewEventModal(defaultDate?: Date, defaultStartMinutes?: number, defaultEndMinutes?: number, type: 'note' | 'blocked' = 'note') {
  formError.value = '';
  isEditing.value = false;
  eventType.value = type;
  const baseDate = defaultDate ?? new Date();
  form.id = '';
  form.title = '';
  form.date = formatInputDate(baseDate);
  form.description = '';
  form.venueId = props.venueId ?? null;

  if (defaultStartMinutes != null && defaultEndMinutes != null) {
    form.allDay = false;
    form.startTime = formatTime(defaultStartMinutes);
    form.endTime = formatTime(defaultEndMinutes);
  } else {
    form.allDay = true;
    const start = dayStartMinutes;
    const end = start + slotMinutes;
    form.startTime = formatTime(start);
    form.endTime = formatTime(end);
  }
  modalRef.value?.showModal();
}

function openEditEventModal(event: CalendarEvent) {
  formError.value = '';
  isEditing.value = true;
  eventType.value = event.type === 'blocked' ? 'blocked' : 'note';
  form.id = event.id;
  form.title = event.title;
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  form.date = formatInputDate(start);
  form.allDay = event.allDay;
  form.startTime = formatTime(start.getHours() * 60 + start.getMinutes());
  form.endTime = formatTime(end.getHours() * 60 + end.getMinutes());
  form.description = event.description ?? '';
  form.venueId = (event.metadata?.venueId as number) ?? props.venueId ?? null;
  modalRef.value?.showModal();
}

function saveEvent() {
  formError.value = '';
  if (eventType.value === 'blocked' && !form.venueId && props.venueId == null) {
    formError.value = '請選擇場館';
    return;
  }
  if (!form.title.trim()) {
    formError.value = '請輸入標題';
    return;
  }
  if (!form.date) {
    formError.value = '請選擇日期';
    return;
  }
  if (!form.allDay && (!form.startTime || !form.endTime)) {
    formError.value = '請輸入開始與結束時間';
    return;
  }

  const startIso = form.allDay
    ? buildISO(form.date, '00:00')
    : buildISO(form.date, form.startTime);
  const endIso = form.allDay
    ? buildISO(form.date, '23:59')
    : buildISO(form.date, form.endTime);

  if (!form.allDay && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    formError.value = '結束時間必須晚於開始時間';
    return;
  }

  emit('save', {
    id: isEditing.value ? form.id : undefined,
    title: form.title.trim(),
    type: eventType.value,
    start: startIso,
    end: endIso,
    allDay: form.allDay,
    description: form.description.trim(),
    metadata: eventType.value === 'blocked' ? { venueId: form.venueId ?? props.venueId } : undefined,
  });

  modalRef.value?.close();
}

function deleteEvent() {
  if (!form.id) return;
  emit('delete', form.id);
  modalRef.value?.close();
}

function closeModal() {
  modalRef.value?.close();
  emit('close');
}

defineExpose({
  openNewEventModal,
  openEditEventModal,
});
</script>

<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <svg v-if="eventType === 'note'" xmlns="http://www.w3.org/2000/svg" class="size-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        {{ isEditing ? (eventType === 'blocked' ? '編輯時段保留' : '編輯註記') : (eventType === 'blocked' ? '新增時段保留' : '新增註記') }}
      </h3>

      <div class="space-y-4 mt-4">
        <!-- 場館選擇（時段保留 + 無固定場館時） -->
        <label v-if="needsVenueSelector" class="form-control">
          <div class="label"><span class="label-text">場館</span></div>
          <select v-model="form.venueId" class="select select-bordered w-full">
            <option :value="null" disabled>請選擇場館</option>
            <option v-for="v in venueOptions" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </label>

        <!-- 標題 -->
        <label class="form-control">
          <div class="label"><span class="label-text">標題</span></div>
          <input
            v-model="form.title"
            type="text"
            class="input input-bordered w-full"
            :placeholder="eventType === 'blocked' ? '例：場地整修、比賽專用…' : '例：空調維護、長官視察…'"
          />
        </label>

        <!-- 日期 & 全天 -->
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label"><span class="label-text">日期</span></div>
            <input v-model="form.date" type="date" class="input input-bordered w-full" />
          </label>
          <label class="form-control">
            <div class="label"><span class="label-text">&nbsp;</span></div>
            <label class="flex items-center gap-2 h-12 cursor-pointer">
              <input v-model="form.allDay" type="checkbox" class="checkbox checkbox-sm" />
              <span class="label-text">整日事件</span>
            </label>
          </label>
        </div>

        <!-- 時間（非整日時顯示） -->
        <div v-if="!form.allDay" class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label"><span class="label-text">開始時間</span></div>
            <input v-model="form.startTime" type="time" class="input input-bordered w-full" step="1800" />
          </label>
          <label class="form-control">
            <div class="label"><span class="label-text">結束時間</span></div>
            <input v-model="form.endTime" type="time" class="input input-bordered w-full" step="1800" />
          </label>
        </div>

        <!-- 描述 -->
        <label class="form-control">
          <div class="label"><span class="label-text">備註說明</span></div>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered w-full"
            rows="3"
            placeholder="補充說明（選填）"
          ></textarea>
        </label>

        <!-- 提示 -->
        <div v-if="eventType === 'blocked'" class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span class="text-sm">時段保留將封鎖該時段，前台用戶無法預約此時段</span>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="formError" class="text-error text-sm">{{ formError }}</div>
      </div>

      <!-- 按鈕 -->
      <div class="modal-action flex items-center justify-between">
        <button v-if="isEditing" class="btn btn-ghost text-error btn-sm" @click="deleteEvent">
          {{ eventType === 'blocked' ? '刪除保留' : '刪除註記' }}
        </button>
        <div class="flex gap-2 ml-auto">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveEvent">儲存</button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
