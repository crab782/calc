<template>
  <div>
    <h4 class="page-title">
      <el-icon class="title-icon" color="#1677ff"><Clock /></el-icon>
      {{ t.history.title }}
    </h4>

    <div v-if="sortedMonths.length === 0" class="empty-wrapper">
      <el-card>
        <el-empty>
          <template #description>
            <p>{{ t.history.noRecords }}</p>
            <p class="hint-text">{{ t.history.addFirstRecord }}</p>
          </template>
        </el-empty>
      </el-card>
    </div>

    <div v-else class="months-container">
      <el-card v-for="month in sortedMonths" :key="month" class="month-card">
        <template #header>
          <div class="month-header">
            <span>{{ formatMonth(month) }}</span>
            <div class="month-summary">
              <span class="summary-item income-summary">
                <el-icon color="#22c55e"><Top /></el-icon>
                {{ t.history.income }}:
                <span class="income-color">+{{ formatCurrency(groupedRecords[month].totalIncome) }}</span>
              </span>
              <span class="summary-item expense-summary">
                <el-icon color="#ef4444"><Bottom /></el-icon>
                {{ t.history.expense }}:
                <span class="expense-color">-{{ formatCurrency(groupedRecords[month].totalExpense) }}</span>
              </span>
            </div>
          </div>
        </template>
        <el-table :data="groupedRecords[month].records" row-key="id" size="default" :pagination="false">
          <el-table-column :label="t.history.time" prop="date" width="140">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column :label="t.history.category" prop="category" min-width="120" />
          <el-table-column :label="t.history.amount" width="140">
            <template #default="{ row }">
              <span
                class="amount-text"
                :class="row.type === 'income' ? 'income-color' : 'expense-color'"
              >
                {{ row.type === 'income' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t.history.type" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.type === 'income' ? t.history.incomeType : t.history.expenseType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t.history.description" prop="note" min-width="120">
            <template #default="{ row }">
              {{ row.note || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, Top, Bottom } from '@element-plus/icons-vue'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'
import { useStatistics } from '../composables/useStatistics'
import type { ExpenseRecord } from '../types/record'

const { t, language } = useLanguage()
const { records } = useRecords()
const { formatCurrency, formatDate } = useStatistics()

interface GroupedData {
  records: ExpenseRecord[]
  totalIncome: number
  totalExpense: number
}

const groupedRecords = computed<Record<string, GroupedData>>(() => {
  const grouped: Record<string, GroupedData> = {}
  const sortedRecords = [...records.value].sort((a, b) => b.date.localeCompare(a.date))
  sortedRecords.forEach((record) => {
    const monthKey = record.date.substring(0, 7)
    if (!grouped[monthKey]) {
      grouped[monthKey] = { records: [], totalIncome: 0, totalExpense: 0 }
    }
    grouped[monthKey].records.push(record)
    if (record.type === 'income') {
      grouped[monthKey].totalIncome += record.amount
    } else {
      grouped[monthKey].totalExpense += record.amount
    }
  })
  return grouped
})

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  return language.value === 'zh' ? `${year}年${parseInt(month)}月` : `${year}-${month}`
}

const sortedMonths = computed(() =>
  Object.keys(groupedRecords.value).sort((a, b) => b.localeCompare(a))
)
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}
.title-icon {
  margin-right: 8px;
}
.empty-wrapper {
  margin-top: 16px;
}
.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.months-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.month-card {
  margin-bottom: 0;
}
.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.month-summary {
  display: flex;
  gap: 24px;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.income-color {
  color: #22c55e;
  font-weight: 600;
}
.expense-color {
  color: #ef4444;
  font-weight: 600;
}
.amount-text {
  font-weight: 600;
}
</style>
