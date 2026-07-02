<template>
	<!-- Hero Section -->
	<div class="relative min-h-[calc(100dvh-5rem-env(safe-area-inset-bottom))] lg:min-h-[calc(100dvh-5rem)] flex items-start justify-center pt-[14vh] lg:pt-[24vh] pb-12 ">
		<!-- Background Image with Overlay -->
		<div class="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
			<div class="absolute -inset-y-[35%] inset-x-0 will-change-transform" :style="heroParallaxStyle">
				<div v-for="(img, index) in shuffledImages" :key="img"
					class="hero-img absolute inset-0 w-full h-full bg-cover bg-center"
					:class="{
						'hero-img--active': index === currentImageIndex,
						'hero-img--prev': index === previousImageIndex,
					}" :style="{ backgroundImage: `url('${img}')` }"></div>
			</div>
			<div
				class="absolute inset-0 bg-linear-to-r from-slate-900/70 via-slate-900/50 to-slate-900/20 z-10 pointer-events-none">
			</div>
			<div
				class="absolute inset-0 bg-linear-to-t from-base-30 via-transparent to-transparent opacity-90 z-10 pointer-events-none">
			</div>
		</div>

		<!-- 手機版 hero 頂部 logo(桌機由頁首負責,故僅手機顯示) -->
		<div class="lg:hidden absolute top-0 inset-x-0 z-20 flex items-center gap-2 px-4 py-3">
			<img src="@/assets/images/logo.svg" alt="苗栗縣體育場館預約系統" class="w-9 h-9 shrink-0">
			<span class="font-semibold text-white text-sm drop-shadow">苗栗縣體育場館預約系統</span>
		</div>
		<!-- Hero Content -->
		<div class="container mx-auto px-4 z-10 relative w-full">
			<div class="grid items-center gap-10 lg:grid-cols-[1fr_32rem] lg:gap-24 lg:max-w-5xl lg:mx-auto">
				<!-- 左:價值主張 + 數據 -->
				<div class="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 space-y-6">
					<p class="sport-eyebrow justify-center lg:justify-start animate-fade-in-up [animation-delay:100ms]">MIAOLI SPORTS VENUE</p>
					<h1
						class="sport-title text-white whitespace-nowrap text-4xl sm:text-5xl lg:text-6xl animate-fade-in-up [animation-delay:200ms]">
						苗栗 <span class="text-primary">最佳活動空間</span>
					</h1>
					<p
						class="text-lg lg:text-xl text-slate-200 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance animate-fade-in-up [animation-delay:400ms]">
						國際賽事、商務會議、親子活動,多元專業場地一站式租借。
					</p>
					<!-- 數據:整併進 hero,不再獨立成帶 -->
					<dl class="flex items-stretch justify-center lg:justify-start divide-x divide-white/20 pt-1 animate-fade-in-up [animation-delay:600ms]">
						<div v-for="s in heroStats" :key="s.label" class="px-5 first:pl-0 last:pr-0">
							<dd class="flex items-baseline gap-1 justify-center lg:justify-start">
								<span class="font-heading italic font-bold leading-none text-3xl lg:text-4xl text-white">{{ s.value }}</span>
								<span class="font-heading text-base lg:text-lg font-semibold text-primary">{{ s.unit }}</span>
							</dd>
							<dt class="mt-1 text-xs lg:text-sm text-slate-300">{{ s.label }}</dt>
						</div>
					</dl>
				</div>
				<!-- 右:搜尋面板 -->
				<div class="rounded-box bg-base-100/80 backdrop-blur-xl backdrop-saturate-150 border border-white/30 p-4 lg:p-6 shadow-2xl text-left space-y-3 w-full max-w-md lg:max-w-none mx-auto lg:mx-0 animate-fade-in-up [animation-delay:300ms]">
					<div role="tablist" class="relative flex w-full rounded-full bg-base-200 p-1">
						<span
							class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-secondary shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
							:class="searchMode === 'multi' ? 'translate-x-full' : 'translate-x-0'"></span>
						<button type="button" role="tab"
							class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 transition-colors duration-300"
							:class="searchMode === 'daily' ? 'text-secondary-content' : 'text-base-content/60'"
							:aria-selected="searchMode === 'daily'" @click="searchMode = 'daily'">
							<img src="@/assets/images/daily.svg" alt="" class="w-5 mr-2">
							時段租借
						</button>
						<button type="button" role="tab"
							class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 transition-colors duration-300"
							:class="searchMode === 'multi' ? 'text-secondary-content' : 'text-base-content/60'"
							:aria-selected="searchMode === 'multi'" @click="searchMode = 'multi'">
							<img src="@/assets/images/multi.svg" alt="" class="w-5 mr-2">
							多日租借
						</button>
					</div>
					<QuickSearch v-model:mode="searchMode" />
				</div>
			</div>
		</div>
	</div>

	<!-- 精選場館 -->
	<section class="bg-base-200">
		<div class="container mx-auto px-4 py-14 lg:py-20">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 lg:mb-10">
				<div>
					<p class="sport-eyebrow">VENUES</p>
					<h2 class="mt-2 text-3xl lg:text-4xl font-heading font-black text-secondary">精選場館</h2>
					<p class="mt-2 text-base-content/60">從綜合體育館到專業球場,挑選最適合你的活動空間。</p>
				</div>
				<router-link to="/venues" class="btn btn-outline btn-secondary self-start sm:self-auto">
					瀏覽全部場館
					<span class="material-symbols-outlined">arrow_forward</span>
				</router-link>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
				<article v-for="v in featuredVenues" :key="v.id" class="m-post group relative">
					<!-- 整張卡的點擊區(蓋滿,任何位置都可點) -->
					<router-link :to="{ name: 'venue-detail', params: { id: v.id } }"
						class="m-post__link absolute inset-0 z-20" :aria-label="v.name"></router-link>

					<!-- 圖片 -->
					<div class="eyecatch relative aspect-4/3 overflow-hidden rounded-md bg-base-300">
						<img :src="publicImageUrl(v.mainImageUrl)" :alt="v.name"
							class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
						<div
							class="post-link absolute inset-0 transition-[backdrop-filter] duration-300 group-hover:backdrop-blur-[3px]">
						</div>
					</div>

					<!-- 標籤(桌機:右下凹陷白卡;手機:圖片下方一般排版) -->
					<div
						class="info mt-3 md:mt-0 md:absolute md:right-0 md:bottom-0 md:max-w-[calc(100%-4rem)] md:bg-base-200 md:rounded-tl-[10px] md:pl-8 md:pr-6 md:pt-4 md:pb-4 md:transition-[padding] md:duration-300 md:ease-out md:group-hover:pl-10 md:group-hover:pr-10 md:group-hover:pt-8 md:group-hover:pb-10">
						<div class="meta flex items-center gap-2 flex-wrap text-xs">
							<span v-if="v.capacity"
								class="tag inline-flex items-center gap-1 border border-base-content/25 px-2 py-0.5 leading-none">
								<span class="material-symbols-outlined text-sm leading-none">groups</span>
								可容納 {{ v.capacity.toLocaleString() }} 人
							</span>
							<span v-else
								class="tag inline-flex items-center border border-base-content/25 px-2 py-0.5 leading-none">
								{{ v.type }}
							</span>
						</div>
						<h3 class="title text-xl md:text-2xl font-heading font-black leading-snug mt-2 text-base-content">
							{{ v.name }}
						</h3>

						<!-- 操作按鈕:行動版直接顯示;桌機版預設收起,hover 才展開(收起時不可點,讓整卡連結生效) -->
						<div
							class="actions relative z-30 flex gap-2 mt-3
							       md:mt-0 md:max-h-0 md:opacity-0 md:overflow-hidden md:pointer-events-none
							       md:transition-all md:duration-300 md:ease-out
							       md:group-hover:mt-3 md:group-hover:max-h-12 md:group-hover:opacity-100 md:group-hover:pointer-events-auto">
							<router-link :to="{ name: 'venue-booking', params: { id: v.id } }" class="btn btn-primary flex-1">立即租借</router-link>
							<router-link :to="{ name: 'venue-detail', params: { id: v.id } }"
								class="btn btn-outline flex-1">場館詳情</router-link>
						</div>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!-- Main Content Section -->
	<div class="container mx-auto py-6 lg:py-10">



		<!-- Booking Heatmap Calendar -->
		<section>
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-6 lg:px-0 lg:py-8">
				<div>
					<p class="sport-eyebrow">AVAILABILITY</p>
					<h2 class="mt-2 text-2xl lg:text-4xl font-heading font-black text-secondary">場館預約概況</h2>
					<p class="mt-2 text-base-content/60">紅色為該場館已有預約的日期,規劃前可先參考。</p>
				</div>
				<select v-model.number="selectedVenueId" class="select select-bordered w-full sm:max-w-xs">
					<option :value="-1">全部場館(預約熱度)</option>
					<option v-for="v in venueOptions" :key="v.id" :value="v.id">{{ v.name }}</option>
				</select>
			</header>
	
			<div class="bg-base-100 border border-base-200 p-6 rounded-box mb-8">
	
				<MonthCalendar
					:bookings="filteredBookings"
					:counts="dailyCounts"
					:cell-events="cellEvents"
					:show-legend="!isAllVenues"
					default-view="week"
					show-view-toggle
					show-today-button
					viewable
					@select-date="onCalendarDayClick"
				/>
				<!-- 熱度模式專屬圖例 -->
				<div v-if="isAllVenues" class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-base-content/70">
					<span>預約場館數:</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/15 border border-error/20"></span>1</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/25 border border-error/30"></span>2-3</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/40 border border-error/50"></span>4-6</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/60 border border-error/70"></span>7-9</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/80 border border-error/90"></span>10+</span>
				</div>
			</div>
		</section>
	</div>

	<!-- 預約流程:運動感流程軌道(深藍底 + 巨大橘色號碼坐在連接軌道線上) -->
	<section class="diag-top -mt-9 bg-secondary text-secondary-content">
		<div class="container mx-auto px-4 pt-24 pb-16 lg:pt-28 lg:pb-24">
			<div class="text-center max-w-2xl mx-auto mb-8 lg:mb-16">
				<p class="sport-eyebrow justify-center">HOW IT WORKS</p>
				<h2 class="mt-3 sport-title text-3xl lg:text-5xl">四步驟完成預約</h2>
				<p class="mt-3 text-secondary-content/70">從搜尋到入場,全程線上完成,簡單又快速。</p>
			</div>
			<ol class="relative grid gap-7 lg:grid-cols-4 lg:gap-6">
				<!-- 連接軌道線(桌機;被各號碼的底色切成區段) -->
				<span class="hidden lg:block absolute top-9 left-0 right-0 h-0.5 bg-secondary-content/15"></span>
				<li v-for="(step, i) in bookingSteps" :key="step.title"
					class="relative flex flex-row items-center gap-4 text-left lg:flex-col lg:items-center lg:gap-0 lg:text-center">
					<span class="relative z-10 inline-flex items-center justify-center bg-secondary shrink-0 w-16 lg:w-auto lg:px-4">
						<span class="font-heading italic font-bold leading-none text-5xl lg:text-7xl text-primary">{{ String(i + 1).padStart(2, '0') }}</span>
					</span>
					<div class="min-w-0 lg:contents">
						<h3 class="inline-flex items-center gap-1.5 text-base lg:text-xl font-heading font-black lg:mt-5">
							<span class="material-symbols-outlined text-lg lg:text-xl text-primary">{{ step.icon }}</span>
							{{ step.title }}
						</h3>
						<p class="mt-1 lg:mt-2 max-w-60 text-xs lg:text-sm leading-relaxed text-secondary-content/70">{{ step.desc }}</p>
					</div>
				</li>
			</ol>
		</div>
	</section>

	<!-- Main Content Section: 最新消息 -->
	<div class="container mx-auto py-14 lg:py-20">
		<!-- News Section -->
		<section>
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-6 lg:px-0 lg:py-8">
				<div>
					<p class="sport-eyebrow">NEWS</p>
					<h2 class="mt-2 text-2xl lg:text-4xl font-heading font-black text-secondary">最新消息</h2>
					<p class="mt-2 text-base-content/60">場館公告、活動資訊與維護通知。</p>
				</div>
				<router-link to="/news" class="btn btn-ghost self-start sm:self-auto hidden lg:inline-flex">
					查看全部
					<span class="material-symbols-outlined">arrow_forward</span>
				</router-link>
			</header>

			<!-- 最新消息:運動排行榜式索引清單(刻意與場館圖卡區隔) -->
			<ol class="border-t-2 border-base-content/10">
				<li v-for="(item, i) in latestNews" :key="item.id">
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

			<div class="mt-8 text-center sm:hidden px-4 mb-12">
				<router-link to="/news" class="btn btn-outline w-full">
					查看全部消息
				</router-link>
			</div>
		</section>
	</div>

	<!-- CTA -->
	<section class="diag-top -mt-9 bg-linear-to-br from-primary to-primary-600 text-primary-content">
		<div class="container mx-auto px-4 pt-24 pb-16 lg:pt-32 lg:pb-24">
			<div class="flex flex-col items-center text-center gap-6">
				<h2 class="sport-title text-4xl lg:text-6xl max-w-3xl">準備好預約<span class="text-base-100/40">了嗎?</span></h2>
				<p class="text-primary-content/85 max-w-xl text-base lg:text-lg">立即查詢可租借時段,線上完成苗栗縣體育場館預約。</p>
				<router-link to="/venues"
					class="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-0 shadow-lg">
					立即尋找場地
					<span class="material-symbols-outlined">arrow_forward</span>
				</router-link>
			</div>
		</div>
	</section>

	<!-- 預約清單 modal:點月曆某天時顯示當日的預約簡要列表 -->
	<dialog ref="bookingsModal" class="modal">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-1">{{ formatLongDate(selectedDate) }} 預約清單</h3>
			<p class="text-sm text-base-content/60 mb-4">
				{{ isAllVenues ? '全部場館' : venueNameOf(selectedVenueId) }} · 共 {{ bookingsOnSelectedDate.length }} 筆
			</p>

			<div v-if="bookingsOnSelectedDate.length" class="space-y-2 max-h-96 overflow-y-auto" data-lenis-prevent>
				<router-link v-for="b in bookingsOnSelectedDate" :key="b.id"
					:to="`/venues/${venueDetailId(b.venueId)}`"
					@click="closeBookingsModal"
					class="flex items-center justify-between gap-3 p-3 border border-base-200 rounded-box hover:bg-base-200/60 hover:border-base-300 transition-colors">
					<div class="min-w-0 flex justify-between items-center gap-4 flex-1">
						<div class="font-medium truncate">{{ venueNameOf(b.venueId) }}</div>
						<div class="text-sm text-base-content/60">{{ describeBookingTime(b) }}</div>
					</div>
					<span class="material-symbols-outlined text-base-content/40 shrink-0">chevron_right</span>
				</router-link>
			</div>
			<div v-else class="text-center py-10 text-base-content/50">當日無預約</div>

			<div class="modal-action">
				<button type="button" class="btn" @click="closeBookingsModal">關閉</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop"><button>close</button></form>
	</dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import mockNews from "@/mocks/news.json";
