import type { CalendarEvent } from '@/types/calendar';

const DATASET_PATH = '/dataset/14718';

function getDatasetUrl() {
  return import.meta.env.DEV
    ? `/api/data-gov${DATASET_PATH}`
    : `https://data.gov.tw${DATASET_PATH}`;
}

function toProxyCsvUrl(csvUrl: string) {
  if (!import.meta.env.DEV) return csvUrl;
  const parsed = new URL(csvUrl);
  return `/api/dgpa/file?${parsed.searchParams.toString()}`;
}

function normalizeCsvUrl(rawUrl: string) {
  return rawUrl.replace(/&amp;/g, '&');
}

function looksLikeExpectedHeader(text: string) {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  return header.includes('日期') && header.includes('放假');
}

function readCsvText(buffer: ArrayBuffer) {
  // 實務上來源可能是 UTF-8 或 Big5，先嘗試 UTF-8，再回退 Big5，避免假日名稱亂碼。
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (looksLikeExpectedHeader(utf8)) return utf8;

  const big5 = new TextDecoder('big5').decode(buffer);
  if (looksLikeExpectedHeader(big5)) return big5;

  return utf8;
}

function parseGovHolidayRows(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    return {
      date: (cells[0] ?? '').replace(/"/g, '').trim(),
      isHoliday: (cells[2] ?? '').replace(/"/g, '').trim(),
      note: (cells[3] ?? '').replace(/"/g, '').trim(),
    };
  });
}

function toIsoDate(date: string) {
  if (!/^\d{8}$/.test(date)) return null;
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function parseHolidayEvents(csvText: string): CalendarEvent[] {
  const rows = parseGovHolidayRows(csvText);
  return rows
    .filter((row) => row.isHoliday !== '0' && row.note)
    .map((row): CalendarEvent | null => {
      const isoDate = toIsoDate(row.date);
      if (!isoDate) return null;
      return {
        id: `gov-holiday-${isoDate}`,
        title: `國定假日 · ${row.note}`,
        type: 'closed' as const,
        start: `${isoDate}T00:00:00`,
        end: `${isoDate}T23:59:00`,
        allDay: true,
        description: row.note,
        metadata: {
          isGovernmentHoliday: true,
          source: 'data.gov.tw',
          holidayName: row.note,
        },
      };
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}

function getYearCsvUrl(html: string, rocYear: number) {
  const matches = [...html.matchAll(/https:\/\/www\.dgpa\.gov\.tw\/FileConversion\?[^"'\s<]+/g)]
    .map((match) => normalizeCsvUrl(match[0]));

  const candidates = matches.filter((url) => {
    const parsed = new URL(url);
    const fileName = decodeURIComponent(parsed.searchParams.get('name') ?? '');
    return fileName.includes(`${rocYear}年`) && !fileName.includes('Google');
  });

  return candidates.at(-1) ?? null;
}

async function fetchDatasetHtml(): Promise<string> {
  const pageRes = await fetch(getDatasetUrl());
  if (!pageRes.ok) throw new Error(`無法取得資料集頁面：${pageRes.status}`);
  return pageRes.text();
}

async function fetchYearHolidays(html: string, year: number): Promise<CalendarEvent[]> {
  const rocYear = year - 1911;
  const csvUrl = getYearCsvUrl(html, rocYear);
  if (!csvUrl) return [];

  const csvRes = await fetch(toProxyCsvUrl(csvUrl));
  if (!csvRes.ok) throw new Error(`無法下載假日 CSV：${csvRes.status}`);

  const csvText = readCsvText(await csvRes.arrayBuffer());
  return parseHolidayEvents(csvText);
}

export async function fetchGovernmentHolidayEvents(years: number[]): Promise<CalendarEvent[]> {
  const uniqueYears = [...new Set(years)];
  // 各年份的 CSV 連結都列在同一個資料集頁面上，只抓一次共用
  const html = await fetchDatasetHtml();
  const settled = await Promise.allSettled(uniqueYears.map((year) => fetchYearHolidays(html, year)));

  const merged = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const deduped = new Map<string, CalendarEvent>();
  for (const event of merged) deduped.set(event.id, event);
  return [...deduped.values()];
}
