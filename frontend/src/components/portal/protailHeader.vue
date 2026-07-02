<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import QuickSearch from "./quickSearch.vue";

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 選單單一來源:桌機橫向選單、手機 dropdown、底部 dock 共用
const navLinks = [
  { to: '/', label: '首頁', icon: 'home' },
  { to: '/venues', label: '場館資訊', icon: 'stadium' },
  { to: '/news', label: '最新消息', icon: 'newspaper' },
  { to: '/faq', label: '常見問題', icon: 'help' },
]
const memberLinks = [
  { to: '/member/profile', label: '我的帳戶' },
  { to: '/member/bookings', label: '我的預訂' },
  { to: '/member/refunds', label: '我的退款' },
]
// dock 高亮目前所在頁(首頁需精準比對,其餘比對前綴以涵蓋子頁面)
const isNavActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

// 手機頂部 navbar 顯示的頁面標題:以路由 name 對應
const PAGE_TITLES: Record<string, string> = {
  'portal-index': '首頁',
  'venue-list': '場館資訊',
  'venue-detail': '場館資訊',
  'venue-booking': '預訂場地',
  'venue-confirm': '確認預訂',
  'news-list': '最新消息',
  'news-detail': '最新消息',
  'faq': '常見問題',
  'terms-of-service': '服務條款',
  'privacy-policy': '隱私權政策',
  'member-index': '會員中心',
  'my-profile': '我的帳戶',
  'my-bookings': '我的預訂',
  'my-refunds': '我的退款',
  'booking-detail': '預訂詳情',
  'portal-login': '登入',
  'register': '註冊',
}
const pageTitle = computed(() => PAGE_TITLES[String(route.name ?? '')] ?? '')

const showQuickSearch = ref(false)
const isScrolled = ref(false)
// 租借方式:由 navbar 的 tabs 控制,下傳給 QuickSearch
const searchMode = ref<'daily' | 'multi'>('daily')
const isHomePage = computed(() => route.path === '/')
// 首頁搜尋改由 hero 主導,頁首不再自動釘選展開(避免雙搜尋框);使用者仍可點搜尋鈕手動展開
const shouldPinQuickSearch = computed(() => false)
const isQuickSearchVisible = computed(() => shouldPinQuickSearch.value || showQuickSearch.value)

// 搜尋以覆蓋層展開時(= 有深色 backdrop;已排除首頁桌機 pinned)鎖住背景捲動
const isSearchOverlay = computed(() => showQuickSearch.value && !shouldPinQuickSearch.value)
function setScrollLock(locked: boolean) {
  const lenis = (window as any).__lenis as { stop: () => void; start: () => void } | undefined
  document.body.style.overflow = locked ? 'hidden' : ''
  if (locked) lenis?.stop()
  else lenis?.start()
}
watch(isSearchOverlay, setScrollLock)

function toggleQuickSearch() {
  if (shouldPinQuickSearch.value) return
  showQuickSearch.value = !showQuickSearch.value
}

function closeQuickSearch() {
  if (shouldPinQuickSearch.value) return
  showQuickSearch.value = false
}

// 搜尋後一定會前往結果頁,無論是否 pinned 都要重置展開狀態,
// 否則離開首頁後 showQuickSearch 殘留會讓搜尋框繼續展開
function onSearched() {
  showQuickSearch.value = false
}

const handleScroll = () => {
  isScrolled.value = window.scrollY >= 120
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  setScrollLock(false) // 離開頁面時務必解除鎖定,避免殘留
})

const searchConditionsText = computed(() => {
  const q = route.query;
  if (!q.mode) return '搜尋可用的場地';

  const formatDateShort = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(String(dateStr));
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (q.mode === 'hourly' && q.date) {
    let text = formatDateShort(q.date);
    if (q.time) text += ` ${q.time}`;
    return text;
  }

  if (q.mode === 'daily' && q.startDate) {
    const start = formatDateShort(q.startDate);
    if (q.endDate && q.startDate !== q.endDate) {
      const end = formatDateShort(q.endDate);
      return `${start} - ${end}`;
    }
    return start;
  }

  return '搜尋';
});

// 收合搜尋列要顯示的方式:hourly=時段租借(daily.svg)、daily=多日租借(multi.svg)
const searchMethod = computed<'hourly' | 'daily' | null>(() => {
  const m = route.query.mode;
  return m === 'hourly' || m === 'daily' ? m : null;
});

function logout() {
  authStore.logout()
  router.push('/login')
}

