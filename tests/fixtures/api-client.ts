import { APIRequestContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000';

export async function registerUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string },
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const res = await request.post(`${API_BASE}/auth/register`, { data: user });
  if (!res.ok()) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Register failed ${res.status()}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

export async function loginUser(
  request: APIRequestContext,
  creds: { email: string; password: string },
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const res = await request.post(`${API_BASE}/auth/login`, { data: creds });
  if (!res.ok()) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Login failed ${res.status()}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

export function authedContext(
  request: APIRequestContext,
  token: string,
): Pick<APIRequestContext, 'get' | 'post' | 'patch' | 'delete'> {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string, opts?: Parameters<APIRequestContext['get']>[1]) =>
      request.get(url, { ...opts, headers: { ...headers, ...opts?.headers } }),
    post: (url: string, opts?: Parameters<APIRequestContext['post']>[1]) =>
      request.post(url, { ...opts, headers: { ...headers, ...opts?.headers } }),
    patch: (url: string, opts?: Parameters<APIRequestContext['patch']>[1]) =>
      request.patch(url, { ...opts, headers: { ...headers, ...opts?.headers } }),
    delete: (url: string, opts?: Parameters<APIRequestContext['delete']>[1]) =>
      request.delete(url, { ...opts, headers: { ...headers, ...opts?.headers } }),
  };
}
