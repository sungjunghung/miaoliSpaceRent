<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <input v-model="search" type="text" class="input" placeholder="搜尋身份別名稱" />
      <button class="btn btn-primary" @click="openDrawer('new')">
        <span class="material-symbols-outlined text-lg">add</span>
        新增身份別
      </button>
    </div>

    <div class="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>身份別名稱</th>
            <th>證明文件</th>
            <th>套用會員數</th>
            <th class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="type in filtered" :key="type.id" class="hover">
            <td>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ type.name }}</span>
                <span v-if="type.isDefault" class="badge badge-warning">預設</span>
              </div>
            </td>
            <td>
              <span v-if="type.requiresDocument" class="badge badge-info">需審核文件</span>
              <span v-else class="badge badge-ghost">免附</span>
            </td>
            <td>
              <span class="badge" :class="memberCount(type.id) > 0 ? 'badge-info' : 'badge-ghost'">
                {{ memberCount(type.id) }} 人
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯" @click="openDrawer(type.id)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除"
                  :disabled="type.isDefault">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="4" class="text-center text-base-content/40 py-10">找不到符合的身份別</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-base-content/40">共 {{ filtered.length }} 種身份別</p>
    </div>

    <AdminSlideDrawer
      v-if="selectedTypeId"
      :eyebrow="selectedTypeId === 'new' ? '新增身份別' : '身份別詳情'"
      :title="selectedTypeTitle"
      :open-to="{ name: 'admin-identity-type-detail', params: { id: selectedTypeId } }"
      aria-label="關閉身份別詳情"
      @close="closeDrawer"
    >
      <IdentityTypeDetailContent :id="selectedTypeId" @close="closeDrawer" />
    </AdminSlideDrawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import mockUsers from '@/mocks/users.json'
import { IDENTITY_TYPES, DEFAULT_IDENTITY_TYPE_ID } from '@/utils/identity'
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue'
import IdentityTypeDetailContent from './components/IdentityTypeDetailContent.vue'

const search = ref('')
const selectedTypeId = ref<string | null>(null)

const filtered = computed(() =>
  IDENTITY_TYPES.filter(t => !search.value || t.name.includes(search.value))
)

function memberCount(typeId: string) {
  return (mockUsers as any[]).filter(u => (u.identityType || DEFAULT_IDENTITY_TYPE_ID) === typeId).length
}

const selectedTypeTitle = computed(() => {
  if (selectedTypeId.value === 'new') return '新增身份別'
  return IDENTITY_TYPES.find(t => t.id === selectedTypeId.value)?.name ?? '身份別'
})

function openDrawer(id: string) {
  selectedTypeId.value = id
}

function closeDrawer() {
  selectedTypeId.value = null
}
</script>
