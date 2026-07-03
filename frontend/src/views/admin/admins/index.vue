<template>
  <div class="space-y-4 p-4">

    <div class="flex items-center justify-between">
       <label class="input">
          <span class="material-symbols-outlined text-lg">search</span>
      <input v-model="search" type="text" placeholder="搜尋姓名或信箱" />
      </label>
      <button class="btn btn-primary" @click="openDrawer('new')">
        <span class="material-symbols-outlined">person_add</span>
        新增管理員
      </button>
    </div>

    <div class="basis-table">
      <table class="table">
        <thead>
          <tr>
            <th>管理員</th>
            <th>權限群組</th>
            <th>負責場館</th>
            <th>最後登入</th>
            <th>建立日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in filtered" :key="admin.id" class="hover" @click="openDrawer(admin.id)">
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar avatar-placeholder">
                  <div class="bg-neutral text-neutral-content w-8 rounded-full">
                    <span >{{ admin.name.charAt(0) }}</span>
                  </div>
                </div>
                <div>
                  <p class="font-semibold">{{ admin.name }}</p>
                  <p class="text-base-content/50">{{ admin.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" :class="{ 'badge-error': isSuperAdmin(admin) }">{{ getGroupName(admin.permissionGroupId) }}</span>
            </td>
            <td class="max-w-48 align-top py-3">
              <div v-if="isSuperAdmin(admin)" class="text-base-content/50">不受限制</div>
              <div v-else-if="!admin.managedVenues || admin.managedVenues.length === 0" class="text-base-content/50">—</div>
              <div v-else-if="admin.managedVenues.length === topLevelVenues.length">全部場館</div>
              <ul v-else class="list-disc list-inside space-y-0.5">
                <li v-for="venueId in admin.managedVenues" :key="venueId">
                  {{topLevelVenues.find((v: any) => v.id === venueId)?.name}}
                </li>
              </ul>
            </td>
            <td class="text-base-content/60">{{ admin.lastLoginAt }}</td>
            <td class="text-base-content/60">{{ admin.createdAt }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="text-center text-base-content/40 py-10">找不到符合的管理員</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-base-content/40">共 {{ filtered.length }} 位管理員</p>

    <AdminSlideDrawer
      v-if="selectedAdminId"
      :eyebrow="selectedAdminId === 'new' ? '新增管理員' : '管理員詳情'"
      :title="selectedAdminTitle"
      :open-to="{ name: 'admin-admin-detail', params: { id: selectedAdminId } }"
      aria-label="關閉管理員詳情"
      @close="closeDrawer"
    >
      <AdminDetailContent :id="selectedAdminId" @close="closeDrawer" />
    </AdminSlideDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { admins as mockAdmins } from '@/services/adminService'
import { permissionGroups as mockGroups } from '@/services/permissionService'
import { venues as mockVenues } from '@/services/venueService'
import AdminSlideDrawer from '@/components/admin/AdminSlideDrawer.vue'
import AdminDetailContent from './components/AdminDetailContent.vue'

const search = ref('')
const selectedAdminId = ref<string | null>(null)

const filtered = computed(() =>
  mockAdmins.filter(a =>
    !search.value || a.name.includes(search.value) || a.email.includes(search.value)
  )
)

const topLevelVenues = (mockVenues as any[]).filter(v => v.parentId === null)

const selectedAdminTitle = computed(() => {
  if (selectedAdminId.value === 'new') return '新增管理員'
  return mockAdmins.find(admin => admin.id === selectedAdminId.value)?.name ?? '管理員詳情'
})

function getGroupName(groupId: string) {
  return mockGroups.find(g => g.id === groupId)?.name ?? '未指定'
}

function isSuperAdmin(admin: { permissionGroupId: string }) {
  return mockGroups.find(g => g.id === admin.permissionGroupId)?.isSuperAdmin === true
}

function openDrawer(id: string) {
  selectedAdminId.value = id
}

function closeDrawer() {
  selectedAdminId.value = null
}

</script>
