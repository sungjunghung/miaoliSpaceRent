<script setup lang="ts">
import { ref, computed } from 'vue'
import mockAdmins from '@/mocks/admins.json'
import mockGroups from '@/mocks/permissionGroups.json'
import mockVenues from '@/mocks/venues.json'

// 模擬當前登入的管理員（prototype 用第一位）
const admin = ref(mockAdmins[0])
const group = computed(() => mockGroups.find(g => g.id === admin.value.permissionGroupId))

const managedVenueNames = computed(() =>
  admin.value.managedVenues.map(id => {
    const v = mockVenues.find((venue: any) => venue.id === id)
    return v ? (v as any).name : `場館 #${id}`
  })
)

// ── 個人資料編輯 ──
const isEditing = ref(false)
const editForm = ref({ name: '', phone: '', email: '' })

function startEdit() {
  editForm.value = { name: admin.value.name, phone: admin.value.phone, email: admin.value.email }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function saveProfile() {
  admin.value.name = editForm.value.name
  admin.value.phone = editForm.value.phone
  admin.value.email = editForm.value.email
  isEditing.value = false
}

// ── 密碼變更 Modal ──
const passwordModalOpen = ref(false)
const passwordForm = ref({ current: '', newPassword: '', confirmPassword: '' })
const passwordError = ref('')
const passwordSuccess = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

function openPasswordModal() {
  passwordForm.value = { current: '', newPassword: '', confirmPassword: '' }
  passwordError.value = ''
  passwordSuccess.value = false
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  passwordModalOpen.value = true
}

const passwordValid = computed(() => {
  const { current, newPassword, confirmPassword } = passwordForm.value
  return current.length > 0 && newPassword.length >= 8 && confirmPassword === newPassword
})

function submitPassword() {
  passwordError.value = ''

  if (!passwordForm.value.current) {
    passwordError.value = '請輸入目前密碼'
    return
  }
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = '新密碼至少需 8 個字元'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '新密碼與確認密碼不一致'
    return
  }
  if (passwordForm.value.current === passwordForm.value.newPassword) {
    passwordError.value = '新密碼不能與目前密碼相同'
    return
  }

  // Prototype: 模擬成功
  passwordSuccess.value = true
  setTimeout(() => {
    passwordModalOpen.value = false
  }, 1500)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-4">

    <!-- 個人資料卡 -->
    <div class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-base">個人資料</h3>
          <button v-if="!isEditing" class="btn btn-ghost gap-1" @click="startEdit">
            <span class="material-symbols-outlined">edit</span>
            編輯
          </button>
        </div>

        <!-- 顯示模式 -->
        <div v-if="!isEditing" class="flex gap-6">
      
          <table class="table">
            <tbody>
              <tr>
                <td class="text-base-content/50 w-24">姓名</td>
                <td class="font-medium">{{ admin.name }}</td>
              </tr>
              <tr>
                <td class="text-base-content/50">電子郵件</td>
                <td>{{ admin.email }}</td>
              </tr>
              <tr>
                <td class="text-base-content/50">電話</td>
                <td>{{ admin.phone }}</td>
              </tr>
              <tr>
                <td class="text-base-content/50">帳號建立</td>
                <td>{{ admin.createdAt }}</td>
              </tr>
              <tr>
                <td class="text-base-content/50">最後登入</td>
                <td>{{ admin.lastLoginAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 編輯模式 -->
        <div v-else class="space-y-4">
          <div class="flex gap-6">
            <div class="avatar">
              <div class="w-20 rounded-full ring ring-primary">
                <img :src="admin.avatar" :alt="admin.name" />
              </div>
            </div>
            <div class="flex-1 space-y-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">姓名</legend>
                <input v-model="editForm.name" type="text" class="input input-bordered w-full" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">電子郵件</legend>
                <input v-model="editForm.email" type="email" class="input input-bordered w-full" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">電話</legend>
                <input v-model="editForm.phone" type="tel" class="input input-bordered w-full" />
              </fieldset>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost" @click="cancelEdit">取消</button>
            <button class="btn btn-primary" @click="saveProfile" :disabled="!editForm.name.trim()">
              <span class="material-symbols-outlined">save</span>
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 權限與場館 -->
    <div class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base mb-3">權限與負責場館</h3>
        <table class="table">
          <tbody>
            <tr>
              <td class="text-base-content/50 w-24">權限群組</td>
              <td>
                <span v-if="group" class="badge badge-primary">{{ group.name }}</span>
                <span v-else class="text-base-content/40">未指定</span>
              </td>
            </tr>
            <tr v-if="group?.description">
              <td class="text-base-content/50">說明</td>
              <td class="text-base-content/60">{{ group.description }}</td>
            </tr>
            <tr>
              <td class="text-base-content/50">負責場館</td>
              <td>
                <div v-if="managedVenueNames.length" class="flex flex-wrap gap-1">
                  <span v-for="name in managedVenueNames" :key="name" class="badge badge-outline">{{ name }}</span>
                </div>
                <span v-else class="text-base-content/40">無</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 安全性設定 -->
    <div class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body">
        <h3 class="font-bold text-base mb-3">安全性設定</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">登入密碼</p>
            <p class="text-base-content/50">定期更換密碼以確保帳號安全</p>
          </div>
          <button class="btn btn-warning btn-outline gap-1" @click="openPasswordModal">
            <span class="material-symbols-outlined">lock_reset</span>
            變更密碼
          </button>
        </div>
      </div>
    </div>

    <!-- 變更密碼 Modal -->
    <dialog class="modal" :class="{ 'modal-open': passwordModalOpen }">
      <div class="modal-box max-w-sm">
        <button class="btn btn-circle btn-ghost absolute right-2 top-2" @click="passwordModalOpen = false">✕</button>
        <h3 class="font-bold mb-4">
          <span class="material-symbols-outlined align-middle mr-1">lock_reset</span>
          變更密碼
        </h3>

        <!-- 成功訊息 -->
        <div v-if="passwordSuccess" class="flex flex-col items-center gap-3 py-6">
          <span class="material-symbols-outlined text-5xl text-success">check_circle</span>
          <p class="font-bold text-success">密碼變更成功</p>
        </div>

        <!-- 表單 -->
        <div v-else class="space-y-4">
          <div v-if="passwordError" class="alert alert-error alert-soft py-2">
            <span class="material-symbols-outlined text-base">error</span>
            <span>{{ passwordError }}</span>
          </div>

          <!-- 目前密碼 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">目前密碼 <span class="text-error">*</span></legend>
            <label class="input input-bordered w-full">
              <span class="material-symbols-outlined text-base-content/40">lock</span>
              <input
                v-model="passwordForm.current"
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="請輸入目前密碼"
                autocomplete="current-password"
              />
              <button type="button" class="btn btn-ghost btn-circle" @click="showCurrentPassword = !showCurrentPassword">
                <span class="material-symbols-outlined">{{ showCurrentPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </label>
          </fieldset>

          <div class="divider my-0"></div>

          <!-- 新密碼 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">新密碼 <span class="text-error">*</span></legend>
            <label class="input input-bordered w-full">
              <span class="material-symbols-outlined text-base-content/40">key</span>
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="至少 8 個字元"
                autocomplete="new-password"
              />
              <button type="button" class="btn btn-ghost btn-circle" @click="showNewPassword = !showNewPassword">
                <span class="material-symbols-outlined">{{ showNewPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </label>
            <p v-if="passwordForm.newPassword && passwordForm.newPassword.length < 8" class="text-error mt-1">
              密碼至少需 8 個字元
            </p>
          </fieldset>

          <!-- 確認新密碼 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">確認新密碼 <span class="text-error">*</span></legend>
            <label class="input input-bordered w-full">
              <span class="material-symbols-outlined text-base-content/40">key</span>
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次輸入新密碼"
                autocomplete="new-password"
              />
              <button type="button" class="btn btn-ghost btn-circle" @click="showConfirmPassword = !showConfirmPassword">
                <span class="material-symbols-outlined">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </label>
            <p v-if="passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword" class="text-error mt-1">
              密碼不一致
            </p>
          </fieldset>

          <div class="modal-action">
            <button class="btn btn-ghost" @click="passwordModalOpen = false">取消</button>
            <button class="btn btn-primary" :disabled="!passwordValid" @click="submitPassword">
              <span class="material-symbols-outlined">check</span>
              確認變更
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="passwordModalOpen = false">close</button></form>
    </dialog>

  </div>
</template>
