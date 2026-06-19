import type { Account } from './types';

/**
 * 创建默认账户列表
 * 包含5类默认账户：现金、银行卡、微信、支付宝（均为支出账户）和工资卡（收入账户）
 * @param currency 账户币种，默认为 'CNY'
 */
export function createDefaultAccounts(currency: string = 'CNY'): Account[] {
  return [
    {
      id: `${currency}-cash`,
      name: '现金',
      type: 'expense',
      currency,
      balance: 0,
      visible: true,
      isDefault: true,
    },
    {
      id: `${currency}-bank-card`,
      name: '银行卡',
      type: 'expense',
      currency,
      balance: 0,
      visible: true,
      isDefault: false,
    },
    {
      id: `${currency}-wechat`,
      name: '微信',
      type: 'expense',
      currency,
      balance: 0,
      visible: true,
      isDefault: false,
    },
    {
      id: `${currency}-alipay`,
      name: '支付宝',
      type: 'expense',
      currency,
      balance: 0,
      visible: true,
      isDefault: false,
    },
    {
      id: `${currency}-salary`,
      name: '工资卡',
      type: 'income',
      currency,
      balance: 0,
      visible: false,
      isDefault: false,
    },
  ];
}
