@mode:serial
Feature: Checkout

  @CHECKOUT-UI-001 @regression
  Scenario: CHECKOUT-UI-001 Checkout form pre-fills name and email from registered user
    Given an authenticated user at checkout with product "p-011"
    Then the name and email fields are pre-filled from registration

  @CHECKOUT-UI-002 @regression
  Scenario: CHECKOUT-UI-002 Order summary shows the item and dollar totals
    Given an authenticated user at checkout with product "p-011"
    Then the order summary and pricing are visible

  @CHECKOUT-UI-003 @regression
  Scenario: CHECKOUT-UI-003 Submit without address is blocked by HTML5 required validation
    Given an authenticated user at checkout with product "p-011"
    When they click Submit without filling the address
    Then no confirmation is shown and the URL stays "/checkout"

  @CHECKOUT-UI-004 @smoke @e2e
  Scenario: CHECKOUT-UI-004 Register, add item, checkout, order confirmed
    Given a registered user on the catalogue with customer delivery details
    When they add product "p-012" to the cart
    And they proceed through cart to checkout
    And they fill in their delivery details
    Then the order is confirmed and the cart badge disappears

  @CHECKOUT-UI-005 @regression
  Scenario: CHECKOUT-UI-005 GST (15%) label is visible on the checkout page
    Given an authenticated user at checkout with product "p-011"
    Then the GST label is rendered

  @GST-UI-001 @fail @known-bug
  Scenario: GST-UI-001 Checkout "GST (15%)" label matches actual gst value at 15% rate
    Given an authenticated user at checkout with product "p-011"
    When they view the cart page
    Then the GST amount matches 15% of the subtotal

  @CHECKOUT-UI-006 @regression
  Scenario: CHECKOUT-UI-006 Double-click Submit does not create duplicate orders
    Given an authenticated user at checkout with product "p-011"
    And they have filled in delivery details
    When they click Submit twice rapidly
    Then only one order confirmation is shown

  @CHECKOUT-UI-007 @regression
  Scenario: CHECKOUT-UI-007 Stock exhausted between cart and checkout shows an error message
    Given user A has "p-013" in cart and is on checkout while user B exhausts its remaining stock
    When they submit the checkout form with valid delivery details
    Then a stock-unavailable error is shown instead of a confirmation
