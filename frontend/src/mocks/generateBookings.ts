import mockVenues from './venues.json'
import mockUsers from './users.json'

// ── Seed-based random for reproducible results per session ──
let _seed = Date.now() % 100000
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647
  return (_seed & 0x7fffffff) / 0x7fffffff
}
function rand(min: number, max: number) {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}


// ── Date helpers ──
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}
function getDay(dateStr: string) {
  return new Date(dateStr).getDay()
}

const PURPOSES: Record<number, string[]> = {
  1: ['全國青少年籃球錦標賽', '縣長盃排球賽', '苗栗縣民眾運動大會', '企業團建運動會', '原住民族文化祭', '音樂演唱會', '慈善晚會暨義賣活動', '藝人粉絲見面會', '全國高中排球聯賽', '縣長盃柔道錦標賽', '苗栗好物展覽', '大型商品展售會'],
  2: ['全國中等學校田徑錦標賽', '校慶運動會預演', '縣代表隊選拔集訓', '苗栗國際馬拉松集訓', '全民運動會田徑選拔', '社區馬拉松接力賽', '學校運動會', '田徑教練研習'],
  3: ['棒球社團練習', '理事長盃少棒賽', '春季聯盟例行賽', '球隊日常訓練', '社區少棒聯誼賽', '慢壘友誼邀請賽', '主委盃棒球賽', '少棒春季訓練營'],
  4: ['縣長盃羽球錦標賽', '校內跆拳道比賽', '桌球公開賽', '會員交流賽', '社團例行練球', '跆拳道段位考試', '羽球錦標賽決賽', '瑜伽聯合展演', '武術晉級考試'],
  5: ['縣代表隊選拔賽', '朋友籃球聚會', '球隊自主練習', '社區籃球友誼賽', '私人籃球教學', '女子籃球聯賽', '籃球教練研習', '三對三鬥牛賽', '企業員工籃球聯誼'],
  6: ['春季會員積分賽', '私人網球練習', '青少年網球訓練班', '教師網球賽', '網球雙打聯誼賽', '親子網球體驗營', '全國軟式網球巡迴賽'],
  7: ['花式溜冰選拔賽', '直排輪初級教學', '中區滑輪溜冰對抗賽', '溜冰社團聯誼', '親子溜冰體驗日', '滑輪溜冰社團練習', '全國溜冰錦標賽'],
}

// Sub-venues share parent purpose pool
const PARENT_VENUE_MAP: Record<number, number> = {
  101: 5, 102: 5, 103: 5, 201: 3, 202: 3,
}

function getPurposes(venueId: number): string[] {
  return PURPOSES[PARENT_VENUE_MAP[venueId] ?? venueId] ?? PURPOSES[1]
}

const CANCEL_REASONS = [
  '因天候不佳且場地周邊道路施工，考量參賽隊伍安全，決定延期辦理。',
  '因藝人行程異動，活動延期至下個月舉行。',
  '因經費不足，主辦單位決定取消本次活動。',
  '因指導老師身體不適，無法如期舉辦。',
  '社區大樓管委會臨時通知有消防設備檢修，無法舉辦活動。',
  '因場地設備維修尚未完成，為安全考量決定取消。',
  '申請人因故無法出席，決定取消預約。',
  '因報名人數不足，主辦方決定取消。',
]

const EXPIRED_REASONS = [
  '申請人未在期限內完成繳費程序。',
  '逾期未上傳所需文件，系統自動取消。',
  '申請人未在規定時間內補齊資料。',
]

const REJECTED_REASONS = [
  '天氣預報有雨想取消。',
  '個人因素想取消預約。',
  '時間衝突，希望取消改期。',
]

const REJECT_DOC_REASONS = [
  '申請書格式不符，請重新上傳正確格式。',
  '身分證影本不清晰，請重新拍照上傳。',
  '活動企劃書缺人數與時間表，請補齊。',
]

