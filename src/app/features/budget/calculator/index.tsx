import { useParams } from 'react-router-dom';
import type { BudgetProfileType } from '../../../../domain/budget/types';
import { ProfileHeader } from './components/profile-header';
import { BalanceView } from './profiles/balance-view';
import { IncomeView } from './profiles/income-view';
import { ExpenseView } from './profiles/expense-view';

const profileNames: Record<BudgetProfileType, string> = {
  balance: '账户结余计算器',
  income: '收入计算器',
  expense: '支出计算器',
};

export function BudgetCalculatorPage() {
  const { profile } = useParams<{ profile: string }>();
  const profileType = profile as BudgetProfileType;
  const title = profileNames[profileType] ?? '预算计算器';

  return (
    <div>
      <ProfileHeader title={title} profileType={profileType} />
      {profileType === 'balance' && <BalanceView />}
      {profileType === 'income' && <IncomeView />}
      {profileType === 'expense' && <ExpenseView />}
    </div>
  );
}
