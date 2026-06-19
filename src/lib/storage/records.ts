import type { ExpenseRecord } from '../../types/record';
import type { SchemaManager } from './schema';

export class RecordStore {
  schema: SchemaManager;
  constructor(schema: SchemaManager) {
    this.schema = schema;
  }

  findAll(): ExpenseRecord[] {
    const schema = this.schema.getSchema();
    return schema.records.map(record => ({
      ...record,
      currency: record.currency || 'CNY',
    }));
  }

  findById(id: string): ExpenseRecord | undefined {
    const schema = this.schema.getSchema();
    const record = schema.records.find((r) => r.id === id);
    if (!record) return undefined;
    return { ...record, currency: record.currency || 'CNY' };
  }

  findByMonth(month: string): ExpenseRecord[] {
    const schema = this.schema.getSchema();
    return schema.records
      .filter((r) => r.date.startsWith(month))
      .map(record => ({ ...record, currency: record.currency || 'CNY' }));
  }

  save(record: ExpenseRecord): void {
    const schema = this.schema.getSchema();
    const index = schema.records.findIndex((r) => r.id === record.id);

    if (index >= 0) {
      schema.records[index] = record;
    } else {
      schema.records.push(record);
    }

    this.schema.saveSchema(schema);
  }

  delete(id: string): void {
    const schema = this.schema.getSchema();
    schema.records = schema.records.filter((r) => r.id !== id);
    this.schema.saveSchema(schema);
  }

  deleteAll(): void {
    localStorage.removeItem('expense_tracker_data');
  }

  count(): number {
    const schema = this.schema.getSchema();
    return schema.records.length;
  }
}
