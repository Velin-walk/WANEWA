// mobile/src/services/cloudflareAPI.ts
import { FirebaseAuthService } from './firebaseAuth';

// Update this with your actual Cloudflare Workers domain
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.walk-nepal.workers.dev';

interface ApiError {
  status: number;
  message: string;
  data?: any;
}

/**
 * Cloudflare API Client
 * Handles all communication with the backend
 */
export class CloudflareAPI {
  /**
   * Generic fetch wrapper with auth and error handling
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Add auth token if user is logged in
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = await FirebaseAuthService.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error || response.statusText,
          data: errorData,
        } as ApiError;
      }

      return await response.json() as T;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 0,
        message: error.message || 'Network error',
        data: error,
      } as ApiError;
    }
  }

  /**
   * ===== PUBLIC TREKS =====
   */

  /**
   * Get all upcoming treks
   */
  static async getTreks(): Promise<any[]> {
    return this.request('/treks');
  }

  /**
   * Get trek details with live participant count
   */
  static async getTrekDetails(trekId: string): Promise<any> {
    return this.request(`/treks/${trekId}`);
  }

  /**
   * ===== BOOKINGS =====
   */

  /**
   * Get user's bookings (auth required)
   */
  static async getUserBookings(): Promise<any[]> {
    return this.request('/bookings');
  }

  /**
   * Register for a trek
   */
  static async registerForTrek(
    trekId: string,
    bookingData: {
      full_name: string;
      phone: string;
      whatsapp: string;
      age_group: string;
      gender: 'm' | 'f';
      team_members?: Array<{
        full_name: string;
        gender: 'm' | 'f';
        age_group?: string;
        phone?: string;
      }>;
    }
  ): Promise<any> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        trek_id: trekId,
        ...bookingData,
      }),
    });
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: number): Promise<any> {
    return this.request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  /**
   * ===== REAL-TIME UPDATES =====
   */

  /**
   * Get WebSocket URL for trek participant updates
   */
  static getWebSocketUrl(trekId: string): string {
    // Convert https to wss (WebSocket Secure)
    const wsBase = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');
    return `${wsBase}/ws/trek/${trekId}`;
  }

  /**
   * ===== INVITES =====
   */

  /**
   * Join trek via invite code
   */
  static async joinViaInvite(inviteCode: string): Promise<any> {
    return this.request('/invites/join', {
      method: 'POST',
      body: JSON.stringify({ code: inviteCode }),
    });
  }

  /**
   * Get trek invite link
   */
  static async getInviteLink(trekId: string): Promise<any> {
    return this.request(`/treks/${trekId}/invite`, {
      method: 'POST',
    });
  }

  /**
   * ===== UTILS =====
   */

  /**
   * Health check
   */
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Set base URL dynamically (useful for dev/prod switching)
   */
  static setBaseUrl(url: string): void {
    // This would require refactoring to store API_BASE_URL in a class variable
    console.log('API base URL set to:', url);
  }
}

/**
 * Error handler utility
 */
export function handleApiError(error: any): string {
  if (error.status === 401) {
    return 'Authentication failed. Please log in again.';
  }
  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  if (error.status === 404) {
    return 'Resource not found.';
  }
  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An error occurred. Please try again.';
}
