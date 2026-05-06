import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { makeUser } from '../../fixtures/factories';
import { registerUser } from '../../fixtures/api-client';

Given('a new user on the register page', async ({ authPage }) => {
  await authPage.goToRegister();
});

Given('a user who has just registered', async ({ authPage, scenarioContext }) => {
  const user = makeUser();
  scenarioContext.userData = { token: '', user: { id: '', email: user.email, name: user.name } };
  await authPage.goToRegister();
  await authPage.register(user.name, user.email, user.password);
  await expect(authPage.nav.userName).toBeVisible();
});

Given('a user already registered via API', async ({ request, scenarioContext }) => {
  const user = makeUser();
  scenarioContext.userData = { token: '', user: { id: '', email: user.email, name: user.name } };
  await registerUser(request, user);
  (scenarioContext as any)._password = user.password;
});

Given('a visitor on the login page', async ({ authPage }) => {
  await authPage.goToLogin();
});

Given('a pre-registered user', async ({ request, scenarioContext }) => {
  const user = makeUser();
  const result = await registerUser(request, user);
  scenarioContext.userData = result;
  (scenarioContext as any)._password = user.password;
  (scenarioContext as any)._email = user.email;
});

When('they fill in valid registration details', async ({ authPage, scenarioContext }) => {
  const user = makeUser();
  scenarioContext.userData = { token: '', user: { id: '', email: user.email, name: user.name } };
  await authPage.register(user.name, user.email, user.password);
});

When('they reload the page', async ({ page }) => {
  await page.reload();
});

When('a second registration attempt uses the same email', async ({ authPage, scenarioContext }) => {
  const email = scenarioContext.userData!.user.email;
  await authPage.goToRegister();
  await authPage.register('Another Name', email, 'TestPass1!');
});

When('they submit invalid credentials', async ({ authPage }) => {
  await authPage.login('nobody@bidshop.test', 'wrongpassword');
});

When('they log in with correct credentials', async ({ authPage, scenarioContext }) => {
  const email = (scenarioContext as any)._email as string;
  const password = (scenarioContext as any)._password as string;
  await authPage.goToLogin();
  await authPage.login(email, password);
});

Then('they land on the shop at {string} and the navbar shows their first name',
  async ({ page, authPage, scenarioContext }, url: string) => {
    await expect(page).toHaveURL(url);
    const firstName = scenarioContext.userData!.user.name.split(' ')[0];
    await expect(authPage.nav.userName).toContainText(firstName);
  }
);

Then('they remain authenticated with their name and logout link visible',
  async ({ authPage }) => {
    await expect(authPage.nav.userName).toBeVisible();
    await expect(authPage.nav.logout).toBeVisible();
  }
);

Then('a register-error message is shown', async ({ authPage }) => {
  await expect(authPage.registerForm.error).toBeVisible();
});

Then('a login-error is shown and the URL stays {string}',
  async ({ page, authPage }, url: string) => {
    await expect(authPage.loginForm.error).toBeVisible();
    await expect(page).toHaveURL(url);
  }
);

Then('they land on the shop at {string} with their name in the navbar',
  async ({ page, authPage, scenarioContext }, url: string) => {
    await expect(page).toHaveURL(url);
    const firstName = scenarioContext.userData!.user.name.split(' ')[0];
    await expect(authPage.nav.userName).toContainText(firstName);
  }
);

When('they navigate directly to {string}', async ({ page }, url: string) => {
  await page.goto(url);
});

Then('they should be redirected to {string} instead of seeing the register form',
  async ({ page }, url: string) => {
    await expect(page).toHaveURL(url);
  }
);
