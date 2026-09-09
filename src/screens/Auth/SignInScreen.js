import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#65675d',
  line: '#e2e3d9',
  inputBg: 'rgba(0,0,0,0.055)',
};

const SignInScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const passwordRef = useRef(null);

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PG.bg} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.topbar}>
              <Text style={styles.logo}>tikiti<Text style={styles.logoStar}>{'✱'}</Text></Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backLink}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Eyebrow */}
            <Text style={styles.eyebrow}>PICK UP WHERE YOU LEFT OFF</Text>

            {/* Headline */}
            <Text style={styles.h1}>BACK FOR{'\n'}<Text style={styles.h1Red}>MORE GOOD{'\n'}THINGS.</Text></Text>
            <Text style={styles.sub}>Your people. Your plans. Your Tikiti.</Text>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={PG.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput, focusedField === 'password' && styles.inputFocused]}
                placeholder="Your password"
                placeholderTextColor={PG.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={handleSignIn}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.showBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => Alert.alert('Reset password', 'Enter your email and we\'ll send a reset link.')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
              {!loading && <Text style={[styles.primaryBtnText, { fontSize: 20 }]}>→</Text>}
            </TouchableOpacity>

            {/* Switch */}
            <Text style={styles.switchText}>
              New around here?{' '}
              <Text style={styles.switchLink} onPress={() => navigation.navigate('CreateAccount')}>
                Create an account
              </Text>
            </Text>

            {/* Guest */}
            <TouchableOpacity style={styles.guestWrap}>
              <Text style={styles.guestLink}>Keep exploring as a guest ↗</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PG.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logo: { fontSize: 30, fontWeight: '700', color: PG.fg, letterSpacing: -1.5 },
  logoStar: { color: PG.red },
  backLink: { fontSize: 14, fontWeight: '600', color: PG.muted },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PG.purple,
    marginTop: 22,
    marginBottom: 0,
  },
  h1: {
    fontSize: 44,
    fontWeight: '900',
    color: PG.fg,
    lineHeight: 40,
    letterSpacing: -1,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  h1Red: { color: PG.red },
  sub: {
    fontSize: 14,
    color: PG.muted,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#fff0ee',
    borderWidth: 1,
    borderColor: '#f4c4bb',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  errorText: { fontSize: 13, color: '#c0351a' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: PG.line },
  dividerText: { fontSize: 12, color: PG.muted },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: PG.fg,
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    height: 50,
    backgroundColor: PG.inputBg,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    fontSize: 15,
    color: PG.fg,
  },
  inputFocused: {
    borderColor: PG.red,
    backgroundColor: '#fff',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 70 },
  showBtn: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  showBtnText: { fontSize: 12, fontWeight: '700', color: PG.purple },
  forgotLink: {
    fontSize: 13,
    color: PG.purple,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  primaryBtn: {
    backgroundColor: PG.red,
    height: 54,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: {
    textAlign: 'center',
    fontSize: 13,
    color: PG.muted,
    marginTop: 22,
    lineHeight: 20,
  },
  switchLink: { color: PG.red, fontWeight: '700' },
  guestWrap: { marginTop: 16, alignItems: 'center' },
  guestLink: { fontSize: 13, fontWeight: '600', color: PG.muted },
});

export default SignInScreen;
