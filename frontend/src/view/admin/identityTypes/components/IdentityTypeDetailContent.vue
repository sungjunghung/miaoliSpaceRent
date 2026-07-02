<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import mockUsers from '@/mocks/users.json'
import { IDENTITY_TYPES, DEFAULT_IDENTITY_TYPE_ID, type IdentityType } from '@/utils/identity'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isNew = computed(() => props.id === 'new')

function emptyType(): IdentityType {
  return {
    id: '',
    name: '',
    requiresDocument: true,
    isDefault: false,
  }
}

const formData = ref<IdentityType>(emptyType())

watch(() => props.id, id => {
  if (id === 'new') {
    formData.value = emptyType()
    return
  }
  const found = IDENTITY_TYPES.find(t => t.id === id)
  formData.value = found ? { ...found } : emptyType()
}, { immediate: true })

// 套用此身份別的會員（未設定者歸為預設身份別）
const members = computed(() =>
  (mockUsers as any[]).filter(u => (u.identityType || DEFAULT_IDENTITY_TYPE_ID) === props.id)
)

function handleSave() {
  alert('儲存成功（prototype 模擬）')
}

function handleDelete() {
  if (formData.value.isDefault) return
  if (members.value.length > 0) {
    alert('仍有會員套用此身份別，無法刪除。')
    return
  }
  if (confirm(`確定要刪除「${formData.value.name}」身份別嗎？`)) {
    emit('close')
  }
}
</script>

<template>
  <div v-if="formData.isDefault" role="alert" class="alert alert-warning mb-4">
    <span class="material-symbols-outlined">info</span>
    <span>此為預設身份別（新會員註冊時的初始身份），無法刪除。</span>
  </div>

  <div class="container max-w-3xl mx-auto space-y-4">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-base">基本資料</h2>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">身份別名稱</span></label>
            <input v-model="formData.name" type="text" class="input input-bordered w-full" placeholder="請輸入身份別名稱" />
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="formData.requiresDocument" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">申請時需上傳證明文件並經審核</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isNew" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-base">
          套用此身份別的會員
          <span class="badge badge-ghost">{{ members.length }} 人</span>
        </h2>

        <div v-if="members.length > 0" class="space-y-2">
          <div v-for="member in members" :key="member.id"
            class="flex items-center justify-between border border-base-200 rounded-lg px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="avatar avatar-placeholder">
                <div class="bg-neutral text-neutral-content w-12 rounded-full">
                  <span>{{ member.name.substring(0, 1).toUpperCase() }}</span>
                </div>
              </div>
              <div>
                <p class="font-medium">{{ member.name }}</p>
                <p class="text-base-content/50">{{ member.email }}</p>
              </div>
            </div>
            <router-link :to="{ name: 'admin-member-detail', params: { id: member.id } }" class="btn btn-ghost">
              <span class="material-symbols-outlined">open_in_new</span>
            </router-link>
          </div>
        </div>

        <div v-else class="text-base-content/40 py-4 text-center">
          目前沒有會員套用此身份別
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm" v-if="!isNew && !formData.isDefault">
      <div class="card-body">
        <h2 class="card-title">刪除此身份別</h2>
        <div>
          <button class="btn btn-error" @click="handleDelete">
            <span class="material-symbols-outlined">delete</span>
            刪除身份別
          </button>
        </div>
      </div>
    </div>

    <div class="flex">
      <button type="button" class="btn btn-primary px-8" @click="handleSave">
        <span class="material-symbols-outlined">save</span>
        儲存
      </button>
    </div>
  </div>
</template>
