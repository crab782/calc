<template>
  <div class="budget-calculator-page">
    <div class="page-header">
      <el-button text size="small" @click="router.push('/budget-plan')">
        <el-icon><ArrowLeft /></el-icon>
        返回预算计划
      </el-button>
      <h4 class="page-title" style="margin: 0">
        <el-space>
          <el-icon :size="20"><component :is="budgetTypeIcons[budgetType]" /></el-icon>
          {{ budgetTypeNames[budgetType] }}
        </el-space>
      </h4>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="8">
        <el-card class="config-card" title="配置参数" style="border-radius: 8px">
          <el-space direction="vertical" :size="24" style="width: 100%">
            <div>
              <strong class="section-label">选择账户 (最多3个)</strong>
              <el-select
                v-model="selectedAccountIds"
                multiple
                placeholder="选择账户"
                style="width: 100%"
                :max-collapse-tags="3"
                @change="handleAccountSelect"
              >
                <el-option
                  v-for="acc in visibleAccounts"
                  :key="acc.id"
                  :label="`${acc.name} (${acc.currency})`"
                  :value="acc.id"
                />
              </el-select>
            </div>

            <div>
              <strong class="section-label">周期单位</strong>
              <el-select v-model="periodUnit" style="width: 100%" @change="handlePeriodUnitChange">
                <el-option label="月份" value="month" />
                <el-option label="年份" value="year" />
              </el-select>
            </div>

            <div>
              <strong class="section-label">周期数: {{ periodCount }} {{ periodUnit === 'month' ? '个月' : '年' }}</strong>
              <el-slider
                v-model="periodCount"
                :min="1"
                :max="periodUnit === 'month' ? 60 : 5"
                :marks="sliderMarks"
              />
            </div>

            <el-space direction="vertical" style="width: 100%">
              <el-button type="primary" style="width: 100%" @click="handleCalculate">开始计算</el-button>
              <el-button style="width: 100%" @click="handleExport">
                <el-icon :size="14"><Download /></el-icon>
                导出CSV
              </el-button>
            </el-space>
          </el-space>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <template v-if="calculationResult.length === 0">
          <el-card style="border-radius: 8px">
            <el-empty description="请选择账户并设置周期后点击计算" />
          </el-card>
        </template>
        <template v-else>
          <el-space direction="vertical" :size="24" style="width: 100%">
            <el-card class="chart-card" title="预算趋势" style="border-radius: 8px">
              <VChart :option="lineChartOption" style="height: 400px" />
            </el-card>

            <el-card class="chart-card" title="账户预算对比" style="border-radius: 8px">
              <VChart :option="barChartOption" style="height: 400px" />
            </el-card>

            <el-card class="chart-card" title="最终周期预算占比" style="border-radius: 8px">
              <VChart :option="pieChartOption" style="height: 400px" />
            </el-card>

            <el-card class="chart-card" title="详细数据" style="border-radius: 8px">
              <div v-for="result in calculationResult" :key="result.accountId" class="result-section">
                <strong>{{ result.accountName }} ({{ result.currency }})</strong>
                <el-table
                  size="small"
                  :data="result.periods"
                  row-key="index"
                  style="margin-top: 8px"
                  :pagination="false"
                >
                  <el-table-column label="周期" prop="label" />
                  <el-table-column label="预计余额" prop="estimatedAmount">
                    <template #default="{ row }">¥{{ row.estimatedAmount.toFixed(2) }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-space>
        </template>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Download, Top, Histogram, Coin } from '@element-plus/icons-vue'
import { useRecords } from '../composables/useRecords'
import type { BudgetPeriodUnit, BudgetCalculationResult } from '../types/record'

const route = useRoute()
const router = useRouter()
const budgetType = computed(() => (route.query.type as string) || 'balance')

const { accounts, calculateBudget, exportBudgetToCSV } = useRecords()

const selectedAccountIds = ref<string[]>([])
const periodUnit = ref<BudgetPeriodUnit>('month')
const periodCount = ref(6)
const calculationResult = ref<BudgetCalculationResult[]>([])

const visibleAccounts = computed(() =>
  accounts.value.filter(
    acc => acc.visible === true && ['cash', 'investment', 'loan'].includes(acc.accountType)
  )
)

const budgetTypeNames: Record<string, string> = {
  balance: '账户余额预测',
  trend: '收入支出趋势',
  savings: '储蓄目标规划',
}
const budgetTypeIcons: Record<string, object> = {
  balance: markRaw(Top),
  trend: markRaw(Histogram),
  savings: markRaw(Coin),
}

const sliderMarks = computed(() => {
  const max = periodUnit.value === 'month' ? 60 : 5
  return {
    1: '1',
    [periodUnit.value === 'month' ? 12 : 1]: periodUnit.value === 'month' ? '1年' : '1',
    [max]: periodUnit.value === 'month' ? '5年' : '5',
  }
})

const handleAccountSelect = (val: string[]) => {
  if (val.length > 3) {
    ElMessage.warning('最多只能选择3个账户')
    selectedAccountIds.value = val.slice(0, 3)
  }
}

const handlePeriodUnitChange = () => {
  periodCount.value = periodUnit.value === 'month' ? 6 : 2
}

const handleCalculate = () => {
  if (selectedAccountIds.value.length === 0) {
    ElMessage.warning('请至少选择一个账户')
    return
  }
  if (selectedAccountIds.value.length > 3) {
    ElMessage.warning('最多只能选择3个账户')
    return
  }
  const result = calculateBudget(selectedAccountIds.value, periodUnit.value, periodCount.value)
  calculationResult.value = result
  ElMessage.success('预算计算完成')
}

const handleExport = () => {
  if (calculationResult.value.length === 0) {
    ElMessage.warning('请先进行预算计算')
    return
  }
  const csv = exportBudgetToCSV(calculationResult.value)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `预算计划_${new Date().toLocaleDateString()}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const CHART_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2']

const lineChartOption = computed(() => {
  if (calculationResult.value.length === 0) return {}
  const series = calculationResult.value.map((result, index) => ({
    name: result.accountName,
    type: 'line',
    data: result.periods.map(p => p.estimatedAmount),
    smooth: true,
    itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
    lineStyle: { width: 2 },
  }))
  return {
    title: { text: '预算趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: calculationResult.value[0]?.periods.map(p => p.label) || [] },
    yAxis: { type: 'value' },
    series,
    grid: { left: 60, right: 20, top: 50, bottom: 60 },
  }
})

const barChartOption = computed(() => {
  if (calculationResult.value.length === 0) return {}
  const series = calculationResult.value.map((result, index) => ({
    name: result.accountName,
    type: 'bar',
    data: result.periods.map(p => p.estimatedAmount),
    itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
  }))
  return {
    title: { text: '账户预算对比', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: calculationResult.value[0]?.periods.map(p => p.label) || [] },
    yAxis: { type: 'value' },
    series,
    grid: { left: 60, right: 20, top: 50, bottom: 60 },
  }
})

const pieChartOption = computed(() => {
  if (calculationResult.value.length === 0) return {}
  const data = calculationResult.value.map((result, index) => ({
    name: result.accountName,
    value: result.periods[result.periods.length - 1]?.estimatedAmount || 0,
    itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
  }))
  return {
    title: { text: '最终周期预算占比', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%' },
      data,
    }],
  }
})

</script>

<style scoped>
.budget-calculator-page {
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
}
.config-card {
  border-radius: 8px;
}
.section-label {
  display: block;
  margin-bottom: 8px;
}
.chart-card {
  border-radius: 8px;
}
.result-section {
  margin-bottom: 16px;
}
</style>
