# Improve Dashboard Charts - Spec

## Why
当前总览页图表只显示用户实际输入数据的月份，缺少对过去空白月份和未来月份的预测展示。为了支持后续的预测收入/支出功能，需要改进图表显示逻辑，并拆分为三个独立图表展示结余、支出、收入。

## What Changes
- **MODIFIED**: 图表数据逻辑 - 过去无数据月份假设收支为0
- **MODIFIED**: 图表数据逻辑 - 未来月份保持最近月份的财务情况
- **BREAKING**: 图表拆分为三个独立图表：结余趋势、支出趋势、收入趋势
- **MODIFIED**: 默认显示范围为过去半年 + 未来半年（共12个月）
- **ADDED**: 新增数据预测逻辑函数

## Impact
- Affected specs: expense-tracker, add-language-toggle
- Affected code:
  - `src/components/MonthlyChart.tsx` - 重构为三个图表
  - `src/lib/record.ts` - 新增预测数据生成逻辑
  - `src/hooks/useStatistics.ts` - 更新月度数据获取逻辑

## ADDED Requirements

### Requirement: 过去月份零值填充
系统 SHALL 对过去没有数据的月份自动填充收支为0，确保图表连续显示。

#### Scenario: 填充过去空白月份
- **WHEN** 用户只输入了5月、6月数据，没有4月及之前的数据
- **THEN** 图表显示4月、3月等过去月份，收支均为0
- **AND** 结余保持为初始值0

### Requirement: 未来月份预测填充
系统 SHALL 对未来未发生的月份保持最近月份的财务情况。

#### Scenario: 填充未来月份
- **WHEN** 当前是6月，用户需要查看7月及之后的预测
- **THEN** 7月及未来月份的收支保持与6月相同
- **AND** 结余按最近月份的收支趋势延续

### Requirement: 三图表拆分显示
系统 SHALL 将总览页图表拆分为三个独立图表：
1. 结余趋势图（上方）
2. 支出趋势图（下方左）
3. 收入趋势图（下方右）

#### Scenario: 三图表布局
- **WHEN** 用户访问总览页
- **THEN** 看到三个独立图表，清晰展示不同财务维度
- **AND** 每个图表有独立的标题和图例

### Requirement: 默认显示半年范围
系统 SHALL 默认显示过去6个月和未来6个月的数据（共12个月）。

#### Scenario: 半年范围显示
- **WHEN** 用户访问总览页
- **THEN** 图表显示从当前月份往前6个月 + 往后6个月
- **AND** 共显示12个月的数据点

## MODIFIED Requirements

### Requirement: 月度数据生成逻辑
月度数据生成 SHALL 包含：
- 实际用户输入的数据
- 过去空白月份的零值填充
- 未来月份的预测填充（保持最近月份值）

### Requirement: 图表组件结构
MonthlyChart 组件 SHALL 拆分为三个子组件：
- BalanceChart - 结余趋势
- ExpenseChart - 支出趋势
- IncomeChart - 收入趋势

## REMOVED Requirements

### Requirement: 单一折线图
**Reason**: 需要更清晰地展示不同财务维度
**Migration**: 替换为三个独立图表