import mockBookings from "@/mocks/generateBookings";
import mockVenues from "@/mocks/venues.json";
import MonthCalendar from '@/components/portal/calendar/MonthCalendar.vue';
import QuickSearch from '@/components/portal/QuickSearch.vue';
import { publicImageUrl } from '@/utils/assets'

// 行動版首頁搜尋的租借方式:daily=時段租借、multi=多日租借
const searchMode = ref<'daily' | 'multi'>('daily')

// ── 首頁內容區 ──
// 精選場館:取頂層(無 parentId)、可租借的場館;首頁展示前 6 筆
const topVenues = (mockVenues as any[]).filter(v => !v.parentId && v.status === 'available')
const featuredVenues = topVenues.slice(0, 3)

// 數據信任條
const heroStats = [
  { value: String(topVenues.length), unit: '座', label: '可租借場館' },
  { value: '3', unit: '種', label: '彈性租借方式' },
  { value: '24', unit: 'h', label: '線上即時預約' },
]

// 預約流程
const bookingSteps = [
  { icon: 'search', title: '搜尋場地', desc: '選擇日期與租借方式,快速找到合適的場館。' },
  { icon: 'event_available', title: '線上預約', desc: '挑選時段、填寫租借資料,即時送出申請。' },
  { icon: 'receipt_long', title: '確認繳費', desc: '審核通過後,於期限內完成線上繳費。' },
  { icon: 'sports_handball', title: '入場使用', desc: '依預約時段前往場館,盡情享受活動。' },
]

