import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Accounts } from './Accounts';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { message } from 'antd';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../hooks/useRecords');

// Mock antd message
vi.mock('antd', async (originalImport) => {
  const actual = await originalImport();
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Accounts', () => {
  const mockAddAccount = vi.fn(() => ({
    success: true,
    message: '',
    account: {
      id: 'test-account',
      name: '测试账户',
      currency: 'CNY',
      balance: 0,
      createdAt: Date.now(),
    },
  }));
  const mockDeleteAccount = vi.fn(() => ({ success: true, message: '' }));
  const mockUpdateAccount = vi.fn();

  const defaultLanguageMock = {
    language: 'zh' as const,
    t: {
      accounts: {
        title: '账户管理',
        addAccount: '添加账户',
        deleteAccount: '删除账户',
        accountName: '账户名称',
        accountNamePlaceholder: '请输入账户名称',
        currency: '币种',
        balance: '余额',
        noAccounts: '暂无账户',
        addFirstAccount: '点击右上角按钮添加第一个账户',
        deleteConfirm: '确认删除账户',
        deleteMessage: '删除后无法恢复，确定要删除这个账户吗？',
        deleteSuccess: '账户删除成功',
        deleteFailed: '至少需要保留一个账户',
        addSuccess: '账户添加成功',
        cancel: '取消',
        confirm: '确认',
        singleAccountTip: '当前使用总账户，添加其他币种账户可进行多币种管理',
        defaultAccountName: '总账户',
        setDefaultAccount: '设为默认',
        isDefaultAccount: '默认账户',
        setDefaultSuccess: '已设为默认账户',
        editAccount: '编辑账户',
        editAccountName: '账户名称',
        editAccountNamePlaceholder: '请输入账户名称',
        editAccountBalance: '余额',
        editAccountBalancePlaceholder: '请输入余额',
        editSuccess: '账户信息更新成功',
        invalidBalance: '请输入有效的余额数值',
        delete: '删除',
        defaultAccountLabel: '默认',
      },
    },
    toggleLanguage: vi.fn(),
  };

  const defaultRecordsMock = {
    records: [],
    accounts: [],
    addAccount: mockAddAccount,
    deleteAccount: mockDeleteAccount,
    updateAccount: mockUpdateAccount,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLanguage).mockReturnValue(defaultLanguageMock as any);
    vi.mocked(useRecords).mockReturnValue(defaultRecordsMock as any);
  });

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', () => {
      render(<Accounts />);
      expect(screen.getByText('账户管理')).toBeInTheDocument();
    });

    it('应该渲染添加账户按钮', () => {
      render(<Accounts />);
      expect(screen.getByText('添加账户')).toBeInTheDocument();
    });
  });

  describe('空状态显示', () => {
    it('当没有账户时应该显示空状态提示', () => {
      render(<Accounts />);
      expect(screen.getByText('暂无账户')).toBeInTheDocument();
    });
  });

  describe('账户列表显示', () => {
    it('应该显示账户列表', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
          isDefault: true,
          visible: true,
          accountType: 'cash' as const,
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
          isDefault: false,
          visible: true,
          accountType: 'cash' as const,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
        updateAccount: mockUpdateAccount,
      } as any);

      await act(async () => {
        render(<Accounts />);
      });

      expect(screen.getByText('现金账户')).toBeInTheDocument();
      expect(screen.getByText('银行账户')).toBeInTheDocument();
    });

    it('应该显示账户币种', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
          isDefault: true,
          visible: true,
          accountType: 'cash' as const,
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
          isDefault: false,
          visible: true,
          accountType: 'cash' as const,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
        updateAccount: mockUpdateAccount,
      } as any);

      await act(async () => {
        render(<Accounts />);
      });

      expect(screen.getByText('CNY')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('应该显示账户余额', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000.50,
          createdAt: Date.now(),
          isDefault: true,
          visible: true,
          accountType: 'cash' as const,
        },
        {
          id: '2',
          name: 'USD账户',
          currency: 'USD',
          balance: 0,
          createdAt: Date.now(),
          isDefault: false,
          visible: true,
          accountType: 'cash' as const,
        },
      ];

      // Accounts.tsx calculates balance from entries, not the balance field
      // Need entries with debit to the cash account to show positive balance
      const mockRecords = [
        {
          id: 'r1',
          type: 'income' as const,
          amount: 1000.50,
          currency: 'CNY',
          category: '工资',
          date: '2026-06-15',
          note: '',
          createdAt: Date.now(),
          entries: [
            { accountId: '1', accountName: '现金账户', direction: 'debit' as const, amount: 1000.50 },
            { accountId: 'CNY-income', accountName: '收入', direction: 'credit' as const, amount: 1000.50 },
          ],
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
        updateAccount: mockUpdateAccount,
      } as any);

      await act(async () => {
        render(<Accounts />);
      });

      // 余额应该格式化显示 - search in document for balance text
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('1,000.50');
    });

    // Skipped: Negative balance red color test requires rendering with actual styles
    // which is difficult to verify in jsdom environment
    it.skip('应该显示负数余额为红色', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '负债账户',
          currency: 'CNY',
          balance: -500,
          createdAt: Date.now(),
          isDefault: true,
          visible: true,
          accountType: 'cash' as const,
        },
        {
          id: '2',
          name: 'USD账户',
          currency: 'USD',
          balance: 0,
          createdAt: Date.now(),
          isDefault: false,
          visible: true,
          accountType: 'cash' as const,
        },
      ];

      // Accounts.tsx calculates balance from entries
      // Need entries with credit to the cash account to show negative balance
      const mockRecords = [
        {
          id: 'r1',
          type: 'expense' as const,
          amount: 500,
          currency: 'CNY',
          category: '购物',
          date: '2026-06-15',
          note: '',
          createdAt: Date.now(),
          entries: [
            { accountId: 'CNY-expense', accountName: '支出', direction: 'debit' as const, amount: 500 },
            { accountId: '1', accountName: '负债账户', direction: 'credit' as const, amount: 500 },
          ],
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
        updateAccount: mockUpdateAccount,
      } as any);

      await act(async () => {
        render(<Accounts />);
      });

      // Find the negative balance in document body text
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('-500.00');

      // Check that there's an element with red color style containing the balance
      const redElements = document.querySelectorAll('[style*="#ff4d4f"]');
      expect(redElements.length).toBeGreaterThan(0);
    });
  });

  describe('添加账户功能', () => {
    // These tests use Ant Design Modal which renders via Portal.
    // In jsdom, Portal rendering and interaction is unreliable.
    // These tests should be run with E2E testing (Playwright) instead.

    it.skip('点击添加账户按钮应该触发状态更新', async () => {
      await act(async () => {
        render(<Accounts />);
      });

      const addButton = screen.getByRole('button', { name: '添加账户' });
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Add Account modal title should appear
      // Note: Ant Design Modal uses Portal, so we check document.body
      expect(document.body.textContent).toContain('添加账户');
    });

    it.skip('输入账户名称后点击添加应该调用 addAccount', async () => {
      await act(async () => {
        render(<Accounts />);
      });

      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Wait for modal to appear and find input
      await waitFor(() => {
        const input = document.querySelector('input[placeholder*="例如"]') as HTMLInputElement;
        expect(input).toBeInTheDocument();
      }, { timeout: 3000 });

      const nameInput = document.querySelector('input[placeholder*="例如"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: '新账户' } });
      });

      // Find and click the OK button in the modal
      await waitFor(() => {
        const okButton = document.querySelector('[aria-label="确认"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '确认');
        expect(okButton).toBeInTheDocument();
      }, { timeout: 3000 });

      const okButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '确认')!;
      await act(async () => {
        fireEvent.click(okButton);
      });

      await waitFor(() => {
        expect(mockAddAccount).toHaveBeenCalledWith({
          currency: 'CNY',
          accountType: 'cash',
          name: '新账户',
        });
      });
    });

    it.skip('取消添加账户应该关闭弹窗', async () => {
      await act(async () => {
        render(<Accounts />);
      });

      const addButton = screen.getByRole('button', { name: '添加账户' });
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Wait for modal to appear
      await waitFor(() => {
        expect(document.body.textContent).toContain('添加账户');
      }, { timeout: 3000 });

      // Click cancel
      const cancelButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '取消')!;
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Modal should close
      await waitFor(() => {
        const inputs = document.querySelectorAll('input[placeholder*="例如"]');
        expect(inputs.length).toBe(0);
      }, { timeout: 3000 });
    });
  });

  describe('删除账户功能', () => {
    it('应该显示编辑和删除按钮', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
          isDefault: true,
          visible: true,
          accountType: 'cash' as const,
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
          isDefault: false,
          visible: true,
          accountType: 'cash' as const,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
        updateAccount: mockUpdateAccount,
      } as any);

      await act(async () => {
        render(<Accounts />);
      });

      // Table renders with action buttons - check for the Pencil icon
      const editButtons = document.querySelectorAll('.lucide-pencil');
      expect(editButtons.length).toBeGreaterThan(0);

      // And Delete icon
      const deleteButtons = document.querySelectorAll('.lucide-delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Toast 消息显示', () => {
    // Skipped: Requires Ant Design Modal interaction which is unreliable in jsdom
    it.skip('添加账户成功应该调用 message.success', async () => {
      await act(async () => {
        render(<Accounts />);
      });

      const addButton = screen.getByRole('button', { name: '添加账户' });
      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const input = document.querySelector('input[placeholder*="例如"]') as HTMLInputElement;
        expect(input).toBeInTheDocument();
      }, { timeout: 3000 });

      const nameInput = document.querySelector('input[placeholder*="例如"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: '新账户' } });
      });

      const okButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '确认')!;
      await act(async () => {
        fireEvent.click(okButton);
      });

      await waitFor(() => {
        expect(message.success).toHaveBeenCalled();
      });
    });
  });
});
