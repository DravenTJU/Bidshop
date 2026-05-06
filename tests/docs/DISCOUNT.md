# Feature Plan: 10% Discount on Orders ≥ NZD $100

> *"Give customers a 10% discount on any order with a subtotal over NZD $100."*
> — Product team request

This document outlines the clarifying questions, technical changes, test strategy, regression plan, and pre-launch checklist for implementing this feature in Bidshop.

---

## 1. Clarifying Questions

Before writing a single line of code I would ask the product owner and relevant engineers:

1. **Threshold semantics:** Is the threshold *inclusive* (subtotal ≥ $100) or *exclusive* (subtotal > $100)? A $100.00 order is the edge case that will come up in tests and in production disputes.

2. **GST timing:** Is the $100 measured against the *pre-GST subtotal* or the *total including GST*? Given the existing GST bug (cart uses 12.5%, order uses 15%), this decision must be made explicit — and the bug should be fixed first.

3. **Discount ordering:** Does the 10% apply to the subtotal before or after other future discounts (loyalty points, promo codes)? If Bidshop plans a promotions engine, where does this rule sit in the chain?

4. **Customer scope:** All customers, or only registered / B2B accounts? Bidshop currently requires login to purchase, so this may already be implied.

5. **Persistence and auditability:** Should the discount amount and reason be stored on the order record (for invoicing, returns, and audits), or is it recomputed at display time?

6. **Partial refunds / cancellations:** If an order is partially refunded and the new subtotal drops below $100, is the discount reversed?

7. **UI surface:** Where should the discount appear?
   - Cart page: as a "You've unlocked 10% off!" banner?
   - As a nudge: "Spend $X more to unlock 10% off"?
   - Checkout page: as a line item in the totals?
   - Order confirmation: as a line item with the saved amount shown?
   - Order history: in the order detail view?

8. **Currency:** Is this NZD-only? If Bidfood expands internationally, the threshold will need to be parameterised.

---

## 2. Data Model Changes

### `Order` (backend/src/types.ts)

Add two optional fields so the discount is auditable on every order:

```typescript
discount?: number;        // Amount saved (e.g. 10.50), 0 or absent when not applied
discountReason?: string;  // "SUBTOTAL_OVER_100" — extensible for future rule types
```

### Cart response (no persistent change — computed on the fly)

The serialised cart object (`GET /cart`) should include:

```typescript
eligibleForDiscount: boolean;  // subtotal >= 100
discountPreview?: number;       // subtotal * 0.10 when eligible, for the UI nudge
amountToDiscount: number;       // max(0, 100 - subtotal) — "spend $X more" value
```

---

## 3. API Changes

### `GET /cart`

- Add `eligibleForDiscount`, `discountPreview`, and `amountToDiscount` fields to the response from `serialiseCart()`.
- `total` remains the pre-discount total at cart stage (so the discount is a checkout moment, not forced at browsing time) — *unless* the product owner wants the discount previewed in the cart total.

### `POST /orders`

- After computing `subtotal`, apply the discount:
  ```typescript
  const discountApplies = subtotal >= 100;
  const discount = discountApplies ? Number((subtotal * 0.10).toFixed(2)) : 0;
  const discountedSubtotal = subtotal - discount;
  const gst = Number((discountedSubtotal * 0.15).toFixed(2));
  const total = Number((discountedSubtotal + gst).toFixed(2));
  ```
- Include `discount` and `discountReason` in the persisted `Order` object and in the `201` response.

### OpenAPI spec (`backend/src/openapi.ts`)

- Add `discount` and `discountReason` to the `Order` schema.
- Add `eligibleForDiscount`, `discountPreview`, `amountToDiscount` to the cart schema.
- Add example responses with and without the discount applied.

---

## 4. UI Changes

### Cart page (`CartPage.tsx`)

| Condition | UI element |
|---|---|
| `subtotal < 100` | "Spend **$X** more to unlock 10% off" nudge (dismissible) |
| `subtotal >= 100` | "🎉 10% discount unlocked! You save **$Y**" banner |
| Either | Discount line in the totals section when `discountPreview > 0` |

### Checkout page (`CheckoutPage.tsx`)

- Show a `Discount (10%)` line item in the order summary section when eligible.
- Update the `Place order – $X` button text to reflect the post-discount total.

### Order confirmation

- Show a `You saved $X` line in the confirmation so customers understand the value they received.

---

## 5. Test Strategy

### 5.1 API tests (new specs in `tests/api/`)

| # | Scenario | Input | Expected |
|---|---|---|---|
| D1 | No discount below threshold | subtotal = $99.99 | `discount=0`, `total = subtotal + gst(15%)` |
| D2 | Discount applies at threshold | subtotal = $100.00 | `discount=10.00`, reduced total |
| D3 | Discount applies above threshold | subtotal = $100.01 | `discount≈10.00`, reduced total |
| D4 | Cart reflects eligibility | `subtotal=110` (e.g. add Wild Salmon qty=2) | `eligibleForDiscount=true`, `discountPreview≈11.00` |
| D5 | Cart nudge below threshold | `subtotal=80` | `eligibleForDiscount=false`, `amountToDiscount=20` |
| D6 | Discount is stored on order | Place eligible order | `order.discount` > 0, `order.discountReason="SUBTOTAL_OVER_100"` |
| D7 | Quantity change crosses threshold | Start below, increase qty | Cart `eligibleForDiscount` flips |
| D8 | Floating-point precision | Use prices that produce an irrational result | `discount` rounded to 2 decimal places |

