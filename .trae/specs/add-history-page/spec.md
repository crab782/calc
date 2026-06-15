# Add History Page - Spec

## Why
需要一个专门的历史页面来查看完整的交易记录，按月份分组展示并统计每月收支情况，方便用户回顾和分析历史财务数据。

## What Changes
- **ADDED**: 新增历史页面 `src/pages/History.tsx`
- **ADDED**: 侧边栏添加历史页导航项
- **ADDED**: 国际化翻译支持
- **MODIFIED**: `src/types/index.ts` 添加 `history` 页面类型

## Impact
- Affected specs: expense-tracker, add-language-toggle
- Affected code:
  - `src/pages/History.tsx` - 新增页面
  - `src/components/Sidebar.tsx` - 添加导航项
  - `src/App.tsx` - 添加页面路由
  - `src/types/index.ts` - 添加页面类型
  - `src/i18n/locales/zh.json` - 中文翻译
  - `src/i18n/locales/en.json` - 英文翻译

## ADDED Requirements

### Requirement: 历史页面
系统 SHALL 提供一个历史页面，显示所有交易记录。

#### Scenario: 显示交易列表
- **WHEN** 用户访问历史页
- **THEN** 看到按月份分组的交易列表
- **AND** 每个月份显示该月的收入和支出统计

### Requirement: 交易列表表格
系统 SHALL 以表格形式显示交易记录，包含5列：时间、分类、金额、类型、描述。

#### Scenario: 表格显示
- **WHEN** 用户查看交易列表
- **THEN** 每条记录显示以下信息：
  - 时间：交易日期
  - 分类：交易分类（如餐饮、工资等）
  - 金额：交易金额（收入绿色+，支出红色-）
  - 类型：收入/支出标识
  - 描述：交易备注

### Requirement: 时间排序
系统 SHALL 默认按时间从新到旧排序交易记录。

#### Scenario: 排序显示
- **WHEN** 用户访问历史页
- **THEN** 最新的交易记录显示在最上方
- **AND** 每个月份内也按时间从新到旧排序

### Requirement: 按月分组统计
系统 SHALL 按月份分组显示交易记录，并统计每月收支。

#### Scenario: 月度分组
- **WHEN** 用户查看历史页
- **THEN** 交易按月份分组（如"2026年6月"）
- **AND** 每个月份标题下方显示该月总收入和总支出
- **AND** 该月份的所有交易记录列表在统计下方

### Requirement: 侧边栏导航
系统 SHALL 在侧边栏添加历史页导航入口。

#### Scenario: 导航入口
- **WHEN** 用户查看侧边栏
- **THEN** 看到历史页导航项（使用 History 图标）
- **AND** 点击后跳转到历史页

## MODIFIED Requirements

### Requirement: 保留总览页显示
总览页的最近交易列表 SHALL 保持不变，不移除。

#### Scenario: 总览页保持
- **WHEN** 用户访问总览页
- **THEN** 仍然看到最近10条交易记录
- **AND** 功能与之前一致

## REMOVED Requirements
无移除项。

## Notes
- 当前 ExpenseRecord 类型没有"账户"字段，暂时使用"类型"列替代
- 后续如需添加账户功能，可扩展数据类型