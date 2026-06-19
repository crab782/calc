import type { ExpenseRecord } from '../../types/record';

export interface DailyData {
  date: string;
  income: number;
  expense: number;
  isActual?: boolean;
}

/**
 * 计算日级数据，返回最近 days 天的数据
 * 仅统计 type === 'income' 和 type === 'expense'
 */
export function calculateDailyData(
  records: ExpenseRecord[],
  days: number,
  currency: string
): DailyData[] {
  const filtered = records.filter((r) => r.currency === currency);
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  const startStr = formatDateISO(startDate);
  const endStr = formatDateISO(now);

  // 按日聚合实际记录
  const dailyMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((record) => {
    if (record.date >= startStr && record.date <= endStr) {
      const day = record.date;
      if (!dailyMap[day]) {
        dailyMap[day] = { income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        dailyMap[day].income += record.amount;
      } else if (record.type === 'expense') {
        dailyMap[day].expense += record.amount;
      }
    }
  });

  // 生成完整的日期范围（包括没有记录的日期）
  const result: DailyData[] = [];
  const current = new Date(startDate);
  while (current <= now) {
    const dateStr = formatDateISO(current);
    const data = dailyMap[dateStr] || { income: 0, expense: 0 };
    result.push({
      date: dateStr,
      income: data.income,
      expense: data.expense,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