### 5.2 UI tests (new specs in `tests/ui/`)

| # | Scenario |
|---|---|
| V1 | Cart shows "Spend $X more" nudge when subtotal < $100 |
| V2 | Cart shows "10% discount unlocked" banner and discount line when subtotal ≥ $100 |
| V3 | Checkout totals show `Discount (10%)` line when eligible |
| V4 | Order confirmation shows "You saved $X" |
| V5 | Nudge disappears and banner appears when quantity is changed to cross the threshold |

### 5.3 Regression (existing suite)

Re-run the entire `tests/` suite unchanged:

- All A-series and U-series tests must still pass.
- Add one new regression spec: "order with subtotal < $100 places successfully with no discount" — ensures the happy path without the feature is unbroken.

---

## 6. Validating Existing Behaviour Is Not Broken

- The `POST /orders` logic change is additive: when `subtotal < 100` the discount is 0 and the calculation is identical to the current code.
- Integration test: seed a cart with subtotal = $50, place order, assert `discount` is absent or 0 and `total = subtotal * 1.15`.
- Spot-check the `GET /orders` and `GET /orders/:id` responses to confirm the new fields do not break existing consumers.

---

## 7. Pre-Launch Checklist

- [ ] **Fix the GST bug first.** The cart currently uses 12.5% while the order uses 15%. Shipping a discount feature on top of inconsistent tax maths would compound customer trust issues.
- [ ] **Feature flag.** Gate the discount behind an env var (`DISCOUNT_ENABLED=true`) or a simple runtime flag so it can be killed instantly without a deploy.
- [ ] **Threshold config.** Store `100` as a named constant (`DISCOUNT_THRESHOLD_NZD`) rather than a magic number, so future threshold changes are a one-line diff.
- [ ] **Finance sign-off.** Confirm the exact calculation (pre/post GST, rounding method) with the finance team before deployment.
- [ ] **Customer support runbook.** Brief the support team on the discount rules so they can handle "why wasn't I discounted?" queries.
- [ ] **Monitoring.** Add a metric/alert for `daily discount total (NZD)` so an unexpected spike (e.g. a bug granting discounts on sub-$100 orders) is caught quickly.
- [ ] **Roll-out plan.** Staging → 10% prod canary → 100% prod, with traffic comparison on average order value.
- [ ] **Documentation.** Update the OpenAPI spec and `README.md` before the feature ships.

---

## 8. BDD Acceptance Criteria

Defined before implementation begins — shift-left test strategy. These scenarios drive the test cases in `tests/api/` and `tests/ui/` once the feature is built.

```gherkin
Feature: Order discount for large orders

  Background:
    Given a registered and authenticated user

  # ── Happy path ──────────────────────────────────────────────────────────────

  Scenario: CHECKOUT-020 Subtotal over $100 receives 10% discount @smoke
    Given the user's cart subtotal exceeds NZD $100
    When they place an order
    Then the order total reflects a 10% discount applied to the subtotal
    And the discount amount is itemised in the order response as "discount"
    And the discount reason is recorded as "SUBTOTAL_OVER_100"
    And GST is calculated on the post-discount subtotal at 15%

  Scenario: CHECKOUT-021 Cart shows discount preview when subtotal exceeds $100 @regression
    Given the user's cart subtotal exceeds NZD $100
    When they view their cart
    Then the cart response includes "eligibleForDiscount: true"
    And "discountPreview" equals subtotal × 0.10
    And the cart page displays a "10% discount unlocked" banner

  # ── Edge cases ──────────────────────────────────────────────────────────────

  Scenario: CHECKOUT-022 Subtotal exactly $100 receives no discount @regression
    Given the user's cart subtotal is exactly NZD $100.00
    When they place an order
    Then no discount is applied
    And the order total equals subtotal + (subtotal × 0.15 GST)

  Scenario: CHECKOUT-023 Subtotal below $100 shows spend nudge in cart @regression
    Given the user's cart subtotal is below NZD $100
    When they view their cart
    Then the cart response includes "eligibleForDiscount: false"
    And "amountToDiscount" equals 100 minus the current subtotal
    And the cart page displays a "Spend $X more to unlock 10% off" nudge

  # ── Calculation order ────────────────────────────────────────────────────────

  Scenario: CHECKOUT-024 Discount is applied before GST calculation @regression
    Given a discounted order with subtotal $110
    When the order is placed
    Then the discount of $11 is deducted first
    And GST of 15% is applied to the discounted subtotal of $99
    And the order total is $99 + ($99 × 0.15) = $113.85

  # ── Precision ────────────────────────────────────────────────────────────────

  Scenario: CHECKOUT-025 Discount and GST amounts are rounded to 2 decimal places @regression
    Given a cart subtotal that produces an irrational discount value
    When the order is placed
    Then "discount" in the response is rounded to 2 decimal places
    And "gst" in the response is rounded to 2 decimal places
    And "total" equals discountedSubtotal + gst with no floating-point drift
```
