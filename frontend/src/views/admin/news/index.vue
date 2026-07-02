<template>
  <div class="space-y-4 p-4">

    <div class="flex items-center justify-between">
      <div class="flex-1 flex gap-2 flex-wrap">
         <label class="input">
          <span class="material-symbols-outlined text-lg">search</span>
        <input v-model="search" type="text" placeholder="搜尋標題或摘要" />
        </label>
        <select v-model="filterCategory" class="select">
          <option value="">全部類別</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="router.push({ name: 'admin-news-edit', params: { id: 'new' } })">
        <span class="material-symbols-outlined">add</span>
        新增消息
      </button>
    </div>

    <div class="basis-table-container">
      <table class="table">
        <thead>
          <tr>
            <th>標題</th>
            <th>類別</th>
            <th>發布日期</th>
            <th>置頂</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id" class="hover" @click="router.push({ name: 'admin-news-edit', params: { id: item.id } })">
            <td>
              <div class="flex items-center gap-3">
                <figure v-if="item.imageUrl" class="shrink-0">
                  <img :src="publicImageUrl(item.imageUrl)" :alt="item.title" class="w-10 h-10 object-cover rounded-lg" />
                </figure>
                <div v-else class="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-base-content/30">image</span>
                </div>
                <div>
                  <p class="font-semibold line-clamp-1">{{ item.title }}</p>
                  <p class="text-base-content/50 line-clamp-1">{{ item.summary }}</p>
                </div>
              </div>
            </td>
            <td><span class="badge badge-outline">{{ item.category }}</span></td>
            <td class="text-base-content/60">{{ item.publishedAt }}</td>
            <td>
              <span v-if="item.pinned" class="badge badge-warning">置頂</span>
              <span v-else class="text-base-content/30">—</span>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="text-center text-base-content/40 py-10">找不到符合的消息</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-base-content/40">共 {{ filtered.length }} 筆</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { newsItems as mockNews } from '@/services/newsService'
import { publicImageUrl } from '@/utils/assets'

const router = useRouter()
const search = ref('')
const filterCategory = ref('')

const categories = [...new Set(mockNews.map(n => n.category))]

const filtered = computed(() =>
  [...mockNews]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.publishedAt.localeCompare(a.publishedAt)
    })
    .filter(n => {
      const matchCategory = !filterCategory.value || n.category === filterCategory.value
      const matchSearch = !search.value || n.title.includes(search.value) || n.summary.includes(search.value)
      return matchCategory && matchSearch
    })
)
</script>
