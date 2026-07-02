<template>
  <PageHeaderBasic title="我的帳戶" description="管理會員資料、身份文件、密碼與留存保證金。" />

  <main class="container lg:max-w-6xl mx-auto py-6 lg:py-10 px-4 space-y-6">
    <div class="flex flex-col lg:flex-row gap-6">
      <div class="flex-1 min-w-0 space-y-6">

        <section class="bg-base-100 border border-base-200 rounded-box shadow-sm p-6">
          <h2 class="text-lg font-bold mb-6">基本資料</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <fieldset class="fieldset">
              <label class="label">姓名</label>
              <input type="text" class="input w-full" :value="user?.name" placeholder="請輸入姓名" />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">聯絡電話</label>
              <input type="tel" class="input w-full" :value="user?.phone" placeholder="請輸入電話" />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">Email</label>
              <input type="email" class="input w-full" :value="user?.email" disabled />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">身份別</label>
              <input type="text" class="input w-full" :value="identityLabel" disabled />
            </fieldset>
          </div>
          <button class="btn btn-primary w-full lg:w-fit">
            <span class="material-symbols-outlined text-base">save</span>
            儲存
          </button>
        </section>

        <section v-if="identityRequiresDocument(user?.identityType)"
          class="bg-base-100 border border-base-200 rounded-box shadow-sm p-6">
          <h2 class="text-lg font-bold mb-6">證明文件</h2>

          <div class="hover-3d max-w-md mx-auto sm:mx-0">
            <figure class="rounded-box overflow-hidden">
              <img :src="digitalStudentIdImage" alt="身份證明文件" class="w-full h-auto" />
            </figure>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>

        </section>
      </div>

      <aside class="space-y-6 w-full lg:w-80 lg:shrink-0">
        <section class="bg-base-100 border border-base-200 rounded-box shadow-sm">
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-primary">savings</span>
              <div>
                <h2 class="font-bold">留存保證金</h2>
                <p class="text-sm text-base-content/50">NT$ {{ retainedDeposit.toLocaleString() }}</p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <button class="btn btn-primary" :disabled="retainedDeposit <= 0" @click="openRefundModal">
                <span class="material-symbols-outlined text-base">currency_exchange</span>
                申請退還保證金
              </button>
              <router-link to="/member/refunds" class="btn btn-ghost">
                <span class="material-symbols-outlined text-base">receipt_long</span>
                查看退款紀錄
              </router-link>
            </div>
          </div>
        </section>

        <section class="bg-base-100 border border-base-200 rounded-box shadow-sm">
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-secondary">lock</span>
              <div>
                <h2 class="font-bold">密碼</h2>
                <p class="text-sm text-base-content/50">維護帳戶登入安全</p>
              </div>
            </div>
            <button class="btn btn-outline w-full" @click="openPasswordModal">
              <span class="material-symbols-outlined text-base">key</span>
              變更密碼
            </button>
          </div>
        </section>
      </aside>
    </div>


  </main>

  <!-- 變更密碼 Modal -->
  <dialog ref="passwordModal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">變更密碼</h3>

      <div class="space-y-3">
        <fieldset class="fieldset">
          <label class="label">目前密碼</label>
          <input v-model="pwForm.current" type="password" class="input w-full" placeholder="請輸入目前密碼" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">新密碼</label>
          <input v-model="pwForm.next" type="password" class="input w-full" placeholder="請輸入新密碼" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">確認新密碼</label>
          <input v-model="pwForm.confirm" type="password" class="input w-full" placeholder="再次輸入新密碼" />
        </fieldset>
        <div v-if="pwError" class="alert alert-error p-2 text-sm">{{ pwError }}</div>
        <div v-if="pwSuccess" class="alert alert-success p-2 text-sm">密碼已變更成功</div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="closePasswordModal">取消</button>
        <button class="btn btn-primary" @click="handleChangePassword">確認變更</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- 預留保證金退款 Modal -->
  <dialog ref="refundModal" class="modal">
    <div class="modal-box max-w-3xl">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 class="font-bold text-lg">申請退還保證金</h3>
          <p class="text-sm text-base-content/60">送出後將由承辦、會計、出納依序處理。</p>
        </div>
        <span class="badge badge-outline">可申請 NT$ {{ retainedDeposit.toLocaleString() }}</span>
      </div>

      <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="submitRetainedDepositRefund">
        <fieldset class="fieldset">
          <label class="label">申請金額</label>
          <label class="input w-full">
            <span class="text-base-content/50">NT$</span>
            <input v-model.number="refundForm.amount" type="number" min="1" :max="retainedDeposit || undefined" />
          </label>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">退款原因</label>
          <input v-model="refundForm.reason" type="text" class="input w-full" placeholder="例如：申請退還留存保證金" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">銀行名稱</label>
          <input v-model="refundForm.bankName" type="text" class="input w-full" placeholder="例如：臺灣銀行" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">分行</label>
          <input v-model="refundForm.branchName" type="text" class="input w-full" placeholder="例如：苗栗分行" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">戶名</label>
          <input v-model="refundForm.accountName" type="text" class="input w-full" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label">帳號</label>
          <input v-model="refundForm.accountNumber" type="text" class="input w-full font-mono"
            placeholder="000-000000000000" />
        </fieldset>

        <div v-if="refundError" class="md:col-span-2 alert alert-error alert-soft p-3 text-sm">
          <span class="material-symbols-outlined">error</span>
          <span>{{ refundError }}</span>
        </div>

        <div class="md:col-span-2 modal-action mt-0">
          <button type="button" class="btn btn-ghost" @click="closeRefundModal">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="!canSubmitRefund">
            <span class="material-symbols-outlined">send</span>
            送出申請
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import PageHeaderBasic from '@/components/portal/PageHeaderBasic.vue'
import { useAuthStore } from '@/stores/auth'
import { useRefundsStore } from '@/stores/refunds'
import { publicImageUrl } from '@/utils/assets'
import { identityName, identityRequiresDocument } from '@/utils/identity'

