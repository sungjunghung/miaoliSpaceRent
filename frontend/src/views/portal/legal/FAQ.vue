<script setup lang="ts">
import { computed, ref } from 'vue'
import { faqCategories as faqData } from '@/services/faqService'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  items: FaqItem[]
}

interface DisplayFaqItem extends FaqItem {
  index: number
}

interface DisplayFaqSection {
  title: string
  index: number
  items: DisplayFaqItem[]
}

const sections = faqData as FaqSection[]
const search = ref('')
const activeSection = ref(0)
const openIndex = ref<string | null>('0-0')

const filteredSections = computed<DisplayFaqSection[]>(() => {
  const keyword = search.value.trim().toLowerCase()

  return sections
    .map((section, sectionIndex) => {
      const sectionMatched = section.title.toLowerCase().includes(keyword)
      const items = section.items
        .map((item, itemIndex) => ({ ...item, index: itemIndex }))
        .filter(item => {
          if (!keyword || sectionMatched) return true
          return [item.question, item.answer].some(value => value.toLowerCase().includes(keyword))
        })

      return {
        title: section.title,
        index: sectionIndex,
        items,
      }
    })
    .filter(section => section.items.length > 0)
})

function toggleItem(sectionIndex: number, itemIndex: number) {
  const key = `${sectionIndex}-${itemIndex}`
  openIndex.value = openIndex.value === key ? null : key
}

function selectSection(index: number) {
  activeSection.value = index
  openIndex.value = `${index}-0`
  document.getElementById(`faq-section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearSearch() {
  search.value = ''
}

function iconForSection(title: string) {
  if (title.includes('租借')) return 'event_available'
  if (title.includes('費用')) return 'payments'
  if (title.includes('場地')) return 'stadium'
  if (title.includes('帳號') || title.includes('會員')) return 'account_circle'
  return 'help'
}
</script>

<template>
  <header class="hidden lg:block">
    <div class="container mx-auto px-4 lg:px-0 pt-12 lg:pt-16">
      <p class="sport-eyebrow">FAQ</p>
      <h1 class="mt-3 font-heading font-black text-5xl xl:text-6xl leading-none text-secondary">常見問題</h1>
      <p class="mt-3 text-base-content/60">租借流程、費用付款、場地使用與會員帳號的常見疑問。</p>
    </div>
  </header>
  
  <main class="basis-ccontainer">
    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <!-- 側欄:問題分類(與消息列表同款) -->
      <aside class="hidden lg:block lg:sticky lg:top-28">
        <p class="sport-eyebrow mb-4 hidden lg:flex">CATEGORIES</p>
        <nav class="space-y-1">
          <button v-for="section in sections" :key="section.title" type="button"
            class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 text-left text-sm transition-colors"
            :class="activeSection === sections.indexOf(section) && !search
              ? 'bg-primary text-primary-content font-semibold'
              : 'text-base-content/70 hover:bg-base-200'"
            @click="selectSection(sections.indexOf(section))">
            <span class="material-symbols-outlined text-xl">{{ iconForSection(section.title) }}</span>
            <span class="flex-1">{{ section.title }}</span>
            <span class="text-xs opacity-70">{{ section.items.length }}</span>
          </button>
        </nav>
      </aside>

      <!-- 內容 -->
      <section class="space-y-6">
        <!-- 搜尋 -->
        <label class="input input-lg w-full bg-base-100 md:max-w-lg">
          <span class="material-symbols-outlined text-base-content/40">search</span>
          <input v-model="search" type="search" placeholder="搜尋問題、付款、取消、保證金" />
        </label>

        <template v-if="filteredSections.length">
          <div v-for="section in filteredSections" :id="`faq-section-${section.index}`" :key="section.title"
            class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden scroll-mt-28">
            <header class="flex items-center gap-4 border-b border-base-200 px-5 py-5 md:px-6">
              <span class="font-heading italic font-bold leading-none text-3xl md:text-4xl text-primary">{{ String(section.index + 1).padStart(2, '0') }}</span>
              <div class="min-w-0">
                <h3 class="font-heading font-black leading-tight text-lg md:text-xl text-secondary">{{ section.title }}</h3>
                <p class="text-sm text-base-content/50">{{ section.items.length }} 個問題</p>
              </div>
            </header>

            <div class="divide-y divide-base-200">
              <article v-for="item in section.items" :key="`${section.index}-${item.index}`">
                <button type="button"
                  class="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-base-200/40 md:px-6"
                  @click="toggleItem(section.index, item.index)">
                  <span class="font-bold leading-snug transition-colors"
                    :class="openIndex === `${section.index}-${item.index}` ? 'text-primary' : ''">{{ item.question }}</span>
                  <span class="material-symbols-outlined shrink-0 mt-0.5 transition-transform"
                    :class="openIndex === `${section.index}-${item.index}` ? 'rotate-180 text-primary' : 'text-base-content/40'">expand_more</span>
                </button>
                <div v-if="openIndex === `${section.index}-${item.index}`" class="px-5 pb-5 md:px-6">
                  <p class="border-l-2 border-primary/40 pl-4 leading-relaxed text-base-content/70">{{ item.answer }}</p>
                </div>
              </article>
            </div>
          </div>
        </template>

        <div v-else class="bg-base-100 border border-base-200 rounded-box shadow-sm p-10 text-center">
          <span class="material-symbols-outlined text-5xl text-base-content/25">manage_search</span>
          <p class="font-semibold mt-3">沒有符合條件的問題</p>
          <button class="btn btn-primary btn-sm mt-4" @click="clearSearch">查看全部問題</button>
        </div>
      </section>
    </div>
  </main>
</template>
