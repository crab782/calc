import { ref, computed } from 'vue'
import { recordService } from '../lib/record'
import type { Statistics, MonthlyData, MonthlyDataWithPrediction, DailyData } from '../lib/record'

export const useStatistics = () => {
  const refreshKey = ref(0)

  const statistics = computed<Statistics>(() => {
    void refreshKey.value
    return recordService.getStatistics()
  })

  const monthlyData = computed<MonthlyData[]>(() => {
    void refreshKey.value
    return recordService.getMonthlyData()
  })

  const monthlyDataWithPrediction = computed<MonthlyDataWithPrediction[]>(() => {
    void refreshKey.value
    return recordService.generateMonthlyDataWithPrediction()
  })

  const dailyDataWithPrediction = computed<DailyData[]>(() => {
    void refreshKey.value
    return recordService.generateDailyDataWithPrediction()
  })

  const refresh = () => {
    refreshKey.value += 1
  }

  const formatCurrency = (amount: number) => {
    return recordService.formatCurrency(amount)
  }

  const formatDate = (dateString: string) => {
    return recordService.formatDate(dateString)
  }

  return {
    statistics,
    monthlyData,
    monthlyDataWithPrediction,
    dailyDataWithPrediction,
    refresh,
    formatCurrency,
    formatDate,
  }
}
