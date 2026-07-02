<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { venues as allVenues } from '@/services/venueService'
import { publicImageUrl } from '@/utils/assets'

const router = useRouter()
const route = useRoute()

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function formatYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function eachDate(start: string, end: string) {
  const out: string[] = []
  const s = new Date(start)
  const e = new Date(end)
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(formatYmd(d))
  }
  return out
}
function isVenueOpenOnDate(venue: any, dateStr: string) {
  const weekday = new Date(dateStr).getDay()
  if ((venue.closedWeekdays ?? []).includes(weekday)) return false
  if ((venue.closedDates ?? []).includes(dateStr)) return false
  return true
}
function timeInOpeningHours(venue: any, dateStr: string, time: string) {
  const weekdayKey = WEEKDAY_KEYS[new Date(dateStr).getDay()]
  const hours = venue.openingHours?.[weekdayKey]
  if (!hours) return false
  const [start, end] = String(hours).split(/\s*-\s*/)
  return start <= time && time < end
}

const searchCriteria = computed(() => {
  const q = route.query
  return {
    mode: typeof q.mode === 'string' ? q.mode : null,
    date: typeof q.date === 'string' ? q.date : null,
    time: typeof q.time === 'string' ? q.time : null,
    startDate: typeof q.startDate === 'string' ? q.startDate : null,
    endDate: typeof q.endDate === 'string' ? q.endDate : null,
  }
})

// 帶往預約頁的搜尋日期:讓預約頁日曆跳到使用者搜尋的那天(無搜尋則為空,不附加 query)
const bookingQuery = computed<Record<string, string>>(() => {
  const c = searchCriteria.value
  if (c.mode === 'daily' && c.startDate) {
    return { startDate: c.startDate, ...(c.endDate ? { endDate: c.endDate } : {}) }
  }
  if (c.mode === 'hourly' && c.date) {
    return { date: c.date, ...(c.time ? { time: c.time } : {}) }
  }
  return {}
})

const filteredVenues = computed(() => {
  const base = allVenues.filter(v => v.status === 'available')
  const c = searchCriteria.value

  if (c.mode === 'hourly' && c.date) {
    return base.filter(v => {
      if (!v.rentalModes?.hourly?.enabled) return false
      if (!isVenueOpenOnDate(v, c.date!)) return false
      if (c.time && !timeInOpeningHours(v, c.date!, c.time)) return false
      return true
    })
  }

  if (c.mode === 'daily' && c.startDate) {
    const end = c.endDate || c.startDate
    const dates = eachDate(c.startDate, end)
    return base.filter(v => {
      if (!v.rentalModes?.daily?.enabled) return false
      return dates.every(d => isVenueOpenOnDate(v, d))
    })
  }

  return base
})

const searchSummary = computed(() => {
  const c = searchCriteria.value
  if (c.mode === 'hourly' && c.date) {
    const d = new Date(c.date)
    const text = `${d.getMonth() + 1}月${d.getDate()}日`
    return c.time ? `${text} ${c.time} · 小時租借` : `${text} · 小時租借`
  }
  if (c.mode === 'daily' && c.startDate) {
    const s = new Date(c.startDate)
    const startText = `${s.getMonth() + 1}月${s.getDate()}日`
    if (c.endDate && c.endDate !== c.startDate) {
      const e = new Date(c.endDate)
      return `${startText} - ${e.getMonth() + 1}月${e.getDate()}日 · 多日租借`
    }
    return `${startText} · 多日租借`
  }
  return null
})

function clearSearch() {
  router.push({ name: 'venue-list' })
}
</script>

