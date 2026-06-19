import type { FinancialSource, InvestmentSource, LoanSource } from './types';

/**
 * 判断财务来源在指定日期是否处于活跃（触发）状态
 * @param source 财务来源
 * @param date 目标日期
 * @returns 是否在该日期触发
 */
export function isSourceActiveOnDay(source: FinancialSource, date: Date): boolean {
  if (!source.enabled) {
    return false;
  }

  switch (source.cycle) {
    case 'daily':
      return true;

    case 'weekly':
      return isWeeklyActive(source, date);

    case 'biweekly':
      return isBiweeklyActive(source, date);

    case 'monthly':
      return isMonthlyActive(source, date);

    case 'yearly':
      return isYearlyActive(source, date);

    default:
      return false;
  }
}

/**
 * 按周周期判断：匹配 dayOfWeek（0=周日, 6=周六）
 */
function isWeeklyActive(source: FinancialSource, date: Date): boolean {
  if (source.dayOfWeek === undefined) {
    return false;
  }
  return date.getDay() === source.dayOfWeek;
}

/**
 * 双周周期判断：匹配 dayOfWeek 且为第偶数周（从 Unix epoch 起算的周数）
 */
function isBiweeklyActive(source: FinancialSource, date: Date): boolean {
  if (source.dayOfWeek === undefined) {
    return false;
  }
  if (date.getDay() !== source.dayOfWeek) {
    return false;
  }
  // 计算从 1970-01-01 到当前日期的周数，判断是否为偶数周
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(dayOfYear / 7);
  return weekNumber % 2 === 0;
}

/**
 * 按月周期判断：匹配 dayOfMonth
 */
function isMonthlyActive(source: FinancialSource, date: Date): boolean {
  if (source.dayOfMonth === undefined) {
    return false;
  }

  // 支持 -1 表示每月最后一天
  if (source.dayOfMonth === -1) {
    return date.getDate() === getLastDayOfMonth(
      date.getFullYear(),
      date.getMonth()
    );
  }

  return date.getDate() === source.dayOfMonth;
}

/**
 * 按年周期判断：使用 dayOfMonth（1-366）或默认 1 月 1 日
 * 不硬编码只限 1 月，支持 dayOfMonth 映射为具体日期
 */
function isYearlyActive(source: FinancialSource, date: Date): boolean {
  // 如果未配置 dayOfMonth，默认每年 1 月 1 日触发
  if (source.dayOfMonth === undefined) {
    return date.getMonth() === 0 && date.getDate() === 1;
  }

  // dayOfMonth 为 -1 时，表示每年 12 月 31 日
  if (source.dayOfMonth === -1) {
    return date.getMonth() === 11 && date.getDate() === 31;
  }

  // dayOfMonth > 12 时，作为一年中的第 N 天（1-366）
  if (source.dayOfMonth > 12) {
    const dayOfYear = getDayOfYear(date);
    return dayOfYear === source.dayOfMonth;
  }

  // dayOfMonth 1-12 时，作为每年第 N 月的第 1 天触发
  return date.getMonth() === source.dayOfMonth - 1 && date.getDate() === 1;
}

/**
 * 获取指定年月的最后一天的日期
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 获取日期是一年中的第几天（1-366）
 */
function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 类型守卫：判断是否为 InvestmentSource
 */
export function isInvestmentSource(
  source: FinancialSource
): source is InvestmentSource {
  return source.type === 'investment';
}

/**
 * 类型守卫：判断是否为 LoanSource
 */
export function isLoanSource(source: FinancialSource): source is LoanSource {
  return source.type === 'loan';
}
