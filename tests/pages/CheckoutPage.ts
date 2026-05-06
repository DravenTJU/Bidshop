import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  readonly form: {
    name: Locator;
    email: Locator;
    address: Locator;
    city: Locator;
    postcode: Locator;
    submit: Locator;
    error: Locator;
  };
  readonly orderSummary: {
    root: Locator;
    subtotal: Locator;
    total: Locator;
    gstLabel: Locator;
  };
  readonly confirmation: {
    root: Locator;
    orderId: Locator;
    total: Locator;
  };

  constructor(page: Page) {
    super(page);
    this.form = {
      name:     page.getByTestId('checkout-name'),
      email:    page.getByTestId('checkout-email'),
      address:  page.getByTestId('checkout-address'),
      city:     page.getByTestId('checkout-city'),
      postcode: page.getByTestId('checkout-postcode'),
      submit:   page.getByTestId('checkout-submit'),
      error:    page.getByTestId('checkout-error'),
    };
    this.orderSummary = {
      root:     page.getByTestId('checkout-summary'),
      subtotal: page.getByTestId('checkout-subtotal'),
      total:    page.getByTestId('checkout-total'),
      gstLabel: page.locator('text=GST (15%)'),
    };
    this.confirmation = {
      root:    page.getByTestId('order-confirmation'),
      orderId: page.getByTestId('order-id'),
      total:   page.getByTestId('order-total'),
    };
  }

  async fillDelivery(customer: { address: string; city: string; postcode: string }) {
    await this.form.address.fill(customer.address);
    await this.form.city.fill(customer.city);
    await this.form.postcode.fill(customer.postcode);
  }

  async submit() {
    await this.form.submit.click();
  }
}
