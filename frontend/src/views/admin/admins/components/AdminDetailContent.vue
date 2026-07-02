<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { admins as mockAdmins } from '@/services/adminService'
import { venues as mockVenues } from '@/services/venueService'
import { permissionGroups as mockGroups } from '@/services/permissionService'

const props = defineProps<{
  id: string
}>()

defineEmits<{
  close: []
}>()

const isNew = computed(() => props.id === 'new')

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  permissionGroupId: string
  avatar: string
  managedVenues: number[]
  createdAt: string
  lastLoginAt: string
}

function createEmptyAdmin(): Admin {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
    permissionGroupId: '',
    avatar: '',
    managedVenues: [],
    createdAt: '',
    lastLoginAt: '',
  }
}

const formData = ref<Admin>(createEmptyAdmin())

const topLevelVenues = computed(() =>
  (mockVenues as any[]).filter(v => v.parentId === null)
)

watch(
  () => props.id,
  id => {
    if (id === 'new') {
      formData.value = createEmptyAdmin()
      return
    }

    const found = mockAdmins.find(a => a.id === id)
    formData.value = found
      ? {
          id: found.id,
          name: found.name,
          email: found.email,
          phone: found.phone,
          permissionGroupId: (found as any).permissionGroupId ?? '',
          avatar: found.avatar,
          managedVenues: (found as any).managedVenues ?? [],
          createdAt: found.createdAt,
          lastLoginAt: found.lastLoginAt,
        }
      : createEmptyAdmin()
  },
  { immediate: true }
)

function toggleVenue(venueId: number) {
  const idx = formData.value.managedVenues.indexOf(venueId)
  if (idx >= 0) {
    formData.value.managedVenues.splice(idx, 1)
  } else {
    formData.value.managedVenues.push(venueId)
  }
}

function selectAllVenues() {
  formData.value.managedVenues = topLevelVenues.value.map((v: any) => v.id)
}

function clearAllVenues() {
  formData.value.managedVenues = []
}

function handleSave() {
  alert('儲存成功（prototype 模擬）')
}

const selectedGroup = computed(() =>
  mockGroups.find(g => g.id === formData.value.permissionGroupId)
)

// 超級管理員由系統保留設定，後台不提供權限群組／負責場館的指派
const isSuperAdminGroup = computed(() => selectedGroup.value?.isSuperAdmin === true)
const assignableGroups = computed(() => mockGroups.filter(g => !g.isSuperAdmin))

const PERMISSION_LABELS: Record<string, string> = {
  'venues.view': '場館檢視',
  'venues.create': '場館新增',
  'venues.edit': '場館編輯',
  'venues.delete': '場館刪除',
  'bookings.view': '預約檢視',
  'bookings.create': '預約新增',
  'bookings.edit': '預約編輯',
  'bookings.cancel': '預約取消',
  'members.view': '會員檢視',
  'members.create': '會員新增',
  'members.edit': '會員編輯',
  'members.delete': '會員刪除',
  'admins.view': '管理員檢視',
  'admins.create': '管理員新增',
  'admins.edit': '管理員編輯',
  'admins.delete': '管理員刪除',
  'permissions.view': '權限檢視',
  'permissions.edit': '權限編輯',
  'news.view': '消息檢視',
  'news.create': '消息新增',
  'news.edit': '消息編輯',
  'news.delete': '消息刪除',
  'reports.view': '報表檢視',
  'reports.export': '報表匯出',
}
</script>

<template>
  <div class="space-y-4 p-4 max-w-3xl mx-auto">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">基本資料</h2>

        <div class="flex items-center gap-4 mb-4">
          <div class="avatar">
            <div class="w-16 h-16 rounded-full">
              <img v-if="formData.avatar" :src="formData.avatar" alt="avatar" />
              <div v-else class="bg-base-300 w-full h-full flex items-center justify-center">
                <span class="material-symbols-outlined text-base-content/30">person</span>
              </div>
            </div>
          </div>
          <div v-if="!isNew" class="text-base-content/50">
            <p>建立日期：{{ formData.createdAt }}</p>
            <p>最後登入：{{ formData.lastLoginAt }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">姓名</span></label>
            <input v-model="formData.name" type="text" class="input input-bordered w-full" placeholder="請輸入姓名"
              :disabled="isSuperAdminGroup" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">電子信箱</span></label>
            <input v-model="formData.email" type="email" class="input input-bordered w-full" placeholder="請輸入信箱"
              :disabled="isSuperAdminGroup" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">電話</span></label>
            <input v-model="formData.phone" type="text" class="input input-bordered w-full" placeholder="請輸入電話"
              :disabled="isSuperAdminGroup" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">頭像網址</span></label>
            <input v-model="formData.avatar" type="text" class="input input-bordered w-full" placeholder="https://..."
              :disabled="isSuperAdminGroup" />
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">權限群組</h2>

        <template v-if="isSuperAdminGroup">
          <div class="flex items-center gap-2">
            <span class="badge badge-error">超級管理員</span>
          </div>
          <p class="text-base-content/60">
            此帳號為超級管理員，擁有系統全部權限，且不受權限群組與負責場館設定約束（皆由系統保留）。
          </p>
        </template>

        <template v-else>
          <div class="form-control">
            <label class="label"><span class="label-text">指定權限群組</span></label>
            <select v-model="formData.permissionGroupId" class="select select-bordered w-full">
              <option value="" disabled>請選擇權限群組</option>
              <option v-for="group in assignableGroups" :key="group.id" :value="group.id">
                {{ group.name }}
                <template v-if="group.isSystem"> (系統預設)</template>
              </option>
            </select>
          </div>

          <div v-if="selectedGroup" class="mt-3 p-4 bg-base-200/50 rounded-lg space-y-3">
            <div class="flex items-center gap-2">
              <span
                class="badge"
                :class="{
                  'badge-primary': selectedGroup.id === 'role-002',
                  'badge-ghost': selectedGroup.id === 'role-003',
                  'badge-info': !['role-002', 'role-003'].includes(selectedGroup.id),
                }"
              >
                {{ selectedGroup.name }}
              </span>
              <span v-if="selectedGroup.isSystem" class="badge badge-ghost">系統預設</span>
            </div>
            <p class="text-base-content/60">{{ selectedGroup.description }}</p>
            <div>
              <p class="text-base-content/50 mb-1">包含權限：</p>
              <div class="flex flex-wrap gap-1">
                <span v-for="perm in selectedGroup.permissions" :key="perm" class="badge">
                  {{ PERMISSION_LABELS[perm] ?? perm }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="!isSuperAdminGroup" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h2 class="card-title">負責場館</h2>
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost" @click="selectAllVenues">全選</button>
            <button type="button" class="btn btn-ghost" @click="clearAllVenues">清除</button>
          </div>
        </div>
        <p class="text-base-content/50 mb-2">勾選此管理員負責管理的場館</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label
            v-for="venue in topLevelVenues"
            :key="venue.id"
            class="label cursor-pointer justify-start gap-3 border border-base-300 rounded-lg px-4 py-3"
            :class="{ 'bg-primary/5 border-primary/30': formData.managedVenues.includes(venue.id) }"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm"
              :checked="formData.managedVenues.includes(venue.id)"
              @change="toggleVenue(venue.id)"
            />
            <span>{{ venue.name }}</span>
          </label>
        </div>
        <p class="text-base-content/40 mt-2">已選擇 {{ formData.managedVenues.length }} / {{ topLevelVenues.length }} 個場館</p>
      </div>
    </div>

    <div v-if="!isSuperAdminGroup" class="flex justify-end">
      <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存</button>
    </div>
  </div>
</template>