// 月曆顯示預約熱度;JSON 型別過寬,用 any 餵給 MonthCalendar 的 BookingRecord[]
const bookings = mockBookings as any[]
const venueOptions = mockVenues.map(v => ({ id: v.id, name: v.name }))
// -1 = 全部場館(熱度模式),其他為特定場館 ID
const selectedVenueId = ref<number>(-1)
const isAllVenues = computed(() => selectedVenueId.value === -1)

const filteredBookings = computed(() =>
  isAllVenues.value ? [] : bookings.filter(b => b.venueId === selectedVenueId.value)
)

// 熱度模式:聚合每天有多少筆預約跨越該日(daily 含 start~end 區間,hourly 取當日)
const dailyCounts = computed<Record<string, number>>(() => {
  if (!isAllVenues.value) return {}
  const out: Record<string, number> = {}
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  for (const b of bookings) {
    const startStr: string | undefined = b.startDate ?? b.date
    const endStr: string | undefined = b.endDate ?? b.date
    if (!startStr) continue
    const s = new Date(`${startStr}T00:00:00`)
    const e = new Date(`${endStr ?? startStr}T00:00:00`)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d)
      out[key] = (out[key] ?? 0) + 1
    }
  }
  return out
})

// ── 點日期 → 預約清單 modal ──
const bookingsModal = ref<HTMLDialogElement | null>(null)
const selectedDate = ref<string>('')
const venueMap = new Map<number, string>(mockVenues.map(v => [v.id, v.name]))
function venueNameOf(id: number): string {
  return venueMap.get(id) ?? `#${id}`
}

