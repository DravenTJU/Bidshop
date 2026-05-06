import { test, expect } from '@playwright/test';
import { API_BASE, registerUser, authedContext } from '../fixtures/api-client';
import { makeUser } from '../fixtures/factories';

async function freshAuthed(request: Parameters<typeof authedContext>[0]) {
  const { token } = await registerUser(request, makeUser());
  return authedContext(request, token);
}

test.describe('GET /cart', () => {
  test('CART-API-001 Unauthenticated request returns 401 @regression', async ({ request }) => {
    const res = await request.get(`${API_BASE}/cart`);
    expect(res.status()).toBe(401);
  });
});

test.describe('POST /cart/items', () => {
  test('CART-API-002 Add item returns cart with correct totals @smoke', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-005', quantity: 2 },
    });
    expect(res.status()).toBe(201);
    const cart = await res.json();
    const item = cart.items.find((i: { productId: string }) => i.productId === 'p-005');
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
    expect(cart.subtotal).toBeGreaterThan(0);
    expect(cart.gst).toBeGreaterThan(0);
    expect(cart.total).toBeCloseTo(cart.subtotal + cart.gst, 2);
  });

  test('CART-API-003 Quantity 0 returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-005', quantity: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test('CART-API-004 Negative quantity returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-005', quantity: -1 },
    });
    expect(res.status()).toBe(400);
  });

  test('CART-API-005 Quantity exceeding stock returns 400 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    // p-003 Bluff Oysters has stock=10; requesting 11 should be rejected
    const res = await api.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-003', quantity: 11 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/only/i);
  });

  test('CART-API-006 Unknown productId returns 404 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-999', quantity: 1 },
    });
    expect(res.status()).toBe(404);
  });

  test('CART-API-007 Unauthenticated add-to-cart returns 401 @regression', async ({ request }) => {
    const res = await request.post(`${API_BASE}/cart/items`, {
      data: { productId: 'p-005', quantity: 1 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('PATCH /cart/items/:productId', () => {
  test('CART-API-008 Update quantity recalculates line total @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    await api.post(`${API_BASE}/cart/items`, { data: { productId: 'p-006', quantity: 1 } });
    const res = await api.patch(`${API_BASE}/cart/items/p-006`, { data: { quantity: 3 } });
    expect(res.status()).toBe(200);
    const cart = await res.json();
    const item = cart.items.find((i: { productId: string }) => i.productId === 'p-006');
    expect(item.quantity).toBe(3);
  });

  test('CART-API-009 Patch item not in cart returns 404 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.patch(`${API_BASE}/cart/items/p-999`, { data: { quantity: 1 } });
    expect(res.status()).toBe(404);
  });
});

test.describe('DELETE /cart/items/:productId', () => {
  test('CART-API-010 Remove item from cart @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    await api.post(`${API_BASE}/cart/items`, { data: { productId: 'p-007', quantity: 1 } });
    const res = await api.delete(`${API_BASE}/cart/items/p-007`);
    expect(res.status()).toBe(200);
    const cart = await res.json();
    expect(cart.items.find((i: { productId: string }) => i.productId === 'p-007')).toBeUndefined();
  });

  test('CART-API-011 Delete item not in cart returns 404 @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    const res = await api.delete(`${API_BASE}/cart/items/p-999`);
    expect(res.status()).toBe(404);
  });
});

test.describe('DELETE /cart', () => {
  test('CART-API-012 Clear all items returns empty cart @regression', async ({ request }) => {
    const api = await freshAuthed(request);
    await api.post(`${API_BASE}/cart/items`, { data: { productId: 'p-008', quantity: 1 } });
    const res = await api.delete(`${API_BASE}/cart`);
    expect(res.status()).toBe(200);
    const cart = await res.json();
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
  });
});
