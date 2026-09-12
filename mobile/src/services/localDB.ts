// mobile/src/services/localDB.ts
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

const DB_NAME = 'WalkNepalWalk.db';
const DB_VERSION = '1.0';

interface Trek {
  id: string;
  name: string;
  date: string;
  days: string;
  difficulty: string;
  leader?: string;
  capacity: number;
  itinerary?: string;
  cached_at: number;
}

interface Booking {
  id: number;
  trek_id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  age_group?: string;
  gender: 'm' | 'f';
  joined_at: string;
  local_id?: string; // Local reference for offline submissions
}

export class LocalDB {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: DB_NAME,
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Cached treks
      `CREATE TABLE IF NOT EXISTS treks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        days TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        leader TEXT,
        capacity INTEGER DEFAULT 20,
        itinerary TEXT,
        cached_at INTEGER
      );`,

      // User's bookings
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trek_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        whatsapp TEXT,
        age_group TEXT,
        gender TEXT,
        joined_at TEXT,
        synced INTEGER DEFAULT 0,
        local_id TEXT UNIQUE
      );`,

      // Pending registrations (for offline support)
      `CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trek_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER,
        FOREIGN KEY (trek_id) REFERENCES treks(id)
      );`,

      // Search history
      `CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        searched_at INTEGER
      );`,

      // Bookmarks/favorites
      `CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trek_id TEXT NOT NULL UNIQUE,
        bookmarked_at INTEGER,
        FOREIGN KEY (trek_id) REFERENCES treks(id)
      );`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_treks_date ON treks(date);`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_trek ON bookings(trek_id);`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_synced ON bookings(synced);`,
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }
  }

  /**
   * ===== TREKS =====
   */

  /**
   * Cache treks locally
   */
  async cacheTreks(treks: Trek[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const timestamp = Date.now();

    for (const trek of treks) {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO treks 
         (id, name, date, days, difficulty, leader, capacity, itinerary, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trek.id,
          trek.name,
          trek.date,
          trek.days,
          trek.difficulty,
          trek.leader || null,
          trek.capacity,
          trek.itinerary || null,
          timestamp,
        ]
      );
    }

    console.log(`Cached ${treks.length} treks`);
  }

  /**
   * Get cached treks
   */
  async getCachedTreks(): Promise<Trek[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT * FROM treks ORDER BY date ASC`
    );

    return results[0].rows.raw().map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      days: row.days,
      difficulty: row.difficulty,
      leader: row.leader,
      capacity: row.capacity,
      itinerary: row.itinerary,
      cached_at: row.cached_at,
    }));
  }

  /**
   * Get single cached trek
   */
  async getCachedTrek(trekId: string): Promise<Trek | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT * FROM treks WHERE id = ?`,
      [trekId]
    );

    if (results[0].rows.length === 0) return null;
    return results[0].rows.raw()[0];
  }

  /**
   * Clear cached treks older than X hours
   */
  async clearOldCache(hoursOld: number = 24): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - hoursOld * 3600 * 1000;
    await this.db.executeSql(
      `DELETE FROM treks WHERE cached_at < ?`,
      [cutoffTime]
    );
  }

  /**
   * ===== BOOKINGS =====
   */

  /**
   * Save booking locally
   */
  async saveBooking(booking: Booking): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `INSERT INTO bookings 
       (trek_id, full_name, phone, whatsapp, age_group, gender, joined_at, synced, local_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.trek_id,
        booking.full_name,
        booking.phone || null,
        booking.whatsapp || null,
        booking.age_group || null,
        booking.gender,
        booking.joined_at,
        1, // Assume synced
        booking.local_id,
      ]
    );

    return results[0].insertId as number;
  }

  /**
   * Get user's cached bookings
   */
  async getUserBookings(): Promise<Booking[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT * FROM bookings ORDER BY joined_at DESC`
    );

    return results[0].rows.raw() as Booking[];
  }

  /**
   * Get unsynced bookings (for offline support)
   */
  async getUnsyncedBookings(): Promise<Booking[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT * FROM bookings WHERE synced = 0`
    );

    return results[0].rows.raw() as Booking[];
  }

  /**
   * Mark booking as synced
   */
  async markBookingSynced(localId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `UPDATE bookings SET synced = 1 WHERE local_id = ?`,
      [localId]
    );
  }

  /**
   * ===== FAVORITES =====
   */

  /**
   * Add trek to favorites
   */
  async addFavorite(trekId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT OR IGNORE INTO favorites (trek_id, bookmarked_at)
       VALUES (?, ?)`,
      [trekId, Date.now()]
    );
  }

  /**
   * Remove trek from favorites
   */
  async removeFavorite(trekId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `DELETE FROM favorites WHERE trek_id = ?`,
      [trekId]
    );
  }

  /**
   * Get all favorite treks
   */
  async getFavorites(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT trek_id FROM favorites ORDER BY bookmarked_at DESC`
    );

    return results[0].rows.raw().map((row: any) => row.trek_id);
  }

  /**
   * Check if trek is favorited
   */
  async isFavorited(trekId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT COUNT(*) as count FROM favorites WHERE trek_id = ?`,
      [trekId]
    );

    return (results[0].rows.raw()[0] as any).count > 0;
  }

  /**
   * ===== SEARCH HISTORY =====
   */

  /**
   * Add search query to history
   */
  async addSearchHistory(query: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO search_history (query, searched_at)
       VALUES (?, ?)`,
      [query, Date.now()]
    );
  }

  /**
   * Get search history
   */
  async getSearchHistory(limit: number = 10): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      `SELECT DISTINCT query FROM search_history 
       ORDER BY searched_at DESC LIMIT ?`,
      [limit]
    );

    return results[0].rows.raw().map((row: any) => row.query);
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(`DELETE FROM search_history`);
  }

  /**
   * ===== CLEANUP =====
   */

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(`DELETE FROM treks`);
    await this.db.executeSql(`DELETE FROM bookings`);
    await this.db.executeSql(`DELETE FROM favorites`);
    await this.db.executeSql(`DELETE FROM search_history`);
    await this.db.executeSql(`DELETE FROM pending_registrations`);

    console.log('Database cleared');
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const localDB = new LocalDB();
