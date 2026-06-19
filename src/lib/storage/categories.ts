import type { Category } from '../../types/record';
import type { SchemaManager } from './schema';

export class CategoryStore {
  schema: SchemaManager;
  constructor(schema: SchemaManager) {
    this.schema = schema;
  }

  getCategories(): Category[] {
    const schema = this.schema.getSchema();
    return [...schema.categories];
  }

  saveCategories(categories: Category[]): void {
    const schema = this.schema.getSchema();
    schema.categories = categories;
    this.schema.saveSchema(schema);
  }

  addCategory(category: Category): void {
    const schema = this.schema.getSchema();
    schema.categories.push(category);
    this.schema.saveSchema(schema);
  }

  deleteCategory(id: string): void {
    const schema = this.schema.getSchema();
    schema.categories = schema.categories.filter((c) => c.id !== id);
    this.schema.saveSchema(schema);
  }

  updateCategory(category: Category): void {
    const schema = this.schema.getSchema();
    const index = schema.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      schema.categories[index] = category;
      this.schema.saveSchema(schema);
    }
  }
}
