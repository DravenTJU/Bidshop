import { test as base, APIRequestContext } from '@playwright/test';
import { registerUser, authedContext } from './api-client';
import { makeUser } from './factories';

interface AuthFixtures {
  /** A fresh registered user with a pre-configured authed request context. */
  authedApi: {
    token: string;
    user: { id: string; email: string; name: string };
    /** Convenience wrapper that injects Authorization header on every call. */
    api: ReturnType<typeof authedContext>;
    /** Raw request context (no default auth) — use for negative auth tests. */
    request: APIRequestContext;
  };
}

export const test = base.extend<AuthFixtures>({
  authedApi: async ({ request }, use) => {
    const creds = makeUser();
    const { token, user } = await registerUser(request, creds);
    await use({ token, user, api: authedContext(request, token), request });
  },
});

export { expect } from '@playwright/test';

/** Register a user and return their token — for use outside of test fixtures. */
export async function registerAndLogin(
  request: APIRequestContext,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<{ token: string; user: { id: string; email: string; name: string }; password: string }> {
  const creds = makeUser(overrides);
  const { token, user } = await registerUser(request, creds);
  return { token, user, password: creds.password };
}

/** Seed auth via API then store the token in localStorage for a UI page. */
export async function seedAuth(
  page: import('@playwright/test').Page,
  request: APIRequestContext,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<{ token: string; user: { id: string; email: string; name: string }; password: string }> {
  const result = await registerAndLogin(request, overrides);
  // Inject token before the app's first script runs so AuthContext starts authenticated.
  await page.addInitScript((token) => {
    localStorage.setItem('bidshop.token', token);
  }, result.token);
  await page.goto('/');
  // Wait until the navbar confirms the user is authenticated
  await page.waitForSelector('[data-testid=nav-user-name]', { timeout: 10000 });
  return result;
}
