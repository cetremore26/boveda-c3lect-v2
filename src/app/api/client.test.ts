import { describe, expect, it } from 'vitest';
import { esEndpointDeAuth } from './client';

describe('esEndpointDeAuth', () => {
  it.each(['/auth/login', '/auth/login/2fa', '/auth/verify-otp', '/auth/reset-password', '/auth/register', '/auth/refresh', '/auth/request-otp', '/auth/request-password-reset'])(
    '%s es de auth',
    (u) => expect(esEndpointDeAuth(u)).toBe(true),
  );
  it.each(['/orders', '/auth/me', '/payments/create-pending'])('%s no es de auth', (u) =>
    expect(esEndpointDeAuth(u)).toBe(false),
  );
});
