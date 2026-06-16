import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddRecord } from './AddRecord';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../hooks/useRecords');

describe('AddRecord', () => {
  const mockAddRecord = vi.fn();

  const defaultLanguageMock = {
    language: 'zh' as const,
    t: {
      addRecord: {
        title: '添加记账记录',
        type: '类型',
        income: '收入',
        expense: '支出',
        amount: '金额',
        category: '分类',
        selectCategory: '请选择分类',
        date: '日期',
        note: '备注',
        notePlaceholder: '添加备注（可选）',
        addRecord: '添加记录',
        saved: '保存成功',
      },
    },
    toggleLanguage: vi.fn(),
  };

  const defaultRecordsMock = {
    addRecord: mockAddRecord,
    incomeCategories: [
      { id: 'inc-salary', name: '工资', type: 'income' as const, icon: 'briefcase' },
      { id: 'inc-bonus', name: '奖金', type: 'income' as const, icon: 'gift' },
    ],
    expenseCategories: [
      { id: 'exp-food', name: '餐饮', type: 'expense' as const, icon: 'utensils' },
      { id: 'exp-transport', name: '交通', type: 'expense' as const, icon: 'car' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLanguage).mockReturnValue(defaultLanguageMock as any);
    vi.mocked(useRecords).mockReturnValue(defaultRecordsMock as any);
  });

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', () => {
      render(<AddRecord />);
      expect(screen.getByText('添加记账记录')).toBeInTheDocument();
    });

    it('应该渲染类型选择按钮', () => {
      render(<AddRecord />);
      expect(screen.getByText('收入')).toBeInTheDocument();
      expect(screen.getByText('支出')).toBeInTheDocument();
    });

    it('应该渲染金额输入框', () => {
      render(<AddRecord />);
      expect(screen.getByText('金额')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('应该渲染分类选择框', () => {
      render(<AddRecord />);
      expect(screen.getByText('分类')).toBeInTheDocument();
      expect(screen.getByText('请选择分类')).toBeInTheDocument();
    });

    it('应该渲染日期选择框', () => {
      render(<AddRecord />);
      expect(screen.getByText('日期')).toBeInTheDocument();
    });

    it('应该渲染备注输入框', () => {
      render(<AddRecord />);
      expect(screen.getByText('备注')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('添加备注（可选）')).toBeInTheDocument();
    });

    it('应该渲染提交按钮', () => {
      render(<AddRecord />);
      expect(screen.getByText('添加记录')).toBeInTheDocument();
    });
  });

  describe('类型切换', () => {
    it('默认应该选中支出类型', () => {
      render(<AddRecord />);
      const expenseButton = screen.getByRole('button', { name: '支出' });
      expect(expenseButton).toHaveClass('border-red-500');
    });

    it('点击收入按钮应该切换到收入类型', () => {
      render(<AddRecord />);
      const incomeButton = screen.getByRole('button', { name: '收入' });
      fireEvent.click(incomeButton);
      expect(incomeButton).toHaveClass('border-green-500');
    });

    it('切换类型后应该显示对应的分类选项', async () => {
      render(<AddRecord />);
      
      // 默认支出类型，显示支出分类
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      expect(screen.getByText('餐饮')).toBeInTheDocument();
      expect(screen.getByText('交通')).toBeInTheDocument();

      // 切换到收入类型
      const incomeButton = screen.getByRole('button', { name: '收入' });
      fireEvent.click(incomeButton);
      
      // 应该显示收入分类
      expect(screen.getByText('工资')).toBeInTheDocument();
      expect(screen.getByText('奖金')).toBeInTheDocument();
    });
  });

  describe('表单输入', () => {
    it('应该能够输入金额', () => {
      render(<AddRecord />);
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100.50' } });
      expect(amountInput).toHaveValue(100.50);
    });

    it('应该能够选择分类', () => {
      render(<AddRecord />);
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '餐饮' } });
      expect(categorySelect).toHaveValue('餐饮');
    });

    it('应该能够输入备注', () => {
      render(<AddRecord />);
      const noteTextarea = screen.getByPlaceholderText('添加备注（可选）');
      fireEvent.change(noteTextarea, { target: { value: '午餐费用' } });
      expect(noteTextarea).toHaveValue('午餐费用');
    });

    it('应该能够选择日期', () => {
      render(<AddRecord />);
      const dateInput = screen.getByRole('textbox', { name: '' }) || 
        document.querySelector('input[type="date"]');
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
        expect(dateInput).toHaveValue('2024-01-15');
      }
    });
  });

  describe('表单验证', () => {
    it('当金额为空时提交按钮应该禁用', () => {
      render(<AddRecord />);
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      expect(submitButton).toBeDisabled();
    });

    it('当金额为零时提交按钮应该禁用', () => {
      render(<AddRecord />);
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '0' } });
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      expect(submitButton).toBeDisabled();
    });

    it('当分类未选择时提交按钮应该禁用', () => {
      render(<AddRecord />);
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      expect(submitButton).toBeDisabled();
    });

    it('当金额和分类都有效时提交按钮应该可用', () => {
      render(<AddRecord />);
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '餐饮' } });
      
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('提交表单', () => {
    it('提交有效表单应该调用 addRecord', async () => {
      render(<AddRecord />);
      
      // 填写表单
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100.50' } });
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '餐饮' } });
      
      const noteTextarea = screen.getByPlaceholderText('添加备注（可选）');
      fireEvent.change(noteTextarea, { target: { value: '午餐' } });
      
      const dateInput = document.querySelector('input[type="date"]');
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      }
      
      // 提交表单
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      fireEvent.click(submitButton);
      
      expect(mockAddRecord).toHaveBeenCalledWith({
        type: 'expense',
        amount: 100.50,
        category: '餐饮',
        note: '午餐',
        date: '2024-01-15',
      });
    });

    it('提交后应该显示成功状态', async () => {
      render(<AddRecord />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '餐饮' } });
      
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      fireEvent.click(submitButton);
      
      // 应该显示"保存成功"
      await waitFor(() => {
        expect(screen.getByText('保存成功')).toBeInTheDocument();
      });
    });

    it('提交后应该清空表单', async () => {
      render(<AddRecord />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '餐饮' } });
      
      const noteTextarea = screen.getByPlaceholderText('添加备注（可选）');
      fireEvent.change(noteTextarea, { target: { value: '午餐' } });
      
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(amountInput).toHaveValue(null);
        expect(categorySelect).toHaveValue('');
        expect(noteTextarea).toHaveValue('');
      });
    });

    it('提交收入类型记录应该正确传递类型', async () => {
      render(<AddRecord />);
      
      // 切换到收入类型
      const incomeButton = screen.getByRole('button', { name: '收入' });
      fireEvent.click(incomeButton);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '5000' } });
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '工资' } });
      
      const submitButton = screen.getByRole('button', { name: '添加记录' });
      fireEvent.click(submitButton);
      
      expect(mockAddRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          amount: 5000,
          category: '工资',
        })
      );
    });
  });
});