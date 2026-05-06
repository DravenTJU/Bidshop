import { test, expect } from '@playwright/test';
import { API_BASE } from '../fixtures/api-client';
import { makeUser, uniqueEmail } from '../fixtures/factories';

test.describe('POST /auth/register', () => {
  test('AUTH-API-001 Register with valid credentials returns 201 with token @smoke',
    async ({ request }) => {
      const user = makeUser();
      const res = await request.post(`${API_BASE}/auth/register`, { data: user });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe(user.email);
      expect(body.user.name).toBe(user.name);
      expect(body.user).not.toHaveProperty('password');
      expect(body.user).not.toHaveProperty('passwordHash');
    },
  );

  test('AUTH-API-002 Duplicate email returns 409 @regression', async ({ request }) => {
    const user = makeUser();
    await request.post(`${API_BASE}/auth/register`, { data: user });
    const res = await request.post(`${API_BASE}/auth/register`, { data: user });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('AUTH-API-003 Password shorter than 6 chars returns 400 @regression',
    async ({ request }) => {
      const user = makeUser({ password: 'abc' });
      const res = await request.post(`${API_BASE}/auth/register`, { data: user });
      expect(res.status()).toBe(400);
    },
  );

  test('AUTH-API-004 Malformed email returns 400 @regression', async ({ request }) => {
    const user = makeUser({ email: 'not-an-email' });
    const res = await request.post(`${API_BASE}/auth/register`, { data: user });
    expect(res.status()).toBe(400);
  });
});

test.describe('POST /auth/login', () => {
  test('AUTH-API-005 Login with valid credentials returns 200 with token @smoke',
    async ({ request }) => {
      const user = makeUser();
      await request.post(`${API_BASE}/auth/register`, { data: user });
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { email: user.email, password: user.password },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe(user.email);
    },
  );

  test('AUTH-API-006 Wrong password returns 401 @regression', async ({ request }) => {
    const user = makeUser();
    await request.post(`${API_BASE}/auth/register`, { data: user });
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: user.email, password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('AUTH-API-007 Unknown email returns 401 @regression', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: uniqueEmail(), password: 'somepassword' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('GET /auth/me', () => {
  test('AUTH-API-008 Valid Bearer token returns 200 with user profile @smoke',
    async ({ request }) => {
      const user = makeUser();
      const reg = await (
        await request.post(`${API_BASE}/auth/register`, { data: user })
      ).json();
      const res = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${reg.token}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.email).toBe(user.email);
      expect(body).not.toHaveProperty('passwordHash');
    },
  );

  test('AUTH-API-009 Missing token returns 401 @regression', async ({ request }) => {
    const res = await request.get(`${API_BASE}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('AUTH-API-010 Invalid token returns 401 @regression', async ({ request }) => {
    const res = await request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer not.a.real.jwt' },
    });
    expect(res.status()).toBe(401);
  });
});
