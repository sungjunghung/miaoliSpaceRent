<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import venues from "@/mocks/venues.json";
import allBookings from "@/mocks/generateBookings";
import calendarNotes from "@/mocks/calendarNotes.json";
import WeekCalendar from "@/components/portal/calendar/WeekCalendar.vue";
import MonthCalendar from "@/components/portal/calendar/MonthCalendar.vue";
import { publicImageUrl } from "@/utils/assets";

const route = useRoute();
const router = useRouter();

const venue = computed(() => {
  const id = Number(route.params.id);
  return venues.find((v) => v.id === id);
});

const hasWeekView = computed(() => {
  if (!venue.value) return false;
  const rm = venue.value.rentalModes;
  return rm.session?.enabled || rm.hourly?.enabled;
});

// 預約狀況預設用月曆(daily);使用者可再切到時段(週曆)
const rentalMode = ref<"hourly" | "daily">("daily");

// 租借費用:可切換顯示的模式(只列出有啟用的)
type FeeMode = "daily" | "session" | "hourly";
const feeModes = computed<{ value: FeeMode; label: string }[]>(() => {
  const rm = venue.value?.rentalModes;
  const list: { value: FeeMode; label: string }[] = [];
  if (rm?.daily?.enabled) list.push({ value: "daily", label: "整日租借" });
  if (rm?.session?.enabled) list.push({ value: "session", label: "時段租借" });
  if (rm?.hourly?.enabled) list.push({ value: "hourly", label: "小時租借" });
  return list;
});
const feeMode = ref<FeeMode>("daily");
// feeMode 永遠指向一個有啟用的模式(預設第一個)
watch(
  feeModes,
  (modes) => {
    if (!modes.some((m) => m.value === feeMode.value)) {
      feeMode.value = modes[0]?.value ?? "daily";
    }
  },
  { immediate: true },
);
const lightboxImage = ref<string | null>(null);
// 目前聚焦的照片索引;主圖會跟著它換
const activeImageIndex = ref(0);
const heroImage = computed(() => {
  const imgs = galleryImages.value;
  if (imgs.length) return imgs[activeImageIndex.value] ?? imgs[0];
  return venue.value ? publicImageUrl(venue.value.mainImageUrl) : "";
});

