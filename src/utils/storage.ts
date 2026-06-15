import type { Record } from '../types';

const STORAGE_KEY = 'expense_tracker_records';

export const getRecords = (): Record[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveRecord = (record: Record): void => {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const deleteRecord = (id: string): void => {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const exportData = (): string => {
  const records = getRecords();
  return JSON.stringify(records, null, 2);
};

export const importData = (jsonString: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      return { success: false, message: '导入数据格式错误，应为数组' };
    }
    
    const validRecords: Record[] = [];
    let skippedCount = 0;
    
    for (const item of data) {
      if (isValidRecord(item)) {
        validRecords.push(item as Record);
      } else {
        skippedCount++;
      }
    }
    
    if (validRecords.length === 0) {
      return { success: false, message: '没有有效数据可导入' };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecords));
    
    const message = skippedCount > 0
      ? `成功导入 ${validRecords.length} 条记录，跳过 ${skippedCount} 条无效记录`
      : `成功导入 ${validRecords.length} 条记录`;
    
    return { success: true, message };
  } catch (error) {
    return { success: false, message: 'JSON 解析错误：' + (error as Error).message };
  }
};

const isValidRecord = (item: unknown): boolean => {
  if (typeof item !== 'object' || item === null) return false;
  
  const record = item as Record;
  return (
    typeof record.id === 'string' &&
    (record.type === 'income' || record.type === 'expense') &&
    typeof record.amount === 'number' && record.amount > 0 &&
    typeof record.category === 'string' &&
    typeof record.date === 'string'
  );
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
