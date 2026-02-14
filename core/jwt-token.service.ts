import { createHmac, timingSafeEqual } from 'crypto';

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

interface JwtPayload {
  [key: string]: unknown;
  iat?: number;
  exp?: number;
}

export class JwtTokenService {
  sign(payload: Record<string, unknown>, secret: string, expiresIn: string): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.toSeconds(expiresIn);

    const completePayload: JwtPayload = {
      ...payload,
      iat: now,
      exp
    };

    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(completePayload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string, secret: string): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Malformed token');
    }

    const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);
    if (!this.safeCompare(signature, expectedSignature)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Expired token');
    }

    return payload;
  }

  private createSignature(content: string, secret: string): string {
    return createHmac('sha256', secret).update(content).digest('base64url');
  }

  private base64UrlEncode(content: string): string {
    return Buffer.from(content).toString('base64url');
  }

  private base64UrlDecode(content: string): string {
    return Buffer.from(content, 'base64url').toString('utf8');
  }

  private safeCompare(a: string, b: string): boolean {
    const first = Buffer.from(a);
    const second = Buffer.from(b);

    if (first.length !== second.length) {
      return false;
    }

    return timingSafeEqual(first, second);
  }

  private toSeconds(expiresIn: string): number {
    const trimmed = expiresIn.trim();

    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }

    const match = trimmed.match(/^(\d+)([smhd])$/i);
    if (!match) {
      throw new Error('Invalid JWT_EXPIRES_IN format');
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return value * multiplier;
  }
}
