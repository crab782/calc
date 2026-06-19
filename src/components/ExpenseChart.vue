<template>
  <el-card shadow="never" v-if="dailyDataWithPrediction.length === 0" class="chart-card">
    <el-empty :description="t.chart.noData">
      <template #description>
        <p>{{ t.chart.noData }}</p>
        <p class="hint-text">{{ t.chart.noDataHint }}</p>
      </template>
    </el-empty>
  </el-card>

  <el-card
    v-else
    shadow="never"
    class="chart-card"
  >
    <template #header>
      <span>{{ isZh ? '支出趋势' : 'Expense Trend' }}</span>
    </template>
    <div class="chart-container">
      <VChart :option="chartOption" style="width: 100%; height: 100%" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { useLanguage } from '../composables/useLanguage'
import { useTheme } from '../composables/useTheme'
import { useStatistics } from '../composables/useStatistics'

const { t, language } = useLanguage()
const { effectiveTheme } = useTheme()
const { dailyDataWithPrediction } = useStatistics()

const isZh = computed(() => language.value === 'zh')
const isDark = computed(() => effectiveTheme.value === 'dark')

const textColor = computed(() => isDark.value ? '#9ca3af' : '#6b7280')
const axisLineColor = computed(() => isDark.value ? '#4b5563' : '#d1d5db')
const splitLineColor = computed(() => isDark.value ? '#374151' : '#f3f4f6')
const tooltipBg = computed(() => isDark.value ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)')
const tooltipBorder = computed(() => isDark.value ? '#374151' : '#e5e7eb')

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const xAxisLabels = computed(() =>
  dailyDataWithPrediction.value.map(day => {
    const dayNum = parseInt(day.date.substring(8, 10))
    if (dayNum === 1) {
      const month = parseInt(day.date.substring(5, 7))
      return isZh.value ? `${month}月` : monthNames[month - 1]
    }
    return ''
  })
)

const actualData = computed(() =>
  dailyDataWithPrediction.value.map(day =>
    day.date <= todayStr ? day.expense : null
  )
)

const predictedData = computed(() =>
  dailyDataWithPrediction.value.map(day =>
    day.date >= todayStr ? day.expense : null
  )
)

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: tooltipBg.value,
    borderColor: tooltipBorder.value,
    borderWidth: 1,
    textStyle: {
      color: isDark.value ? '#e5e7eb' : '#374151',
    },
    formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number | null; dataIndex: number }[]) => {
      const validParams = params.filter((p: { value: number | null }) => p.value !== null)
      if (validParams.length === 0) return ''
      const dayData = dailyDataWithPrediction.value[validParams[0].dataIndex]
      if (!dayData) return ''

      const dateParts = dayData.date.split('-')
      const dateLabel = isZh.value
        ? `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`
        : `${monthNames[parseInt(dateParts[1]) - 1]} ${parseInt(dateParts[2])}, ${dateParts[0]}`

      const statusLabel = dayData.isActual
        ? (isZh.value ? '实际数据' : 'Actual')
        : (isZh.value ? '预测数据' : 'Predicted')

      let result = `<div style="font-weight: 600; margin-bottom: 8px;">${dateLabel}</div>`
      result += `<div style="font-size: 12px; color: ${textColor.value}; margin-bottom: 4px;">${statusLabel}</div>`

      validParams.forEach((item: { marker: string; seriesName: string; value: number | null }) => {
        const value = item.value ?? 0
        result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
          ${item.marker}
          <span>${item.seriesName}: ¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
        </div>`
      })

      return result
    },
  },
  legend: {
    data: [
      t.value.chart.expense,
      isZh.value ? '预测支出' : 'Predicted Expense',
    ],
    textStyle: {
      color: textColor.value,
    },
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: xAxisLabels.value,
    axisLine: {
      lineStyle: {
        color: axisLineColor.value,
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: textColor.value,
      fontSize: 12,
      interval: 0,
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: textColor.value,
      fontSize: 12,
      formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
    },
    splitLine: {
      lineStyle: {
        color: splitLineColor.value,
        type: 'dashed',
      },
    },
  },
  series: [
    {
      name: t.value.chart.expense,
      type: 'line',
      smooth: false,
      data: actualData.value,
      lineStyle: {
        color: '#ef4444',
        width: 2,
      },
      itemStyle: {
        color: '#ef4444',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
          ],
        },
      },
      symbol: 'circle',
      symbolSize: 4,
      emphasis: {
        scale: 1.5,
      },
      showSymbol: false,
    },
    {
      name: isZh.value ? '预测支出' : 'Predicted Expense',
      type: 'line',
      smooth: false,
      data: predictedData.value,
      lineStyle: {
        color: '#ef4444',
        width: 2,
        type: 'dashed',
      },
      itemStyle: {
        color: '#ef4444',
        opacity: 0.6,
      },
      symbol: 'circle',
      symbolSize: 4,
      emphasis: {
        scale: 1.5,
      },
      showSymbol: false,
    },
  ],
}))
</script>

<style scoped>
.chart-card {
  margin-bottom: 16px;
}

.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.chart-container {
  height: 320px;
}
</style>
