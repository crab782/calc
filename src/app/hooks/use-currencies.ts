import { useState, useCallback } from 'react';
import type { ExchangeRateData, CustomCurrency } from '../../types/record';
import { recordService } from '../../data/service';

export function useCurrencies() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateData>(
    () => recordService.getExchangeRates(),
  );
  const [customCurrencies, setCustomCurrencies] = useState<CustomCurrency[]>(
    () => recordService.getCustomCurrencies(),
  );

  const updateExchangeRate = useCallback((rates: Record<string, number>, baseCurrency = 'CNY') => {
    recordService.updateExchangeRates({
      rates,
      baseCurrency,
      lastUpdatedAt: Date.now(),
      source: 'manual',
    });
    setExchangeRates(recordService.getExchangeRates());
  }, []);

  const fetchExchangeRatesFromAPI = useCallback(async (baseCurrency = 'CNY') => {
    const result = await recordService.fetchExchangeRatesFromAPI(baseCurrency);
    if (result.success) {
      setExchangeRates(recordService.getExchangeRates());
    }
    return result;
  }, []);

  const canFetchRatesFromAPI = useCallback(() => recordService.canFetchRatesFromAPI(), []);

  const addCustomCurrency = useCallback((currency: CustomCurrency) => {
    recordService.addCustomCurrency(currency);
    setCustomCurrencies(recordService.getCustomCurrencies());
  }, []);

  const deleteCustomCurrency = useCallback((code: string) => {
    recordService.deleteCustomCurrency(code);
    setCustomCurrencies(recordService.getCustomCurrencies());
  }, []);

  return {
    exchangeRates,
    customCurrencies,
    updateExchangeRate,
    fetchExchangeRatesFromAPI,
    canFetchRatesFromAPI,
    addCustomCurrency,
    deleteCustomCurrency,
  };
}
