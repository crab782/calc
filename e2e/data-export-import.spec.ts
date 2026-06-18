import { test, expect } from '@playwright/test';

test.describe('数据导入导出流程', () => {
  // 辅助函数：导航到设置页并等待渲染
  async function navigateToSettings(page: any) {
    await page.getByRole('menuitem', { name: '设置' }).click();
    await expect(page.getByText('分类管理')).toBeVisible();
  }

  // 辅助函数：导航到记账页并等待渲染
  async function navigateToAddRecord(page: any) {
    await page.getByRole('menuitem', { name: '记账' }).click();
    await expect(page.getByRole('button', { name: '添加记录' })).toBeVisible();
  }

  // 辅助函数：选择交易类型
  async function selectTransactionType(page: any, type: string) {
    await page.getByRole('button', { name: type }).click();
  }

  // 辅助函数：填写记账表单
  async function fillRecordForm(page: any, amount: string, category: string, note?: string) {
    await page.getByPlaceholder('0.00').fill(amount);
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: category }).click();
    if (note) {
      await page.getByPlaceholder(/备注/).fill(note);
    }
  }

  // 辅助函数：等待保存成功消息
  async function waitForSaveSuccess(page: any) {
    await expect(page.getByRole('alert').getByText('保存成功')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 导航到设置页
    await navigateToSettings(page);
  });

  test('导出数据 - 下载 JSON 文件', async ({ page }) => {
    // 先添加一些数据
    await navigateToAddRecord(page);
    await fillRecordForm(page, '1000', '工资');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 返回设置页
    await navigateToSettings(page);

    // 设置下载监听
    const downloadPromise = page.waitForEvent('download');

    // 点击导出按钮
    await page.getByRole('button', { name: '导出数据' }).click();

    // 等待下载完成
    const download = await downloadPromise;

    // 验证文件名
    expect(download.suggestedFilename()).toBe('account-book.json');

    // 验证成功提示
    await expect(page.getByText('数据导出成功！')).toBeVisible();

    // 验证文件内容
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString('utf-8');
    const data = JSON.parse(content);

    // 验证数据结构
    expect(data.version).toBeDefined();
    expect(data.records).toBeDefined();
    expect(data.categories).toBeDefined();
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();

    // 验证记录数据
    expect(data.records.length).toBeGreaterThanOrEqual(1);
  });

  test('导入数据 - 上传 JSON 文件', async ({ page }) => {
    // 准备导入数据
    const importData = {
      version: '1.0.0',
      records: [
        {
          id: 'test-record-1',
          type: 'expense' as const,
          amount: 50,
          category: '餐饮',
          note: '导入测试',
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
          entries: [{
            accountId: 'CNY-cash',
            amount: 50,
            direction: 'credit' as const,
          }],
        },
      ],
      categories: [
        { id: 'cat-1', name: '餐饮', type: 'expense' as const, icon: 'utensils' },
      ],
      accounts: [
        { id: 'CNY-cash', name: '现金', currency: 'CNY', balance: 0, isDefault: true, visible: true, accountType: 'cash' as const },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const jsonContent = JSON.stringify(importData, null, 2);

    // 通过设置文件输入来导入
    await page.setInputFiles('input[type="file"]', {
      name: 'test-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonContent),
    });

    // 验证导入成功提示
    await expect(page.getByText('数据导入成功！')).toBeVisible();

    // 导航到总览页验证数据
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证导入的记录
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('-¥50.00').first()).toBeVisible();
    await expect(page.getByText('导入测试')).toBeVisible();
  });

  test('数据完整性验证', async ({ page }) => {
    // 添加多条记录
    await navigateToAddRecord(page);

    // 添加收入记录
    await selectTransactionType(page, '收入');
    await fillRecordForm(page, '5000', '工资', '月工资');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 添加支出记录
    await fillRecordForm(page, '100', '餐饮', '午餐');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 验证 localStorage 数据完整性
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });

    expect(localStorageData).not.toBeNull();
    expect(localStorageData.version).toBeDefined();
    expect(localStorageData.records.length).toBe(2);
    expect(localStorageData.categories.length).toBeGreaterThan(0);

    // 验证记录数据完整性
    const incomeRecord = localStorageData.records.find((r: { type: string }) => r.type === 'income');
    expect(incomeRecord.amount).toBe(5000);
    expect(incomeRecord.category).toBe('工资');

    const expenseRecord = localStorageData.records.find((r: { type: string }) => r.type === 'expense');
    expect(expenseRecord.amount).toBe(100);
    expect(expenseRecord.category).toBe('餐饮');
  });

  test('导入数据后刷新页面验证持久化', async ({ page }) => {
    // 准备导入数据
    const importData = {
      version: '1.0.0',
      records: [
        {
          id: 'test-persist-1',
          type: 'income' as const,
          amount: 2000,
          category: '奖金',
          note: '季度奖金',
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
          entries: [{
            accountId: 'CNY-cash',
            amount: 2000,
            direction: 'debit' as const,
          }],
        },
      ],
      categories: [
        { id: 'cat-bonus', name: '奖金', type: 'income' as const, icon: 'gift' },
      ],
      accounts: [
        { id: 'CNY-cash', name: '现金', currency: 'CNY', balance: 0, isDefault: true, visible: true, accountType: 'cash' as const },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 直接设置 localStorage
    await page.evaluate((data) => {
      localStorage.setItem('expense_tracker_data', JSON.stringify(data));
    }, importData);

    // 刷新页面
    await page.reload();

    // 导航到总览页
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证数据持久化
    await expect(page.getByText('奖金')).toBeVisible();
    await expect(page.getByText('+¥2,000.00')).toBeVisible();
    await expect(page.getByText('季度奖金')).toBeVisible();

    // 再次刷新验证
    await page.reload();
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证数据仍然存在
    await expect(page.getByText('奖金')).toBeVisible();
    await expect(page.getByText('+¥2,000.00')).toBeVisible();
  });

  test('记录数量显示', async ({ page }) => {
    // 验证初始记录数量为 0
    await expect(page.getByText('0')).toBeVisible();

    // 添加记录
    await navigateToAddRecord(page);
    await fillRecordForm(page, '100', '餐饮');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 返回设置页
    await navigateToSettings(page);

    // 验证记录数量更新为 1
    await expect(page.getByText('1')).toBeVisible();

    // 再添加一条记录
    await navigateToAddRecord(page);
    await fillRecordForm(page, '200', '交通');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 返回设置页
    await navigateToSettings(page);

    // 验证记录数量更新为 2
    await expect(page.getByText('2')).toBeVisible();
  });

  test('清空数据功能', async ({ page }) => {
    // 先添加数据
    await navigateToAddRecord(page);
    await fillRecordForm(page, '100', '餐饮');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 返回设置页
    await navigateToSettings(page);

    // 验证记录数量为 1
    await expect(page.getByText('1')).toBeVisible();

    // 点击清空数据按钮
    await page.getByRole('button', { name: '清除所有数据' }).click();

    // 等待 Popconfirm 出现
    await expect(page.locator('.ant-popconfirm:visible, .ant-popover:visible')).toBeVisible();

    // 确认清空 - Popconfirm 的确认按钮
    await page.locator('.ant-popconfirm:visible .ant-btn-danger, .ant-popover:visible .ant-btn-danger').click();

    // 验证成功提示
    await expect(page.getByText('所有数据已清除')).toBeVisible();

    // 验证记录数量为 0
    await expect(page.getByText('0')).toBeVisible();

    // 验证 localStorage 数据已清空
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });

    expect(localStorageData.records.length).toBe(0);
  });

  test('localStorage 数据正确存储', async ({ page }) => {
    // 添加记录
    await navigateToAddRecord(page);
    await fillRecordForm(page, '500', '餐饮', '测试持久化');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 验证 localStorage
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('expense_tracker_data');
      return data ? JSON.parse(data) : null;
    });

    expect(localStorageData).not.toBeNull();
    expect(localStorageData.version).toBeDefined();
    expect(localStorageData.records.length).toBe(1);
    expect(localStorageData.createdAt).toBeDefined();
    expect(localStorageData.updatedAt).toBeDefined();

    // 验证记录数据
    const record = localStorageData.records[0];
    expect(record.id).toBeDefined();
    expect(record.type).toBe('expense');
    expect(record.amount).toBe(500);
    expect(record.category).toBe('餐饮');
    expect(record.date).toBeDefined();
    expect(record.createdAt).toBeDefined();
  });

  test('数据在页面刷新后保持', async ({ page }) => {
    // 添加多条记录
    await navigateToAddRecord(page);

    // 添加收入记录
    await selectTransactionType(page, '收入');
    await fillRecordForm(page, '1000', '工资');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 添加支出记录
    await fillRecordForm(page, '50', '餐饮');
    await page.getByRole('button', { name: '添加记录' }).click();
    await waitForSaveSuccess(page);

    // 刷新页面
    await page.reload();

    // 导航到总览页
    await page.getByRole('menuitem', { name: '总览' }).click();

    // 验证所有记录仍然存在
    await expect(page.getByText('工资').first()).toBeVisible();
    await expect(page.getByText('+¥1,000.00')).toBeVisible();
    await expect(page.getByText('餐饮')).toBeVisible();
    await expect(page.getByText('-¥50.00')).toBeVisible();

    // 验证统计数据
    await expect(page.getByText('¥950.00')).toBeVisible(); // 结余
  });
});
