import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LanguageProvider } from '../contexts/LanguageContext';

const renderSidebar = (onCollapse = vi.fn()) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LanguageProvider>
        <Sidebar onCollapse={onCollapse} />
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  describe('导航项渲染', () => {
    it('应该渲染所有导航项', () => {
      renderSidebar();

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

  describe('当前页面高亮显示', () => {
    it('首页应该显示在总览页面', () => {
      renderSidebar();
      const dashboardItem = screen.getByText('总览').closest('li');
      expect(dashboardItem).toHaveClass('ant-menu-item-selected');
    });

    it('导航到历史页面应该高亮历史菜单', () => {
      render(
        <MemoryRouter initialEntries={['/history']}>
          <LanguageProvider>
            <Sidebar onCollapse={vi.fn()} />
          </LanguageProvider>
        </MemoryRouter>
      );
      const historyItem = screen.getByText('历史').closest('li');
      expect(historyItem).toHaveClass('ant-menu-item-selected');
    });
  });

  describe('折叠功能', () => {
    it('点击折叠按钮应该触发 onCollapse 回调', () => {
      const onCollapse = vi.fn();
      renderSidebar(onCollapse);

      const collapseButton = screen.getByTitle('折叠侧边栏');
      fireEvent.click(collapseButton);

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('折叠按钮应该有正确的 title 属性', () => {
      renderSidebar();

      const collapseButton = screen.getByTitle('折叠侧边栏');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('国际化显示', () => {
    it('应该正确显示中文导航项', () => {
      renderSidebar();

      expect(screen.getByText('记账工具')).toBeInTheDocument();
      expect(screen.getByText('总览')).toBeInTheDocument();
      expect(screen.getByText('历史')).toBeInTheDocument();
      expect(screen.getByText('账户')).toBeInTheDocument();
      expect(screen.getByText('记账')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该正确显示英文导航项', () => {
      localStorage.setItem('expense_tracker_language', 'en');

      renderSidebar();

      expect(screen.getByText('Account Book')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Add Record')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('应该正确显示中文折叠按钮提示', () => {
      renderSidebar();

      const collapseButton = screen.getByTitle('折叠侧边栏');
      expect(collapseButton).toBeInTheDocument();
    });

    it('应该正确显示英文折叠按钮提示', () => {
      localStorage.setItem('expense_tracker_language', 'en');

      renderSidebar();

      const collapseButton = screen.getByTitle('Collapse Sidebar');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('图标渲染', () => {
    it('每个导航项应该包含图标', () => {
      renderSidebar();

      const menuItems = document.querySelectorAll('.ant-menu-item');
      menuItems.forEach((item) => {
        const svg = item.querySelector('svg');
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
});