// ── Booking generator ──
interface RawBooking {
  id: number
  userId: string
  venueId: number
  rentalMode: 'daily' | 'session' | 'hourly'
  date: string
  startDate: string | null
  endDate: string | null
  session: string | null
  startTime: string | null
  endTime: string | null
  applicant: string
  purpose: string
  status: string
  cancelDeadline: string | null
  createdAt: string
  peopleCount: number
  deposit: number
  additionalFees: { label: string; unit: string; amount: number; multiple?: boolean }[]
  remittance: {
    last5: string
    amount: number
    datetime: string
    senderName: string
    note: string
    receiptImage: string | null
  } | null
  note: string | null
  adminNote: string | null
  cancelReason: string | null
  documentRejectReason: string | null
  documentApprovedAt: string | null
  paymentApprovedAt: string | null
  refund: {
    status: string
    amount: number
    reason: string
    bankbookImage: string | null
    requestedAt: string | null
    adminApprovedAt: string | null
    accountingApprovedAt: string | null
    completedAt: string | null
    refundMethod: string | null
    refundType: string
  } | null
  documentUploadDeadline: string | null
  receiptUploadDeadline: string | null
  documents: {
    key: string
    label: string
    required: boolean
    uploaded: boolean
    fileName?: string
    uploadedAt?: string
  }[]
}

function makeDocuments(venue: typeof mockVenues[0], mode: string, uploaded: boolean, uploadDate?: string) {
  const modeData = (venue.rentalModes as any)?.[mode]
  const docs = (modeData?.requiredDocuments ?? []).filter((d: any) => d.required)
  return docs.map((d: any) => {
    const shouldUpload = uploaded
    return {
      key: d.key,
      label: d.label,
      required: d.required,
      uploaded: shouldUpload,
      ...(shouldUpload ? {
        fileName: `${d.key}_${rand(100, 999)}.pdf`,
        uploadedAt: uploadDate,
      } : {}),
    }
  })
}

function makeRemittance(amount: number, senderName: string, dateStr: string) {
  return {
    last5: String(rand(10000, 99999)),
    amount,
    datetime: dateStr + 'T00:00',
    senderName,
    note: seededRandom() > 0.7 ? '分次匯入' : '',
    receiptImage: `receipt_${rand(1000000000, 9999999999)}.png`,
  }
}

function getDepositAmount(venue: typeof mockVenues[0], mode: string): number {
  const modeData = (venue.rentalModes as any)?.[mode]
  if (!modeData?.depositEnabled) return 0
  return modeData.depositAmount ?? 0
}

function getRentalPrice(venue: typeof mockVenues[0], mode: string, date: string, session: string | null, startTime: string | null, endTime: string | null, startDate: string | null, endDate: string | null): number {
  const rm = venue.rentalModes as any
  const weekendDays: number[] = rm[mode]?.weekendDays ?? [0, 6]
  const dayOfWeek = getDay(date)
  const isWeekend = weekendDays.includes(dayOfWeek)
  const priceKey = isWeekend ? 'weekend' : 'weekday'
  const pricing = (venue as any).pricing

  if (mode === 'daily') {
    const price = pricing?.daily?.[priceKey] ?? 0
    let days = 1
    if (startDate && endDate) {
      const s = new Date(startDate)
      const e = new Date(endDate)
      days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
    }
    return price * days
  } else if (mode === 'session') {
    const sessions: any[] = rm.session?.sessions ?? []
    const sd = sessions.find((s: any) => s.name === session)
    return sd?.[priceKey] ?? 0
  } else if (mode === 'hourly') {
    const price = pricing?.hourly?.[priceKey] ?? 0
    let hours = 1
    if (startTime && endTime) {
      const sh = parseInt(startTime.split(':')[0])
      const eh = parseInt(endTime.split(':')[0])
      hours = Math.max(1, eh - sh)
    }
    return price * hours
  }
  return 0
}

