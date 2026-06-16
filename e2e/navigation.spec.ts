import { test, expect } from '@playwright/test';

test.describe('页面导航流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前清空 localStorage 并访问首页
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('应该显示总览页作为默认页面', async ({ page }) => {
    await page.goto('/');
    
    // 验证侧边栏存在
    await expect(page.locator('aside')).toBeVisible();
    
    // 验证总览页标题
    await expect(page.getByRole('heading', { name: /总览|Dashboard/i })).toBeVisible();
  });

  test('从总览页导航到历史页', async ({ page }) => {
    await page.goto('/');
    
    // 点击历史菜单
    await page.getByRole('button', { name: /历史|History/i }).click();
    
    // 验证历史页标题
    await expect(page.getByRole('heading', { name: /历史|History/i })).toBeVisible();
  });

  test('从历史页导航到账户页', async ({ page }) => {
    await page.goto('/');
    
    // 先导航到历史页
    await page.getByRole('button', { name: /历史|History/i }).click();
    
    // 再导航到账户页
    await page.getByRole('button', { name: /账户/i }).click();
    
    // 验证账户页标题
    await expect(page.getByRole('heading', { name: /账户管理/i })).toBeVisible();
  });

  test('从账户页导航到记账页', async ({ page }) => {
    await page.goto('/');
    
    // 导航到账户页
    await page.getByRole('button', { name: /账户/i }).click();
    
    // 再导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 验证记账页标题
    await expect(page.getByRole('heading', { name: /记账|Add Record/i })).toBeVisible();
  });

  test('从记账页导航到设置页', async ({ page }) => {
    await page.goto('/');
    
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 再导航到设置页
    await page.getByRole('button', { name: /设置|Settings/i }).click();
    
    // 验证设置页标题
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible();
  });

  test('侧边栏折叠功能', async ({ page }) => {
    await page.goto('/');
    
    // 验证侧边栏初始状态为展开
    await expect(page.locator('aside')).toBeVisible();
    
    // 点击折叠按钮（X 图标）
    await page.locator('aside button[title*="折叠"]').click();
    
    // 验证侧边栏已折叠
    await expect(page.locator('aside')).not.toBeVisible();
    
    // 验证展开按钮出现
    await expect(page.locator('button[title="展开侧边栏"]')).toBeVisible();
  });

  test('侧边栏展开功能', async ({ page }) => {
    await page.goto('/');
    
    // 先折叠侧边栏
    await page.locator('aside button[title*="折叠"]').click();
    await expect(page.locator('aside')).not.toBeVisible();
    
    // 点击展开按钮
    await page.locator('button[title="展开侧边栏"]').click();
    
    // 验证侧边栏已展开
    await expect(page.locator('aside')).toBeVisible();
  });

  test('侧边栏菜单项高亮当前页面', async ({ page }) => {
    await page.goto('/');
    
    // 验证总览菜单高亮
    const dashboardButton = page.getByRole('button', { name: /总览|Dashboard/i });
    await expect(dashboardButton).toHaveClass(/bg-blue-50/);
    
    // 导航到历史页
    await page.getByRole('button', { name: /历史|History/i }).click();
    
    // 验证历史菜单高亮
    const historyButton = page.getByRole('button', { name: /历史|History/i });
    await expect(historyButton).toHaveClass(/bg-blue-50/);
    
    // 验证总览菜单不再高亮
    await expect(dashboardButton).not.toHaveClass(/bg-blue-50/);
  });

  test('完整导航流程：依次访问所有页面', async ({ page }) => {
    await page.goto('/');
    
    // 总览页
    await expect(page.getByRole('heading', { name: /总览|Dashboard/i })).toBeVisible();
    
    // 历史页
    await page.getByRole('button', { name: /历史|History/i }).click();
    await expect(page.getByRole('heading', { name: /历史|History/i })).toBeVisible();
    
    // 账户页
    await page.getByRole('button', { name: /账户/i }).click();
    await expect(page.getByRole('heading', { name: /账户管理/i })).toBeVisible();
    
    // 记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await expect(page.getByRole('heading', { name: /记账|Add Record/i })).toBeVisible();
    
    // 设置页
    await page.getByRole('button', { name: /设置|Settings/i }).click();
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible();
    
    // 返回总览页
    await page.getByRole('button', { name: /总览|Dashboard/i }).click();
    await expect(page.getByRole('heading', { name: /总览|Dashboard/i })).toBeVisible();
  });
});