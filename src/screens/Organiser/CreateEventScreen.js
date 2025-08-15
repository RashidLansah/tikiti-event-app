import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { eventService } from '../../services/firestoreService';
import { imageUploadService } from '../../services/imageUploadService';
import { imageOptimization } from '../../utils/imageOptimization';
import { useAuth } from '../../context/AuthContext';
import CategoryDropdown from '../../components/CategoryDropdown';
import LocationPicker from '../../components/LocationPicker';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { eventCategories } from '../../data/categories';

const CreateEventScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [eventTime, setEventTime] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [eventType, setEventType] = useState('free'); // 'free' or 'paid'
  const [category, setCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1], // 2:1 aspect ratio for event posters
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImageToFirebase = async (uri) => {
    if (!uri) return null;
    
    try {
      setUploadingImage(true);
      console.log('🖼️ Starting image conversion in CreateEventScreen...');
      
      // Convert image to base64 using the image upload service
      const base64Image = await imageUploadService.uploadEventImage(uri, user.uid);
      
      console.log('✅ Image conversion successful, length:', base64Image.length);
      return base64Image;
    } catch (error) {
      console.error('❌ Error converting image in CreateEventScreen:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to convert image. Please try again.';
      
      if (error.message.includes('blob')) {
        errorMessage = 'Image conversion failed: Please try a different image format.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = 'Image conversion failed: Network error. Please try again.';
      } else if (error.message.includes('base64')) {
        errorMessage = 'Image conversion failed: Please try a smaller image.';
      }
      
      Alert.alert('Image Conversion Error', errorMessage);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async () => {
    // Validate required fields
    if (!eventName || !selectedLocation || !eventDate || !eventTime || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // For paid events, ticket price is required
    if (eventType === 'paid' && (!ticketPrice || parseFloat(ticketPrice) <= 0)) {
      Alert.alert('Error', 'Please enter a valid ticket price for paid events');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create events');
      return;
    }

    setLoading(true);

    try {
      // Convert image if selected
      let base64Image = null;
      if (imageUri) {
        base64Image = await uploadImageToFirebase(imageUri);
        
        // Check image size and show warning if needed
        if (base64Image) {
          const sizeWarning = imageOptimization.getSizeWarning(base64Image);
          if (sizeWarning) {
            Alert.alert('Image Size Warning', sizeWarning, [{ text: 'OK' }]);
          }
        }
      }

      const eventData = {
        name: eventName.trim(),
        description: eventDescription.trim(),
        location: selectedLocation.name,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates,
        date: eventDate ? eventDate.toISOString().split('T')[0] : '', // Convert Date to YYYY-MM-DD
        time: eventTime,
        type: eventType,
        price: eventType === 'paid' ? parseFloat(ticketPrice) : 0,
        totalTickets: totalTickets ? parseInt(totalTickets) : 100,
        category: category,
        imageBase64: base64Image, // Store base64 image in Firestore
        imageUrl: null, // Keep for future Firebase Storage implementation
        organizerName: userProfile?.displayName || user?.displayName || 'Event Organizer',
        organizerEmail: user?.email || '',
      };

      const docRef = await eventService.create(eventData, user.uid);
      
      Alert.alert(
        'Success',
        `${eventType === 'paid' ? 'Paid' : 'Free'} event "${eventName}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      console.log('Event created with ID:', docRef.id);
      
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        'Failed to create event. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.title}>Create New Event</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Image Upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="image" size={20} color="Colors.primary[500]" />
            <Text style={styles.sectionTitle}>Event Image</Text>
          </View>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Feather name="edit-2" size={16} color="#FFFFFF" />
                                 <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadingText}>Converting...</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imageUploadButton}
              onPress={pickImage}
            >
              <Feather name="camera" size={32} color="#9CA3AF" />
              <Text style={styles.imageUploadText}>Upload Event Poster</Text>
              <Text style={styles.imageUploadSubtext}>Recommended: 1200x600px</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={20} color="Colors.primary[500]" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name *</Text>
            <View style={styles.inputContainer}>
              <Feather name="calendar" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <CategoryDropdown
              selectedCategory={category}
              onSelectCategory={setCategory}
              categories={eventCategories}
              placeholder="Select event category"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputContainer}>
              <Feather name="file-text" size={18} color="#9CA3AF" style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 4 }]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Describe your event..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <LocationPicker
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              placeholder="Select event location"
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color="Colors.primary[500]" />
            <Text style={styles.sectionTitle}>Date & Time</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Date *</Text>
              <DatePicker
                selectedDate={eventDate}
                onSelectDate={setEventDate}
                placeholder="Select event date"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Time *</Text>
              <TimePicker
                selectedTime={eventTime}
                onSelectTime={setEventTime}
                placeholder="Select event time"
              />
            </View>
          </View>
        </View>

        {/* Event Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="dollar-sign" size={20} color="Colors.primary[500]" />
            <Text style={styles.sectionTitle}>Event Type</Text>
          </View>

          <View style={styles.eventTypeContainer}>
            <TouchableOpacity
              style={[
                styles.eventTypeOption,
                eventType === 'free' && styles.eventTypeActive
              ]}
              onPress={() => setEventType('free')}
            >
              <View style={styles.eventTypeIconContainer}>
                <Feather 
                  name="heart" 
                  size={24} 
                  color={eventType === 'free' ? '#FFFFFF' : '#10B981'} 
                />
              </View>
              <Text style={[
                styles.eventTypeTitle,
                eventType === 'free' && styles.eventTypeActiveText
              ]}>
                Free Event
              </Text>
              <Text style={[
                styles.eventTypeSubtitle,
                eventType === 'free' && styles.eventTypeActiveSubtext
              ]}>
                Users RSVP for free
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.eventTypeOption,
                eventType === 'paid' && styles.eventTypeActive
              ]}
              onPress={() => setEventType('paid')}
            >
              <View style={styles.eventTypeIconContainer}>
                <Feather 
                  name="credit-card" 
                  size={24} 
                  color={eventType === 'paid' ? '#FFFFFF' : 'Colors.primary[500]'} 
                />
              </View>
              <Text style={[
                styles.eventTypeTitle,
                eventType === 'paid' && styles.eventTypeActiveText
              ]}>
                Paid Event
              </Text>
              <Text style={[
                styles.eventTypeSubtitle,
                eventType === 'paid' && styles.eventTypeActiveSubtext
              ]}>
                Users pay for tickets
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ticket Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="tag" size={20} color="Colors.primary[500]" />
            <Text style={styles.sectionTitle}>Ticket Information</Text>
          </View>

          <View style={styles.row}>
            {eventType === 'paid' && (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Ticket Price *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₵</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={ticketPrice}
                    onChangeText={setTicketPrice}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            <View style={[
              styles.inputGroup, 
              eventType === 'paid' ? styles.halfWidth : { flex: 1 }
            ]}>
              <Text style={styles.label}>Total Tickets</Text>
              <View style={styles.inputContainer}>
                <Feather name="users" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={totalTickets}
                  onChangeText={setTotalTickets}
                  placeholder="100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={18} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Feather name="plus" size={18} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Create Event</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: 50,
    paddingBottom: Spacing[5],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Shadows.sm,
  },
  backButton: {
    padding: Spacing[2],
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing[5],
  },
  section: {
    ...Components.card.primary,
    padding: Spacing[5],
    marginBottom: Spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
  },
  imageUploadButton: {
    height: 120,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border.medium,
  },
  imageUploadText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing[2],
  },
  imageUploadSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing[1],
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.background.tertiary,
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  uploadingText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing[2],
  },
  inputGroup: {
    marginBottom: Spacing[5],
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  priceInput: {
    marginLeft: Spacing[2],
  },
  currencySymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  eventTypeOption: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[5],
    marginBottom: Spacing[10],
  },
  cancelButton: {
    ...Components.button.secondary,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  createButton: {
    ...Components.button.primary,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    ...Shadows.lg,
  },
  createButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
});

export default CreateEventScreen;