// 子場館(parentId 非空)→ 連回母場館詳情頁
const venueParentMap = new Map<number, number>()
for (const v of mockVenues as any[]) {
  if (v.parentId) venueParentMap.set(v.id, v.parentId)
}
function venueDetailId(id: number): number {
  return venueParentMap.get(id) ?? id
}

// 預載每個場館的時段名稱 → 時間區,讓 session 預約顯示「上午 08:00-12:00」之類
const sessionTimesByVenue = new Map<number, Record<string, { startTime: string; endTime: string }>>()
for (const v of mockVenues) {
  const sessions = (v as any).rentalModes?.session?.sessions
  if (!Array.isArray(sessions)) continue
  const map: Record<string, { startTime: string; endTime: string }> = {}
  for (const s of sessions) {
    if (s?.name) map[s.name] = { startTime: s.startTime, endTime: s.endTime }
  }
  sessionTimesByVenue.set(v.id, map)
}

// 拆成 { primary, time } 兩段,讓格子可以「主要文字一行 + 時間一行」呈現
type BookingParts = { primary: string; time?: string }
function bookingParts(b: any): BookingParts {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return { primary: '整日', time: `${b.startDate.slice(5).replace('-', '/')} ~ ${b.endDate.slice(5).replace('-', '/')}` }
    }
    return { primary: '整日' }
  }
  if (b.rentalMode === 'session') {
    if (!b.session) return { primary: '-' }
    const range = sessionTimesByVenue.get(b.venueId)?.[b.session]
    return range ? { primary: b.session, time: `${range.startTime}-${range.endTime}` } : { primary: b.session }
  }
  if (b.rentalMode === 'hourly') return { primary: `${b.startTime ?? ''}-${b.endTime ?? ''}` }
  return { primary: '' }
}

