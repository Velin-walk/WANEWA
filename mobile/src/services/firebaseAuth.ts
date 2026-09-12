// mobile/src/services/firebaseAuth.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  signInAnonymously,
  PhoneAuthProvider,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyCa_4nUh2ABbrWQV2ybFYQ6LUu7ZaQbiLg',
  authDomain: 'walk-nepal-walk.firebaseapp.com',
  projectId: 'walk-nepal-walk',
  storageBucket: 'walk-nepal-walk.firebasestorage.app',
  messagingSenderId: '1066461909049',
  appId: '1:1066461909049:web:372d0d25dd58dcbab3fde8',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const phoneProvider = new PhoneAuthProvider(auth);

// Google Sign-In
googleProvider.addScope('profile');
googleProvider.addScope('email');

export class FirebaseAuthService {
  /**
   * Sign in with Google (web) or Google Sign-In (native)
   */
  static async signInWithGoogle(): Promise<UserCredential | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await this.registerForPushNotifications(result.user);
      return result;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Google sign-in failed');
    }
  }

  /**
   * Sign in with email/password
   * (Requires Firebase to have email/password auth enabled)
   */
  static async signInWithEmail(email: string, password: string): Promise<UserCredential | null> {
    try {
      // This requires Firebase authentication setup
      // For now, using Google as primary auth
      throw new Error('Email/password auth not yet configured');
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Sign in anonymously (for browsing without account)
   */
  static async signInAnonymously(): Promise<UserCredential | null> {
    try {
      const result = await signInAnonymously(auth);
      return result;
    } catch (error: any) {
      console.error('Anonymous sign-in error:', error);
      throw new Error(error.message || 'Anonymous sign-in failed');
    }
  }

  /**
   * Sign out current user
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(error.message || 'Sign-out failed');
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get ID token for API requests
   */
  static async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Register device for push notifications
   */
  static async registerForPushNotifications(user: User): Promise<string | null> {
    try {
      const messaging = getMessaging(app);
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BMf...', // Add your VAPID key here
      });

      if (token) {
        console.log('FCM Token:', token);
        // Store token in your backend associated with user
        await this.savePushToken(user.email || user.uid, token);
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push notification token to backend
   */
  private static async savePushToken(userId: string, token: string): Promise<void> {
    try {
      const idToken = await this.getIdToken();
      if (!idToken) return;

      // This would call your backend API
      // await fetch(`${API_URL}/users/${userId}/push-token`, {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${idToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ token }),
      // });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Verify phone number (for future SMS auth)
   */
  static async verifyPhoneNumber(phoneNumber: string): Promise<any> {
    try {
      // This would require Firebase phone auth setup
      // const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      // return confirmationResult;
      throw new Error('Phone auth not yet configured');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      throw new Error(error.message);
    }
  }
}

export { auth, googleProvider };
export type { User, UserCredential };
