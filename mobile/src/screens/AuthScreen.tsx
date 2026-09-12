// mobile/src/screens/AuthScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { THEME } from '../theme/colors';

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      setCheckingAuth(false);
      if (user) {
        // Navigate to main app
        navigation.navigate('Main' as never);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await FirebaseAuthService.signInWithGoogle();
      if (result) {
        // Successfully signed in
        navigation.navigate('Main' as never);
      }
    } catch (error: any) {
      Alert.alert('Sign-In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      const result = await FirebaseAuthService.signInAnonymously();
      if (result) {
        // Navigate to app, but mark as anonymous
        navigation.navigate('Main' as never);
      }
    } catch (error: any) {
      Alert.alert('Sign-In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.orange.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🏔️</Text>
        <Text style={styles.appName}>Walk Nepal Walk</Text>
        <Text style={styles.tagline}>Discover & Join Amazing Treks</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Start Your Adventure</Text>
        <Text style={styles.heroDescription}>
          Connect with fellow trekkers, book your next trek, and explore the
          beauty of Nepal together.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        {[
          { icon: '🗺️', text: 'Explore curated treks' },
          { icon: '👥', text: 'Join community events' },
          { icon: '📍', text: 'Real-time participant updates' },
          { icon: '💬', text: 'Connect with trekkers' },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* Auth Buttons */}
      <View style={styles.authSection}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.googleIcon}>🔍</Text>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.divider}>or</Text>

        <TouchableOpacity
          style={styles.anonButton}
          onPress={handleAnonymousSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME.gray[900]} />
          ) : (
            <Text style={styles.anonButtonText}>Browse as Guest</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '300',
    color: THEME.gray[900],
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: THEME.gray[500],
    letterSpacing: 0.8,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginVertical: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.gray[900],
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 14,
    color: THEME.gray[700],
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginVertical: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureText: {
    fontSize: 13,
    color: THEME.gray[700],
    fontWeight: '500',
  },
  authSection: {
    paddingHorizontal: 24,
    marginVertical: 32,
    gap: 12,
  },
  googleButton: {
    backgroundColor: THEME.gray[900],
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  googleIcon: {
    fontSize: 18,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    color: THEME.gray[400],
    fontSize: 13,
    fontWeight: '600',
  },
  anonButton: {
    backgroundColor: THEME.gray[100],
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.gray[200],
  },
  anonButtonText: {
    color: THEME.gray[900],
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 11,
    color: THEME.gray[500],
    textAlign: 'center',
    lineHeight: 16,
  },
});
