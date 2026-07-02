<template>
  <main class="container mx-auto px-4 py-6 space-y-6">
    <!-- 會員資訊卡 -->
    <section>
      <router-link to="/member/profile" class="card bg-base-100 shadow-sm" aria-label="編輯帳戶">
        <div class="card-body">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full flex items-center justify-center bg-secondary text-primary-content shrink-0">
              <span class="material-symbols-outlined text-3xl">person</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-lg truncate">{{ user?.name || '會員' }}</p>
              <p class="text-sm text-base-content/50 truncate">{{ user?.email }}</p>
              <span class="badge badge-soft badge-secondary badge-sm mt-1">{{ identityLabel }}</span>
            </div>
            <span class="material-symbols-outlined text-xl text-base-content/60 self-start">edit</span>
          </div>
        </div>

     
          <div class="flex items-center gap-2 p-4 border-t border-base-300 justify-between">
   
              <p class="text-xs text-base-content/50">留存保證金</p>
              <p class="font-bold">NT$ {{ retainedDeposit.toLocaleString() }}</p>
   
          </div>
      </router-link>
    </section>

    <!-- 功能選單 -->
    <section>
      <ul class="menu bg-base-100 rounded-box w-full">
        <li v-for="link in memberLinks" :key="link.to">
          <router-link :to="link.to" class="flex items-center">
            <span class="material-symbols-outlined text-2xl text-base-content/70">{{ link.icon }}</span>
            <span class="flex-1">{{ link.label }}</span>
            <span class="material-symbols-outlined text-base text-base-content/30">chevron_right</span>
          </router-link>
        </li>
      </ul>
    </section>

    <!-- 登出 -->
    <button class="btn btn-error w-full" @click="logout">
      <span class="material-symbols-outlined">logout</span>
      登出
    </button>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { identityName } from '@/utils/identity'

const memberLinks = [
  { to: '/member/bookings', label: '我的預訂', icon: 'event_available' },
  { to: '/member/refunds', label: '我的退款', icon: 'currency_exchange' },
]

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const retainedDeposit = computed(() => user.value?.retainedDeposit ?? 0)
const identityLabel = computed(() => identityName(user.value?.identityType))

// 此頁是手機版會員首頁;桌機改用導覽列的頭像選單,直接帶往帳戶頁
onMounted(() => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    router.replace('/member/profile')
  }
})

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
