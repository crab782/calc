import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { MainLayout } from '../layout/main-layout';
import { Accounts } from '../features/accounts';
import { FinancialConfig } from '../features/financial-config';
import { DashboardPage } from '../features/dashboard';
import { AddRecordPage } from '../features/records/add';
import { HistoryPage } from '../features/records/history';
import { SettingsPage } from '../features/settings';
import { ExchangeRatePage } from '../features/exchange-rate';
import { BudgetPlanPage } from '../features/budget/plan';
import { BudgetCalculatorPage } from '../features/budget/calculator';

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
      <Route path={ROUTES.RECORDS_ADD} element={<AddRecordPage />} />
      <Route path={ROUTES.RECORDS_HISTORY} element={<HistoryPage />} />
      <Route path={ROUTES.ACCOUNTS} element={<Accounts />} />
      <Route path={ROUTES.BUDGET_PLAN} element={<BudgetPlanPage />} />
      <Route path={ROUTES.BUDGET_CALCULATOR} element={<BudgetCalculatorPage />} />
      <Route path={ROUTES.FINANCIAL_CONFIG} element={<FinancialConfig />} />
      <Route path={ROUTES.EXCHANGE_RATE} element={<ExchangeRatePage />} />
      <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Route>
  </Routes>
);
