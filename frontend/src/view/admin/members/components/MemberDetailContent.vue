<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import mockUsers from '@/mocks/users.json'
import mockBookings from '@/mocks/generateBookings'
import mockVenues from '@/mocks/venues.json'
import { publicImageUrl } from '@/utils/assets'
import { IDENTITY_TYPES, DEFAULT_IDENTITY_TYPE_ID, identityRequiresDocument } from '@/utils/identity'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isNew = computed(() => props.id === 'new')
const activeTab = ref('basic')

const infoModal = ref<HTMLDialogElement | null>(null)
const infoModalTitle = ref('')
const infoModalMessage = ref('')

function showInfo(title: string, message: string) {
  infoModalTitle.value = title
  infoModalMessage.value = message
  infoModal.value?.showModal()
}

const deleteModal = ref<HTMLDialogElement | null>(null)
const depositModal = ref<HTMLDialogElement | null>(null)
const newDeposit = ref<number>(0)

interface Member {
  id: string
  name: string
  email: string
  phone: string
  identityType: string
  identityDocument?: string
  retainedDeposit?: number
}

function emptyMember(): Member {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
    identityType: DEFAULT_IDENTITY_TYPE_ID,
    retainedDeposit: 0,
  }
}

const digitalStudentIdImage = publicImageUrl('digitalStudentID.png')
const uploadedImage = ref<string>(digitalStudentIdImage)
const fileInput = ref<HTMLInputElement | null>(null)
const formData = ref<Member>(emptyMember())

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

function openDepositModal() {
  newDeposit.value = formData.value.retainedDeposit ?? 0
  depositModal.value?.showModal()
}

function applyDepositChange() {
  formData.value.retainedDeposit = newDeposit.value
  depositModal.value?.close()
}

const RENTAL_MODE: Record<string, string> = {
  daily: '全日',
  session: '場次',
  hourly: '計時',
}

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  reserved: { label: '已接受預訂', class: 'badge-neutral' },
  document_review: { label: '文件審核', class: 'badge-info' },
  documents_rejected: { label: '文件退件', class: 'badge-error' },
  payment_review: { label: '繳費審核', class: 'badge-info' },
  confirmed: { label: '預訂成功', class: 'badge-success' },
  completed: { label: '已完成', class: 'badge-primary' },
  cancelled: { label: '已取消', class: 'badge-error' },
  cancelled_expired: { label: '逾期取消', class: 'badge-error' },
  cancelled_rejected: { label: '退件取消', class: 'badge-error' },
}

const SESSION_LABELS: Record<string, string> = {
  morning: '上午場',
  afternoon: '下午場',
  evening: '晚間場',
}

