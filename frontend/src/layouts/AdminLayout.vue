<template>
	<div class="drawer lg:drawer-open">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle peer" v-model="drawerOpen" />
		<div class="drawer-content h-screen flex flex-col">

			<!-- Navbar -->
			<nav class="w-full bg-base-100 border-b border-b-base-300 flex py-1 px-4 ">
				<!-- 左側：返回鍵（非一級頁才顯示）＋ 麵包屑 -->
				<div class="flex-1 flex items-center gap-1 min-w-0">
					<button v-if="!isTopLevel" class="btn btn-ghost btn-sm btn-square shrink-0 tooltip tooltip-bottom"
						data-tip="返回上一頁" @click="back()">
						<span class="material-symbols-outlined text-xl">arrow_back</span>
					</button>
					<div class="breadcrumbs text-sm min-w-0">
						<ul>
							<li><router-link to="/admin" class="text-base-content/50">後台管理</router-link></li>
							<li v-for="ancestor in breadcrumbs.ancestors" :key="ancestor.to">
								<router-link :to="ancestor.to" class="text-base-content/50">{{ ancestor.label }}</router-link>
							</li>
							<li class="font-medium text-base-content">{{ titleCrumb }}</li>
						</ul>
					</div>
				</div>
				<!-- 右側：回前台、今日日期、字體縮放、使用者選單 -->
				<div class="flex-none space-x-2 flex items-center">
					<RouterLink class="btn btn-ghost btn-sm btn-square tooltip tooltip-bottom" data-tip="回前台首頁" to="/">
						<span class="material-symbols-outlined text-xl">home</span>
					</RouterLink>
					<span class="font-mono text-base  tracking-wide pr-2 flex items-center gap-2">
						<span class="material-symbols-outlined inline-block text-xl">calendar_month</span>
						{{ todayLabel }}</span>
					<!-- 字體縮放：縮小 / 還原 / 放大 -->
					<div class="join border border-base-300 mr-2 items-center">
						<button class="join-item btn btn-square btn-sm px-3 btn-ghost tooltip tooltip-bottom"
							data-tip="縮小字體" @click="decreaseFontSize" :disabled="fontSize <= minFontSize">
							<span class="material-symbols-outlined inline-block">remove</span>
						</button>
						<button class="join-item btn btn-sm px-2 btn-ghost font-mono text-xs w-14 tooltip tooltip-bottom"
							data-tip="還原預設" @click="resetFontSize">
							{{ Math.round((fontSize / 16) * 100) }}%
						</button>
						<button class="join-item btn btn-square btn-sm px-3 btn-ghost tooltip tooltip-bottom"
							data-tip="放大字體" @click="increaseFontSize" :disabled="fontSize >= maxFontSize">
							<span class="material-symbols-outlined inline-block">add</span>
						</button>
					</div>

				</div>
			</nav>
			<!-- Page content here -->
			<div class="bg-linear-to-bl from-base-100 to-base-200 flex-1 overflow-y-auto ">
				<router-view />
			</div>
			<ToastHost />
		</div>

		<!-- 側邊選單（drawer）：Logo + 分組導覽 + 收合鈕 -->
		<div class="drawer-side overflow-visible shadow-xl border-r border-black/15 z-50 transition-transform duration-200 ease-out bg-base-300 ">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
			<div
				class="flex min-h-full flex-col items-start border-r border-base-300 transition-[width] duration-200 ease-out is-drawer-close:w-fit is-drawer-open:w-64">
				<!-- 網站名稱 -->
				<div
					class=" is-drawer-close:px-2 px-4 py-3 border-b border-base-300 w-full flex items-center  overflow-hidden gap-2">
					<!-- 圓形 Logo -->
					<img src="@/assets/images/logo.svg" alt="苗栗縣體育場館預約系統" class="w-9 h-9 shrink-0 is-drawer-close:mx-auto">

					<div class="is-drawer-close:hidden min-w-0">
						<p class="font-bold truncate">苗栗縣體育場館預約系統</p>
						<p class="text-xs text-base-content/60 truncate">後台管理系統</p>
					</div>
				</div>
				<!-- Sidebar content here -->
				<ul class="menu menu-lg w-full grow px-2">
					<template v-for="(group, index) in menuGroups" :key="group.title">
						<!-- 分類標題 -->
						<li class="menu-title is-drawer-close:hidden font-bold text-base-content/50"
							:class="index > 0 ? 'mt-4' : ''">
							{{ group.title }}
						</li>
						<!-- 取代上方空位用的隱形標題 (當抽屜合起時，讓間距一致) -->
						<li v-if="index > 0" class="is-drawer-open:hidden mt-2"></li>

						<!-- 選單項目 -->
						<li v-for="item in group.items" :key="item.name">
							<router-link :to="{ name: item.name }"
								class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center is-drawer-close:size-11 is-drawer-close:justify-center is-drawer-close:p-0"
								:class="{ 'menu-active bg-primary text-primary-content shadow-none': isMenuActive(item) }" :data-tip="item.label">
								<span class="material-symbols-outlined inline-block text-xl">{{ item.icon }}</span>
								<span class="is-drawer-close:hidden">{{ item.label }}</span>
							</router-link>
						</li>
					</template>
				</ul>
				<!-- 使用者選單：個人資料 / 登出（向右展出） -->
				<div class="w-full is-drawer-close:px-1 px-2 py-1">
					<div class="dropdown dropdown-right dropdown-end w-full is-drawer-open:p-2 is-drawer-open:bg-base-200">
						<div tabindex="0" role="button"
							class="w-full justify-start items-center flex cursor-pointer gap-3 is-drawer-close:justify-center is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:aspect-square"
							data-tip="帳號">
							<!-- <div class="avatar avatar-placeholder">
								<div class="bg-neutral text-neutral-content w-8 rounded-full">
									<span class="text-xs">UI</span>
								</div>
							</div> -->
							<div class="avatar">
								<div class="ring-secondary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2 avatar-placeholder">
									<div class="bg-secondary text-neutral-content aspect-square rounded-full">
										<span class="text-xs">UI</span>
									</div>
								</div>
							</div>
							<span class="is-drawer-close:hidden flex-1">管理員</span>
							<span class="material-symbols-outlined is-drawer-close:hidden">arrow_right</span>
						</div>
						<ul tabindex="0"
							class="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-300">
							<li><router-link to="/admin/profile">個人資料</router-link></li>
							<li><router-link to="/admin/login">登出</router-link></li>
						</ul>
					</div>
				</div>

				<!-- 底部：側邊選單收合／展開鈕 -->
				<ul class="menu w-full border-t border-base-300">
					<li>
						<label for="my-drawer-4" aria-label="open sidebar" class="btn btn-sm btn-square btn-ghost w-full">
							<span v-if="!drawerOpen" class="material-symbols-outlined text-xl">arrow_menu_open</span>
							<span v-else class="material-symbols-outlined text-xl">arrow_menu_close</span>
						</label>
					</li>
				</ul>
			</div>
		</div>
	</div>