const SEARCH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
function onSearchBeforeEnter(el: Element) {
  const node = el as HTMLElement
  node.style.transition = 'none'
  node.style.height = '0'
  node.style.opacity = '0'
  node.style.overflow = 'hidden'
}
function onSearchEnter(el: Element, done: () => void) {
  const node = el as HTMLElement
  // 讀 scrollHeight 會強制 reflow,等同於 commit beforeEnter 的起點
  const target = node.scrollHeight
  node.style.transition = `height 460ms ${SEARCH_EASE}, opacity 320ms ease-out`
  node.style.height = `${target}px`
  node.style.opacity = '1'
  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'height') return
    node.removeEventListener('transitionend', onEnd)
    node.style.transition = ''
    node.style.height = ''
    node.style.opacity = ''
    node.style.overflow = ''
    done()
  }
  node.addEventListener('transitionend', onEnd)
}
function onSearchLeave(el: Element, done: () => void) {
  const node = el as HTMLElement
  // 用固定 height 鎖住當前高度(不是 max-height!),內部子元素之後如何縮放都不影響外殼
  node.style.transition = 'none'
  node.style.height = `${node.scrollHeight}px`
  node.style.opacity = '1'
  node.style.overflow = 'hidden'
  // 強制 reflow:把上面的起點寫入計算樣式
  void node.offsetHeight
  // 套上 transition + 終點
  node.style.transition = `height 320ms ${SEARCH_EASE}, opacity 220ms ease-in`
  node.style.height = '0'
  node.style.opacity = '0'
  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'height') return
    node.removeEventListener('transitionend', onEnd)
    done()
  }
  node.addEventListener('transitionend', onEnd)
}
</script>
<template>

  <div class="w-full rounded-none sticky top-0 transition-all duration-300 z-50 bg-base-100 border-b border-base-200" :class="{
    'backdrop-blur-md shadow-lg bg-base-100/80 border-transparent': isScrolled && !isQuickSearchVisible,
    'shadow-xl border-transparent': isQuickSearchVisible,
    'hidden lg:block': isHomePage,
  }">
    <!-- <div class="navbar bg-base-100 shadow-sm lg:hidden">
    <div class="navbar-start">
      <button v-if="!isHomePage" class="btn btn-ghost btn-square" @click="$router.back()">
        <span class="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
    </div>
    <div class="navbar-center">
      <h1 class="font-bold">{{ pageTitle }}</h1>
    </div>
    <div class="navbar-end">
      <button class="btn btn-ghost btn-square lg:hidden" @click="toggleQuickSearch" >
          <span class="material-symbols-outlined text-2xl">search</span>
      </button>
    </div>
  </div> -->
    <div class="navbar gap-1">
      <div class="navbar-start w-fit lg:w-auto lg:flex-1">
        <button v-if="!isHomePage && !isQuickSearchVisible" class="btn btn-ghost btn-square lg:hidden" @click="$router.back()">
          <span class="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <button
          class="hidden lg:flex items-center gap-3 rounded-box px-2 py-1.5 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary cursor-pointer"
          @click="$router.push('/')" aria-label="回首頁">
          <img src="../../assets/images/logo.svg" alt="苗栗縣體育場館預約系統" class="w-10 h-10 shrink-0">
          <span class="flex flex-col items-start leading-none">
            <span class="text-[0.65rem] font-medium tracking-[0.18em] text-secondary/60">MIAOLI SPORTS VENUE</span>
            <span class="mt-1 text-lg font-bold text-secondary whitespace-nowrap">苗栗縣體育場館預約系統</span>
          </span>
        </button>
      </div>
      <div class="navbar-center flex-1 lg:flex-none">
        <template v-if="isHomePage  && !isQuickSearchVisible"> 
        
        <button class="btn btn-ghost text-xl normal-case text-primary lg:hidden w-full" @click="$router.push('/')">
          <img src="../../assets/images/logo.svg" alt="" class="w-10">
          <span class="font-semibold mb-1">苗栗縣體育場館預約系統</span>
        </button>
        </template>
        <template v-else>
          <div class="lg:hidden w-full text-center py-2 font-semibold" v-if="!isQuickSearchVisible">
            {{ pageTitle }}
          </div>
        </template>
        <button v-if="!isQuickSearchVisible && (!isHomePage || isScrolled)" type="button" @click="toggleQuickSearch"
          class="hidden lg:flex group items-center gap-3 rounded-full border border-base-300 bg-base-100 pl-5 pr-2 py-2 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-200 cursor-pointer select-none">
          <img v-if="searchMethod === 'hourly'" src="../../assets/images/daily.svg" alt="" class="w-5 shrink-0">
          <img v-else-if="searchMethod === 'daily'" src="../../assets/images/multi.svg" alt="" class="w-5 shrink-0">
          <span class="text-sm font-medium text-base-content/80 whitespace-nowrap">{{ searchConditionsText }}</span>
          <span
            class="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-content shrink-0 transition-transform duration-200 group-hover:scale-105">
            <span class="material-symbols-outlined text-xl">search</span>
          </span>
        </button>
        <div v-if="isQuickSearchVisible" role="tablist" class="relative flex w-full rounded-full bg-base-200 p-1">
          <!-- 滑動指示器:在兩個 tab 之間平滑左右移動 -->
          <span
            class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-secondary shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            :class="searchMode === 'multi' ? 'translate-x-full' : 'translate-x-0'"></span>
          <button type="button" role="tab"
            class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 lg:px-8 transition-colors duration-300"
            :class="searchMode === 'daily' ? 'text-secondary-content' : 'text-base-content/60'"
            :aria-selected="searchMode === 'daily'" @click="searchMode = 'daily'">
            <img src="../../assets/images/daily.svg" alt="" class="w-5 lg:w-8 mr-2">
            時段租借
          </button>
          <button type="button" role="tab"
            class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 lg:px-8 transition-colors duration-300"
            :class="searchMode === 'multi' ? 'text-secondary-content' : 'text-base-content/60'"
            :aria-selected="searchMode === 'multi'" @click="searchMode = 'multi'">
            <img src="../../assets/images/multi.svg" alt="" class="w-5 lg:w-8 mr-2">
            多日租借
          </button>
        </div>
      </div>
      <div class="navbar-end md:flex w-fit lg:flex-1 gap-1">

        <button class="btn btn-ghost btn-square lg:hidden" v-if="!isQuickSearchVisible && !isHomePage" @click="toggleQuickSearch">
          <span class="material-symbols-outlined text-2xl">search</span>
        </button>
        <nav class="hidden lg:flex items-center gap-0.5 xl:gap-1 xl:mr-2">
          <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
            class="px-3 xl:px-3.5 py-2 rounded-full text-sm xl:text-[0.95rem] font-medium transition-colors duration-200 whitespace-nowrap"
            :class="isNavActive(link.to)
              ? 'text-primary bg-primary/10'
              : 'text-secondary/80 hover:text-secondary hover:bg-base-200'">
            {{ link.label }}
          </router-link>
        </nav>
        <template v-if="!authStore.isLoggedIn">
          <router-link to="/login" class="btn btn-primary hidden lg:flex ml-1">登入</router-link>
        </template>
        <template v-else>
          <div class="dropdown dropdown-end hidden lg:block">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-10 rounded-full flex items-center justify-center bg-secondary text-primary-content">
                <span class="material-symbols-outlined text-2xl">person</span>
              </div>
            </div>
            <ul tabindex="-1" class="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
              <li v-for="link in memberLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link>
              </li>
              <li><a @click="logout">登出</a></li>
            </ul>
          </div>

        </template>
        <div class="dropdown dropdown-end hidden md:flex lg:hidden">
          <div tabindex="0" role="button" class="btn btn-lg btn-ghost">
            <span class="material-symbols-outlined text-base">menu</span>
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li v-for="link in navLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link></li>
            <template v-if="authStore.isLoggedIn">
              <li v-for="link in memberLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link>
              </li>
              <li><a @click="logout">登出</a></li>
            </template>
            <template v-else>
              <li><router-link to="/login">登入</router-link></li>
            </template>
          </ul>
        </div>
      </div>
    </div>
    <!-- 展開的搜尋框 -->
    <Transition :css="false" @before-enter="onSearchBeforeEnter" @enter="onSearchEnter" @leave="onSearchLeave">
      <div v-if="isQuickSearchVisible">
        <div class="lg:max-w-1/2 xl:max-w-2/5 mx-auto p-4">
          <QuickSearch v-model:mode="searchMode" @search="onSearched" />
        </div>
      </div>
    </Transition>
  </div>
  <div v-if="showQuickSearch && !shouldPinQuickSearch" class="fixed inset-0 z-40 w-full h-full bg-black/50"
    @click="closeQuickSearch"></div>
  <div class="dock dock-xl bg-neutral text-neutral-content z-50 md:hidden">
    <router-link v-for="link in navLinks" :key="link.to" :to="link.to" :class="{ 'dock-active': isNavActive(link.to) }">
      <span class="material-symbols-outlined text-[1.5rem]">{{ link.icon }}</span>
      <span class="dock-label">{{ link.label }}</span>
    </router-link>
    <router-link v-if="!authStore.isLoggedIn" to="/login" :class="{ 'dock-active': isNavActive('/login') }">
      <span class="material-symbols-outlined text-[1.5rem]">login</span>
      <span class="dock-label">登入</span>
    </router-link>
    <router-link v-else to="/member" :class="{ 'dock-active': route.path.startsWith('/member') }">
      <span class="material-symbols-outlined text-[1.5rem]">account_circle</span>
      <span class="dock-label">會員</span>
    </router-link>
  </div>
</template>
