@mode:serial
Feature: Cart management

  @CART-UI-001 @regression
  Scenario: CART-UI-001 Logged-out /cart shows login prompt with a login link
    Given a visitor who navigates directly to the cart page
    Then a login-required prompt is shown with a login link

  @CART-UI-002 @smoke
  Scenario: CART-UI-002 Add product increments nav badge and item appears in cart
    Given an authenticated user on the catalogue
    When they add product "p-005" to the cart
    Then the nav badge shows "1"
    And the cart contains product "p-005"

  @CART-UI-003 @regression
  Scenario: CART-UI-003 Quantity change updates line total and cart totals
    Given an authenticated user with product "p-008" in the cart at unit price "$5.40"
    When they change the quantity of "p-008" to 2
    Then the line total for "p-008" is "$10.80"
    And cart totals are non-zero

  @CART-UI-004 @regression
  Scenario: CART-UI-004 Removing an item returns to empty cart state
    Given an authenticated user with product "p-006" in the cart
    When they remove product "p-006"
    Then the empty cart state is shown
    And the nav cart badge disappears

  @CART-UI-005 @regression
  Scenario: CART-UI-005 Stale token on /cart shows re-login prompt
    Given a visitor with a stale authentication token
    When they navigate to the cart page
    Then a re-login prompt is shown instead of a raw API error

  @CART-UI-006 @fail @known-bug
  Scenario: CART-UI-006 Stale token — Proceed to checkout is not guarded
    Given an authenticated user with product "p-005" in the cart
    And their authentication token becomes invalid
    When they click Proceed to checkout
    Then the checkout form is shown despite the invalid token
    When they submit the checkout form with valid delivery details
    Then an authorization error "Missing or invalid Authorization header" is shown
    Then they are redirected to "/login"
