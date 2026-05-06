@mode:serial
Feature: Authentication

  @AUTH-UI-001 @smoke
  Scenario: AUTH-UI-001 Register via UI lands on shop page and shows user name
    Given a new user on the register page
    When they fill in valid registration details
    Then they land on the shop at "/" and the navbar shows their first name

  @AUTH-UI-002 @regression
  Scenario: AUTH-UI-002 Session persists after page reload
    Given a user who has just registered
    When they reload the page
    Then they remain authenticated with their name and logout link visible

  @AUTH-UI-003 @regression
  Scenario: AUTH-UI-003 Duplicate email shows register-error
    Given a user already registered via API
    When a second registration attempt uses the same email
    Then a register-error message is shown

  @AUTH-UI-004 @regression
  Scenario: AUTH-UI-004 Invalid credentials show login-error
    Given a visitor on the login page
    When they submit invalid credentials
    Then a login-error is shown and the URL stays "/login"

  @AUTH-UI-005 @smoke
  Scenario: AUTH-UI-005 Valid credentials navigate to shop and show user name
    Given a pre-registered user
    When they log in with correct credentials
    Then they land on the shop at "/" with their name in the navbar

  @AUTH-UI-006 @fail @known-bug
  Scenario: AUTH-UI-006 Authenticated user visiting /register can re-register instead of being redirected
    Given an authenticated user on the catalogue
    When they navigate directly to "/register"
    Then they should be redirected to "/" instead of seeing the register form
