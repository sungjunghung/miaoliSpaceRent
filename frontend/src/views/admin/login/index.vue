<template>
  <div class="admin-login">
    <div class="card basic-card w-full max-w-sm">
      <div class="card-body gap-5">

        <!-- Header -->
        <h1 class="card-title justify-center">
          <img src="@/assets/images/logo.svg" class="h-10" alt=""> 苗栗縣體育場館預約系統
        </h1>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <fieldset class="fieldset">
            <legend class="text-lg font-semibold mb-2">登入</legend>
            <label class="label">帳號</label>
            <input v-model="account" type="text" class="input w-full" placeholder="請輸入管理員帳號" autocomplete="username"
              required />
            <label class="label">密碼</label>
            <input v-model="password" :type="showPassword ? 'text' : 'password'" class="input w-full"
              placeholder="請輸入密碼" autocomplete="current-password" required />
          </fieldset>

          <!-- 我不是機器人 -->
          <div
            class="flex items-center gap-3 border border-base-300 rounded-box px-4 py-3 cursor-pointer select-none transition-colors"
            :class="verified ? 'bg-success/5 border-success/30' : 'hover:bg-base-200/50'" @click="handleVerify">
            <div class="w-6 h-6 flex items-center justify-center shrink-0">
              <span v-if="verifying" class="loading loading-spinner loading-sm"></span>
              <span v-else-if="verified" class="material-symbols-outlined text-success">check_circle</span>
              <div v-else class="w-5 h-5 border-2 border-base-300 rounded"></div>
            </div>
            <span :class="verified ? 'text-success font-medium' : 'text-base-content/70'">
              {{ verified ? '已確認您不是機器人' : '我不是機器人' }}
            </span>
            <div class="ml-auto text-right opacity-40">
              <p class="text-[10px] leading-tight">reCAPTCHA</p>
              <p class="text-[9px] leading-tight">隱私權 · 條款</p>
            </div>
          </div>

          <div v-if="errorMsg" class="alert alert-error p-2">{{ errorMsg }}</div>

          <button type="submit" class="btn btn-neutral w-full tracking-widest" :disabled="!verified">
            登入後台
          </button>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const account = ref('superadmin')
const password = ref('password')
const showPassword = ref(false)
const verified = ref(false)
const verifying = ref(false)
const errorMsg = ref('')

function handleVerify() {
  if (verified.value || verifying.value) return
  verifying.value = true
  setTimeout(() => {
    verifying.value = false
    verified.value = true
  }, 1200)
}

function handleSubmit() {
  if (!verified.value) return
  errorMsg.value = ''
  router.push({ name: 'admin-index' })
}
</script>
