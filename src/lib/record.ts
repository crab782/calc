import type { ExpenseRecord, DataSchema } from '../types/record';
import { recordDAO } from './storage';

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export class RecordService {
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  getAllRecords(): ExpenseRecord[] {
    return recordDAO.findAll();
  }

  getRecordById(id: string): ExpenseRecord | undefined {
    return recordDAO.findById(id);
  }

  addRecord(data: {
    type: 'income' | 'expense';
    amount: number;
    note: string;
    category: string;
    date: string;
  }): void {
    const record: ExpenseRecord = {
      id: this.generateId(),
      type: data.type,
      amount: data.amount,
      note: data.note,
      category: data.category,
      date: data.date,
      createdAt: Date.now(),
    };
    recordDAO.save(record);
  }

  updateRecord(id: string, data: Partial<ExpenseRecord>): void {
    const existing = recordDAO.findById(id);
    if (existing) {
      const updated: ExpenseRecord = { ...existing, ...data };
      recordDAO.save(updated);
    }
  }

  deleteRecord(id: string): void {
    recordDAO.delete(id);
  }

  deleteAllRecords(): void {
    recordDAO.deleteAll();
  }

  getRecordCount(): number {
    return recordDAO.count();
  }

  getStatistics(): Statistics {
    const records = recordDAO.findAll();
    
    return records.reduce(
      (acc, record) => {
        if (record.type === 'income') {
          acc.totalIncome += record.amount;
        } else {
          acc.totalExpense += record.amount;
        }
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }

  getMonthlyData(): MonthlyData[] {
    const records = recordDAO.findAll();
    
    const monthlyData = records.reduce((acc, record) => {
      const month = record.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        acc[month].income += record.amount;
      } else {
        acc[month].expense += record.amount;
      }
      return acc;
    }, {} as Record<string, MonthlyData>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }

  getRecentRecords(limit: number = 10): ExpenseRecord[] {
    const records = recordDAO.findAll();
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  exportData(): string {
    const data = recordDAO.exportData();
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString) as DataSchema;
      return recordDAO.importData(data);
    } catch {
      return { success: false, message: 'JSON 解析错误' };
    }
  }
}

export const recordService = new RecordService();