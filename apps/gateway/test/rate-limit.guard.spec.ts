import { ExecutionContext, TooManyRequestsException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from '../src/rate-limit/rate-limit.guard';

describe('RateLimitGuard', () => {
  const createContext = (request: Record<string, unknown>, response: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response
      })
    }) as ExecutionContext;

  it('limits requests after configured maximum', async () => {
    const store = new Map<string, { count: number; resetAt: number }>();
    const cache = {
      get: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: { count: number; resetAt: number }, options: { ttl: number }) => {
        if (options?.ttl) {
          store.set(key, value);
        }
      })
    };

    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 2 })
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 2 })
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 2 })
    } as unknown as Reflector;

    const configService = { get: jest.fn() } as unknown as ConfigService;
    const guard = new RateLimitGuard(configService, reflector, cache as never);

    const headers: Record<string, string> = {};
    const response = { setHeader: (name: string, value: string) => (headers[name] = value) };
    const request = { ip: '127.0.0.1', method: 'POST', originalUrl: '/auth/register' };
    const context = createContext(request, response);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(TooManyRequestsException);

    expect(headers['X-RateLimit-Limit']).toBe('2');
    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ ttl: expect.any(Number) })
    );
  });

  it('uses email-based bucket for login throttling', async () => {
    const store = new Map<string, { count: number; resetAt: number }>();
    const cache = {
      get: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: { count: number; resetAt: number }) => {
        store.set(key, value);
      })
    };

    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 1 })
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 1 })
    } as unknown as Reflector;

    const configService = { get: jest.fn() } as unknown as ConfigService;
    const guard = new RateLimitGuard(configService, reflector, cache as never);

    const response = { setHeader: jest.fn() };
    const request = {
      ip: '127.0.0.1',
      method: 'POST',
      originalUrl: '/auth/login',
      body: { email: 'User@Test.com' },
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }
    };

    await expect(guard.canActivate(createContext(request, response))).resolves.toBe(true);
    await expect(guard.canActivate(createContext(request, response))).rejects.toBeInstanceOf(
      TooManyRequestsException
    );

    expect(cache.get).toHaveBeenCalledWith(expect.stringContaining('rate-limit:auth:user@test.com'));
  });

  it('skips rate limit when endpoint is marked to skip', async () => {
    const cache = { get: jest.fn(), set: jest.fn() };
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true)
    } as unknown as Reflector;

    const configService = { get: jest.fn() } as unknown as ConfigService;
    const guard = new RateLimitGuard(configService, reflector, cache as never);

    const context = createContext({ ip: '127.0.0.1' }, { setHeader: jest.fn() });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('uses ip-based bucket for non-auth routes', async () => {
    const cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined)
    };
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ ttlSeconds: 60, maxRequests: 5 })
    } as unknown as Reflector;

    const configService = { get: jest.fn() } as unknown as ConfigService;
    const guard = new RateLimitGuard(configService, reflector, cache as never);

    const request = {
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/auth/users'
    };

    await expect(guard.canActivate(createContext(request, { setHeader: jest.fn() }))).resolves.toBe(
      true
    );
    expect(cache.get).toHaveBeenCalledWith(expect.stringContaining('rate-limit:ip:127.0.0.1'));
  });
});
