// backend/src/middleware/cors.ts
import { Request } from 'itty-router';

interface CORSOptions {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_OPTIONS: CORSOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://walk-nepal-walk.firebaseapp.com',
    'https://walk-nepal.app',
    'https://www.walk-nepal.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * CORS middleware for Cloudflare Workers
 */
export function withCORS(
  req: Request,
  _res?: any,
  options: CORSOptions = DEFAULT_OPTIONS
): Response | undefined {
  const origin = req.headers.get('Origin');
  const allowedOrigins = options.origin || DEFAULT_OPTIONS.origin;
  const isOriginAllowed =
    Array.isArray(allowedOrigins) && allowedOrigins.includes(origin || '')
      ? origin
      : allowedOrigins === '*'
      ? '*'
      : null;

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': isOriginAllowed || '*',
        'Access-Control-Allow-Methods': (options.methods || DEFAULT_OPTIONS.methods)!.join(', '),
        'Access-Control-Allow-Headers': (options.headers || DEFAULT_OPTIONS.headers)!.join(', '),
        'Access-Control-Max-Age': String(options.maxAge || DEFAULT_OPTIONS.maxAge),
        'Access-Control-Allow-Credentials': String(options.credentials ?? DEFAULT_OPTIONS.credentials),
      },
    });
  }

  // Return undefined to let the handler process continue
  return undefined;
}

/**
 * Apply CORS headers to a response
 */
export function applyCORSHeaders(
  response: Response,
  req: Request,
  options: CORSOptions = DEFAULT_OPTIONS
): Response {
  const origin = req.headers.get('Origin');
  const allowedOrigins = options.origin || DEFAULT_OPTIONS.origin;
  const isOriginAllowed =
    Array.isArray(allowedOrigins) && allowedOrigins.includes(origin || '')
      ? origin
      : allowedOrigins === '*'
      ? '*'
      : null;

  const headers = new Headers(response.headers);
  
  if (isOriginAllowed) {
    headers.set('Access-Control-Allow-Origin', isOriginAllowed);
  }
  
  headers.set('Access-Control-Allow-Methods', (options.methods || DEFAULT_OPTIONS.methods)!.join(', '));
  headers.set('Access-Control-Allow-Headers', (options.headers || DEFAULT_OPTIONS.headers)!.join(', '));
  
  if (options.credentials ?? DEFAULT_OPTIONS.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
