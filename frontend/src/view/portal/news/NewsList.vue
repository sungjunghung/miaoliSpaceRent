<template>
  <header class="hidden lg:block">
    <div class="container mx-auto px-4 lg:px-0 pt-12 lg:pt-16">
      <p class="sport-eyebrow">NEWS</p>
      <h1 class="mt-3 font-heading font-black text-5xl xl:text-6xl leading-none text-secondary">最新消息</h1>
      <p class="mt-3 text-base-content/60">場館公告、活動資訊與維護通知,即時掌握不漏接。</p>
    </div>
  </header>

  <main class="basis-ccontainer-flush ">

      <div class="grid lg:gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">

        <!-- 左側目錄篩選 -->
        <aside class="lg:sticky lg:top-28 lg:self-start">
          <p class="sport-eyebrow mb-4 hidden lg:flex">CATEGORIES</p>

          <!-- 手機:下拉選單 -->
          <div class="lg:hidden px-4 mb-4">
            <select v-model="selectedCategory" class="select w-full">
              <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                {{ cat.label }}（{{ cat.count }}）
              </option>
            </select>
          </div>

          <!-- 桌機:垂直清單(與 FAQ 同款) -->
          <nav class="hidden lg:block space-y-1">
            <button v-for="cat in categoryOptions" :key="cat.value" type="button"
              class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 text-left text-sm transition-colors"
              :class="selectedCategory === cat.value
                ? 'bg-primary text-primary-content font-semibold'
                : 'text-base-content/70 hover:bg-base-200'"
              @click="selectedCategory = cat.value">
              <span class="material-symbols-outlined text-xl">{{ iconForCategory(cat.value) }}</span>
              <span class="flex-1">{{ cat.label }}</span>
              <span class="text-xs opacity-70">{{ cat.count }}</span>
            </button>
          </nav>
        </aside>

        <!-- 右側消息列表:一則一個獨立橫幅 -->
        <section class="lg:space-y-4">
          <!-- 消息列表:與首頁一致的運動排行榜式索引清單 -->
          <ol class="border-t-2 border-base-content/10">
            <li v-for="(item, i) in filteredNews" :key="item.id">
              <router-link :to="`/news/${item.id}`"
                class="group flex items-center gap-4 sm:gap-6 border-b border-base-300 px-1 sm:px-2 py-5 sm:py-6 transition-colors hover:bg-base-100">
                <span
                  class="font-heading italic font-bold leading-none text-3xl sm:text-5xl w-9 sm:w-16 shrink-0 text-center text-base-300 transition-colors group-hover:text-primary">
                  {{ String(i + 1).padStart(2, '0') }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span v-if="item.pinned" class="badge badge-primary badge-sm border-0">置頂</span>
                    <span class="font-heading uppercase tracking-wider text-xs font-semibold text-secondary">{{ item.category }}</span>
                    <span class="text-base-content/25">/</span>
                    <span class="font-heading text-xs tracking-wide text-base-content/50">{{ formatDate(item.publishedAt) }}</span>
                  </div>
                  <h3
                    class="text-lg sm:text-2xl font-heading font-black leading-snug text-base-content transition-colors group-hover:text-primary line-clamp-1">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm text-base-content/60 line-clamp-1 hidden sm:block">{{ item.summary }}</p>
                </div>
                <div v-if="item.imageUrl"
                  class="shrink-0 w-20 h-14 sm:w-28 sm:h-20 overflow-hidden rounded-md bg-base-200">
                  <img :src="publicImageUrl(item.imageUrl)" :alt="item.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <span
                  class="material-symbols-outlined shrink-0 text-base-content/30 transition-all group-hover:text-primary group-hover:translate-x-1">arrow_forward</span>
              </router-link>
            </li>
          </ol>

          <div v-if="filteredNews.length === 0" class="border-t-2 border-base-content/10 p-10 text-center">
            <span class="material-symbols-outlined text-5xl text-base-content/25">campaign</span>
            <p class="font-semibold mt-3">此分類目前沒有消息</p>
          </div>
        </section>
      </div>

  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import mockNews from '../../../mocks/news.json'
import { publicImageUrl } from '@/utils/assets'

const selectedCategory = ref<string>('all')

const sortedNews = computed(() =>
  [...mockNews].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })
)

const categoryOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const n of sortedNews.value) {
    counts.set(n.category, (counts.get(n.category) ?? 0) + 1)
  }
  const all = { value: 'all', label: '全部', count: sortedNews.value.length }
  const cats = [...counts.entries()].map(([value, count]) => ({ value, label: value, count }))
  return [all, ...cats]
})

const filteredNews = computed(() => {
  if (selectedCategory.value === 'all') return sortedNews.value
  return sortedNews.value.filter(n => n.category === selectedCategory.value)
})

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}

function iconForCategory(value: string) {
  if (value === 'all') return 'inbox'
  if (value.includes('公告')) return 'campaign'
  if (value.includes('活動')) return 'celebration'
  if (value.includes('新聞')) return 'newspaper'
  return 'label'
}
</script>
