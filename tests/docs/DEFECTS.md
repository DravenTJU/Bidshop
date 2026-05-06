# Known defects (surfaced by tests)

Five scenarios are marked as intentional known failures (`test.fail()` / `@fail @known-bug`). The suite exits 0; each turns green once the underlying issue is fixed.

| ID | Layer | Summary |
|----|-------|---------|
| `GST-API-001` | API | Cart GST rate is 12.5%; spec states 15% |
| `AUTH-UI-006` | UI | Authenticated user can re-register instead of being redirected |
| `PRODUCT-UI-008` | UI | Product images on catalogue load with errors |
| `CART-UI-006` | UI | Stale-token session — Proceed to checkout is not guarded |
| `GST-UI-001` | UI | "GST (15%)" label does not match actual 12.5% cart calculation |

---

## GST-API-001 / GST-UI-001 — GST rate inconsistency

**Files:** `backend/src/routes/cart.ts:25` and `backend/src/routes/orders.ts:57`

**Symptom:** The cart endpoint calculates GST as `subtotal × 0.125` (12.5%), while the order endpoint uses `subtotal × 0.15` (15%). The UI label and spec both state 15%. A customer sees a lower total in their cart than what they are charged at confirmation — a trust-critical discrepancy at the most sensitive moment of the purchase funnel.

**Test strategy:** `api/gst-consistency.spec.ts` marks the cart assertion with `test.fail()`. In the BDD layer, `GST-UI-001` uses the `@fail` tag. Both mean the suite exits 0 today; both turn green automatically once the bug is fixed — free regression coverage at zero ongoing cost.

**Reproduction:**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"T","email":"t@t.test","password":"pass01"}' | jq -r .token)

curl -s http://localhost:4000/cart \
  -H "Authorization: Bearer $TOKEN" | jq '{subtotal, gst, expectedAt15pct: (.subtotal * 0.15)}'
```

---

## AUTH-UI-006 — No redirect guard on /register for authenticated users

**Symptom:** A user who is already logged in can navigate to `/register` and submit the form to create a second account, replacing their session. Expected behaviour: redirect to `/` (or show "already signed in").

---

## PRODUCT-UI-008 — Product image load errors on catalogue page

**Symptom:** One or more product image requests return a non-2xx status. Customers see broken image icons on the product grid. Expected behaviour: all `<img>` elements on `/` load successfully.

---

## CART-UI-006 — Stale token does not block "Proceed to checkout"

**Symptom:** A user whose token has expired can still click "Proceed to checkout" from the cart page and reach `/checkout`. The 401 error only surfaces when they attempt to place the order. Expected behaviour: the cart page should detect the stale session and redirect to `/login`.
