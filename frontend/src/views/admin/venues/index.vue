<template>
  <!-- Toolbar -->
  <header class="flex items-center justify-between p-4">
    <div class="flex-1 flex gap-2 flex-wrap">
       <label class="input">
          <span class="material-symbols-outlined text-lg">search</span>
      <input v-model="search" type="search"  placeholder="搜尋場館名稱或地址" aria-label="搜尋場館" />
      </label>
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
    <div class="basis-table-container">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">場館</th>
            <th scope="col">租借方式</th>
            <th scope="col">狀態</th>
            <th scope="col">負責人</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="venue in topLevel" :key="venue.id">
            <!-- 上層場館 -->
            <tr class="hover cursor-pointer" @click="goEdit(venue.id)">
              <td>
                <div class="flex items-center gap-3">
                  <button v-if="childrenOf(venue.id).length" type="button" class="btn btn-ghost btn-square"
                    :aria-label="expanded.has(venue.id) ? '收合子場地' : '展開子場地'"
                    :aria-expanded="expanded.has(venue.id)"
                    @click.stop="toggleExpand(venue.id)">
                    <span class="material-symbols-outlined transition-transform"
                      :class="expanded.has(venue.id) ? 'rotate-90' : ''">chevron_right</span>
                  </button>
                  <div v-else class="w-10 shrink-0"></div>
                  <div class="avatar">
                    <div class="w-10 h-10 rounded-lg">
                      <img :src="publicImageUrl(venue.mainImageUrl)" :alt="venue.name" class="object-cover" />
                    </div>
                  </div>
                  <div class="min-w-0">
                    <span class="font-semibold">{{ venue.name }}</span><br />
                    <span v-if="childrenOf(venue.id).length" class="text-base-content/40">
                      {{ childrenOf(venue.id).length }} 個子場地
                    </span>
                  </div>
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
                <div class="dropdown" @click.stop>
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
              <td class="text-sm">
                <span v-if="managerNames(venue).length">{{ managerNames(venue).join('、') }}</span>
                <span v-else class="text-base-content/40">未指派</span>
              </td>
            </tr>

            <!-- 子場地（展開時顯示） -->
            <template v-if="expanded.has(venue.id)">
              <tr v-for="child in childrenOf(venue.id)" :key="child.id" class="hover bg-base-200/40 cursor-pointer" @click="goEdit(child.id)">
                <td>
                  <div class="flex items-center gap-3 pl-10">
                    <div class="w-10 shrink-0"></div>
                    <div class="avatar">
                      <div class="w-8 h-8 rounded-lg">
                        <img :src="publicImageUrl(child.mainImageUrl)" :alt="child.name" class="object-cover" />
                      </div>
                    </div>
                    <div class="min-w-0">
                      <span class="font-medium">{{ child.name }}</span>
                      <p class="text-base-content/40">子場地</p>
                    </div>
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
                  <div class="dropdown" @click.stop>
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
                <td class="text-sm">
                  <span v-if="managerNames(child).length">{{ managerNames(child).join('、') }}</span>
                  <span v-else class="text-base-content/40">未指派</span>
                </td>
              </tr>
            </template>
          </template>

          <tr v-if="topLevel.length === 0">
            <td colspan="4" class="text-center text-base-content/40 py-10">
              {{ hasFilter ? '找不到符合的場館' : '尚未建立任何場館' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import mockVenues from '@/mocks/venues.json'
import mockAdmins from '@/mocks/admins.json'
import { publicImageUrl } from '@/utils/assets'

type Venue = (typeof mockVenues)[number]

const router = useRouter()

function goEdit(id: number) {
  router.push({ name: 'admin-venue-edit', params: { id } })
}

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
</script>
