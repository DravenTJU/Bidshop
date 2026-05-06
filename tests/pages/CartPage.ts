import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goToCart() {
    await this.page.goto('/cart');
  }

  async proceedToCheckout() {
    await this.page.getByTestId('nav-cart').click();
    await this.page.getByTestId('cart-checkout').click();
  }

  async setQuantity(productId: string, qty: number) {
    await this.page.getByTestId(`cart-qty-${productId}`).fill(String(qty));
    await this.page.getByTestId(`cart-qty-${productId}`).press('Tab');
  }

  async removeItem(productId: string) {
    await this.page.getByTestId(`cart-remove-${productId}`).click();
  }

  cartRow(productId: string) {
    return this.page.getByTestId(`cart-row-${productId}`);
  }

  lineTotal(productId: string) {
    return this.page.getByTestId(`cart-line-total-${productId}`);
  }

  get subtotal() {
    return this.page.getByTestId('cart-subtotal');
  }

  get total() {
    return this.page.getByTestId('cart-total');
  }

  get gst() {
    return this.page.getByTestId('cart-gst');
  }

  get emptyState() {
    return this.page.getByTestId('cart-empty');
  }

  get loginRequired() {
    return this.page.getByTestId('cart-login-required');
  }

  get checkoutButton() {
    return this.page.getByTestId('cart-checkout');
  }
}