const parallaxOffset = ref(0);
let parallaxTicking = false;
function onParallaxScroll() {
  if (parallaxTicking) return;
  parallaxTicking = true;
  requestAnimationFrame(() => {
    parallaxOffset.value = window.scrollY * 0.35;
    parallaxTicking = false;
  });
}
onMounted(() => window.addEventListener("scroll", onParallaxScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener("scroll", onParallaxScroll));
const heroParallaxStyle = computed(() => ({
  transform: `translate3d(0, ${parallaxOffset.value}px, 0) scale(1.15)`,
}));

const closedWeekdays = computed(() => venue.value?.closedWeekdays ?? []);
const closedDates = computed(() => venue.value?.closedDates ?? []);

const allRequiredDocuments = computed(() => {
  if (!venue.value) return [];
  const rm = venue.value.rentalModes as any;
  const seen = new Set<string>();
  const docs: any[] = [];
  for (const mode of ["daily", "session", "hourly"]) {
    const modeData = rm[mode];
    if (!modeData?.enabled || !modeData.requireDocuments) continue;
    for (const doc of modeData.requiredDocuments ?? []) {
      if (doc.required && !seen.has(doc.key)) {
        seen.add(doc.key);
        docs.push(doc);
      }
    }
  }
  return docs;
});
const venueBookings = computed(() => {
  if (!venue.value) return [];
  const realBookings = allBookings.filter((b) => b.venueId === venue.value!.id);
  // 將時段保留轉為假的 booking record，讓行事曆顯示為已租借
  const blocked = calendarNotes
    .filter((n: any) => n.type === "blocked" && n.venueId === venue.value!.id)
    .map((n: any) => ({
      id: `blocked-${n.id}`,
      venueId: n.venueId,
      date: n.date,
      rentalMode: n.allDay ? "daily" : "hourly",
      startDate: n.allDay ? n.date : undefined,
      endDate: n.allDay ? n.date : undefined,
      startTime: n.startTime ?? undefined,
      endTime: n.endTime ?? undefined,
      status: "confirmed",
      applicant: n.title,
      purpose: n.description,
    }));
  return [...realBookings, ...blocked];
});

const sessionDefs = computed(() =>
  (venue.value?.rentalModes.session?.sessions ?? []).map((s) => ({
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
  })),
);

const galleryImages = computed(() => {
  if (!venue.value) return [];
  return Array.from(
    new Set(
      [venue.value.mainImageUrl, ...(venue.value.gallery ?? [])]
        .filter(Boolean)
        .map(publicImageUrl),
    ),
  );
});

const pricedRentalItems = computed(
  () => venue.value?.rentalItems?.filter((item) => item.amount > 0) ?? [],
);

// 照片輪播:每隔數秒聚焦下一張並替換主圖(慢速),到底回開頭;hover 暫停
const galleryTrack = ref<HTMLElement | null>(null);
let galleryTimer: number | undefined;
let galleryRaf: number | undefined;

// 自控的平滑捲動:rAF tween + easeInOutCubic,比瀏覽器原生 smooth 更柔順可控
function smoothScrollLeft(el: HTMLElement, to: number, duration = 900) {
  if (galleryRaf) cancelAnimationFrame(galleryRaf);
  const max = el.scrollWidth - el.clientWidth;
  const target = Math.max(0, Math.min(to, max));
  const start = el.scrollLeft;
  const dist = target - start;
  if (Math.abs(dist) < 1) return;
  const startTime = performance.now();
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (now: number) => {
    const p = Math.min(1, (now - startTime) / duration);
    el.scrollLeft = start + dist * ease(p);
    if (p < 1) galleryRaf = requestAnimationFrame(step);
  };
  galleryRaf = requestAnimationFrame(step);
}

function focusGalleryImage(idx: number) {
  const total = galleryImages.value.length;
  if (!total) return;
  activeImageIndex.value = ((idx % total) + total) % total;
  // 把聚焦的縮圖柔順地捲到列表中央
  const track = galleryTrack.value;
  const el = track?.children[activeImageIndex.value] as HTMLElement | undefined;
  if (track && el) {
    smoothScrollLeft(track, el.offsetLeft - (track.clientWidth - el.clientWidth) / 2);
  }
}
function advanceGallery() {
  focusGalleryImage(activeImageIndex.value + 1);
}
function startGallery() {
  stopGallery();
  galleryTimer = window.setInterval(advanceGallery, 6000);
}
function stopGallery() {
  if (galleryTimer) {
    clearInterval(galleryTimer);
    galleryTimer = undefined;
  }
}
onMounted(startGallery);
onBeforeUnmount(() => {
  stopGallery();
  if (galleryRaf) cancelAnimationFrame(galleryRaf);
});

function selectDate(_day: unknown) {
  // WeekCalendar 用的日期選擇處理(目前為 no-op)
}

// ── 與首頁同樣的「點日期 → modal」體驗 ──
function bookingPartsForVenue(b: any): { primary: string; time?: string } {
  if (b.rentalMode === "daily") {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return {
        primary: "整日",
        time: `${b.startDate.slice(5).replace("-", "/")} ~ ${b.endDate.slice(5).replace("-", "/")}`,
      };
    }
    return { primary: "整日" };
  }
  if (b.rentalMode === "session" && b.session) {
    const def = sessionDefs.value.find((s) => s.name === b.session);
    return def
      ? { primary: b.session, time: `${def.startTime}-${def.endTime}` }
      : { primary: b.session };
  }
  if (b.rentalMode === "hourly") {
    return { primary: `${b.startTime ?? ""}-${b.endTime ?? ""}` };
  }
  return { primary: b.purpose ?? "預約" };
}

