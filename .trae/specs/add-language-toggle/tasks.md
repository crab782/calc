# Tasks

- [x] Task 1: 创建国际化基础结构
  - [x] SubTask 1.1: 创建 `src/i18n/locales/zh.json` 和 `src/i18n/locales/en.json` 翻译文件
  - [x] SubTask 1.2: 创建 `src/contexts/LanguageContext.tsx` 语言上下文
  - [x] SubTask 1.3: 更新 `src/main.tsx` 添加 LanguageProvider

- [x] Task 2: 更新所有组件使用 i18n
  - [x] SubTask 2.1: 更新 `src/components/Sidebar.tsx` 使用 i18n
  - [x] SubTask 2.2: 更新 `src/pages/Dashboard.tsx` 使用 i18n，添加语言切换按钮
  - [x] SubTask 2.3: 更新 `src/pages/AddRecord.tsx` 使用 i18n
  - [x] SubTask 2.4: 更新 `src/pages/Settings.tsx` 使用 i18n
  - [x] SubTask 2.5: 更新 `src/components/MonthlyChart.tsx` 使用 i18n

- [x] Task 3: 验证构建和功能
  - [x] SubTask 3.1: 运行 `npm run build` 验证 TypeScript 编译
  - [x] SubTask 3.2: 测试语言切换功能

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]

# 翻译内容
所有用户可见文本都需要翻译，包括：
- 页面标题
- 按钮文本
- 标签文本
- 提示信息
- 图表标签
- 导航项