const authStore = useAuthStore()
const refundsStore = useRefundsStore()
const router = useRouter()
const digitalStudentIdImage = publicImageUrl('digitalStudentID.png')
const user = computed(() => authStore.user)
const retainedDeposit = computed(() => user.value?.retainedDeposit ?? 0)
const identityLabel = computed(() => identityName(user.value?.identityType))

const passwordModal = ref<HTMLDialogElement | null>(null)
const pwForm = ref({ current: '', next: '', confirm: '' })
const pwError = ref('')
const pwSuccess = ref(false)
const refundModal = ref<HTMLDialogElement | null>(null)
const refundError = ref('')
const refundForm = reactive({
  amount: 0,
  reason: '申請退還留存保證金',
  bankName: '',
  branchName: '',
  accountName: '',
  accountNumber: '',
})

const canSubmitRefund = computed(() => Boolean(
  user.value &&
  retainedDeposit.value > 0 &&
  refundForm.amount > 0 &&
  refundForm.amount <= retainedDeposit.value &&
  refundForm.reason.trim() &&
  refundForm.bankName.trim() &&
  refundForm.branchName.trim() &&
  refundForm.accountName.trim() &&
  refundForm.accountNumber.trim()
))

function openPasswordModal() {
  pwForm.value = { current: '', next: '', confirm: '' }
  pwError.value = ''
  pwSuccess.value = false
  passwordModal.value?.showModal()
}

function closePasswordModal() {
  passwordModal.value?.close()
}

function handleChangePassword() {
  pwError.value = ''
  if (!pwForm.value.current) { pwError.value = '請輸入目前密碼'; return }
  if (pwForm.value.next.length < 6) { pwError.value = '新密碼至少需要 6 個字元'; return }
  if (pwForm.value.next !== pwForm.value.confirm) { pwError.value = '兩次輸入的密碼不一致'; return }
  pwSuccess.value = true
  setTimeout(() => closePasswordModal(), 1200)
}

function openRefundModal() {
  refundForm.amount = retainedDeposit.value
  refundForm.reason = '申請退還留存保證金'
  refundForm.bankName = ''
  refundForm.branchName = ''
  refundForm.accountName = user.value?.name ?? ''
  refundForm.accountNumber = ''
  refundError.value = ''
  refundModal.value?.showModal()
}

function closeRefundModal() {
  refundModal.value?.close()
}

function submitRetainedDepositRefund() {
  if (!user.value) {
    refundError.value = '請先登入會員。'
    return
  }
  if (!canSubmitRefund.value) {
    refundError.value = '請完整填寫退款帳戶資料，且申請金額不可超過留存保證金。'
    return
  }

  refundsStore.createRetainedDepositRefund({
    memberId: user.value.id,
    memberName: user.value.name,
    memberEmail: user.value.email,
    memberPhone: user.value.phone,
    amount: refundForm.amount,
    reason: refundForm.reason,
    bankAccount: {
      bankName: refundForm.bankName,
      branchName: refundForm.branchName,
      accountName: refundForm.accountName,
      accountNumber: refundForm.accountNumber,
    },
  })

  refundModal.value?.close()
  router.push('/member/refunds')
}
</script>
