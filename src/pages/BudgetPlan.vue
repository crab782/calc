<template>
  <div class="budget-plan-page">
    <h4 class="page-title">预算计划</h4>
    <p class="page-desc">选择一个预算类型开始规划您的财务未来</p>
    <el-row :gutter="24">
      <el-col v-for="type in budgetTypes" :key="type.key" :xs="24" :sm="12" :md="8">
        <el-card
          class="budget-type-card"
          shadow="hover"
          @click="navigateToCalculator(type.key)"
        >
          <div class="card-body">
            <div class="icon-wrapper" :style="{ backgroundColor: type.color + '15', color: type.color }">
              <el-icon :size="28"><component :is="type.icon" /></el-icon>
            </div>
            <div class="text-section">
              <strong class="title-text">{{ type.title }}</strong>
              <span class="desc-text">{{ type.description }}</span>
            </div>
            <div class="action-text" :style="{ color: type.color }">
              <el-space>
                <span>开始规划</span>
                <el-icon :size="16"><ArrowRight /></el-icon>
              </el-space>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Top, Histogram, Coin, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()

const budgetTypes = [
  { key: 'balance', title: '账户余额预测', description: '预测账户未来余额变化趋势', icon: Top, color: '#1677ff' },
  { key: 'trend', title: '收入支出趋势', description: '分析未来收支趋势和变化', icon: Histogram, color: '#52c41a' },
  { key: 'savings', title: '储蓄目标规划', description: '规划储蓄目标和实现进度', icon: Coin, color: '#fa8c16' },
]

const navigateToCalculator = (key: string) => {
  router.push(`/budget-calculator?type=${key}`)
}
</script>

<style scoped>
.budget-plan-page {
  padding: 24px;
}
.page-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}
.page-desc {
  color: #909399;
  margin: 0 0 32px 0;
  font-size: 16px;
}
.budget-type-card {
  border-radius: 12px;
  height: 100%;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}
.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
}
.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text-section {
  margin-top: 16px;
}
.title-text {
  font-size: 18px;
  display: block;
  margin-bottom: 8px;
}
.desc-text {
  color: #909399;
  font-size: 14px;
}
.action-text {
  margin-top: 16px;
}
</style>
