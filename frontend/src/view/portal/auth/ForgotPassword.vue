<template>
  <div class=" flex-1 user-login">
    <div class="hero-content flex-col max-w-md w-full">

      <div class="card w-full bg-base-100 shadow-2xl">
        <div class="card-body">

          <!-- 步驟一：輸入信箱 -->
          <template v-if="step === 1">
            <h2 class="card-title">忘記密碼</h2>
            <p class=" text-sm">輸入您的註冊電子信箱，我們將寄送驗證碼。</p>
            <form class="space-y-4 mt-2" @submit.prevent="handleSendCode">
              <fieldset class="fieldset fieldset-overlay">
                <label class="label">電子信箱</label>
                <input v-model="email" type="email" placeholder="請輸入電子信箱" class="input" autocomplete="email" required />
              </fieldset>
              <div v-if="errorMsg" class="alert alert-error"><span>{{ errorMsg }}</span></div>
              <button type="submit" class="btn btn-neutral w-full tracking-widest">發送驗證碼</button>
            </form>
          </template>

          <!-- 步驟二：輸入驗證碼 -->
          <template v-else-if="step === 2">
            <h2 class="card-title">輸入驗證碼</h2>
            <p class=" text-sm">驗證碼已寄送至 <strong>{{ email }}</strong>，請於 10 分鐘內完成驗證。</p>
            <form class="space-y-4 mt-2" @submit.prevent="handleVerifyCode">
              <fieldset class="fieldset fieldset-overlay">
                <label class="label">驗證碼</label>
                <input v-model="code" type="text" placeholder="請輸入 6 位驗證碼" class="input tracking-widest" maxlength="6"
                  inputmode="numeric" required />
              </fieldset>
              <div v-if="errorMsg" class="alert alert-error"><span>{{ errorMsg }}</span></div>
              <button type="submit" class="btn btn-neutral w-full tracking-widest">確認驗證碼</button>
              <button type="button" class="btn btn-link w-full" @click="resendCode">重新發送驗證碼</button>
            </form>
          </template>

          <!-- 步驟三：重設密碼 -->
          <template v-else-if="step === 3">
            <h2 class="card-title">重設密碼</h2>
            <p class=" text-sm">請設定您的新密碼。</p>
            <form class="space-y-4 mt-2" @submit.prevent="handleResetPassword">
              <fieldset class="fieldset fieldset-overlay">
                <label class="label">新密碼</label>
                <input v-model="newPassword" type="password" placeholder="請輸入新密碼（至少 8 位）" class="input"
                  autocomplete="new-password" required />
                <label class="label">確認新密碼</label>
                <input v-model="confirmPassword" type="password" placeholder="請再次輸入新密碼" class="input"
                  autocomplete="new-password" required />
              </fieldset>
              <div v-if="errorMsg" class="alert alert-error"><span>{{ errorMsg }}</span></div>
              <button type="submit" class="btn btn-neutral w-full tracking-widest">確認重設</button>
            </form>
          </template>

          <!-- 完成 -->
          <template v-else>
            <div class="flex flex-col items-center gap-4 py-4">
              <div class="text-success text-6xl">✓</div>
              <h2 class="card-title">密碼重設成功</h2>
              <p class=" text-sm text-center">您的密碼已完成更新，請使用新密碼登入。</p>
              <router-link to="/login" class="btn btn-neutral w-full tracking-widest">前往登入</router-link>
            </div>
          </template>

          <div class="divider"></div>
          <router-link to="/login" class="btn btn-link w-full">返回登入</router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const step = ref(1)
const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')

function handleSendCode() {
  errorMsg.value = ''
  // TODO: 串接寄送驗證碼 API
  step.value = 2
}

function handleVerifyCode() {
  errorMsg.value = ''
  if (code.value.length !== 6) {
    errorMsg.value = '請輸入 6 位驗證碼。'
    return
  }
  // TODO: 串接驗證碼驗證 API
  step.value = 3
}

function resendCode() {
  code.value = ''
  errorMsg.value = ''
  // TODO: 串接重新寄送 API
}

function handleResetPassword() {
  errorMsg.value = ''
  if (newPassword.value.length < 8) {
    errorMsg.value = '密碼長度至少需要 8 位。'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '兩次輸入的密碼不一致，請重新確認。'
    return
  }
  // TODO: 串接重設密碼 API
  step.value = 4
}
</script>
