import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CataloguePage extends BasePage {
  readonly filter: {
    search: Locator;
    category: Locator;
    summary: Locator;
    emptyState: Locator;
  };

  constructor(page: Page) {
    super(page);
    this.filter = {
      search:     page.getByTestId('filter-search'),
      category:   page.locator('[data-testid=filter-category]'),
      summary:    page.getByTestId('filter-summary'),
      emptyState: page.getByTestId('empty-state'),
    };
  }

  async goToCatalogue() { await this.page.goto('/'); }

  async search(term: string) {
    await this.filter.search.fill(term);
  }

  async filterByCategory(category: string) {
    await this.filter.category.selectOption(category);
  }

  async addProduct(productId: string) {
    await this.product(productId).addButton.click();
  }

  /** All locators scoped to a single product card — computed on call, no DOM touch. */
  product(id: string) {
    return {
      loginCta:  this.page.getByTestId(`product-login-${id}`),
      addButton: this.page.getByTestId(`product-add-${id}`),
      addMessage: this.page.getByTestId(`product-message-${id}`),
      stockLabel: this.page.getByTestId(`product-stock-${id}`),
    };
  }

  allProductNames()      { return this.page.locator('[data-testid^="product-name-"]'); }
  allProductCategories() { return this.page.locator('[data-testid^="product-category-"]'); }
}
