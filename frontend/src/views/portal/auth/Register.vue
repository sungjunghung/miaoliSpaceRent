<template>
  <div class=" flex-1 user-login">
    <div class="hero-content flex-col lg:flex-row max-w-6xl gap-24">


      <div class="card md:w-96 shrink-0 bg-base-100 shadow-2xl">
        <div class="card-body">
          <h2 class="card-title">建立帳號</h2>

          <form class="space-y-5" @submit.prevent="handleRegister">
            <fieldset class="fieldset fieldset-overlay">
              <label class="label">姓名</label>
              <input v-model="form.name" type="text" placeholder="請輸入姓名" class="input" autocomplete="name" required />

              <label class="label">電子信箱</label>
              <input v-model="form.email" type="email" placeholder="請輸入電子信箱" class="input" autocomplete="email"
                required />

              <label class="label">密碼</label>
              <input v-model="form.password" type="password" placeholder="請輸入密碼（至少 8 位）" class="input"
                autocomplete="new-password" required />

              <label class="label">確認密碼</label>
              <input v-model="form.confirmPassword" type="password" placeholder="請再次輸入密碼" class="input"
                autocomplete="new-password" required />
            </fieldset>

            <div v-if="errorMsg" class="alert alert-error">
              <span>{{ errorMsg }}</span>
            </div>

            <button type="submit" class="btn btn-neutral w-full tracking-widest">
              立即註冊
            </button>

            <div class="divider">已有帳號？</div>

            <router-link to="/login" class="btn btn-link w-full">返回登入</router-link>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errorMsg = ref('')

function handleRegister() {
  errorMsg.value = ''

  if (form.password !== form.confirmPassword) {
    errorMsg.value = '兩次輸入的密碼不一致，請重新確認。'
    return
  }

  if (form.password.length < 8) {
    errorMsg.value = '密碼長度至少需要 8 位。'
    return
  }

  // TODO: 串接 API
  router.push('/register/confirmation')
}
</script>
