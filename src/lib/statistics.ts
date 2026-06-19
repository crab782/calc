import type { FinancialSource, FinancialPeriod } from '../types/record';
import type { RecordDAO } from './storage/index';

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

export interface MonthlyDataWithPrediction {
  month: string;
  income: number;
  expense: number;
  savings: number;
  loanPayment: number;
  balance: number;
  balanceBeforeSavings: number;
  balanceAfterSavings: number;
  netAssets: number;
  isActual: boolean;
  isPartialActual?: boolean;
  boundaryDay?: number;
  balanceAtBoundary?: number;
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
  savings: number;
  loanPayment: number;
  balance: number;
  balanceBeforeSavings: number;
  balanceAfterSavings: number;
  netAssets: number;
  isActual: boolean;
}

export function getStatistics(dao: RecordDAO): Statistics {
  const currency = getDefaultAccountCurrency(dao);
  const records = dao.findAll().filter(r => r.currency === currency);

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

export function getMonthlyData(dao: RecordDAO): MonthlyData[] {
  const currency = getDefaultAccountCurrency(dao);
  const records = dao.findAll().filter(r => r.currency === currency);

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

function getDefaultAccountCurrency(dao: RecordDAO): string {
  const accounts = dao.getAccounts();
  const firstAccount = accounts.find(a => a.visible);
  return firstAccount ? firstAccount.currency : (accounts.length > 0 ? accounts[0].currency : 'CNY');
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSourceActiveOnDay(source: FinancialSource, date: Date, dayOfWeek: number): boolean {
  switch (source.period) {
    case 'daily':
      return true;
    case 'weekly':
      return source.dayOfWeek !== undefined && dayOfWeek === source.dayOfWeek;
    case 'monthly':
      if (source.dayOfMonth === undefined) return false;
      if (source.dayOfMonth === -1) {
        return date.getDate() === getLastDayOfMonth(date.getFullYear(), date.getMonth());
      }
      return date.getDate() === source.dayOfMonth;
    case 'yearly':
      if (source.dayOfMonth === undefined) return false;
      return date.getDate() === source.dayOfMonth && date.getMonth() === 0;
    case 'once':
      return false;
    default:
      return false;
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthlyLoanPayment(source: FinancialSource): number {
  const principal = source.principal || source.amount;
  const interestRate = source.interestRate || 0;
  const interestType = source.interestType || 'equal-payment';

  if (interestRate === 0) {
    return principal;
  }

  const monthlyRate = interestRate / 100 / 12;

  switch (interestType) {
    case 'equal-payment': {
      const months = getLoanMonths(source.period);
      if (months <= 0) return 0;
      const temp = Math.pow(1 + monthlyRate, months);
      return (principal * monthlyRate * temp) / (temp - 1);
    }
    case 'equal-principal': {
      const months = getLoanMonths(source.period);
      if (months <= 0) return 0;
      return principal / months + principal * monthlyRate;
    }
    case 'interest-first': {
      return principal * monthlyRate;
    }
    default:
      return 0;
  }
}

function getLoanMonths(period: FinancialPeriod): number {
  switch (period) {
    case 'daily': return 1 / 30;
    case 'weekly': return 1 / 4;
    case 'monthly': return 1;
    case 'yearly': return 12;
    case 'once': return 0;
    default: return 0;
  }
}

export function generateDailyDataWithPrediction(dao: RecordDAO): DailyData[] {
  const records = dao.findAll();
  const now = new Date();
  const currency = getDefaultAccountCurrency(dao);

  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 7, 0);

  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }

  const actualDailyData: Record<string, { income: number; expense: number }> = {};
  const filteredRecords = records.filter(r => r.currency === currency);
  filteredRecords.forEach(record => {
    const day = record.date;
    if (!actualDailyData[day]) {
      actualDailyData[day] = { income: 0, expense: 0 };
    }
    if (record.type === 'income') {
      actualDailyData[day].income += record.amount;
    } else {
      actualDailyData[day].expense += record.amount;
    }
  });

  const incomeSources = dao.getFinancialSourcesByType('income').filter(s => s.currency === currency);
  const expenseSources = dao.getFinancialSourcesByType('expense').filter(s => s.currency === currency);

  const investmentSources = dao.getFinancialSourcesByType('investment').filter(s => s.currency === currency);
  const loanSources = dao.getFinancialSourcesByType('loan').filter(s => s.currency === currency);

  // Pre-calculate monthly loan payment for each loan source
  const loanMonthlyPayments = new Map<string, number>();
  loanSources.forEach(s => {
    loanMonthlyPayments.set(s.id, getMonthlyLoanPayment(s));
  });

  const result: DailyData[] = [];
  let runningBalance = 0;
  let runningBalanceBeforeSavings = 0;
  let runningBalanceAfterSavings = 0;
  let cumulativeSavings = 0;
  let cumulativeLoan = 0;

  const sortedActualDays = Object.keys(actualDailyData).filter(day => day < dates[0]).sort();
  for (const day of sortedActualDays) {
    const diff = actualDailyData[day].income - actualDailyData[day].expense;
    runningBalance += diff;
    runningBalanceBeforeSavings += diff;
    runningBalanceAfterSavings += diff;
  }

  const todayStr = formatDateISO(now);

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const isFuture = date > todayStr;
    const hasActualData = actualDailyData[date] !== undefined;

    let income = 0;
    let expense = 0;
    let savings = 0;
    let loanPayment = 0;

    if (hasActualData) {
      income = actualDailyData[date].income;
      expense = actualDailyData[date].expense;
    } else if (isFuture) {
      const d = parseDateISO(date);
      const dayOfWeek = d.getDay();
      const daysInMonth = getDaysInMonth(d.getFullYear(), d.getMonth());

      incomeSources.forEach(source => {
        if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          income += source.amount;
        }
      });

      expenseSources.forEach(source => {
        if (source.period === 'monthly') {
          expense += source.amount / daysInMonth;
        } else if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          expense += source.amount;
        }
      });

      // Savings / investment contributions
      investmentSources.forEach(source => {
        if (source.period === 'monthly') {
          savings += source.amount / daysInMonth;
        } else if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          savings += source.amount;
        }
      });

      // Loan payments
      loanSources.forEach(source => {
        const monthlyPayment = loanMonthlyPayments.get(source.id) || 0;
        if (source.period === 'monthly') {
          loanPayment += monthlyPayment / daysInMonth;
        } else if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          loanPayment += monthlyPayment;
        }
      });
    }

    runningBalance += income - expense;
    runningBalanceBeforeSavings += income - expense - loanPayment;
    runningBalanceAfterSavings += income - expense - savings - loanPayment;
    cumulativeSavings += savings;
    cumulativeLoan += loanPayment;

    result.push({
      date,
      income,
      expense,
      savings,
      loanPayment,
      balance: runningBalance,
      balanceBeforeSavings: runningBalanceBeforeSavings,
      balanceAfterSavings: runningBalanceAfterSavings,
      netAssets: runningBalance + cumulativeSavings - cumulativeLoan,
      isActual: !isFuture,
    });
  }

  return result;
}

