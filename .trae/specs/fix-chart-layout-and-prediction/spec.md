# Fix Chart Layout and Prediction Logic - Spec

## Why
当前图表布局和预测逻辑存在问题：
1. 收入/支出图表宽度与结余图不一致，布局不够美观
2. 过去月份不应该有预测数据，应保持用户实际输入
3. 未来月份不应自动延续最近月份值，应保持为0（无事发生），预测功能留待后续规则页实现

## What Changes
- **MODIFIED**: 图表布局 - 收入/支出图表与结余图保持相同宽度，依次垂直排列
- **MODIFIED**: 过去月份数据 - 移除过去月份的预测，保持用户实际输入（无数据则为0）
- **MODIFIED**: 未来月份数据 - 移除自动延续逻辑，收入/支出均为0（直线），结余保持不变
- **ADDED**: `isActual` 标识 - 区分实际数据和未来预测数据

## Impact
- Affected specs: improve-dashboard-charts
- Affected code:
  - `src/lib/record.ts` - 修改数据生成逻辑
  - `src/pages/Dashboard.tsx` - 修改图表布局
  - `src/components/BalanceChart.tsx` - 更新图表样式
  - `src/components/ExpenseChart.tsx` - 更新图表样式
  - `src/components/IncomeChart.tsx` - 更新图表样式

## ADDED Requirements

### Requirement: 图表垂直布局
系统 SHALL 将三个图表垂直排列，每个图表保持相同宽度。

#### Scenario: 垂直布局显示
- **WHEN** 用户访问总览页
- **THEN** 看到三个图表垂直排列（结余 → 支出 → 收入）
- **AND** 每个图表宽度一致，占满容器

### Requirement: 过去月份无预测
系统 SHALL 对过去月份仅显示用户实际输入的数据，不做任何预测填充。

#### Scenario: 过去月份显示
- **WHEN** 用户只输入了5月、6月数据，没有4月及之前的数据
- **THEN** 4月及之前的月份显示为0（空白）
- **AND** 5月、6月显示用户实际输入的数据

### Requirement: 未来月份无事发生
系统 SHALL 对未来月份的收入和支出均设为0，结余保持最近实际月份的值不变。

#### Scenario: 未来月份显示
- **WHEN** 当前是6月，查看7月及之后的数据
- **THEN** 7月及未来月份收入为0、支出为0
- **AND** 结余保持为6月的累计值（直线）
- **AND** 未来月份用虚线样式区分

### Requirement: 实际数据标识
系统 SHALL 使用 `isActual` 字段标识数据是否为用户实际输入。

#### Scenario: 数据标识
- **WHEN** 生成月度数据
- **THEN** 用户输入的月份 `isActual=true`
- **AND** 未来月份 `isActual=false`（用于虚线样式）

## MODIFIED Requirements

### Requirement: 月度数据生成逻辑
月度数据生成 SHALL 修改为：
- 过去月份：仅显示实际数据，无数据则为0
- 未来月份：收入=0，支出=0，结余=最近实际月份的累计结余
- 使用 `isActual` 替代 `isPredicted` 标识

### Requirement: 图表组件结构
图表组件 SHALL 修改为：
- 垂直布局（单列）
- 未来月份使用虚线样式（`isActual=false`）

## REMOVED Requirements

### Requirement: 未来月份延续最近值
**Reason**: 预测功能应通过后续规则页配置，不应自动假设
**Migration**: 未来月份收入/支出均为0，结余保持不变
