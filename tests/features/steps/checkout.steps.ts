import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { seedAuth } from '../../fixtures/auth';
import { makeCustomer, makeUser } from '../../fixtures/factories';
import { registerUser, authedContext, API_BASE } from '../../fixtures/api-client';

// CHECKOUT-UI-004 only — stores customer for later steps
Given('a registered user on the catalogue with customer delivery details',
  async ({ page, request, scenarioContext }) => {
    const customer = makeCustomer();
    scenarioContext.customer = customer;
    const result = await seedAuth(page, request, { name: customer.name, email: customer.email });
    scenarioContext.userData = result;
  }
);

When('they proceed through cart to checkout', async ({ page, cartPage }) => {
  await cartPage.proceedToCheckout();
  await expect(page).toHaveURL('/checkout');
});

When('they fill in their delivery details', async ({ checkoutPage, scenarioContext }) => {
  const customer = scenarioContext.customer!;
  await checkoutPage.fillDelivery({
    address: customer.address,
    city: customer.city,
    postcode: customer.postcode,
  });
});

When('they click Submit without filling the address', async ({ checkoutPage }) => {
  await checkoutPage.submit();
});

When('they view the cart page', async ({ page }) => {
  await page.goto('/cart');
});

Then('the name and email fields are pre-filled from registration',
  async ({ checkoutPage, scenarioContext }) => {
    await expect(checkoutPage.nameField).toHaveValue(scenarioContext.userData!.user.name);
    await expect(checkoutPage.emailField).toHaveValue(scenarioContext.userData!.user.email);
  }
);

Then('the order summary and pricing are visible', async ({ checkoutPage }) => {
  await expect(checkoutPage.summary).toBeVisible();
  await expect(checkoutPage.subtotal).toContainText('$');
  await expect(checkoutPage.total).toContainText('$');
});

Then('no confirmation is shown and the URL stays {string}',
  async ({ page, checkoutPage }, url: string) => {
    await expect(checkoutPage.confirmation).not.toBeVisible();
    await expect(page).toHaveURL(url);
  }
);

Then('the order is confirmed and the cart badge disappears',
  async ({ page, checkoutPage, cartPage }) => {
    await checkoutPage.submit();
    await expect(checkoutPage.confirmation).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
    await expect(checkoutPage.orderId).toBeVisible();
    const confirmedTotal = await checkoutPage.orderTotal.textContent();
    expect(confirmedTotal).toMatch(/^\$\d+\.\d{2}$/);
    await expect(cartPage.navCartCount).not.toBeVisible();
  }
);

Then('the GST label is rendered', async ({ checkoutPage }) => {
  await expect(checkoutPage.gstLabel).toBeVisible();
});

Then('the GST amount matches 15% of the subtotal', async ({ cartPage }) => {
  const subtotalText = await cartPage.subtotal.textContent();
  const gstText = await cartPage.gst.textContent();
  const subtotal = parseFloat(subtotalText!.replace('$', ''));
  const gst = parseFloat(gstText!.replace('$', ''));
  const expected15PctGst = parseFloat((subtotal * 0.15).toFixed(2));
  // This assertion FAILS because the cart API returns 12.5% GST — @fail tag is intentional
  expect(gst).toBeCloseTo(expected15PctGst, 2);
});

Given('user A has {string} in cart and is on checkout while user B exhausts its remaining stock',
  async ({ page, request, scenarioContext }, productId: string) => {
    const productRes = await request.get(`${API_BASE}/products/${productId}`);
    expect(productRes.status()).toBe(200);
    const product = await productRes.json();
    const stock: number = product.stock ?? 0;
    expect(stock, `${productId} must have stock before this scenario starts`).toBeGreaterThan(0);

    const userA = await registerUser(request, makeUser());
    const userB = await registerUser(request, makeUser());
    scenarioContext.userData = { token: userA.token, user: userA.user };

    const apiA = authedContext(request, userA.token);
    const apiB = authedContext(request, userB.token);

    await apiA.post(`${API_BASE}/cart/items`, { data: { productId, quantity: stock } });
    await apiB.post(`${API_BASE}/cart/items`, { data: { productId, quantity: stock } });

    const orderRes = await apiB.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
    expect(orderRes.status()).toBe(201);

    await page.addInitScript((token) => {
      localStorage.setItem('bidshop.token', token);
    }, userA.token);
    await page.goto('/');
    await expect(page.getByTestId('nav-user-name')).toBeVisible({ timeout: 10000 });
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-address')).toBeVisible({ timeout: 3000 });
  }
);

Given('they have filled in delivery details', async ({ checkoutPage }) => {
  await checkoutPage.fillDelivery({
    address: '12 Queen Street',
    city: 'Auckland',
    postcode: '1010',
  });
});

When('they click Submit twice rapidly', async ({ page }) => {
  // Fire both clicks in the same JS microtask so React cannot disable the button between them
  await page.getByTestId('checkout-submit').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="checkout-submit"]') as HTMLButtonElement;
    btn.click();
    btn.click();
  });
});

When('they submit the checkout form with valid delivery details',
  async ({ checkoutPage, scenarioContext }) => {
    const user = scenarioContext.userData?.user;
    if (user) {
      await checkoutPage.nameField.fill(user.name);
      await checkoutPage.emailField.fill(user.email);
    }
    await checkoutPage.fillDelivery({
      address: '12 Queen Street',
      city: 'Auckland',
      postcode: '1010',
    });
    await checkoutPage.submit();
  }
);

Then('only one order confirmation is shown',
  async ({ request, checkoutPage, scenarioContext }) => {
    await expect(checkoutPage.confirmation).toBeVisible({ timeout: 5000 });
    const api = authedContext(request, scenarioContext.userData!.token);
    const res = await api.get(`${API_BASE}/orders`);
    const body = await res.json();
    const orders: unknown[] = Array.isArray(body) ? body : (body.items ?? body.orders ?? []);
    expect(orders).toHaveLength(1);
  }
);

Then('the checkout form is shown despite the invalid token', async ({ checkoutPage }) => {
  await expect(checkoutPage.summary).toBeVisible();
  await expect(checkoutPage.nameField).toBeVisible();
});

Then('an authorization error {string} is shown', async ({ page, checkoutPage }, message: string) => {
  await expect(checkoutPage.confirmation).not.toBeVisible();
  await expect(page.getByTestId('checkout-error')).toHaveText(message);
});

Then('a stock-unavailable error is shown instead of a confirmation',
  async ({ page, checkoutPage }) => {
    await expect(checkoutPage.confirmation).not.toBeVisible();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
  }
);
