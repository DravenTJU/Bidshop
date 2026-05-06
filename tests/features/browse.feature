@mode:serial
Feature: Product catalogue

  @PRODUCT-UI-001 @smoke
  Scenario: PRODUCT-UI-001 Logged-out catalogue shows 18 products and "Log in to buy" CTAs
    Given a visitor on the catalogue
    Then 18 products are shown and each card has a "Log in to buy" CTA

  @PRODUCT-UI-002 @regression
  Scenario: PRODUCT-UI-002 "Log in to buy" CTA navigates to /login
    Given a visitor on the catalogue
    When they click the "Log in to buy" CTA for product "p-001"
    Then they are redirected to "/login"

  @PRODUCT-UI-003 @regression
  Scenario: PRODUCT-UI-003 Search "salmon" narrows results to Wild NZ King Salmon Fillet
    Given a visitor on the catalogue
    When they search for "salmon"
    Then 1 product is shown and it is "Wild NZ King Salmon Fillet"

  @PRODUCT-UI-004 @regression
  Scenario: PRODUCT-UI-004 Nonsense search shows empty state and "0 products"
    Given a visitor on the catalogue
    When they search for "ZZZNOMATCH9999"
    Then 0 products are shown and the empty state message is visible

  @PRODUCT-UI-005 @regression
  Scenario: PRODUCT-UI-005 Category filter Dairy returns only the 3 Dairy products
    Given a visitor on the catalogue
    When they select the category "Dairy"
    Then exactly 3 products are shown and all have category "Dairy"

  @PRODUCT-UI-006 @regression
  Scenario: PRODUCT-UI-006 In-stock product shows enabled "Add to cart" button
    Given an authenticated user on the catalogue
    Then product "p-005" has an enabled "Add to cart" button

  @PRODUCT-UI-007 @regression
  Scenario: PRODUCT-UI-007 Out-of-stock product shows disabled button
    Given product "p-003" stock has been exhausted via API
    And an authenticated user refreshes the catalogue
    Then the "Add to cart" button for product "p-003" is disabled with "Out of stock" label

  @PRODUCT-UI-008 @fail @known-bug
  Scenario: PRODUCT-UI-008 All product images on the catalogue load without errors
    Given a visitor on the catalogue
    Then all product images are loaded without broken-image state
