<template>
  <div class=" flex-1 user-login">
    <div class="hero-content flex-col max-w-md w-full text-center">
      <div class="card w-full bg-base-100 shadow-2xl">
        <div class="card-body items-center gap-4">

          <!-- 待驗證 -->
          <template v-if="!verified">
            <div class="text-7xl">📧</div>
            <h2 class="card-title text-2xl">請驗證您的電子信箱</h2>
            <p class="">
              我們已將驗證信寄送至您的信箱。<br />
              請開啟信件並點擊驗證連結以完成註冊。
            </p>
            <div class="alert alert-info w-full text-left">
              <span class="material-symbols-outlined shrink-0">info</span>
              <span>若未收到信件，請檢查垃圾郵件資料夾。驗證連結將於 24 小時後失效。</span>
            </div>
            <div class="divider w-full"></div>
            <router-link to="/login" class="btn btn-neutral w-full tracking-widest">前往登入</router-link>
            <router-link to="/register" class="btn btn-link w-full">重新註冊</router-link>
            <router-link to="/register/confirmation?verified=true"
              class="btn btn-outline btn-sm w-full">模擬驗證完成</router-link>
          </template>

          <!-- 驗證完成 -->
          <template v-else>
            <div class="text-7xl">✅</div>
            <h2 class="card-title text-2xl">驗證成功！</h2>
            <p class="">
              您的電子信箱已完成驗證。<br />
              歡迎加入苗栗場館租借平台！
            </p>
            <div class="divider w-full"></div>
            <router-link to="/login" class="btn btn-neutral w-full tracking-widest">前往登入</router-link>
          </template>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const verified = computed(() => route.query.verified === 'true')
</script>
