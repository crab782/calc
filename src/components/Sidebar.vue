<template>
  <el-aside
    width="240px"
    class="sidebar"
  >
    <div class="sidebar-header">
      <div class="sidebar-title">{{ t.sidebar.title }}</div>
      <el-button
        type="info"
        link
        size="small"
        @click="onCollapse"
        :title="t.sidebar.collapse || '折叠侧边栏'"
      >
        <el-icon :size="16"><Close /></el-icon>
      </el-button>
    </div>
    <el-menu
      :default-active="currentPage"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <el-menu-item index="dashboard">
        <el-icon><Odometer /></el-icon>
        <span>{{ t.sidebar.dashboard }}</span>
      </el-menu-item>
      <el-menu-item index="history">
        <el-icon><Clock /></el-icon>
        <span>{{ t.sidebar.history }}</span>
      </el-menu-item>
      <el-menu-item index="accounts">
        <el-icon><Wallet /></el-icon>
        <span>{{ t.sidebar.accounts }}</span>
      </el-menu-item>
      <el-menu-item v-if="hasMultiCurrency" index="exchange-rate">
        <el-icon><Money /></el-icon>
        <span>{{ t.sidebar.exchangeRate }}</span>
      </el-menu-item>
      <el-menu-item index="financial-config">
        <el-icon><Setting /></el-icon>
        <span>{{ t.sidebar.financialConfig }}</span>
      </el-menu-item>
      <el-menu-item index="budget-plan">
        <el-icon><Aim /></el-icon>
        <span>{{ t.sidebar.budgetPlan }}</span>
      </el-menu-item>
      <el-menu-item index="budget-calculator">
        <el-icon><Tools /></el-icon>
        <span>{{ t.sidebar.budgetCalculator }}</span>
      </el-menu-item>
      <el-menu-item index="add-record">
        <el-icon><CirclePlus /></el-icon>
        <span>{{ t.sidebar.addRecord }}</span>
      </el-menu-item>
      <el-menu-item index="settings">
        <el-icon><Setting /></el-icon>
        <span>{{ t.sidebar.settings }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Odometer,
  Clock,
  Wallet,
  Money,
  Setting,
  Aim,
  CirclePlus,
  Close,
  Tools,
} from '@element-plus/icons-vue'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'

interface SidebarProps {
  onCollapse: () => void
}

const props = defineProps<SidebarProps>()

const router = useRouter()
const route = useRoute()
const { t } = useLanguage()
const { accounts } = useRecords()

const defaultCurrency = computed(() =>
  accounts.value.find(a => a.isDefault)?.currency || 'CNY'
)

const hasMultiCurrency = computed(() =>
  accounts.value.some(a => a.currency !== defaultCurrency.value && a.visible)
)

const currentPage = computed(() => {
  const path = route.path
  if (path === '/calc' || path === '/calc/') return 'dashboard'
  return path.replace('/calc/', '') || 'dashboard'
})

function handleSelect(key: string) {
  if (key === 'dashboard') {
    router.push('/calc/')
  } else {
    router.push(`/calc/${key}`)
  }
}
</script>

<style scoped>
.sidebar {
  border-right: 1px solid var(--el-border-color-light, #d9d9d9);
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: auto;
  background: var(--el-bg-color, #fff);
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary, #000);
}

.sidebar-menu {
  border-right: none;
}
</style>
