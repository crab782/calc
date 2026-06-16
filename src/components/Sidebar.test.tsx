import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { PageType } from '../types';

// Helper function to render Sidebar with LanguageProvider
const renderSidebar = (
  currentPage: PageType = 'dashboard',
  onPageChange = vi.fn(),
  onCollapse = vi.fn()
) => {
  return render(
    <LanguageProvider>
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        onCollapse={onCollapse}
      />
    </LanguageProvider>
  );
};

describe('Sidebar', () => {
  describe('导航项渲染', () => {
    it('应该渲染所有导航项', () => {
      renderSidebar();

      // 验证所有导航项都存在
      expect(screen.getByText('总览')).toBeInTheDocument();
      expect(screen.getByText('历史')).toBeInTheDocument();
      expect(screen.getByText('账户')).toBeInTheDocument();
      expect(screen.getByText('记账')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该渲染侧边栏标题', () => {
      renderSidebar();

      expect(screen.getByText('记账工具')).toBeInTheDocument();
    });

    it('应该渲染折叠按钮', () => {
      renderSidebar();

      const collapseButton = screen.getByTitle('折叠侧边栏');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('导航项点击事件', () => {
    it('点击导航项应该触发 onPageChange 回调', () => {
      const onPageChange = vi.fn();
      renderSidebar('dashboard', onPageChange);

      // 点击历史导航项
      fireEvent.click(screen.getByText('历史'));
      expect(onPageChange).toHaveBeenCalledWith('history');

      // 点击记账导航项
      fireEvent.click(screen.getByText('记账'));
      expect(onPageChange).toHaveBeenCalledWith('add-record');

      // 点击设置导航项
      fireEvent.click(screen.getByText('设置'));
      expect(onPageChange).toHaveBeenCalledWith('settings');
    });

    it('点击账户导航项应该触发 onPageChange 回调', () => {
      const onPageChange = vi.fn();
      renderSidebar('dashboard', onPageChange);

      fireEvent.click(screen.getByText('账户'));
      expect(onPageChange).toHaveBeenCalledWith('accounts');
    });
  });

  describe('当前页面高亮显示', () => {
    it('当前页面应该有高亮样式', () => {
      renderSidebar('dashboard');

      const dashboardButton = screen.getByText('总览').closest('button');
      expect(dashboardButton).toHaveClass('bg-blue-50', 'text-blue-600', 'font-medium');
    });

    it('非当前页面应该有默认样式', () => {
      renderSidebar('dashboard');

      const historyButton = screen.getByText('历史').closest('button');
      expect(historyButton).toHaveClass('text-gray-600');
      expect(historyButton).not.toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('切换当前页面时高亮应该正确变化', () => {
      const onPageChange = vi.fn();
      const onCollapse = vi.fn();

      const { rerender } = render(
        <LanguageProvider>
          <Sidebar
            currentPage="dashboard"
            onPageChange={onPageChange}
            onCollapse={onCollapse}
          />
        </LanguageProvider>
      );

      // dashboard 页面高亮
      let dashboardButton = screen.getByText('总览').closest('button');
      expect(dashboardButton).toHaveClass('bg-blue-50', 'text-blue-600');

      // 切换到 history 页面
      rerender(
        <LanguageProvider>
          <Sidebar
            currentPage="history"
            onPageChange={onPageChange}
            onCollapse={onCollapse}
          />
        </LanguageProvider>
      );

      // history 页面高亮
      const historyButton = screen.getByText('历史').closest('button');
      expect(historyButton).toHaveClass('bg-blue-50', 'text-blue-600');

      // dashboard 不再高亮
      dashboardButton = screen.getByText('总览').closest('button');
      expect(dashboardButton).not.toHaveClass('bg-blue-50', 'text-blue-600');
    });
  });

  describe('折叠/展开功能', () => {
    it('点击折叠按钮应该触发 onCollapse 回调', () => {
      const onCollapse = vi.fn();
      renderSidebar('dashboard', vi.fn(), onCollapse);

      const collapseButton = screen.getByTitle('折叠侧边栏');
      fireEvent.click(collapseButton);

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('折叠按钮应该有正确的 title 属性', () => {
      renderSidebar('dashboard');

      const collapseButton = screen.getByTitle('折叠侧边栏');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('国际化显示', () => {
    it('应该正确显示中文导航项', () => {
      // 默认语言是中文
      renderSidebar();

      expect(screen.getByText('记账工具')).toBeInTheDocument();
      expect(screen.getByText('总览')).toBeInTheDocument();
      expect(screen.getByText('历史')).toBeInTheDocument();
      expect(screen.getByText('账户')).toBeInTheDocument();
      expect(screen.getByText('记账')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该正确显示英文导航项', () => {
      // 设置 localStorage 为英文
      localStorage.setItem('expense_tracker_language', 'en');

      renderSidebar();

      expect(screen.getByText('Account Book')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      // 注意：账户导航项目前是硬编码的，没有国际化
      expect(screen.getByText('账户')).toBeInTheDocument();
      expect(screen.getByText('Add Record')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('应该正确显示中文折叠按钮提示', () => {
      renderSidebar();

      const collapseButton = screen.getByTitle('折叠侧边栏');
      expect(collapseButton).toBeInTheDocument();
    });

    it('应该正确显示英文折叠按钮提示', () => {
      // 设置 localStorage 为英文
      localStorage.setItem('expense_tracker_language', 'en');

      renderSidebar();

      const collapseButton = screen.getByTitle('Collapse Sidebar');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('图标渲染', () => {
    it('每个导航项应该包含图标', () => {
      renderSidebar();

      // 获取所有导航按钮
      const buttons = screen.getAllByRole('button').filter(
        (btn) => !btn.hasAttribute('title')
      );

      // 每个导航按钮应该包含一个 SVG 图标
      buttons.forEach((button) => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('折叠按钮应该包含 X 图标', () => {
      renderSidebar();

      const collapseButton = screen.getByTitle('折叠侧边栏');
      const svg = collapseButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('样式类', () => {
    it('侧边栏应该有正确的样式类', () => {
      renderSidebar();

      const sidebar = screen.getByText('记账工具').closest('aside');
      expect(sidebar).toHaveClass('w-64', 'bg-white', 'border-r', 'border-gray-200');
    });

    it('导航按钮应该有 hover 效果', () => {
      renderSidebar('dashboard');

      const historyButton = screen.getByText('历史').closest('button');
      expect(historyButton).toHaveClass('hover:bg-gray-50');
    });
  });
});