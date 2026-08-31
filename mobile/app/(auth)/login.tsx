import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Switch,
  Linking,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { spacing, radius, typography, shadows } from '@/lib/theme';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/TextInput';
import { useAuthStore } from '@/lib/auth';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://uma.sohamkakra.com/api').replace(/\/$/, '');
const BETA_TERMS_VERSION = '2026-07-10';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [acceptedBetaTerms, setAcceptedBetaTerms] = useState(false);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  async function checkBiometricAvailability() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void checkBiometricAvailability();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSendOtp = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim().toLowerCase() }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? 'Failed to send OTP.');
      }
      setOtpSent(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      alert('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const verifyResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-UMA-Client': 'ios',
        },
        body: JSON.stringify({
          identifier: email.trim().toLowerCase(),
          code: otp,
          acceptedTermsVersion: BETA_TERMS_VERSION,
        }),
      });
      const verifyResult = await verifyResponse.json() as { ok?: boolean; token?: string; error?: string };
      if (!verifyResponse.ok || !verifyResult.ok || !verifyResult.token) {
        throw new Error(verifyResult.error ?? 'Failed to verify OTP.');
      }
      const sessionResponse = await fetch(`${API_BASE}/auth/session`, {
        headers: { Authorization: `Bearer ${verifyResult.token}` },
      });
      const session = await sessionResponse.json() as {
        ok?: boolean;
        userId?: string;
        email?: string | null;
      };
      if (!sessionResponse.ok || !session.ok || !session.userId) {
        throw new Error('Signed in, but the account could not be loaded.');
      }
      await setAuthenticated(verifyResult.token, {
        id: session.userId,
        email: session.email ?? email.trim().toLowerCase(),
      });
      router.replace('/(tabs)');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: 'Unlock UMA to access your health records',
      });

      if (result.success) {
        const token = await SecureStore.getItemAsync('auth_token');
        const rawUser = await SecureStore.getItemAsync('user_data');
        if (token && rawUser) {
          await setAuthenticated(token, JSON.parse(rawUser));
          router.replace('/(tabs)');
        } else {
          alert('Sign in with a one-time code before enabling biometric unlock.');
        }
      }
    } catch (error) {
      alert('Biometric authentication failed');
    }
  };

  const contentWidth = isTablet ? Math.min(width * 0.6, 500) : width - spacing.lg * 2;
  const contentMarginHorizontal = isTablet ? (width - contentWidth) / 2 : spacing.lg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { marginHorizontal: contentMarginHorizontal }]}>
            {/* Logo/Branding */}
            <View style={styles.brandingSection}>
              <Text style={[styles.logo, { color: theme.accent }]}>UMA</Text>
              <Text style={[styles.tagline, { color: theme.fg }]}>Your Health Companion</Text>
            </View>

            {/* Main Card */}
            <Card style={styles.card}>
              {!otpSent ? (
                <>
                  <Text style={[styles.title, { color: theme.fg }]}>Welcome Back</Text>
                  <Text style={[styles.subtitle, { color: theme.muted }]}>
                    Sign in with your email to access your health records
                  </Text>

                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="your@email.com"
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      placeholderTextColor={theme.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.consentRow}>
                    <Switch
                      value={acceptedBetaTerms}
                      onValueChange={setAcceptedBetaTerms}
                      accessibilityLabel="Accept closed beta terms"
                    />
                    <Text style={[styles.consentText, { color: theme.muted }]}>
                      I am 18 or older, will use synthetic records only, and accept the{' '}
                      <Text
                        style={[styles.consentLink, { color: theme.accent }]}
                        onPress={() => Linking.openURL('https://uma.sohamkakra.com/terms')}
                      >
                        beta terms
                      </Text>
                      {' '}and{' '}
                      <Text
                        style={[styles.consentLink, { color: theme.accent }]}
                        onPress={() => Linking.openURL('https://uma.sohamkakra.com/privacy')}
                      >
                        privacy policy
                      </Text>.
                    </Text>
                  </View>

                  <Button
                    title="Send OTP"
                    onPress={handleSendOtp}
                    loading={loading}
                    disabled={!acceptedBetaTerms}
                    style={styles.button}
                  />

                  {biometricAvailable && (
                    <>
                      <View style={[styles.divider, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
                      </View>

                      <Button
                        title="Sign in with Biometric"
                        variant="ghost"
                        onPress={handleBiometricLogin}
                        style={styles.button}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: theme.fg }]}>Verify Your Email</Text>
                  <Text style={[styles.subtitle, { color: theme.muted }]}>
                    We sent a 6-digit code to {email}
                  </Text>

                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="000000"
                      value={otp}
                      onChangeText={setOtp}
                      editable={!loading}
                      maxLength={6}
                      keyboardType="number-pad"
                      placeholderTextColor={theme.muted}
                    />
                  </View>

                  <Button
                    title="Verify"
                    onPress={handleVerifyOtp}
                    loading={loading}
                    style={styles.button}
                  />

                  <Button
                    title="Back to Email"
                    variant="ghost"
                    onPress={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    style={styles.button}
                  />
                </>
              )}
            </Card>

            {/* Disclaimer */}
            <View style={[styles.disclaimer, { borderTopColor: theme.border }]}>
              <Text style={[styles.disclaimerText, { color: theme.muted }]}>
                UMA is a health companion tool for managing your records. It is not a substitute for
                professional medical advice, diagnosis, or treatment. Always consult with a qualified
                healthcare provider.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontFamily: 'fraunces-bold',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'space-grotesk',
  },
  card: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontFamily: 'fraunces-bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: spacing.lg,
    fontFamily: 'space-grotesk',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  button: {
    marginBottom: spacing.md,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  consentText: {
    flex: 1,
    fontFamily: 'space-grotesk',
    fontSize: 14,
    lineHeight: 20,
  },
  consentLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: 12,
    fontFamily: 'space-grotesk',
    backgroundColor: 'transparent',
  },
  disclaimer: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'space-grotesk',
  },
});