</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ToastHost from '@/components/admin/ToastHost.vue'
import { useBookingsStore } from '@/stores/bookings'
import { venues as mockVenues } from '@/services/venueService'
import { users as mockUsers } from '@/services/userService'
import { admins as mockAdmins } from '@/services/adminService'
import { newsItems as mockNews } from '@/services/newsService'
import { permissionGroups as mockPermissions } from '@/services/permissionService'

/**
 * 後台主佈局（admin layout）
 *
 * 所有 /admin/* 頁面的外框：
 *  - 頂部 navbar：返回鍵、麵包屑、回前台、今日日期、字體縮放、使用者選單
 *  - 側邊選單（drawer）：依 menuGroups 分組的導覽，可收合
 *  - 依當前路由計算 active 選單項、麵包屑與分頁標題（document.title）
 * 內容區由 <router-view /> 呈現。
 */

const route = useRoute()
const router = useRouter()

// 側邊選單開合狀態（綁定 drawer checkbox）
const drawerOpen = ref(false)

// ── 字體縮放：記憶於 localStorage，套用到根元素 font-size（12–24px）──
const savedSize = localStorage.getItem('app-font-size')
const parsedSize = Number(savedSize)
const fontSize = ref(parsedSize && !isNaN(parsedSize) ? parsedSize : 16)
const minFontSize = 12
const maxFontSize = 24

