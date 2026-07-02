<template>
  <!-- Toolbar -->
  <header class="flex items-center justify-between p-4">
    <div class="flex-1 flex gap-2 flex-wrap">
      <input v-model="search" type="search" class="input w-64" placeholder="搜尋場館名稱或地址" aria-label="搜尋場館" />
      <select v-if="venueTypes.length > 1" v-model="filterType" class="select" aria-label="篩選類別">
        <option value="">全部類別</option>
        <option v-for="t in venueTypes" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterStatus" class="select" aria-label="篩選狀態">
        <option value="">全部狀態</option>
        <option value="available">開放中</option>
        <option value="maintenance">維護中</option>
        <option value="closed">已關閉</option>
      </select>
      <button v-if="hasFilter" type="button" class="btn btn-ghost gap-1" @click="clearFilters">
        <span class="material-symbols-outlined text-sm">close</span>
        清除篩選
      </button>
    </div>
    <button type="button" class="btn btn-primary">
      <span class="material-symbols-outlined">add</span>
      新增場館
    </button>
  </header>
  <section class="basic-section space-y-4 px-4">

    <!-- Table -->
    <div class="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto mb-4">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">場館</th>
            <th scope="col">負責人</th>
            <th scope="col">狀態</th>
            <th scope="col">租借方式</th>
            <th scope="col" class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="venue in topLevel" :key="venue.id">
            <!-- 上層場館 -->
            <tr class="hover">
              <td>
                <div class="flex items-center gap-3">
                  <button v-if="childrenOf(venue.id).length" type="button" class="btn btn-ghost btn-square"
                    :aria-label="expanded.has(venue.id) ? '收合子場地' : '展開子場地'"
                    :aria-expanded="expanded.has(venue.id)"
                    @click="toggleExpand(venue.id)">
                    <span class="material-symbols-outlined transition-transform"
                      :class="expanded.has(venue.id) ? 'rotate-90' : ''">chevron_right</span>
                  </button>
                  <div v-else class="w-7 shrink-0"></div>
                  <div class="avatar">
                    <div class="w-10 h-10 rounded-lg">
                      <img :src="publicImageUrl(venue.mainImageUrl)" :alt="venue.name" class="object-cover" />
                    </div>
                  </div>
                  <div class="min-w-0">
                    <router-link :to="{ name: 'admin-venue-edit', params: { id: venue.id } }"
                      class="font-semibold link link-hover">{{ venue.name }}</router-link><br />
                    <span v-if="childrenOf(venue.id).length" class="text-base-content/40">
                      {{ childrenOf(venue.id).length }} 個子場地
                    </span>
                  </div>
                </div>
              </td>
              <td class="text-sm">
                <span v-if="managerNames(venue).length">{{ managerNames(venue).join('、') }}</span>
                <span v-else class="text-base-content/40">未指派</span>
              </td>
              <td>
                <div class="dropdown">
                  <div tabindex="0" role="button" class="badge cursor-pointer gap-0.5" :class="statusClass(venue.status)">
                    {{ statusLabel(venue.status) }}
                    <span class="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </div>
                  <ul tabindex="0" class="dropdown-content menu z-10 mt-1 w-32 rounded-box bg-base-100 p-1 shadow border border-base-300">
                    <li v-for="s in STATUS_OPTIONS" :key="s.value">
                      <a :class="{ active: venue.status === s.value }" @click="setStatus(venue, s.value)">
                        <span class="badge badge-xs" :class="statusClass(s.value)"></span>{{ s.label }}
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
              <td>
                <div class="flex gap-1 flex-wrap">
                  <span v-if="venue.rentalModes.daily?.enabled" class="badge badge-ghost">全日</span>
                  <span v-if="venue.rentalModes.session?.enabled" class="badge badge-ghost">場次</span>
                  <span v-if="venue.rentalModes.hourly?.enabled" class="badge badge-ghost">計時</span>
                </div>
              </td>
              <td>
                <div class="flex gap-1 justify-end">
                  <button type="button" class="btn btn-ghost btn-square tooltip" data-tip="新增子場地"
                    aria-label="新增子場地" @click="addChild(venue)">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                  <router-link :to="{ name: 'admin-venues-calendar', query: { id: venue.id } }" class="btn btn-ghost btn-square tooltip" title="行事曆" data-tip="行事曆">
                    <span class="material-symbols-outlined">calendar_month</span>
                  </router-link>
                  <router-link :to="{ name: 'admin-venue-edit', params: { id: venue.id } }" class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯">
                    <span class="material-symbols-outlined">edit</span>
                  </router-link>
                  <button type="button" class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除"
                    aria-label="刪除場館" @click="askDelete(venue)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <!-- 子場地（展開時顯示） -->
            <template v-if="expanded.has(venue.id)">
              <tr v-for="child in childrenOf(venue.id)" :key="child.id" class="hover bg-base-200/40">
                <td>
                  <div class="flex items-center gap-3 pl-10">
                    <div class="avatar">
                      <div class="w-8 h-8 rounded-lg">
                        <img :src="publicImageUrl(child.mainImageUrl)" :alt="child.name" class="object-cover" />
                      </div>
                    </div>
                    <div class="min-w-0">
                      <router-link :to="{ name: 'admin-venue-edit', params: { id: child.id } }"
                        class="font-medium link link-hover">{{ child.name }}</router-link>
                      <p class="text-base-content/40">子場地</p>
                    </div>
                  </div>
                </td>
                <td class="text-sm">
                  <span v-if="managerNames(child).length">{{ managerNames(child).join('、') }}</span>
                  <span v-else class="text-base-content/40">未指派</span>
                </td>
                <td>
                  <div class="dropdown">
                    <div tabindex="0" role="button" class="badge cursor-pointer gap-0.5" :class="statusClass(child.status)">
                      {{ statusLabel(child.status) }}
                      <span class="material-symbols-outlined text-sm">arrow_drop_down</span>
                    </div>
                    <ul tabindex="0" class="dropdown-content menu z-10 mt-1 w-32 rounded-box bg-base-100 p-1 shadow border border-base-300">
                      <li v-for="s in STATUS_OPTIONS" :key="s.value">
                        <a :class="{ active: child.status === s.value }" @click="setStatus(child, s.value)">
                          <span class="badge badge-xs" :class="statusClass(s.value)"></span>{{ s.label }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1 flex-wrap">
                    <span v-if="child.rentalModes.daily?.enabled" class="badge badge-ghost">全日</span>
                    <span v-if="child.rentalModes.session?.enabled" class="badge badge-ghost">場次</span>
                    <span v-if="child.rentalModes.hourly?.enabled" class="badge badge-ghost">計時</span>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1 justify-end">
                    <router-link :to="{ name: 'admin-venues-calendar', query: { id: child.id } }" class="btn btn-ghost btn-square tooltip" title="行事曆" data-tip="行事曆">
                      <span class="material-symbols-outlined">calendar_month</span>
                    </router-link>
                    <router-link :to="{ name: 'admin-venue-edit', params: { id: child.id } }" class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯">
                      <span class="material-symbols-outlined">edit</span>
                    </router-link>
                    <button type="button" class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除"
                      aria-label="刪除場地" @click="askDelete(child)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </template>

          <tr v-if="topLevel.length === 0">
            <td colspan="5" class="text-center text-base-content/40 py-10">
              {{ hasFilter ? '找不到符合的場館' : '尚未建立任何場館' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </section>

  <!-- 刪除確認 -->
  <dialog class="modal" :class="{ 'modal-open': deleteTarget }">
    <div class="modal-box">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-error">warning</span>
        刪除場館
      </h3>
      <p class="py-4">
        確定要刪除「<span class="font-semibold">{{ deleteTarget?.name }}</span>」嗎？此操作無法復原。
      </p>
      <div v-if="deleteChildCount" role="alert" class="alert alert-warning">
        <span class="material-symbols-outlined">error</span>
        <span>此場館含 {{ deleteChildCount }} 個子場地，將一併刪除。</span>
      </div>
      <div class="modal-action">
        <button type="button" class="btn" @click="cancelDelete">取消</button>
        <button type="button" class="btn btn-error" @click="confirmDelete">刪除</button>
      </div>
    </div>
    <button type="button" class="modal-backdrop" aria-label="關閉" @click="cancelDelete"></button>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import mockVenues from '../../../mocks/venues.json'
import mockAdmins from '@/mocks/admins.json'
import { publicImageUrl } from '@/utils/assets'

type Venue = (typeof mockVenues)[number]

// 負責人：由管理員的 managedVenues 反查；子場地無指派時繼承母場館
function managerNames(venue: Venue): string[] {
  const direct = mockAdmins.filter(a => a.managedVenues.includes(venue.id)).map(a => a.name)
  if (direct.length) return direct
  if (venue.parentId != null) {
    const pid = venue.parentId as number
    return mockAdmins.filter(a => a.managedVenues.includes(pid)).map(a => a.name)
  }
  return []
}

const venuesData = ref<Venue[]>([...mockVenues])

const search = ref('')
const filterType = ref('')
const filterStatus = ref('')

const parentIds = venuesData.value
  .filter(v => v.parentId !== null)
  .map(v => v.parentId as number)
const expanded = ref<Set<number>>(new Set(parentIds))

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function childrenOf(parentId: number) {
  return venuesData.value.filter(v => v.parentId === parentId)
}

const venueTypes = computed(() =>
  [...new Set(venuesData.value.map(v => v.type).filter(Boolean))],
)

const topLevel = computed(() =>
  venuesData.value.filter(v => {
    if (v.parentId !== null) return false
    const matchSearch = !search.value || v.name.includes(search.value) || v.location.includes(search.value)
    const matchType = !filterType.value || v.type === filterType.value
    const matchStatus = !filterStatus.value || v.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
)

const hasFilter = computed(() => !!search.value || !!filterType.value || !!filterStatus.value)

function clearFilters() {
  search.value = ''
  filterType.value = ''
  filterStatus.value = ''
}

function statusLabel(status: string) {
  return { available: '開放中', maintenance: '維護中', closed: '已關閉' }[status] ?? status
}

function statusClass(status: string) {
  return { available: 'badge-success', maintenance: 'badge-warning', closed: 'badge-error' }[status] ?? ''
}

// 列內快速切換狀態（免進編輯頁）
const STATUS_OPTIONS = [
  { value: 'available', label: '開放中' },
  { value: 'maintenance', label: '維護中' },
  { value: 'closed', label: '已關閉' },
]

function setStatus(venue: Venue, value: string) {
  ;(venue as { status: string }).status = value
  ;(document.activeElement as HTMLElement)?.blur()
}

// 每列新增子場地（沿用父場館作為預設，於前台原型即時新增並展開）
function addChild(parent: Venue) {
  const newId = Math.max(0, ...venuesData.value.map(v => v.id)) + 1
  const child = JSON.parse(JSON.stringify(parent)) as Venue
  Object.assign(child as Record<string, unknown>, {
    id: newId,
    parentId: parent.id,
    name: '新子場地',
    capacity: 0,
  })
  venuesData.value.push(child)
  expanded.value.add(parent.id)
}

// 刪除確認
const deleteTarget = ref<Venue | null>(null)
const deleteChildCount = computed(() =>
  deleteTarget.value ? childrenOf(deleteTarget.value.id).length : 0,
)

function askDelete(venue: Venue) {
  deleteTarget.value = venue
}

function cancelDelete() {
  deleteTarget.value = null
}

function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  // 一併移除子場地
  venuesData.value = venuesData.value.filter(v => v.id !== target.id && v.parentId !== target.id)
  deleteTarget.value = null
}
</script>
