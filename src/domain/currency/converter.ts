import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from './constants';

export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number,
): number {
  if (fromRate === 0) return 0;
  return +(amount * (toRate / fromRate)).toFixed(2);
}

export function getSymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || CURRENCY_SYMBOLS[DEFAULT_CURRENCY];
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
): string {
  const symbol = getSymbol(currencyCode);
  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}
