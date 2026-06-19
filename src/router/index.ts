import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
  },
  {
    path: '/add-record',
    name: 'AddRecord',
    component: () => import('../pages/AddRecord.vue'),
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../pages/History.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/Settings.vue'),
  },
  {
    path: '/exchange-rate',
    name: 'ExchangeRate',
    component: () => import('../pages/ExchangeRate.vue'),
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../pages/Accounts.vue'),
  },
  {
    path: '/financial-config',
    name: 'FinancialConfig',
    component: () => import('../pages/FinancialConfig.vue'),
  },
  {
    path: '/budget-plan',
    name: 'BudgetPlan',
    component: () => import('../pages/BudgetPlan.vue'),
  },
  {
    path: '/budget-calculator',
    name: 'BudgetCalculator',
    component: () => import('../pages/BudgetCalculator.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/calc'),
  routes,
})

export default router
