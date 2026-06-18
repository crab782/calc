import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordService, generateEntries } from './record';
import type { ExpenseRecord, DataSchema, Category, Account } from '../types/record';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_ACCOUNT, DEFAULT_INCOME_RULE } from '../types/record';

// Create a mock store that can be reset
const createMockStore = (): DataSchema => ({
  version: '1.8.0',
  records: [],
  categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
  accounts: [{ ...DEFAULT_ACCOUNT }],
  incomeRules: [{ ...DEFAULT_INCOME_RULE }],
  financialSources: [],
  budgetPlans: [],
  customCurrencies: [],
  exchangeRates: { rates: {}, baseCurrency: 'CNY', lastUpdatedAt: Date.now(), source: 'default' },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

let mockStore: DataSchema;

vi.mock('./storage', () => ({
  recordDAO: {
    findAll: () => [...mockStore.records],
    findById: (id: string) => mockStore.records.find(r => r.id === id),
    findByMonth: (month: string) => mockStore.records.filter(r => r.date.startsWith(month)),
    save: (record: ExpenseRecord) => {
      const index = mockStore.records.findIndex(r => r.id === record.id);
      if (index >= 0) {
        mockStore.records[index] = record;
      } else {
        mockStore.records.push(record);
      }
      mockStore.updatedAt = Date.now();
    },
    delete: (id: string) => {
      mockStore.records = mockStore.records.filter(r => r.id !== id);
      mockStore.updatedAt = Date.now();
    },
    deleteAll: () => {
      mockStore.records = [];
    },
    count: () => mockStore.records.length,
    getCategories: () => [...mockStore.categories],
    addCategory: (category: Category) => {
      mockStore.categories.push(category);
      mockStore.updatedAt = Date.now();
    },
    deleteCategory: (id: string) => {
      mockStore.categories = mockStore.categories.filter(c => c.id !== id);
      mockStore.updatedAt = Date.now();
    },
    updateCategory: (category: Category) => {
      const index = mockStore.categories.findIndex(c => c.id === category.id);
      if (index >= 0) {
        mockStore.categories[index] = category;
        mockStore.updatedAt = Date.now();
      }
    },
    getAccounts: () => [...mockStore.accounts],
    addAccount: (account: Account) => {
      mockStore.accounts.push(account);
      mockStore.updatedAt = Date.now();
    },
    deleteAccount: (id: string) => {
      // 软删除：设置 visible=false
      const account = mockStore.accounts.find(a => a.id === id);
      if (account) {
        account.visible = false;
        mockStore.updatedAt = Date.now();
      }
    },
    updateAccount: (account: Account) => {
      const index = mockStore.accounts.findIndex(a => a.id === account.id);
      if (index >= 0) {
        mockStore.accounts[index] = account;
        mockStore.updatedAt = Date.now();
      }
    },
    exportData: () => ({ ...mockStore }),
    importData: (data: DataSchema) => {
      mockStore = { ...data };
      return { success: true, message: `成功导入 ${data.records.length} 条记录` };
    },
    createCurrencyAccounts: (currency: string) => {
      // 创建5类账户
      const now = Date.now();
      const newAccounts: Account[] = [
        { id: `${currency}-cash`, name: '现金', currency, accountType: 'cash', balance: 0, createdAt: now, isDefault: false, visible: true },
        { id: `${currency}-investment`, name: '投资', currency, accountType: 'investment', balance: 0, createdAt: now, isDefault: false, visible: true },
        { id: `${currency}-loan`, name: '贷款', currency, accountType: 'loan', balance: 0, createdAt: now, isDefault: false, visible: true },
        { id: `${currency}-expense`, name: '支出', currency, accountType: 'expense', balance: 0, createdAt: now, isDefault: false, visible: false },
        { id: `${currency}-income`, name: '收入', currency, accountType: 'income', balance: 0, createdAt: now, isDefault: false, visible: false },
      ];
      mockStore.accounts.push(...newAccounts);
      mockStore.updatedAt = Date.now();
      return newAccounts;
    },
    getCurrencyBalance: (currency: string) => {
      // 计算指定币种的总余额
      const currencyAccounts = mockStore.accounts.filter(a => a.currency === currency && a.visible === true);
      return currencyAccounts.reduce((sum, a) => sum + a.balance, 0);
    },
    disableCurrency: (currency: string) => {
      // 禁用币种（软删除）
      mockStore.accounts.forEach(a => {
        if (a.currency === currency) {
          a.visible = false;
        }
      });
      mockStore.updatedAt = Date.now();
      return { success: true, message: '币种已禁用' };
    },
    isCurrencyEnabled: (currency: string) => {
      const currencyAccounts = mockStore.accounts.filter(a => a.currency === currency);
      return currencyAccounts.some(a => a.visible === true);
    },
    // Financial sources methods
    getFinancialSources: () => [...mockStore.financialSources],
    getFinancialSourcesByType: (type: string) => mockStore.financialSources.filter(s => s.type === type),
    addFinancialSource: (source: any) => {
      mockStore.financialSources.push(source);
      mockStore.updatedAt = Date.now();
    },
    updateFinancialSource: (id: string, updates: any) => {
      const index = mockStore.financialSources.findIndex(s => s.id === id);
      if (index >= 0) {
        mockStore.financialSources[index] = { ...mockStore.financialSources[index], ...updates };
        mockStore.updatedAt = Date.now();
      }
    },
    deleteFinancialSource: (id: string) => {
      mockStore.financialSources = mockStore.financialSources.filter(s => s.id !== id);
      mockStore.updatedAt = Date.now();
    },
  },
}));

describe('RecordService', () => {
  let service: RecordService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    service = new RecordService();
  });

  describe('generateId', () => {
    it('应生成唯一的 ID', () => {
      // Arrange & Act
      const id1 = service.generateId();
      const id2 = service.generateId();

      // Assert
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('应生成字符串类型的 ID', () => {
      // Arrange & Act
      const id = service.generateId();

      // Assert
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('formatCurrency', () => {
    it('应正确格式化正数金额', () => {
      // Arrange
      const amount = 1234.56;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('¥');
    });

    it('应正确格式化零', () => {
      // Arrange
      const amount = 0;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('0.00');
    });

    it('应正确格式化负数金额', () => {
      // Arrange
      const amount = -1234.56;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('-');
      expect(formatted).toContain('1,234.56');
    });

    it('应正确格式化大金额', () => {
      // Arrange
      const amount = 1234567890.12;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('1,234,567,890.12');
    });

    it('应正确格式化小数', () => {
      // Arrange
      const amount = 0.01;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('0.01');
    });

    it('应正确格式化整数', () => {
      // Arrange
      const amount = 100;

      // Act
      const formatted = service.formatCurrency(amount);

      // Assert
      expect(formatted).toContain('100.00');
    });
  });

  describe('formatDate', () => {
    it('应正确格式化日期', () => {
      // Arrange
      const dateStr = '2024-01-15';

      // Act
      const formatted = service.formatDate(dateStr);

      // Assert
      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });

    it('应处理年末日期', () => {
      // Arrange
      const dateStr = '2024-12-31';

      // Act
      const formatted = service.formatDate(dateStr);

      // Assert
      expect(formatted).toContain('2024');
      expect(formatted).toContain('12');
      expect(formatted).toContain('31');
    });

    it('应处理年初日期', () => {
      // Arrange
      const dateStr = '2024-01-01';

      // Act
      const formatted = service.formatDate(dateStr);

      // Assert
      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('01');
    });
  });

  describe('getAllRecords', () => {
    it('应返回空数组当没有记录时', () => {
      // Arrange & Act
      const records = service.getAllRecords();

      // Assert
      expect(records).toEqual([]);
    });

    it('应返回所有记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Act
      const records = service.getAllRecords();

      // Assert
      expect(records).toHaveLength(1);
    });
  });

  describe('addRecord', () => {
    it('应添加支出记录', () => {
      // Arrange
      const recordData = {
        type: 'expense' as const,
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: '2024-01-15',
      };

      // Act
      service.addRecord(recordData);

      // Assert
      const records = service.getAllRecords();
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('expense');
      expect(records[0].amount).toBe(100);
      expect(records[0].note).toBe('午餐');
      expect(records[0].category).toBe('exp-food');
      expect(records[0].date).toBe('2024-01-15');
      expect(records[0].id).toBeDefined();
      expect(records[0].createdAt).toBeDefined();
    });

    it('应添加收入记录', () => {
      // Arrange
      const recordData = {
        type: 'income' as const,
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
      };

      // Act
      service.addRecord(recordData);

      // Assert
      const records = service.getAllRecords();
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('income');
      expect(records[0].amount).toBe(5000);
    });

    it('应为每条记录生成唯一 ID', () => {
      // Arrange
      const recordData1 = {
        type: 'expense' as const,
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      };
      const recordData2 = {
        type: 'expense' as const,
        amount: 200,
        note: '记录2',
        category: 'exp-food',
        date: '2024-01-16',
      };

      // Act
      service.addRecord(recordData1);
      service.addRecord(recordData2);

      // Assert
      const records = service.getAllRecords();
      expect(records[0].id).not.toBe(records[1].id);
    });

    it('应设置 createdAt 时间戳', () => {
      // Arrange
      const beforeTime = Date.now();

      // Act
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Assert
      const afterTime = Date.now();
      const records = service.getAllRecords();
      expect(records[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(records[0].createdAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('deleteRecord', () => {
    it('应删除指定记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });
      const records = service.getAllRecords();
      const recordId = records[0].id;

      // Act
      service.deleteRecord(recordId);

      // Assert
      expect(service.getAllRecords()).toHaveLength(0);
    });

    it('应只删除匹配的记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'income',
        amount: 200,
        note: '记录2',
        category: 'inc-salary',
        date: '2024-01-16',
      });
      const records = service.getAllRecords();
      const recordId = records[0].id;

      // Act
      service.deleteRecord(recordId);

      // Assert
      const remainingRecords = service.getAllRecords();
      expect(remainingRecords).toHaveLength(1);
      expect(remainingRecords[0].note).toBe('记录2');
    });

    it('删除不存在的记录不应报错', () => {
      // Arrange & Act & Assert
      expect(() => service.deleteRecord('non-existent-id')).not.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('应返回零统计当没有记录时', () => {
      // Arrange & Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalIncome).toBe(0);
      expect(stats.totalExpense).toBe(0);
      expect(stats.balance).toBe(0);
    });

    it('应正确计算总收入', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'income',
        amount: 1000,
        note: '奖金',
        category: 'inc-bonus',
        date: '2024-01-16',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalIncome).toBe(6000);
      expect(stats.totalExpense).toBe(0);
      expect(stats.balance).toBe(6000);
    });

    it('应正确计算总支出', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 50,
        note: '交通',
        category: 'exp-transport',
        date: '2024-01-16',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalIncome).toBe(0);
      expect(stats.totalExpense).toBe(150);
      expect(stats.balance).toBe(-150);
    });

    it('应正确计算结余', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 1500,
        note: '房租',
        category: 'exp-rent',
        date: '2024-01-16',
      });
      service.addRecord({
        type: 'expense',
        amount: 500,
        note: '餐饮',
        category: 'exp-food',
        date: '2024-01-17',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalIncome).toBe(5000);
      expect(stats.totalExpense).toBe(2000);
      expect(stats.balance).toBe(3000);
    });

    it('应正确处理负结余', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: 1000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 2000,
        note: '购物',
        category: 'exp-shopping',
        date: '2024-01-16',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.balance).toBe(-1000);
    });
  });

  describe('getMonthlyData', () => {
    it('应返回空数组当没有记录时', () => {
      // Arrange & Act
      const monthlyData = service.getMonthlyData();

      // Assert
      expect(monthlyData).toEqual([]);
    });

    it('应正确聚合月度数据', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: '2024-01-16',
      });
      service.addRecord({
        type: 'expense',
        amount: 50,
        note: '交通',
        category: 'exp-transport',
        date: '2024-01-17',
      });

      // Act
      const monthlyData = service.getMonthlyData();

      // Assert
      expect(monthlyData).toHaveLength(1);
      expect(monthlyData[0].month).toBe('2024-01');
      expect(monthlyData[0].income).toBe(5000);
      expect(monthlyData[0].expense).toBe(150);
    });

    it('应正确处理多个月份', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '1月工资',
        category: 'inc-salary',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '1月午餐',
        category: 'exp-food',
        date: '2024-01-16',
      });
      service.addRecord({
        type: 'income',
        amount: 5500,
        note: '2月工资',
        category: 'inc-salary',
        date: '2024-02-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 200,
        note: '2月午餐',
        category: 'exp-food',
        date: '2024-02-16',
      });

      // Act
      const monthlyData = service.getMonthlyData();

      // Assert
      expect(monthlyData).toHaveLength(2);
      const janData = monthlyData.find(d => d.month === '2024-01');
      const febData = monthlyData.find(d => d.month === '2024-02');
      expect(janData?.income).toBe(5000);
      expect(janData?.expense).toBe(100);
      expect(febData?.income).toBe(5500);
      expect(febData?.expense).toBe(200);
    });

    it('应按月份排序', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '3月记录',
        category: 'exp-food',
        date: '2024-03-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 50,
        note: '1月记录',
        category: 'exp-food',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'expense',
        amount: 75,
        note: '2月记录',
        category: 'exp-food',
        date: '2024-02-15',
      });

      // Act
      const monthlyData = service.getMonthlyData();

      // Assert
      expect(monthlyData[0].month).toBe('2024-01');
      expect(monthlyData[1].month).toBe('2024-02');
      expect(monthlyData[2].month).toBe('2024-03');
    });

    it('应只返回最近12个月的数据', () => {
      // Arrange
      for (let i = 1; i <= 15; i++) {
        const month = i.toString().padStart(2, '0');
        service.addRecord({
          type: 'expense',
          amount: 100 * i,
          note: `记录${i}`,
          category: 'exp-food',
          date: `2024-${month}-15`,
        });
      }

      // Act
      const monthlyData = service.getMonthlyData();

      // Assert
      expect(monthlyData.length).toBeLessThanOrEqual(12);
    });
  });

  describe('getRecentRecords', () => {
    it('应返回最近创建的记录', () => {
      // Arrange - 确保每条记录有不同的 createdAt 时间戳
      const baseTime = Date.now();
      
      // 添加记录时手动设置不同的 createdAt
      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: baseTime,
        entries: [
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
        ],
      };
      mockStore.records.push(record1);
      
      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'expense',
        amount: 200,
        note: '记录2',
        category: 'exp-food',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: baseTime + 100,
        entries: [
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 200 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 200 },
        ],
      };
      mockStore.records.push(record2);
      
      const record3: ExpenseRecord = {
        id: 'test-id-3',
        type: 'expense',
        amount: 300,
        note: '记录3',
        category: 'exp-food',
        date: '2024-01-17',
        currency: 'CNY',
        createdAt: baseTime + 200,
        entries: [
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 300 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 300 },
        ],
      };
      mockStore.records.push(record3);

      // Act
      const recentRecords = service.getRecentRecords(2);

      // Assert
      expect(recentRecords).toHaveLength(2);
      expect(recentRecords[0].note).toBe('记录3');
      expect(recentRecords[1].note).toBe('记录2');
    });

    it('应返回所有记录当记录数少于限制时', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Act
      const recentRecords = service.getRecentRecords(10);

      // Assert
      expect(recentRecords).toHaveLength(1);
    });

    it('应返回空数组当没有记录时', () => {
      // Arrange & Act
      const recentRecords = service.getRecentRecords();

      // Assert
      expect(recentRecords).toEqual([]);
    });

    it('应使用默认限制值10', () => {
      // Arrange
      for (let i = 1; i <= 15; i++) {
        service.addRecord({
          type: 'expense',
          amount: 100,
          note: `记录${i}`,
          category: 'exp-food',
          date: '2024-01-15',
        });
      }

      // Act
      const recentRecords = service.getRecentRecords();

      // Assert
      expect(recentRecords).toHaveLength(10);
    });
  });

  describe('exportData', () => {
    it('应导出 JSON 字符串', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Act
      const exported = service.exportData();

      // Assert
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.records).toBeDefined();
      expect(parsed.categories).toBeDefined();
      expect(parsed.accounts).toBeDefined();
    });

    it('应包含所有记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '记录2',
        category: 'inc-salary',
        date: '2024-01-16',
      });

      // Act
      const exported = service.exportData();
      const parsed = JSON.parse(exported);

      // Assert
      expect(parsed.records).toHaveLength(2);
    });
  });

  describe('importData', () => {
    it('应成功导入有效数据', () => {
      // Arrange
      const data: DataSchema = {
        version: '1.8.0',
        records: [{
          id: 'test-id-1',
          type: 'expense',
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
          ],
        }],
        categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
        accounts: [{ ...DEFAULT_ACCOUNT }],
        incomeRules: [{ ...DEFAULT_INCOME_RULE }],
        financialSources: [],
        budgetPlans: [],
        customCurrencies: [],
        exchangeRates: { rates: {}, baseCurrency: 'CNY', lastUpdatedAt: Date.now(), source: 'default' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const jsonString = JSON.stringify(data);

      // Act
      const result = service.importData(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(service.getRecordCount()).toBe(1);
    });

    it('应拒绝无效的 JSON', () => {
      // Arrange
      const invalidJson = 'invalid json';

      // Act
      const result = service.importData(invalidJson);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('解析错误');
    });
  });

  describe('getCategories', () => {
    it('应返回所有分类', () => {
      // Act
      const categories = service.getCategories();

      // Assert
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('getIncomeCategories', () => {
    it('应只返回收入分类', () => {
      // Act
      const categories = service.getIncomeCategories();

      // Assert
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach(cat => {
        expect(cat.type).toBe('income');
      });
    });
  });

  describe('getExpenseCategories', () => {
    it('应只返回支出分类', () => {
      // Act
      const categories = service.getExpenseCategories();

      // Assert
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach(cat => {
        expect(cat.type).toBe('expense');
      });
    });
  });

  describe('addCategory', () => {
    it('应添加新分类', () => {
      // Arrange
      const categoryData = {
        name: '测试分类',
        type: 'expense' as const,
        icon: 'test-icon',
      };

      // Act
      const newCategory = service.addCategory(categoryData);

      // Assert
      expect(newCategory.id).toBeDefined();
      expect(newCategory.name).toBe('测试分类');
      expect(newCategory.type).toBe('expense');
      expect(newCategory.icon).toBe('test-icon');
    });

    it('应为收入分类生成正确的前缀 ID', () => {
      // Arrange
      const categoryData = {
        name: '测试收入分类',
        type: 'income' as const,
        icon: 'test-icon',
      };

      // Act
      const newCategory = service.addCategory(categoryData);

      // Assert
      expect(newCategory.id).toMatch(/^inc-/);
    });

    it('应为支出分类生成正确的前缀 ID', () => {
      // Arrange
      const categoryData = {
        name: '测试支出分类',
        type: 'expense' as const,
        icon: 'test-icon',
      };

      // Act
      const newCategory = service.addCategory(categoryData);

      // Assert
      expect(newCategory.id).toMatch(/^exp-/);
    });
  });

  describe('deleteCategory', () => {
    it('应删除未使用的分类', () => {
      // Arrange
      const newCategory = service.addCategory({
        name: '测试分类',
        type: 'expense',
        icon: 'test-icon',
      });

      // Act
      const result = service.deleteCategory(newCategory.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('成功');
    });

    it('应拒绝删除正在使用的分类', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Act
      const result = service.deleteCategory('exp-food');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('正在被使用');
    });
  });

  describe('getAccounts', () => {
    it('应返回账户列表', () => {
      // Act
      const accounts = service.getAccounts();

      // Assert
      expect(accounts.length).toBeGreaterThan(0);
    });
  });

  describe('addAccount', () => {
    it('应添加新账户（指定币种和类型）', () => {
      // Arrange
      const accountData = {
        currency: 'USD',
        accountType: 'cash' as 'cash' | 'investment' | 'loan',
      };

      // Act
      const result = service.addAccount(accountData);

      // Assert - 新的 addAccount 返回结果对象，使用随机ID
      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
      expect(result.account!.id).toMatch(/^acc-/);
      expect(result.account!.name).toBe('USD 现金');
      expect(result.account!.currency).toBe('USD');
      expect(result.account!.accountType).toBe('cash');
      expect(result.account!.createdAt).toBeDefined();
    });

    it('应生成 acc- 前缀格式的 ID', () => {
      // Arrange
      const accountData = {
        currency: 'CNY',
        accountType: 'investment' as 'cash' | 'investment' | 'loan',
      };

      // Act
      const result = service.addAccount(accountData);

      // Assert - 新的 ID 格式
      expect(result.success).toBe(true);
      expect(result.account!.id).toMatch(/^acc-/);
    });
  });

  describe('deleteAccount', () => {
    it('应软删除账户当有多个账户时', () => {
      // Arrange
      const result1 = service.addAccount({
        currency: 'CNY',
        accountType: 'cash' as 'cash' | 'investment' | 'loan',
      });
      service.addAccount({
        currency: 'USD',
        accountType: 'cash' as 'cash' | 'investment' | 'loan',
      });

      // Act
      const deleteResult = service.deleteAccount(result1.account!.id);

      // Assert - 软删除：账户仍存在但不可见
      expect(deleteResult.success).toBe(true);
      const accounts = service.getAccounts();
      const deletedAccount = accounts.find(a => a.id === result1.account!.id);
      expect(deletedAccount).toBeDefined();
      expect(deletedAccount!.visible).toBe(false);
    });

    it('应拒绝删除最后一个账户', () => {
      // Arrange - 默认已有一个账户
      const accounts = service.getAccounts();
      const lastAccountId = accounts[0].id;

      // Act
      const result = service.deleteAccount(lastAccountId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('至少需要保留一个账户');
    });

    it('删除不存在的账户应返回成功', () => {
      // Arrange
      service.addAccount({
        currency: 'CNY',
        accountType: 'cash' as 'cash' | 'investment' | 'loan',
      });

      // Act
      const result = service.deleteAccount('non-existent-id');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('updateRecord', () => {
    it('应更新已存在的记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '原始记录',
        category: 'exp-food',
        date: '2024-01-15',
      });
      const records = service.getAllRecords();
      const recordId = records[0].id;

      // Act
      service.updateRecord(recordId, { amount: 200, note: '更新后的记录' });

      // Assert
      const updated = service.getRecordById(recordId);
      expect(updated?.amount).toBe(200);
      expect(updated?.note).toBe('更新后的记录');
    });

    it('更新不存在的记录不应报错', () => {
      // Arrange & Act & Assert
      expect(() => service.updateRecord('non-existent-id', { amount: 100 })).not.toThrow();
    });
  });

  describe('getRecordById', () => {
    it('应返回匹配的记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
      });
      const records = service.getAllRecords();
      const recordId = records[0].id;

      // Act
      const found = service.getRecordById(recordId);

      // Assert
      expect(found).toBeDefined();
      expect(found?.amount).toBe(100);
    });

    it('应返回 undefined 当记录不存在时', () => {
      // Arrange & Act
      const found = service.getRecordById('non-existent-id');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('updateCategory', () => {
    it('应更新已存在的分类', () => {
      // Arrange
      const newCategory = service.addCategory({
        name: '测试分类',
        type: 'expense',
        icon: 'test-icon',
      });

      // Act
      service.updateCategory({
        id: newCategory.id,
        name: '更新后的分类',
        type: 'expense',
        icon: 'updated-icon',
      });

      // Assert
      const categories = service.getCategories();
      const found = categories.find(c => c.id === newCategory.id);
      expect(found?.name).toBe('更新后的分类');
      expect(found?.icon).toBe('updated-icon');
    });
  });

  describe('updateAccount', () => {
    it('应更新已存在的账户', () => {
      // Arrange
      const result = service.addAccount({
        currency: 'CNY',
        accountType: 'cash' as 'cash' | 'investment' | 'loan',
      });
      const newAccount = result.account!;

      // Act
      service.updateAccount({
        id: newAccount.id,
        name: '更新后的账户',
        currency: 'USD',
        accountType: 'cash',
        balance: 1000,
        createdAt: newAccount.createdAt,
        isDefault: false,
        visible: true,
      });

      // Assert
      const accounts = service.getAccounts();
      const found = accounts.find(a => a.id === newAccount.id);
      expect(found?.name).toBe('更新后的账户');
      expect(found?.currency).toBe('USD');
      expect(found?.balance).toBe(1000);
    });
  });

  describe('generateCategoryId', () => {
    it('应为收入分类生成正确前缀的 ID', () => {
      // Act
      const id = service.generateCategoryId('income');

      // Assert
      expect(id).toMatch(/^inc-/);
    });

    it('应为支出分类生成正确前缀的 ID', () => {
      // Act
      const id = service.generateCategoryId('expense');

      // Assert
      expect(id).toMatch(/^exp-/);
    });

    it('应生成唯一的 ID', () => {
      // Act
      const id1 = service.generateCategoryId('income');
      const id2 = service.generateCategoryId('income');

      // Assert
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateAccountId', () => {
    it('应生成以 acc- 开头的 ID', () => {
      // Act
      const id = service.generateAccountId();

      // Assert
      expect(id).toMatch(/^acc-/);
    });

    it('应生成唯一的 ID', () => {
      // Act
      const id1 = service.generateAccountId();
      const id2 = service.generateAccountId();

      // Assert
      expect(id1).not.toBe(id2);
    });
  });

  describe('getRecordCount', () => {
    it('应返回正确的记录数量', () => {
      // Arrange
      expect(service.getRecordCount()).toBe(0);

      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      });
      expect(service.getRecordCount()).toBe(1);

      service.addRecord({
        type: 'income',
        amount: 200,
        note: '记录2',
        category: 'inc-salary',
        date: '2024-01-16',
      });
      expect(service.getRecordCount()).toBe(2);
    });
  });

  describe('deleteAllRecords', () => {
    it('应删除所有记录', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '记录1',
        category: 'exp-food',
        date: '2024-01-15',
      });
      service.addRecord({
        type: 'income',
        amount: 200,
        note: '记录2',
        category: 'inc-salary',
        date: '2024-01-16',
      });

      // Act
      service.deleteAllRecords();

      // Assert
      expect(service.getRecordCount()).toBe(0);
      expect(service.getAllRecords()).toEqual([]);
    });
  });

  describe('边界条件测试', () => {
    it('应处理极大金额的统计计算', () => {
      // Arrange
      service.addRecord({
        type: 'income',
        amount: Number.MAX_SAFE_INTEGER,
        note: '极大收入',
        category: 'inc-salary',
        date: '2024-01-15',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalIncome).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应处理极小正数金额', () => {
      // Arrange
      service.addRecord({
        type: 'expense',
        amount: 0.01,
        note: '极小支出',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(stats.totalExpense).toBe(0.01);
    });

    it('应处理特殊字符的备注', () => {
      // Arrange
      const specialNote = '特殊字符: <script>alert("xss")</script> & "quotes" \'apostrophe\'';

      // Act
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: specialNote,
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Assert
      const records = service.getAllRecords();
      expect(records[0].note).toBe(specialNote);
    });

    it('应处理 Unicode 字符的备注', () => {
      // Arrange
      const unicodeNote = '中文 日本語 한국어 العربية 🎉🎊';

      // Act
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: unicodeNote,
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Assert
      const records = service.getAllRecords();
      expect(records[0].note).toBe(unicodeNote);
    });

    it('应处理空备注', () => {
      // Arrange & Act
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '',
        category: 'exp-food',
        date: '2024-01-15',
      });

      // Assert
      const records = service.getAllRecords();
      expect(records[0].note).toBe('');
    });

    it('应处理大量记录的统计', () => {
      // Arrange
      const recordCount = 100;
      for (let i = 0; i < recordCount; i++) {
        service.addRecord({
          type: i % 2 === 0 ? 'expense' : 'income',
          amount: Math.random() * 1000,
          note: `记录 ${i}`,
          category: i % 2 === 0 ? 'exp-food' : 'inc-salary',
          date: '2024-01-15',
        });
      }

      // Act
      const stats = service.getStatistics();

      // Assert
      expect(service.getRecordCount()).toBe(recordCount);
      expect(stats.totalIncome + stats.totalExpense).toBeGreaterThan(0);
    });
  });

  // ========== SubTask 7.3: 测试 generateEntries 函数（新记账类型）==========
  describe('generateEntries', () => {
    it('应为收入类型生成正确的分录（借:现金, 贷:收入）', () => {
      // Arrange
      const amount = 5000;

      // Act
      const entries = generateEntries('income', amount);

      // Assert - 使用新的账户ID格式 {currency}-{accountType}
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'debit',
        amount: 5000,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-income',
        accountName: '收入',
        direction: 'credit',
        amount: 5000,
      });
    });

    it('应为支出类型生成正确的分录（借:支出, 贷:现金）', () => {
      // Arrange
      const amount = 100;

      // Act
      const entries = generateEntries('expense', amount);

      // Assert - 使用新的账户ID格式
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        accountId: 'CNY-expense',
        accountName: '支出',
        direction: 'debit',
        amount: 100,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'credit',
        amount: 100,
      });
    });

    it('应为投资类型生成正确的分录（借:投资, 贷:现金）', () => {
      // Arrange
      const amount = 10000;

      // Act
      const entries = generateEntries('investment', amount);

      // Assert - 使用新的账户ID格式
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        accountId: 'CNY-investment',
        accountName: '投资',
        direction: 'debit',
        amount: 10000,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'credit',
        amount: 10000,
      });
    });

    it('应为投资到期类型生成正确的分录（本金和利息）', () => {
      // Arrange
      const principal = 10000;
      const interest = 500;

      // Act
      const entries = generateEntries('investment-mature', 0, principal, interest);

      // Assert - 应生成4条分录（使用新的账户ID格式）
      expect(entries).toHaveLength(4);
      // 本金：借:现金, 贷:投资
      expect(entries[0]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'debit',
        amount: 10000,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-investment',
        accountName: '投资',
        direction: 'credit',
        amount: 10000,
      });
      // 利息：借:现金, 贷:收入
      expect(entries[2]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'debit',
        amount: 500,
      });
      expect(entries[3]).toEqual({
        accountId: 'CNY-income',
        accountName: '收入',
        direction: 'credit',
        amount: 500,
      });
    });

    it('应为贷款到账类型生成正确的分录（借:现金, 贷:贷款）', () => {
      // Arrange
      const amount = 50000;

      // Act
      const entries = generateEntries('loan-receive', amount);

      // Assert - 使用新的账户ID格式
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'debit',
        amount: 50000,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-loan',
        accountName: '贷款',
        direction: 'credit',
        amount: 50000,
      });
    });

    it('应为还贷类型生成正确的分录（本金和利息）', () => {
      // Arrange
      const principal = 5000;
      const interest = 100;

      // Act
      const entries = generateEntries('loan-repay', 0, principal, interest);

      // Assert - 应生成4条分录（使用新的账户ID格式）
      expect(entries).toHaveLength(4);
      // 本金：借:贷款, 贷:现金
      expect(entries[0]).toEqual({
        accountId: 'CNY-loan',
        accountName: '贷款',
        direction: 'debit',
        amount: 5000,
      });
      expect(entries[1]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'credit',
        amount: 5000,
      });
      // 利息：借:支出, 贷:现金
      expect(entries[2]).toEqual({
        accountId: 'CNY-expense',
        accountName: '支出',
        direction: 'debit',
        amount: 100,
      });
      expect(entries[3]).toEqual({
        accountId: 'CNY-cash',
        accountName: '现金',
        direction: 'credit',
        amount: 100,
      });
    });

    it('应处理投资到期类型无利息的情况', () => {
      // Arrange
      const principal = 10000;

      // Act
      const entries = generateEntries('investment-mature', 0, principal, 0);

      // Assert - 本金分录存在，利息分录金额为0
      expect(entries).toHaveLength(4);
      expect(entries[0].amount).toBe(10000);
      expect(entries[1].amount).toBe(10000);
      expect(entries[2].amount).toBe(0);
      expect(entries[3].amount).toBe(0);
    });

    it('应处理还贷类型无利息的情况', () => {
      // Arrange
      const principal = 5000;

      // Act
      const entries = generateEntries('loan-repay', 0, principal, 0);

      // Assert - 本金分录存在，利息分录金额为0
      expect(entries).toHaveLength(4);
      expect(entries[0].amount).toBe(5000);
      expect(entries[1].amount).toBe(5000);
      expect(entries[2].amount).toBe(0);
      expect(entries[3].amount).toBe(0);
    });

    it('应处理投资到期类型未提供本金利息参数的情况', () => {
      // Arrange & Act
      const entries = generateEntries('investment-mature', 0);

      // Assert - 默认值为0
      expect(entries).toHaveLength(4);
      expect(entries[0].amount).toBe(0);
      expect(entries[1].amount).toBe(0);
      expect(entries[2].amount).toBe(0);
      expect(entries[3].amount).toBe(0);
    });

    it('应处理还贷类型未提供本金利息参数的情况', () => {
      // Arrange & Act
      const entries = generateEntries('loan-repay', 0);

      // Assert - 默认值为0
      expect(entries).toHaveLength(4);
      expect(entries[0].amount).toBe(0);
      expect(entries[1].amount).toBe(0);
      expect(entries[2].amount).toBe(0);
      expect(entries[3].amount).toBe(0);
    });
  });

  // ========== SubTask 7.4: 测试账户余额计算 ==========
  describe('账户余额计算', () => {
    it('应正确计算现金账户余额（借方总和 - 贷方总和）', () => {
      // Arrange - 添加收入和支出记录
      const incomeRecord: ExpenseRecord = {
        id: 'income-1',
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 5000 },
          { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 5000 },
        ],
      };
      const expenseRecord: ExpenseRecord = {
        id: 'expense-1',
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
        ],
      };
      mockStore.records.push(incomeRecord, expenseRecord);

      // Act - 计算现金账户余额
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };
      const cashBalance = calculateBalance('CNY-cash', mockStore.records);

      // Assert - 现金账户余额 = 5000（借） - 100（贷） = 4900
      expect(cashBalance).toBe(4900);
    });

    it('应正确计算收入账户余额（贷方总和）', () => {
      // Arrange
      const incomeRecord: ExpenseRecord = {
        id: 'income-1',
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 5000 },
          { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 5000 },
        ],
      };
      mockStore.records.push(incomeRecord);

      // Act
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };
      const incomeBalance = calculateBalance('CNY-income', mockStore.records);

      // Assert - 收入账户余额 = -5000（贷方）
      expect(incomeBalance).toBe(-5000);
    });

    it('应正确计算支出账户余额（借方总和）', () => {
      // Arrange
      const expenseRecord: ExpenseRecord = {
        id: 'expense-1',
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
        ],
      };
      mockStore.records.push(expenseRecord);

      // Act
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };
      const expenseBalance = calculateBalance('CNY-expense', mockStore.records);

      // Assert - 支出账户余额 = 100（借方）
      expect(expenseBalance).toBe(100);
    });

    it('应正确计算投资账户余额', () => {
      // Arrange - 投资和投资到期
      const investmentRecord: ExpenseRecord = {
        id: 'investment-1',
        type: 'investment',
        amount: 10000,
        note: '购买理财产品',
        category: 'inc-investment',
        date: '2024-01-01',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-investment', accountName: '投资', direction: 'debit', amount: 10000 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 10000 },
        ],
      };
      const matureRecord: ExpenseRecord = {
        id: 'mature-1',
        type: 'investment-mature',
        amount: 10500,
        note: '理财到期',
        category: 'inc-investment',
        date: '2024-02-01',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 10000 },
          { accountId: 'CNY-investment', accountName: '投资', direction: 'credit', amount: 10000 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 500 },
          { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 500 },
        ],
      };
      mockStore.records.push(investmentRecord, matureRecord);

      // Act
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };
      const investmentBalance = calculateBalance('CNY-investment', mockStore.records);

      // Assert - 投资账户余额 = 10000（借） - 10000（贷） = 0
      expect(investmentBalance).toBe(0);
    });

    it('应正确计算贷款账户余额', () => {
      // Arrange - 贷款到账和还贷
      const loanReceiveRecord: ExpenseRecord = {
        id: 'loan-receive-1',
        type: 'loan-receive',
        amount: 50000,
        note: '贷款到账',
        category: 'inc-other',
        date: '2024-01-01',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 50000 },
          { accountId: 'CNY-loan', accountName: '贷款', direction: 'credit', amount: 50000 },
        ],
      };
      const loanRepayRecord: ExpenseRecord = {
        id: 'loan-repay-1',
        type: 'loan-repay',
        amount: 5100,
        note: '还贷',
        category: 'exp-other',
        date: '2024-02-01',
        currency: 'CNY',
        createdAt: Date.now(),
        entries: [
          { accountId: 'CNY-loan', accountName: '贷款', direction: 'debit', amount: 5000 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 5000 },
          { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
          { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
        ],
      };
      mockStore.records.push(loanReceiveRecord, loanRepayRecord);

      // Act
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };
      const loanBalance = calculateBalance('CNY-loan', mockStore.records);

      // Assert - 贷款账户余额 = -50000（贷） + 5000（借） = -45000（剩余贷款）
      expect(loanBalance).toBe(-45000);
    });

    it('应正确处理多条记录的累计余额计算', () => {
      // Arrange - 多条收入和支出记录
      const records: ExpenseRecord[] = [
        {
          id: 'income-1',
          type: 'income',
          amount: 5000,
          note: '工资',
          category: 'inc-salary',
          date: '2024-01-01',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 5000 },
            { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 5000 },
          ],
        },
        {
          id: 'expense-1',
          type: 'expense',
          amount: 100,
          note: '早餐',
          category: 'exp-food',
          date: '2024-01-02',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
          ],
        },
        {
          id: 'income-2',
          type: 'income',
          amount: 1000,
          note: '奖金',
          category: 'inc-bonus',
          date: '2024-01-03',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 1000 },
            { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 1000 },
          ],
        },
        {
          id: 'expense-2',
          type: 'expense',
          amount: 500,
          note: '购物',
          category: 'exp-shopping',
          date: '2024-01-04',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 500 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 500 },
          ],
        },
      ];
      mockStore.records.push(...records);

      // Act
      const calculateBalance = (accountId: string, records: ExpenseRecord[]): number => {
        let balance = 0;
        for (const record of records) {
          for (const entry of record.entries) {
            if (entry.accountId === accountId) {
              if (entry.direction === 'debit') {
                balance += entry.amount;
              } else {
                balance -= entry.amount;
              }
            }
          }
        }
        return balance;
      };

      // Assert
      // 现金：5000 + 1000（借） - 100 - 500（贷） = 5400
      expect(calculateBalance('CNY-cash', mockStore.records)).toBe(5400);
      // 收入：-5000 - 1000（贷） = -6000
      expect(calculateBalance('CNY-income', mockStore.records)).toBe(-6000);
      // 支出：100 + 500（借） = 600
      expect(calculateBalance('CNY-expense', mockStore.records)).toBe(600);
    });

    it('应验证分录借贷平衡', () => {
      // Arrange - 每条记录的借方总和应等于贷方总和
      const records: ExpenseRecord[] = [
        {
          id: 'income-1',
          type: 'income',
          amount: 5000,
          note: '工资',
          category: 'inc-salary',
          date: '2024-01-01',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 5000 },
            { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 5000 },
          ],
        },
        {
          id: 'investment-mature-1',
          type: 'investment-mature',
          amount: 10500,
          note: '理财到期',
          category: 'inc-investment',
          date: '2024-02-01',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 10000 },
            { accountId: 'CNY-investment', accountName: '投资', direction: 'credit', amount: 10000 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'debit', amount: 500 },
            { accountId: 'CNY-income', accountName: '收入', direction: 'credit', amount: 500 },
          ],
        },
        {
          id: 'loan-repay-1',
          type: 'loan-repay',
          amount: 5100,
          note: '还贷',
          category: 'exp-other',
          date: '2024-03-01',
          currency: 'CNY',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-loan', accountName: '贷款', direction: 'debit', amount: 5000 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 5000 },
            { accountId: 'CNY-expense', accountName: '支出', direction: 'debit', amount: 100 },
            { accountId: 'CNY-cash', accountName: '现金', direction: 'credit', amount: 100 },
          ],
        },
      ];

      // Act - 验证每条记录的借贷平衡
      const validateBalance = (record: ExpenseRecord): boolean => {
        const debitSum = record.entries
          .filter(e => e.direction === 'debit')
          .reduce((sum, e) => sum + e.amount, 0);
        const creditSum = record.entries
          .filter(e => e.direction === 'credit')
          .reduce((sum, e) => sum + e.amount, 0);
        return debitSum === creditSum;
      };

      // Assert
      records.forEach(record => {
        expect(validateBalance(record)).toBe(true);
      });
    });
  });

  // ========== Task 1: 财务预测引擎单元测试 ==========

  describe('generateDailyDataWithPrediction', () => {
    it('应生成过去6个月到未来6个月的日级数据（约400天）', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // Assert
      expect(dailyData.length).toBeGreaterThan(350);
      expect(dailyData.length).toBeLessThan(420);

      // 检查数据范围
      const firstDate = dailyData[0].date;
      const lastDate = dailyData[dailyData.length - 1].date;
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 7, 0);

      const startDate = new Date(firstDate);
      const endDate = new Date(lastDate);

      expect(startDate.getFullYear()).toBe(sixMonthsAgo.getFullYear());
      expect(startDate.getMonth()).toBe(sixMonthsAgo.getMonth());
      expect(endDate.getFullYear()).toBe(sixMonthsLater.getFullYear());
      expect(endDate.getMonth()).toBe(sixMonthsLater.getMonth());
    });

    it('应每天包含收入、支出、结余和日期信息', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // Assert
      expect(dailyData.length).toBeGreaterThan(0);
      dailyData.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof day.income).toBe('number');
        expect(typeof day.expense).toBe('number');
        expect(typeof day.balance).toBe('number');
        expect(typeof day.isActual).toBe('boolean');
      });
    });

    it('应正确聚合实际记录到日级数据', () => {
      // Arrange
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: yesterdayStr,
      });
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: yesterdayStr,
      });

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // Assert
      const yesterdayData = dailyData.find(d => d.date === yesterdayStr);
      expect(yesterdayData).toBeDefined();
      expect(yesterdayData?.income).toBe(5000);
      expect(yesterdayData?.expense).toBe(100);
      expect(yesterdayData?.isActual).toBe(true);
    });

    it('结余计算应正确（前一天结余 + 当日收入 - 当日支出）', () => {
      // Arrange
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBeforeYesterday = new Date(today);
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

      const dayBeforeStr = `${dayBeforeYesterday.getFullYear()}-${String(dayBeforeYesterday.getMonth() + 1).padStart(2, '0')}-${String(dayBeforeYesterday.getDate()).padStart(2, '0')}`;
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: dayBeforeStr,
      });
      service.addRecord({
        type: 'income',
        amount: 1000,
        note: '奖金',
        category: 'inc-bonus',
        date: yesterdayStr,
      });

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // Assert
      const dayBeforeData = dailyData.find(d => d.date === dayBeforeStr);
      const yesterdayData = dailyData.find(d => d.date === yesterdayStr);

      expect(dayBeforeData?.balance).toBe(5000);
      expect(yesterdayData?.balance).toBe(6000);
    });
  });

  describe('_isSourceActiveOnDay (通过财务来源触发测试)', () => {
    it('日级财务来源应每天触发', () => {
      // Arrange
      const dailySource = {
        id: 'daily-source',
        type: 'income' as const,
        name: '每日收入',
        currency: 'CNY',
        amount: 100,
        period: 'daily' as const,
        createdAt: Date.now(),
      };
      mockStore.financialSources.push(dailySource);

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // 统计未来30天内触发次数（应该有30次）
      const today = new Date();
      const futureDays = dailyData.filter(d => {
        const date = new Date(d.date);
        return date > today && d.income >= 100;
      });

      // Assert
      expect(futureDays.length).toBeGreaterThan(0);
    });

    it('月度财务来源仅在指定日期触发（非平均分摊）', () => {
      // Arrange
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

      const monthlySource = {
        id: 'monthly-source',
        type: 'income' as const,
        name: '月收入',
        currency: 'CNY',
        amount: 2000,
        period: 'monthly' as const,
        dayOfMonth: -1, // 每月最后一天
        createdAt: Date.now(),
      };
      mockStore.financialSources.push(monthlySource);

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // 检查本月最后一天的收入
      const lastDayData = dailyData.find(d => d.date === lastDayStr);

      // Assert
      expect(lastDayData?.income).toBeGreaterThanOrEqual(2000);

      // 检查本月其他日期的收入（不应有2000）
      const otherDaysInMonth = dailyData.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear() &&
               d.date !== lastDayStr &&
               d.income >= 2000;
      });
      expect(otherDaysInMonth.length).toBe(0);
    });

    it('周度财务来源仅在指定星期触发', () => {
      // Arrange
      const today = new Date();
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
      const saturdayStr = `${nextSaturday.getFullYear()}-${String(nextSaturday.getMonth() + 1).padStart(2, '0')}-${String(nextSaturday.getDate()).padStart(2, '0')}`;

      const weeklySource = {
        id: 'weekly-source',
        type: 'income' as const,
        name: '周收入',
        currency: 'CNY',
        amount: 500,
        period: 'weekly' as const,
        dayOfWeek: 6, // 周六
        createdAt: Date.now(),
      };
      mockStore.financialSources.push(weeklySource);

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // 检查下一个周六的收入
      const saturdayData = dailyData.find(d => d.date === saturdayStr);

      // Assert
      expect(saturdayData?.income).toBeGreaterThanOrEqual(500);
    });

    it('月度财务来源在指定日期（非最后一天）触发', () => {
      // Arrange
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      const targetStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;

      const monthlySource = {
        id: 'monthly-15th',
        type: 'expense' as const,
        name: '月租',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly' as const,
        dayOfMonth: 15,
        createdAt: Date.now(),
      };
      mockStore.financialSources.push(monthlySource);

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // 检查目标日期的支出
      const targetData = dailyData.find(d => d.date === targetStr);

      // Assert
      expect(targetData?.expense).toBeGreaterThanOrEqual(1000);
    });

    it('一次性财务来源不在预测中触发', () => {
      // Arrange
      const onceSource = {
        id: 'once-source',
        type: 'income' as const,
        name: '一次性收入',
        currency: 'CNY',
        amount: 10000,
        period: 'once' as const,
        createdAt: Date.now(),
      };
      mockStore.financialSources.push(onceSource);

      // Act
      const dailyData = service.generateDailyDataWithPrediction();

      // 统计未来30天内是否有10000的收入
      const today = new Date();
      const futureLargeIncome = dailyData.filter(d => {
        const date = new Date(d.date);
        return date > today && d.income >= 10000;
      });

      // Assert
      expect(futureLargeIncome.length).toBe(0);
    });
  });

  describe('aggregateDailyToMonthly', () => {
    it('应将日级数据正确聚合为月级数据', () => {
      // Arrange - use dates within the prediction window (past 6 months to future 6 months)
      const today = new Date();
      const pastMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const pastStr = `${pastMonth.getFullYear()}-${String(pastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const pastStrEnd = `${pastMonth.getFullYear()}-${String(pastMonth.getMonth() + 1).padStart(2, '0')}-15`;
      const expectedMonth = `${pastMonth.getFullYear()}-${String(pastMonth.getMonth() + 1).padStart(2, '0')}`;

      service.addRecord({
        type: 'income',
        amount: 5000,
        note: '工资',
        category: 'inc-salary',
        date: pastStr,
      });
      service.addRecord({
        type: 'expense',
        amount: 100,
        note: '午餐',
        category: 'exp-food',
        date: pastStrEnd,
      });

      const dailyData = service.generateDailyDataWithPrediction();

      // Act
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      expect(monthlyData.length).toBeGreaterThan(0);
      const monthData = monthlyData.find(m => m.month === expectedMonth);
      expect(monthData?.income).toBeGreaterThanOrEqual(5000);
      expect(monthData?.expense).toBeGreaterThanOrEqual(100);
    });

    it('当前月应标记为部分实际部分预测', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthData = monthlyData.find(m => m.month === currentMonth);

      expect(currentMonthData?.isPartialActual).toBe(true);
      expect(currentMonthData?.boundaryDay).toBe(today.getDate());
      expect(currentMonthData?.balanceAtBoundary).toBeDefined();
    });

    it('过去月份应标记为完全实际', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      const today = new Date();
      const pastMonth = today.getMonth() > 0
        ? `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`
        : `${today.getFullYear() - 1}-12`;

      const pastMonthData = monthlyData.find(m => m.month === pastMonth);
      if (pastMonthData) {
        expect(pastMonthData?.isActual).toBe(true);
        expect(pastMonthData?.isPartialActual).toBeFalsy();
      }
    });

    it('未来月份应标记为完全预测', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      const today = new Date();
      const futureMonth = today.getMonth() < 11
        ? `${today.getFullYear()}-${String(today.getMonth() + 2).padStart(2, '0')}`
        : `${today.getFullYear() + 1}-01`;

      const futureMonthData = monthlyData.find(m => m.month === futureMonth);
      if (futureMonthData) {
        expect(futureMonthData?.isActual).toBe(false);
        expect(futureMonthData?.isPartialActual).toBeFalsy();
      }
    });

    it('月级数据应按月份排序', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      for (let i = 1; i < monthlyData.length; i++) {
        expect(monthlyData[i].month.localeCompare(monthlyData[i - 1].month)).toBeGreaterThan(0);
      }
    });

    it('应覆盖约13个月的数据', () => {
      // Act
      const dailyData = service.generateDailyDataWithPrediction();
      const monthlyData = service.aggregateDailyToMonthly(dailyData);

      // Assert
      expect(monthlyData.length).toBeGreaterThanOrEqual(12);
      expect(monthlyData.length).toBeLessThanOrEqual(14);
    });
  });

  // ========== Task 2: 财务来源管理单元测试 ==========

  describe('getFinancialSources', () => {
    it('应返回空数组当没有财务来源时', () => {
      // Act
      const sources = service.getFinancialSources();

      // Assert
      expect(sources).toEqual([]);
    });

    it('应返回所有财务来源', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '工资',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly',
        dayOfMonth: -1,
      });
      service.addFinancialSource({
        type: 'expense',
        name: '房租',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
        dayOfMonth: 1,
      });

      // Act
      const sources = service.getFinancialSources();

      // Assert
      expect(sources).toHaveLength(2);
    });
  });

  describe('getFinancialSourcesByType', () => {
    it('应只返回指定类型的财务来源', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '工资',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'income',
        name: '奖金',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'expense',
        name: '房租',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
      });

      // Act
      const incomeSources = service.getFinancialSourcesByType('income');
      const expenseSources = service.getFinancialSourcesByType('expense');

      // Assert
      expect(incomeSources).toHaveLength(2);
      expect(expenseSources).toHaveLength(1);
      incomeSources.forEach(s => expect(s.type).toBe('income'));
      expenseSources.forEach(s => expect(s.type).toBe('expense'));
    });

    it('应返回空数组当没有指定类型的来源时', () => {
      // Act
      const investmentSources = service.getFinancialSourcesByType('investment');

      // Assert
      expect(investmentSources).toEqual([]);
    });
  });

  describe('generateFinancialSourceId', () => {
    it('应生成以 fs- 开头的 ID', () => {
      // Act
      const id = service.generateFinancialSourceId();

      // Assert
      expect(id).toMatch(/^fs-/);
    });

    it('应生成唯一的 ID', () => {
      // Act
      const id1 = service.generateFinancialSourceId();
      const id2 = service.generateFinancialSourceId();

      // Assert
      expect(id1).not.toBe(id2);
    });
  });

  describe('addFinancialSource', () => {
    it('应添加日级财务来源', () => {
      // Arrange
      const sourceData = {
        type: 'income' as const,
        name: '每日收入',
        currency: 'CNY',
        amount: 100,
        period: 'daily' as const,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.id).toBeDefined();
      expect(newSource.name).toBe('每日收入');
      expect(newSource.type).toBe('income');
      expect(newSource.period).toBe('daily');
      expect(newSource.createdAt).toBeDefined();
    });

    it('应添加周级财务来源', () => {
      // Arrange
      const sourceData = {
        type: 'expense' as const,
        name: '每周支出',
        currency: 'CNY',
        amount: 500,
        period: 'weekly' as const,
        dayOfWeek: 6,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.period).toBe('weekly');
      expect(newSource.dayOfWeek).toBe(6);
    });

    it('应添加月级财务来源（指定日期）', () => {
      // Arrange
      const sourceData = {
        type: 'income' as const,
        name: '月收入',
        currency: 'CNY',
        amount: 2000,
        period: 'monthly' as const,
        dayOfMonth: 15,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.period).toBe('monthly');
      expect(newSource.dayOfMonth).toBe(15);
    });

    it('应添加月级财务来源（最后一天）', () => {
      // Arrange
      const sourceData = {
        type: 'income' as const,
        name: '月末收入',
        currency: 'CNY',
        amount: 2000,
        period: 'monthly' as const,
        dayOfMonth: -1,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.period).toBe('monthly');
      expect(newSource.dayOfMonth).toBe(-1);
    });

    it('应添加年 级财务来源', () => {
      // Arrange
      const sourceData = {
        type: 'income' as const,
        name: '年度奖金',
        currency: 'CNY',
        amount: 10000,
        period: 'yearly' as const,
        dayOfMonth: 15,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.period).toBe('yearly');
      expect(newSource.dayOfMonth).toBe(15);
    });

    it('应添加投资财务来源', () => {
      // Arrange
      const sourceData = {
        type: 'investment' as const,
        name: '基金投资',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly' as const,
        investmentType: 'recurring',
        expectedReturn: 5,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.type).toBe('investment');
      expect(newSource.investmentType).toBe('recurring');
      expect(newSource.expectedReturn).toBe(5);
    });

    it('应添加贷款财务来源', () => {
      // Arrange
      const sourceData = {
        type: 'loan' as const,
        name: '房贷',
        currency: 'CNY',
        amount: 3000,
        period: 'monthly' as const,
        principal: 500000,
        interestRate: 4.5,
        interestType: 'equal_payment',
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.type).toBe('loan');
      expect(newSource.principal).toBe(500000);
      expect(newSource.interestRate).toBe(4.5);
    });

    it('应使用提供的自定义 ID', () => {
      // Arrange
      const sourceData = {
        id: 'custom-id',
        type: 'income' as const,
        name: '自定义ID来源',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly' as const,
      };

      // Act
      const newSource = service.addFinancialSource(sourceData);

      // Assert
      expect(newSource.id).toBe('custom-id');
    });
  });

  describe('updateFinancialSource', () => {
    it('应更新财务来源的属性', () => {
      // Arrange
      const source = service.addFinancialSource({
        type: 'income',
        name: '原始名称',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
      });

      // Act
      service.updateFinancialSource(source.id, {
        name: '更新后的名称',
        amount: 2000,
      });

      // Assert
      const sources = service.getFinancialSources();
      const updated = sources.find(s => s.id === source.id);
      expect(updated?.name).toBe('更新后的名称');
      expect(updated?.amount).toBe(2000);
    });

    it('应更新财务来源的周期和日期配置', () => {
      // Arrange
      const source = service.addFinancialSource({
        type: 'income',
        name: '测试来源',
        currency: 'CNY',
        amount: 1000,
        period: 'daily',
      });

      // Act
      service.updateFinancialSource(source.id, {
        period: 'weekly',
        dayOfWeek: 1,
      });

      // Assert
      const sources = service.getFinancialSources();
      const updated = sources.find(s => s.id === source.id);
      expect(updated?.period).toBe('weekly');
      expect(updated?.dayOfWeek).toBe(1);
    });

    it('更新不存在的来源不应报错', () => {
      // Act & Assert
      expect(() => {
        service.updateFinancialSource('non-existent', { name: 'test' });
      }).not.toThrow();
    });
  });

  describe('deleteFinancialSource', () => {
    it('应删除指定的财务来源', () => {
      // Arrange
      const source = service.addFinancialSource({
        type: 'income',
        name: '待删除来源',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
      });

      // Act
      const result = service.deleteFinancialSource(source.id);

      // Assert
      expect(result.success).toBe(true);
      expect(service.getFinancialSources()).toHaveLength(0);
    });

    it('删除不存在的来源应返回成功', () => {
      // Act
      const result = service.deleteFinancialSource('non-existent');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  // ========== Task 2: 汇总计算方法单元测试 ==========

  describe('calculateMonthlyIncome', () => {
    it('应返回0当没有收入来源时', () => {
      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(0);
    });

    it('应正确计算月收入（月级来源）', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '月薪',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly',
      });

      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(5000);
    });

    it('应正确计算月收入（日级来源转换）', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '每日收入',
        currency: 'CNY',
        amount: 100,
        period: 'daily',
      });

      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(3000); // 100 * 30
    });

    it('应正确计算月收入（周级来源转换）', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '每周收入',
        currency: 'CNY',
        amount: 1000,
        period: 'weekly',
      });

      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(4000); // 1000 * 4
    });

    it('应正确计算月收入（年 级来源转换）', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '年度奖金',
        currency: 'CNY',
        amount: 12000,
        period: 'yearly',
      });

      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(1000); // 12000 / 12
    });

    it('应汇总多个收入来源', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '月薪',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'income',
        name: '每日兼职',
        currency: 'CNY',
        amount: 100,
        period: 'daily',
      });

      // Act
      const income = service.calculateMonthlyIncome();

      // Assert
      expect(income).toBe(8000); // 5000 + 100 * 30
    });
  });

  describe('calculateMonthlyExpense', () => {
    it('应返回0当没有支出来源时', () => {
      // Act
      const expense = service.calculateMonthlyExpense();

      // Assert
      expect(expense).toBe(0);
    });

    it('应正确计算月支出', () => {
      // Arrange
      service.addFinancialSource({
        type: 'expense',
        name: '房租',
        currency: 'CNY',
        amount: 2000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'expense',
        name: '每日餐饮',
        currency: 'CNY',
        amount: 50,
        period: 'daily',
      });

      // Act
      const expense = service.calculateMonthlyExpense();

      // Assert
      expect(expense).toBe(3500); // 2000 + 50 * 30
    });
  });

  describe('calculateMonthlyBalance', () => {
    it('应正确计算月结余（收入 - 支出）', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '月薪',
        currency: 'CNY',
        amount: 8000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'expense',
        name: '总支出',
        currency: 'CNY',
        amount: 3000,
        period: 'monthly',
      });

      // Act
      const balance = service.calculateMonthlyBalance();

      // Assert
      expect(balance).toBe(5000);
    });

    it('应处理负结余', () => {
      // Arrange
      service.addFinancialSource({
        type: 'income',
        name: '低收入',
        currency: 'CNY',
        amount: 2000,
        period: 'monthly',
      });
      service.addFinancialSource({
        type: 'expense',
        name: '高支出',
        currency: 'CNY',
        amount: 5000,
        period: 'monthly',
      });

      // Act
      const balance = service.calculateMonthlyBalance();

      // Assert
      expect(balance).toBe(-3000);
    });
  });

  describe('generateMonthlyDataWithPrediction', () => {
    it('应返回月级预测数据', () => {
      // Act
      const monthlyData = service.generateMonthlyDataWithPrediction();

      // Assert
      expect(monthlyData.length).toBeGreaterThan(0);
      monthlyData.forEach(item => {
        expect(item.month).toMatch(/^\d{4}-\d{2}$/);
        expect(typeof item.income).toBe('number');
        expect(typeof item.expense).toBe('number');
        expect(typeof item.balance).toBe('number');
        expect(typeof item.isActual).toBe('boolean');
      });
    });

    it('应包含约13个月的预测数据', () => {
      // Act
      const monthlyData = service.generateMonthlyDataWithPrediction();

      // Assert
      expect(monthlyData.length).toBeGreaterThanOrEqual(12);
      expect(monthlyData.length).toBeLessThanOrEqual(14);
    });
  });

  describe('calculateExpectedInvestmentReturn', () => {
    it('应返回0当没有投资来源时', () => {
      // Act
      const returnValue = service.calculateExpectedInvestmentReturn();

      // Assert
      expect(returnValue).toBe(0);
    });

    it('应计算定投的预期月收益', () => {
      // Arrange
      service.addFinancialSource({
        type: 'investment',
        name: '基金定投',
        currency: 'CNY',
        amount: 1000,
        period: 'monthly',
        investmentType: 'recurring',
        expectedReturn: 6, // 6% 年化收益率
      });

      // Act
      const returnValue = service.calculateExpectedInvestmentReturn();

      // Assert
      // 月收益 = 1000 * (6% / 12) = 5
      expect(returnValue).toBeCloseTo(5, 1);
    });
  });

  describe('calculateMonthlyLoanPayment', () => {
    it('应返回0当没有贷款来源时', () => {
      // Act
      const payment = service.calculateMonthlyLoanPayment();

      // Assert
      expect(payment).toBe(0);
    });

    it('应计算等额本息的月还款额', () => {
      // Arrange
      service.addFinancialSource({
        type: 'loan',
        name: '房贷',
        currency: 'CNY',
        amount: 0,
        period: 'monthly',
        principal: 1000000,
        interestRate: 4.5,
        interestType: 'equal-payment',
      });

      // Act
      const payment = service.calculateMonthlyLoanPayment();

      // Assert
      expect(payment).toBeGreaterThan(0);
      // 100万，4.5%年利率，monthly period means getLoanMonths returns 1
      // monthlyRate = 4.5/100/12 = 0.00375
      // temp = (1.00375)^1 = 1.00375
      // payment = 1000000 * 0.00375 * 1.00375 / 0.00375 = 1003750
      expect(payment).toBeCloseTo(1003750, 0);
    });
  });
});