# Tasks

- [x] Task 1: 创建历史页面组件
  - [x] SubTask 1.1: 创建 `src/pages/History.tsx` 页面组件
  - [x] SubTask 1.2: 实现按月分组逻辑
  - [x] SubTask 1.3: 实现表格显示（时间、分类、金额、类型、描述）
  - [x] SubTask 1.4: 实现每月收支统计显示
  - [x] SubTask 1.5: 实现时间排序（从新到旧）

- [x] Task 2: 更新侧边栏导航
  - [x] SubTask 2.1: 在 `src/components/Sidebar.tsx` 添加历史页导航项
  - [x] SubTask 2.2: 使用 History 图标（lucide-react）

- [x] Task 3: 更新页面类型和路由
  - [x] SubTask 3.1: 在 `src/types/index.ts` 添加 `history` 页面类型
  - [x] SubTask 3.2: 在 `src/App.tsx` 添加历史页路由

- [x] Task 4: 添加国际化支持
  - [x] SubTask 4.1: 更新 `src/i18n/locales/zh.json` 添加历史页翻译
  - [x] SubTask 4.2: 更新 `src/i18n/locales/en.json` 添加历史页翻译

- [x] Task 5: 验证构建
  - [x] SubTask 5.1: 运行 `npm run build` 验证 TypeScript 编译
  - [x] SubTask 5.2: 测试历史页显示
  - [x] SubTask 5.3: 测试按月分组和统计
  - [x] SubTask 5.4: 确认总览页功能保持不变

# Task Dependencies
- [Task 2] depends on [Task 3]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]