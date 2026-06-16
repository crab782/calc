import { describe, it, expect, beforeEach } from 'vitest';
import { RecordDAO } from './storage';
import type { ExpenseRecord, DataSchema, Category, Account } from '../types/record';
import { CURRENT_VERSION, INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_ACCOUNT, DEFAULT_INCOME_RULE } from '../types/record';

const STORAGE_KEY = 'expense_tracker_data';

describe('RecordDAO', () => {
  let dao: RecordDAO;

  beforeEach(() => {
    localStorage.clear();
    dao = new RecordDAO();
  });

  describe('findAll', () => {
    it('应返回空数组当没有记录时', () => {
      // Arrange & Act
      const records = dao.findAll();

      // Assert
      expect(records).toEqual([]);
    });

    it('应返回所有记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const records = dao.findAll();

      // Assert
      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(record);
    });

    it('应返回记录的副本而非引用', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const records = dao.findAll();
      records[0].amount = 200;

      // Assert
      expect(dao.findAll()[0].amount).toBe(100);
    });
  });

  describe('findById', () => {
    it('应返回 undefined 当记录不存在时', () => {
      // Arrange & Act
      const record = dao.findById('non-existent-id');

      // Assert
      expect(record).toBeUndefined();
    });

    it('应返回匹配的记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const found = dao.findById('test-id-1');

      // Assert
      expect(found).toEqual(record);
    });

    it('应返回第一条匹配的记录', () => {
      // Arrange
      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record1);

      // Act
      const found = dao.findById('test-id-1');

      // Assert
      expect(found).toEqual(record1);
    });
  });

  describe('save', () => {
    it('应添加新记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };

      // Act
      dao.save(record);

      // Assert
      expect(dao.count()).toBe(1);
      expect(dao.findById('test-id-1')).toEqual(record);
    });

    it('应更新已存在的记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const updatedRecord = { ...record, amount: 200, note: '更新后的记录' };
      dao.save(updatedRecord);

      // Assert
      expect(dao.count()).toBe(1);
      expect(dao.findById('test-id-1')?.amount).toBe(200);
      expect(dao.findById('test-id-1')?.note).toBe('更新后的记录');
    });

    it('应更新 updatedAt 时间戳', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      const dataBefore = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as DataSchema;
      const updatedAtBefore = dataBefore.updatedAt;

      // 等待一小段时间确保时间戳不同
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Act
      return wait(10).then(() => {
        dao.save({ ...record, amount: 200 });

        // Assert
        const dataAfter = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as DataSchema;
        expect(dataAfter.updatedAt).toBeGreaterThan(updatedAtBefore);
      });
    });
  });

  describe('delete', () => {
    it('应删除指定记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      dao.delete('test-id-1');

      // Assert
      expect(dao.count()).toBe(0);
      expect(dao.findById('test-id-1')).toBeUndefined();
    });

    it('应只删除匹配的记录', () => {
      // Arrange
      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'income',
        amount: 200,
        note: '测试记录2',
        category: 'inc-salary',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record1);
      dao.save(record2);

      // Act
      dao.delete('test-id-1');

      // Assert
      expect(dao.count()).toBe(1);
      expect(dao.findById('test-id-2')).toEqual(record2);
    });

    it('删除不存在的记录不应报错', () => {
      // Arrange & Act & Assert
      expect(() => dao.delete('non-existent-id')).not.toThrow();
      expect(dao.count()).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('应返回默认分类', () => {
      // Act
      const categories = dao.getCategories();

      // Assert
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toEqual(expect.arrayContaining([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));
    });

    it('应返回分类的副本而非引用', () => {
      // Arrange
      const categories = dao.getCategories();
      const originalLength = categories.length;

      // Act
      categories.push({ id: 'test-cat', name: '测试', type: 'expense', icon: 'test' });

      // Assert
      expect(dao.getCategories().length).toBe(originalLength);
    });
  });

  describe('addCategory', () => {
    it('应添加新分类', () => {
      // Arrange
      const newCategory: Category = {
        id: 'test-cat-1',
        name: '测试分类',
        type: 'expense',
        icon: 'test-icon',
      };

      // Act
      dao.addCategory(newCategory);

      // Assert
      const categories = dao.getCategories();
      expect(categories).toContainEqual(newCategory);
    });

    it('应允许添加重复 ID 的分类（业务层应处理唯一性）', () => {
      // Arrange
      const category1: Category = {
        id: 'test-cat-1',
        name: '测试分类1',
        type: 'expense',
        icon: 'test-icon',
      };
      const category2: Category = {
        id: 'test-cat-1',
        name: '测试分类2',
        type: 'expense',
        icon: 'test-icon',
      };

      // Act
      dao.addCategory(category1);
      dao.addCategory(category2);

      // Assert
      const categories = dao.getCategories();
      const matchingCategories = categories.filter(c => c.id === 'test-cat-1');
      expect(matchingCategories.length).toBe(2);
    });
  });

  describe('deleteCategory', () => {
    it('应删除指定分类', () => {
      // Arrange
      const newCategory: Category = {
        id: 'test-cat-1',
        name: '测试分类',
        type: 'expense',
        icon: 'test-icon',
      };
      dao.addCategory(newCategory);

      // Act
      dao.deleteCategory('test-cat-1');

      // Assert
      const categories = dao.getCategories();
      expect(categories.find(c => c.id === 'test-cat-1')).toBeUndefined();
    });

    it('删除不存在的分类不应报错', () => {
      // Arrange & Act & Assert
      expect(() => dao.deleteCategory('non-existent-id')).not.toThrow();
    });
  });

  describe('getAccounts', () => {
    it('应返回默认账户', () => {
      // Act
      const accounts = dao.getAccounts();

      // Assert
      expect(accounts.length).toBe(1);
      expect(accounts[0].id).toBe('default-account');
    });

    it('应返回数组的副本', () => {
      // Arrange
      const accounts = dao.getAccounts();
      const originalLength = accounts.length;

      // Act
      accounts.push({
        id: 'test-acc',
        name: '新账户',
        currency: 'USD',
        balance: 1000,
        createdAt: Date.now(),
      });

      // Assert
      expect(dao.getAccounts().length).toBe(originalLength);
    });
  });

  describe('addAccount', () => {
    it('应添加新账户', () => {
      // Arrange
      const newAccount: Account = {
        id: 'test-acc-1',
        name: '测试账户',
        currency: 'USD',
        balance: 1000,
        createdAt: Date.now(),
      };

      // Act
      dao.addAccount(newAccount);

      // Assert
      const accounts = dao.getAccounts();
      expect(accounts).toContainEqual(newAccount);
    });
  });

  describe('deleteAccount', () => {
    it('应删除指定账户', () => {
      // Arrange
      const newAccount: Account = {
        id: 'test-acc-1',
        name: '测试账户',
        currency: 'CNY',
        balance: 1000,
        createdAt: Date.now(),
      };
      dao.addAccount(newAccount);

      // Act
      dao.deleteAccount('test-acc-1');

      // Assert
      const accounts = dao.getAccounts();
      expect(accounts.find(a => a.id === 'test-acc-1')).toBeUndefined();
    });

    it('删除不存在的账户不应报错', () => {
      // Arrange & Act & Assert
      expect(() => dao.deleteAccount('non-existent-id')).not.toThrow();
    });
  });

  describe('exportData', () => {
    it('应导出完整的数据结构', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const data = dao.exportData();

      // Assert
      expect(data.version).toBe(CURRENT_VERSION);
      expect(data.records).toHaveLength(1);
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.accounts.length).toBeGreaterThan(0);
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('应包含所有保存的记录', () => {
      // Arrange
      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'income',
        amount: 200,
        note: '测试记录2',
        category: 'inc-salary',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record1);
      dao.save(record2);

      // Act
      const data = dao.exportData();

      // Assert
      expect(data.records).toHaveLength(2);
      expect(data.records).toContainEqual(record1);
      expect(data.records).toContainEqual(record2);
    });
  });

  describe('importData', () => {
    it('应成功导入有效数据', () => {
      // Arrange
      const data: DataSchema = {
        version: CURRENT_VERSION,
        records: [{
          id: 'test-id-1',
          type: 'expense',
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
        accounts: [DEFAULT_ACCOUNT],
        incomeRules: [{ ...DEFAULT_INCOME_RULE }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('成功导入');
      expect(dao.count()).toBe(1);
    });

    it('应拒绝无效的数据格式', () => {
      // Arrange
      const invalidData = {
        version: CURRENT_VERSION,
        records: 'not an array', // 无效的记录格式
        categories: [],
        accounts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as unknown as DataSchema;

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('验证失败');
    });

    it('应拒绝缺少必要字段的数据', () => {
      // Arrange
      const invalidData = {
        version: CURRENT_VERSION,
        records: [{
          id: 'test-id-1',
          // 缺少 type 字段
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [],
        accounts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as unknown as DataSchema;

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('应拒绝无效的记录类型', () => {
      // Arrange
      const invalidData: DataSchema = {
        version: CURRENT_VERSION,
        records: [{
          id: 'test-id-1',
          type: 'invalid-type' as 'income', // 无效类型
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('应拒绝负数金额', () => {
      // Arrange
      const invalidData: DataSchema = {
        version: CURRENT_VERSION,
        records: [{
          id: 'test-id-1',
          type: 'expense',
          amount: -100, // 负数金额
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('应拒绝零金额', () => {
      // Arrange
      const invalidData: DataSchema = {
        version: CURRENT_VERSION,
        records: [{
          id: 'test-id-1',
          type: 'expense',
          amount: 0, // 零金额
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('应验证账户数据', () => {
      // Arrange
      const invalidData: DataSchema = {
        version: CURRENT_VERSION,
        records: [],
        categories: [],
        accounts: [{
          id: 'test-acc-1',
          name: '测试账户',
          currency: 'CNY',
          balance: 1000,
          // 缺少 createdAt 字段
        }] as Account[],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('数据迁移', () => {
    it('应从 v1.0.0 迁移到 v1.1.0（添加 accounts 字段）', () => {
      // Arrange
      const oldData = {
        version: '1.0.0',
        records: [{
          id: 'test-id-1',
          type: 'expense' as const,
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
        // 没有 accounts 字段
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));
      const newDao = new RecordDAO();

      // Act
      const accounts = newDao.getAccounts();
      const data = newDao.exportData();

      // Assert - 连续迁移：v1.0.0 → v1.1.0 → v1.2.0
      expect(data.version).toBe('1.2.0');
      expect(accounts).toBeDefined();
      expect(accounts.length).toBe(1);
      expect(accounts[0].id).toBe('default-account');
      // 验证 incomeRules 也被迁移
      const incomeRules = newDao.getIncomeRules();
      expect(incomeRules).toBeDefined();
      expect(incomeRules.length).toBe(1);
      expect(incomeRules[0].name).toBe('工资');
    });

    it('应从 v0.1.0 迁移到 v1.0.0（添加 categories 字段）', () => {
      // Arrange
      const oldData = {
        version: '0.1.0',
        records: [{
          id: 'test-id-1',
          type: 'expense' as const,
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          currency: 'CNY',
          createdAt: Date.now(),
        }],
        // 没有 categories 字段
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));
      const newDao = new RecordDAO();

      // Act
      const categories = newDao.getCategories();
      const data = newDao.exportData();

      // Assert - 连续迁移：v0.1.0 → v1.0.0 → v1.1.0 → v1.2.0
      expect(data.version).toBe('1.2.0');
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      // 验证 accounts 和 incomeRules 也被迁移
      const accounts = newDao.getAccounts();
      expect(accounts.length).toBe(1);
      const incomeRules = newDao.getIncomeRules();
      expect(incomeRules.length).toBe(1);
    });

    it('应保留现有数据在迁移过程中', () => {
      // Arrange
      const oldData = {
        version: '1.0.0',
        records: [{
          id: 'test-id-1',
          type: 'expense' as const,
          amount: 100,
          note: '测试记录',
          category: 'exp-food',
          date: '2024-01-15',
          createdAt: 1700000000000,
        }],
        categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));
      const newDao = new RecordDAO();

      // Act
      const records = newDao.findAll();

      // Assert
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('test-id-1');
      expect(records[0].amount).toBe(100);
    });
  });

  describe('边界条件和异常处理', () => {
    it('应处理空的 localStorage', () => {
      // Arrange
      localStorage.clear();
      const newDao = new RecordDAO();

      // Act
      const records = newDao.findAll();
      const categories = newDao.getCategories();
      const accounts = newDao.getAccounts();

      // Assert
      expect(records).toEqual([]);
      expect(categories.length).toBeGreaterThan(0);
      expect(accounts.length).toBe(1);
    });

    it('应处理损坏的 JSON 数据', () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      // Act
      const newDao = new RecordDAO();
      const records = newDao.findAll();

      // Assert
      expect(records).toEqual([]);
    });

    it('应处理 null localStorage 值', () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, 'null');

      // Act
      const newDao = new RecordDAO();
      const records = newDao.findAll();

      // Assert
      expect(records).toEqual([]);
    });

    it('应处理大量记录', () => {
      // Arrange
      const recordCount = 1000;
      for (let i = 0; i < recordCount; i++) {
        const record: ExpenseRecord = {
          id: `test-id-${i}`,
          type: i % 2 === 0 ? 'expense' : 'income',
          amount: Math.random() * 1000,
          note: `测试记录 ${i}`,
          category: i % 2 === 0 ? 'exp-food' : 'inc-salary',
          date: '2024-01-15',
          createdAt: Date.now() + i,
          currency: 'CNY',
        };
        dao.save(record);
      }

      // Act
      const records = dao.findAll();
      const count = dao.count();

      // Assert
      expect(count).toBe(recordCount);
      expect(records.length).toBe(recordCount);
    });

    it('应处理特殊字符的记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-special',
        type: 'expense',
        amount: 100,
        note: '特殊字符测试: <script>alert("xss")</script> & "quotes" \'apostrophe\'',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };

      // Act
      dao.save(record);
      const found = dao.findById('test-id-special');

      // Assert
      expect(found).toBeDefined();
      expect(found?.note).toBe(record.note);
    });

    it('应处理 Unicode 字符的记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-unicode',
        type: 'expense',
        amount: 100,
        note: '中文测试 日本語 한국어 العربية 🎉🎊',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };

      // Act
      dao.save(record);
      const found = dao.findById('test-id-unicode');

      // Assert
      expect(found).toBeDefined();
      expect(found?.note).toBe(record.note);
    });

    it('应处理极大金额', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-large',
        type: 'expense',
        amount: Number.MAX_SAFE_INTEGER,
        note: '极大金额测试',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };

      // Act
      dao.save(record);
      const found = dao.findById('test-id-large');

      // Assert
      expect(found).toBeDefined();
      expect(found?.amount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应处理极小正数金额', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-small',
        type: 'expense',
        amount: 0.01,
        note: '极小金额测试',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };

      // Act
      dao.save(record);
      const found = dao.findById('test-id-small');

      // Assert
      expect(found).toBeDefined();
      expect(found?.amount).toBe(0.01);
    });
  });

  describe('count', () => {
    it('应返回正确的记录数量', () => {
      // Arrange
      expect(dao.count()).toBe(0);

      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record1);
      expect(dao.count()).toBe(1);

      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'income',
        amount: 200,
        note: '测试记录2',
        category: 'inc-salary',
        date: '2024-01-16',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record2);
      expect(dao.count()).toBe(2);
    });
  });

  describe('deleteAll', () => {
    it('应删除所有数据', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      dao.deleteAll();

      // Assert
      expect(dao.count()).toBe(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('findByMonth', () => {
    it('应返回指定月份的记录', () => {
      // Arrange
      const record1: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录1',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      const record2: ExpenseRecord = {
        id: 'test-id-2',
        type: 'expense',
        amount: 200,
        note: '测试记录2',
        category: 'exp-food',
        date: '2024-02-15',
        createdAt: Date.now(),
        currency: 'CNY',
      };
      dao.save(record1);
      dao.save(record2);

      // Act
      const januaryRecords = dao.findByMonth('2024-01');

      // Assert
      expect(januaryRecords).toHaveLength(1);
      expect(januaryRecords[0].id).toBe('test-id-1');
    });

    it('应返回空数组当没有匹配的月份记录', () => {
      // Arrange
      const record: ExpenseRecord = {
        id: 'test-id-1',
        type: 'expense',
        amount: 100,
        note: '测试记录',
        category: 'exp-food',
        date: '2024-01-15',
        currency: 'CNY',
        createdAt: Date.now(),
      };
      dao.save(record);

      // Act
      const februaryRecords = dao.findByMonth('2024-02');

      // Assert
      expect(februaryRecords).toEqual([]);
    });
  });

  describe('updateCategory', () => {
    it('应更新已存在的分类', () => {
      // Arrange
      const newCategory: Category = {
        id: 'test-cat-1',
        name: '测试分类',
        type: 'expense',
        icon: 'test-icon',
      };
      dao.addCategory(newCategory);

      // Act
      const updatedCategory: Category = {
        id: 'test-cat-1',
        name: '更新后的分类',
        type: 'expense',
        icon: 'updated-icon',
      };
      dao.updateCategory(updatedCategory);

      // Assert
      const categories = dao.getCategories();
      const found = categories.find(c => c.id === 'test-cat-1');
      expect(found).toEqual(updatedCategory);
    });

    it('更新不存在的分类不应报错', () => {
      // Arrange
      const category: Category = {
        id: 'non-existent-id',
        name: '不存在的分类',
        type: 'expense',
        icon: 'test-icon',
      };

      // Act & Assert
      expect(() => dao.updateCategory(category)).not.toThrow();
    });
  });

  describe('updateAccount', () => {
    it('应更新已存在的账户', () => {
      // Arrange
      const newAccount: Account = {
        id: 'test-acc-1',
        name: '测试账户',
        currency: 'CNY',
        balance: 1000,
        createdAt: Date.now(),
      };
      dao.addAccount(newAccount);

      // Act
      const updatedAccount: Account = {
        id: 'test-acc-1',
        name: '更新后的账户',
        currency: 'USD',
        balance: 2000,
        createdAt: Date.now(),
      };
      dao.updateAccount(updatedAccount);

      // Assert
      const accounts = dao.getAccounts();
      const found = accounts.find(a => a.id === 'test-acc-1');
      expect(found).toEqual(updatedAccount);
    });

    it('更新不存在的账户不应报错', () => {
      // Arrange
      const account: Account = {
        id: 'non-existent-id',
        name: '不存在的账户',
        currency: 'CNY',
        balance: 1000,
        createdAt: Date.now(),
      };

      // Act & Assert
      expect(() => dao.updateAccount(account)).not.toThrow();
    });
  });

  describe('saveCategories', () => {
    it('应替换所有分类', () => {
      // Arrange
      const newCategories: Category[] = [
        { id: 'new-cat-1', name: '新分类1', type: 'expense', icon: 'icon1' },
        { id: 'new-cat-2', name: '新分类2', type: 'income', icon: 'icon2' },
      ];

      // Act
      dao.saveCategories(newCategories);

      // Assert
      const categories = dao.getCategories();
      expect(categories).toEqual(newCategories);
    });
  });

  describe('saveAccounts', () => {
    it('应替换所有账户', () => {
      // Arrange
      const newAccounts: Account[] = [
        { id: 'new-acc-1', name: '新账户1', currency: 'CNY', balance: 1000, createdAt: Date.now() },
        { id: 'new-acc-2', name: '新账户2', currency: 'USD', balance: 2000, createdAt: Date.now() },
      ];

      // Act
      dao.saveAccounts(newAccounts);

      // Assert
      const accounts = dao.getAccounts();
      expect(accounts).toEqual(newAccounts);
    });
  });

  describe('旧记录 currency 字段向后兼容', () => {
    it('findAll() 应为缺少 currency 的旧记录补全默认值 CNY', () => {
      // Arrange - 直接操作 localStorage 模拟旧数据
      const oldData = {
        version: '1.2.0',
        records: [
          {
            id: 'old-record-1',
            type: 'income' as const,
            amount: 334,
            note: '',
            category: '工资',
            date: '2026-06-15',
            createdAt: 1781535627313,
            // 注意：没有 currency 字段
          },
        ],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('expense_tracker_data', JSON.stringify(oldData));

      // Act
      const records = dao.findAll();

      // Assert
      expect(records).toHaveLength(1);
      expect(records[0].currency).toBe('CNY');
    });

    it('findById() 应为缺少 currency 的旧记录补全默认值 CNY', () => {
      // Arrange
      const oldData = {
        version: '1.2.0',
        records: [
          {
            id: 'old-record-2',
            type: 'expense' as const,
            amount: 44,
            note: '',
            category: '餐饮',
            date: '2026-06-04',
            createdAt: 1781535647535,
          },
        ],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('expense_tracker_data', JSON.stringify(oldData));

      // Act
      const record = dao.findById('old-record-2');

      // Assert
      expect(record).toBeDefined();
      expect(record!.currency).toBe('CNY');
    });

    it('findByMonth() 应为缺少 currency 的旧记录补全默认值 CNY', () => {
      // Arrange
      const oldData = {
        version: '1.2.0',
        records: [
          {
            id: 'old-record-3',
            type: 'income' as const,
            amount: 334,
            note: '',
            category: '工资',
            date: '2026-06-15',
            createdAt: 1781535627313,
          },
        ],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('expense_tracker_data', JSON.stringify(oldData));

      // Act
      const records = dao.findByMonth('2026-06');

      // Assert
      expect(records).toHaveLength(1);
      expect(records[0].currency).toBe('CNY');
    });

    it('importData() 导入旧数据时应补全 currency 字段', () => {
      // Arrange
      const oldExportData = {
        version: '1.2.0',
        records: [
          {
            id: 'import-record-1',
            type: 'income' as const,
            amount: 334,
            note: '',
            category: '工资',
            date: '2026-06-15',
            createdAt: 1781535627313,
          },
        ],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      const result = dao.importData(oldExportData as unknown as DataSchema);

      // Assert
      expect(result.success).toBe(true);
      const records = dao.findAll();
      expect(records).toHaveLength(1);
      expect(records[0].currency).toBe('CNY');
    });

    it('新记录不应被覆盖已有的 currency 字段', () => {
      // Arrange
      const newData = {
        version: '1.2.0',
        records: [
          {
            id: 'new-record-1',
            type: 'income' as const,
            amount: 334,
            note: '',
            category: '工资',
            date: '2026-06-15',
            createdAt: 1781535627313,
            currency: 'USD',
          },
        ],
        categories: [],
        accounts: [],
        incomeRules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('expense_tracker_data', JSON.stringify(newData));

      // Act
      const records = dao.findAll();

      // Assert
      expect(records).toHaveLength(1);
      expect(records[0].currency).toBe('USD');
    });
  });
});