const memberBookings = computed(() =>
  (mockBookings as any[])
    .filter(booking => booking.userId === props.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

watch(() => props.id, id => {
  activeTab.value = 'basic'
  uploadedImage.value = digitalStudentIdImage

  if (id === 'new') {
    formData.value = emptyMember()
    return
  }

  const found = (mockUsers as any[]).find(user => user.id === id)
  formData.value = found
    ? {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        identityType: found.identityType || DEFAULT_IDENTITY_TYPE_ID,
        identityDocument: found.identityDocument || '',
        retainedDeposit: found.retainedDeposit ?? 0,
      }
    : emptyMember()
}, { immediate: true })

function getVenueName(venueId: number) {
  return (mockVenues as any[]).find(venue => venue.id === venueId)?.name ?? `場館 #${venueId}`
}

function formatDate(booking: any) {
  if (booking.rentalMode === 'daily') {
    if (booking.startDate && booking.endDate && booking.startDate !== booking.endDate) return `${booking.startDate} ~ ${booking.endDate}`
    return booking.startDate ?? booking.date
  }
  if (booking.session) return `${booking.date}　${SESSION_LABELS[booking.session] ?? booking.session}`
  if (booking.startTime && booking.endTime) return `${booking.date}　${booking.startTime}–${booking.endTime}`
  return booking.date
}

function reservationId(id: number) {
  return `BK-${String(id).padStart(6, '0')}`
}

function handleSave() {
  showInfo('儲存成功', '會員資料已成功儲存。（prototype 模擬）')
}

function handleSendTempPassword() {
  showInfo('已發送臨時密碼', '系統已產生一組臨時密碼並發送至會員的電子信箱。')
}

function confirmDelete() {
  deleteModal.value?.showModal()
}

function executeDelete() {
  emit('close')
}
</script>

<template>
  <div v-if="!isNew" role="tablist" class="tabs tabs-lift mb-4">
    <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'basic' }"
      @click="activeTab = 'basic'">基本資料</button>
    <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'bookings' }"
      @click="activeTab = 'bookings'">預約紀錄</button>
  </div>

  <div v-show="activeTab === 'basic' || isNew" class="space-y-4 max-w-3xl mx-auto">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-base">基本資料</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="!isNew" class="form-control">
            <label class="label"><span class="label-text">會員編號</span></label>
            <input :value="formData.id" type="text" class="input input-bordered w-full bg-base-200" readonly />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">姓名</span></label>
            <input v-model="formData.name" type="text" class="input input-bordered w-full" placeholder="請輸入姓名" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">電子信箱</span></label>
            <input v-model="formData.email" type="email" class="input input-bordered w-full" placeholder="請輸入信箱" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">電話</span></label>
            <input v-model="formData.phone" type="text" class="input input-bordered w-full" placeholder="請輸入電話" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">身份別</span></label>
            <select v-model="formData.identityType" class="select select-bordered w-full">
              <option v-for="type in IDENTITY_TYPES" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </div>

          <div class="form-control col-span-full" v-if="identityRequiresDocument(formData.identityType)">
            <label class="label"><span class="label-text">證明文件圖片</span></label>
            <div v-if="uploadedImage">
              <div class="hover-3d">
                <figure class="max-w-100 rounded-2xl">
                  <img :src="uploadedImage" alt="3D card" />
                </figure>
                <div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div>
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
              <p class="font-medium text-base-content/80">點擊上傳證明文件</p>
              <p class="text-xs text-base-content/50 mt-1">支援 JPG, PNG 格式</p>
            </div>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
          </div>
        </div>
        <div class="card-actions justify-end mt-4">
          <button type="button" class="btn btn-primary px-8" @click="handleSave">
            <span class="material-symbols-outlined">save</span>
            儲存
          </button>
        </div>
      </div>
    </div>

    <div class="card card-basic">
      <div class="card-body">
        <h2 class="card-title">保證金</h2>
        <div class="mb-4">
          <span class="text-lg font-medium">金額：{{ formData.retainedDeposit }} NT$</span>
        </div>
        <div class="flex space-x-2">
          <button type="button" class="btn btn-outline btn-disabled">退款</button>
          <button type="button" class="btn btn-primary" @click="openDepositModal">變更金額</button>
        </div>
      </div>
    </div>

    <div v-if="!isNew" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-base">重設密碼</h2>
        <p class="text-base-content/60">點擊下方按鈕，系統將產生一組臨時密碼並發送至會員的電子信箱。</p>
        <div class="card-actions justify-start mt-2">
          <button type="button" class="btn btn-primary btn-outline" @click="handleSendTempPassword">
            <span class="material-symbols-outlined">mail</span>
            發送臨時密碼
          </button>
        </div>
      </div>
    </div>

    <div v-if="!isNew" class="card bg-base-100 shadow-sm border border-error/20">
      <div class="card-body">
        <h2 class="card-title text-base text-error">危險操作</h2>
        <p class="text-base-content/60">刪除會員後將無法復原，請確認是否要執行此操作。</p>
        <div class="card-actions justify-start mt-2">
          <button class="btn btn-error btn-outline" @click="confirmDelete">
            <span class="material-symbols-outlined">delete</span>
            刪除會員
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-show="activeTab === 'bookings' && !isNew" class="space-y-4">
    <div v-if="memberBookings.length > 0" class="overflow-x-auto bg-base-100 rounded-box border border-base-200">
      <table class="table">
        <thead>
          <tr>
            <th>訂單編號</th>
            <th>場館</th>
            <th>日期 / 時段</th>
            <th>類型</th>
            <th>狀態</th>
            <th class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in memberBookings" :key="booking.id" class="hover">
            <td>{{ reservationId(booking.id) }}</td>
            <td>{{ getVenueName(booking.venueId) }}</td>
            <td>{{ formatDate(booking) }}</td>
            <td><span class="badge badge-outline">{{ RENTAL_MODE[booking.rentalMode] }}</span></td>
            <td>
              <span class="badge" :class="STATUS_LABEL[booking.status]?.class ?? 'badge-ghost'">
                {{ STATUS_LABEL[booking.status]?.label ?? booking.status }}
              </span>
            </td>
            <td>
              <router-link :to="{ name: 'admin-booking-detail', params: { id: booking.id } }"
                class="btn btn-ghost btn-square">
                <span class="material-symbols-outlined">open_in_new</span>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-base-content/40 py-6 text-center">
      此會員尚無預約記錄
    </div>
  </div>

  <dialog ref="infoModal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold">{{ infoModalTitle }}</h3>
      <p class="py-4 text-base-content/70">{{ infoModalMessage }}</p>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-primary px-8">確定</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>關閉</button>
    </form>
  </dialog>

  <dialog ref="deleteModal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-error">刪除會員</h3>
      <p class="py-4 text-base-content/70">確定要刪除會員「<span class="font-semibold text-base-content">{{ formData.name }}</span>」嗎？<br>此操作無法復原。</p>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-ghost mr-2">取消</button>
          <button class="btn btn-error px-6" @click="executeDelete">確定刪除</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>關閉</button>
    </form>
  </dialog>

  <dialog ref="depositModal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">變更保證金</h3>
      <div class="form-control mt-4">
        <label class="label"><span class="label-text">新金額 (NT$)</span></label>
        <input v-model.number="newDeposit" type="number" min="0" class="input input-bordered w-full"
          placeholder="輸入新金額" />
      </div>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-ghost mr-2" type="button" @click="depositModal?.close()">取消</button>
          <button class="btn btn-primary px-6" type="button" @click="applyDepositChange">確認變更</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>關閉</button>
    </form>
  </dialog>
</template>
