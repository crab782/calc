export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRateData {
  base: string;
  rates: Record<string, number>;
  lastUpdatedAt?: string;
  source?: 'api' | 'manual';
}

export interface CustomCurrency {
  code: string;
  name: string;
  symbol: string;
}
