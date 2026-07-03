<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { newsItems as mockNews } from '@/services/newsService'
import { publicImageUrl } from '@/utils/assets'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()

const newsId = computed(() => route.params.id as string)
const isNew = computed(() => newsId.value === 'new')

interface NewsItem {
  id: number
  category: string
  title: string
  summary: string
  content: string
  publishedAt: string
  pinned: boolean
  imageUrl: string | null
}

const categories = [...new Set(mockNews.map(n => n.category))]

const formData = ref<NewsItem>({
  id: 0,
  category: '',
  title: '',
  summary: '',
  content: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  pinned: false,
  imageUrl: null,
})

const contentTextLength = computed(() =>
  formData.value.content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .length
)

onMounted(() => {
  if (!isNew.value) {
    const found = mockNews.find(n => n.id === Number(newsId.value))
    if (found) {
      formData.value = JSON.parse(JSON.stringify(found))
    }
  }
})

function handleSave() {
  alert('儲存成功（prototype 模擬）')
}

</script>

<template>
  <div class="admin-container-info">

    <!-- 基本設定 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">基本設定</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text">標題</span></label>
            <input v-model="formData.title" type="text" class="input input-bordered w-full" placeholder="請輸入消息標題" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">類別</span></label>
            <select v-model="formData.category" class="select select-bordered w-full">
              <option value="" disabled>請選擇類別</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">發布日期</span></label>
            <input v-model="formData.publishedAt" type="date" class="input input-bordered w-full" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label cursor-pointer justify-start gap-3 p-0">
              <input v-model="formData.pinned" type="checkbox" class="toggle toggle-warning toggle-sm" />
              <span class="label-text">置頂顯示</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 封面圖片 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">封面圖片</h2>
        <div class="form-control">
          <label class="label"><span class="label-text">圖片網址</span></label>
          <input v-model="formData.imageUrl" type="text" class="input input-bordered w-full"
            placeholder="https://..." />
        </div>
        <div v-if="formData.imageUrl" class="mt-3">
          <img :src="publicImageUrl(formData.imageUrl)" alt="preview" class="rounded-lg max-h-48 object-cover w-full" />
        </div>
        <div v-else
          class="mt-3 bg-base-200/50 rounded-lg border border-dashed border-base-300 p-8 text-center text-base-content/30">
          尚未設定封面圖片
        </div>
      </div>
    </div>

    <!-- 摘要 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">摘要</h2>
        <div class="form-control">
          <textarea v-model="formData.summary" class="textarea textarea-bordered w-full" rows="2"
            placeholder="簡短描述，會顯示在列表頁"></textarea>
          <p class="text-base-content/40 mt-1">{{ formData.summary.length }} 字</p>
        </div>
      </div>
    </div>

    <!-- 內容 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">內容</h2>
        <div class="form-control">
          <QuillEditor
            v-model:content="formData.content"
            content-type="html"
            theme="snow"
            toolbar="full"
            class="rounded-box border border-base-300 bg-base-100"
            style="min-height: 280px"
          />
          <p class="text-base-content/40 mt-2">{{ contentTextLength }} 字</p>
        </div>
      </div>
    </div>

    <!-- 儲存 -->
    <div class="flex justify-end">
      <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存</button>
    </div>
  </div>
</template>
