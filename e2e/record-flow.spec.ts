import { test, expect } from '@playwright/test';

test.describe('记账流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // 辅助函数：填写记账表单
  async function fillRecordForm(page: any, amount: string, category: string, date?: string, note?: string) {
    await page.getByPlaceholder('0.00').fill(amount);

    // 选择分类
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    // 等待下拉选项出现
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: category }).click();

    // 填写日期
    const today = date || new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);

    // 填写备注
    if (note) {
      await page.getByPlaceholder(/备注/).fill(note);
    }
  }

  // 辅助函数：等待保存成功消息
  async function waitForSaveSuccess(page: any) {
    await expect(page.getByRole('alert').getByText('保存成功')).toBeVisible();
  }

  // 辅助函数：导航到记账页并等待渲染
  async function navigateToAddRecord(page: any) {
    await page.getByRole('menuitem', { name: '记账' }).click();
    // 等待页面内容渲染
    await expect(page.getByRole('button', { name: '添加记录' })).toBeVisible();
  }

  // 辅助函数：选择交易类型
  async function selectTransactionType(page: any, type: string) {
    await page.getByRole('button', { name: type }).click();
  }

  test('添加收入记录', async ({ page }) => {
    // 导航到记账页
    await navigateToAddRecord(page);

    // 选择收入类型
    await selectTransactionType(page, '收入');

    // 填写表单
    await fillRecordForm(page, '1000', '工资', undefined, '月工资');

    // 提交表单
    await page.getByRole('button', { name: '添加记录' }).click();

    // 验证成功提示
    await waitForSaveSuccess(page);

    // 导航到总览页验证记录
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证记录显示
    await expect(page.getByText('工资').first()).toBeVisible();
    await expect(page.getByText('+¥1,000.00')).toBeVisible();
  });

  test('添加支出记录', async ({ page }) => {
    // 导航到记账页
    await navigateToAddRecord(page);

    // 默认选中支出类型 - 验证支出按钮存在
    await expect(page.getByText('支出', { exact: true })).toBeVisible();

    // 填写表单
    await fillRecordForm(page, '50.5', '餐饮', undefined, '午餐');

    // 提交表单
    await page.getByRole('button', { name: '添加记录' }).click();

    // 验证成功提示
    await waitForSaveSuccess(page);

    // 导航到总览页验证记录
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证记录显示
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('-¥50.50').first()).toBeVisible();
  });

  test('删除记录', async ({ page }) => {
    // 先添加一条记录
    await navigateToAddRecord(page);
    await page.getByPlaceholder('0.00').fill('100');
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: '餐饮' }).click();
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 导航到总览页
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证记录存在
    await expect(page.getByText('餐饮').first()).toBeVisible();

    // 点击删除按钮
    await page.locator('button[title*="删除"]').first().click();

    // 验证记录已删除
    await expect(page.getByText('餐饮')).not.toBeVisible();

    // 验证空状态提示
    await expect(page.getByText(/暂无记录/)).toBeVisible();
  });

  test('数据持久化验证 - localStorage', async ({ page }) => {
    // 添加一条收入记录
    await navigateToAddRecord(page);
    await selectTransactionType(page, '收入');
    await fillRecordForm(page, '5000', '工资');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

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
    await navigateToAddRecord(page);
    await selectTransactionType(page, '收入');
    await fillRecordForm(page, '10000', '工资');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 添加支出记录
    await fillRecordForm(page, '100', '餐饮');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 添加另一条支出记录
    await fillRecordForm(page, '200', '交通');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 导航到总览页验证统计
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证总收入
    await expect(page.getByText('+¥10,000.00')).toBeVisible();

    // 验证总支出
    await expect(page.locator('text=-¥300.00')).toBeVisible();

    // 验证结余
    await expect(page.getByText('¥9,700.00')).toBeVisible();
  });

  test('表单验证 - 必填字段', async ({ page }) => {
    // 导航到记账页
    await navigateToAddRecord(page);

    // 只填写金额，不选择分类
    await page.getByPlaceholder('0.00').fill('100');

    // 点击提交按钮
    await page.getByRole('button', { name: '添加记录' }).click();

    // 验证仍然显示表单（没有保存成功提示）
    await expect(page.getByRole('alert').getByText('保存成功')).not.toBeVisible();

    // 选择分类
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: '餐饮' }).click();

    // 填写日期
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);

    // 现在应该可以提交
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);
  });

  test('表单验证 - 金额必须为正数', async ({ page }) => {
    // 导航到记账页
    await navigateToAddRecord(page);

    // 填写负数金额
    await page.getByPlaceholder('0.00').fill('-100');
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: '餐饮' }).click();
    await page.getByRole('button', { name: '添加记录' }).click();

    // 验证仍然显示表单（没有保存成功提示）
    await expect(page.getByRole('alert').getByText('保存成功')).not.toBeVisible();

    // 填写 0
    await page.getByPlaceholder('0.00').fill('0');
    await page.getByRole('button', { name: '添加记录' }).click();

    // 验证仍然显示表单
    await expect(page.getByRole('alert').getByText('保存成功')).not.toBeVisible();

    // 填写正数
    await page.getByPlaceholder('0.00').fill('100');

    // 填写日期
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);

    // 验证可以提交
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);
  });

  test('切换收入/支出类型时分类重置', async ({ page }) => {
    // 导航到记账页
    await navigateToAddRecord(page);

    // 选择支出分类
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: '餐饮' }).click();

    // 验证分类已选中
    await page.waitForTimeout(200);
    await expect(page.locator('.ant-form-item').filter({ hasText: '分类' }).locator('.ant-select')).toContainText('餐饮');

    // 切换到收入类型
    await selectTransactionType(page, '收入');

    // 验证分类已重置（placeholder 应该可见）
    await expect(page.locator('.ant-select-selection-placeholder')).toBeVisible();
  });

  test('历史页面显示记录', async ({ page }) => {
    // 添加一条记录
    await navigateToAddRecord(page);
    await fillRecordForm(page, '500', '餐饮', undefined, '测试备注');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 导航到历史页
    await page.getByRole('menuitem', { name: '历史' }).click();

    // 验证历史记录显示
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('测试备注')).toBeVisible();
    await expect(page.getByText('-¥500.00').first()).toBeVisible();
  });
});
