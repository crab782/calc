import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordService } from './record';
import type { ExpenseRecord, DataSchema, Category, Account } from '../types/record';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_ACCOUNT } from '../types/record';

// Create a mock store that can be reset
const createMockStore = (): DataSchema => ({
  version: '1.1.0',
  records: [],
  categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
  accounts: [{ ...DEFAULT_ACCOUNT }],
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
      mockStore.accounts = mockStore.accounts.filter(a => a.id !== id);
      mockStore.updatedAt = Date.now();
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
        createdAt: baseTime,
      };
      mockStore.records.push(record1);
      
      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'expense',
        amount: 200,
        note: '记录2',
        category: 'exp-food',
        date: '2024-01-16',
        createdAt: baseTime + 100,
      };
      mockStore.records.push(record2);
      
      const record3: ExpenseRecord = {
        id: 'test-id-3',
        type: 'expense',
        amount: 300,
        note: '记录3',
        category: 'exp-food',
        date: '2024-01-17',
        createdAt: baseTime + 200,
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
        version: '1.1.0',
        records: [{
          id: 'test-id-1',
          type: 'expense',
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          createdAt: Date.now(),
        }],
        categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
        accounts: [{ ...DEFAULT_ACCOUNT }],
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
    it('应添加新账户', () => {
      // Arrange
      const accountData = {
        name: '测试账户',
        currency: 'USD',
        balance: 1000,
      };

      // Act
      const newAccount = service.addAccount(accountData);

      // Assert
      expect(newAccount.id).toBeDefined();
      expect(newAccount.name).toBe('测试账户');
      expect(newAccount.currency).toBe('USD');
      expect(newAccount.balance).toBe(1000);
      expect(newAccount.createdAt).toBeDefined();
    });

    it('应生成以 acc- 开头的 ID', () => {
      // Arrange
      const accountData = {
        name: '测试账户',
        currency: 'CNY',
        balance: 0,
      };

      // Act
      const newAccount = service.addAccount(accountData);

      // Assert
      expect(newAccount.id).toMatch(/^acc-/);
    });
  });

  describe('deleteAccount', () => {
    it('应删除账户当有多个账户时', () => {
      // Arrange
      const account1 = service.addAccount({
        name: '账户1',
        currency: 'CNY',
        balance: 0,
      });
      service.addAccount({
        name: '账户2',
        currency: 'USD',
        balance: 0,
      });

      // Act
      const result = service.deleteAccount(account1.id);

      // Assert
      expect(result.success).toBe(true);
      const accounts = service.getAccounts();
      expect(accounts.find(a => a.id === account1.id)).toBeUndefined();
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
        name: '测试账户',
        currency: 'CNY',
        balance: 0,
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
      const newAccount = service.addAccount({
        name: '测试账户',
        currency: 'CNY',
        balance: 0,
      });

      // Act
      service.updateAccount({
        id: newAccount.id,
        name: '更新后的账户',
        currency: 'USD',
        balance: 1000,
        createdAt: newAccount.createdAt,
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
});