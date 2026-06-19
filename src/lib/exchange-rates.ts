import type { ExchangeRateData, CustomCurrency } from '../types/record';
import { EXCHANGE_RATE_APIS } from '../types/record';
import type { RecordDAO } from './storage/index';

export function getExchangeRates(dao: RecordDAO): ExchangeRateData {
  return dao.getExchangeRates();
}

export function updateExchangeRates(dao: RecordDAO, exchangeRates: ExchangeRateData): void {
  dao.updateExchangeRates(exchangeRates);
}

export function getCustomCurrencies(dao: RecordDAO): CustomCurrency[] {
  return dao.getCustomCurrencies();
}

export function addCustomCurrency(dao: RecordDAO, currency: CustomCurrency): void {
  dao.addCustomCurrency(currency);
}

export function deleteCustomCurrency(dao: RecordDAO, code: string): void {
  dao.deleteCustomCurrency(code);
}

export function canFetchRatesFromAPI(dao: RecordDAO): { allowed: boolean; remainingHours: number } {
  const rates = dao.getExchangeRates();
  if (rates.source === 'api' && rates.lastUpdatedAt) {
    const hoursSinceLastUpdate = (Date.now() - rates.lastUpdatedAt) / (1000 * 60 * 60);
    if (hoursSinceLastUpdate < 24) {
      return { allowed: false, remainingHours: Math.ceil(24 - hoursSinceLastUpdate) };
    }
  }
  return { allowed: true, remainingHours: 0 };
}

export async function fetchExchangeRatesFromAPI(
  dao: RecordDAO,
  baseCurrency: string = 'CNY'
): Promise<{ success: boolean; message: string; rates?: Record<string, number> }> {
  const rateLimit = canFetchRatesFromAPI(dao);
  if (!rateLimit.allowed) {
    return { success: false, message: `请等待 ${rateLimit.remainingHours} 小时后再次获取` };
  }

  for (const api of EXCHANGE_RATE_APIS) {
    try {
      const response = await fetch(api.url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`汇率API ${api.name} 返回错误: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const rates = api.parser(data, baseCurrency);
      if (Object.keys(rates).length > 0) {
        dao.updateExchangeRates({
          rates,
          baseCurrency,
          lastUpdatedAt: Date.now(),
          source: 'api',
          apiSource: api.name,
        });
        return { success: true, message: `成功从 ${api.name} 获取汇率`, rates };
      }
    } catch (e) {
      console.warn(`汇率API ${api.name} 请求失败:`, e);
      continue;
    }
  }

  return { success: false, message: '所有汇率API均不可用，请检查网络连接' };
}
