import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Accounts } from './Accounts';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../hooks/useRecords');

describe('Accounts', () => {
  const mockAddAccount = vi.fn(() => ({
    id: 'test-account',
    name: '测试账户',
    currency: 'CNY',
    balance: 0,
    createdAt: Date.now(),
  }));
  const mockDeleteAccount = vi.fn(() => ({ success: true, message: '' }));

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
      },
    },
    toggleLanguage: vi.fn(),
  };

  const defaultRecordsMock = {
    records: [],
    accounts: [],
    addAccount: mockAddAccount,
    deleteAccount: mockDeleteAccount,
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
    it('应该显示账户列表', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      expect(screen.getByText('现金账户')).toBeInTheDocument();
      expect(screen.getByText('银行账户')).toBeInTheDocument();
    });

    it('应该显示账户币种', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      expect(screen.getByText('CNY')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('应该显示账户余额', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000.50,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'USD账户',
          currency: 'USD',
          balance: 0,
          createdAt: Date.now(),
        },
      ];

      const mockRecords = [
        { id: 'r1', type: 'income', amount: 1000.50, currency: 'CNY', category: '工资', date: '2026-06-15', note: '', createdAt: Date.now() },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      expect(screen.getAllByText('余额').length).toBeGreaterThan(0);
      // 余额应该格式化显示
      expect(screen.getByText('¥1,000.50')).toBeInTheDocument();
    });

    it('应该显示负数余额为红色', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '负债账户',
          currency: 'CNY',
          balance: -500,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'USD账户',
          currency: 'USD',
          balance: 0,
          createdAt: Date.now(),
        },
      ];

      const mockRecords = [
        { id: 'r1', type: 'expense', amount: 500, currency: 'CNY', category: '购物', date: '2026-06-15', note: '', createdAt: Date.now() },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 使用正则表达式匹配余额文本
      const balanceElement = screen.getByText(/¥-500\.00/);
      expect(balanceElement).toHaveClass('text-red-500');
    });
  });

  describe('添加账户功能', () => {
    it('点击添加账户按钮应该显示弹窗', () => {
      render(<Accounts />);
      
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 弹窗标题
      expect(screen.getByRole('heading', { name: '添加账户' })).toBeInTheDocument();
      expect(screen.getByText('账户名称')).toBeInTheDocument();
      expect(screen.getByText('币种')).toBeInTheDocument();
    });

    it('弹窗应该包含账户名称输入框', () => {
      render(<Accounts />);
      
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      expect(screen.getByPlaceholderText('请输入账户名称')).toBeInTheDocument();
    });

    it('弹窗应该包含币种选择框', () => {
      render(<Accounts />);
      
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 应该显示币种选项
      expect(screen.getByText('CNY (¥)')).toBeInTheDocument();
      expect(screen.getByText('USD ($)')).toBeInTheDocument();
      expect(screen.getByText('EUR (€)')).toBeInTheDocument();
    });

    it('输入账户名称后点击添加应该调用 addAccount', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '新账户' } });
      
      // 点击添加按钮
      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);
      
      expect(mockAddAccount).toHaveBeenCalledWith({
        name: '新账户',
        currency: 'CNY',
        balance: 0,
      });
    });

    it('可以选择不同的币种', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '美元账户' } });
      
      // 选择 USD 币种
      const currencySelect = screen.getByRole('combobox');
      fireEvent.change(currencySelect, { target: { value: 'USD' } });
      
      // 点击添加按钮
      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);
      
      expect(mockAddAccount).toHaveBeenCalledWith({
        name: '美元账户',
        currency: 'USD',
        balance: 0,
      });
    });

    it('当账户名称为空时添加按钮应该禁用', () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 不输入账户名称
      const confirmButton = screen.getByRole('button', { name: '确认' });
      expect(confirmButton).toBeDisabled();
    });

    it('取消添加账户应该关闭弹窗', () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 点击取消按钮
      const cancelButton = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelButton);
      
      // 弹窗应该关闭
      expect(screen.queryByPlaceholderText('请输入账户名称')).not.toBeInTheDocument();
    });

    it('按 Enter 键应该提交表单', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '新账户' } });
      
      // 按 Enter 键
      fireEvent.keyDown(nameInput, { key: 'Enter' });
      
      expect(mockAddAccount).toHaveBeenCalled();
    });
  });

  describe('删除账户功能', () => {
    it('应该显示删除按钮', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: '银行账户',
          currency: 'USD',
          balance: 500,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 应该有删除按钮（X 图标）
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      expect(deleteButton).toBeDefined();
    });

    it('点击删除按钮应该显示确认弹窗', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 确认弹窗应该显示
        expect(screen.getByText('删除后无法恢复，确定要删除这个账户吗？')).toBeInTheDocument();
      }
    });

    it('在确认弹窗中点击删除应该调用 deleteAccount', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 点击确认删除按钮 (dialog 中的红色删除按钮是第二个)
        const dialogDeleteButton = screen.getByRole('button', { name: '删除' });
        fireEvent.click(dialogDeleteButton);
        
        expect(mockDeleteAccount).toHaveBeenCalledWith('1');
      }
    });

    it('取消删除应该关闭弹窗', () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 点击取消按钮
        const cancelButton = screen.getByRole('button', { name: '取消' });
        fireEvent.click(cancelButton);
        
        // 弹窗应该关闭
        expect(screen.queryByText('删除账户')).not.toBeInTheDocument();
      }
    });
  });

  describe('Toast 消息显示', () => {
    it('添加账户成功应该显示成功消息', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '新账户' } });
      
      // 点击添加按钮
      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('账户添加成功')).toBeInTheDocument();
      });
    });

    it('删除账户成功应该显示成功消息', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: '现金账户',
          currency: 'CNY',
          balance: 1000,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: mockAccounts,
        addAccount: mockAddAccount,
        deleteAccount: mockDeleteAccount,
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 点击确认删除按钮 (dialog 中的红色删除按钮是第二个)
        const dialogDeleteButton = screen.getByRole('button', { name: '删除' });
        fireEvent.click(dialogDeleteButton);
        
        await waitFor(() => {
          expect(screen.getByText('账户删除成功')).toBeInTheDocument();
        });
      }
    });

    it('成功消息应该显示绿色样式', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '新账户' } });
      
      // 点击添加按钮
      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const toast = screen.getByText('账户添加成功');
        expect(toast.closest('div')).toHaveClass('bg-green-500');
      });
    });

    it('消息应该包含成功图标', async () => {
      render(<Accounts />);
      
      // 打开添加账户弹窗
      const addButton = screen.getByRole('button', { name: '添加账户' });
      fireEvent.click(addButton);
      
      // 输入账户名称
      const nameInput = screen.getByPlaceholderText('请输入账户名称');
      fireEvent.change(nameInput, { target: { value: '新账户' } });
      
      // 点击添加按钮
      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const successIcon = document.querySelector('.lucide-circle-check-big');
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('删除失败应该显示错误消息', async () => {
      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: [
          {
            id: '1',
            name: '现金账户',
            currency: 'CNY',
            balance: 1000,
            createdAt: Date.now(),
          },
        ],
        addAccount: mockAddAccount,
        deleteAccount: vi.fn(() => ({ success: false, message: '删除失败：账户正在使用中' })),
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 点击确认删除按钮 (dialog 中的红色删除按钮)
        const dialogDeleteButton = screen.getByRole('button', { name: '删除' });
        fireEvent.click(dialogDeleteButton);
        
        await waitFor(() => {
          expect(screen.getByText('删除失败：账户正在使用中')).toBeInTheDocument();
        });
      }
    });

    it('错误消息应该显示红色样式', async () => {
      vi.mocked(useRecords).mockReturnValue({
        records: [],
        accounts: [
          {
            id: '1',
            name: '现金账户',
            currency: 'CNY',
            balance: 1000,
            createdAt: Date.now(),
          },
        ],
        addAccount: mockAddAccount,
        deleteAccount: vi.fn(() => ({ success: false, message: '删除失败' })),
      } as any);

      render(<Accounts />);
      
      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        // 点击确认删除按钮 (dialog 中的红色删除按钮)
        const dialogDeleteButton = screen.getByRole('button', { name: '删除' });
        fireEvent.click(dialogDeleteButton);
        
        await waitFor(() => {
          const toast = screen.getByText('删除失败');
          expect(toast.closest('div')).toHaveClass('bg-red-500');
        });
      }
    });
  });
});