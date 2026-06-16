import { test, expect } from '@playwright/test';

test.describe('记账流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前清空 localStorage 并访问首页
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('添加收入记录', async ({ page }) => {
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 选择收入类型
    await page.getByRole('button', { name: /收入|Income/i }).click();
    
    // 填写金额
    await page.locator('input[type="number"]').fill('1000');
    
    // 选择分类
    await page.locator('select').selectOption({ label: '工资' });
    
    // 填写日期
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);
    
    // 填写备注
    await page.locator('textarea').fill('月工资');
    
    // 提交表单
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 验证表单字段被清空（表示保存成功）
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    await expect(page.locator('select')).toHaveValue('');
    
    // 导航到总览页验证记录
    await page.getByRole('button', { name: /总览|Dashboard/i }).click();
    
    // 验证记录显示
    await expect(page.getByText('工资').first()).toBeVisible();
    await expect(page.getByText('+¥1,000.00')).toBeVisible();
  });

  test('添加支出记录', async ({ page }) => {
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 确保支出类型被选中（默认）
    await expect(page.getByRole('button', { name: /支出|Expense/i })).toHaveClass(/border-red-500/);
    
    // 填写金额
    await page.locator('input[type="number"]').fill('50.5');
    
    // 选择分类
    await page.locator('select').selectOption({ label: '餐饮' });
    
    // 填写日期
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);
    
    // 填写备注
    await page.locator('textarea').fill('午餐');
    
    // 提交表单
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 验证表单字段被清空（表示保存成功）
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 导航到总览页验证记录
    await page.getByRole('button', { name: /总览|Dashboard/i }).click();
    
    // 验证记录显示
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('-¥50.50').first()).toBeVisible();
  });

  test('删除记录', async ({ page }) => {
    // 先添加一条记录
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await page.locator('input[type="number"]').fill('100');
    await page.locator('select').selectOption({ label: '餐饮' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 等待表单清空（表示保存成功）
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 导航到总览页
    await page.getByRole('button', { name: /总览|Dashboard/i }).click();
    
    // 验证记录存在
    await expect(page.getByText('餐饮').first()).toBeVisible();
    
    // 点击删除按钮
    await page.locator('button[title*="删除"]').click();
    
    // 验证记录已删除
    await expect(page.getByText('餐饮')).not.toBeVisible();
    
    // 验证空状态提示
    await expect(page.getByText(/暂无记录|No records/i)).toBeVisible();
  });

  test('数据持久化验证 - localStorage', async ({ page }) => {
    // 添加一条收入记录
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await page.getByRole('button', { name: /收入|Income/i }).click();
    await page.locator('input[type="number"]').fill('5000');
    await page.locator('select').selectOption({ label: '工资' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 等待表单清空（表示保存成功）
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 验证 localStorage 中有数据
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });
    
    expect(localStorageData).not.toBeNull();
    expect(localStorageData.records).toHaveLength(1);
    expect(localStorageData.records[0].amount).toBe(5000);
    expect(localStorageData.records[0].type).toBe('income');
    expect(localStorageData.records[0].category).toBe('工资');
    
    // 刷新页面
    await page.reload();
    
    // 验证数据仍然存在
    await expect(page.getByText('工资').first()).toBeVisible();
    await expect(page.getByText('+¥5,000.00')).toBeVisible();
  });

  test('添加多条记录并验证统计', async ({ page }) => {
    // 添加收入记录
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await page.getByRole('button', { name: /收入|Income/i }).click();
    await page.locator('input[type="number"]').fill('10000');
    await page.locator('select').selectOption({ label: '工资' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 添加支出记录
    await page.getByRole('button', { name: /支出|Expense/i }).click();
    await page.locator('input[type="number"]').fill('100');
    await page.locator('select').selectOption({ label: '餐饮' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 添加另一条支出记录
    await page.locator('input[type="number"]').fill('200');
    await page.locator('select').selectOption({ label: '交通' });
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue('');
    
    // 导航到总览页验证统计
    await page.getByRole('button', { name: /总览|Dashboard/i }).click();
    
    // 验证总收入
    await expect(page.getByText('+¥10,000.00')).toBeVisible();
    
    // 验证总支出（使用包含文本的方式）
    await expect(page.locator('text=-¥300.00')).toBeVisible();
    
    // 验证结余
    await expect(page.getByText('¥9,700.00')).toBeVisible();
  });

  test('表单验证 - 必填字段', async ({ page }) => {
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 验证提交按钮初始禁用状态
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeDisabled();
    
    // 只填写金额，不选择分类
    await page.locator('input[type="number"]').fill('100');
    
    // 验证提交按钮仍然禁用
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeDisabled();
    
    // 选择分类
    await page.locator('select').selectOption({ label: '餐饮' });
    
    // 验证提交按钮启用
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeEnabled();
  });

  test('表单验证 - 金额必须为正数', async ({ page }) => {
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 填写负数金额
    await page.locator('input[type="number"]').fill('-100');
    await page.locator('select').selectOption({ label: '餐饮' });
    
    // 验证提交按钮禁用
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeDisabled();
    
    // 填写 0
    await page.locator('input[type="number"]').fill('0');
    
    // 验证提交按钮禁用
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeDisabled();
    
    // 填写正数
    await page.locator('input[type="number"]').fill('100');
    
    // 验证提交按钮启用
    await expect(page.getByRole('button', { name: /添加记录|Add Record/i })).toBeEnabled();
  });

  test('切换收入/支出类型时分类重置', async ({ page }) => {
    // 导航到记账页
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    
    // 选择支出类型并选择分类
    await page.locator('select').selectOption({ label: '餐饮' });
    
    // 切换到收入类型
    await page.getByRole('button', { name: /收入|Income/i }).click();
    
    // 验证分类已重置
    await expect(page.locator('select')).toHaveValue('');
    
    // 选择收入分类
    await page.locator('select').selectOption({ label: '工资' });
    
    // 切换回支出类型
    await page.getByRole('button', { name: /支出|Expense/i }).click();
    
    // 验证分类已重置
    await expect(page.locator('select')).toHaveValue('');
  });

  test('历史页面显示记录', async ({ page }) => {
    // 添加一条记录
    await page.getByRole('button', { name: /记账|Add Record/i }).click();
    await page.locator('input[type="number"]').fill('500');
    await page.locator('select').selectOption({ label: '餐饮' });
    await page.locator('textarea').fill('测试备注');
    await page.getByRole('button', { name: /添加记录|Add Record/i }).click();
    
    // 导航到历史页
    await page.getByRole('button', { name: /历史|History/i }).click();
    
    // 验证历史记录显示
    await expect(page.getByRole('heading', { name: /历史|History/i })).toBeVisible();
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('测试备注')).toBeVisible();
    await expect(page.getByText('-¥500.00').first()).toBeVisible();
  });
});