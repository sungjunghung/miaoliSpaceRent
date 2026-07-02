<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeaderBasic from '@/components/portal/PageHeaderBasic.vue'
import venues from '@/mocks/venues.json'
import { useAuthStore } from '@/stores/auth'
import { publicImageUrl } from '@/utils/assets'
import { IDENTITY_TYPES, DEFAULT_IDENTITY_TYPE_ID } from '@/utils/identity'

const route = useRoute()
const router = useRouter()

const venue = computed(() => {
  const id = Number(route.params.id)
  return venues.find(v => v.id === id)
})

// Mock 預約摘要（模擬從上一頁帶過來的資料）
const mockBooking = computed(() => {
  if (!venue.value) return null
  const rm = venue.value.rentalModes
  if (rm.daily?.enabled) {
    return {
      mode: 'daily' as const,
      modeLabel: '全日租借',
      startDate: '2026-04-20',
      endDate: '2026-04-22',
      days: 3,
      unitPrice: venue.value.pricing.daily?.weekday ?? 0,
      dayType: '平日',
    }
  }
  if (rm.session?.enabled) {
    const sessions = rm.session.sessions ?? []
    const session = sessions[0]
    if (!session) return null
    return {
      mode: 'session' as const,
      modeLabel: '時段租借',
      date: '2026-04-18',
      sessionCode: session.name,
      sessionLabel: session.name,
      sessionTime: `${session.startTime} - ${session.endTime}`,
      unitPrice: session.weekday ?? 0,
      dayType: '平日',
    }
  }
  if (rm.hourly?.enabled) {
    return {
      mode: 'hourly' as const,
      modeLabel: '小時租借',
      date: '2026-04-18',
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      unitPrice: venue.value.pricing.hourly?.weekday ?? venue.value.pricePerHour ?? 0,
      dayType: '平日',
    }
  }
  return null
})

const baseFee = computed(() => {
  const b = mockBooking.value
  if (!b) return 0
  if (b.mode === 'daily') return b.unitPrice * b.days
  if (b.mode === 'hourly') return b.unitPrice * b.hours
  return b.unitPrice
})

const authStore = useAuthStore()

// 保證金（依租借模式）
const requiredDeposit = computed(() => {
  if (!venue.value || !mockBooking.value) return 0
  const modeData = (venue.value.rentalModes as any)[mockBooking.value.mode]
  if (!modeData?.depositEnabled) return 0
  return modeData.depositAmount ?? 0
})

const deductedDeposit = computed(() => {
  if (!authStore.isLoggedIn || !authStore.user?.retainedDeposit) return 0
  return Math.min(requiredDeposit.value, authStore.user.retainedDeposit)
})

const payableDeposit = computed(() => Math.max(0, requiredDeposit.value - deductedDeposit.value))

const totalPrice = computed(() => baseFee.value + payableDeposit.value)

// 表單（登入時帶入會員資料）
const applicantName = ref(authStore.user?.name ?? '')
const applicantPhone = ref(authStore.user?.phone ?? '')
const applicantEmail = ref(authStore.user?.email ?? '')
const applicantIdentityType = ref(
  authStore.user?.identityType && authStore.user.identityType !== DEFAULT_IDENTITY_TYPE_ID
    ? authStore.user.identityType
    : ''
)

const purpose = ref('')
const notes = ref('')
const CONSENT_ITEMS = [
  '我已閱讀並同意場館使用規範及服務條款。',
  '活動結束後將自行負責場地清潔並恢復原狀，若未達標準同意沒收保證金。',
  '我了解終止、更改活動性質或臨時取消，退費依本場館規定辦理。',
]
const consents = ref<boolean[]>(CONSENT_ITEMS.map(() => false))
const allConsented = computed(() => consents.value.every(Boolean))

const submitted = ref(false)

const canSubmit = computed(() => {
  return applicantName.value.trim() !== '' &&
    applicantPhone.value.trim() !== '' &&
    applicantEmail.value.trim() !== '' &&
    allConsented.value
})

function handleSubmit() {
  if (!canSubmit.value) return
  submitted.value = true
}

function goBackToBooking() {
  if (!venue.value) return
  router.push({ name: 'venue-booking', params: { id: venue.value.id } })
}

function goToVenues() {
  router.push({ name: 'venue-list' })
}

