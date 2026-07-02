<script setup lang="ts">
import { inject, ref, type Ref } from 'vue';
import { publicImageUrl } from '@/utils/assets';

interface Venue {
  mainImageUrl: string;
  gallery: string[];
}

const formData = inject<Ref<Venue>>('venueFormData')!;

const fileInput = ref<HTMLInputElement | null>(null);
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function setMainImage(url: string) {
  formData.value.mainImageUrl = url;
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  if (!formData.value.gallery) formData.value.gallery = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = URL.createObjectURL(file);
    formData.value.gallery.push(url);
  }
  
  target.value = '';
}

function removeGalleryImage(index: number) {
  const removed = formData.value.gallery.splice(index, 1)[0];
  if (formData.value.mainImageUrl === removed && formData.value.gallery.length) {
    formData.value.mainImageUrl = formData.value.gallery[0];
  }
}

function onDragStart(index: number) {
  dragIndex.value = index;
}

function onDragOver(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return;
  dragOverIndex.value = index;
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;
  const from = dragIndex.value;
  const moved = formData.value.gallery.splice(from, 1)[0];
  formData.value.gallery.splice(targetIndex, 0, moved);
  dragOverIndex.value = null;
  dragIndex.value = null;
}

function onDragEnd() {
  dragOverIndex.value = null;
  dragIndex.value = null;
}
</script>

<template>
  <div class="space-y-4">
    <div role="alert" class="alert" :class="dragIndex !== null ? 'alert-warning' : 'alert-info'">
      <span class="material-symbols-outlined">drag_indicator</span>
      <span v-if="dragIndex === null">可拖曳圖片調整排序；第一張將作為預設主圖來源。</span>
      <span v-else>
        正在拖曳第 {{ dragIndex + 1 }} 張
        <span v-if="dragOverIndex !== null">，放開後將移到第 {{ dragOverIndex + 1 }} 張</span>
      </span>
    </div>

    <div class="flex gap-2 mb-4">
      <input type="file" ref="fileInput" accept="image/*" class="hidden" multiple @change="handleFileUpload" />
      <button type="button" class="btn btn-primary" @click="fileInput?.click()">新增圖片</button>
    </div>

    <div v-if="formData.gallery?.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="(url, index) in formData.gallery" :key="index"
        class="relative group rounded-lg overflow-hidden border border-base-300 aspect-video bg-base-200 cursor-grab select-none transition-all duration-200"
        :class="{
          'opacity-50 scale-[0.98] ring-2 ring-base-300 z-10 cursor-grabbing': dragIndex === index,
          'ring-2 ring-primary ring-offset-2 ring-offset-base-100 shadow-lg scale-[1.02]': dragOverIndex === index,
        }"
        draggable="true" @dragstart="onDragStart(index)" @dragover.prevent="onDragOver(index)" @dragleave="onDragLeave(index)"
        @drop="onDrop(index)" @dragend="onDragEnd">
        <img :src="publicImageUrl(url)" :alt="`圖片 ${index + 1}`" class="w-full h-full object-cover" />
        <div v-if="dragOverIndex === index"
          class="absolute inset-0 border-2 border-dashed border-primary/80 bg-primary/10 pointer-events-none"></div>
        <div v-if="url === formData.mainImageUrl" class="absolute top-2 left-2">
          <span class="badge badge-primary">主圖</span>
        </div>
        <div class="absolute top-2 right-2">
          <span class="badge badge-neutral">#{{ index + 1 }}</span>
        </div>
        <div
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button v-if="url !== formData.mainImageUrl" type="button" class="btn btn-primary" @click="setMainImage(url)">
            設為主圖
          </button>
          <button type="button" class="btn btn-error" @click="removeGalleryImage(index)">
            刪除
          </button>
        </div>
      </div>
    </div>
    <div v-else
      class="text-base-content/30 italic p-6 text-center bg-base-200/50 rounded-lg border border-dashed border-base-300">
      尚未新增任何圖片
    </div>

    <div class="flex justify-end">
      <button type="button" class="btn btn-primary px-8">儲存照片設定</button>
    </div>
  </div>
</template>
