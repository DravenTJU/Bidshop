import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  get navUserName() {
    return this.page.getByTestId('nav-user-name');
  }

  get navCartCount() {
    return this.page.getByTestId('nav-cart-count');
  }

  get navCart() {
    return this.page.getByTestId('nav-cart');
  }

  get navLogout() {
    return this.page.getByTestId('nav-logout');
  }
}
