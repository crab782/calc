export const ROUTES = {
  DASHBOARD: '/dashboard',
  RECORDS_ADD: '/records/add',
  RECORDS_HISTORY: '/records/history',
  ACCOUNTS: '/accounts',
  BUDGET_PLAN: '/budget',
  BUDGET_CALCULATOR: '/budget/calc/:profile',
  FINANCIAL_CONFIG: '/financial-config',
  EXCHANGE_RATE: '/exchange-rate',
  SETTINGS: '/settings',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
