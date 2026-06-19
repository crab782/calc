import type { Currency } from './types';

export const DEFAULT_CURRENCY = 'CNY';

export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const CURRENCIES: Currency[] = CURRENCY_OPTIONS.map((option) => ({
  code: option.value,
  name: option.value,
  symbol: CURRENCY_SYMBOLS[option.value] || '',
}));
