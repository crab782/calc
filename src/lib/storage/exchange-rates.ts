import type { ExchangeRateData, CustomCurrency } from '../../types/record';
import { DEFAULT_EXCHANGE_RATES } from '../../types/record';
import type { SchemaManager } from './schema';

export class ExchangeRateStore {
  schema: SchemaManager;
  constructor(schema: SchemaManager) {
    this.schema = schema;
  }

  getExchangeRates(): ExchangeRateData {
    const schema = this.schema.getSchema();
    return schema.exchangeRates || {
      rates: { ...DEFAULT_EXCHANGE_RATES },
      baseCurrency: 'CNY',
      lastUpdatedAt: Date.now(),
      source: 'default',
    };
  }

  updateExchangeRates(exchangeRates: ExchangeRateData): void {
    const schema = this.schema.getSchema();
    schema.exchangeRates = exchangeRates;
    this.schema.saveSchema(schema);
  }

  getCustomCurrencies(): CustomCurrency[] {
    const schema = this.schema.getSchema();
    return [...(schema.customCurrencies || [])];
  }

  addCustomCurrency(currency: CustomCurrency): void {
    const schema = this.schema.getSchema();
    if (!schema.customCurrencies) {
      schema.customCurrencies = [];
    }
    if (!schema.customCurrencies.some(c => c.code === currency.code)) {
      schema.customCurrencies.push(currency);
      this.schema.saveSchema(schema);
    }
  }

  deleteCustomCurrency(code: string): void {
    const schema = this.schema.getSchema();
    if (!schema.customCurrencies) {
      schema.customCurrencies = [];
    }
    schema.customCurrencies = schema.customCurrencies.filter(c => c.code !== code);
    this.schema.saveSchema(schema);
  }
}
