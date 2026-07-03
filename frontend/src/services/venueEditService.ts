import documentTemplates from '@/mocks/venue-edit/documentTemplates.json';
import venueRentalModes from '@/mocks/venue-edit/venueRentalModes.json';
import venueBases from '@/mocks/venue-edit/venueBases.json';
import venueHolidaySettings from '@/mocks/venue-edit/venueHolidaySettings.json';
import venueImages from '@/mocks/venue-edit/venueImages.json';
import venuePrices from '@/mocks/venue-edit/venuePrices.json';
import venueRentalItems from '@/mocks/venue-edit/venueRentalItems.json';
import venueRequiredDocuments from '@/mocks/venue-edit/venueRequiredDocuments.json';
import venueTimeSlots from '@/mocks/venue-edit/venueTimeSlots.json';

export { venueRentalModes };

export interface RequiredDocument {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  templateFile?: string | null;
  appliesTo: { daily: boolean; session: boolean; hourly: boolean };
}

// 場館自訂的身份價格列（各場館各自定義，非共用清單）
export interface IdentityRow {
  label: string;
  weekday: number;
  weekend: number;
}

// 一組價格：一般民眾基準價 + 自訂身份列
export interface ModePricing {
  weekday: number;
  weekend: number;
  identityRows: IdentityRow[];
}

export interface SessionDef {
  name: string;
  startTime: string;
  endTime: string;
  weekday: number;
  weekend: number;
  // 每個時段各自一張身份價格表
  identityRows: IdentityRow[];
}

export interface RentalItem {
  label: string;
  unit: string;
  amount: number;
  quantity: number;
  maxPerBooking: number;
}

// 各租借模式共通的規則欄位（申請期限、保證金、場佈撤場、文件）
export interface RentalModeBase {
  enabled: boolean;
  requireDocuments: boolean;
  requiredDocuments: RequiredDocument[];
  depositEnabled: boolean;
  depositAmount: number;
  setupTeardownEnabled: boolean;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
  overageRoundingMode: 'ceil' | 'floor' | 'nearest';
  advanceBookingDays: number;
  latestBookingDays: number;
  cancellationDeadlineDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  weekendPricingEnabled: boolean;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

export interface VenueEditFormData {
  id: number;
  parentId: number | null;
  name: string;
  status: string;
  capacity: number;
  location: string;
  type: string;
  description: string;
  mainImageUrl: string;
  gallery: string[];
  pricePerHour: number;
  facilities: string[];
  openingHours: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }>;
  rentalModes: {
    daily: RentalModeBase & { minDays: number; maxDays: number };
    session: RentalModeBase & { sessions: SessionDef[] };
    hourly: RentalModeBase & { minHours: number; maxHours: number };
  };
  pricing: {
    daily: ModePricing;
    session: ModePricing;
    hourly: ModePricing;
  };
  closedWeekdays: number[];
  closedDates: string[];
  rentalItems: RentalItem[];
  notices: string[];
  isActive?: boolean;
  advanceBookingDays: number;
  latestBookingDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  cancellationDeadlineDays: number;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
  weekendPricingEnabled: boolean;
  requiredDocuments: RequiredDocument[];
}

export interface VenueBaseRecord {
  id: number;
  parentId: number | null;
  name: string;
  status: string;
  capacity: number;
  location: string;
  type: string;
  description: string;
  facilities: string[];
  openingHours: Record<string, string | null>;
  closedWeekdays: number[];
  closedDates: string[];
  notices: string[];
  isActive: boolean | null;
  advanceBookingDays: number;
  latestBookingDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  cancellationDeadlineDays: number;
}

interface DocumentTemplateRecord {
  key: string;
  label: string;
  hint: string;
}

