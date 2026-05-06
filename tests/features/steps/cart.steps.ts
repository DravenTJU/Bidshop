import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

Given('a visitor who navigates directly to the cart page', async ({ cartPage }) => {
  await cartPage.goToCart();
});

When('they change the quantity of {string} to {int}',
  async ({ cartPage }, productId: string, qty: number) => {
    await cartPage.setQuantity(productId, qty);
  }
);

When('they remove product {string}', async ({ cartPage }, productId: string) => {
  await cartPage.removeItem(productId);
});

Then('a login-required prompt is shown with a login link', async ({ cartPage }) => {
  await expect(cartPage.loginRequired).toBeVisible();
  await expect(cartPage.loginRequired).toContainText('Please');
  await expect(cartPage.loginRequired.getByRole('link')).toBeVisible();
});

Then('the nav badge shows {string}', async ({ cartPage }, count: string) => {
  await expect(cartPage.navCartCount).toHaveText(count);
});

Then('the cart contains product {string}', async ({ cartPage }, productId: string) => {
  await cartPage.goToCart();
  await expect(cartPage.cartRow(productId)).toBeVisible();
});

Then('the line total for {string} is {string}',
  async ({ cartPage }, productId: string, total: string) => {
    await expect(cartPage.lineTotal(productId)).toHaveText(total, { timeout: 3000 });
  }
);

Then('cart totals are non-zero', async ({ cartPage }) => {
  const subtotalText = await cartPage.subtotal.textContent();
  expect(parseFloat(subtotalText!.replace('$', ''))).toBeGreaterThan(0);
  const totalText = await cartPage.total.textContent();
  expect(parseFloat(totalText!.replace('$', ''))).toBeGreaterThan(0);
});

Then('the empty cart state is shown', async ({ cartPage }) => {
  await expect(cartPage.emptyState).toBeVisible();
});

Then('the nav cart badge disappears', async ({ cartPage }) => {
  await expect(cartPage.navCartCount).not.toBeVisible();
});

When('they navigate to the cart page', async ({ cartPage }) => {
  await cartPage.goToCart();
});

When('they click Proceed to checkout', async ({ cartPage }) => {
  await cartPage.checkoutButton.click();
});

Then('a re-login prompt is shown instead of a raw API error', async ({ cartPage }) => {
  // @fail: stale-token 401 currently renders a raw error, not the login-required prompt
  await expect(cartPage.loginRequired).toBeVisible();
});
