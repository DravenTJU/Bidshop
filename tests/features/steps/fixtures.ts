import { test as base, createBdd } from 'playwright-bdd';
import { AuthPage }      from '../../pages/AuthPage';
import { CataloguePage } from '../../pages/CataloguePage';
import { CartPage }      from '../../pages/CartPage';
import { CheckoutPage }  from '../../pages/CheckoutPage';
import type { makeCustomer } from '../../fixtures/factories';

export type ScenarioContext = {
  userData?: { token: string; user: { id: string; email: string; name: string } };
  customer?: ReturnType<typeof makeCustomer>;
};

export const test = base.extend<{
  authPage:        AuthPage;
  cataloguePage:   CataloguePage;
  cartPage:        CartPage;
  checkoutPage:    CheckoutPage;
  scenarioContext: ScenarioContext;
}>({
  authPage:        async ({ page }, use) => use(new AuthPage(page)),
  cataloguePage:   async ({ page }, use) => use(new CataloguePage(page)),
  cartPage:        async ({ page }, use) => use(new CartPage(page)),
  checkoutPage:    async ({ page }, use) => use(new CheckoutPage(page)),
  scenarioContext: async ({}, use) => {
    const ctx: ScenarioContext = {};
    await use(ctx);
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
