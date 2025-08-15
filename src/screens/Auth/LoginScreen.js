import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createUserProfile } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const user = await authService.login(email.trim(), password);
      
      // Navigation will be handled by AuthContext state change
      console.log('Login successful:', user.email);
    } catch (error) {
      Alert.alert('Login Failed', authService.getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    try {
      await authService.resetPassword(email.trim());
      Alert.alert(
        'Password Reset',
        'A password reset link has been sent to your email address.'
      );
    } catch (error) {
      Alert.alert('Error', authService.getErrorMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to Tikiti</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={Colors.text.tertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
              ) : (
              <>
                <Feather name="log-in" size={20} color={Colors.white} style={styles.buttonIcon} />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
              )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing[6],
  },
  backButton: {
    padding: Spacing[2],
    alignSelf: 'flex-start',
  },
  titleSection: {
    marginBottom: Spacing[8],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing[6],
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  inputContainer: {
    ...Components.input.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: Spacing[3],
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    padding: 0,
  },
  eyeIcon: {
    padding: Spacing[1],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing[8],
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  loginButton: {
    ...Components.button.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    marginBottom: Spacing[6],
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },
  loginButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[4],
  },
  signUpText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  signUpLink: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default LoginScreen;