<template>
  <header class="hidden lg:block">
    <div class="container mx-auto px-4 lg:px-0 pt-12 lg:pt-16">
      <p class="sport-eyebrow">VENUES</p>
      <h1 class="mt-3 font-heading font-black text-5xl xl:text-6xl leading-none text-secondary">場館資訊</h1>
      <p class="mt-3 text-base-content/60">瀏覽所有可租借的體育場館,挑選最適合的活動空間。</p>
    </div>
  </header>

  <div class="basis-ccontainer">

      <section v-if="searchSummary" class="mb-8 flex items-center justify-between gap-4 flex-wrap border-l-4 border-primary p-4 bg-base-100">
        <div>
          <p class="text-xs text-base-content/50 tracking-widest font-semibold">搜尋條件</p>
          <p class="text-base md:text-lg font-bold mt-1">{{ searchSummary }}</p>
          <p class="text-sm text-base-content/60 mt-1">符合 {{ filteredVenues.length }} 個場地</p>
        </div>
        <button @click="clearSearch" class="btn btn-ghost btn-sm gap-1">
          <span class="material-symbols-outlined text-base">close</span>
          清除搜尋
        </button>
      </section>

      <section v-if="filteredVenues.length === 0" class="border border-base-200 rounded-box p-10 text-center">
        <span class="material-symbols-outlined text-6xl text-base-content/25">event_busy</span>
        <h3 class="text-xl font-bold mt-4">{{ searchSummary ? '找不到符合條件的場地' : '目前沒有可租借場地' }}</h3>
        <p class="text-base-content/60 mt-2">{{ searchSummary ? '試試其他日期或租借方式。' : '請稍後再回來查看。' }}</p>
      </section>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
        <article
          v-for="venue in filteredVenues"
          :key="venue.id"
          class="m-post group relative"
        >
          <!-- 整張卡的點擊區(蓋滿,任何位置都可點) -->
          <router-link
            :to="{ name: 'venue-detail', params: { id: venue.id } }"
            class="m-post__link absolute inset-0 z-20"
            :aria-label="venue.name"
          ></router-link>

          <!-- 圖片 -->
          <div class="eyecatch relative aspect-4/3 overflow-hidden rounded-md bg-base-300">
            <img
              :src="publicImageUrl(venue.mainImageUrl)"
              :alt="venue.name"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div class="post-link absolute inset-0 transition-[backdrop-filter] duration-300 group-hover:backdrop-blur-[3px]"></div>
          </div>

          <!-- 標籤(桌機:右下凹陷白卡;手機:圖片下方一般排版) -->
          <div
            class="info mt-3 md:mt-0 md:absolute md:right-0 md:bottom-0 md:max-w-[calc(100%-4rem)] md:bg-base-200 md:rounded-tl-[10px] md:pl-8 md:pr-6 md:pt-4 md:pb-4 md:transition-[padding] md:duration-300 md:ease-out md:group-hover:pl-10 md:group-hover:pr-10 md:group-hover:pt-8 md:group-hover:pb-10"
          >
            <div class="meta flex items-baseline gap-3 flex-wrap">
              <span class="tag inline-flex items-center border border-base-content/25 px-2 py-0.5 text-xs leading-none">
                {{ venue.type }}
              </span>
            </div>
            <h2 class="title text-xl md:text-2xl font-bold leading-snug mt-2 text-base-content">
              {{ venue.name }}
            </h2>

            <!-- 操作按鈕:行動版直接顯示;桌機版預設收起,hover 才展開(收起時不可點,讓整卡連結生效) -->
            <div
              class="actions relative z-30 flex gap-2 mt-3
                     md:mt-0 md:max-h-0 md:opacity-0 md:overflow-hidden md:pointer-events-none
                     md:transition-all md:duration-300 md:ease-out
                     md:group-hover:mt-3 md:group-hover:max-h-12 md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
            >
              <router-link
                :to="{ name: 'venue-booking', params: { id: venue.id }, query: bookingQuery }"
                class="btn btn-primary flex-1"
              >立即租借</router-link>
              <router-link
                :to="{ name: 'venue-detail', params: { id: venue.id } }"
                class="btn btn-outline flex-1"
              >場館詳情</router-link>
            </div>
          </div>
        </article>
      </div>
    </div>

</template>

<style scoped>
/* misakigumi 的右下角凹陷 SVG 偽元素(只在桌機顯示) */
@media (min-width: 768px) {
  .m-post .info::before,
  .m-post .info::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    background-image: url("data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjEwIiB2aWV3Qm94PSIwIDAgMTAgMTAiIHdpZHRoPSIxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTAgMTBoLTEwYzUuNTIyODUgMCAxMC00LjQ3NzE1IDEwLTEweiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  .m-post .info::before {
    right: 0;
    top: -10px;
  }
  .m-post .info::after {
    left: -10px;
    bottom: 0;
  }
}
</style>
