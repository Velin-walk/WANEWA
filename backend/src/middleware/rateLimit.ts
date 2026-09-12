// backend/src/middleware/rateLimit.ts
import { Request } from 'itty-router';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter using Durable Objects would be ideal,
 * but for simpler use cases, we use Cloudflare KV
 */
export function createRateLimiter(kv: any, config: RateLimitConfig) {
  return async (req: Request) => {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `${config.keyPrefix || 'rl'}:${ip}`;

    try {
      const stored = await kv.get(key);
      const now = Date.now();

      let limitData: RateLimitStore = {
        count: 0,
        resetTime: now + config.windowMs,
      };

      if (stored) {
        limitData = JSON.parse(stored);
      }

      // Reset if window has passed
      if (now > limitData.resetTime) {
        limitData = {
          count: 1,
          resetTime: now + config.windowMs,
        };
      } else {
        limitData.count++;
      }

      // Save updated count
      await kv.put(key, JSON.stringify(limitData), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });

      // Check if limit exceeded
      if (limitData.count > config.maxRequests) {
        return new Response('Too many requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(limitData.resetTime / 1000)),
            'Retry-After': String(Math.ceil((limitData.resetTime - now) / 1000)),
          },
        });
      }

      // Attach rate limit info to request
      (req as any).rateLimit = {
        limit: config.maxRequests,
        current: limitData.count,
        remaining: config.maxRequests - limitData.count,
        resetTime: limitData.resetTime,
      };

      return undefined; // Continue to next handler
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log it
      return undefined;
    }
  };
}

/**
 * Specific rate limit for registration endpoint
 * 5 registrations per email per hour
 */
export function createRegistrationLimiter(kv: any) {
  return async (req: Request, email: string) => {
    const key = `rl:registration:${email}`;
    const now = Date.now();
    const windowMs = 3600000; // 1 hour

    try {
      const stored = await kv.get(key);
      let limitData: RateLimitStore = {
        count: 0,
        resetTime: now + windowMs,
      };

      if (stored) {
        limitData = JSON.parse(stored);
      }

      if (now > limitData.resetTime) {
        limitData = {
          count: 1,
          resetTime: now + windowMs,
        };
      } else {
        limitData.count++;
      }

      await kv.put(key, JSON.stringify(limitData), {
        expirationTtl: 3600, // 1 hour
      });

      // Allow 5 registrations per hour per email
      if (limitData.count > 5) {
        return {
          allowed: false,
          retryAfter: Math.ceil((limitData.resetTime - now) / 1000),
        };
      }

      return {
        allowed: true,
        remaining: 5 - limitData.count,
      };
    } catch (error) {
      console.error('Registration rate limit error:', error);
      // Default to allowing on error
      return { allowed: true, remaining: 5 };
    }
  };
}

/**
 * Rate limit response headers helper
 */
export function addRateLimitHeaders(response: Response, rateLimit: any): Response {
  const headers = new Headers(response.headers);
  if (rateLimit) {
    headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
