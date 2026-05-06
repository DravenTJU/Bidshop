import * as crypto from 'crypto';

export function uniqueEmail(): string {
  const rand = crypto.randomBytes(4).toString('hex');
  return `qa+${Date.now()}-${rand}@bidshop.test`;
}

export function makePassword(): string {
  return 'TestPass1!';
}

export function makeUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? makePassword(),
  };
}

export function makeCustomer(overrides: Partial<{
  name: string; email: string; address: string; city: string; postcode: string;
}> = {}) {
  return {
    name: overrides.name ?? 'Jane Foodie',
    email: overrides.email ?? uniqueEmail(),
    address: overrides.address ?? '12 Queen Street',
    city: overrides.city ?? 'Auckland',
    postcode: overrides.postcode ?? '1010',
  };
}
