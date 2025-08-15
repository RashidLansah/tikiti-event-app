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

const RegisterScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { createUserProfile } = useAuth();
  const accountType = route.params?.accountType || 'user';

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const { firstName, lastName, email, password } = formData;
      const displayName = `${firstName} ${lastName}`;
      
      // Create Firebase auth user
      const user = await authService.register(email.trim(), password, displayName);
      
      // Create user profile in Firestore
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        displayName,
        accountType,
        isEmailVerified: user.emailVerified,
      };
      
      console.log('🔍 Creating profile with accountType:', accountType);
      console.log('🔍 Full profile data:', profileData);
      
      await createUserProfile(user.uid, profileData);

      console.log('✅ Registration successful:', user.email);
      
      // Navigation will be handled by AuthContext state change
    } catch (error) {
      Alert.alert('Registration Failed', authService.getErrorMessage(error));
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Tikiti as {accountType === 'organizer' ? 'an event organizer' : 'an attendee'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameInput}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  placeholder="First name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.nameInput}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  placeholder="Last name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
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
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a password"
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

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={Colors.text.tertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Feather name="user-plus" size={20} color={Colors.white} style={styles.buttonIcon} />
                <Text style={styles.registerButtonText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInSection}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  nameInput: {
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
  registerButton: {
    ...Components.button.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    marginBottom: Spacing[6],
    marginTop: Spacing[4],
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },
  registerButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
  },
  signInText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  signInLink: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default RegisterScreen;