interface VenueImageRecord {
  venueId: number;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

interface VenuePriceRecord {
  venueId: number;
  mode: 'daily' | 'timeslot' | 'hourly';
  timeSlotCode?: string;
  price: number;
  weekendPrice?: number;
}

interface VenueTimeSlotRecord {
  venueId: number;
  slotCode: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface VenueRentalItemRecord {
  venueId: number;
  sortOrder: number | null;
  label: string;
  unit: string;
  amount: number;
  quantity: number;
  maxPerBooking: number;
}

interface VenueRequiredDocumentRecord {
  venueId: number;
  mode: 'daily' | 'timeslot' | 'hourly';
  templateKey: string;
  required: boolean;
  templateFile: string | null;
  appliesTo?: Array<'daily' | 'timeslot' | 'hourly'>;
}

interface VenueHolidaySettingRecord {
  venueId: number;
  mode: 'daily' | 'timeslot' | 'hourly';
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

interface VenueRentalModeRecord {
  venueId: number;
  mode: 'daily' | 'timeslot' | 'hourly';
  isEnabled: boolean;
  minDays: number | null;
  maxDays: number | null;
  minHours: number | null;
  maxHours: number | null;
  depositEnabled: boolean;
  depositAmount: number;
  requireDocuments: boolean;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
  overageRoundingMode: 'ceil' | 'floor' | 'nearest';
}

const baseRecords = venueBases as VenueBaseRecord[];
const templateRecords = documentTemplates as DocumentTemplateRecord[];
const imageRecords = venueImages as VenueImageRecord[];
const priceRecords = venuePrices as VenuePriceRecord[];
const timeSlotRecords = venueTimeSlots as VenueTimeSlotRecord[];
const rentalItemRecords = venueRentalItems as VenueRentalItemRecord[];
const requiredDocumentRecords = venueRequiredDocuments as VenueRequiredDocumentRecord[];
const holidaySettingRecords = venueHolidaySettings as VenueHolidaySettingRecord[];
const rentalModeRecords = venueRentalModes as VenueRentalModeRecord[];

const templateByKey = new Map(templateRecords.map((template) => [template.key, template]));

const dayKeyMap: Record<string, string> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
};

const uiModeMap = {
  daily: 'daily',
  timeslot: 'session',
  hourly: 'hourly',
} as const;

function normalizeOpeningHours(raw: Record<string, string | null>) {
  const result: Record<string, { open: string; close: string; lunchBreakStart?: string; lunchBreakEnd?: string }> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!value) continue;
    const longKey = dayKeyMap[key] ?? key;
    const [open, close] = value.split(' - ').map((part) => part.trim());
    if (open && close) {
      result[longKey] = { open, close };
    }
  }
  return result;
}

function sortByOrder<T extends { sortOrder?: number | null }>(items: T[]) {
  return [...items].sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER));
}

function buildRequiredDocuments(venueId: number): RequiredDocument[] {
  const grouped = new Map<string, RequiredDocument>();
  const records = requiredDocumentRecords.filter((record) => record.venueId === venueId);

  for (const record of records) {
    const template = templateByKey.get(record.templateKey);
    if (!template) continue;

    if (!grouped.has(record.templateKey)) {
      grouped.set(record.templateKey, {
        key: template.key,
        label: template.label,
        hint: template.hint,
        required: record.required,
        templateFile: record.templateFile,
        appliesTo: { daily: false, session: false, hourly: false },
      });
    }

    const target = grouped.get(record.templateKey)!;
    const appliesToModes = record.appliesTo?.length ? record.appliesTo : [record.mode];
    target.required = target.required || record.required;
    target.templateFile = target.templateFile ?? record.templateFile;

    for (const mode of appliesToModes) {
      target.appliesTo[uiModeMap[mode]] = true;
    }
  }

  return Array.from(grouped.values());
}

function buildSessionDefs(venueId: number): SessionDef[] {
  const pricesByCode = new Map(
    priceRecords
      .filter((record) => record.venueId === venueId && record.mode === 'timeslot')
      .map((record) => [record.timeSlotCode ?? '', record]),
  );

  return [...timeSlotRecords]
    .filter((record) => record.venueId === venueId)
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .map((record) => {
      const price = pricesByCode.get(record.slotCode);
      return {
        name: record.name,
        startTime: record.startTime,
        endTime: record.endTime,
        weekday: price?.price ?? 0,
        weekend: price?.weekendPrice ?? price?.price ?? 0,
        identityRows: [],
      };
    });
}

