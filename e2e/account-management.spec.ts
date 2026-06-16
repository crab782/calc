import { test, expect } from '@playwright/test';

test.describe('账户管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前清空 localStorage 并访问首页
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // 导航到账户页
    await page.getByRole('button', { name: /账户/i }).click();
  });

  test('添加账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: /添加账户/i }).click();
    
    // 验证弹窗出现
    await expect(page.getByRole('heading', { name: /添加账户/i })).toBeVisible();
    
    // 输入账户名称
    await page.locator('input[placeholder*="账户名称"]').fill('我的银行卡');
    
    // 选择币种
    await page.locator('select').selectOption({ label: 'CNY (¥)' });
    
    // 点击添加按钮
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    // 验证成功提示
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证新账户显示在列表中
    await expect(page.getByText('我的银行卡')).toBeVisible();
    await expect(page.getByText('CNY')).toBeVisible();
    
    // 验证 localStorage 中有新账户
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });
    
    expect(localStorageData.accounts).toHaveLength(1);
    expect(localStorageData.accounts[0].name).toBe('我的银行卡');
    expect(localStorageData.accounts[0].currency).toBe('CNY');
  });

  test('添加不同币种的账户', async ({ page }) => {
    // 添加 USD 账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('美元账户');
    await page.locator('select').selectOption({ label: 'USD ($)' });
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 添加 EUR 账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('欧元账户');
    await page.locator('select').selectOption({ label: 'EUR (€)' });
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证两个账户都显示
    await expect(page.getByText('美元账户')).toBeVisible();
    await expect(page.getByText('USD')).toBeVisible();
    await expect(page.getByText('欧元账户')).toBeVisible();
    await expect(page.getByText('EUR')).toBeVisible();
  });

  test('删除账户', async ({ page }) => {
    // 先添加一个账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('测试账户');
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证账户存在
    await expect(page.getByText('测试账户')).toBeVisible();
    
    // 点击删除按钮
    const accountCard = page.locator('div', { hasText: '测试账户' }).filter({ hasText: '测试账户' }).first();
    await accountCard.locator('button').last().click();
    
    // 验证确认弹窗出现
    await expect(page.getByRole('heading', { name: /删除账户/i })).toBeVisible();
    
    // 确认删除
    await page.getByRole('button', { name: /^删除$/i }).last().click();
    
    // 验证成功提示
    await expect(page.getByText(/删除成功|success/i)).toBeVisible();
    
    // 验证账户已删除
    await expect(page.getByText('测试账户')).not.toBeVisible();
  });

  test('至少保留一个账户的验证', async ({ page }) => {
    // 先添加一个账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('唯一账户');
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 尝试删除唯一账户
    const accountCard = page.locator('div', { hasText: '唯一账户' }).filter({ hasText: '唯一账户' }).first();
    await accountCard.locator('button').last().click();
    
    // 确认删除
    await page.getByRole('button', { name: /^删除$/i }).last().click();
    
    // 验证错误提示（至少保留一个账户）
    await expect(page.getByText(/至少|至少保留一个|cannot delete/i)).toBeVisible();
    
    // 验证账户仍然存在
    await expect(page.getByText('唯一账户')).toBeVisible();
  });

  test('账户列表显示', async ({ page }) => {
    // 添加多个账户
    const accounts = [
      { name: '现金账户', currency: 'CNY' },
      { name: '储蓄卡', currency: 'CNY' },
      { name: '信用卡', currency: 'USD' },
    ];
    
    for (const account of accounts) {
      await page.getByRole('button', { name: /添加账户/i }).click();
      await page.locator('input[placeholder*="账户名称"]').fill(account.name);
      if (account.currency !== 'CNY') {
        await page.locator('select').selectOption({ label: `${account.currency} ($)` });
      }
      await page.getByRole('button', { name: /^添加$/i }).click();
      await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    }
    
    // 验证所有账户显示
    await expect(page.getByText('现金账户')).toBeVisible();
    await expect(page.getByText('储蓄卡')).toBeVisible();
    await expect(page.getByText('信用卡')).toBeVisible();
    
    // 验证账户数量
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });
    
    expect(localStorageData.accounts).toHaveLength(3);
  });

  test('取消添加账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: /添加账户/i }).click();
    
    // 输入账户名称
    await page.locator('input[placeholder*="账户名称"]').fill('测试取消');
    
    // 点击取消按钮
    await page.getByRole('button', { name: /取消/i }).click();
    
    // 验证弹窗关闭
    await expect(page.getByRole('heading', { name: /添加账户/i })).not.toBeVisible();
    
    // 验证账户未添加
    await expect(page.getByText('测试取消')).not.toBeVisible();
  });

  test('空账户名称验证', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: /添加账户/i }).click();
    
    // 验证添加按钮初始禁用状态
    await expect(page.getByRole('button', { name: /^添加$/i })).toBeDisabled();
    
    // 输入空格
    await page.locator('input[placeholder*="账户名称"]').fill('   ');
    
    // 验证添加按钮仍然禁用
    await expect(page.getByRole('button', { name: /^添加$/i })).toBeDisabled();
    
    // 输入有效名称
    await page.locator('input[placeholder*="账户名称"]').fill('有效账户');
    
    // 验证添加按钮启用
    await expect(page.getByRole('button', { name: /^添加$/i })).toBeEnabled();
  });

  test('按 Enter 键提交账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: /添加账户/i }).click();
    
    // 输入账户名称
    const input = page.locator('input[placeholder*="账户名称"]');
    await input.fill('快捷账户');
    
    // 按 Enter 键
    await input.press('Enter');
    
    // 验证成功提示
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证新账户显示在列表中
    await expect(page.getByText('快捷账户')).toBeVisible();
  });

  test('账户余额显示', async ({ page }) => {
    // 添加账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('余额测试账户');
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证初始余额为 0
    await expect(page.getByText('¥0.00')).toBeVisible();
  });

  test('空账户列表提示', async ({ page }) => {
    // 清空所有账户
    await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      if (data) {
        const parsed = JSON.parse(data);
        parsed.accounts = [];
        localStorage.setItem('expense_tracker_data', JSON.stringify(parsed));
      }
    });
    
    // 刷新页面
    await page.reload();
    
    // 验证空状态提示
    await expect(page.getByText(/暂无账户|No accounts/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /添加账户/i })).toBeVisible();
  });

  test('账户数据持久化', async ({ page }) => {
    // 添加账户
    await page.getByRole('button', { name: /添加账户/i }).click();
    await page.locator('input[placeholder*="账户名称"]').fill('持久化测试账户');
    await page.getByRole('button', { name: /^添加$/i }).click();
    
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 刷新页面
    await page.reload();
    
    // 验证账户仍然存在
    await expect(page.getByText('持久化测试账户')).toBeVisible();
  });
});