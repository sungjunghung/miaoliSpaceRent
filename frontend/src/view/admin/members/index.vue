<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <div class="flex-1 flex gap-2">
        <input v-model="search" type="text" class="input" placeholder="搜尋姓名、信箱或電話" />
      </div>
      <button class="btn btn-primary" @click="openDrawer('new')">
        <span class="material-symbols-outlined text-lg">person_add</span>
        新增會員
      </button>
    </div>

    <div class="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>會員</th>
            <th>註冊方式</th>
            <th>電子信箱</th>
            <th>電話</th>
            <th class="text-right">留存保證金</th>
            <th class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginated" :key="user.id" class="hover">
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar avatar-placeholder">
                  <div class="bg-neutral text-neutral-content w-8 rounded-full">
                    <span>{{ user.name.charAt(0) }}</span>
                  </div>
                </div>
                <span class="font-semibold">{{ user.name }}</span>
              </div>
            </td>
            <td>
              <div v-if="user.provider === 'google'" class="badge badge-outline badge-sm border-base-300">Google</div>
              <div v-else class="badge badge-ghost badge-sm">電子郵件</div>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.phone }}</td>
            <td class="text-right tabular-nums">
              <span v-if="user.retainedDeposit" class="text-info font-medium">NT$ {{ user.retainedDeposit.toLocaleString() }}</span>
              <span v-else class="text-base-content/30">—</span>
            </td>
            <td>
              <div class="flex gap-1">
                <button
                  class="btn btn-ghost btn-square tooltip"
                  title="編輯"
                  data-tip="編輯"
                  @click="openDrawer(user.id)"
                >
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="text-center text-base-content/40 py-10">找不到符合的會員</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁 -->
    <div class="flex items-center justify-between">
      <p class="text-base-content/40">
        共 {{ filtered.length }} 位會員，顯示第 {{ pageStart }}–{{ pageEnd }} 筆
      </p>
      <div class="join">
        <button class="join-item btn" :disabled="currentPage === 1" @click="currentPage--">«</button>
        <button v-for="p in totalPages" :key="p" class="join-item btn" :class="{ 'btn-active': p === currentPage }"
          @click="currentPage = p">{{ p }}</button>
        <button class="join-item btn" :disabled="currentPage === totalPages" @click="currentPage++">»</button>
      </div>
    </div>

    <AdminSlideDrawer
      v-if="selectedMemberId"
      :eyebrow="selectedMemberId === 'new' ? '新增會員' : '會員詳情'"
      :title="selectedMemberTitle"
      :open-to="{ name: 'admin-member-detail', params: { id: selectedMemberId } }"
      max-width-class="max-w-5xl"
      aria-label="關閉會員詳情"
      @close="closeDrawer"
    >
      <MemberDetailContent :id="selectedMemberId" @close="closeDrawer" />
    </AdminSlideDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import mockUsers from '../../../mocks/users.json'
import AdminSlideDrawer from '../../../components/admin/AdminSlideDrawer.vue'
import MemberDetailContent from './components/MemberDetailContent.vue'

const PAGE_SIZE = 10

const search = ref('')
const currentPage = ref(1)
const selectedMemberId = ref<string | null>(null)

const filtered = computed(() =>
  mockUsers.filter(u => {
    if (!search.value) return true
    const q = search.value
    return u.name.includes(q) || u.email.includes(q) || u.phone.includes(q)
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1)
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, filtered.value.length))

const paginated = computed(() =>
  filtered.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

const selectedMemberTitle = computed(() => {
  if (selectedMemberId.value === 'new') return '新增會員'
  return mockUsers.find(user => user.id === selectedMemberId.value)?.name ?? '會員詳情'
})

function openDrawer(id: string) {
  selectedMemberId.value = id
}

function closeDrawer() {
  selectedMemberId.value = null
}

watch(search, () => { currentPage.value = 1 })
</script>