function buildPriceMap(venueId: number, mode: 'daily' | 'hourly'): ModePricing {
  const record = priceRecords.find((price) => price.venueId === venueId && price.mode === mode);
  return {
    weekday: record?.price ?? 0,
    weekend: record?.weekendPrice ?? record?.price ?? 0,
    identityRows: [],
  };
}

function buildRentalItems(venueId: number): RentalItem[] {
  return sortByOrder(rentalItemRecords.filter((record) => record.venueId === venueId)).map((record, index) => ({
    label: record.label,
    unit: record.unit,
    amount: record.amount,
    quantity: record.quantity,
    maxPerBooking: record.maxPerBooking,
    sortOrder: record.sortOrder ?? index,
  })) as unknown as RentalItem[];
}

function buildImages(venueId: number) {
  const images = sortByOrder(imageRecords.filter((record) => record.venueId === venueId));
  const gallery = images.map((record) => record.url);
  const main = images.find((record) => record.isMain)?.url ?? gallery[0] ?? '';

  return {
    mainImageUrl: main,
    gallery,
  };
}

function getHolidaySettings(venueId: number) {
  const settings = holidaySettingRecords.find((record) => record.venueId === venueId);
  return {
    weekendDays: settings?.weekendDays ?? [0, 6],
    weekendIncludeHolidays: settings?.weekendIncludeHolidays ?? false,
  };
}

function getRentalModeSettings(venueId: number) {
  const modes = rentalModeRecords.filter((record) => record.venueId === venueId);
  const byMode = new Map(modes.map((record) => [record.mode, record]));
  return byMode;
}

function filterRequiredDocumentsByMode(requiredDocuments: RequiredDocument[], mode: 'daily' | 'session' | 'hourly') {
  return requiredDocuments.filter((document) => document.appliesTo[mode]);
}

export function getAllVenueBaseRecords() {
  return baseRecords;
}

// 尚未載入（或查無場館）時的空白表單，形狀與 getVenueEditFormData 回傳一致
export function createEmptyVenueEditFormData(): VenueEditFormData {
  const emptyModeBase = (): RentalModeBase => ({
    enabled: false,
    requireDocuments: false,
    requiredDocuments: [],
    depositEnabled: false,
    depositAmount: 0,
    setupTeardownEnabled: true,
    setupAllowanceHours: 1,
    teardownAllowanceHours: 1,
    setupOverageUnitMinutes: 30,
    teardownOverageUnitMinutes: 30,
    setupOverageFeePerUnit: 0,
    teardownOverageFeePerUnit: 0,
    overageRoundingMode: 'ceil',
    advanceBookingDays: 7,
    latestBookingDays: 1,
    cancellationDeadlineDays: 7,
    receiptUploadDeadlineDays: 3,
    documentUploadDeadlineDays: 7,
    weekendPricingEnabled: false,
    weekendDays: [0, 6],
    weekendIncludeHolidays: false,
  });
  const emptyPricing = (): ModePricing => ({ weekday: 0, weekend: 0, identityRows: [] });

  return {
    id: 0,
    parentId: null,
    name: '',
    status: 'available',
    capacity: 0,
    location: '',
    type: '',
    description: '',
    mainImageUrl: '',
    gallery: [],
    pricePerHour: 0,
    facilities: [],
    openingHours: {},
    rentalModes: {
      daily: { ...emptyModeBase(), minDays: 0, maxDays: 0 },
      session: { ...emptyModeBase(), sessions: [] },
      hourly: { ...emptyModeBase(), minHours: 0, maxHours: 0 },
    },
    pricing: { daily: emptyPricing(), session: emptyPricing(), hourly: emptyPricing() },
    closedWeekdays: [],
    closedDates: [],
    rentalItems: [],
    notices: [],
    isActive: true,
    advanceBookingDays: 7,
    latestBookingDays: 1,
    receiptUploadDeadlineDays: 3,
    documentUploadDeadlineDays: 7,
    cancellationDeadlineDays: 7,
    weekendDays: [0, 6],
    weekendIncludeHolidays: false,
    weekendPricingEnabled: false,
    requiredDocuments: [],
  };
}

