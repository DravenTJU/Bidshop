import { Locator, Page } from '@playwright/test';

export class BasePage {
  readonly nav: {
    userName: Locator;
    cartCount: Locator;
    cart: Locator;
    logout: Locator;
  };

  constructor(protected page: Page) {
    this.nav = {
      userName: page.getByTestId('nav-user-name'),
      cartCount: page.getByTestId('nav-cart-count'),
      cart: page.getByTestId('nav-cart'),
      logout: page.getByTestId('nav-logout'),
    };
  }
}
