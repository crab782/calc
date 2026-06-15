# Add Language Toggle - Spec

## Why
项目需要支持中英文切换，方便不同语言用户使用。总览页需要添加语言切换按钮，实现中文（默认）和 English 之间的切换。

## What Changes
- **BREAKING**: 创建国际化配置文件 `src/i18n/locales/zh.json` 和 `src/i18n/locales/en.json`
- **ADDED**: 创建 `src/contexts/LanguageContext.tsx` 提供全局语言状态管理
- **ADDED**: 在总览页添加语言切换按钮
- **MODIFIED**: 更新所有页面组件使用 i18n 系统
- **ADDED**: 创建 `src/i18n/` 目录管理翻译文件

## Impact
- Affected specs: 新增国际化支持
- Affected code:
  - `src/i18n/locales/zh.json` - 中文翻译
  - `src/i18n/locales/en.json` - 英文翻译
  - `src/contexts/LanguageContext.tsx` - 语言上下文
  - `src/pages/Dashboard.tsx` - 添加切换按钮
  - `src/pages/AddRecord.tsx` - 使用 i18n
  - `src/pages/Settings.tsx` - 使用 i18n
  - `src/components/Sidebar.tsx` - 使用 i18n
  - `src/components/MonthlyChart.tsx` - 使用 i18n

## ADDED Requirements

### Requirement: 语言切换功能
系统 SHALL 提供中英文切换按钮，允许用户在中文（默认）和英文之间切换。

#### Scenario: 切换语言
- **WHEN** 用户点击语言切换按钮
- **THEN** 页面语言在中文和英文之间切换
- **AND** 切换后的语言偏好存储在 localStorage

### Requirement: 国际化配置文件
系统 SHALL 为每个页面组件提供翻译文件，支持所有用户可见文本。

#### Scenario: 加载翻译
- **WHEN** 页面加载时
- **THEN** 根据当前语言设置加载对应翻译
- **AND** 所有文本都通过翻译 key 获取

### Requirement: 语言持久化
系统 SHALL 在 localStorage 中保存用户的语言偏好，刷新页面后保持选择。

#### Scenario: 持久化语言设置
- **WHEN** 用户切换语言后刷新页面
- **THEN** 页面显示用户上次选择的语言

## MODIFIED Requirements

### Requirement: 总览页
总览页 SHALL 在顶部添加语言切换按钮，显示当前语言和可切换的语言选项。

### Requirement: 所有页面组件
所有页面组件 SHALL 使用 i18n 系统获取文本，而不是硬编码中文文本。

## REMOVED Requirements

### Requirement: 硬编码中文文本
**Reason**: 需要支持多语言
**Migration**: 替换为 i18n 翻译 key
