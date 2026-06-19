import type { RecordType } from './types';

export const RECORD_TYPES: RecordType[] = ['income', 'expense', 'transfer', 'investment', 'loan-receive', 'loan-repay'];

export const DEFAULT_CATEGORIES = {
  income: ['工资', '奖金', '兼职', '理财', '报销', '礼金', '其他'],
  expense: ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '通讯', '其他'],
};
