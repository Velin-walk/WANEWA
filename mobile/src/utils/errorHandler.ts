// mobile/src/utils/errorHandler.ts
import { ApiError } from '../types';

/**
 * Normalize API errors to a consistent format
 */
export class APIErrorHandler {
  static handle(error: any): ApiError {
    // Firebase errors
    if (error.code) {
      return this.handleFirebaseError(error);
    }

    // Network errors
    if (error.message === 'Network error' || !navigator.onLine) {
      return {
        status: 0,
        message: 'Network error. Please check your connection.',
        data: error,
      };
    }

    // HTTP errors from fetch
    if (error.status) {
      return error as ApiError;
    }

    // Generic error
    return {
      status: 500,
      message: error.message || 'An unknown error occurred',
      data: error,
    };
  }

  private static handleFirebaseError(error: any): ApiError {
    const code = error.code as string;

    switch (code) {
      case 'auth/user-not-found':
        return {
          status: 404,
          message: 'User not found. Please check your email.',
        };
      case 'auth/wrong-password':
        return {
          status: 401,
          message: 'Incorrect password.',
        };
      case 'auth/email-already-in-use':
        return {
          status: 409,
          message: 'Email already in use.',
        };
      case 'auth/weak-password':
        return {
          status: 400,
          message: 'Password is too weak. Use at least 6 characters.',
        };
      case 'auth/invalid-email':
        return {
          status: 400,
          message: 'Invalid email address.',
        };
      case 'auth/operation-not-allowed':
        return {
          status: 403,
          message: 'This operation is not allowed.',
        };
      case 'auth/too-many-requests':
        return {
          status: 429,
          message: 'Too many attempts. Please try again later.',
        };
      default:
        return {
          status: 500,
          message: error.message || 'Authentication error',
        };
    }
  }

  static getErrorMessage(error: any): string {
    const apiError = this.handle(error);
    return apiError.message;
  }

  static isNetworkError(error: any): boolean {
    return !navigator.onLine || error.message === 'Network error';
  }

  static isAuthError(error: any): boolean {
    return error.status === 401 || error.status === 403;
  }

  static isServerError(error: any): boolean {
    return error.status >= 500;
  }

  static isClientError(error: any): boolean {
    return error.status >= 400 && error.status < 500;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (APIErrorHandler.isClientError(error)) {
        throw error;
      }

      // Calculate exponential backoff delay
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for promises
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Offline queue for pending operations
 */
export class OfflineQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  /**
   * Add operation to queue
   */
  enqueue(operation: () => Promise<any>): void {
    this.queue.push(operation);
  }

  /**
   * Process all queued operations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const operation = this.queue.shift();
        if (operation) {
          await retryWithBackoff(operation, 3);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }
}

// Export singleton offline queue
export const offlineQueue = new OfflineQueue();
