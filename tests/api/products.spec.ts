import { test, expect } from '@playwright/test';
import { API_BASE } from '../fixtures/api-client';

test.describe('GET /products', () => {
  test('PRODUCT-API-001 Returns all 18 seeded products with count @smoke',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(18);
      expect(body.items).toHaveLength(18);
    },
  );

  test('PRODUCT-API-002 Category filter Dairy returns exactly 3 products @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products?category=Dairy`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(3);
      body.items.forEach((p: { category: string }) =>
        expect(p.category).toBe('Dairy'),
      );
    },
  );

  test('PRODUCT-API-003 Search "salmon" matches Wild NZ King Salmon Fillet @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products?search=salmon`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.count).toBeGreaterThanOrEqual(1);
      const names: string[] = body.items.map((p: { name: string }) => p.name);
      expect(names).toContain('Wild NZ King Salmon Fillet');
    },
  );

  test('PRODUCT-API-004 Price range filter narrows results correctly @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products?minPrice=10&maxPrice=15`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      body.items.forEach((p: { price: number }) => {
        expect(p.price).toBeGreaterThanOrEqual(10);
        expect(p.price).toBeLessThanOrEqual(15);
      });
    },
  );

  test('PRODUCT-API-005 inStock=true excludes products with zero stock @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products?inStock=true`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      body.items.forEach((p: { stock: number }) => expect(p.stock).toBeGreaterThan(0));
    },
  );

  test('PRODUCT-API-006 Non-matching search returns empty items array @regression',
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/products?search=ZZZNOMATCH9999`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(0);
      expect(body.items).toHaveLength(0);
    },
  );
});

test.describe('GET /products/categories', () => {
  test('PRODUCT-API-007 Returns the 8 seeded categories @regression', async ({ request }) => {
    const res = await request.get(`${API_BASE}/products/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const expected = [
      'Meat & Poultry', 'Seafood', 'Fresh Produce', 'Dairy',
      'Bakery', 'Pantry', 'Frozen', 'Beverages',
    ];
    expect(body.categories.sort()).toEqual(expected.sort());
  });
});

test.describe('GET /products/:id', () => {
  test('PRODUCT-API-008 Known product ID returns the product @smoke', async ({ request }) => {
    const res = await request.get(`${API_BASE}/products/p-001`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('p-001');
    expect(body.name).toBe('NZ Grass-Fed Beef Mince');
  });

  test('PRODUCT-API-009 Unknown product ID returns 404 @regression', async ({ request }) => {
    const res = await request.get(`${API_BASE}/products/p-999`);
    expect(res.status()).toBe(404);
  });
});
