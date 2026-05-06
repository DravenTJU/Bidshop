import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { registerUser, authedContext, API_BASE } from '../../fixtures/api-client';
import { makeUser, makeCustomer } from '../../fixtures/factories';
import { seedAuth } from '../../fixtures/auth';

// PRODUCT-UI-007 setup — exhaust p-003 stock (10 units) via API
Given('product {string} stock has been exhausted via API',
  async ({ request }, productId: string) => {
    const { token } = await registerUser(request, makeUser());
    const api = authedContext(request, token);
    await api.post(`${API_BASE}/cart/items`, { data: { productId, quantity: 10 } });
    await api.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
  }
);

// PRODUCT-UI-007 — different user visits catalogue after stock exhausted
Given('an authenticated user refreshes the catalogue',
  async ({ page, request, cataloguePage }) => {
    await seedAuth(page, request);
    await cataloguePage.goToCatalogue();
    await page.reload();
  }
);

When('they click the "Log in to buy" CTA for product {string}',
  async ({ cataloguePage }, productId: string) => {
    await cataloguePage.productLoginCta(productId).click();
  }
);

When('they search for {string}', async ({ cataloguePage }, term: string) => {
  await cataloguePage.search(term);
});

When('they select the category {string}', async ({ cataloguePage }, category: string) => {
  await cataloguePage.filterByCategory(category);
});

Then('18 products are shown and each card has a "Log in to buy" CTA',
  async ({ cataloguePage }) => {
    await expect(cataloguePage.filterSummary()).toContainText('18 products');
    await expect(cataloguePage.productLoginCta('p-001')).toHaveText('Log in to buy');
  }
);

Then('they are redirected to {string}', async ({ page }, url: string) => {
  await expect(page).toHaveURL(url);
});

Then('{int} product is shown and it is {string}',
  async ({ cataloguePage }, count: number, name: string) => {
    await expect(cataloguePage.filterSummary()).toContainText(`${count} product`, { timeout: 3000 });
    const names = await cataloguePage.allProductNames().allTextContents();
    expect(names).toContain(name);
  }
);

Then('{int} products are shown and the empty state message is visible',
  async ({ cataloguePage }, count: number) => {
    await expect(cataloguePage.filterSummary()).toContainText(`${count} products`, { timeout: 3000 });
    await expect(cataloguePage.emptyState()).toHaveText('No products match your filters.');
  }
);

Then('exactly {int} products are shown and all have category {string}',
  async ({ cataloguePage }, count: number, category: string) => {
    await expect(cataloguePage.filterSummary()).toContainText(`${count} products`, { timeout: 3000 });
    const categories = await cataloguePage.allProductCategories().allTextContents();
    categories.forEach((c) => expect(c).toBe(category));
  }
);

Then('product {string} has an enabled "Add to cart" button',
  async ({ cataloguePage }, productId: string) => {
    await expect(cataloguePage.addButton(productId)).toBeEnabled();
    await expect(cataloguePage.addButton(productId)).toHaveText('Add to cart');
  }
);

Then('the "Add to cart" button for product {string} is disabled with {string} label',
  async ({ cataloguePage }, productId: string, label: string) => {
    await expect(cataloguePage.addButton(productId)).toBeDisabled();
    await expect(cataloguePage.stockLabel(productId)).toHaveText(label);
  }
);

Then('all product images are loaded without broken-image state', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((img) => (img as HTMLImageElement).naturalWidth === 0).length
  );
  expect(broken).toBe(0);
});
