import React, { useState, useRef } from 'react';
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
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const CreateAccountFlow = ({ navigation }) => {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    interests: [],
  });

  const totalSteps = 6;

  // Countries list
  const countries = [
    'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Tunisia',
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Japan', 'South Korea', 'China', 'India', 'Brazil', 'Argentina', 'Mexico',
    'Chile', 'Colombia', 'Peru', 'Uruguay', 'Venezuela', 'Ecuador', 'Bolivia',
    'Paraguay', 'Guyana', 'Suriname', 'French Guiana', 'Belize', 'Costa Rica',
    'Panama', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Cuba',
    'Jamaica', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Trinidad and Tobago',
    'Barbados', 'Bahamas', 'Antigua and Barbuda', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Grenada', 'Dominica'
  ].sort();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting registration with data:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
        interests: formData.interests
      });

      await register(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`, // displayName parameter
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`,
          country: formData.country,
          interests: formData.interests,
          accountType: 'user', // Default to attendee
        }
      );
      
      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBar, { backgroundColor: colors.gray[200] }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary[500],
                width: `${(currentStep / totalSteps) * 100}%`
              }
            ]} 
          />
        </View>
      </View>
      <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What's your name?
      </Text>
      
      <View style={styles.typeformInputsContainer}>
        <TextInput
          style={[
            styles.typeformInput,
            { color: colors.text.primary, borderColor: colors.border.medium },
            focusedField === 'firstName' && { 
              borderColor: colors.primary[500], 
              borderWidth: 2,
              shadowColor: colors.primary[500],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 2,
              borderBottomWidth: 3,
              borderBottomColor: colors.primary[400],
            }
          ]}
          placeholder="First name"
          placeholderTextColor={colors.text.tertiary}
          value={formData.firstName}
          onChangeText={(value) => updateFormData('firstName', value)}
          onFocus={() => setFocusedField('firstName')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        
        <TextInput
          style={[
            styles.typeformInput,
            { color: colors.text.primary, borderColor: colors.border.medium },
            focusedField === 'lastName' && { 
              borderColor: colors.primary[500], 
              borderWidth: 2,
              shadowColor: colors.primary[500],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 2,
              borderBottomWidth: 3,
              borderBottomColor: colors.primary[400],
            }
          ]}
          placeholder="Last name"
          placeholderTextColor={colors.text.tertiary}
          value={formData.lastName}
          onChangeText={(value) => updateFormData('lastName', value)}
          onFocus={() => setFocusedField('lastName')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What's your email?
      </Text>
      
      <TextInput
        style={[
          styles.typeformInput,
          { color: colors.text.primary, borderColor: colors.border.medium },
          focusedField === 'email' && { 
            borderColor: colors.primary[500], 
            borderWidth: 2,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary[400],
          }
        ]}
        placeholder="your@email.com"
        placeholderTextColor={colors.text.tertiary}
        value={formData.email}
        onChangeText={(value) => updateFormData('email', value)}
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField(null)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Create a password
      </Text>
      
      <View style={styles.typeformInputsContainer}>
        <View style={[
          styles.typeformPasswordContainer,
          { borderColor: colors.border.medium },
          focusedField === 'password' && { 
            borderColor: colors.primary[500], 
            borderWidth: 2,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary[400],
          }
        ]}>
          <TextInput
            ref={passwordRef}
            style={[styles.typeformPasswordInput, { color: colors.text.primary }]}
            placeholder="Password"
            placeholderTextColor={colors.text.tertiary}
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCorrect={false}
            returnKeyType="next"
          />
          <TouchableOpacity
            onPress={() => {
              setShowPassword(!showPassword);
              if (Platform.OS === 'android') {
                setTimeout(() => passwordRef.current?.focus(), 100);
              }
            }}
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
        
        <View style={[
          styles.typeformPasswordContainer,
          { borderColor: colors.border.medium },
          focusedField === 'confirmPassword' && { 
            borderColor: colors.primary[500], 
            borderWidth: 2,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary[400],
          },
          formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && { borderColor: colors.success[500], borderWidth: 2 }
        ]}>
          <TextInput
            ref={confirmPasswordRef}
            style={[styles.typeformPasswordInput, { color: colors.text.primary }]}
            placeholder="Confirm password"
            placeholderTextColor={colors.text.tertiary}
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showConfirmPassword}
            autoCorrect={false}
            returnKeyType="done"
          />
          <View style={styles.passwordIconsContainer}>
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <Feather
                name="check-circle"
                size={20}
                color={colors.success[500]}
                style={styles.passwordMatchIcon}
              />
            )}
            <TouchableOpacity
              onPress={() => {
                setShowConfirmPassword(!showConfirmPassword);
                if (Platform.OS === 'android') {
                  setTimeout(() => confirmPasswordRef.current?.focus(), 100);
                }
              }}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Feather 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Where are you located?
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        We'll show you events happening in your area
      </Text>
      
      <TouchableOpacity
        style={[
          styles.typeformDropdown,
          { borderColor: colors.border.medium },
          focusedField === 'country' && { 
            borderColor: colors.primary[500], 
            borderWidth: 2,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary[400],
          }
        ]}
        onPress={() => {
          setShowCountryDropdown(true);
          setFocusedField('country');
        }}
      >
        <Text style={[
          styles.typeformDropdownText,
          { color: formData.country ? colors.text.primary : colors.text.tertiary }
        ]}>
          {formData.country || 'Select your country'}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => {
    const interests = [
      { id: 'tech', name: 'Technology', icon: 'cpu' },
      { id: 'music', name: 'Music', icon: 'music' },
      { id: 'sports', name: 'Sports', icon: 'activity' },
      { id: 'food', name: 'Food & Dining', icon: 'coffee' },
      { id: 'art', name: 'Arts & Culture', icon: 'palette' },
      { id: 'business', name: 'Business', icon: 'briefcase' },
      { id: 'education', name: 'Education', icon: 'book' },
      { id: 'health', name: 'Health & Wellness', icon: 'heart' },
    ];

    const toggleInterest = (interestId) => {
      const updatedInterests = formData.interests.includes(interestId)
        ? formData.interests.filter(id => id !== interestId)
        : [...formData.interests, interestId];
      updateFormData('interests', updatedInterests);
    };

    return (
      <View style={styles.typeformContainer}>
        <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
          What interests you?
        </Text>
        
        <View style={styles.typeformInterestsGrid}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.typeformInterestCard,
                { 
                  backgroundColor: colors.background.secondary,
                  borderColor: formData.interests.includes(interest.id) ? colors.primary[500] : colors.gray[200]
                }
              ]}
              onPress={() => toggleInterest(interest.id)}
            >
              <Feather 
                name={interest.icon} 
                size={24} 
                color={formData.interests.includes(interest.id) ? colors.primary[500] : colors.text.tertiary} 
              />
              <Text style={[
                styles.typeformInterestText,
                { color: formData.interests.includes(interest.id) ? colors.primary[500] : colors.text.secondary }
              ]}>
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStep6 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        You're all set!
      </Text>
      
      <View style={[styles.typeformReviewCard, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Name:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Email:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>{formData.email}</Text>
        </View>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Location:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>{formData.country}</Text>
        </View>
        {formData.interests.length > 0 && (
          <View style={styles.typeformReviewItem}>
            <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Interests:</Text>
            <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
              {formData.interests.length} selected
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.firstName.trim() && formData.lastName.trim();
      case 2: return formData.email.trim();
      case 3: return formData.password.trim() && formData.confirmPassword.trim();
      case 4: return formData.country.trim();
      case 5: return true; // Optional step
      case 6: return true;
      default: return false;
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
          onPress={currentStep === 1 ? () => navigation.goBack() : prevStep}
        >
          <Feather name="arrow-left" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Create Account</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {currentStep === 6 ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colors.primary[500] },
              loading && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.continueButtonText, { color: colors.white }]}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: canProceed() ? colors.primary[500] : colors.gray[300] }
            ]}
            onPress={nextStep}
            disabled={!canProceed()}
          >
            <Text style={[
              styles.continueButtonText, 
              { color: canProceed() ? colors.white : colors.text.tertiary }
            ]}>
              {currentStep === 5 && formData.interests.length > 0 
                ? `Continue (${formData.interests.length} selected)` 
                : 'Continue'
              }
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Country Dropdown Modal */}
      <Modal
        visible={showCountryDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Select Country
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryDropdown(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { borderBottomColor: colors.border.light },
                    formData.country === item && styles.selectedCountryItem
                  ]}
                  onPress={() => {
                    updateFormData('country', item);
                    setShowCountryDropdown(false);
                    setFocusedField(null);
                  }}
                >
                  <Text style={[
                    styles.countryText,
                    { color: colors.text.primary },
                    formData.country === item && { color: colors.primary[500] }
                  ]}>
                    {item}
                  </Text>
                  {formData.country === item && (
                    <Feather name="check" size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
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
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  progressBarWrapper: {
    width: '100%',
    marginBottom: Spacing[6],
    position: 'relative',
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
  },
  stepContainer: {
    paddingTop: Spacing[8],
  },
  stepTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
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
  passwordIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  passwordMatchIcon: {
    // Additional styling if needed
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderColor: Colors.border.medium,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    minHeight: 48,
  },
  dropdownText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing[6],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing[2],
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderBottomWidth: 1,
  },
  selectedCountryItem: {
    backgroundColor: Colors.primary[50],
  },
  countryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  inputFieldFocused: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
    ...Shadows.md,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  interestCard: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  interestText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
  reviewCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    marginTop: Spacing[4],
  },
  reviewTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  reviewLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  reviewValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    paddingTop: Spacing[4],
  },
  continueButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  // Typeform Styles
  typeformContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  typeformQuestion: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing[4],
    lineHeight: 40,
  },
  typeformSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing[8],
    lineHeight: 22,
    opacity: 0.8,
  },
  typeformInputsContainer: {
    gap: Spacing[4],
  },
  typeformInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  typeformPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    minHeight: 56,
    position: 'relative',
  },
  typeformPasswordInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  typeformDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    minHeight: 56,
  },
  typeformDropdownText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  typeformInterestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[8],
  },
  typeformInterestCard: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  typeformInterestText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  typeformSkipButton: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  typeformSkipText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
  typeformContinueButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    ...Shadows.md,
  },
  typeformContinueText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  typeformReviewCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    marginTop: Spacing[4],
  },
  typeformReviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  typeformReviewLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  typeformReviewValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default CreateAccountFlow;
