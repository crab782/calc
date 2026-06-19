import type { IncomeRule, FinancialSource, FinancialSourceType, BudgetPlan } from '../../types/record';
import type { SchemaManager } from './schema';

export class FinancialSourceStore {
  schema: SchemaManager;
  constructor(schema: SchemaManager) {
    this.schema = schema;
  }

  getIncomeRules(): IncomeRule[] {
    const schema = this.schema.getSchema();
    return [...schema.incomeRules];
  }

  saveIncomeRules(incomeRules: IncomeRule[]): void {
    const schema = this.schema.getSchema();
    schema.incomeRules = incomeRules;
    this.schema.saveSchema(schema);
  }

  addIncomeRule(incomeRule: IncomeRule): void {
    const schema = this.schema.getSchema();
    schema.incomeRules.push(incomeRule);
    this.schema.saveSchema(schema);
  }

  deleteIncomeRule(id: string): void {
    const schema = this.schema.getSchema();
    schema.incomeRules = schema.incomeRules.filter((r) => r.id !== id);
    this.schema.saveSchema(schema);
  }

  updateIncomeRule(incomeRule: IncomeRule): void {
    const schema = this.schema.getSchema();
    const index = schema.incomeRules.findIndex((r) => r.id === incomeRule.id);
    if (index >= 0) {
      schema.incomeRules[index] = incomeRule;
      this.schema.saveSchema(schema);
    }
  }

  getFinancialSources(): FinancialSource[] {
    const schema = this.schema.getSchema();
    return [...(schema.financialSources || [])];
  }

  getFinancialSourcesByType(type: FinancialSourceType): FinancialSource[] {
    const schema = this.schema.getSchema();
    return (schema.financialSources || []).filter((s) => s.type === type);
  }

  addFinancialSource(source: FinancialSource): void {
    const schema = this.schema.getSchema();
    if (!schema.financialSources) {
      schema.financialSources = [];
    }
    schema.financialSources.push(source);
    this.schema.saveSchema(schema);
  }

  updateFinancialSource(id: string, updates: Partial<FinancialSource>): void {
    const schema = this.schema.getSchema();
    if (!schema.financialSources) {
      schema.financialSources = [];
    }
    const index = schema.financialSources.findIndex((s) => s.id === id);
    if (index >= 0) {
      schema.financialSources[index] = { ...schema.financialSources[index], ...updates };
      this.schema.saveSchema(schema);
    }
  }

  deleteFinancialSource(id: string): void {
    const schema = this.schema.getSchema();
    if (!schema.financialSources) {
      schema.financialSources = [];
    }
    schema.financialSources = schema.financialSources.filter((s) => s.id !== id);
    this.schema.saveSchema(schema);
  }

  getBudgetPlans(): BudgetPlan[] {
    const schema = this.schema.getSchema();
    return [...(schema.budgetPlans || [])];
  }

  addBudgetPlan(plan: BudgetPlan): void {
    const schema = this.schema.getSchema();
    if (!schema.budgetPlans) {
      schema.budgetPlans = [];
    }
    schema.budgetPlans.push(plan);
    this.schema.saveSchema(schema);
  }

  deleteBudgetPlan(id: string): void {
    const schema = this.schema.getSchema();
    if (!schema.budgetPlans) {
      schema.budgetPlans = [];
    }
    schema.budgetPlans = schema.budgetPlans.filter((p) => p.id !== id);
    this.schema.saveSchema(schema);
  }
}
