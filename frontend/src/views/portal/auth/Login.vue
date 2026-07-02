<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')

function handleLogin() {
  errorMsg.value = ''
  const success = authStore.login(email.value, password.value)
  if (!success) {
    errorMsg.value = '帳號或密碼錯誤，請重新輸入。'
    return
  }
  router.push('/member/bookings')
}
</script>

<template>
  <div class="flex-1 user-login">
    <div class="w-full max-w-sm">
      <div class="card w-full bg-base-100 shadow-2xl">
        <div class="card-body">
          <h2 class="card-title">
            登入
          </h2>

          <form class="space-y-5" @submit.prevent="handleLogin">
            <fieldset class="fieldset fieldset-overlay">
              <label class="label">測試帳號</label>
              <select class="select" v-model="email" @change="password = email ? 'password123' : ''">
                <option value="">請選擇</option>
                <option value="xiaoming@example.com">小明</option>
                <option value="meiling@example.com">美玲</option>
                <option value="zhihao@example.com">志豪</option>
              </select>
              <label class="label">帳號（電子信箱）</label>
              <input v-model="email" type="email" placeholder="請輸入電子信箱" class="input" autocomplete="username"
                required />
              <label class="label">密碼</label>
              <input v-model="password" type="password" placeholder="請輸入密碼" class="input"
                autocomplete="current-password" required />
              <p class="text-right">
                <router-link to="/forgot-password" class="btn btn-link">忘記密碼？</router-link>
              </p>
            </fieldset>

            <button type="submit" class="btn btn-neutral w-full tracking-widest">
              登入系統
            </button>

            <div class="divider">或</div>

            <button type="button" class="btn w-full">
              <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4" />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853" />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05" />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335" />
              </svg>
              使用 Google 帳號登入
            </button>
            <div class="divider">或</div>
            <router-link to="/register" class="btn btn-link w-full">用電子信箱註冊一個帳號</router-link>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
