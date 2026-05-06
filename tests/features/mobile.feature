@mode:serial
Feature: Mobile UI — iPhone 13

  @MOBILE-UI-001 @smoke
  Scenario: MOBILE-UI-001 Register and see user name in navbar on iPhone 13
    Given a new user on the register page
    When they fill in valid registration details
    Then they land on the shop at "/" and the navbar shows their first name

  @MOBILE-UI-002 @smoke
  Scenario: MOBILE-UI-002 Add product to cart and view cart on iPhone 13
    Given an authenticated user on the catalogue
    When they add product "p-005" to the cart
    Then the nav badge shows "1"
    And the cart contains product "p-005"

  @MOBILE-UI-003 @regression
  Scenario: MOBILE-UI-003 Checkout form input focus does not push content off screen on iPhone 13
    Given an authenticated user at checkout with product "p-011"
    When the name input field receives focus
    Then the submit button remains visible on screen
