import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

// 创建 Ant Design 主题配置
// 注意：此函数需要在组件内部调用以响应式获取 effectiveTheme
export const createThemeConfig = (dark: boolean): ThemeConfig => ({
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontSize: 14,
  },
  algorithm: dark ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
  components: {
    Layout: {
      bodyBg: dark ? '#1a1a1a' : '#f5f5f5',
      headerBg: dark ? '#1f1f1f' : '#ffffff',
      siderBg: dark ? '#1f1f1f' : '#ffffff',
    },
    Card: {
      colorBgContainer: dark ? '#1f1f1f' : '#ffffff',
    },
    Menu: {
      colorBgContainer: dark ? '#1f1f1f' : '#ffffff',
    },
    Table: {
      colorBgContainer: dark ? '#1f1f1f' : '#ffffff',
    },
  },
});

export default createThemeConfig;