export function generateBookings(): RawBooking[] {
  const bookings: RawBooking[] = []
  let nextId = 1

  // Determine date ranges: past (Jan-Mar) + current/future (April-October)
  const pastStartDate = '2026-01-01'
  const pastEndDate = '2026-03-31'
  const futureStartDate = '2026-04-10'
  const futureEndDate = '2026-10-31'

  // Build time slots to prevent conflicts
  type Slot = { venueId: number; date: string; session?: string; startTime?: string; endTime?: string }
  const usedSlots: Slot[] = []

  function slotConflicts(slot: Slot): boolean {
    return usedSlots.some(s => {
      if (s.venueId !== slot.venueId || s.date !== slot.date) return false
      if (s.session && slot.session) return s.session === slot.session
      if (s.startTime && slot.startTime) {
        return !(slot.endTime! <= s.startTime! || slot.startTime! >= s.endTime!)
      }
      // daily vs session/hourly on same date = conflict
      if (!s.session && !s.startTime) return true
      if (!slot.session && !slot.startTime) return true
      return false
    })
  }

  function generateDate(start: string, end: string): string {
    const days = daysBetween(start, end)
    return addDays(start, rand(0, days))
  }

  // Statuses for past bookings (March - all dates have passed)
  const PAST_STATUSES = [
    'completed', 'completed', 'completed', 'completed', 'completed',
    'completed', 'completed', 'completed',
    'cancelled', 'cancelled',
    'cancelled_expired',
    'cancelled_rejected',
  ]

  // Statuses for future bookings
  // pending_payment = 文件通過（或不需文件），等待用戶上傳匯款
  // payment_review  = 用戶已上傳匯款，等待承辦/出納審核
  const FUTURE_STATUSES = [
    'reserved', 'reserved',
    'document_review',
    'documents_rejected',
    'pending_payment', 'pending_payment',
    'payment_review',
    'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed',
    'confirmed', 'confirmed',
    'cancellation_requested',
  ]

  function generateForVenue(venue: typeof mockVenues[0], count: number, isPast: boolean) {
    const startRange = isPast ? pastStartDate : futureStartDate
    const endRange = isPast ? pastEndDate : futureEndDate
    const rm = venue.rentalModes as any
    const availableModes: string[] = []
    if (rm.daily?.enabled) availableModes.push('daily')
    if (rm.session?.enabled) availableModes.push('session')
    if (rm.hourly?.enabled) availableModes.push('hourly')
    if (availableModes.length === 0) return

    const sessionDefs: { name: string; startTime: string; endTime: string }[] = rm.session?.sessions ?? []

    for (let i = 0; i < count; i++) {
      const user = pick(mockUsers)
      const mode = pick(availableModes) as 'daily' | 'session' | 'hourly'
      let date = generateDate(startRange, endRange)

      // Avoid closed weekdays
      const closedWeekdays: number[] = (venue.closedWeekdays ?? []) as number[]
      let attempts = 0
      while (closedWeekdays.includes(getDay(date)) && attempts < 20) {
        date = generateDate(startRange, endRange)
        attempts++
      }

      // Build slot
      let session: string | null = null
      let startTime: string | null = null
      let endTime: string | null = null
      let startDate: string | null = null
      let endDate: string | null = null

      if (mode === 'session') {
        const sd = pick(sessionDefs)
        session = sd.name
      } else if (mode === 'hourly') {
        const minHours = rm.hourly?.minHours ?? 1
        const hours = rand(minHours, Math.max(minHours, 3))
        const startH = rand(8, 18 - hours)
        startTime = `${String(startH).padStart(2, '0')}:00`
        endTime = `${String(startH + hours).padStart(2, '0')}:00`
      } else if (mode === 'daily') {
        const maxDays = rm.daily?.maxDays ?? 3
        const days = rand(1, Math.min(maxDays, 3))
        startDate = date
        endDate = addDays(date, days - 1)
      }

      const slot: Slot = { venueId: venue.id, date, session: session ?? undefined, startTime: startTime ?? undefined, endTime: endTime ?? undefined }

      // Skip if conflict
      if (slotConflicts(slot)) continue
      usedSlots.push(slot)

      // Determine status
      const statusPool = isPast ? PAST_STATUSES : FUTURE_STATUSES
      const status = pick(statusPool)

      const deposit = getDepositAmount(venue, mode)
      const peopleCount = rand(2, venue.capacity ? Math.min(venue.capacity, 200) : 60)
      const createdAt = addDays(date, -rand(10, 30))

      // Rental items selected from venue's rentalItems (exclude 0-amount items)
      const rentalItems: { label: string; unit: string; amount: number; quantity: number }[] = []
      const venueItems = ((venue as any).rentalItems ?? []).filter((vi: any) => vi.amount > 0)
      if (venueItems.length && seededRandom() > 0.5) {
        const count = rand(1, Math.min(venueItems.length, 2))
        const shuffled = [...venueItems].sort(() => seededRandom() - 0.5)
        for (let i = 0; i < count; i++) {
          const vi = shuffled[i]
          const qty = rand(1, vi.maxPerBooking ?? 1)
          rentalItems.push({ label: vi.label, unit: vi.unit, amount: vi.amount * qty, quantity: qty })
        }
      }

      const rentalPrice = getRentalPrice(venue, mode, date, session, startTime, endTime, startDate, endDate)
      const totalFee = rentalPrice + deposit + rentalItems.reduce((s, f) => s + f.amount, 0)

      // Documents
      const docsUploaded = !['reserved'].includes(status)
      const docDate = addDays(createdAt, rand(1, 5))
      const documents = makeDocuments(venue, mode, docsUploaded, docDate)

      // Remittance：只有文件通過（或不需文件）後才會繳費
      // pending_payment = 等待用戶上傳匯款（無匯款資料）
      // cancelled_expired / cancelled_rejected = 從未繳費（無匯款資料）
      const hasRemittance = ['payment_review', 'confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(status)
      const remittance = hasRemittance ? makeRemittance(totalFee, user.name, addDays(createdAt, rand(2, 7))) : null

      // Cancel reason
      let cancelReason: string | null = null
      if (status === 'cancelled' || status === 'cancellation_requested') {
        cancelReason = pick(CANCEL_REASONS)
      } else if (status === 'cancelled_expired') {
        cancelReason = pick(EXPIRED_REASONS)
      } else if (status === 'cancelled_rejected') {
        cancelReason = pick(REJECTED_REASONS)
      }

      // Document reject reason
      let documentRejectReason: string | null = null
      if (status === 'documents_rejected') {
        documentRejectReason = pick(REJECT_DOC_REASONS)
      }

      // Cancel deadline
      const cancelDeadline = addDays(date, -(venue.cancellationDeadlineDays ?? 7))

      // Refund
      // 取消退費：繳費已通過 + 訂單已取消（cancelled）
      //   → 約 70% 已申請、30% 可申請但尚未申請（null）
      let refund: RawBooking['refund'] = null
      if (status === 'cancelled') {
        {
          // 取消退費：用戶申請取消核准後自動進入退費流程
          const refundStatuses = ['admin_review', 'accounting_review', 'cashier_processing', 'completed']
          const refStatus = pick(refundStatuses)
          const reqAt = addDays(createdAt, rand(1, 5))
          refund = {
            status: refStatus,
            amount: totalFee,
            reason: '活動取消，申請退還已繳費用',
            bankbookImage: `bankbook_${rand(100, 999)}.jpg`,
            requestedAt: reqAt,
            adminApprovedAt: ['accounting_review', 'cashier_processing', 'completed'].includes(refStatus) ? addDays(reqAt, 1) : null,
            accountingApprovedAt: ['cashier_processing', 'completed'].includes(refStatus) ? addDays(reqAt, 2) : null,
            completedAt: refStatus === 'completed' ? addDays(reqAt, 4) : null,
            refundMethod: pick(['transfer', 'check']),
            refundType: 'cancellation',
          }
        }
      }

      // Admin notes for some
      let adminNote: string | null = null
      if (seededRandom() > 0.85) {
        adminNote = pick([
          '此筆為特急件，請盡快審核款項',
          '已提醒需自備延長線與垃圾袋',
          '已備妥，請於使用前至服務台領取。',
          '請注意場地清潔',
        ])
      }

      const docDeadlineDays = (venue as any).documentUploadDeadlineDays ?? 7
      const receiptDeadlineDays = (venue as any).receiptUploadDeadlineDays ?? 3

      bookings.push({
        id: nextId++,
        userId: user.id,
        venueId: venue.id,
        rentalMode: mode,
        date,
        startDate,
        endDate,
        session,
        startTime,
        endTime,
        applicant: user.name,
        purpose: pick(getPurposes(venue.id)),
        status,
        cancelDeadline,
        createdAt,
        peopleCount,
        deposit,
        additionalFees: rentalItems,
        remittance,
        note: null,
        adminNote,
        cancelReason,
        documentRejectReason,
        // pending_payment / payment_review 以後皆代表文件已通過（或不需文件審核）
        // cancelled_rejected = 文件退件取消，文件從未通過
        documentApprovedAt: ['pending_payment', 'payment_review', 'confirmed', 'completed', 'cancellation_requested', 'cancelled', 'cancelled_expired'].includes(status) ? addDays(createdAt, rand(3, 7)) : null,
        // cancelled_expired = 逾期未繳費，cancelled_rejected = 從未到繳費階段，兩者皆無繳費通過
        paymentApprovedAt: ['confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(status) ? addDays(createdAt, rand(5, 10)) : null,
        refund,
        documentUploadDeadline: addDays(createdAt, docDeadlineDays),
        receiptUploadDeadline: addDays(createdAt, receiptDeadlineDays),
        documents,
      })
    }
  }

  // Generate bookings for each venue
  const mainVenues = mockVenues.filter(v => !v.parentId)
  const subVenues = mockVenues.filter(v => v.parentId)

  // Past bookings (March)
  mainVenues.forEach(v => generateForVenue(v, rand(4, 7), true))
  subVenues.forEach(v => generateForVenue(v, rand(2, 4), true))

  // Future bookings (April-October) — 約 7 個月區間,按比例放大筆數
  mainVenues.forEach(v => generateForVenue(v, rand(25, 45), false))
  subVenues.forEach(v => generateForVenue(v, rand(12, 22), false))

  // Sort by date
  bookings.sort((a, b) => a.date.localeCompare(b.date) || a.venueId - b.venueId)

  // Re-assign IDs after sort
  bookings.forEach((b, i) => { b.id = i + 1 })

  // ── 確保 user-001 每種狀態至少各有一筆訂單 ──
  const u1 = 'user-001'
  const ALL_STATUSES: RawBooking['status'][] = [
    'reserved', 'document_review', 'documents_rejected',
    'pending_payment', 'payment_review',
    'confirmed', 'completed',
    'cancellation_requested',
    'cancelled', 'cancelled_expired', 'cancelled_rejected',
  ]
  const PAST_ONLY: RawBooking['status'][] = ['completed', 'cancelled', 'cancelled_expired', 'cancelled_rejected']

  const u1Statuses = new Set(bookings.filter(b => b.userId === u1).map(b => b.status))
  const missing = ALL_STATUSES.filter(s => !u1Statuses.has(s))

  if (missing.length) {
    // 找一個可租借且有文件審核配置的場館作為模板
    const templateVenue = mockVenues.find(v => {
      const rm = (v.rentalModes as any)
      return Object.values(rm).some((m: any) => m?.enabled && m?.depositEnabled)
    }) ?? mockVenues[0]
    const templateRm = (templateVenue.rentalModes as any)
    const templateMode = (['session', 'daily', 'hourly'].find(
      m => templateRm[m]?.enabled && templateRm[m]?.depositEnabled
    ) ?? 'session') as 'daily' | 'session' | 'hourly'
    const templateDeposit = getDepositAmount(templateVenue, templateMode)
    const templateSessionName = templateRm.session?.sessions?.[0]?.name ?? '上午'

    for (const status of missing) {
      const isPast = PAST_ONLY.includes(status)
      const date = isPast ? addDays('2026-03-01', rand(0, 28)) : addDays('2026-04-15', rand(0, 40))
      const createdAt = addDays(date, -rand(10, 25))
      const baseFee = rand(2000, 8000)
      const deposit = templateDeposit
      const totalFee = baseFee + deposit

      const hasRemittance = ['payment_review', 'confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(status)
      const remittance = hasRemittance ? makeRemittance(totalFee, '王小明', addDays(createdAt, rand(2, 5))) : null

      let cancelReason: string | null = null
      if (status === 'cancelled' || status === 'cancellation_requested') cancelReason = '因故取消'
      else if (status === 'cancelled_expired') cancelReason = '逾期未繳費'
      else if (status === 'cancelled_rejected') cancelReason = '文件退件且未在期限內重新上傳'

      let documentRejectReason: string | null = null
      if (status === 'documents_rejected') documentRejectReason = '場地使用申請書缺少單位核章，請補正。'

      // 取消退費自動進入流程
      let refund: RawBooking['refund'] = null
      if (status === 'cancelled') {
        const reqAt = addDays(createdAt, rand(1, 5))
        refund = {
          status: 'admin_review',
          amount: totalFee,
          reason: '活動取消，申請退還已繳費用',
          bankbookImage: `bankbook_${rand(100, 999)}.jpg`,
          requestedAt: reqAt,
          adminApprovedAt: null,
          accountingApprovedAt: null,
          completedAt: null,
          refundMethod: pick(['transfer', 'check']),
          refundType: 'cancellation',
        }
      }

      const requireDocuments = templateRm[templateMode]?.requireDocuments ?? false
      const docDeadlineDays = (templateVenue as any).documentUploadDeadlineDays ?? 7
      const receiptDeadlineDays = (templateVenue as any).receiptUploadDeadlineDays ?? 3

      const uploaded = ['document_review', 'pending_payment', 'payment_review', 'confirmed', 'completed', 'cancellation_requested', 'cancelled', 'cancelled_expired'].includes(status)
      const documents = requireDocuments ? makeDocuments(templateVenue, templateMode, uploaded, uploaded ? addDays(createdAt, 2) : undefined) : []

      bookings.push({
        id: nextId++,
        userId: u1,
        venueId: templateVenue.id,
        rentalMode: templateMode,
        date,
        startDate: date,
        endDate: date,
        session: templateMode === 'session' ? templateSessionName : null,
        startTime: templateMode === 'hourly' ? '09:00' : null,
        endTime: templateMode === 'hourly' ? '12:00' : null,
        applicant: '王小明',
        purpose: '體育活動',
        status,
        cancelDeadline: addDays(date, -7),
        createdAt,
        peopleCount: rand(10, 50),
        deposit,
        additionalFees: [],
        remittance,
        note: null,
        adminNote: null,
        cancelReason,
        documentRejectReason,
        documentApprovedAt: ['pending_payment', 'payment_review', 'confirmed', 'completed', 'cancellation_requested', 'cancelled', 'cancelled_expired'].includes(status) ? addDays(createdAt, rand(3, 5)) : null,
        paymentApprovedAt: ['confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(status) ? addDays(createdAt, rand(5, 8)) : null,
        refund,
        documentUploadDeadline: addDays(createdAt, docDeadlineDays),
        receiptUploadDeadline: addDays(createdAt, receiptDeadlineDays),
        documents,
      })
    }

    // Re-sort and re-assign IDs
    bookings.sort((a, b) => a.date.localeCompare(b.date) || a.venueId - b.venueId)
    bookings.forEach((b, i) => { b.id = i + 1 })
  }

  const scenarioVenue = mockVenues.find(v => {
    const rm = (v.rentalModes as any)
    return Object.values(rm).some((m: any) => m?.enabled)
  }) ?? mockVenues[0]
  const scenarioRm = (scenarioVenue.rentalModes as any)
  const scenarioMode = (['session', 'daily', 'hourly'].find(
    m => scenarioRm[m]?.enabled
  ) ?? 'session') as 'daily' | 'session' | 'hourly'
  const scenarioDeposit = getDepositAmount(scenarioVenue, scenarioMode)
  const scenarioDocDeadlineDays = (scenarioVenue as any).documentUploadDeadlineDays ?? 7
  const scenarioReceiptDeadlineDays = (scenarioVenue as any).receiptUploadDeadlineDays ?? 3
  const scenarioRequireDocuments = scenarioRm[scenarioMode]?.requireDocuments ?? false
  const scenarioSessionName = scenarioRm.session?.sessions?.[0]?.name ?? '上午'

  // ── 確保 user-001 的預訂成功訂單涵蓋：可取消、不可取消、申請取消中 ──
  // canRequestCancellation 判斷：today <= eventDate - cancellationDeadlineDays（預設 7）
  // 今天 = 2026-04-13
  const u1Confirmed = bookings.filter(b => b.userId === u1 && b.status === 'confirmed')
  const u1CancellationRequested = bookings.some(b => b.userId === u1 && b.status === 'cancellation_requested')

  // 可取消：使用日期夠遠，例如 2026-05-15（取消期限 = 05-08，今天 04-13 < 05-08）
  const hasCancellable = u1Confirmed.some(b => {
    const eventDate = b.startDate ?? b.date
    return eventDate >= '2026-04-25' // 確保距離今天超過 7 天 + 緩衝
  })
  if (!hasCancellable) {
    const date = '2026-05-15'
    const createdAt = addDays(date, -rand(15, 25))
    const baseFee = rand(2000, 8000)
    const deposit = scenarioDeposit > 0 ? scenarioDeposit : 5000
    const totalFee = baseFee + deposit
    const documents = scenarioRequireDocuments ? makeDocuments(scenarioVenue, scenarioMode, true, addDays(createdAt, 2)) : []
    bookings.push({
      id: nextId++, userId: u1, venueId: scenarioVenue.id, rentalMode: scenarioMode,
      date, startDate: date, endDate: date,
      session: scenarioMode === 'session' ? scenarioSessionName : null,
      startTime: scenarioMode === 'hourly' ? '09:00' : null, endTime: scenarioMode === 'hourly' ? '12:00' : null,
      applicant: '王小明', purpose: '體育活動', status: 'confirmed',
      cancelDeadline: addDays(date, -7), createdAt, peopleCount: rand(10, 50),
      deposit, additionalFees: [],
      remittance: makeRemittance(totalFee, '王小明', addDays(createdAt, rand(2, 5))),
      note: null, adminNote: null, cancelReason: null, documentRejectReason: null,
      documentApprovedAt: addDays(createdAt, rand(3, 5)),
      paymentApprovedAt: addDays(createdAt, rand(5, 8)),
      refund: null,
      documentUploadDeadline: addDays(createdAt, scenarioDocDeadlineDays),
      receiptUploadDeadline: addDays(createdAt, scenarioReceiptDeadlineDays),
      documents,
    })
  }

  // 不可取消：使用日期非常近，例如 2026-04-14（取消期限 = 04-07，今天 04-13 > 04-07）
  const hasNonCancellable = u1Confirmed.some(b => {
    const eventDate = b.startDate ?? b.date
    return eventDate <= '2026-04-18' && eventDate >= '2026-04-13' // 已過取消期限但尚未使用
  })
  if (!hasNonCancellable) {
    const date = '2026-04-15'
    const createdAt = addDays(date, -rand(15, 25))
    const baseFee = rand(2000, 8000)
    const deposit = scenarioDeposit > 0 ? scenarioDeposit : 5000
    const totalFee = baseFee + deposit
    const documents = scenarioRequireDocuments ? makeDocuments(scenarioVenue, scenarioMode, true, addDays(createdAt, 2)) : []
    bookings.push({
      id: nextId++, userId: u1, venueId: scenarioVenue.id, rentalMode: scenarioMode,
      date, startDate: date, endDate: date,
      session: scenarioMode === 'session' ? scenarioSessionName : null,
      startTime: scenarioMode === 'hourly' ? '09:00' : null, endTime: scenarioMode === 'hourly' ? '12:00' : null,
      applicant: '王小明', purpose: '體育活動', status: 'confirmed',
      cancelDeadline: addDays(date, -7), createdAt, peopleCount: rand(10, 50),
      deposit, additionalFees: [],
      remittance: makeRemittance(totalFee, '王小明', addDays(createdAt, rand(2, 5))),
      note: null, adminNote: null, cancelReason: null, documentRejectReason: null,
      documentApprovedAt: addDays(createdAt, rand(3, 5)),
      paymentApprovedAt: addDays(createdAt, rand(5, 8)),
      refund: null,
      documentUploadDeadline: addDays(createdAt, scenarioDocDeadlineDays),
      receiptUploadDeadline: addDays(createdAt, scenarioReceiptDeadlineDays),
      documents,
    })
  }

  // cancellation_requested 已在全狀態保證區塊處理，但確認一下
  if (!u1CancellationRequested) {
    const date = addDays('2026-04-20', rand(0, 20))
    const createdAt = addDays(date, -rand(15, 25))
    const baseFee = rand(2000, 8000)
    const deposit = scenarioDeposit > 0 ? scenarioDeposit : 5000
    const totalFee = baseFee + deposit
    const documents = scenarioRequireDocuments ? makeDocuments(scenarioVenue, scenarioMode, true, addDays(createdAt, 2)) : []
    bookings.push({
      id: nextId++, userId: u1, venueId: scenarioVenue.id, rentalMode: scenarioMode,
      date, startDate: date, endDate: date,
      session: scenarioMode === 'session' ? scenarioSessionName : null,
      startTime: scenarioMode === 'hourly' ? '09:00' : null, endTime: scenarioMode === 'hourly' ? '12:00' : null,
      applicant: '王小明', purpose: '體育活動', status: 'cancellation_requested',
      cancelDeadline: addDays(date, -7), createdAt, peopleCount: rand(10, 50),
      deposit, additionalFees: [],
      remittance: makeRemittance(totalFee, '王小明', addDays(createdAt, rand(2, 5))),
      note: null, adminNote: null, cancelReason: '因行程異動，申請取消預約。', documentRejectReason: null,
      documentApprovedAt: addDays(createdAt, rand(3, 5)),
      paymentApprovedAt: addDays(createdAt, rand(5, 8)),
      refund: null,
      documentUploadDeadline: addDays(createdAt, scenarioDocDeadlineDays),
      receiptUploadDeadline: addDays(createdAt, scenarioReceiptDeadlineDays),
      documents,
    })
  }

  // ── 確保 user-001 的已取消（用戶申請取消）訂單涵蓋每種取消退費狀態 ──
  // 取消退費為自動流程，所有已取消訂單皆有退費紀錄
  // 需要的退費狀態：admin_review、accounting_review、cashier_processing、completed
  const CANCEL_REFUND_STATUSES = ['admin_review', 'accounting_review', 'cashier_processing', 'completed'] as const
  const u1Cancelled = bookings.filter(b => b.userId === u1 && b.status === 'cancelled')
  const u1CancelRefundStatuses = new Set(
    u1Cancelled.map(b => b.refund?.refundType === 'cancellation' ? b.refund.status : '__other')
  )

  // 確保每種取消退費審核狀態各有一筆
  for (const refStatus of CANCEL_REFUND_STATUSES) {
    if (u1CancelRefundStatuses.has(refStatus)) continue
    const date = addDays('2026-02-05', rand(0, 20))
    const createdAt = addDays(date, -rand(10, 20))
    const baseFee = rand(2000, 8000)
    const deposit = scenarioDeposit > 0 ? scenarioDeposit : 5000
    const totalFee = baseFee + deposit
    const reqAt = addDays(date, rand(1, 5))
    const documents = scenarioRequireDocuments ? makeDocuments(scenarioVenue, scenarioMode, true, addDays(createdAt, 2)) : []

    bookings.push({
      id: nextId++, userId: u1, venueId: scenarioVenue.id, rentalMode: scenarioMode,
      date, startDate: date, endDate: date,
      session: scenarioMode === 'session' ? scenarioSessionName : null,
      startTime: scenarioMode === 'hourly' ? '09:00' : null, endTime: scenarioMode === 'hourly' ? '12:00' : null,
      applicant: '王小明', purpose: '體育活動', status: 'cancelled',
      cancelDeadline: addDays(date, -7), createdAt, peopleCount: rand(10, 50),
      deposit, additionalFees: [],
      remittance: makeRemittance(totalFee, '王小明', addDays(createdAt, rand(2, 5))),
      note: null, adminNote: null, cancelReason: '因行程異動，申請取消預約。', documentRejectReason: null,
      documentApprovedAt: addDays(createdAt, rand(3, 5)),
      paymentApprovedAt: addDays(createdAt, rand(5, 8)),
      refund: {
        status: refStatus,
        amount: totalFee,
        reason: '活動取消，申請退還已繳費用',
        bankbookImage: `bankbook_${rand(100, 999)}.jpg`,
        requestedAt: reqAt,
        adminApprovedAt: ['accounting_review', 'cashier_processing', 'completed'].includes(refStatus) ? addDays(reqAt, 1) : null,
        accountingApprovedAt: ['cashier_processing', 'completed'].includes(refStatus) ? addDays(reqAt, 2) : null,
        completedAt: refStatus === 'completed' ? addDays(reqAt, 4) : null,
        refundMethod: pick(['transfer', 'check']),
        refundType: 'cancellation',
      },
      documentUploadDeadline: addDays(createdAt, scenarioDocDeadlineDays),
      receiptUploadDeadline: addDays(createdAt, scenarioReceiptDeadlineDays),
      documents,
    })
  }

  // 最終排序 + 重新編號
  bookings.sort((a, b) => a.date.localeCompare(b.date) || a.venueId - b.venueId)
  bookings.forEach((b, i) => { b.id = i + 1 })

  return bookings
}

// Generate once and cache
const generatedBookings = generateBookings()
export default generatedBookings
