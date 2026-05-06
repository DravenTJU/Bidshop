import { expect } from '@playwright/test';
import { Given, When } from './fixtures';
import { seedAuth } from '../../fixtures/auth';
import { makeCustomer } from '../../fixtures/factories';

// Used by: browse (PRODUCT-UI-001–005), cart (CART-UI-001 visitor check)
Given('a visitor on the catalogue', async ({ cataloguePage }) => {
  await cataloguePage.goToCatalogue();
});

// Used by: browse (PRODUCT-UI-006), cart (CART-UI-002), checkout golden path
Given('an authenticated user on the catalogue',
  async ({ page, request, scenarioContext }) => {
    const result = await seedAuth(page, request);
    scenarioContext.userData = result;
    // seedAuth navigates to / which is the catalogue — no extra goto needed
  }
);

// Used by: cart (CART-UI-004)
Given('an authenticated user with product {string} in the cart',
  async ({ page, request, cataloguePage, cartPage, scenarioContext }, productId: string) => {
    const result = await seedAuth(page, request);
    scenarioContext.userData = result;
    // Fail fast with assertion (not timeout) if the button is disabled (e.g. stock exhausted)
    await expect(cataloguePage.addButton(productId)).toBeEnabled({ timeout: 3000 });
    await cataloguePage.addProduct(productId);
    await expect(cartPage.navCartCount).toBeVisible();
    await cartPage.goToCart();
  }
);

// Used by: cart (CART-UI-003)
Given('an authenticated user with product {string} in the cart at unit price {string}',
  async ({ page, request, cataloguePage, cartPage, scenarioContext }, productId: string, unitPrice: string) => {
    const result = await seedAuth(page, request);
    scenarioContext.userData = result;
    await cataloguePage.addProduct(productId);
    await expect(cartPage.navCartCount).toBeVisible();
    await cartPage.goToCart();
    await expect(cartPage.lineTotal(productId)).toHaveText(unitPrice);
  }
);

// Used by: checkout (CHECKOUT-UI-001, 002, 003, 005, GST-UI-001)
Given('an authenticated user at checkout with product {string}',
  async ({ page, request, cataloguePage, cartPage, scenarioContext }, productId: string) => {
    const result = await seedAuth(page, request);
    scenarioContext.userData = result;
    await cataloguePage.addProduct(productId);
    await expect(cataloguePage.addMessage(productId)).toContainText('Added to cart');
    await expect(cartPage.navCartCount).toBeVisible();
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL('/checkout');
  }
);

// Used by: cart (CART-UI-002), checkout golden path (CHECKOUT-UI-004)
When('they add product {string} to the cart',
  async ({ cataloguePage }, productId: string) => {
    await expect(cataloguePage.addButton(productId)).toBeVisible();
    await cataloguePage.addProduct(productId);
    await expect(cataloguePage.addMessage(productId)).toContainText('Added to cart');
  }
);

// Used by: cart (CART-UI-005)
Given('a visitor with a stale authentication token',
  async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'bidshop.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InN0YWxlIiwiaWF0IjoxfQ.invalidsignature',
      );
    });
    await page.goto('/');
  }
);

// Used by: cart (CART-UI-006) after the cart page has already rendered as authenticated.
Given('their authentication token becomes invalid', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('bidshop.token');
  });
});
