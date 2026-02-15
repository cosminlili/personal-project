import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import {
  RATE_LIMIT_OPTIONS_METADATA_KEY,
  RateLimitOptions,
  SKIP_RATE_LIMIT_METADATA_KEY
} from './rate-limit.decorator';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface HttpRequestLike {
  ip?: string;
  method?: string;
  originalUrl?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

const AUTH_ROUTES_WITH_EMAIL_BUCKET = ['/auth/login', '/auth/register'];

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultTtlSeconds: number;
  private readonly defaultMaxRequests: number;
  private readonly localStore = new Map<string, RateLimitEntry>();

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.defaultTtlSeconds = Number(this.configService.get('RATE_LIMIT_TTL_SECONDS') ?? 60);
    this.defaultMaxRequests = Number(this.configService.get('RATE_LIMIT_MAX_REQUESTS') ?? 30);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipRateLimit) {
      return true;
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_OPTIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    const ttlSeconds = options?.ttlSeconds ?? this.defaultTtlSeconds;
    const maxRequests = options?.maxRequests ?? this.defaultMaxRequests;

    const request = context.switchToHttp().getRequest<HttpRequestLike & { body?: { email?: string } }>();
    const response = context.switchToHttp().getResponse<{ setHeader: (name: string, value: string) => void }>();

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const forwardedIp = forwardedValue?.split(',')[0]?.trim();
    const identifier = forwardedIp ?? request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const path = request.originalUrl ?? request.path ?? 'unknown';
    const method = request.method ?? 'GET';
    const email = request.body?.email?.trim().toLowerCase();
    const useEmailBucket = AUTH_ROUTES_WITH_EMAIL_BUCKET.some((route) => path.includes(route)) && email;

    const key = useEmailBucket
      ? `rate-limit:auth:${email}:${method}:${path}`
      : `rate-limit:ip:${identifier}:${method}:${path}`;

    const now = Date.now();
    const localEntry = this.localStore.get(key) ?? null;
    const cacheEntry = (await this.cacheManager.get<RateLimitEntry>(key)) ?? null;
    const cached =
      localEntry && localEntry.resetAt > now
        ? localEntry
        : cacheEntry && cacheEntry.resetAt > now
          ? cacheEntry
          : null;
    const windowEnd = now + ttlSeconds * 1000;

    const entry: RateLimitEntry =
      cached && cached.resetAt > now
        ? { count: cached.count + 1, resetAt: cached.resetAt }
        : { count: 1, resetAt: windowEnd };

    const remaining = Math.max(maxRequests - entry.count, 0);

    response.setHeader('X-RateLimit-Limit', String(maxRequests));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      throw new HttpException('Too many requests, please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ttl = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);
    this.localStore.set(key, entry);
    await this.cacheManager.set(key, entry,  ttl );

    return true;
  }
}
