import { test, expect } from '@playwright/test';

test.describe('账户管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 导航到账户页
    await page.getByRole('menuitem', { name: '账户' }).click();
  });

  test('账户页默认显示', async ({ page }) => {
    // 验证账户页标题
    await expect(page.getByRole('heading', { name: '账户管理' })).toBeVisible();

    // 验证默认账户显示 (账户名为'现金')
    await expect(page.getByText('现金').first()).toBeVisible();
  });

  // 辅助函数：填写添加账户弹窗并提交
  async function fillAddAccountModal(page: any, name?: string, currency?: string, accountType?: string) {
    await expect(page.locator('.ant-modal:visible')).toBeVisible({ timeout: 10000 });
    // 等待弹窗内容完全渲染
    await page.waitForTimeout(300);

    if (name !== undefined) {
      await page.locator('.ant-modal:visible').getByPlaceholder(/例如/).fill(name);
    }

    if (currency) {
      await page.locator('.ant-modal:visible').locator('.ant-select').first().click();
      await page.locator('.ant-select-dropdown:visible').waitFor({ state: 'visible' });
      await page.locator('.ant-select-item-option', { hasText: currency }).click();
    }

    if (accountType) {
      // 第二个 Select 是账户类型
      const selects = page.locator('.ant-modal:visible').locator('.ant-select');
      await selects.nth(1).click();
      await page.locator('.ant-select-dropdown:visible').waitFor({ state: 'visible' });
      await page.locator('.ant-select-item-option', { hasText: accountType }).click();
    }

    // 确认按钮是 Modal 的 ok 按钮
    await page.locator('.ant-modal:visible .ant-btn-primary').click();
  }

  test('添加新账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: '添加账户' }).click();

    await fillAddAccountModal(page, '我的储蓄账户', 'USD', '投资');

    // 验证添加成功提示
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证新账户显示
    await expect(page.getByText('我的储蓄账户')).toBeVisible();
  });

  test('添加账户使用默认名称', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: '添加账户' }).click();

    // 不填写名称，直接确认
    await fillAddAccountModal(page);

    // 验证添加成功（应该使用默认名称）
    await expect(page.getByText('账户添加成功')).toBeVisible();
  });

  test('编辑账户', async ({ page }) => {
    // 等待表格加载完成
    await expect(page.getByRole('heading', { name: '账户管理' })).toBeVisible();
    
    // 点击编辑按钮 (第一行的第一个 text button - pencil icon)
    await page.locator('.ant-table-tbody tr').first().locator('button.ant-btn-text').first().click();

    // 等待编辑弹窗打开
    await expect(page.locator('.ant-modal:visible')).toBeVisible({ timeout: 10000 });

    // 修改账户名称
    await page.locator('.ant-modal:visible input').first().fill('新的账户名称');

    // 保存 - 编辑弹窗的确认按钮也是 ant-btn-primary
    await page.locator('.ant-modal:visible .ant-btn-primary').click();

    // 验证编辑成功提示
    await expect(page.getByText('账户信息更新成功')).toBeVisible();

    // 验证新名称显示
    await expect(page.getByText('新的账户名称')).toBeVisible();
  });

  test('删除账户', async ({ page }) => {
    // 先添加一个账户
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, '待删除账户');
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证新账户显示
    await expect(page.getByText('待删除账户')).toBeVisible();

    // 点击删除按钮 (待删除账户行的最后一个 text button - delete icon)
    await page.getByRole('row', { name: /待删除账户/ }).locator('button.ant-btn-text').last().click();

    // 等待确认弹窗
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-popconfirm:visible, .ant-popover:visible')).toBeVisible();

    // 确认删除
    await page.locator('.ant-popconfirm:visible .ant-btn-danger, .ant-popover:visible .ant-btn-danger').click();

    // 验证删除成功提示
    await expect(page.getByText('账户删除成功')).toBeVisible();

    // 验证账户已删除（不再可见）
    await expect(page.getByText('待删除账户')).not.toBeVisible();
  });

  test('按币种分组显示账户', async ({ page }) => {
    // 添加 USD 账户
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, undefined, 'USD');
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证 CNY 分组
    await expect(page.getByText('本币账户').first()).toBeVisible();

    // 验证 USD 分组
    await expect(page.getByText('USD 账户').first()).toBeVisible();
  });

  test('添加投资类型账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, undefined, undefined, '投资');

    // 验证添加成功
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证账户类型标签显示
    await expect(page.locator('.ant-tag:has-text("投资")')).toBeVisible();
  });

  test('添加贷款类型账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, undefined, undefined, '贷款');

    // 验证添加成功
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证账户类型标签显示
    await expect(page.locator('.ant-tag:has-text("贷款")')).toBeVisible();
  });

  test('添加多个账户并验证列表', async ({ page }) => {
    // 添加第一个账户
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, '账户一');
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 添加第二个账户
    await page.getByRole('button', { name: '添加账户' }).click();
    await fillAddAccountModal(page, '账户二');
    await expect(page.getByText('账户添加成功')).toBeVisible();

    // 验证所有账户显示
    await expect(page.getByText('账户一')).toBeVisible();
    await expect(page.getByText('账户二')).toBeVisible();
    await expect(page.getByText('现金')).toBeVisible();
  });

  test('取消添加账户', async ({ page }) => {
    // 点击添加账户按钮
    await page.getByRole('button', { name: '添加账户' }).click();

    // 验证弹窗打开
    await expect(page.locator('.ant-modal:visible')).toBeVisible({ timeout: 10000 });

    // 填写信息
    await page.locator('.ant-modal:visible').getByPlaceholder(/例如/).fill('取消的账户');

    // 点击取消
    await page.locator('.ant-modal:visible .ant-btn-default').click();

    // 验证弹窗关闭
    await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });

    // 验证账户未添加
    await expect(page.getByText('取消的账户')).not.toBeVisible();
  });
});
