# Tasks

- [x] Task 1: 更新数据生成逻辑
  - [x] SubTask 1.1: 在 `src/lib/record.ts` 中添加 `generateMonthlyDataWithPrediction` 函数
  - [x] SubTask 1.2: 实现过去月份零值填充逻辑（过去6个月）
  - [x] SubTask 1.3: 实现未来月份预测填充逻辑（未来6个月，保持最近月份值）
  - [x] SubTask 1.4: 更新 `src/hooks/useStatistics.ts` 使用新的数据生成函数

- [x] Task 2: 重构图表组件为三图表布局
  - [x] SubTask 2.1: 创建 `src/components/BalanceChart.tsx` 结余趋势图表
  - [x] SubTask 2.2: 创建 `src/components/ExpenseChart.tsx` 支出趋势图表
  - [x] SubTask 2.3: 创建 `src/components/IncomeChart.tsx` 收入趋势图表
  - [x] SubTask 2.4: 更新 `src/pages/Dashboard.tsx` 使用三图表布局
  - [x] SubTask 2.5: 删除旧的 `src/components/MonthlyChart.tsx`

- [x] Task 3: 添加国际化支持
  - [x] SubTask 3.1: 更新 `src/i18n/locales/zh.json` 添加新图表标题翻译
  - [x] SubTask 3.2: 更新 `src/i18n/locales/en.json` 添加新图表标题翻译

- [x] Task 4: 验证构建和功能
  - [x] SubTask 4.1: 运行 `npm run build` 验证 TypeScript 编译
  - [x] SubTask 4.2: 测试图表显示过去半年 + 未来半年数据
  - [x] SubTask 4.3: 测试空白月份零值填充
  - [x] SubTask 4.4: 测试未来月份预测填充

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]

# 数据生成逻辑说明

## 过去月份（无数据）
- 假设收支均为0
- 结余保持为初始值（即累计结余不变）

## 未来月份（预测）
- 收入/支出保持最近有数据月份的值
- 结余按趋势延续计算

## 显示范围
- 过去6个月 + 未来6个月 = 共12个月
- 当前月份为基准点