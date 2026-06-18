import { test, expect } from '@playwright/test';

test.describe('分类管理流程', () => {
  // 辅助函数：导航到设置页并等待渲染
  async function navigateToSettings(page: any) {
    await page.getByRole('menuitem', { name: '设置' }).click();
    await expect(page.getByText('分类管理')).toBeVisible();
  }

  // 辅助函数：添加分类
  async function addCategory(page: any, type: '收入' | '支出', name: string) {
    // 使用 first() to avoid strict mode violation (button appears both on page and in modal)
    await page.getByRole('button', { name: `添加${type}分类` }).first().click();
    await expect(page.locator('.ant-modal:visible')).toBeVisible();
    await page.locator('.ant-modal:visible input').fill(name);
    await page.locator('.ant-modal:visible').getByRole('button', { name: `添加${type}分类` }).click();
    await expect(page.getByText('分类添加成功')).toBeVisible();
  }

  // 辅助函数：删除分类（通过 closable Tag）
  async function deleteCategoryByName(page: any, name: string) {
    // 查找包含该名称的 Tag 并点击其关闭按钮
    const tagCloseIcon = page.locator(`.ant-tag:has-text("${name}") .ant-tag-close-icon`).first();
    await tagCloseIcon.click();
    await expect(page.locator('.ant-modal:visible')).toBeVisible();
    await page.locator('.ant-modal:visible').getByRole('button', { name: '确认清除' }).click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 导航到设置页
    await navigateToSettings(page);
  });

  test('设置页显示分类管理区块', async ({ page }) => {
    // 验证分类管理文本存在
    await expect(page.getByText('分类管理')).toBeVisible();
  });

  test('显示默认收入分类', async ({ page }) => {
    // 验证收入分类区块（使用 first() to avoid strict mode violation with button text）
    await expect(page.getByText('收入分类').first()).toBeVisible();

    // 验证常见收入分类存在
    await expect(page.getByText('工资').first()).toBeVisible();
    await expect(page.getByText('奖金').first()).toBeVisible();
  });

  test('显示默认支出分类', async ({ page }) => {
    // 验证支出分类区块
    await expect(page.getByText('支出分类').first()).toBeVisible();

    // 验证常见支出分类存在
    await expect(page.getByText('餐饮').first()).toBeVisible();
    await expect(page.getByText('交通').first()).toBeVisible();
    await expect(page.getByText('购物').first()).toBeVisible();
  });

  test('添加收入分类', async ({ page }) => {
    await addCategory(page, '收入', '股票收益');

    // 验证新分类显示
    await expect(page.getByText('股票收益').first()).toBeVisible();
  });

  test('添加支出分类', async ({ page }) => {
    await addCategory(page, '支出', '健身');

    // 验证新分类显示
    await expect(page.getByText('健身').first()).toBeVisible();
  });

  test('删除未使用的收入分类', async ({ page }) => {
    // 先添加一个新分类
    await addCategory(page, '收入', '临时收入');

    // 验证新分类存在
    await expect(page.getByText('临时收入').first()).toBeVisible();

    // 删除分类
    await deleteCategoryByName(page, '临时收入');

    // 验证删除成功提示
    await expect(page.getByText('分类删除成功')).toBeVisible();

    // 验证分类已删除
    await expect(page.getByText('临时收入')).not.toBeVisible();
  });

  test('取消删除分类', async ({ page }) => {
    // 先添加一个新分类
    await addCategory(page, '支出', '临时支出');

    // 点击分类上的关闭按钮
    const tagCloseIcon = page.locator('.ant-tag:has-text("临时支出") .ant-tag-close-icon').first();
    await tagCloseIcon.click();

    // 验证删除确认弹窗
    await expect(page.locator('.ant-modal:visible')).toBeVisible();

    // 点击取消
    await page.locator('.ant-modal:visible').getByRole('button', { name: '取消' }).click({ timeout: 15000 });

    // 验证弹窗关闭
    await expect(page.locator('.ant-modal')).not.toBeVisible();

    // 验证分类仍然存在
    await expect(page.getByText('临时支出').first()).toBeVisible();
  });

  test('删除正在使用的分类应失败', async ({ page }) => {
    // 先添加一条使用该分类的记录
    await page.getByRole('menuitem', { name: '记账' }).click();
    await expect(page.getByRole('button', { name: '添加记录' })).toBeVisible();

    await page.getByPlaceholder('0.00').fill('100');
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await page.locator('.ant-select-item-option', { hasText: '餐饮' }).click();
    await page.getByRole('button', { name: '添加记录' }).click();
    await expect(page.getByRole('alert').getByText('保存成功')).toBeVisible();

    // 返回设置页
    await page.getByRole('menuitem', { name: '设置' }).click();
    await expect(page.getByText('分类管理')).toBeVisible();

    // 尝试删除正在使用的分类
    await deleteCategoryByName(page, '餐饮');

    // 验证失败提示 (message.error 渲染在 .ant-message 中)
    await expect(page.locator('.ant-message').getByText('该分类正在使用中，无法删除')).toBeVisible();

    // 验证分类仍然存在
    await expect(page.getByText('餐饮').first()).toBeVisible();
  });

  test('分类在记账页面可用', async ({ page }) => {
    // 先添加新分类
    await addCategory(page, '支出', '旅游');

    // 导航到记账页
    await page.getByRole('menuitem', { name: '记账' }).click();
    await expect(page.getByRole('button', { name: '添加记录' })).toBeVisible();

    // 打开分类下拉框
    await page.locator('.ant-form-item').filter({ hasText: '分类' }).getByRole('combobox').click();
    await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });

    // 验证新分类出现在选项中
    await expect(page.locator('.ant-select-item-option', { hasText: '旅游' })).toBeVisible();
  });

  test('添加多个分类', async ({ page }) => {
    // 添加多个收入分类
    await addCategory(page, '收入', '兼职');
    await addCategory(page, '收入', '理财');

    // 验证新分类都显示
    await expect(page.getByText('兼职').first()).toBeVisible();
    await expect(page.getByText('理财').first()).toBeVisible();
  });
});
