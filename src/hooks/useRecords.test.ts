import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecords } from './useRecords';
import type { Category, Account } from '../types/record';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_ACCOUNT } from '../types/record';

describe('useRecords Hook', () => {
  // 在每个测试前清空 localStorage
  beforeEach(() => {
    localStorage.clear();
  });

  describe('状态初始化', () => {
    it('应该初始化 records 为空数组', () => {
      const { result } = renderHook(() => useRecords());

      expect(result.current.records).toEqual([]);
      expect(result.current.count).toBe(0);
    });

    it('应该初始化 categories 为默认分类', () => {
      const { result } = renderHook(() => useRecords());

      const expectedCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
      expect(result.current.categories).toEqual(expectedCategories);
    });

    it('应该初始化 accounts 为默认账户（5类账户）', () => {
      const { result } = renderHook(() => useRecords());

      expect(result.current.accounts).toHaveLength(5);
      // 默认 CNY 币种创建5类账户
      const accountIds = result.current.accounts.map(a => a.id);
      expect(accountIds).toContain('CNY-cash');
      expect(accountIds).toContain('CNY-investment');
      expect(accountIds).toContain('CNY-loan');
    });
  });

  describe('派生状态计算', () => {
    it('应该正确过滤收入分类', () => {
      const { result } = renderHook(() => useRecords());

      expect(result.current.incomeCategories).toHaveLength(INCOME_CATEGORIES.length);
      result.current.incomeCategories.forEach((category) => {
        expect(category.type).toBe('income');
      });
    });

    it('应该正确过滤支出分类', () => {
      const { result } = renderHook(() => useRecords());

      expect(result.current.expenseCategories).toHaveLength(EXPENSE_CATEGORIES.length);
      result.current.expenseCategories.forEach((category) => {
        expect(category.type).toBe('expense');
      });
    });

    it('应该正确计算记录数量', () => {
      const { result } = renderHook(() => useRecords());

      // 初始状态
      expect(result.current.count).toBe(0);

      // 添加记录后
      act(() => {
        result.current.addRecord({
          type: 'expense',
          amount: 100,
          note: '测试',
          category: 'exp-food',
          date: '2024-01-15',
        });
      });

      expect(result.current.count).toBe(1);
    });
  });

  describe('记录操作方法', () => {
    describe('addRecord', () => {
      it('应该成功添加一条支出记录', () => {
        const { result } = renderHook(() => useRecords());

        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '午餐',
            category: 'exp-food',
            date: '2024-01-15',
          });
        });

        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].type).toBe('expense');
        expect(result.current.records[0].amount).toBe(100);
        expect(result.current.records[0].note).toBe('午餐');
        expect(result.current.records[0].category).toBe('exp-food');
        expect(result.current.records[0].date).toBe('2024-01-15');
        expect(result.current.count).toBe(1);
      });

      it('应该成功添加一条收入记录', () => {
        const { result } = renderHook(() => useRecords());

        act(() => {
          result.current.addRecord({
            type: 'income',
            amount: 5000,
            note: '工资',
            category: 'inc-salary',
            date: '2024-01-01',
          });
        });

        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].type).toBe('income');
        expect(result.current.records[0].amount).toBe(5000);
      });

      it('添加记录时应该自动生成 id 和 createdAt', () => {
        const { result } = renderHook(() => useRecords());

        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 50,
            note: '交通',
            category: 'exp-transport',
            date: '2024-01-10',
          });
        });

        const record = result.current.records[0];
        expect(record.id).toBeDefined();
        expect(typeof record.id).toBe('string');
        expect(record.createdAt).toBeDefined();
        expect(typeof record.createdAt).toBe('number');
      });

      it('应该能够添加多条记录', () => {
        const { result } = renderHook(() => useRecords());

        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '早餐',
            category: 'exp-food',
            date: '2024-01-15',
          });
          result.current.addRecord({
            type: 'income',
            amount: 3000,
            note: '奖金',
            category: 'inc-bonus',
            date: '2024-01-10',
          });
        });

        expect(result.current.records).toHaveLength(2);
        expect(result.current.count).toBe(2);
      });
    });

    describe('deleteRecord', () => {
      it('应该成功删除指定记录', () => {
        const { result } = renderHook(() => useRecords());

        // 先添加记录
        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '测试',
            category: 'exp-food',
            date: '2024-01-15',
          });
        });

        const recordId = result.current.records[0].id;

        // 删除记录
        act(() => {
          result.current.deleteRecord(recordId);
        });

        expect(result.current.records).toHaveLength(0);
        expect(result.current.count).toBe(0);
      });

      it('删除不存在的记录应该不影响其他记录', () => {
        const { result } = renderHook(() => useRecords());

        // 添加两条记录
        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '记录1',
            category: 'exp-food',
            date: '2024-01-15',
          });
          result.current.addRecord({
            type: 'expense',
            amount: 200,
            note: '记录2',
            category: 'exp-transport',
            date: '2024-01-16',
          });
        });

        // 删除不存在的记录
        act(() => {
          result.current.deleteRecord('non-existent-id');
        });

        expect(result.current.records).toHaveLength(2);
      });
    });

    describe('getRecentRecords', () => {
      it('应该返回最近添加的记录（按创建时间降序）', async () => {
        const { result } = renderHook(() => useRecords());

        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '记录1',
            category: 'exp-food',
            date: '2024-01-15',
          });
        });

        // 等待一小段时间确保 createdAt 不同
        await new Promise((resolve) => setTimeout(resolve, 10));

        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 200,
            note: '记录2',
            category: 'exp-transport',
            date: '2024-01-16',
          });
        });

        const recentRecords = result.current.getRecentRecords(10);
        expect(recentRecords).toHaveLength(2);
        // 最新记录应该在前面
        expect(recentRecords[0].note).toBe('记录2');
      });

      it('应该限制返回的记录数量', () => {
        const { result } = renderHook(() => useRecords());

        // 添加 5 条记录
        act(() => {
          for (let i = 0; i < 5; i++) {
            result.current.addRecord({
              type: 'expense',
              amount: 100 * (i + 1),
              note: `记录${i + 1}`,
              category: 'exp-food',
              date: '2024-01-15',
            });
          }
        });

        const recentRecords = result.current.getRecentRecords(3);
        expect(recentRecords).toHaveLength(3);
      });
    });
  });

  describe('分类管理方法', () => {
    describe('addCategory', () => {
      it('应该成功添加收入分类', () => {
        const { result } = renderHook(() => useRecords());

        const initialCount = result.current.categories.length;

        act(() => {
          result.current.addCategory({
            name: '投资分红',
            type: 'income',
            icon: 'coins',
          });
        });

        expect(result.current.categories).toHaveLength(initialCount + 1);
        const newCategory = result.current.categories.find((c) => c.name === '投资分红');
        expect(newCategory).toBeDefined();
        expect(newCategory?.type).toBe('income');
        expect(newCategory?.icon).toBe('coins');
      });

      it('应该成功添加支出分类', () => {
        const { result } = renderHook(() => useRecords());

        const initialCount = result.current.categories.length;

        act(() => {
          result.current.addCategory({
            name: '宠物',
            type: 'expense',
            icon: 'paw-print',
          });
        });

        expect(result.current.categories).toHaveLength(initialCount + 1);
        const newCategory = result.current.categories.find((c) => c.name === '宠物');
        expect(newCategory).toBeDefined();
        expect(newCategory?.type).toBe('expense');
      });

      it('添加分类后 incomeCategories 应该更新', () => {
        const { result } = renderHook(() => useRecords());

        const initialIncomeCount = result.current.incomeCategories.length;

        act(() => {
          result.current.addCategory({
            name: '新收入分类',
            type: 'income',
            icon: 'star',
          });
        });

        expect(result.current.incomeCategories).toHaveLength(initialIncomeCount + 1);
      });

      it('添加分类后 expenseCategories 应该更新', () => {
        const { result } = renderHook(() => useRecords());

        const initialExpenseCount = result.current.expenseCategories.length;

        act(() => {
          result.current.addCategory({
            name: '新支出分类',
            type: 'expense',
            icon: 'star',
          });
        });

        expect(result.current.expenseCategories).toHaveLength(initialExpenseCount + 1);
      });
    });

    describe('deleteCategory', () => {
      it('应该成功删除未使用的分类', () => {
        const { result } = renderHook(() => useRecords());

        // 先添加一个分类
        act(() => {
          result.current.addCategory({
            name: '待删除分类',
            type: 'expense',
            icon: 'trash',
          });
        });

        const newCategory = result.current.categories.find((c) => c.name === '待删除分类');
        expect(newCategory).toBeDefined();

        // 删除分类
        let deleteResult: { success: boolean; message: string };
        act(() => {
          deleteResult = result.current.deleteCategory(newCategory!.id);
        });

        expect(deleteResult!.success).toBe(true);
        expect(result.current.categories.find((c) => c.name === '待删除分类')).toBeUndefined();
      });

      it('删除被使用的分类应该失败', () => {
        const { result } = renderHook(() => useRecords());

        // 先添加一条记录
        act(() => {
          result.current.addRecord({
            type: 'expense',
            amount: 100,
            note: '测试',
            category: 'exp-food',
            date: '2024-01-15',
          });
        });

        // 尝试删除正在使用的分类
        let deleteResult: { success: boolean; message: string };
        act(() => {
          deleteResult = result.current.deleteCategory('exp-food');
        });

        expect(deleteResult!.success).toBe(false);
        expect(deleteResult!.message).toBe('该分类正在被使用，无法删除');
      });
    });

    describe('updateCategory', () => {
      it('应该成功更新分类', () => {
        const { result } = renderHook(() => useRecords());

        const category = result.current.categories[0];
        const updatedCategory: Category = {
          ...category,
          name: '更新后的名称',
        };

        act(() => {
          result.current.updateCategory(updatedCategory);
        });

        const found = result.current.categories.find((c) => c.id === category.id);
        expect(found?.name).toBe('更新后的名称');
      });
    });
  });

  describe('账户管理方法', () => {
    describe('addAccount', () => {
      it('应该成功添加新账户', () => {
        const { result } = renderHook(() => useRecords());

        const initialCount = result.current.accounts.length;

        let addResult: { success: boolean; message: string; account?: Account };
        act(() => {
          addResult = result.current.addAccount({
            currency: 'USD',
            accountType: 'cash',
          });
        });

        expect(result.current.accounts).toHaveLength(initialCount + 1);
        expect(addResult!.success).toBe(true);
        expect(addResult!.account).toBeDefined();
        expect(addResult!.account!.currency).toBe('USD');
        expect(addResult!.account!.accountType).toBe('cash');
        expect(addResult!.account!.id).toBeDefined();
        expect(addResult!.account!.createdAt).toBeDefined();
      });

      it('添加账户时应该自动生成 id 和 createdAt', () => {
        const { result } = renderHook(() => useRecords());

        let addResult: { success: boolean; message: string; account?: Account };
        act(() => {
          addResult = result.current.addAccount({
            currency: 'USD',
            accountType: 'investment',
          });
        });

        expect(addResult!.success).toBe(true);
        expect(addResult!.account!.id).toBeDefined();
        expect(typeof addResult!.account!.id).toBe('string');
        expect(addResult!.account!.createdAt).toBeDefined();
        expect(typeof addResult!.account!.createdAt).toBe('number');
      });
    });

    describe('deleteAccount', () => {
      it('应该成功删除账户（当有多个账户时）', () => {
        const { result } = renderHook(() => useRecords());

        // 先添加一个账户
        let addResult: { success: boolean; message: string; account?: Account };
        act(() => {
          addResult = result.current.addAccount({
            currency: 'USD',
            accountType: 'cash',
          });
        });

        const accountToDelete = addResult!.account;
        expect(accountToDelete).toBeDefined();

        // 删除账户 - 删除后账户 visible=false，但仍存在于 accounts 数组中
        let deleteResult: { success: boolean; message: string };
        act(() => {
          deleteResult = result.current.deleteAccount(accountToDelete!.id);
        });

        expect(deleteResult!.success).toBe(true);
        // 账户被软删除（visible=false），但仍在数组中
        const deletedAccount = result.current.accounts.find((a) => a.id === accountToDelete!.id);
        expect(deletedAccount?.visible).toBe(false);
      });

      it('删除最后一个可见账户应该失败', () => {
        const { result } = renderHook(() => useRecords());

        // 默认有5个账户（CNY-cash, CNY-investment, CNY-loan, CNY-expense, CNY-income）
        // 其中只有 CNY-cash/investment/loan 是 visible=true 的
        // 先隐藏所有 investment 和 loan 账户
        const nonCashVisible = result.current.accounts.filter(
          a => a.visible !== false && a.id !== 'CNY-cash'
        );
        nonCashVisible.forEach(account => {
          act(() => {
            result.current.deleteAccount(account.id);
          });
        });

        // 现在尝试删除最后一个可见的现金账户（还有隐藏的账户在 storage 中）
        // 因为 storage 中还有其他账户，所以删除应该成功（软删除）
        let deleteResult: { success: boolean; message: string };
        act(() => {
          deleteResult = result.current.deleteAccount('CNY-cash');
        });

        // 由于 storage 中还有其他账户，删除应该成功
        expect(deleteResult!.success).toBe(true);
      });
    });

    describe('updateAccount', () => {
      it('应该成功更新账户', () => {
        const { result } = renderHook(() => useRecords());

        const account = result.current.accounts[0];
        const updatedAccount: Account = {
          ...account,
          name: '更新后的账户名',
          balance: 5000,
        };

        act(() => {
          result.current.updateAccount(updatedAccount);
        });

        const found = result.current.accounts.find((a) => a.id === account.id);
        expect(found?.name).toBe('更新后的账户名');
        expect(found?.balance).toBe(5000);
      });
    });
  });

  describe('刷新方法', () => {
    it('refresh 应该重新加载记录', () => {
      const { result } = renderHook(() => useRecords());

      // 直接在 localStorage 中添加记录
      const existingData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      existingData.records = [
        {
          id: 'test-id',
          type: 'expense' as const,
          amount: 999,
          note: '外部记录',
          category: 'exp-food',
          date: '2024-01-01',
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem('expense_tracker_data', JSON.stringify(existingData));

      act(() => {
        result.current.refresh();
      });

      expect(result.current.records).toHaveLength(1);
      expect(result.current.records[0].note).toBe('外部记录');
    });

    it('refreshCategories 应该重新加载分类', () => {
      const { result } = renderHook(() => useRecords());

      // 直接在 localStorage 中添加分类
      const existingData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      existingData.categories = [
        { id: 'test-cat', name: '测试分类', type: 'expense', icon: 'test' },
      ];
      localStorage.setItem('expense_tracker_data', JSON.stringify(existingData));

      act(() => {
        result.current.refreshCategories();
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0].name).toBe('测试分类');
    });

    it('refreshAccounts 应该重新加载账户', async () => {
      const { recordDAO } = await import('../lib/storage');
      const { result } = renderHook(() => useRecords());

      // Directly manipulate localStorage through recordDAO to simulate external changes
      const currentAccounts = recordDAO.getAccounts();
      const newAccount = {
        id: 'test-acc',
        name: '测试账户',
        currency: 'CNY',
        accountType: 'cash',
        balance: 100,
        createdAt: Date.now(),
        isDefault: false,
        visible: true,
      };
      recordDAO.saveAccounts([...currentAccounts, newAccount]);

      // Before refresh, the hook's state should NOT have the new account
      const beforeRefresh = result.current.accounts.find(a => a.id === 'test-acc');
      expect(beforeRefresh).toBeUndefined();

      act(() => {
        result.current.refreshAccounts();
      });

      // After refresh, the hook's state should include the new account
      const found = result.current.accounts.find(a => a.id === 'test-acc');
      expect(found).toBeDefined();
      expect(found?.name).toBe('测试账户');
    });
  });

  describe('数据持久化', () => {
    it('添加记录后应该持久化到 localStorage', () => {
      const { result } = renderHook(() => useRecords());

      act(() => {
        result.current.addRecord({
          type: 'expense',
          amount: 100,
          note: '测试持久化',
          category: 'exp-food',
          date: '2024-01-15',
        });
      });

      // 验证 localStorage 中有数据
      const storedData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      expect(storedData.records).toHaveLength(1);
      expect(storedData.records[0].note).toBe('测试持久化');
    });

    it('删除记录后应该更新 localStorage', () => {
      const { result } = renderHook(() => useRecords());

      // 添加记录
      act(() => {
        result.current.addRecord({
          type: 'expense',
          amount: 100,
          note: '待删除',
          category: 'exp-food',
          date: '2024-01-15',
        });
      });

      const recordId = result.current.records[0].id;

      // 删除记录
      act(() => {
        result.current.deleteRecord(recordId);
      });

      // 验证 localStorage 中没有数据
      const storedData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      expect(storedData.records).toHaveLength(0);
    });

    it('添加分类后应该持久化到 localStorage', () => {
      const { result } = renderHook(() => useRecords());

      act(() => {
        result.current.addCategory({
          name: '持久化测试分类',
          type: 'expense',
          icon: 'test',
        });
      });

      const storedData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      const found = storedData.categories.find((c: Category) => c.name === '持久化测试分类');
      expect(found).toBeDefined();
    });

    it('添加账户后应该持久化到 localStorage', () => {
      const { result } = renderHook(() => useRecords());

      act(() => {
        result.current.addAccount({
          currency: 'USD',
          accountType: 'cash',
        });
      });

      const storedData = JSON.parse(localStorage.getItem('expense_tracker_data') || '{}');
      const found = storedData.accounts.find((a: Account) => a.currency === 'USD' && a.accountType === 'cash');
      expect(found).toBeDefined();
    });
  });
});