const digitalStudentIdImage = publicImageUrl('digitalStudentID.png')
const uploadedImage = ref<string>(digitalStudentIdImage)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  uploadedImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <!-- Not Found -->
  <div v-if="!venue" class="flex items-center justify-center min-h-screen bg-base-200">
    <div class="text-center space-y-4">
      <span class="material-symbols-outlined text-6xl ">error</span>
      <p class="">找不到該場館</p>
      <router-link to="/venues" class="btn btn-primary btn-sm">返回場館列表</router-link>
    </div>
  </div>

  <!-- 預約成功 -->
  <template v-else-if="submitted">
    <!-- <PageHeaderBasic title="場地預約" /> -->
    <div class="bg-base-200 flex items-center justify-center p-8">
      <div class="card bg-base-100 shadow-xl max-w-lg w-full">
        <div class="card-body items-center text-center space-y-6 py-12">
          <div class="w-20 h-20 bg-success rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-5xl text-success">check_circle</span>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-base-content">預約申請已送出！</h2>
            <p class="">您的預約申請已成功送出，管理員審核後將以 Email 通知您。</p>
          </div>

          <div class="bg-base-200 rounded-box p-4 w-full text-left space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="">場館</span>
              <span class="font-semibold">{{ venue.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">申請人</span>
              <span class="font-semibold">{{ applicantName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">預估費用</span>
              <span class="font-bold ">${{ totalPrice.toLocaleString() }}</span>
            </div>
          </div>

          <div class="flex gap-3 w-full">
            <button class="btn btn-outline flex-1" @click="goToVenues">
              <span class="material-symbols-outlined text-sm">list</span>
              場館列表
            </button>
            <button class="btn btn-primary flex-1" @click="$router.push('/')">
              <span class="material-symbols-outlined text-sm">home</span>
              回首頁
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- 預約確認表單 -->
  <template v-else>
    <PageHeaderBasic title="場地預約" />
    <main class="container mx-auto px-4 max-w-4xl pt-8 pb-14">
      <div class="space-y-6">

        <!-- 預約摘要卡片 -->
        <div v-if="mockBooking" class="card card-basic">
          <div class="card-body">
            <h2 class="card-title">
              場館預約明細
            </h2>
            <h3 class="font-bold text-base-content/80 mt-2">場館資訊</h3>
            <div class="overflow-x-auto border border-base-200 rounded-lg" data-lenis-prevent>
              <table class="table">
                <tbody>
                  <!-- 場館 -->
                  <tr>
                    <th class="w-32 bg-base-200/50">預約場館</th>
                    <td>
                      <div class="flex gap-4 items-center">
                        <img :src="publicImageUrl(venue.mainImageUrl)" :alt="venue.name"
                          class="w-12 h-12 object-cover rounded shrink-0" />
                        <div>
                          <p class="font-bold text-base-content">{{ venue.name }}</p>
                          <p class="text-sm">{{ venue.location }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-base-200/50">租借類型</th>
                    <td>
                      <div class="badge badge-neutral">{{ mockBooking.modeLabel }}</div>
                    </td>
                  </tr>

                  <!-- 全日 -->
                  <template v-if="mockBooking.mode === 'daily'">
                    <tr>
                      <th class="bg-base-200/50">起始日期</th>
                      <td class="font-bold">{{ mockBooking.startDate }}</td>
                    </tr>
                    <tr>
                      <th class="bg-base-200/50">結束日期</th>
                      <td class="font-bold">{{ mockBooking.endDate }}</td>
                    </tr>
                    <tr>
                      <th class="bg-base-200/50">租借天數</th>
                      <td class="font-bold">{{ mockBooking.days }} 天</td>
                    </tr>
                    <tr>
                      <th class="bg-base-200/50">日期類型</th>
                      <td class="font-bold">{{ mockBooking.dayType }}</td>
                    </tr>
                  </template>

                  <!-- 時段 -->
                  <template v-else-if="mockBooking.mode === 'session'">
                    <tr>
                      <th class="bg-base-200/50">日期</th>
                      <td class="font-bold">{{ mockBooking.date }}</td>
                    </tr>
                    <tr>
                      <th class="bg-base-200/50">場次</th>
                      <td>
                        <span class="font-bold">{{ mockBooking.sessionLabel }}</span>
                        <span class="text-sm ml-2 text-base-content/70">{{ mockBooking.sessionTime }}</span>
                      </td>
                    </tr>
                  </template>

                  <!-- 小時 -->
                  <template v-else-if="mockBooking.mode === 'hourly'">
                    <tr>
                      <th class="bg-base-200/50">日期</th>
                      <td class="font-bold">{{ mockBooking.date }}</td>
                    </tr>
                    <tr>
                      <th class="bg-base-200/50">時間</th>
                      <td>
                        <span class="font-bold">{{ mockBooking.startTime }} - {{ mockBooking.endTime }}</span>
                        <span class="text-sm ml-2 text-base-content/70">共 {{ mockBooking.hours }} 小時</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <h3 class="font-bold text-base-content/80 mt-4">費用明細</h3>
            <table class="table text-sm">
              <thead>
                <tr>
                  <th>項目</th>
                  <th class="text-right">單價</th>
                  <th class="text-right">數量</th>
                  <th class="text-right">小計</th>
                </tr>
              </thead>
              <tbody>
                <!-- 場地費 -->
                <tr v-if="mockBooking.mode === 'daily'">
                  <td class="">場地費（全日／{{ mockBooking.dayType }}）</td>
                  <td class="text-right">NT$ {{ mockBooking.unitPrice.toLocaleString() }}</td>
                  <td class="text-right">{{ mockBooking.days }} 天</td>
                  <td class="text-right font-medium">NT$ {{ baseFee.toLocaleString() }}</td>
                </tr>
                <tr v-else-if="mockBooking.mode === 'session'">
                  <td class="">場地費（{{ mockBooking.sessionLabel }}／{{ mockBooking.dayType }}）</td>
                  <td class="text-right">—</td>
                  <td class="text-right">1 場</td>
                  <td class="text-right font-medium">NT$ {{ baseFee.toLocaleString() }}</td>
                </tr>
                <tr v-else-if="mockBooking.mode === 'hourly'">
                  <td class="">場地費（計時／{{ mockBooking.dayType }}）</td>
                  <td class="text-right">NT$ {{ mockBooking.unitPrice.toLocaleString() }}</td>
                  <td class="text-right">{{ mockBooking.hours }} 小時</td>
                  <td class="text-right font-medium">NT$ {{ baseFee.toLocaleString() }}</td>
                </tr>
                <!-- 保證金 -->
                <tr v-if="requiredDeposit > 0" class="border-t border-info">
                  <td class="text-info">保證金</td>
                  <td class="text-right">—</td>
                  <td class="text-right">1 筆</td>
                  <td class="text-right font-medium text-info">NT$ {{ requiredDeposit.toLocaleString() }}</td>
                </tr>
                <!-- 扣抵留存保證金 -->
                <tr v-if="deductedDeposit > 0">
                  <td class="text-success">扣抵留存保證金</td>
                  <td class="text-right">—</td>
                  <td class="text-right">1 筆</td>
                  <td class="text-right font-medium text-success">-NT$ {{ deductedDeposit.toLocaleString() }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-base-300">
                  <td colspan="3" class="text-right font-semibold ">合計</td>
                  <td class="text-right text-lg font-black">NT$ {{ totalPrice.toLocaleString() }}</td>
                </tr>
                <tr v-if="requiredDeposit > 0">
                  <td colspan="4" class="text-right text-xs text-info">
                    本保證金於活動結束且場地復原確認無誤後，得予申請退還；申請人亦得聲明留存，逕充作後續預約場地之保留金。</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 聯絡人 -->
        <div class="card card-basic">
          <div class="card-body">
            <h2 class="card-title">
              申請資料
            </h2>

            <!-- 已登入：顯示帳號資訊提示 -->
            <div v-if="authStore.isLoggedIn"
              class="flex items-center gap-3 p-3 rounded-box bg-base-200 border border-base-200 text-sm">
              <span class="material-symbols-outlined ">account_circle</span>
              <span class="">已預設帶入帳號 <span class="font-semibold text-base-content">{{
                authStore.user?.email
                  }}</span> 的資料，您可依此次預約需求自行修改。</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">聯絡人姓名 <span class="text-error">*</span></span></label>
                <input v-model="applicantName" type="text" placeholder="請輸入聯絡人姓名" class="input input-bordered w-full" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">聯絡人電話 <span class="text-error">*</span></span></label>
                <input v-model="applicantPhone" type="tel" placeholder="09xx-xxx-xxx"
                  class="input input-bordered w-full" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">聯絡人 Email <span class="text-error">*</span></span></label>
                <input v-model="applicantEmail" type="email" placeholder="example@mail.com"
                  class="input input-bordered w-full" />
              </div>



              <div class="form-control col-span-full">
                <label class="label"><span class="label-text">使用目的</span></label>
                <input v-model="purpose" type="text" placeholder="例如：社區運動會、公司活動" class="input input-bordered w-full" />
              </div>
              <div class="form-control col-span-full">
                <label class="label"><span class="label-text">備註</span></label>
                <textarea v-model="notes" class="textarea textarea-bordered w-full" rows="3"
                  placeholder="如有特殊需求請在此說明"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 身份別與證明文件 -->
        <div class="card card-basic">
          <div class="card-body">
            <h2 class="card-title">
              身份別與證明文件
            </h2>
            <div class="grid grid-cols-1 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">身份別</span></label>
                <select v-model="applicantIdentityType" class="select select-bordered w-full">
                  <option value="" disabled selected>請選擇身份別（無則免填）</option>
                  <option v-for="type in IDENTITY_TYPES.filter(t => t.id !== DEFAULT_IDENTITY_TYPE_ID)"
                    :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
                <label class="label flex-col items-start gap-1">
                  <span class="label-text-alt text-base-content/50">特殊身份可選取身份並上傳相關文件只需一次！</span>
                  <span class="label-text-alt text-warning">※ 若變更身份或重新上傳文件，需重新等待管理員審核。</span>
                </label>
              </div>

              <div class="form-control" v-if="applicantIdentityType && applicantIdentityType !== ''">
                <label class="label"><span class="label-text">特殊身份證明文件 <span class="text-error">*</span></span></label>
                <div v-if="uploadedImage">
                  <div class="hover-3d">
                    <!-- content -->
                    <figure class="max-w-100 rounded-2xl">
                      <img :src="uploadedImage" alt="3D card" />
                    </figure>
                    <!-- 8 empty divs needed for the 3D effect -->
                    <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                  </div>
                  <div class="mt-4">
                    <button type="button" class="btn btn-error btn-sm btn-outline" @click="removeImage">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      刪除重新上傳
                    </button>
                  </div>
                </div>
                <div v-else
                  class="border-2 border-dashed border-base-300 rounded-box p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-base-200/50 transition-colors"
                  @click="triggerUpload">
                  <span class="material-symbols-outlined text-4xl text-base-content/40 mb-2">upload_file</span>
                  <p class="font-medium text-base-content/80">點擊或拖曳圖片至此上傳</p>
                  <p class="text-xs text-base-content/50 mt-1">支援 JPG, PNG 格式</p>
                </div>
                <!-- 隱藏的檔案上傳元件 -->
                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
              </div>
            </div>
          </div>
        </div>

        <!-- 注意事項 -->
        <div v-if="venue.notices?.length" class="card card-basic">
          <div class="card-body">
            <h2 class="card-title">
              場館使用規範
            </h2>
            <ul class="space-y-2 text-sm ">
              <li v-for="(item, idx) in venue.notices" :key="idx" class="flex gap-2">
                <span class=" font-bold shrink-0">{{ idx + 1 }}.</span>
                {{ item }}
              </li>
            </ul>

            <div class="space-y-2 mt-4">
              <label v-for="(item, i) in CONSENT_ITEMS" :key="i"
                class="flex items-start gap-3 cursor-pointer p-3 rounded-box border transition-colors"
                :class="consents[i] ? 'border-success bg-success' : 'border-base-200 hover:bg-base-200'">
                <input type="checkbox" v-model="consents[i]"
                  class="checkbox checkbox-success checkbox-sm mt-0.5 shrink-0" />
                <span class="text-sm">{{ item }}</span>
              </label>
            </div>
            <p v-if="!allConsented" class="text-xs text-error flex items-center gap-1 mt-2">
              <span class="material-symbols-outlined text-sm">error</span>
              請勾選所有切結聲明後方可送出申請
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Footer -->
    <div
      class="fixed bottom-0 left-0 right-0 z-50 bg-base-100 backdrop-blur-lg border-t border-base-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div class="max-w-4xl mx-auto px-4 py-3 pb-6 md:pb-3">
        <div class="flex items-center justify-between gap-4">
          <button class="btn btn-ghost" @click="goBackToBooking">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            返回修改
          </button>
          <div class="flex items-center gap-4">
            <div v-if="totalPrice > 0" class="text-right">
              <p class="text-xs ">預估費用</p>
              <p class="text-2xl font-black">${{ totalPrice.toLocaleString() }}</p>
            </div>
            <button class="btn btn-primary btn-lg min-w-36" :disabled="!canSubmit" @click="handleSubmit">
              <span class="material-symbols-outlined">send</span>
              送出申請
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
