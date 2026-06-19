<template>
  <div>
    <div class="dashboard-header">
      <h4 class="dashboard-title">{{ t.dashboard.title }}</h4>
      <el-button size="small" @click="toggleLanguage">
        <el-icon><Switch /></el-icon>
        {{ language === 'zh' ? 'EN' : '中文' }}
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-space :size="16">
            <div class="stat-icon income-icon">
              <el-icon :size="24" color="#22c55e"><TrendCharts /></el-icon>
            </div>
            <div>
              <span class="stat-label">{{ t.dashboard.totalIncome }}</span>
              <div class="stat-value income-color">{{ formatCurrency(statistics.totalIncome) }}</div>
            </div>
          </el-space>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-space :size="16">
            <div class="stat-icon expense-icon">
              <el-icon :size="24" color="#ef4444"><TrendCharts /></el-icon>
            </div>
            <div>
              <span class="stat-label">{{ t.dashboard.totalExpense }}</span>
              <div class="stat-value expense-color">{{ formatCurrency(statistics.totalExpense) }}</div>
            </div>
          </el-space>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-space :size="16">
            <div class="stat-icon balance-icon">
              <el-icon :size="24" color="#3b82f6"><Wallet /></el-icon>
            </div>
            <div>
              <span class="stat-label">{{ t.dashboard.balance }}</span>
              <div class="stat-value balance-color">{{ formatCurrency(statistics.balance) }}</div>
            </div>
          </el-space>
        </el-card>
      </el-col>
    </el-row>

    <div class="charts-section">
      <BalanceChart />
      <ExpenseChart />
      <IncomeChart />
    </div>

    <el-card class="recent-card" :body-style="{ padding: 0 }">
      <template #header>
        <span>{{ t.dashboard.recentTransactions }}</span>
      </template>
      <div v-if="recentRecords.length === 0" class="empty-wrapper">
        <el-empty>
          <template #description>
            <p>{{ t.dashboard.noRecords }}</p>
            <p class="hint-text">{{ t.dashboard.addFirstRecord }}</p>
          </template>
        </el-empty>
      </div>
      <div v-else>
        <div v-for="record in recentRecords" :key="record.id" class="record-item">
          <div class="record-main">
            <div class="record-meta">
              <el-tag :type="record.type === 'income' ? 'success' : 'danger'" size="small">
                {{ record.type === 'income' ? t.dashboard.income : t.dashboard.expense }}
              </el-tag>
              <span class="record-category">{{ record.category }}</span>
              <span class="record-note">{{ record.note || record.category }}</span>
            </div>
            <span class="record-date">{{ formatDate(record.date) }}</span>
          </div>
          <div class="record-actions">
            <span
              class="record-amount"
              :class="record.type === 'income' ? 'income-color' : 'expense-color'"
            >
              {{ record.type === 'income' ? '+' : '-' }}{{ formatCurrency(record.amount) }}
            </span>
            <el-popconfirm
              :title="t.common?.confirmDelete || '确定删除?'"
              @confirm="deleteRecord(record.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts, Wallet, Delete, Switch } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BalanceChart from '../components/BalanceChart.vue'
import ExpenseChart from '../components/ExpenseChart.vue'
import IncomeChart from '../components/IncomeChart.vue'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'
import { useStatistics } from '../composables/useStatistics'

const { t, language, toggleLanguage } = useLanguage()
const { getRecentRecords, deleteRecord } = useRecords()
const { statistics, formatCurrency, formatDate } = useStatistics()

const recentRecords = computed(() => getRecentRecords(10))
</script>

<style scoped>
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.dashboard-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.stats-row {
  margin-bottom: 32px;
}
.stat-card :deep(.el-card__body) {
  padding: 20px;
}
.stat-icon {
  padding: 12px;
  border-radius: 8px;
}
.income-icon {
  background-color: rgba(34, 197, 94, 0.1);
}
.expense-icon {
  background-color: rgba(239, 68, 68, 0.1);
}
.balance-icon {
  background-color: rgba(59, 130, 246, 0.1);
}
.stat-label {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.income-color {
  color: #22c55e;
}
.expense-color {
  color: #ef4444;
}
.balance-color {
  color: #3b82f6;
}
.charts-section {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.recent-card {
  margin-bottom: 16px;
}
.empty-wrapper {
  padding: 48px 0;
}
.hint-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.record-item:last-child {
  border-bottom: none;
}
.record-main {
  flex: 1;
}
.record-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.record-category {
  font-size: 14px;
  color: #909399;
}
.record-note {
  font-size: 14px;
  font-weight: 600;
}
.record-date {
  font-size: 12px;
  color: #909399;
}
.record-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.record-amount {
  font-size: 16px;
  font-weight: 600;
}
</style>
