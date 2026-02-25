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
  ScrollView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { eventService } from '../../services/firestoreService';
import notificationService from '../../services/notificationService';
import { imageUploadService } from '../../services/imageUploadService';
import { imageOptimization } from '../../utils/imageOptimization';
import LocationPicker from '../../components/LocationPicker';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { eventCategories } from '../../data/categories';

const CreateEventFlow = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  
  // Check if we're editing an existing event
  const isEdit = route?.params?.isEdit || false;
  const existingEvent = route?.params?.event || null;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    eventName: existingEvent?.name || '',
    eventDescription: existingEvent?.description || '',
    eventDate: existingEvent?.date ? (typeof existingEvent.date === 'string' ? new Date(existingEvent.date) : existingEvent.date) : null,
    eventTime: existingEvent?.startTime || existingEvent?.time || '',
    eventType: existingEvent?.eventType || existingEvent?.type || 'free',
    ticketPrice: existingEvent?.price?.toString() || '',
    totalTickets: existingEvent?.maxTickets?.toString() || existingEvent?.totalTickets?.toString() || '',
    category: existingEvent?.category || '',
    selectedLocation: existingEvent?.location ? (typeof existingEvent.location === 'string' ? { name: existingEvent.location, address: existingEvent.address || '' } : existingEvent.location) : null,
    imageUri: existingEvent?.imageUrl || existingEvent?.imageBase64 || null,
  });

  const totalSteps = 9;

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

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.eventName.trim().length > 0;
      case 2: return formData.eventDescription.trim().length > 0;
      case 3: return formData.eventDate !== null;
      case 4: return formData.eventTime.trim().length > 0;
      case 5: return formData.eventType === 'free' || (formData.eventType === 'paid' && formData.ticketPrice.trim().length > 0);
      case 6: return formData.totalTickets.trim().length > 0;
      case 7: return formData.category !== '';
             case 8: return formData.selectedLocation !== null;
       case 9: return true; // Image upload is optional
       default: return false;
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateFormData('imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCreateEvent = async () => {
    setLoading(true);
    try {
      // Convert image to base64 if needed
      let base64Image = null;
      if (formData.imageUri) {
        if (formData.imageUri.startsWith('data:')) {
          base64Image = formData.imageUri;
        } else {
          base64Image = await imageUploadService.uploadEventImage(formData.imageUri, user.uid);
        }
        
        // Check image size before proceeding
        if (base64Image) {
          const sizeWarning = imageOptimization.getSizeWarning(base64Image);
          if (sizeWarning) {
            if (sizeWarning.type === 'error') {
              Alert.alert(
                sizeWarning.title,
                sizeWarning.message,
                [
                  { text: 'Choose Different Image', onPress: () => setFormData(prev => ({ ...prev, imageUri: null })) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
              setLoading(false);
              return;
            } else {
              // Show warning but allow proceeding
              Alert.alert(
                sizeWarning.title,
                sizeWarning.message,
                [
                  { text: 'Use This Image', onPress: () => {} },
                  { text: 'Choose Different', onPress: () => setFormData(prev => ({ ...prev, imageUri: null })) }
                ]
              );
            }
          }
        }
      }

      const eventData = {
        name: formData.eventName.trim(),
        description: formData.eventDescription.trim(),
        location: formData.selectedLocation.name,
        address: formData.selectedLocation.address,
        ...(formData.selectedLocation.coordinates && {
          coordinates: formData.selectedLocation.coordinates,
        }),
        date: formData.eventDate ? formData.eventDate.toISOString().split('T')[0] : '',
        time: formData.eventTime,
        startTime: formData.eventTime,
        type: formData.eventType || 'free',
        price: formData.eventType === 'paid' ? parseFloat(formData.ticketPrice) || 0 : 0,
        totalTickets: formData.totalTickets ? parseInt(formData.totalTickets) : 100,
        category: formData.category,
        imageBase64: base64Image,
        imageUrl: null,
        organizerName: userProfile?.displayName || user?.displayName || 'Event Organizer',
        organizerEmail: user?.email || '',
        organizerPhone: userProfile?.organisationPhone || '',
      };

      if (isEdit && existingEvent?.id) {
        await eventService.update(existingEvent.id, eventData);

        // Notify attendees about the update
        notificationService.sendEventUpdateToAllAttendees(
          existingEvent.id, formData.eventName.trim(), 'event_details_changed'
        ).catch(err => console.warn('Failed to send event update notifications:', err));

        Alert.alert('Success', `Event "${formData.eventName}" updated successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const docRef = await eventService.create(eventData, user.uid);

        // Notify users about the new event (location-filtered)
        notificationService.sendNewEventNotification(
          docRef.id, formData.eventName.trim(), eventData.location
        ).catch(err => console.warn('Failed to send new event notifications:', err));

        Alert.alert('Success', `Event "${formData.eventName}" created successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show specific error messages
      if (error.message.includes('Image is too large')) {
        Alert.alert(
          'Image Too Large',
          error.message,
          [
            { text: 'Choose Different Image', onPress: () => setFormData(prev => ({ ...prev, imageUri: null })) },
            { text: 'OK' }
          ]
        );
      } else if (error.message.includes('Permission denied')) {
        Alert.alert('Permission Error', error.message);
      } else {
        Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(currentStep / totalSteps) * 100}%`,
                backgroundColor: colors.primary[500]
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text.secondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What's your event called?
      </Text>
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Give your event a catchy name that will attract attendees
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.typeformInput,
            { color: '#000000', borderColor: colors.border.medium },
            focusedField === 'eventName' && { 
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
          value={formData.eventName}
          onChangeText={(text) => updateFormData('eventName', text)}
          placeholder="Enter event name"
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setFocusedField('eventName')}
          onBlur={() => setFocusedField(null)}
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={true}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Tell us about your event
      </Text>
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Describe what attendees can expect from your event
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.typeformTextArea,
            { color: '#000000', borderColor: colors.border.medium },
            focusedField === 'eventDescription' && { 
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
          value={formData.eventDescription}
          onChangeText={(text) => updateFormData('eventDescription', text)}
          placeholder="Describe your event..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onFocus={() => setFocusedField('eventDescription')}
          onBlur={() => setFocusedField(null)}
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        When is your event?
      </Text>
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Select the date for your event
      </Text>
      
      <View style={styles.inputContainer}>
                 <DatePicker
           selectedDate={formData.eventDate}
           onSelectDate={(date) => updateFormData('eventDate', date)}
           style={[
             styles.typeformInput,
             { borderColor: colors.border.medium }
           ]}
         />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        What time does it start?
      </Text>
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Choose the start time for your event
      </Text>
      
      <View style={styles.inputContainer}>
                 <TimePicker
           selectedTime={formData.eventTime}
           onSelectTime={(time) => updateFormData('eventTime', time)}
           style={[
             styles.typeformInput,
             { borderColor: colors.border.medium }
           ]}
         />
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.typeformContainer}>
      <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
        Is this a free or paid event?
      </Text>
      <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
        Choose the type of event you're creating
      </Text>
      
      <View style={styles.eventTypeContainer}>
        <TouchableOpacity
          style={[
            styles.eventTypeOption,
            { backgroundColor: colors.background.secondary, borderColor: colors.border.medium },
            formData.eventType === 'free' && styles.eventTypeActive
          ]}
          onPress={() => updateFormData('eventType', 'free')}
        >
          <View style={styles.eventTypeIconContainer}>
            <Feather 
              name="heart" 
              size={24} 
              color={formData.eventType === 'free' ? Colors.white : colors.primary[500]} 
            />
          </View>
          <Text style={[
            styles.eventTypeTitle,
            formData.eventType === 'free' && styles.eventTypeActiveText
          ]}>
            Free Event
          </Text>
          <Text style={[
            styles.eventTypeSubtitle,
            formData.eventType === 'free' && styles.eventTypeActiveSubtext
          ]}>
            No cost for attendees
          </Text>
        </TouchableOpacity>

                 <TouchableOpacity
           style={[
             styles.eventTypeOption,
             styles.eventTypeDisabled,
             { backgroundColor: colors.background.secondary, borderColor: colors.border.medium }
           ]}
           disabled={true}
         >
           <View style={[styles.eventTypeIconContainer, styles.eventTypeIconDisabled]}>
             <Feather 
               name="credit-card" 
               size={24} 
               color={colors.text.tertiary} 
             />
           </View>
           <Text style={[styles.eventTypeTitle, styles.eventTypeTitleDisabled]}>
             Paid Event
           </Text>
           <Text style={[styles.eventTypeSubtitle, styles.eventTypeSubtitleDisabled]}>
             Coming Soon
           </Text>
         </TouchableOpacity>
      </View>
    </View>
  );

     const renderStep6 = () => (
     <View style={styles.typeformContainer}>
       <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
         How many tickets available?
       </Text>
       <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
         Set the maximum number of attendees for your free event
       </Text>
       
       <View style={styles.inputContainer}>
         <TextInput
           style={[
             styles.typeformInput,
             { color: '#000000', borderColor: colors.border.medium },
             focusedField === 'totalTickets' && { 
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
           value={formData.totalTickets}
           onChangeText={(text) => updateFormData('totalTickets', text)}
           placeholder="100"
           placeholderTextColor={colors.text.tertiary}
           keyboardType="numeric"
           onFocus={() => setFocusedField('totalTickets')}
           onBlur={() => setFocusedField(null)}
         />
       </View>
     </View>
   );

     const renderStep7 = () => (
     <View style={styles.typeformContainer}>
       <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
         What category is your event?
       </Text>
       <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
         Help people find your event by choosing a category
       </Text>
       
       <View style={styles.typeformInterestsGrid}>
         {eventCategories.map((category) => (
           <TouchableOpacity
             key={category.id}
             style={[
               styles.typeformInterestCard,
               { 
                 backgroundColor: colors.background.secondary,
                 borderColor: formData.category === category.id ? colors.primary[500] : colors.gray[200]
               }
             ]}
             onPress={() => updateFormData('category', category.id)}
           >
             <Feather 
               name={category.icon} 
               size={20} 
               color={formData.category === category.id ? colors.primary[500] : colors.text.secondary} 
             />
             <Text style={[
               styles.typeformInterestText,
               { color: formData.category === category.id ? colors.primary[500] : colors.text.secondary }
             ]}>
               {category.name}
             </Text>
           </TouchableOpacity>
         ))}
       </View>
     </View>
   );

     const renderStep8 = () => (
     <View style={styles.typeformContainer}>
       <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
         Where is your event?
       </Text>
       <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
         Add the location where your event will take place
       </Text>
       
       <View style={styles.inputContainer}>
         <LocationPicker
           selectedLocation={formData.selectedLocation}
           onSelectLocation={(location) => updateFormData('selectedLocation', location)}
           style={[
             styles.typeformInput,
             { borderColor: colors.border.medium }
           ]}
         />
       </View>
     </View>
   );

   const renderStep9 = () => (
     <View style={styles.typeformContainer}>
       <Text style={[styles.typeformQuestion, { color: colors.text.primary }]}>
         Add an event poster
       </Text>
       <Text style={[styles.typeformSubtitle, { color: colors.text.secondary }]}>
         Upload an image to make your event more attractive (optional)
       </Text>
       
       <View style={styles.inputContainer}>
         {formData.imageUri ? (
           <View style={styles.imagePreviewContainer}>
             <Image source={{ uri: formData.imageUri }} style={styles.imagePreview} />
             <TouchableOpacity 
               style={styles.changeImageButton}
               onPress={pickImage}
             >
               <Feather name="edit-2" size={16} color={Colors.white} />
               <Text style={styles.changeImageText}>Change</Text>
             </TouchableOpacity>
           </View>
         ) : (
           <TouchableOpacity 
             style={[styles.imageUploadButton, { borderColor: colors.border.medium }]}
             onPress={pickImage}
           >
             <Feather name="camera" size={32} color={colors.text.tertiary} />
             <Text style={[styles.imageUploadText, { color: colors.text.secondary }]}>Upload Event Poster</Text>
             <Text style={[styles.imageUploadSubtext, { color: colors.text.tertiary }]}>Recommended: 1200x600px</Text>
           </TouchableOpacity>
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
      case 7: return renderStep7();
      case 8: return renderStep8();
      case 9: return renderStep9();
      default: return renderStep1();
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
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {isEdit ? 'Edit Event' : 'Create Event'}
        </Text>
        <TouchableOpacity 
          style={[styles.cancelButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: colors.border.light }]}>
        {currentStep === totalSteps ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colors.primary[500] },
              loading && styles.disabledButton
            ]}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.continueButtonText, { color: colors.white }]}>
                {isEdit ? 'Update Event' : 'Create Event'}
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
    backgroundColor: Colors.background.secondary,
  },
  cancelButton: {
    padding: Spacing[2],
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  title: {
    fontSize: Typography.fontSize.xl,
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
    borderBottomColor: Colors.border.light,
  },
  progressBarWrapper: {
    width: '100%',
    marginBottom: Spacing[2],
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
    paddingBottom: Spacing[20],
  },
  typeformContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  typeformQuestion: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: Spacing[4],
    lineHeight: 40,
  },
  typeformSubtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    marginBottom: Spacing[12],
    lineHeight: 24,
  },
  inputContainer: {
    marginTop: Spacing[8],
  },
  typeformInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.lg,
    backgroundColor: Colors.white,
    minHeight: 56,
  },
  typeformTextArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.lg,
    backgroundColor: Colors.white,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[8],
  },
  eventTypeOption: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    alignItems: 'center',
    ...Shadows.sm,
  },
  eventTypeActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  eventTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  eventTypeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  eventTypeActiveText: {
    color: Colors.white,
  },
  eventTypeSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
     eventTypeActiveSubtext: {
     color: 'rgba(255, 255, 255, 0.8)',
   },
   eventTypeDisabled: {
     opacity: 0.6,
   },
   eventTypeIconDisabled: {
     backgroundColor: 'rgba(0, 0, 0, 0.1)',
   },
   eventTypeTitleDisabled: {
     color: Colors.text.tertiary,
   },
   eventTypeSubtitleDisabled: {
     color: Colors.text.tertiary,
   },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.white,
    marginBottom: Spacing[4],
    minHeight: 56,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing[2],
  },
  priceInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    padding: 0,
    minHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  continueButton: {
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
     disabledButton: {
     opacity: 0.6,
   },
   imageUploadButton: {
     height: 120,
     backgroundColor: Colors.background.secondary,
     borderRadius: BorderRadius.xl,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderStyle: 'dashed',
   },
   imageUploadText: {
     fontSize: Typography.fontSize.base,
     fontWeight: Typography.fontWeight.semibold,
     marginTop: Spacing[2],
   },
   imageUploadSubtext: {
     fontSize: Typography.fontSize.xs,
     marginTop: Spacing[1],
   },
   imagePreviewContainer: {
     position: 'relative',
     borderRadius: BorderRadius.xl,
     overflow: 'hidden',
     backgroundColor: Colors.background.secondary,
   },
   imagePreview: {
     width: '100%',
     height: 200,
     resizeMode: 'cover',
   },
   changeImageButton: {
     position: 'absolute',
     top: Spacing[3],
     right: Spacing[3],
     backgroundColor: 'rgba(0, 0, 0, 0.7)',
     paddingHorizontal: Spacing[3],
     paddingVertical: Spacing[2],
     borderRadius: BorderRadius.lg,
     flexDirection: 'row',
     alignItems: 'center',
   },
   changeImageText: {
     color: Colors.white,
     fontSize: Typography.fontSize.sm,
     fontWeight: Typography.fontWeight.medium,
     marginLeft: Spacing[1],
   },
   typeformInterestsGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: Spacing[3],
     marginTop: Spacing[8],
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
     color: Colors.text.secondary,
     textAlign: 'center',
     fontFamily: 'PlusJakartaSans-Medium',
   },
 });

export default CreateEventFlow;
