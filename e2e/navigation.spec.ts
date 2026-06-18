import { test, expect } from '@playwright/test';

test.describe('页面导航流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('应该显示总览页作为默认页面', async ({ page }) => {
    await page.goto('/');

    // 验证侧边栏存在
    await expect(page.locator('aside')).toBeVisible();

    // 验证总览页标题
    await expect(page.getByRole('heading', { name: '总览' })).toBeVisible();
  });

  test('从总览页导航到历史页', async ({ page }) => {
    await page.goto('/');

    // 点击历史菜单
    await page.getByRole('menuitem', { name: '历史' }).click();

    // 验证历史页标题
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();
  });

  test('从历史页导航到账户页', async ({ page }) => {
    await page.goto('/');

    // 先导航到历史页
    await page.getByRole('menuitem', { name: '历史' }).click();

    // 再导航到账户页
    await page.getByRole('menuitem', { name: '账户' }).click();

    // 验证账户页标题
    await expect(page.getByRole('heading', { name: '账户管理' })).toBeVisible();
  });

  test('从账户页导航到记账页', async ({ page }) => {
    await page.goto('/');

    // 导航到账户页
    await page.getByRole('menuitem', { name: '账户' }).click();

    // 再导航到记账页
    await page.getByRole('menuitem', { name: '记账' }).click();

    // 验证记账页标题（Title level={4} 创建 h4）
    await expect(page.locator('h4', { hasText: '添加记账记录' })).toBeVisible();
  });

  test('从记账页导航到设置页', async ({ page }) => {
    await page.goto('/');

    // 导航到记账页
    await page.getByRole('menuitem', { name: '记账' }).click();

    // 再导航到设置页
    await page.getByRole('menuitem', { name: '设置' }).click();

    // 验证设置页标题
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
  });

  test('侧边栏折叠功能', async ({ page }) => {
    await page.goto('/');

    // 验证侧边栏初始状态为展开
    await expect(page.locator('aside')).toBeVisible();

    // 点击折叠按钮（X 图标按钮）
    await page.locator('aside button[title*="折叠"]').click();

    // 等待侧边栏折叠消失
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('侧边栏展开功能', async ({ page }) => {
    await page.goto('/');

    // 先折叠侧边栏
    await page.locator('aside button[title*="折叠"]').click();
    await expect(page.locator('aside')).not.toBeVisible();

    // 点击展开按钮 (fixed position primary button)
    await page.locator('button[style*="position: fixed"]').click();

    // 等待侧边栏展开
    await expect(page.locator('aside')).toBeVisible();
  });

  test('侧边栏菜单项高亮当前页面', async ({ page }) => {
    await page.goto('/');

    // 验证总览菜单高亮
    const dashboardButton = page.getByRole('menuitem', { name: '总览' });
    await expect(dashboardButton).toHaveClass(/ant-menu-item-selected/);

    // 导航到历史页
    await page.getByRole('menuitem', { name: '历史' }).click();

    // 验证历史菜单高亮
    const historyButton = page.getByRole('menuitem', { name: '历史' });
    await expect(historyButton).toHaveClass(/ant-menu-item-selected/);

    // 验证总览菜单不再高亮
    await expect(dashboardButton).not.toHaveClass(/ant-menu-item-selected/);
  });

  test('完整导航流程：依次访问所有页面', async ({ page }) => {
    await page.goto('/');

    // 总览页
    await expect(page.getByRole('heading', { name: '总览' })).toBeVisible();

    // 历史页
    await page.getByRole('menuitem', { name: '历史' }).click();
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();

    // 账户页
    await page.getByRole('menuitem', { name: '账户' }).click();
    await expect(page.getByRole('heading', { name: '账户管理' })).toBeVisible();

    // 财务配置页
    await page.getByRole('menuitem', { name: '财务配置' }).click();
    await expect(page.getByRole('heading', { name: '财务配置' })).toBeVisible();

    // 预算计划页
    await page.getByRole('menuitem', { name: '预算计划' }).click();
    await expect(page.getByRole('heading', { name: '预算计划' })).toBeVisible();

    // 记账页（使用 h4 选择器）
    await page.getByRole('menuitem', { name: '记账' }).click();
    await expect(page.locator('h4', { hasText: '添加记账记录' })).toBeVisible();

    // 设置页
    await page.getByRole('menuitem', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();

    // 返回总览页
    await page.getByRole('menuitem', { name: '总览' }).click();
    await expect(page.getByRole('heading', { name: '总览' })).toBeVisible();
  });
});
