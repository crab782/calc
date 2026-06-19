import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../providers/theme-provider';

export interface BaseChartProps {
  option: any;
  style?: React.CSSProperties;
  autoResize?: boolean;
}

export function BaseChart({ option, style, autoResize = true }: BaseChartProps) {
  const { effectiveTheme } = useTheme();

  const baseOption = {
    grid: { top: 40, right: 20, bottom: 40, left: 50 },
    textStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI"' },
    ...option,
  };

  return (
    <ReactECharts
      option={baseOption}
      style={{ height: 300, ...style }}
      theme={effectiveTheme === 'dark' ? 'dark' : undefined}
      opts={{ renderer: 'canvas' }}
      autoResize={autoResize}
    />
  );
}