const increaseFontSize = () => {
	if (fontSize.value < maxFontSize) {
		fontSize.value += 1
		localStorage.setItem('app-font-size', fontSize.value.toString())
	}
}

const decreaseFontSize = () => {
	if (fontSize.value > minFontSize) {
		fontSize.value -= 1
		localStorage.setItem('app-font-size', fontSize.value.toString())
	}
}

const resetFontSize = () => {
	fontSize.value = 16
	localStorage.setItem('app-font-size', fontSize.value.toString())
}

watchEffect(() => {
	document.documentElement.style.fontSize = `${fontSize.value}px`
})

// 返回上一頁
const back = () => {
	router.back()
}

// navbar 顯示的今日日期
const todayLabel = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })

interface MenuItem {
	name: string
	icon: string
	label: string
	// 明確定義此選單項「擁有」哪些路由（含子頁/詳細頁）；未指定則精確比對 name
	owns?: string[]
}
interface MenuGroup {
	title: string
	items: MenuItem[]
}

// 側邊導覽選單（分組）；item.owns 決定哪些子頁仍高亮所屬選單
const menuGroups: MenuGroup[] = [
	{
		title: '營運概況',
		items: [
			{ name: 'admin-index', icon: 'dashboard', label: '儀表板' },
			{ name: 'admin-reports', icon: 'bar_chart', label: '營運報表' },
		]
	},
	{
		title: '核心業務',
		items: [
			{ name: 'admin-bookings', icon: 'event_note', label: '預約管理', owns: ['admin-bookings', 'admin-booking-detail'] },
			{ name: 'admin-refunds', icon: 'currency_exchange', label: '退款作業' },
			{ name: 'admin-calendar', icon: 'calendar_month', label: '場館行事曆' },
			{ name: 'admin-venues', icon: 'stadium', label: '場館管理', owns: ['admin-venues', 'admin-venue-edit'] },
		]
	},
	{
		title: '系統配置',
		items: [
			{ name: 'admin-news', icon: 'newspaper', label: '最新消息', owns: ['admin-news', 'admin-news-edit'] },
			{ name: 'admin-members', icon: 'group', label: '會員管理', owns: ['admin-members', 'admin-member-detail'] },
			{ name: 'admin-admins', icon: 'manage_accounts', label: '管理員管理', owns: ['admin-admins', 'admin-admin-detail'] },
			{ name: 'admin-permissions', icon: 'shield', label: '權限設定', owns: ['admin-permissions', 'admin-permission-detail'] },
		]
	}
]

// 依「最長(最具體)的 owns 比對」決定 active 的選單項，
// 避免 admin-venues 誤配 admin-venues-calendar（後者更長、勝出）。
const activeMenuName = computed(() => {
	const name = String(route.name)
	let best: { item: string; len: number } | null = null
	for (const group of menuGroups) {
		for (const item of group.items) {
			for (const o of (item.owns ?? [item.name])) {
				if (name === o || name.startsWith(o + '-')) {
					if (!best || o.length > best.len) best = { item: item.name, len: o.length }
				}
			}
		}
	}
	return best?.item ?? null
})

function isMenuActive(item: MenuItem): boolean {
	return activeMenuName.value === item.name
}

// 當前路由是否為選單一級頁（用於決定是否顯示返回鍵）
const isTopLevel = computed(() => {
	return menuGroups.some(group => group.items.some(item => item.name === route.name))
})

// 路由 name → 頁面標題對照（供 document.title 與麵包屑使用）
const TITLES: Record<string, string> = {
	'admin-index': '儀表板',
	'admin-venues': '場館管理',
	'admin-venue-edit': '場館編輯',
	'admin-venue-edit-basic': '基本資料',
	'admin-venue-edit-rental': '租借方式',
	'admin-venue-edit-rental-items': '附加項目',
	'admin-venue-edit-photos': '照片管理',
	'admin-calendar': '場館行事曆',
	'admin-bookings': '預約管理',
	'admin-booking-detail': '預約詳細',
	'admin-refunds': '退款作業',
	'admin-members': '會員管理',
	'admin-member-detail': '會員詳細',
	'admin-admins': '管理員管理',
	'admin-admin-detail': '管理員詳細',
	'admin-permissions': '權限管理',
	'admin-permission-detail': '權限詳細',
	'admin-reports': '營運報表',
	'admin-news': '最新消息',
	'admin-news-edit': '消息編輯',
	'admin-profile': '個人資料',
}

