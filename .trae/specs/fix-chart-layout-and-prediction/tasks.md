# Tasks

- [x] Task 1: 修改数据生成逻辑
  - [x] SubTask 1.1: 在 `src/lib/record.ts` 中将 `isPredicted` 改为 `isActual`
  - [x] SubTask 1.2: 未来月份收入/支出均为0（无事发生）
  - [x] SubTask 1.3: 未来月份结余保持最近实际月份的值不变（直线）
  - [x] SubTask 1.4: 过去月份无数据则为0，不使用预测填充

- [x] Task 2: 修改图表布局为垂直排列
  - [x] SubTask 2.1: 更新 `src/pages/Dashboard.tsx` 将三个图表垂直排列
  - [x] SubTask 2.2: 收入和支出图表与结余图表保持相同宽度

- [x] Task 3: 更新图表组件样式
  - [x] SubTask 3.1: 更新 `src/components/BalanceChart.tsx` 使用 `isActual`
  - [x] SubTask 3.2: 更新 `src/components/ExpenseChart.tsx` 使用 `isActual`
  - [x] SubTask 3.3: 更新 `src/components/IncomeChart.tsx` 使用 `isActual`
  - [x] SubTask 3.4: 过去月份按实际数据显示，未来月份用虚线样式

- [x] Task 4: 验证构建和功能
  - [x] SubTask 4.1: 运行 `npm run build` 验证 TypeScript 编译
  - [x] SubTask 4.2: 测试图表垂直布局
  - [x] SubTask 4.3: 测试过去月份无预测
  - [x] SubTask 4.4: 测试未来月份为0（直线）

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2, Task 3]
