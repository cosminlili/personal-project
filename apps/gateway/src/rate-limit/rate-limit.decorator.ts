import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  ttlSeconds: number;
  maxRequests: number;
}

export const RATE_LIMIT_OPTIONS_METADATA_KEY = 'rate_limit_options';
export const SKIP_RATE_LIMIT_METADATA_KEY = 'skip_rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_OPTIONS_METADATA_KEY, options);

export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_METADATA_KEY, true);
