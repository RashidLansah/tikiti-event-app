import React, { useState, useRef, useCallback, memo } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import logger from '../../utils/logger';

// Memoized password field component to prevent re-renders from parent state changes
// On Android, any re-render of a component containing secureTextEntry TextInputs
// causes the native EditText to be recreated, resulting in focus loss/blink
const PasswordField = memo(({
  label,
  placeholder,
  value,
  onChangeText,
  showPassword,
  onTogglePassword,
  inputRef
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeIcon}
          activeOpacity={0.7}
        >
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const RegisterScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState('user');
  const [focusedInput, setFocusedInput] = useState(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Stable callbacks for password fields to prevent PasswordField re-renders
  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
    if (Platform.OS === 'android') {
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, []);

  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
    if (Platform.OS === 'android') {
      setTimeout(() => confirmPasswordRef.current?.focus(), 100);
    }
  }, []);

  const { register } = useAuth();
  const accountType = selectedAccountType;

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleInputFocus = (inputName) => {
    if (Platform.OS === 'android') {
      return; // Skip focus styling on Android to prevent secureTextEntry re-render blink
    }
    setFocusedInput(inputName);
  };

  const handleInputBlur = () => {
    if (Platform.OS === 'android') {
      return; // Skip blur styling on Android to match
    }
    setFocusedInput(null);
  };

  const validateForm = () => {
    const { firstName, lastName, email } = formData;

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
      const { firstName, lastName, email } = formData;
      const displayName = `${firstName} ${lastName}`;
      
      // Create user profile data
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        displayName,
        accountType,
      };
      
      logger.log('Creating profile with accountType:', accountType);
      logger.log('Full profile data:', profileData);
      
      // Register user and create profile (handled by AuthContext)
      const user = await register(email.trim(), password, displayName, profileData);

      logger.log('Registration successful:', user.email);

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
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
            Join thousands of event enthusiasts and organizers on Tikiti
          </Text>
        </View>

        {/* User Type Selection */}
        <View style={styles.userTypeSection}>
          <Text style={styles.userTypeTitle}>I want to join as:</Text>
          
          <View style={styles.userTypeOptions}>
            {/* Attendee Option */}
            <TouchableOpacity
              style={[
                styles.userTypeOption,
                selectedAccountType === 'user' && styles.userTypeOptionSelected
              ]}
              onPress={() => setSelectedAccountType('user')}
              activeOpacity={0.7}
            >
              <View style={styles.userTypeContent}>
                <View style={[
                  styles.userTypeIcon,
                  { backgroundColor: selectedAccountType === 'user' ? Colors.primary[500] : Colors.background.secondary }
                ]}>
                  <Feather 
                    name="user" 
                    size={24} 
                    color={selectedAccountType === 'user' ? Colors.white : Colors.text.secondary} 
                  />
                </View>
                <View style={styles.userTypeInfo}>
                  <Text style={[
                    styles.userTypeOptionTitle,
                    selectedAccountType === 'user' && styles.userTypeOptionTitleSelected
                  ]}>
                    Event Attendee
                  </Text>
                  <Text style={styles.userTypeOptionDescription}>
                    Discover and book tickets for amazing events
                  </Text>
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedAccountType === 'user' && styles.radioButtonSelected
              ]}>
                {selectedAccountType === 'user' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            {/* Organizer Option */}
            <TouchableOpacity
              style={[
                styles.userTypeOption,
                selectedAccountType === 'organizer' && styles.userTypeOptionSelected
              ]}
              onPress={() => setSelectedAccountType('organizer')}
              activeOpacity={0.7}
            >
              <View style={styles.userTypeContent}>
                <View style={[
                  styles.userTypeIcon,
                  { backgroundColor: selectedAccountType === 'organizer' ? Colors.success[500] : Colors.background.secondary }
                ]}>
                  <Feather 
                    name="users" 
                    size={24} 
                    color={selectedAccountType === 'organizer' ? Colors.white : Colors.text.secondary} 
                  />
                </View>
                <View style={styles.userTypeInfo}>
                  <Text style={[
                    styles.userTypeOptionTitle,
                    selectedAccountType === 'organizer' && styles.userTypeOptionTitleSelected
                  ]}>
                    Event Organizer
                  </Text>
                  <Text style={styles.userTypeOptionDescription}>
                    Create events, sell tickets and grow your audience
                  </Text>
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedAccountType === 'organizer' && styles.radioButtonSelected
              ]}>
                {selectedAccountType === 'organizer' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameInput}>
              <Text style={styles.label}>First Name</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'firstName' && styles.inputContainerFocused
              ]}>
                <Feather name="user" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  placeholder="First name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                  onFocus={() => handleInputFocus('firstName')}
                  onBlur={handleInputBlur}
                />
              </View>
            </View>

            <View style={styles.nameInput}>
              <Text style={styles.label}>Last Name</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'lastName' && styles.inputContainerFocused
              ]}>
                <Feather name="user" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  placeholder="Last name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                  onFocus={() => handleInputFocus('lastName')}
                  onBlur={handleInputBlur}
                />
              </View>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputContainerFocused
            ]}>
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
                onFocus={() => handleInputFocus('email')}
                onBlur={handleInputBlur}
              />
            </View>
          </View>

          {/* Password Input - Memoized to prevent Android secureTextEntry blink */}
          <PasswordField
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            showPassword={showPassword}
            onTogglePassword={handleTogglePassword}
            inputRef={passwordRef}
          />

          {/* Confirm Password Input - Memoized to prevent Android secureTextEntry blink */}
          <PasswordField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showConfirmPassword}
            onTogglePassword={handleToggleConfirmPassword}
            inputRef={confirmPasswordRef}
          />

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
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  inputContainer: {
    ...Components.input.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    ...Components.input.focused,
  },
  inputIcon: {
    marginRight: Spacing[3],
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.semibold,
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
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  signInLink: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  userTypeSection: {
    marginBottom: Spacing[8],
  },
  userTypeTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  userTypeOptions: {
    gap: Spacing[3],
  },
  userTypeOption: {
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  userTypeOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  userTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeOptionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  userTypeOptionTitleSelected: {
    color: Colors.primary[700],
  },
  userTypeOptionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing[2],
  },
  radioButtonSelected: {
    borderColor: Colors.primary[500],
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
  },
});

export default RegisterScreen;