// 每天的事件清單(全部場館:label=場館名,time=時段;特定場館:label=時段,time=細節時間)
const cellEvents = computed<Record<string, { label: string; time?: string }[]>>(() => {
  const out: Record<string, { label: string; time?: string }[]> = {}
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const pool = isAllVenues.value ? bookings : bookings.filter(b => b.venueId === selectedVenueId.value)
  for (const b of pool) {
    const startStr = b.startDate ?? b.date
    const endStr = b.endDate ?? b.date
    if (!startStr) continue
    const s = new Date(`${startStr}T00:00:00`)
    const e = new Date(`${endStr ?? startStr}T00:00:00`)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue
    const parts = bookingParts(b)
    // 全部場館模式:場館名 + 時段時間分兩行(空間有限,場館名單獨一行較易讀)
    // 特定場館模式:整行不斷行,label 與 time 合成單行字串顯示
    const entry = isAllVenues.value
      ? { label: venueNameOf(b.venueId), time: parts.time ? `${parts.primary} ${parts.time}` : parts.primary }
      : { label: parts.time ? `${parts.primary} ${parts.time}` : parts.primary }
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d)
      if (!out[key]) out[key] = []
      out[key].push(entry)
    }
  }
  return out
})

function describeBookingTime(b: any): string {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return `整日 (${b.startDate.slice(5).replace('-', '/')} ~ ${b.endDate.slice(5).replace('-', '/')})`
    }
    return '整日'
  }
  if (b.rentalMode === 'session') {
    if (!b.session) return '-'
    const range = sessionTimesByVenue.get(b.venueId)?.[b.session]
    return range ? `${b.session} ${range.startTime}-${range.endTime}` : b.session
  }
  if (b.rentalMode === 'hourly') return `${b.startTime ?? ''} - ${b.endTime ?? ''}`
  return '-'
}

const bookingsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  const target = selectedDate.value
  const pool = isAllVenues.value ? bookings : bookings.filter(b => b.venueId === selectedVenueId.value)
  return pool
    .filter(b => {
      if (b.rentalMode === 'daily') {
        const start = b.startDate ?? b.date
        const end = b.endDate ?? b.date
        return target >= start && target <= end
      }
      return b.date === target
    })
    .sort((a, b) => {
      if (a.venueId !== b.venueId) return a.venueId - b.venueId
      const aTime = a.startTime || a.session || ''
      const bTime = b.startTime || b.session || ''
      return aTime.localeCompare(bTime)
    })
})

// 桌機在格子內直接顯示前 2 筆;點任一天則都開 modal 看完整清單(任意尺寸)
function onCalendarDayClick(dateStr: string) {
  selectedDate.value = dateStr
  bookingsModal.value?.showModal()
}

function closeBookingsModal() {
  bookingsModal.value?.close()
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y} 年 ${parseInt(m ?? '1')} 月 ${parseInt(d ?? '1')} 日`
}

// 載入所有圖片資源
const imageModules = import.meta.glob('@/assets/images/*.{jpg,jpeg,png}', { eager: true });
const images = Object.values(imageModules).map((mod: any) => mod.default || mod);

const currentImageIndex = ref(0);
const previousImageIndex = ref(-1);
const shuffledImages = ref<string[]>([]);
let intervalId: any = null;

// 取前三筆最新消息：優先置頂，再依日期排序
const latestNews = [...mockNews].sort((a, b) => {
	if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
	return b.publishedAt.localeCompare(a.publishedAt)
}).slice(0, 3)

function formatDate(date: string) {
	return date.replaceAll('-', '/')
}

const heroParallaxOffset = ref(0);
let heroParallaxTicking = false;
function onHeroParallaxScroll() {
	if (heroParallaxTicking) return;
	heroParallaxTicking = true;
	requestAnimationFrame(() => {
		heroParallaxOffset.value = window.scrollY * 0.35;
		heroParallaxTicking = false;
	});
}
const heroParallaxStyle = computed(() => ({
	transform: `translate3d(0, ${heroParallaxOffset.value}px, 0)`,
}));

onMounted(() => {
	if (images.length > 0) {
		// 隨機打亂陣列
		shuffledImages.value = [...images].sort(() => Math.random() - 0.5);

		intervalId = setInterval(() => {
			let nextIndex = Math.floor(Math.random() * shuffledImages.value.length);
			// 確保不與當前圖片重複
			if (nextIndex === currentImageIndex.value && shuffledImages.value.length > 1) {
				nextIndex = (nextIndex + 1) % shuffledImages.value.length;
			}
			previousImageIndex.value = currentImageIndex.value;
			currentImageIndex.value = nextIndex;
		}, 7000); // 每 7 秒切換一次(較慢、有節奏)
	}
	window.addEventListener('scroll', onHeroParallaxScroll, { passive: true });
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
	window.removeEventListener('scroll', onHeroParallaxScroll);
});
</script>

<style scoped>
/* 精選場館卡片:沿用 VenueList 的 misakigumi 右下角凹陷(只在桌機顯示) */
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
