import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillDelivery(customer: {
    address: string;
    city: string;
    postcode: string;
  }) {
    await this.page.getByTestId('checkout-address').fill(customer.address);
    await this.page.getByTestId('checkout-city').fill(customer.city);
    await this.page.getByTestId('checkout-postcode').fill(customer.postcode);
  }

  async submit() {
    await this.page.getByTestId('checkout-submit').click();
  }

  get nameField() {
    return this.page.getByTestId('checkout-name');
  }

  get emailField() {
    return this.page.getByTestId('checkout-email');
  }

  get summary() {
    return this.page.getByTestId('checkout-summary');
  }

  get subtotal() {
    return this.page.getByTestId('checkout-subtotal');
  }

  get total() {
    return this.page.getByTestId('checkout-total');
  }

  get confirmation() {
    return this.page.getByTestId('order-confirmation');
  }

  get orderId() {
    return this.page.getByTestId('order-id');
  }

  get orderTotal() {
    return this.page.getByTestId('order-total');
  }

  get gstLabel() {
    return this.page.locator('text=GST (15%)');
  }
}
