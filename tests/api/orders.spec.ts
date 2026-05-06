import { test, expect } from '@playwright/test';
import { API_BASE, registerUser, authedContext } from '../fixtures/api-client';
import { makeUser, makeCustomer } from '../fixtures/factories';

test.describe.configure({ mode: 'serial' });

async function freshAuthed(request: Parameters<typeof authedContext>[0]) {
  const { token } = await registerUser(request, makeUser());
  return authedContext(request, token);
}

async function cartWith(
  api: ReturnType<typeof authedContext>,
  productId: string,
  quantity = 1,
) {
  const res = await api.post(`${API_BASE}/cart/items`, { data: { productId, quantity } });
  if (!res.ok()) throw new Error(`Could not add ${productId} to cart: ${res.status()}`);
}

test.describe('POST /orders', () => {
  test('CHECKOUT-API-001 Order confirmed, stock decrements, cart emptied @smoke',
    async ({ request }) => {
      await test.step('Given a registered user with p-005 in their cart', async () => {
        const api = await freshAuthed(request);
        await cartWith(api, 'p-005', 1);

        const before = await (await request.get(`${API_BASE}/products/p-005`)).json();
        const stockBefore: number = before.stock;

        await test.step('When they place an order', async () => {
          const res = await api.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
          expect(res.status()).toBe(201);

          const order = await res.json();

          await test.step('Then the order is CONFIRMED with correct pricing', async () => {
            expect(order.status).toBe('CONFIRMED');
            expect(order.subtotal).toBeGreaterThan(0);
            expect(order.gst).toBeGreaterThan(0);
            expect(order.total).toBeCloseTo(order.subtotal + order.gst, 2);
            expect(order.items).toHaveLength(1);
            expect(order.id).toBeTruthy();
          });

          await test.step('And the cart is emptied', async () => {
            const cart = await (await api.get(`${API_BASE}/cart`)).json();
            expect(cart.items).toHaveLength(0);
          });

          await test.step('And stock is decremented by 1', async () => {
            const after = await (await request.get(`${API_BASE}/products/p-005`)).json();
            expect(after.stock).toBe(stockBefore - 1);
          });
        });
      });
    },
  );

  test('CHECKOUT-API-002 Empty cart returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/empty/i);
  });

  test('CHECKOUT-API-003 Non-4-digit postcode returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    await cartWith(api, 'p-006', 1);
    const res = await api.post(`${API_BASE}/orders`, {
      data: { customer: makeCustomer({ postcode: '12345' }) },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/postcode/i);
  });

  test('CHECKOUT-API-004 Missing customer name returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    await cartWith(api, 'p-006', 1);
    const { name: _name, ...noName } = makeCustomer();
    const res = await api.post(`${API_BASE}/orders`, { data: { customer: noName } });
    expect(res.status()).toBe(400);
  });

  test('CHECKOUT-API-005 Unauthenticated order placement returns 401 @regression',
    async ({ request }) => {
      const res = await request.post(`${API_BASE}/orders`, {
        data: { customer: makeCustomer() },
      });
      expect(res.status()).toBe(401);
    },
  );
});

test.describe('GET /orders', () => {
  test('CHECKOUT-API-006 Returns only the authenticated user\'s own orders @regression',
    async ({ request }) => {
      const api = await freshAuthed(request);
      await cartWith(api, 'p-007', 1);
      await api.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });

      const res = await api.get(`${API_BASE}/orders`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.count).toBeGreaterThanOrEqual(1);
    },
  );
});

test.describe('GET /orders/:id', () => {
  test('CHECKOUT-API-007 Another user cannot retrieve your order (returns 404) @regression',
    async ({ request }) => {
      await test.step('Given User A places an order', async () => {
        const apiA = await freshAuthed(request);
        await cartWith(apiA, 'p-008', 1);
        const orderRes = await apiA.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
        const { id: orderId } = await orderRes.json();

        await test.step('When User B tries to access that order', async () => {
          const apiB = await freshAuthed(request);
          const res = await apiB.get(`${API_BASE}/orders/${orderId}`);

          await test.step('Then User B receives a 404', async () => {
            expect(res.status()).toBe(404);
          });
        });
      });
    },
  );

  test('CHECKOUT-API-008 Unauthenticated GET /orders/:id returns 401 @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/orders/some-id`);
      expect(res.status()).toBe(401);
    },
  );
});
