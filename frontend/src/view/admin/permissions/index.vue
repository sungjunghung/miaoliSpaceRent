<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <input v-model="search" type="text" class="input" placeholder="搜尋群組名稱" />
      <button class="btn btn-primary" @click="openDrawer('new')">
        <span class="material-symbols-outlined text-lg">add</span>
        新增權限群組
      </button>
    </div>

    <div class="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>群組名稱</th>
            <th>說明</th>
            <th>權限數</th>
            <th>成員數</th>
            <th>更新日期</th>
            <th class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in filtered" :key="group.id" class="hover">
            <td>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ group.name }}</span>
                <span v-if="group.isSystem" class="badge badge-warning">系統</span>
              </div>
            </td>
            <td class="text-base-content/60 max-w-xs truncate">{{ group.description }}</td>
            <td>
              <span class="badge badge-ghost">{{ group.permissions.length }} 項</span>
            </td>
            <td>
              <span class="badge" :class="group.memberCount > 0 ? 'badge-info' : 'badge-ghost'">{{
                group.memberCount }} 人</span>
            </td>
            <td class="text-base-content/60">{{ group.updatedAt }}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯" @click="openDrawer(group.id)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除"
                  :disabled="group.isSystem">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="text-center text-base-content/40 py-10">找不到符合的權限群組</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 權限摘要 -->
    <div class="flex items-center justify-between">
      <p class="text-base-content/40">共 {{ filtered.length }} 個權限群組</p>
    </div>

    <AdminSlideDrawer
      v-if="selectedGroupId"
      :eyebrow="selectedGroupId === 'new' ? '新增權限群組' : '權限群組詳情'"
      :title="selectedGroupTitle"
      :open-to="{ name: 'admin-permission-detail', params: { id: selectedGroupId } }"
      aria-label="關閉權限群組詳情"
      @close="closeDrawer"
    >
      <PermissionDetailContent :id="selectedGroupId" @close="closeDrawer" />
    </AdminSlideDrawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import mockGroups from '@/mocks/permissionGroups.json'
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue'
import PermissionDetailContent from './components/PermissionDetailContent.vue'

const search = ref('')
const selectedGroupId = ref<string | null>(null)

const filtered = computed(() =>
  mockGroups.filter(g =>
    !search.value || g.name.includes(search.value) || g.description.includes(search.value)
  )
)

const selectedGroupTitle = computed(() => {
  if (selectedGroupId.value === 'new') return '新增權限群組'
  return mockGroups.find(group => group.id === selectedGroupId.value)?.name ?? '權限群組'
})

function openDrawer(id: string) {
  selectedGroupId.value = id
}

function closeDrawer() {
  selectedGroupId.value = null
}
</script>
