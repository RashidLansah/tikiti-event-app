import React, { useState, useEffect } from 'react';
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

const OrganiserUpgradeFlow = ({ navigation, onComplete }) => {
  const { colors } = useTheme();
  const { updateUserProfile, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    organisationName: '',
    eventTypes: [],
    description: '',
    country: '',
    phoneNumber: '',
    countryCode: '+233', // Default to Ghana
  });

  // Countries list
  const countries = [
    'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Tunisia',
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Brazil', 'Argentina', 'Mexico', 'India', 'China', 'Japan', 'South Korea',
    'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam',
    'United Arab Emirates', 'Saudi Arabia', 'Turkey', 'Israel', 'Lebanon',
    'Other'
  ].sort();

  // Country codes for phone numbers
  const countryCodes = [
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  ];

  // Set default country from user profile
  useEffect(() => {
    if (userProfile?.country && !formData.country) {
      setFormData(prev => ({ ...prev, country: userProfile.country }));
    }
  }, [userProfile?.country]);

  const totalSteps = 6;

  // Event types for dropdown
  const eventTypes = [
    'Music', 'Technology', 'Business', 'Education', 'Sports', 'Art & Culture',
    'Food & Dining', 'Health & Wellness', 'Entertainment', 'Fashion', 'Travel',
    'Community', 'Charity', 'Networking', 'Workshop', 'Conference'
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

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update user profile with organiser information (keep accountType as 'user' but add organiser capabilities)
      await updateUserProfile({
        organisationName: formData.organisationName,
        eventTypes: formData.eventTypes,
        organisationDescription: formData.description,
        organisationCountry: formData.country,
        organisationPhone: `${formData.countryCode}${formData.phoneNumber}`,
        upgradedAt: new Date(),
        // Keep accountType as 'user' to maintain dual-role capability
      });
      
      // Call the completion callback
      if (onComplete) {
        onComplete();
      }
      
      // Navigate to organiser flow instead of going back
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrganiserFlow' }],
      });
    } catch (error) {
      console.error('Error upgrading to organiser:', error);
      Alert.alert('Upgrade Failed', 'There was an error upgrading your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
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
        What's your organisation name?
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        This will be displayed as the organiser name for your events
      </Text>
      
      <TextInput
        style={[
          styles.typeformInput,
          { color: colors.text.primary, borderColor: colors.border.medium },
          focusedField === 'organisationName' && { 
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
        placeholder="Your organisation name"
        placeholderTextColor={colors.text.tertiary}
        value={formData.organisationName}
        onChangeText={(value) => updateFormData('organisationName', value)}
        onFocus={() => setFocusedField('organisationName')}
        onBlur={() => setFocusedField(null)}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What type of events do you organise?
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Select all that apply to help us recommend relevant features
      </Text>
      
      <View style={styles.typeformInterestsGrid}>
        {eventTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeformInterestCard,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: formData.eventTypes.includes(type) ? colors.primary[500] : colors.gray[200]
              }
            ]}
            onPress={() => {
              const updatedTypes = formData.eventTypes.includes(type)
                ? formData.eventTypes.filter(t => t !== type)
                : [...formData.eventTypes, type];
              updateFormData('eventTypes', updatedTypes);
            }}
          >
            <Text style={[
              styles.typeformInterestText,
              { color: formData.eventTypes.includes(type) ? colors.primary[500] : colors.text.secondary }
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Tell us about your organisation
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        This helps attendees understand what you do (optional)
      </Text>
      
      <TextInput
        style={[
          styles.typeformTextArea,
          { color: colors.text.primary, borderColor: colors.border.medium },
          focusedField === 'description' && { 
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
        placeholder="Describe your organisation, mission, or what makes your events special..."
        placeholderTextColor={colors.text.tertiary}
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        onFocus={() => setFocusedField('description')}
        onBlur={() => setFocusedField(null)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        autoCorrect={false}
        returnKeyType="done"
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Where is your organisation based?
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        This helps us show your events to the right audience
      </Text>
      
      <TouchableOpacity
        style={[
          styles.typeformDropdown,
          { 
            backgroundColor: colors.background.primary,
            borderColor: colors.border.medium 
          },
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
          setFocusedField('country');
          setShowCountryDropdown(true);
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

      {/* Country Selection Modal */}
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
                style={styles.modalCloseButton}
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
                    { 
                      backgroundColor: colors.background.secondary,
                      borderBottomColor: colors.border.light 
                    },
                    formData.country === item && { backgroundColor: colors.primary[50] }
                  ]}
                  onPress={() => {
                    updateFormData('country', item);
                    setShowCountryDropdown(false);
                    setFocusedField(null);
                  }}
                >
                  <Text style={[
                    styles.countryText,
                    { 
                      color: formData.country === item ? colors.primary[500] : colors.text.primary,
                      fontWeight: formData.country === item ? '600' : '400'
                    }
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
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What's your organisation phone number?
      </Text>
      
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        This will be displayed on your events for attendees to contact you
      </Text>
      
      <View style={styles.phoneInputContainer}>
        <TouchableOpacity
          style={[
            styles.countryCodeButton,
            { 
              backgroundColor: colors.background.primary,
              borderColor: colors.border.medium 
            },
            focusedField === 'countryCode' && { 
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
            setFocusedField('countryCode');
            setShowCountryCodeDropdown(true);
          }}
        >
          <Text style={[styles.countryCodeText, { color: colors.text.primary }]}>
            {countryCodes.find(c => c.code === formData.countryCode)?.flag} {formData.countryCode}
          </Text>
          <Feather name="chevron-down" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
        
        <TextInput
          style={[
            styles.phoneNumberInput,
            { color: colors.text.primary, borderColor: colors.border.medium },
            focusedField === 'phoneNumber' && { 
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
          placeholder="Phone number"
          placeholderTextColor={colors.text.tertiary}
          value={formData.phoneNumber}
          onChangeText={(value) => updateFormData('phoneNumber', value)}
          onFocus={() => setFocusedField('phoneNumber')}
          onBlur={() => setFocusedField(null)}
          keyboardType="phone-pad"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>

      {/* Country Code Selection Modal */}
      <Modal
        visible={showCountryCodeDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Select Country Code
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              keyExtractor={(item) => `${item.code}-${item.country}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { 
                      backgroundColor: colors.background.secondary,
                      borderBottomColor: colors.border.light 
                    },
                    formData.countryCode === item.code && { backgroundColor: colors.primary[50] }
                  ]}
                  onPress={() => {
                    updateFormData('countryCode', item.code);
                    setShowCountryCodeDropdown(false);
                    setFocusedField(null);
                  }}
                >
                  <Text style={[
                    styles.countryText,
                    { 
                      color: formData.countryCode === item.code ? colors.primary[500] : colors.text.primary,
                      fontWeight: formData.countryCode === item.code ? '600' : '400'
                    }
                  ]}>
                    {item.flag} {item.code} {item.country}
                  </Text>
                  {formData.countryCode === item.code && (
                    <Feather name="check" size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        You're ready to become an organiser!
      </Text>
      
      <View style={[styles.typeformReviewCard, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Organisation:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
            {formData.organisationName}
          </Text>
        </View>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Event Types:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
            {formData.eventTypes.length > 0 ? formData.eventTypes.join(', ') : 'None selected'}
          </Text>
        </View>
        {formData.description && (
          <View style={styles.typeformReviewItem}>
            <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Description:</Text>
            <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
              {formData.description}
            </Text>
          </View>
        )}
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Location:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
            {formData.country || 'Not selected'}
          </Text>
        </View>
        <View style={styles.typeformReviewItem}>
          <Text style={[styles.typeformReviewLabel, { color: colors.text.secondary }]}>Phone:</Text>
          <Text style={[styles.typeformReviewValue, { color: colors.text.primary }]}>
            {formData.phoneNumber ? `${formData.countryCode}${formData.phoneNumber}` : 'Not provided'}
          </Text>
        </View>
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
      case 1: return formData.organisationName.trim();
      case 2: return true; // Optional step
      case 3: return true; // Optional step
      case 4: return formData.country.trim();
      case 5: return formData.phoneNumber.trim();
      case 6: return true;
      default: return false;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={currentStep === 1 ? () => navigation.goBack() : prevStep}
        >
          <Feather name="arrow-left" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Upgrade to Organiser</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background.primary }]}>
        {currentStep === 6 ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colors.primary[500] },
              loading && styles.disabledButton
            ]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.continueButtonText, { color: colors.white }]}>
                Complete Upgrade
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
              Continue
            </Text>
          </TouchableOpacity>
        )}
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
    borderRadius: 8,
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
    borderBottomWidth: 1,
  },
  progressBarWrapper: {
    width: '100%',
    marginBottom: Spacing[6],
    position: 'relative',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Spacing[20], // Extra padding to prevent button overlap
  },
  typeformContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  typeformQuestion: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing[4],
    lineHeight: 40,
  },
  typeformSubtitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing[8],
    lineHeight: 22,
    opacity: 0.8,
  },
  typeformInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  typeformTextArea: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
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
    fontSize: 18,
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
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
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
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  typeformReviewValue: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    paddingTop: Spacing[4],
    backgroundColor: Colors.white,
  },
  continueButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.medium,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  modalCloseButton: {
    padding: Spacing[2],
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  countryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    minHeight: 56,
    minWidth: 120,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    marginRight: Spacing[2],
  },
  phoneNumberInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    minHeight: 56,
    textAlignVertical: 'center',
  },
});

export default OrganiserUpgradeFlow;
