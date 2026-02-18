import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const SignInScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Sign In Failed', authService.getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Welcome Back to Tikiti</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Sign in to your account to continue
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Email</Text>
          <TextInput
            style={[
              styles.inputField,
              { color: colors.text.primary },
              focusedField === 'email' && styles.inputFieldFocused
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Password</Text>
          <View style={[
            styles.passwordContainer,
            focusedField === 'password' && styles.inputFieldFocused
          ]}>
            <TextInput
              style={[styles.passwordInput, { color: colors.text.primary }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showPassword}
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Feather 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.signInButton,
            { backgroundColor: colors.primary[500] },
            loading && styles.disabledButton
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.signInButtonText, { color: colors.white }]}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: colors.primary[500] }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Create Account Link */}
        <View style={styles.createAccountSection}>
          <Text style={[styles.createAccountText, { color: colors.text.secondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
            <Text style={[styles.createAccountLink, { color: colors.primary[500] }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[200],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing[6],
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  inputField: {
    backgroundColor: Colors.white,
    borderColor: Colors.border.medium,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    minHeight: 48,
    textAlignVertical: 'center',
    position: 'relative',
  },
  inputFieldFocused: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    // Double stroke effect
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary[400],
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border.medium,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 48,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  eyeIcon: {
    padding: Spacing[1],
  },
  signInButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing[6],
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  createAccountSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[8],
    paddingBottom: Spacing[8],
  },
  createAccountText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  createAccountLink: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default SignInScreen;
