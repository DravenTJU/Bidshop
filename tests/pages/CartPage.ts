import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly summary: {
    subtotal: Locator;
    gst: Locator;
    total: Locator;
  };
  readonly emptyState: Locator;
  readonly loginRequired: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.summary = {
      subtotal: page.getByTestId('cart-subtotal'),
      gst:      page.getByTestId('cart-gst'),
      total:    page.getByTestId('cart-total'),
    };
    this.emptyState     = page.getByTestId('cart-empty');
    this.loginRequired  = page.getByTestId('cart-login-required');
    this.checkoutButton = page.getByTestId('cart-checkout');
  }

  async goToCart() { await this.page.goto('/cart'); }

  async proceedToCheckout() {
    await this.nav.cart.click();
    await this.checkoutButton.click();
  }

  /** All locators scoped to a single cart line — computed on call, no DOM touch. */
  item(productId: string) {
    return {
      row:       this.page.getByTestId(`cart-row-${productId}`),
      qty:       this.page.getByTestId(`cart-qty-${productId}`),
      lineTotal: this.page.getByTestId(`cart-line-total-${productId}`),
      remove:    this.page.getByTestId(`cart-remove-${productId}`),
    };
  }

  async setQuantity(productId: string, qty: number) {
    const { qty: input } = this.item(productId);
    await input.fill(String(qty));
    await input.press('Tab');
  }

  async removeItem(productId: string) {
    await this.item(productId).remove.click();
  }
}