function describeBookingFor(b: any): string {
  const parts = bookingPartsForVenue(b);
  return parts.time ? `${parts.primary} ${parts.time}` : parts.primary;
}

// 特定場館視圖:label + time 合成單行(與首頁的特定場館模式一致)
const cellEvents = computed<Record<string, { label: string; time?: string }[]>>(() => {
  const out: Record<string, { label: string; time?: string }[]> = {};
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  for (const b of venueBookings.value) {
    const startStr = (b as any).startDate ?? (b as any).date;
    const endStr = (b as any).endDate ?? (b as any).date;
    if (!startStr) continue;
    const s = new Date(`${startStr}T00:00:00`);
    const e = new Date(`${endStr ?? startStr}T00:00:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;
    const entry = { label: describeBookingFor(b) };
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d);
      if (!out[key]) out[key] = [];
      out[key].push(entry);
    }
  }
  return out;
});

const bookingsModal = ref<HTMLDialogElement | null>(null);
const selectedDate = ref("");
const bookingsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return [];
  const target = selectedDate.value;
  return venueBookings.value.filter((b: any) => {
    if (b.rentalMode === "daily") {
      const start = b.startDate ?? b.date;
      const end = b.endDate ?? b.date;
      return target >= start && target <= end;
    }
    return b.date === target;
  });
});

function onCalendarDayClick(dateStr: string) {
  selectedDate.value = dateStr;
  bookingsModal.value?.showModal();
}
function closeBookingsModal() {
  bookingsModal.value?.close();
}
function formatLongDate(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${y} 年 ${parseInt(m ?? "1")} 月 ${parseInt(d ?? "1")} 日`;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const weekDays: { label: string; key: DayKey; isWeekend: boolean }[] = [
  { label: "週一", key: "mon", isWeekend: false },
  { label: "週二", key: "tue", isWeekend: false },
  { label: "週三", key: "wed", isWeekend: false },
  { label: "週四", key: "thu", isWeekend: false },
  { label: "週五", key: "fri", isWeekend: false },
  { label: "週六", key: "sat", isWeekend: true },
  { label: "週日", key: "sun", isWeekend: true },
];

const DAY_KEY_TO_NUM: Record<DayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function isWeeklyClosedDay(key: DayKey): boolean {
  return closedWeekdays.value.includes(DAY_KEY_TO_NUM[key]);
}

function getHours(key: DayKey) {
  return venue.value?.openingHours[key] ?? null;
}

function goBack() {
  router.push({ name: "venue-list" });
}

function goToBooking() {
  router.push({ name: "venue-booking", params: { id: route.params.id } });
}

function scrollToCalendar() {
  document
    .getElementById("calendar-section")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatMoney(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString() : "—";
}
</script>

<template>
  <div v-if="!venue" class="min-h-[70dvh] bg-base-200 flex items-center justify-center px-4">
    <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-8 max-w-md w-full text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-base-200 flex items-center justify-center mb-5">
        <span class="material-symbols-outlined text-3xl text-base-content/50">stadium</span>
      </div>
      <h2 class="text-2xl font-bold mb-2">找不到此場館</h2>
      <p class="text-base-content/60 mb-6">
        場館資料可能已被移除或暫時無法存取。
      </p>
      <button @click="goBack" class="btn btn-primary">返回場館列表</button>
    </div>
  </div>

  <main v-else>
    <section class="relative overflow-hidden bg-neutral flex flex-col h-[calc(100dvh-5rem-4rem)] pb-4 lg:block lg:h-auto lg:pb-16">
      <Transition name="hero-fade">
        <img :key="heroImage" :src="heroImage" :alt="venue.name" :style="heroParallaxStyle"
          class="absolute inset-0 w-full h-full object-cover will-change-transform" />
      </Transition>
      <div class="absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-black/10"></div>
      <div
        class="absolute inset-x-0 bottom-0 h-full lg:h-3/5 bg-linear-to-t from-base-200 from-10% lg:from-0% to-transparent to-50% lg:to-80%">
      </div>

      <div
        class="container mx-auto px-8 relative z-10 pt-8 lg:pt-28 pb-8 lg:pb-14 flex flex-col justify-between lg:justify-end flex-1 lg:flex-none ">

        <div class="max-w-4xl text-white">
          <button class="btn btn-sm btn-ghost text-white/90 w-fit" @click="goBack">
            <span class="material-symbols-outlined text-base">arrow_back</span>
            場館列表
          </button>

          <p class="sport-eyebrow mt-2">VENUE</p>
          <h1 class="mt-1 font-heading font-black text-3xl md:text-5xl leading-tight mb-4">
            {{ venue.name }}
          </h1>
          <p class="text-lg md:text-xl leading-relaxed text-white/85 max-w-3xl">
            {{ venue.description }}
          </p>
        </div>

        <div class="mt-8 flex flex-wrap gap-3 fixed bottom-20 left-0 right-0 p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-200 lg:hidden justify-center z-20">
          <button v-if="venue.status === 'available'" class="btn btn-primary" @click="goToBooking">
            立即預約
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
          <button class="btn btn-secondary" @click="scrollToCalendar">
            查看可預約時段
          </button>
        </div>
        
      </div>
      <section v-if="galleryImages.length" class="shrink-0 mb-24 lg:mb-0">
        <div
          ref="galleryTrack"
          class="flex gap-3 overflow-x-auto px-4 py-6 [justify-content:safe_center]"
          data-lenis-prevent
          @mouseenter="stopGallery"
          @mouseleave="startGallery"
        >
          <button
            v-for="(img, idx) in galleryImages"
            :key="img"
            class="relative shrink-0 overflow-hidden rounded-box w-40 md:w-52 aspect-square group focus:outline-none transition-all duration-500"
            :class="idx === activeImageIndex ? 'scale-105 shadow-xl z-10' : ''"
            @click="lightboxImage = img">
            <img :src="img" :alt="`${venue.name} 場地照片 ${idx + 1}`"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <span
              class="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined">zoom_in</span>
            </span>
          </button>
        </div>
      </section>
    </section>

    <div class="basis-ccontainer pb-28 lg:pb-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 mb-8">

        <aside class="w-full lg:w-1/3 space-y-6">
          <!-- 場館資訊 -->
          <section class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
            <header class="border-b border-base-200 px-5 py-4">
              <p class="sport-eyebrow">VENUE INFO</p>
              <h3 class="mt-1 font-heading font-black text-lg text-secondary">場館資訊</h3>
            </header>
            <div class="divide-y divide-base-200">
              <div class="flex items-start gap-3 px-5 py-3.5">
                <span class="material-symbols-outlined text-xl text-base-content/40 shrink-0">location_on</span>
                <div class="min-w-0">
                  <p class="text-xs text-base-content/50">位置</p>
                  <p class="font-medium">{{ venue.location }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3 px-5 py-3.5">
                <span class="material-symbols-outlined text-xl text-base-content/40 shrink-0">groups</span>
                <div class="min-w-0">
                  <p class="text-xs text-base-content/50">容納人數</p>
                  <p class="font-medium">{{ venue.capacity.toLocaleString() }} 人</p>
                </div>
              </div>
              <div class="flex items-start gap-3 px-5 py-3.5">
                <span class="material-symbols-outlined text-xl text-base-content/40 shrink-0">category</span>
                <div class="min-w-0">
                  <p class="text-xs text-base-content/50">場地類型</p>
                  <p class="font-medium">{{ venue.type }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3 px-5 py-3.5">
                <span class="material-symbols-outlined text-xl text-base-content/40 shrink-0">build</span>
                <div class="min-w-0">
                  <p class="text-xs text-base-content/50">設備與服務</p>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span v-for="item in venue.facilities" :key="item" class="badge badge-sm badge-ghost border border-base-300">{{ item }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-3 px-5 py-3.5">
                <span class="material-symbols-outlined text-xl text-base-content/40 shrink-0">schedule</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-base-content/50 mb-2">開放時間</p>
                  <ul class="space-y-1">
                    <li v-for="{ label, key, isWeekend } in weekDays" :key="key" class="flex items-center justify-between gap-3 text-sm">
                      <span :class="isWeekend ? 'text-error font-medium' : 'text-base-content/70'">{{ label }}</span>
                      <span class="font-medium tabular-nums" :class="isWeeklyClosedDay(key) ? 'text-base-content/40' : ''">{{ isWeeklyClosedDay(key) ? '固定休館' : (getHours(key) ?? '休館') }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <!-- 租借費用 -->
          <section class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
            <header class="border-b border-base-200 px-5 py-4">
              <p class="sport-eyebrow">PRICING</p>
              <h3 class="mt-1 font-heading font-black text-lg text-secondary">租借費用</h3>
            </header>

            <div v-if="venue.status === 'available'" class="p-5 space-y-4">
              <div v-if="feeModes.length > 1" role="tablist" class="tabs tabs-box tabs-sm">
                <button v-for="m in feeModes" :key="m.value" type="button" role="tab" class="tab flex-1"
                  :class="{ 'tab-active': feeMode === m.value }" :aria-selected="feeMode === m.value"
                  @click="feeMode = m.value">
                  {{ m.label }}
                </button>
              </div>

              <!-- daily -->
              <div v-if="feeMode === 'daily'" class="overflow-hidden rounded-box border border-base-200">
                <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-base-200/60 px-4 py-2 text-xs font-semibold text-base-content/60">
                  <span></span><span class="text-right">平日</span><span class="text-right">假日</span>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-3 border-t border-base-200">
                  <span class="text-sm">整日</span>
                  <span class="text-right font-heading font-bold text-secondary">NT$ {{ formatMoney(venue.pricing.daily.weekday) }}</span>
                  <span class="text-right font-heading font-bold text-primary">NT$ {{ formatMoney(venue.pricing.daily.weekend) }}</span>
                </div>
                <div v-if="(venue.rentalModes as any).daily?.depositEnabled" class="flex items-center justify-between px-4 py-3 border-t border-base-200 bg-base-200/30">
                  <span class="text-sm text-base-content/70">保證金</span>
                  <span class="font-heading font-bold">NT$ {{ formatMoney((venue.rentalModes as any).daily.depositAmount) }}</span>
                </div>
              </div>

              <!-- session -->
              <div v-if="feeMode === 'session'" class="overflow-hidden rounded-box border border-base-200">
                <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-base-200/60 px-4 py-2 text-xs font-semibold text-base-content/60">
                  <span></span><span class="text-right">平日</span><span class="text-right">假日</span>
                </div>
                <div v-for="ses in venue.rentalModes.session.sessions" :key="ses.name" class="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-3 border-t border-base-200">
                  <span class="text-sm">{{ ses.name }}</span>
                  <span class="text-right font-heading font-bold text-secondary">NT$ {{ formatMoney(ses.weekday) }}</span>
                  <span class="text-right font-heading font-bold text-primary">NT$ {{ formatMoney(ses.weekend) }}</span>
                </div>
                <div v-if="(venue.rentalModes as any).session?.depositEnabled" class="flex items-center justify-between px-4 py-3 border-t border-base-200 bg-base-200/30">
                  <span class="text-sm text-base-content/70">保證金</span>
                  <span class="font-heading font-bold">NT$ {{ formatMoney((venue.rentalModes as any).session.depositAmount) }}</span>
                </div>
              </div>

              <!-- hourly -->
              <div v-if="feeMode === 'hourly'" class="overflow-hidden rounded-box border border-base-200">
                <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-base-200/60 px-4 py-2 text-xs font-semibold text-base-content/60">
                  <span></span><span class="text-right">平日</span><span class="text-right">假日</span>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-3 border-t border-base-200">
                  <span class="text-sm">每小時</span>
                  <span class="text-right font-heading font-bold text-secondary">NT$ {{ formatMoney(venue.pricing.hourly.weekday) }}</span>
                  <span class="text-right font-heading font-bold text-primary">NT$ {{ formatMoney(venue.pricing.hourly.weekend) }}</span>
                </div>
                <div v-if="(venue.rentalModes as any).hourly?.depositEnabled" class="flex items-center justify-between px-4 py-3 border-t border-base-200 bg-base-200/30">
                  <span class="text-sm text-base-content/70">保證金</span>
                  <span class="font-heading font-bold">NT$ {{ formatMoney((venue.rentalModes as any).hourly.depositAmount) }}</span>
                </div>
              </div>

              <!-- 額外費用 -->
              <div v-if="pricedRentalItems.length" class="overflow-hidden rounded-box border border-base-200">
                <div class="flex items-center gap-2 bg-base-200/60 px-4 py-2 text-sm font-semibold">
                  <span class="material-symbols-outlined text-base text-primary">add_circle</span>
                  額外費用
                </div>
                <div v-for="fee in pricedRentalItems" :key="fee.label" class="flex items-center justify-between gap-3 px-4 py-3 border-t border-base-200">
                  <span class="text-sm">{{ fee.label }}</span>
                  <span class="font-heading font-bold whitespace-nowrap">NT$ {{ fee.amount.toLocaleString() }} <span class="text-xs font-normal text-base-content/50">/ {{ fee.unit }}</span></span>
                </div>
              </div>

              <button @click="goToBooking" class="btn btn-primary btn-lg w-full">
                立即預約
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div v-else class="p-6 text-center">
              <span class="material-symbols-outlined text-3xl text-warning">construction</span>
              <h2 class="text-lg font-bold mt-3">場館維護中</h2>
              <p class="text-base-content/60 mt-2 text-sm">此場館目前暫不開放預約。</p>
            </div>
          </section>
        </aside>
        <div class="w-full lg:w-2/3 space-y-6">

          <!-- 預約狀況 -->
          <section id="calendar-section" class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden scroll-mt-28">
            <header class="flex items-center justify-between gap-3 flex-wrap border-b border-base-200 px-5 py-4">
              <div>
                <p class="sport-eyebrow">AVAILABILITY</p>
                <h2 class="mt-1 font-heading font-black text-lg text-secondary">預約狀況</h2>
              </div>
              <div v-if="hasWeekView" role="tablist" class="tabs tabs-box tabs-sm">
                <button type="button" role="tab" class="tab gap-1.5" :class="rentalMode === 'hourly' ? 'tab-active' : ''" @click="rentalMode = 'hourly'">
                  <span class="material-symbols-outlined text-sm">schedule</span>
                  週曆
                </button>
                <button type="button" role="tab" class="tab gap-1.5" :class="rentalMode === 'daily' ? 'tab-active' : ''" @click="rentalMode = 'daily'">
                  <span class="material-symbols-outlined text-sm">date_range</span>
                  月曆
                </button>
              </div>
            </header>
            <div class="p-4 md:p-6">
              <div v-if="hasWeekView && rentalMode === 'hourly'">
                <WeekCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
                  :session-defs="sessionDefs" @select-date="selectDate" />
              </div>
              <div v-else>
                <MonthCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
                  :cell-events="cellEvents" viewable @select-date="onCalendarDayClick" />
              </div>
            </div>
          </section>

          <!-- 預約注意事項 -->
          <div class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
            <header class="border-b border-base-200 px-5 py-4">
              <p class="sport-eyebrow">NOTICE</p>
              <h2 class="mt-1 font-heading font-black text-lg text-secondary">預約注意事項</h2>
            </header>
            <ul class="p-5 md:p-6 space-y-3">
              <li class="flex gap-2.5 text-sm leading-relaxed">
                <span class="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">chevron_right</span>
                <span>最早可於使用日前 {{ venue.advanceBookingDays }} 天提出申請。</span>
              </li>
              <li class="flex gap-2.5 text-sm leading-relaxed">
                <span class="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">chevron_right</span>
                <span>文件需於申請後 {{ venue.documentUploadDeadlineDays }} 天內完成提交。</span>
              </li>
              <li class="flex gap-2.5 text-sm leading-relaxed">
                <span class="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">chevron_right</span>
                <span>費用需於申請後 {{ venue.receiptUploadDeadlineDays }} 天內完成繳納。</span>
              </li>
              <li class="flex gap-2.5 text-sm leading-relaxed">
                <span class="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">chevron_right</span>
                <span>如需取消,最晚需於使用日前 {{ venue.cancellationDeadlineDays }} 天完成取消申請。</span>
              </li>
              <li v-for="(item, idx) in venue.notices" :key="idx" class="flex gap-2.5 text-sm leading-relaxed">
                <span class="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">chevron_right</span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- 預約文件下載 -->
          <div v-if="allRequiredDocuments.length" class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
            <header class="border-b border-base-200 px-5 py-4">
              <p class="sport-eyebrow">DOCUMENTS</p>
              <h2 class="mt-1 font-heading font-black text-lg text-secondary">預約文件下載</h2>
            </header>
            <div class="p-5 md:p-6 space-y-3">
              <div v-for="doc in allRequiredDocuments" :key="doc.key"
                class="flex items-center gap-3 rounded-box border border-base-200 bg-base-200/40 p-4 transition-colors hover:border-primary/40 hover:bg-base-200/70">
                <span class="material-symbols-outlined text-xl text-secondary shrink-0">assignment</span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold">{{ doc.label }}</p>
                  <p v-if="doc.hint" class="text-sm text-base-content/60 mt-1">{{ doc.hint }}</p>
                </div>
                <button class="btn btn-ghost btn-square" aria-label="下載文件">
                  <span class="material-symbols-outlined text-2xl">download</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <Teleport to="body">
      <div v-if="lightboxImage" class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        @click.self="lightboxImage = null">
        <button class="btn btn-circle btn-ghost absolute top-4 right-4 text-white" @click="lightboxImage = null">
          <span class="material-symbols-outlined">close</span>
        </button>
        <img :src="lightboxImage" :alt="venue.name" class="max-w-full max-h-[90vh] object-contain shadow-2xl" />
      </div>
    </Teleport>
  </main>

  <!-- 預約清單 modal:點月曆某天時顯示當日預約 -->
  <dialog ref="bookingsModal" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-1">{{ formatLongDate(selectedDate) }} 預約清單</h3>
      <p class="text-sm text-base-content/60 mb-4">
        {{ venue?.name }} · 共 {{ bookingsOnSelectedDate.length }} 筆
      </p>
      <div v-if="bookingsOnSelectedDate.length" class="space-y-2 max-h-96 overflow-y-auto" data-lenis-prevent>
        <div v-for="b in bookingsOnSelectedDate" :key="b.id" class="p-3 border border-base-200 rounded-box">
          <div class="font-medium">{{ describeBookingFor(b) }}</div>
          <div v-if="b.purpose" class="text-sm text-base-content/60">{{ b.purpose }}</div>
        </div>
      </div>
      <div v-else class="text-center py-10 text-base-content/50">當日無預約</div>
      <div class="modal-action">
        <button type="button" class="btn" @click="closeBookingsModal">關閉</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<style scoped>
/* 主圖換圖時淡入淡出(crossfade),比直接抽換柔順 */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 800ms ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
</style>