export function aggregateDailyToMonthly(dailyData: DailyData[]): MonthlyDataWithPrediction[] {
  const now = new Date();
  const currentMonth = formatDateISO(now).substring(0, 7);
  const todayStr = formatDateISO(now);
  const boundaryDay = now.getDate();

  const monthlyMap: Record<string, {
    month: string;
    income: number;
    expense: number;
    savings: number;
    loanPayment: number;
    balance: number;
    balanceBeforeSavings: number;
    balanceAfterSavings: number;
    netAssets: number;
    isActual: boolean;
    isPartialActual?: boolean;
    boundaryDay?: number;
    balanceAtBoundary?: number;
  }> = {};

  dailyData.forEach(day => {
    const month = day.date.substring(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month, income: 0, expense: 0, savings: 0, loanPayment: 0,
        balance: 0, balanceBeforeSavings: 0, balanceAfterSavings: 0, netAssets: 0,
        isActual: true,
      };
    }
    monthlyMap[month].income += day.income;
    monthlyMap[month].expense += day.expense;
    monthlyMap[month].savings += day.savings;
    monthlyMap[month].loanPayment += day.loanPayment;
    monthlyMap[month].balance = day.balance;
    monthlyMap[month].balanceBeforeSavings = day.balanceBeforeSavings;
    monthlyMap[month].balanceAfterSavings = day.balanceAfterSavings;
    monthlyMap[month].netAssets = day.netAssets;

    if (month === currentMonth) {
      monthlyMap[month].isActual = false;
      monthlyMap[month].isPartialActual = true;
      monthlyMap[month].boundaryDay = boundaryDay;
      if (day.date === todayStr) {
        monthlyMap[month].balanceAtBoundary = day.balance;
      }
    } else if (day.date <= todayStr) {
    } else {
      if (month !== currentMonth) {
        monthlyMap[month].isActual = false;
      }
    }
  });

  return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
}

export function generateMonthlyDataWithPrediction(dao: RecordDAO): MonthlyDataWithPrediction[] {
  const dailyData = generateDailyDataWithPrediction(dao);
  return aggregateDailyToMonthly(dailyData);
}
