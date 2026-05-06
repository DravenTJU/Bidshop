import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CataloguePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goToCatalogue() {
    await this.page.goto('/');
  }

  async search(term: string) {
    await this.page.getByTestId('filter-search').fill(term);
  }

  async filterByCategory(category: string) {
    await this.page.selectOption('[data-testid=filter-category]', category);
  }

  async addProduct(productId: string) {
    await this.page.getByTestId(`product-add-${productId}`).click();
  }

  filterSummary() {
    return this.page.getByTestId('filter-summary');
  }

  emptyState() {
    return this.page.getByTestId('empty-state');
  }

  productLoginCta(productId: string) {
    return this.page.getByTestId(`product-login-${productId}`);
  }

  addButton(productId: string) {
    return this.page.getByTestId(`product-add-${productId}`);
  }

  addMessage(productId: string) {
    return this.page.getByTestId(`product-message-${productId}`);
  }

  stockLabel(productId: string) {
    return this.page.getByTestId(`product-stock-${productId}`);
  }

  allProductCategories() {
    return this.page.locator('[data-testid^="product-category-"]');
  }

  allProductNames() {
    return this.page.locator('[data-testid^="product-name-"]');
  }
}
