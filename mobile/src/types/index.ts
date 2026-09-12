// mobile/src/types/index.ts

/**
 * Trek related types
 */
export interface Trek {
  id: string;
  name: string;
  date: string;
  days: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
  leader?: string;
  capacity: number;
  itinerary?: string;
  participants?: number;
  participants_by_gender?: ParticipantCount;
  cached_at?: number;
}

export interface ParticipantCount {
  total: number;
  male: number;
  female: number;
}

/**
 * Booking related types
 */
export interface TeamMember {
  full_name: string;
  gender: 'm' | 'f';
  age_group?: string;
  phone?: string;
}

export interface Booking {
  id?: number;
  trek_id: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  age_group: string;
  gender: 'm' | 'f';
  joined_at?: string;
  trek_name?: string;
  trek_date?: string;
  trek_difficulty?: string;
  team_members?: TeamMember[];
  synced?: number;
  local_id?: string;
}

/**
 * User/Auth related types
 */
export interface User {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

/**
 * API related types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  data?: any;
}

/**
 * WebSocket related types
 */
export type WebSocketMessageType = 
  | 'initial'
  | 'participant_joined'
  | 'participant_left'
  | 'error'
  | 'connected'
  | 'disconnected';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  participants?: ParticipantCount;
  count?: ParticipantCount;
  new_person?: string;
  gender?: 'm' | 'f';
  timestamp?: number;
  trek_id?: string;
}

/**
 * Invite related types
 */
export interface Invite {
  code: string;
  trek_id: string;
  created_by: string;
  used_count: number;
  created_at: string;
}

/**
 * UI State types
 */
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface ModalState {
  visible: boolean;
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Form related types
 */
export interface RegistrationFormData {
  trek_id: string;
  full_name: string;
  phone: string;
  whatsapp?: string;
  age_group: string;
  gender: 'm' | 'f';
  team_members?: TeamMember[];
}

/**
 * Filter and Sort types
 */
export interface TrekFilters {
  difficulty?: 'easy' | 'moderate' | 'difficult';
  minDate?: string;
  maxDate?: string;
  minDays?: number;
  maxDays?: number;
  capacity?: number;
}

export type TrekSortBy = 'date' | 'difficulty' | 'capacity' | 'name';

/**
 * Notification types
 */
export interface PushNotification {
  type: 'participant_joined' | 'trek_reminder' | 'booking_confirmed';
  trek_id: string;
  trek_name: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Local storage types
 */
export interface StorageData {
  user?: User;
  lastBookings?: Booking[];
  lastTreks?: Trek[];
  favorites?: string[];
  theme?: 'light' | 'dark';
  language?: string;
}

/**
 * Redux state types
 */
export interface TrekState {
  treks: Trek[];
  selectedTrek: Trek | null;
  loading: boolean;
  error: string | null;
  lastFetched: number;
  favorites: string[];
}

export interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

export interface ParticipantState {
  participants: {
    [key: string]: ParticipantCount;
  };
  updates: Array<{
    trek_id: string;
    count: ParticipantCount;
    new_person?: string;
    timestamp: number;
  }>;
  loading: boolean;
  error: string | null;
}
