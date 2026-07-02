<template>
  <main class="bg-base-200/60 min-h-screen lg:pb-16">
    <!-- 找不到 -->
    <div v-if="!item" class="min-h-[70vh] flex items-center justify-center px-4 pt-24">
      <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-5">
          <span class="material-symbols-outlined text-3xl text-base-content/40">find_in_page</span>
        </div>
        <h1 class="text-2xl font-bold">找不到此消息</h1>
        <p class="text-base-content/60 mt-2">消息可能已下架，或連結內容不存在。</p>
        <router-link to="/news" class="btn btn-primary mt-6">返回最新消息</router-link>
      </div>
    </div>

    <template v-else>
      <div class="container mx-auto px-4 pt-6 lg:pt-10">
        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <!-- 主文 -->
          <article class="min-w-0">
            <header class="mb-6">
              <p class="sport-eyebrow">NEWS</p>
              <h1 class="mt-3 font-heading font-black text-3xl md:text-4xl lg:text-5xl leading-tight text-base-content">
                {{ item.title }}
              </h1>
              <div class="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
                <span v-if="item.pinned" class="badge badge-primary gap-1 border-0">
                  <span class="material-symbols-outlined text-sm">push_pin</span>置頂
                </span>
                <span class="badge badge-secondary border-0">{{ item.category }}</span>
                <span class="inline-flex items-center gap-1 font-heading tracking-wide text-base-content/60">
                  <span class="material-symbols-outlined text-base">calendar_today</span>
                  {{ formatDate(item.publishedAt) }}
                </span>
              </div>
            </header>

            <div class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
              <figure v-if="item.imageUrl" class="aspect-video bg-base-300">
                <img :src="publicImageUrl(item.imageUrl)" :alt="item.title" class="w-full h-full object-cover" />
              </figure>

              <div class="p-6 md:p-10">
                <!-- 導言 -->
                <p class="mb-8 border-l-4 border-primary pl-4 text-lg md:text-xl font-medium leading-relaxed text-base-content/80">
                  {{ item.summary }}
                </p>

                <!-- 內文 -->
                <div class="prose max-w-none prose-base-content">
                  <p class="whitespace-pre-line leading-loose text-base md:text-lg">{{ item.content }}</p>
                </div>

                <!-- 分享 + 回列表 -->
                <div class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-base-200 pt-6">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-semibold text-base-content/50">分享</span>
                    <button type="button" class="btn btn-sm btn-outline" @click="shareTo('line')">LINE</button>
                    <button type="button" class="btn btn-sm btn-outline" @click="shareTo('facebook')">Facebook</button>
                    <button type="button" class="btn btn-sm btn-outline gap-1" @click="copyLink">
                      <span class="material-symbols-outlined text-base">{{ copied ? 'check' : 'link' }}</span>
                      {{ copied ? '已複製' : '複製連結' }}
                    </button>
                  </div>
                  <router-link to="/news" class="btn btn-sm btn-ghost">
                    <span class="material-symbols-outlined text-base">list</span>
                    回消息列表
                  </router-link>
                </div>
              </div>
            </div>

            <!-- 上一篇 / 下一篇 -->
            <nav class="mt-8 grid gap-4 sm:grid-cols-2">
              <router-link v-if="prevItem" :to="`/news/${prevItem.id}`"
                class="group flex items-center gap-3 rounded-box border border-base-200 bg-base-100 p-4 transition-colors hover:border-primary/40">
                <span class="material-symbols-outlined text-base-content/40 transition-colors group-hover:text-primary">arrow_back</span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold tracking-wide text-primary">上一篇</span>
                  <span class="mt-0.5 block font-bold leading-snug line-clamp-1 transition-colors group-hover:text-primary">{{ prevItem.title }}</span>
                </span>
              </router-link>
              <span v-else class="hidden sm:block"></span>
              <router-link v-if="nextItem" :to="`/news/${nextItem.id}`"
                class="group flex items-center justify-end gap-3 rounded-box border border-base-200 bg-base-100 p-4 text-right transition-colors hover:border-primary/40">
                <span class="min-w-0">
                  <span class="block text-xs font-semibold tracking-wide text-primary">下一篇</span>
                  <span class="mt-0.5 block font-bold leading-snug line-clamp-1 transition-colors group-hover:text-primary">{{ nextItem.title }}</span>
                </span>
                <span class="material-symbols-outlined text-base-content/40 transition-colors group-hover:text-primary">arrow_forward</span>
              </router-link>
            </nav>
          </article>

          <!-- 側欄:其他消息 -->
          <aside class="lg:sticky lg:top-24">
            <section class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
              <header class="border-b border-base-200 px-5 py-4">
                <p class="sport-eyebrow">MORE</p>
                <h2 class="mt-1 font-heading font-black text-lg text-secondary">其他消息</h2>
              </header>
              <ul class="divide-y divide-base-200">
                <li v-for="n in moreNews" :key="n.id">
                  <router-link :to="`/news/${n.id}`" class="group flex gap-3 p-4 transition-colors hover:bg-base-200/50">
                    <div v-if="n.imageUrl" class="shrink-0 w-16 h-16 overflow-hidden rounded-md bg-base-200">
                      <img :src="publicImageUrl(n.imageUrl)" :alt="n.title"
                        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-heading text-xs tracking-wide text-base-content/50">{{ formatDate(n.publishedAt) }} · {{ n.category }}</p>
                      <p class="mt-0.5 text-sm font-bold leading-snug line-clamp-2 transition-colors group-hover:text-primary">{{ n.title }}</p>
                    </div>
                  </router-link>
                </li>
              </ul>
              <router-link to="/news"
                class="flex items-center justify-center gap-1 border-t border-base-200 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-base-200/50">
                查看全部消息
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </router-link>
            </section>
          </aside>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import mockNews from '@/mocks/news.json'
import { publicImageUrl } from '@/utils/assets'

const route = useRoute()
const id = computed(() => Number(route.params.id))

// 置頂優先、再依日期新到舊(與列表頁一致)
const sorted = [...mockNews].sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
  return b.publishedAt.localeCompare(a.publishedAt)
})

const item = computed(() => mockNews.find(news => news.id === id.value) ?? null)
const currentIndex = computed(() => sorted.findIndex(n => n.id === id.value))
const prevItem = computed(() => (currentIndex.value > 0 ? sorted[currentIndex.value - 1] : null) ?? null)
const nextItem = computed(() =>
  (currentIndex.value >= 0 && currentIndex.value < sorted.length - 1 ? sorted[currentIndex.value + 1] : null) ?? null,
)
const moreNews = computed(() => sorted.filter(n => n.id !== id.value).slice(0, 4))

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}

// 分享
function shareTo(network: 'line' | 'facebook') {
  const url = encodeURIComponent(window.location.href)
  const link =
    network === 'line'
      ? `https://social-plugins.line.me/lineit/share?url=${url}`
      : `https://www.facebook.com/sharer/sharer.php?u=${url}`
  window.open(link, '_blank', 'noopener,width=600,height=600')
}

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard 不可用時忽略 */
  }
}
</script>
