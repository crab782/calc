import { test, expect } from '@playwright/test';

test.describe('分类管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前清空 localStorage 并访问首页
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // 导航到设置页
    await page.getByRole('button', { name: /设置|Settings/i }).click();
  });

  test('添加收入分类', async ({ page }) => {
    // 点击添加收入分类按钮
    await page.getByRole('button', { name: /添加收入分类|Add Income Category/i }).click();
    
    // 验证弹窗出现
    await expect(page.getByRole('heading', { name: /添加收入分类/i })).toBeVisible();
    
    // 输入分类名称
    await page.locator('input[placeholder*="分类名称"]').fill('股票分红');
    
    // 点击添加按钮
    await page.getByRole('button', { name: /^添加收入分类$/i }).click();
    
    // 验证成功提示
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证新分类显示在列表中
    await expect(page.getByText('股票分红')).toBeVisible();
    
    // 验证 localStorage 中有新分类
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });
    
    const incomeCategories = localStorageData.categories.filter(
      (c: { type: string }) => c.type === 'income'
    );
    expect(incomeCategories.some((c: { name: string }) => c.name === '股票分红')).toBeTruthy();
  });

  test('添加支出分类', async ({ page }) => {
    // 点击添加支出分类按钮
    await page.getByRole('button', { name: /添加支出分类|Add Expense Category/i }).click();
    
    // 验证弹窗出现
    await expect(page.getByRole('heading', { name: /添加支出分类/i })).toBeVisible();
    
    // 输入分类名称
    await page.locator('input[placeholder*="分类名称"]').fill('宠物用品');
    
    // 点击添加按钮
    await page.getByRole('button', { name: /^添加支出分类$/i }).click();
    
    // 验证成功提示
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证新分类显示在列表中
    await expect(page.getByText('宠物用品')).toBeVisible();
    
    // 验证 localStorage 中有新分类
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });
    
    const expenseCategories = localStorageData.categories.filter(
      (c: { type: string }) => c.type === 'expense'
    );
    expect(expenseCategories.some((c: { name: string }) => c.name === '宠物用品')).toBeTruthy();
  });

  test('删除分类', async ({ page }) => {
    // 先添加一个测试分类
    await page.getByRole('button', { name: /添加支出分类|Add Expense Category/i }).click();
    await page.locator('input[placeholder*="分类名称"]').fill('测试分类');
    await page.getByRole('button', { name: /^添加支出分类$/i }).click();
    
    // 等待成功提示消失
    await expect(page.getByText(/添加成功|success/i)).not.toBeVisible();
    
    // 验证分类存在
    await expect(page.getByText('测试分类')).toBeVisible();
    
    // 点击删除按钮
    const categoryItem = page.locator('div', { hasText: '测试分类' }).filter({ hasText: '测试分类' }).first();
    await categoryItem.locator('button').last().click();
    
    // 验证确认弹窗出现
    await expect(page.getByRole('heading', { name: /删除分类/i })).toBeVisible();
    
    // 确认删除
    await page.getByRole('button', { name: /删除|确认/i }).last().click();
    
    // 验证成功提示
    await expect(page.getByText(/删除成功|success/i)).toBeVisible();
    
    // 验证分类已删除
    await expect(page.getByText('测试分类')).not.toBeVisible();
  });

  test('分类显示验证 - 默认分类', async ({ page }) => {
    // 验证默认收入分类存在
    const incomeCategories = ['工资', '奖金', '投资收益', '兼职', '其他收入'];
    for (const category of incomeCategories) {
      await expect(page.getByText(category)).toBeVisible();
    }
    
    // 验证默认支出分类存在
    const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '房租', '水电费', '其他支出'];
    for (const category of expenseCategories) {
      await expect(page.getByText(category)).toBeVisible();
    }
  });

  test('分类在记账页面可用', async ({ page }) => {
    // 添加一个新分类
    await page.getByRole('button', { name: /添加收入分类|Add Income Category/i }).click();
    await page.locator('input[placeholder*="分类名称"]').fill('理财收益');
    await page.getByRole('button', { name: /^添加收入分类$/i }).click();
    
    // 等待成功提示消失
    await expect(page.getByText(/添加成功|success/i)).not.toBeVisible();
    
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 选择收入类型
    await page.getByRole('button', { name: /收入|Income/i }).click();
    
    // 打开分类下拉框
    await page.locator('select').click();
    
    // 验证新分类在选项中
    await expect(page.getByRole('option', { name: '理财收益' })).toBeVisible();
  });

  test('取消添加分类', async ({ page }) => {
    // 点击添加收入分类按钮
    await page.getByRole('button', { name: /添加收入分类|Add Income Category/i }).click();
    
    // 输入分类名称
    await page.locator('input[placeholder*="分类名称"]').fill('测试取消');
    
    // 点击取消按钮
    await page.getByRole('button', { name: /取消/i }).click();
    
    // 验证弹窗关闭
    await expect(page.getByRole('heading', { name: /添加收入分类/i })).not.toBeVisible();
    
    // 验证分类未添加
    await expect(page.getByText('测试取消')).not.toBeVisible();
  });

  test('空分类名称验证', async ({ page }) => {
    // 点击添加收入分类按钮
    await page.getByRole('button', { name: /添加收入分类|Add Income Category/i }).click();
    
    // 验证添加按钮初始禁用状态
    await expect(page.getByRole('button', { name: /^添加收入分类$/i })).toBeDisabled();
    
    // 输入空格
    await page.locator('input[placeholder*="分类名称"]').fill('   ');
    
    // 验证添加按钮仍然禁用
    await expect(page.getByRole('button', { name: /^添加收入分类$/i })).toBeDisabled();
    
    // 输入有效名称
    await page.locator('input[placeholder*="分类名称"]').fill('有效分类');
    
    // 验证添加按钮启用
    await expect(page.getByRole('button', { name: /^添加收入分类$/i })).toBeEnabled();
  });

  test('使用中的分类无法删除', async ({ page }) => {
    // 先添加一条使用某分类的记录
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await page.locator('input[type="number"]').fill('100');
    await page.locator('select').selectOption({ label: '餐饮' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 等待保存完成
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 导航到设置页
    await page.getByRole('button', { name: /设置|Settings/i }).click();
    
    // 尝试删除正在使用的分类
    const categoryItem = page.locator('div', { hasText: '餐饮' }).filter({ hasText: '餐饮' }).first();
    await categoryItem.locator('button').last().click();
    
    // 确认删除
    await page.getByRole('button', { name: /删除|确认/i }).last().click();
    
    // 验证错误提示
    await expect(page.getByText(/使用中|in use/i)).toBeVisible();
    
    // 验证分类仍然存在
    await expect(page.getByText('餐饮')).toBeVisible();
  });

  test('按 Enter 键提交分类', async ({ page }) => {
    // 点击添加收入分类按钮
    await page.getByRole('button', { name: /添加收入分类|Add Income Category/i }).click();
    
    // 输入分类名称
    const input = page.locator('input[placeholder*="分类名称"]');
    await input.fill('年终奖');
    
    // 按 Enter 键
    await input.press('Enter');
    
    // 验证成功提示
    await expect(page.getByText(/添加成功|success/i)).toBeVisible();
    
    // 验证新分类显示在列表中
    await expect(page.getByText('年终奖')).toBeVisible();
  });
});