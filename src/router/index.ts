import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/calc/',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
  },
  {
    path: '/calc/add-record',
    name: 'AddRecord',
    component: () => import('../pages/AddRecord.vue'),
  },
  {
    path: '/calc/history',
    name: 'History',
    component: () => import('../pages/History.vue'),
  },
  {
    path: '/calc/settings',
    name: 'Settings',
    component: () => import('../pages/Settings.vue'),
  },
  {
    path: '/calc/exchange-rate',
    name: 'ExchangeRate',
    component: () => import('../pages/ExchangeRate.vue'),
  },
  {
    path: '/calc/accounts',
    name: 'Accounts',
    component: () => import('../pages/Accounts.vue'),
  },
  {
    path: '/calc/financial-config',
    name: 'FinancialConfig',
    component: () => import('../pages/FinancialConfig.vue'),
  },
  {
    path: '/calc/budget-plan',
    name: 'BudgetPlan',
    component: () => import('../pages/BudgetPlan.vue'),
  },
  {
    path: '/calc/budget-calculator',
    name: 'BudgetCalculator',
    component: () => import('../pages/BudgetCalculator.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
