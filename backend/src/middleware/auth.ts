// backend/src/middleware/auth.ts
import { Request } from 'itty-router';

interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
}

/**
 * Validate Firebase ID token from Authorization header
 * Expected format: "Bearer <token>"
 */
export async function validateFirebaseToken(req: Request, env: Env): Promise<FirebaseUser | null> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Verify the token with Firebase Admin SDK or call Firebase REST API
    // For Cloudflare Workers, we'll use the Firebase REST API approach
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!response.ok) {
      console.error('Firebase token validation failed:', response.statusText);
      return null;
    }

    const data = await response.json() as any;
    const user = data.users?.[0];

    if (!user) {
      return null;
    }

    return {
      uid: user.localId,
      email: user.email,
      name: user.displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Middleware: Attach validated user to request
 */
export async function withAuth(req: Request, env: Env) {
  const user = await validateFirebaseToken(req, env);
  if (user) {
    (req as any).user = user;
  }
  return undefined; // Pass through to next handler
}
