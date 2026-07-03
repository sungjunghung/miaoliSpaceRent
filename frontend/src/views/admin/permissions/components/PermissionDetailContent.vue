<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { permissionGroups as mockGroups } from '@/services/permissionService'
import { admins as mockAdmins } from '@/services/adminService'

const props = defineProps<{
  id: string
  /** 整頁版面時基本資料限寬置中；抽屜情境不需要 */
  pageLayout?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isNew = computed(() => props.id === 'new')

interface PermissionGroup {
  id: string
  name: string
  description: string
  isSystem: boolean
  isSuperAdmin: boolean
  memberCount: number
  permissions: string[]
  createdAt: string
  updatedAt: string
}

function emptyGroup(): PermissionGroup {
  return {
    id: '',
    name: '',
    description: '',
    isSystem: false,
    isSuperAdmin: false,
    memberCount: 0,
    permissions: [],
    createdAt: '',
    updatedAt: '',
  }
}

const formData = ref<PermissionGroup>(emptyGroup())

const permissionModules = [
  {
    key: 'venues',
    label: '場館管理',
    icon: 'location_on',
    items: [
      { key: 'venues.view', label: '檢視' },
      { key: 'venues.create', label: '新增' },
      { key: 'venues.edit', label: '編輯' },
      { key: 'venues.delete', label: '刪除' },
    ],
  },
  {
    key: 'bookings',
    label: '預約管理',
    icon: 'calendar_month',
    items: [
      { key: 'bookings.view', label: '檢視' },
      { key: 'bookings.create', label: '新增' },
      { key: 'bookings.edit', label: '編輯' },
      { key: 'bookings.cancel', label: '取消核准' },
      { key: 'bookings.schedule_edit', label: '異動日期' },
      { key: 'bookings.document_review', label: '文件審核' },
      { key: 'bookings.payment_verify', label: '繳費核銷' },
      { key: 'bookings.refund_admin', label: '退費初審' },
      { key: 'bookings.refund_accounting', label: '退費核定' },
      { key: 'bookings.refund_cashier', label: '退費撥款' },
    ],
  },
  {
    key: 'members',
    label: '會員管理',
    icon: 'group',
    items: [
      { key: 'members.view', label: '檢視' },
      { key: 'members.create', label: '新增' },
      { key: 'members.edit', label: '編輯' },
      { key: 'members.delete', label: '刪除' },
    ],
  },
  {
    key: 'admins',
    label: '管理員管理',
    icon: 'manage_accounts',
    items: [
      { key: 'admins.view', label: '檢視' },
      { key: 'admins.create', label: '新增' },
      { key: 'admins.edit', label: '編輯' },
      { key: 'admins.delete', label: '刪除' },
    ],
  },
  {
    key: 'permissions',
    label: '權限管理',
    icon: 'shield',
    items: [
      { key: 'permissions.view', label: '檢視' },
      { key: 'permissions.edit', label: '編輯' },
    ],
  },
  {
    key: 'news',
    label: '最新消息',
    icon: 'newspaper',
    items: [
      { key: 'news.view', label: '檢視' },
      { key: 'news.create', label: '新增' },
      { key: 'news.edit', label: '編輯' },
      { key: 'news.delete', label: '刪除' },
    ],
  },
  {
    key: 'reports',
    label: '報表',
    icon: 'bar_chart',
    items: [
      { key: 'reports.view', label: '檢視' },
      { key: 'reports.export', label: '匯出' },
    ],
  },
]

const members = computed(() =>
  (mockAdmins as any[]).filter(a => a.permissionGroupId === props.id)
)

const totalPermissions = computed(() =>
  permissionModules.reduce((sum, module) => sum + module.items.length, 0)
)

watch(() => props.id, id => {
  if (id === 'new') {
    formData.value = emptyGroup()
    return
  }
  const found = (mockGroups as any[]).find(group => group.id === id)
  formData.value = found ? { ...found, permissions: [...found.permissions] } : emptyGroup()
}, { immediate: true })

function hasPermission(key: string) {
  return formData.value.permissions.includes(key)
}

function togglePermission(key: string) {
  if (formData.value.isSystem) return
  const idx = formData.value.permissions.indexOf(key)
  if (idx >= 0) {
    formData.value.permissions.splice(idx, 1)
  } else {
    formData.value.permissions.push(key)
  }
}

function isModuleAllChecked(module: typeof permissionModules[0]) {
  return module.items.every(item => formData.value.permissions.includes(item.key))
}

function isModulePartialChecked(module: typeof permissionModules[0]) {
  return module.items.some(item => formData.value.permissions.includes(item.key)) && !isModuleAllChecked(module)
}

function toggleModule(module: typeof permissionModules[0]) {
  if (formData.value.isSystem) return
  if (isModuleAllChecked(module)) {
    module.items.forEach(item => {
      const idx = formData.value.permissions.indexOf(item.key)
      if (idx >= 0) formData.value.permissions.splice(idx, 1)
    })
  } else {
    module.items.forEach(item => {
      if (!formData.value.permissions.includes(item.key)) {
        formData.value.permissions.push(item.key)
      }
    })
  }
}

function selectAll() {
  if (formData.value.isSystem) return
  formData.value.permissions = permissionModules.flatMap(module => module.items.map(item => item.key))
}

function clearAll() {
  if (formData.value.isSystem) return
  formData.value.permissions = []
}

function handleSave() {
  alert('儲存成功（prototype 模擬）')
}

function handleDelete() {
  if (confirm(`確定要刪除「${formData.value.name}」權限群組嗎？`)) {
    emit('close')
  }
}
</script>

<template>
  <div :class="props.pageLayout ? 'admin-container-info' : 'admin-container-flush'">
    <div v-if="formData.isSuperAdmin" role="alert" class="alert alert-info mb-4">
      <span class="material-symbols-outlined">verified_user</span>
      <span>此為超級管理員，擁有系統全部權限，且不受權限設定約束。</span>
    </div>
    <div v-else-if="formData.isSystem" role="alert" class="alert alert-warning mb-4">
      <span class="material-symbols-outlined">info</span>
      <span>此為系統內建群組，無法修改權限設定或刪除。</span>
    </div>


    <div class="card basic-card">
      <div class="card-body">
        <h2 class="card-title">基本資料</h2>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">群組名稱</span></label>
            <input v-model="formData.name" type="text" class="input input-bordered w-full" placeholder="請輸入群組名稱"
              :disabled="formData.isSystem" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">說明</span></label>
            <textarea v-model="formData.description" class="textarea textarea-bordered w-full" rows="3"
              placeholder="請輸入群組說明" :disabled="formData.isSystem"></textarea>
          </div>
        </div>
        <div v-if="!isNew" class="flex gap-6 mt-2 text-base-content/40">
          <span>建立日期：{{ formData.createdAt }}</span>
          <span>最後更新：{{ formData.updatedAt }}</span>
        </div>
      </div>
    </div>

    <div v-if="!formData.isSuperAdmin" class="card basic-card">
      <div class="card-body">
        <div class="flex items-center justify-between mb-1">
          <h2 class="card-title">
            權限設定
            <span class="font-normal text-base-content/50">
              已選 {{ formData.permissions.length }} / {{ totalPermissions }} 項
            </span>
          </h2>
          <div v-if="!formData.isSystem" class="flex gap-2">
            <button type="button" class="btn btn-ghost" @click="selectAll">全選</button>
            <button type="button" class="btn btn-ghost" @click="clearAll">清除</button>
          </div>
        </div>

        <progress class="progress progress-primary w-full mb-4" :value="formData.permissions.length"
          :max="totalPermissions"></progress>

        <div class="space-y-4">
          <div v-for="module in permissionModules" :key="module.key"
            class="border border-base-200 rounded-box overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 bg-base-200/50 cursor-pointer select-none"
              :class="{ 'cursor-default': formData.isSystem }" @click="toggleModule(module)">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm"
                  :checked="isModuleAllChecked(module)" :indeterminate="isModulePartialChecked(module)"
                  :disabled="formData.isSystem" @click.stop @change="toggleModule(module)" />
                <span class="material-symbols-outlined text-base text-base-content/60">{{ module.icon }}</span>
                <span class="font-medium">{{ module.label }}</span>
              </div>
              <span class="text-base-content/40">
                {{module.items.filter(item => formData.permissions.includes(item.key)).length}} / {{
                  module.items.length }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-base-200">
              <label v-for="item in module.items" :key="item.key"
                class="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-base-100 transition-colors"
                :class="{ 'bg-primary/5': hasPermission(item.key), 'cursor-default': formData.isSystem }">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" :checked="hasPermission(item.key)"
                  :disabled="formData.isSystem" @change="togglePermission(item.key)" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isNew" class="card basic-card">
      <div class="card-body">
        <h2 class="card-title text-base">
          套用此群組的管理員
          <span class="badge badge-ghost">{{ members.length }} 人</span>
        </h2>

        <div v-if="members.length > 0" class="space-y-2">
          <div v-for="admin in members" :key="admin.id"
            class="flex items-center justify-between border border-base-200 rounded-lg px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="avatar avatar-placeholder">
                <div class="bg-neutral text-neutral-content w-12 rounded-full">
                  <span>{{ admin.name.substring(0, 1).toUpperCase() }}</span>
                </div>
              </div>
              <div>
                <p class="font-medium">{{ admin.name }}</p>
                <p class="text-base-content/50">{{ admin.email }}</p>
              </div>
            </div>
            <router-link :to="{ name: 'admin-admin-detail', params: { id: admin.id } }" class="btn btn-ghost">
              <span class="material-symbols-outlined">open_in_new</span>
            </router-link>
          </div>
        </div>

        <div v-else class="text-base-content/40 py-4 text-center">
          目前沒有管理員套用此群組
        </div>
      </div>
    </div>

    <div class="card basic-card" v-if="!isNew && !formData.isSystem">
      <div class="card-body">
        <h2 class="card-title">刪除此群組</h2>
        <div>
          <button class="btn btn-error btn-outline" @click="handleDelete">
            <span class="material-symbols-outlined">delete</span>
            刪除群組
          </button>
        </div>
      </div>
    </div>

    <div v-if="!formData.isSystem" class="flex">
      <button type="button" class="btn btn-primary px-8" @click="handleSave">
        <span class="material-symbols-outlined">save</span>
        儲存
      </button>
    </div>
  </div>
</template>
