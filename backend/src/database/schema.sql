-- Treks table
CREATE TABLE treks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  days TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  leader TEXT,
  capacity INTEGER DEFAULT 20,
  itinerary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Participants (bookings)
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trek_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  age_group TEXT,
  gender TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trek_id) REFERENCES treks(id)
);

-- Team members (linked to primary booker)
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT,
  age_group TEXT,
  phone TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Invite links
CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  trek_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  used_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trek_id) REFERENCES treks(id)
);

-- Create indexes
CREATE INDEX idx_trek_date ON treks(date);
CREATE INDEX idx_booking_trek ON bookings(trek_id);
CREATE INDEX idx_booking_email ON bookings(user_email);
CREATE INDEX idx_team_booking ON team_members(booking_id);
