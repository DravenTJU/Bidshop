/**
 * GST rate consistency between cart and order API responses.
 *
 * README states: "Cart totals include GST at 15% (computed on the server)."
 *
 * KNOWN BUG: backend/src/routes/cart.ts line 25 uses `subtotal * 0.125` (12.5%)
 * while backend/src/routes/orders.ts line 57 correctly uses `subtotal * 0.15` (15%).
 *
 * GST-API-001 uses test.fail() to assert the CORRECT 15% behaviour.
 * It appears as an expected failure in Azure Test Plans — visible, tracked, not hidden.
 * When the bug is fixed, test.fail() will cause the test to fail (alerting the team
 * to remove it), giving free regression coverage.
 *
 * Repro:
 *   TOKEN=$(curl -s -X POST http://localhost:4000/auth/register \
 *     -H 'Content-Type: application/json' \
 *     -d '{"name":"T","email":"t@t.com","password":"pass01"}' | jq -r .token)
 *   curl -s http://localhost:4000/cart \
 *     -H "Authorization: Bearer $TOKEN" | jq '{subtotal,gst,expected:(.subtotal*0.15)}'
 */
import { test, expect } from '@playwright/test';
import { API_BASE, registerUser, authedContext } from '../fixtures/api-client';
import { makeUser, makeCustomer } from '../fixtures/factories';

test.describe('GST rate consistency', () => {
  test.fail(
    'GST-API-001 Cart GST should equal subtotal × 0.15 — currently returns 0.125 @known-bug',
    async ({ request }) => {
      const { token } = await registerUser(request, makeUser());
      const api = authedContext(request, token);

      // p-008 Anchor Full Cream Milk @ $5.40 — known price for deterministic assertion
      await api.post(`${API_BASE}/cart/items`, { data: { productId: 'p-008', quantity: 1 } });
      const cart = await (await api.get(`${API_BASE}/cart`)).json();

      const expectedGst = Number((cart.subtotal * 0.15).toFixed(2));
      // This assertion FAILS — cart.ts returns 12.5% GST, not 15%
      expect(cart.gst).toBeCloseTo(expectedGst, 2);
    },
  );

  test('GST-API-002 Order GST equals subtotal × 0.15 (correct behaviour) @regression',
    async ({ request }) => {
      const { token } = await registerUser(request, makeUser());
      const api = authedContext(request, token);

      await api.post(`${API_BASE}/cart/items`, { data: { productId: 'p-009', quantity: 1 } });
      const orderRes = await api.post(`${API_BASE}/orders`, { data: { customer: makeCustomer() } });
      const order = await orderRes.json();

      const expectedGst = Number((order.subtotal * 0.15).toFixed(2));
      expect(order.gst).toBeCloseTo(expectedGst, 2);
      expect(order.total).toBeCloseTo(order.subtotal + order.gst, 2);
    },
  );
});
