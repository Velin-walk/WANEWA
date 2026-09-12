// mobile/src/utils/helpers.ts

/**
 * Date formatting utilities
 */
export const DateUtils = {
  /**
   * Format date to readable string
   */
  format: (date: string | Date, format: string = 'MMM d, yyyy'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };

    return dateObj.toLocaleDateString('en-US', options);
  },

  /**
   * Get relative time (e.g., "2 days ago")
   */
  getRelativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;

    return dateObj.toLocaleDateString();
  },

  /**
   * Check if date is in the past
   */
  isPast: (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  },

  /**
   * Check if date is today
   */
  isToday: (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  },
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Validate email
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  },

  /**
   * Validate URL
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate name (at least 2 characters, letters and spaces)
   */
  isValidName: (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  },
};

/**
 * String utilities
 */
export const StringUtils = {
  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Truncate string
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    return str.length > length ? str.substring(0, length) + suffix : str;
  },

  /**
   * Slugify string
   */
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Generate random string
   */
  generateId: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Mask sensitive data
   */
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    return local.slice(0, 2) + '*'.repeat(local.length - 2) + '@' + domain;
  },

  /**
   * Mask phone
   */
  maskPhone: (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return phone;
    return '*'.repeat(digits.length - 4) + digits.slice(-4);
  },
};

/**
 * Number utilities
 */
export const NumberUtils = {
  /**
   * Format number as currency
   */
  formatCurrency: (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  },

  /**
   * Format large numbers
   */
  formatLargeNumber: (value: number): string => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  },

  /**
   * Calculate percentage
   */
  percentage: (value: number, total: number, decimals: number = 0): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  /**
   * Clamp number between min and max
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  },
};

/**
 * Array utilities
 */
export const ArrayUtils = {
  /**
   * Remove duplicates
   */
  unique: <T>(array: T[], key?: (item: T) => any): T[] => {
    if (key) {
      const seen = new Set();
      return array.filter((item) => {
        const k = key(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    return [...new Set(array)];
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Shuffle array
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Group array by key
   */
  groupBy: <T>(array: T[], key: (item: T) => string): Record<string, T[]> => {
    return array.reduce(
      (groups, item) => {
        const k = key(item);
        if (!groups[k]) groups[k] = [];
        groups[k].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  },
};

/**
 * Object utilities
 */
export const ObjectUtils = {
  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Deep merge objects
   */
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = ObjectUtils.deepMerge(
          result[key] || {},
          source[key] as Record<string, any>
        );
      } else {
        result[key] = source[key] as any;
      }
    }
    return result;
  },

  /**
   * Pick specific keys from object
   */
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
      result[key] = obj[key];
    });
    return result;
  },

  /**
   * Omit specific keys from object
   */
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as any;
    keys.forEach((key) => {
      delete result[key];
    });
    return result;
  },
};

/**
 * Local storage utilities
 */
export const StorageUtils = {
  /**
   * Set item in local storage
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  /**
   * Get item from local storage
   */
  getItem: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * Remove item from local storage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  /**
   * Clear all items from local storage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