// 詳情／編輯頁的實體名稱（場館名、預約、會員名…），供標題與麵包屑顯示
const entityName = computed(() => {
	const name = route.name as string
	const id = route.params.id as string | undefined
	if (!id) return null

	switch (name) {
		case 'admin-venue-edit':
		case 'admin-venue-edit-basic':
		case 'admin-venue-edit-rental':
		case 'admin-venue-edit-rental-items':
		case 'admin-venue-edit-photos':
			return mockVenues.find(v => v.id === Number(id))?.name ?? null
		case 'admin-booking-detail': {
			const b = useBookingsStore().getById(Number(id))
			if (!b) return null
			return `${b.reservationId} ${b.venueName} - ${b.applicant}`
		}
		case 'admin-member-detail':
			return mockUsers.find(u => u.id === id)?.name ?? null
		case 'admin-admin-detail':
			return mockAdmins.find(a => a.id === id)?.name ?? null
		case 'admin-permission-detail':
			return mockPermissions.find(p => p.id === id)?.name ?? null
		case 'admin-news-edit':
			return mockNews.find(n => n.id === Number(id))?.title ?? null
		default:
			return null
	}
})

// 分頁標題：基礎標題（＋實體名）；同步寫入 document.title
const pageTitle = computed(() => {
	const base = TITLES[route.name as string] ?? '後台管理'
	const entity = entityName.value
	return entity ? `${base}：${entity}` : base
})

watchEffect(() => {
	document.title = `${pageTitle.value} - 苗栗場館租借平台`
})

// 麵包屑：依當前路由推導祖先層級（詳情頁 → 其列表頁）
const breadcrumbs = computed(() => {
	const name = route.name as string
	const ancestors: Array<{ label: string; to: string }> = []

	switch (name) {
		case 'admin-venue-edit':
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			break
		case 'admin-calendar':
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			break
		case 'admin-venue-edit-basic':
		case 'admin-venue-edit-rental':
		case 'admin-venue-edit-rental-items':
		case 'admin-venue-edit-photos':
			// 場館編輯各分頁：麵包屑停在場館名（分頁由頁內 tab 呈現，不重複）
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			break
		case 'admin-booking-detail':
			ancestors.push({ label: '預約管理', to: '/admin/bookings' })
			break
		case 'admin-member-detail':
			ancestors.push({ label: '會員管理', to: '/admin/members' })
			break
		case 'admin-admin-detail':
			ancestors.push({ label: '管理員管理', to: '/admin/admins' })
			break
		case 'admin-permission-detail':
			ancestors.push({ label: '權限管理', to: '/admin/permissions' })
			break
		case 'admin-news-edit':
			ancestors.push({ label: '最新消息', to: '/admin/news' })
			break
	}

	return {
		ancestors,
		current: name === 'admin-index' ? null : (TITLES[name] ?? null),
	}
})

// 場館編輯各分頁：分頁名由頁內 tab 呈現，麵包屑末項用場館名即可
const VENUE_EDIT_TABS = [
	'admin-venue-edit',
	'admin-venue-edit-basic',
	'admin-venue-edit-rental',
	'admin-venue-edit-rental-items',
	'admin-venue-edit-photos',
]

// 麵包屑末項（取代大標題）：entity 已出現在祖先時不重複顯示
const titleCrumb = computed(() => {
	const name = route.name as string
	const entity = entityName.value
	// 場館編輯分頁：以場館名為現在頁（不附分頁名）
	if (VENUE_EDIT_TABS.includes(name)) return entity ?? TITLES['admin-venue-edit'] ?? '場館編輯'
	const base = TITLES[name] ?? '後台管理'
	if (!entity) return base
	if (breadcrumbs.value.ancestors.some(a => a.label === entity)) return base
	return `${base}：${entity}`
})
</script>
