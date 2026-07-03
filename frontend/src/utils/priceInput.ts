// 金額輸入框的千分位顯示與解析（顯示 1,200；輸入僅取數字）

export function formatPrice(value: number): string {
  return Math.max(0, value).toLocaleString('en-US');
}

export function parsePriceInput(value: string): number {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly === '' ? 0 : Number(digitsOnly);
}
