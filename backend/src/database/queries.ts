// backend/src/database/queries.ts
import { D1Database } from '@cloudflare/workers-types';

/**
 * Trek queries
 */
export const TrekQueries = {
  getAll: (db: D1Database) =>
    db
      .prepare(
        `SELECT id, name, date, days, difficulty, leader, capacity, itinerary
         FROM treks
         WHERE date >= date('now')
         ORDER BY date ASC`
      )
      .all(),

  getById: (db: D1Database, trekId: string) =>
    db
      .prepare('SELECT * FROM treks WHERE id = ?')
      .bind(trekId)
      .first(),

  getByDate: (db: D1Database, startDate: string, endDate: string) =>
    db
      .prepare(
        `SELECT id, name, date, days, difficulty, leader, capacity
         FROM treks
         WHERE date BETWEEN ? AND ?
         ORDER BY date ASC`
      )
      .bind(startDate, endDate)
      .all(),

  getByDifficulty: (db: D1Database, difficulty: string) =>
    db
      .prepare(
        `SELECT id, name, date, days, difficulty, leader, capacity
         FROM treks
         WHERE difficulty = ? AND date >= date('now')
         ORDER BY date ASC`
      )
      .bind(difficulty)
      .all(),

  create: (
    db: D1Database,
    trek: {
      id: string;
      name: string;
      date: string;
      days: string;
      difficulty: string;
      leader?: string;
      capacity?: number;
      itinerary?: string;
    }
  ) =>
    db
      .prepare(
        `INSERT INTO treks (id, name, date, days, difficulty, leader, capacity, itinerary, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        trek.id,
        trek.name,
        trek.date,
        trek.days,
        trek.difficulty,
        trek.leader || null,
        trek.capacity || 20,
        trek.itinerary || null
      )
      .run(),

  update: (db: D1Database, trekId: string, updates: any) => {
    const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => updates[k]), trekId];

    return db
      .prepare(`UPDATE treks SET ${setClause} WHERE id = ?`)
      .bind(...values)
      .run();
  },
};

/**
 * Booking queries
 */
export const BookingQueries = {
  getByUser: (db: D1Database, userEmail: string) =>
    db
      .prepare(
        `SELECT b.*, t.name, t.date, t.difficulty, t.days
         FROM bookings b
         JOIN treks t ON b.trek_id = t.id
         WHERE b.user_email = ? AND t.date >= date('now')
         ORDER BY t.date ASC`
      )
      .bind(userEmail)
      .all(),

  getByTrek: (db: D1Database, trekId: string) =>
    db
      .prepare(
        `SELECT id, full_name, gender, age_group, phone, whatsapp, joined_at
         FROM bookings
         WHERE trek_id = ?
         ORDER BY joined_at DESC`
      )
      .bind(trekId)
      .all(),

  getByTrekAndUser: (db: D1Database, trekId: string, userEmail: string) =>
    db
      .prepare('SELECT * FROM bookings WHERE trek_id = ? AND user_email = ?')
      .bind(trekId, userEmail)
      .first(),

  create: (
    db: D1Database,
    booking: {
      trek_id: string;
      user_email: string;
      full_name: string;
      phone?: string;
      whatsapp?: string;
      age_group?: string;
      gender: 'm' | 'f';
    }
  ) =>
    db
      .prepare(
        `INSERT INTO bookings (trek_id, user_email, full_name, phone, whatsapp, age_group, gender, joined_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        booking.trek_id,
        booking.user_email,
        booking.full_name,
        booking.phone || null,
        booking.whatsapp || null,
        booking.age_group || null,
        booking.gender
      )
      .run(),

  getCount: (db: D1Database, trekId: string) =>
    db
      .prepare('SELECT COUNT(*) as count FROM bookings WHERE trek_id = ?')
      .bind(trekId)
      .first() as Promise<{ count: number } | null>,

  getCountByGender: (db: D1Database, trekId: string) =>
    db
      .prepare(
        `SELECT 
           SUM(CASE WHEN gender = 'm' THEN 1 ELSE 0 END) as male,
           SUM(CASE WHEN gender = 'f' THEN 1 ELSE 0 END) as female,
           COUNT(*) as total
         FROM bookings
         WHERE trek_id = ?`
      )
      .bind(trekId)
      .first() as Promise<{ male: number; female: number; total: number } | null>,

  delete: (db: D1Database, bookingId: number) =>
    db.prepare('DELETE FROM bookings WHERE id = ?').bind(bookingId).run(),
};

/**
 * Team member queries
 */
export const TeamMemberQueries = {
  getByBooking: (db: D1Database, bookingId: number) =>
    db
      .prepare(
        `SELECT id, full_name, gender, age_group, phone
         FROM team_members
         WHERE booking_id = ?
         ORDER BY id ASC`
      )
      .bind(bookingId)
      .all(),

  create: (
    db: D1Database,
    teamMember: {
      booking_id: number;
      full_name: string;
      gender: 'm' | 'f';
      age_group?: string;
      phone?: string;
    }
  ) =>
    db
      .prepare(
        `INSERT INTO team_members (booking_id, full_name, gender, age_group, phone)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        teamMember.booking_id,
        teamMember.full_name,
        teamMember.gender,
        teamMember.age_group || null,
        teamMember.phone || null
      )
      .run(),

  deleteByBooking: (db: D1Database, bookingId: number) =>
    db.prepare('DELETE FROM team_members WHERE booking_id = ?').bind(bookingId).run(),
};

/**
 * Invite queries
 */
export const InviteQueries = {
  getByCode: (db: D1Database, code: string) =>
    db.prepare('SELECT * FROM invites WHERE code = ?').bind(code).first(),

  getByTrek: (db: D1Database, trekId: string) =>
    db
      .prepare('SELECT code, used_count, created_at FROM invites WHERE trek_id = ?')
      .bind(trekId)
      .all(),

  create: (
    db: D1Database,
    invite: {
      code: string;
      trek_id: string;
      created_by: string;
    }
  ) =>
    db
      .prepare(
        `INSERT INTO invites (code, trek_id, created_by, used_count, created_at)
         VALUES (?, ?, ?, 0, datetime('now'))`
      )
      .bind(invite.code, invite.trek_id, invite.created_by)
      .run(),

  incrementUsage: (db: D1Database, code: string) =>
    db
      .prepare('UPDATE invites SET used_count = used_count + 1 WHERE code = ?')
      .bind(code)
      .run(),
};

/**
 * Helper: Generate unique invite code
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