export function getVenueEditFormData(venueId: number): VenueEditFormData | null {
  const base = baseRecords.find((record) => record.id === venueId);
  if (!base) return null;

  const rentalModeMap = getRentalModeSettings(venueId);
  const requiredDocuments = buildRequiredDocuments(venueId);
  const sessionDefs = buildSessionDefs(venueId);
  const dailyPricing = buildPriceMap(venueId, 'daily');
  const hourlyPricing = buildPriceMap(venueId, 'hourly');
  const rentalItems = buildRentalItems(venueId);
  const images = buildImages(venueId);
  const holidaySettings = getHolidaySettings(venueId);
  const weekendPricingEnabled = holidaySettings.weekendDays.length > 0 || holidaySettings.weekendIncludeHolidays;

  // 各模式共通的規則欄位：mock 資料無 per-mode 值，以場館層級為預設（皆為純量，展開即各自一份）
  const modeRules = {
    setupTeardownEnabled: true,
    advanceBookingDays: base.advanceBookingDays ?? 7,
    latestBookingDays: base.latestBookingDays ?? 1,
    cancellationDeadlineDays: base.cancellationDeadlineDays ?? 7,
    receiptUploadDeadlineDays: base.receiptUploadDeadlineDays ?? 3,
    documentUploadDeadlineDays: base.documentUploadDeadlineDays ?? 7,
  };

  return {
    id: base.id,
    parentId: base.parentId,
    name: base.name,
    status: base.status,
    capacity: base.capacity,
    location: base.location,
    type: base.type,
    description: base.description,
    mainImageUrl: images.mainImageUrl,
    gallery: images.gallery,
    pricePerHour: hourlyPricing.weekday ?? 0,
    facilities: [...(base.facilities ?? [])],
    openingHours: normalizeOpeningHours(base.openingHours),
    rentalModes: {
      daily: {
        enabled: rentalModeMap.get('daily')?.isEnabled ?? false,
        minDays: rentalModeMap.get('daily')?.minDays ?? 1,
        maxDays: rentalModeMap.get('daily')?.maxDays ?? 30,
        requireDocuments: rentalModeMap.get('daily')?.requireDocuments ?? false,
        requiredDocuments: filterRequiredDocumentsByMode(requiredDocuments, 'daily'),
        depositEnabled: rentalModeMap.get('daily')?.depositEnabled ?? false,
        depositAmount: rentalModeMap.get('daily')?.depositAmount ?? 0,
        setupAllowanceHours: rentalModeMap.get('daily')?.setupAllowanceHours ?? 1,
        teardownAllowanceHours: rentalModeMap.get('daily')?.teardownAllowanceHours ?? 1,
        setupOverageUnitMinutes: rentalModeMap.get('daily')?.setupOverageUnitMinutes ?? 30,
        teardownOverageUnitMinutes: rentalModeMap.get('daily')?.teardownOverageUnitMinutes ?? 30,
        setupOverageFeePerUnit: rentalModeMap.get('daily')?.setupOverageFeePerUnit ?? 0,
        teardownOverageFeePerUnit: rentalModeMap.get('daily')?.teardownOverageFeePerUnit ?? 0,
        overageRoundingMode: rentalModeMap.get('daily')?.overageRoundingMode ?? 'ceil',
        ...modeRules,
        weekendPricingEnabled,
        weekendDays: [...holidaySettings.weekendDays],
        weekendIncludeHolidays: holidaySettings.weekendIncludeHolidays,
      },
      session: {
        enabled: rentalModeMap.get('timeslot')?.isEnabled ?? false,
        sessions: sessionDefs,
        requireDocuments: rentalModeMap.get('timeslot')?.requireDocuments ?? false,
        requiredDocuments: filterRequiredDocumentsByMode(requiredDocuments, 'session'),
        depositEnabled: rentalModeMap.get('timeslot')?.depositEnabled ?? false,
        depositAmount: rentalModeMap.get('timeslot')?.depositAmount ?? 0,
        setupAllowanceHours: rentalModeMap.get('timeslot')?.setupAllowanceHours ?? 1,
        teardownAllowanceHours: rentalModeMap.get('timeslot')?.teardownAllowanceHours ?? 1,
        setupOverageUnitMinutes: rentalModeMap.get('timeslot')?.setupOverageUnitMinutes ?? 30,
        teardownOverageUnitMinutes: rentalModeMap.get('timeslot')?.teardownOverageUnitMinutes ?? 30,
        setupOverageFeePerUnit: rentalModeMap.get('timeslot')?.setupOverageFeePerUnit ?? 0,
        teardownOverageFeePerUnit: rentalModeMap.get('timeslot')?.teardownOverageFeePerUnit ?? 0,
        overageRoundingMode: rentalModeMap.get('timeslot')?.overageRoundingMode ?? 'ceil',
        ...modeRules,
        weekendPricingEnabled,
        weekendDays: [...holidaySettings.weekendDays],
        weekendIncludeHolidays: holidaySettings.weekendIncludeHolidays,
      },
      hourly: {
        enabled: rentalModeMap.get('hourly')?.isEnabled ?? false,
        minHours: rentalModeMap.get('hourly')?.minHours ?? 1,
        maxHours: rentalModeMap.get('hourly')?.maxHours ?? 12,
        requireDocuments: rentalModeMap.get('hourly')?.requireDocuments ?? false,
        requiredDocuments: filterRequiredDocumentsByMode(requiredDocuments, 'hourly'),
        depositEnabled: rentalModeMap.get('hourly')?.depositEnabled ?? false,
        depositAmount: rentalModeMap.get('hourly')?.depositAmount ?? 0,
        setupAllowanceHours: rentalModeMap.get('hourly')?.setupAllowanceHours ?? 1,
        teardownAllowanceHours: rentalModeMap.get('hourly')?.teardownAllowanceHours ?? 1,
        setupOverageUnitMinutes: rentalModeMap.get('hourly')?.setupOverageUnitMinutes ?? 30,
        teardownOverageUnitMinutes: rentalModeMap.get('hourly')?.teardownOverageUnitMinutes ?? 30,
        setupOverageFeePerUnit: rentalModeMap.get('hourly')?.setupOverageFeePerUnit ?? 0,
        teardownOverageFeePerUnit: rentalModeMap.get('hourly')?.teardownOverageFeePerUnit ?? 0,
        overageRoundingMode: rentalModeMap.get('hourly')?.overageRoundingMode ?? 'ceil',
        ...modeRules,
        weekendPricingEnabled,
        weekendDays: [...holidaySettings.weekendDays],
        weekendIncludeHolidays: holidaySettings.weekendIncludeHolidays,
      },
    },
    pricing: {
      daily: dailyPricing,
      session: { weekday: 0, weekend: 0, identityRows: [] },
      hourly: hourlyPricing,
    },
    closedWeekdays: [...(base.closedWeekdays ?? [])],
    closedDates: [...(base.closedDates ?? [])],
    rentalItems,
    notices: [...(base.notices ?? [])],
    isActive: base.isActive ?? base.status === 'available',
    advanceBookingDays: base.advanceBookingDays ?? 7,
    latestBookingDays: base.latestBookingDays ?? 1,
    receiptUploadDeadlineDays: base.receiptUploadDeadlineDays ?? 3,
    documentUploadDeadlineDays: base.documentUploadDeadlineDays ?? 7,
    cancellationDeadlineDays: base.cancellationDeadlineDays ?? 7,
    weekendDays: [...holidaySettings.weekendDays],
    weekendIncludeHolidays: holidaySettings.weekendIncludeHolidays,
    weekendPricingEnabled,
    requiredDocuments,
  };
}
