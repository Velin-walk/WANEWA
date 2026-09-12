// backend/src/index.ts
import { Router } from 'itty-router';
import { validateFirebaseToken, withAuth } from './middleware/auth';
import { withCORS, applyCORSHeaders } from './middleware/cors';
import { createRateLimiter, createRegistrationLimiter, addRateLimitHeaders } from './middleware/rateLimit';
import {
  TrekQueries,
  BookingQueries,
  TeamMemberQueries,
  InviteQueries,
  generateInviteCode,
} from './database/queries';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  TREK_INSTANCES: DurableObjectNamespace;
  KV: KVNamespace;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
}

const router = Router();

// Apply CORS middleware to all routes
router.all('*', withCORS);

// ===== PUBLIC ROUTES =====

/**
 * GET /treks - Get all upcoming treks
 */
router.get('/treks', async (req: Request, env: Env) => {
  try {
    const treks = await TrekQueries.getAll(env.DB);
    return Response.json(treks.results);
  } catch (error) {
    console.error('Error fetching treks:', error);
    return Response.json(
      { error: 'Failed to fetch treks' },
      { status: 500 }
    );
  }
});

/**
 * GET /treks/:trekId - Get trek details with live participant count
 */
router.get('/treks/:trekId', async (req: Request, env: Env) => {
  try {
    const { trekId } = req.params as any;

    // Fetch trek from DB
    const trek = await TrekQueries.getById(env.DB, trekId);
    if (!trek) {
      return Response.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Get live count from Durable Object
    const id = env.TREK_INSTANCES.idFromName(trekId);
    const trekInstance = env.TREK_INSTANCES.get(id);
    const liveCountResponse = await trekInstance.fetch(
      new Request('http://x/count')
    );
    const count = await liveCountResponse.json() as any;

    return Response.json({
      ...trek,
      participants: count.total,
      participants_by_gender: {
        male: count.male,
        female: count.female,
      },
    });
  } catch (error) {
    console.error('Error fetching trek details:', error);
    return Response.json(
      { error: 'Failed to fetch trek details' },
      { status: 500 }
    );
  }
});

/**
 * GET /invites/join?code=XXX - Join trek via invite code
 */
router.get('/invites/join', async (req: Request, env: Env) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return Response.json(
        { error: 'Invite code required' },
        { status: 400 }
      );
    }

    const invite = await InviteQueries.getByCode(env.DB, code);
    if (!invite) {
      return Response.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Increment usage and return trek info
    await InviteQueries.incrementUsage(env.DB, code);
    const trek = await TrekQueries.getById(env.DB, (invite as any).trek_id);

    return Response.json({
      trek,
      message: 'Invite code valid',
    });
  } catch (error) {
    console.error('Error validating invite:', error);
    return Response.json(
      { error: 'Failed to validate invite' },
      { status: 500 }
    );
  }
});

// ===== PROTECTED ROUTES =====

/**
 * GET /bookings - Get user's bookings
 */
router.get('/bookings', async (req: Request, env: Env) => {
  try {
    const user = await validateFirebaseToken(req, env);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await BookingQueries.getByUser(env.DB, user.email);
    return Response.json(bookings.results);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return Response.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
});

/**
 * POST /bookings - Register for a trek
 */
router.post('/bookings', async (req: Request, env: Env) => {
  try {
    const user = await validateFirebaseToken(req, env);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as any;
    const { trek_id, full_name, phone, whatsapp, age_group, gender, team_members } = body;

    // Validate required fields
    if (!trek_id || !full_name || !phone || !age_group || !gender) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limit check (5 registrations per hour per email)
    const registrationLimiter = createRegistrationLimiter(env.KV);
    const rateLimitCheck = await registrationLimiter(req, user.email);
    if (!rateLimitCheck.allowed) {
      return Response.json(
        {
          error: `Too many registrations. Try again in ${rateLimitCheck.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter),
          },
        }
      );
    }

    // Check if trek exists
    const trek = await TrekQueries.getById(env.DB, trek_id);
    if (!trek) {
      return Response.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Check if user is already registered
    const existing = await BookingQueries.getByTrekAndUser(env.DB, trek_id, user.email);
    if (existing) {
      return Response.json(
        { error: 'Already registered for this trek' },
        { status: 409 }
      );
    }

    // Create booking
    const bookingResult = await BookingQueries.create(env.DB, {
      trek_id,
      user_email: user.email,
      full_name,
      phone,
      whatsapp,
      age_group,
      gender,
    });

    const bookingId = (bookingResult.meta as any).last_row_id;

    // Add team members if provided
    if (team_members && Array.isArray(team_members)) {
      for (const member of team_members) {
        await TeamMemberQueries.create(env.DB, {
          booking_id: bookingId as number,
          ...member,
        });
      }
    }

    // Notify Durable Object to broadcast update
    const id = env.TREK_INSTANCES.idFromName(trek_id);
    const trekInstance = env.TREK_INSTANCES.get(id);
    await trekInstance.fetch(
      new Request('http://x/join', {
        method: 'POST',
        body: JSON.stringify({
          name: full_name,
          gender,
        }),
      })
    );

    return Response.json({
      success: true,
      booking_id: bookingId,
      message: 'Successfully registered for trek',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return Response.json(
      { error: 'Failed to register for trek' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /bookings/:bookingId - Cancel a booking
 */
router.delete('/bookings/:bookingId', async (req: Request, env: Env) => {
  try {
    const user = await validateFirebaseToken(req, env);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = req.params as any;

    // Delete team members first
    await TeamMemberQueries.deleteByBooking(env.DB, parseInt(bookingId));

    // Delete booking
    await BookingQueries.delete(env.DB, parseInt(bookingId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return Response.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
});

/**
 * POST /treks/:trekId/invite - Create invite link for trek
 */
router.post('/treks/:trekId/invite', async (req: Request, env: Env) => {
  try {
    const user = await validateFirebaseToken(req, env);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trekId } = req.params as any;

    // Verify user is registered for this trek
    const booking = await BookingQueries.getByTrekAndUser(
      env.DB,
      trekId,
      user.email
    );
    if (!booking) {
      return Response.json(
        { error: 'Not registered for this trek' },
        { status: 403 }
      );
    }

    // Create invite
    const code = generateInviteCode();
    await InviteQueries.create(env.DB, {
      code,
      trek_id: trekId,
      created_by: user.email,
    });

    return Response.json({
      code,
      link: `https://walk-nepal.app/invite/${code}`,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return Response.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
});

/**
 * WebSocket upgrade for real-time updates
 */
router.get('/ws/trek/:trekId', async (req: Request, env: Env) => {
  try {
    const { trekId } = req.params as any;
    const id = env.TREK_INSTANCES.idFromName(trekId);
    const durableObject = env.TREK_INSTANCES.get(id);

    return durableObject.fetch(req);
  } catch (error) {
    console.error('WebSocket error:', error);
    return new Response('WebSocket connection failed', { status: 500 });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', () => {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
router.all('*', () => {
  return new Response('Not found', { status: 404 });
});

export default router;
