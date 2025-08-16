import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Image,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { eventService, bookingService } from '../../services/firestoreService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const EventWebScreen = ({ route, navigation }) => {
  const { eventId } = route?.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  
  // RSVP Form states
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [rsvpForm, setRSVPForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
  });

  // Fetch real event data from Firestore
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        console.error('No eventId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🌐 Fetching event for web view:', eventId);
        const eventDoc = await eventService.getById(eventId);
        
        if (eventDoc) {
          console.log('✅ Event loaded for web:', eventDoc.name);
          setEvent({
            ...eventDoc,
            eventType: eventDoc.type, // Map 'type' to 'eventType' for compatibility
            shareUrl: `https://tikiti.com/events/${eventId}`,
          });
        } else {
          console.error('❌ Event not found:', eventId);
        }
      } catch (error) {
        console.error('❌ Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleTicketPurchase = () => {
    if (event.eventType === 'free') {
      // Show RSVP form for free events
      setShowRSVPForm(true);
    } else {
      Alert.alert(
        'Redirecting to Payment',
        `You will be redirected to complete your purchase of ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for ${event.name}.`,
        [{ text: 'Continue' }]
      );
    }
  };

  const handleRSVPSubmit = async () => {
    // Validate form
    if (!rsvpForm.firstName.trim() || !rsvpForm.lastName.trim() || 
        !rsvpForm.email.trim() || !rsvpForm.phoneNumber.trim() || !rsvpForm.gender) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rsvpForm.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSubmittingRSVP(true);

    try {
      console.log('📝 Submitting web RSVP for event:', event.id);
      
      // Create booking data for web user
      const bookingData = {
        eventId: event.id,
        userId: `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique web user ID
        quantity: 1, // Free events are limited to 1 spot
        totalPrice: 0,
        status: 'confirmed',
        createdAt: new Date(),
        userEmail: rsvpForm.email,
        userName: `${rsvpForm.firstName} ${rsvpForm.lastName}`,
        registrationType: 'rsvp',
        // Web user specific data
        firstName: rsvpForm.firstName,
        lastName: rsvpForm.lastName,
        phoneNumber: rsvpForm.phoneNumber,
        gender: rsvpForm.gender,
        source: 'web', // Track that this came from web
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.startTime || event.time,
        eventLocation: event.location || event.address,
      };

      await bookingService.create(bookingData);
      
      console.log('✅ Web RSVP successful');
      
      setShowRSVPForm(false);
      setSubmittingRSVP(false);
      
      Alert.alert(
        'RSVP Confirmed!',
        `Thank you ${rsvpForm.firstName}! You have successfully registered for ${event.name}. Check your email for confirmation details.`,
        [{ text: 'OK' }]
      );
      
      // Reset form
      setRSVPForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        gender: '',
      });

      // Refresh event data to show updated attendee count
      const updatedEvent = await eventService.getById(eventId);
      if (updatedEvent) {
        setEvent({
          ...updatedEvent,
          eventType: updatedEvent.type,
          shareUrl: `https://tikiti.com/events/${eventId}`,
        });
      }

    } catch (error) {
      console.error('❌ Error submitting RSVP:', error);
      setSubmittingRSVP(false);
      Alert.alert(
        'RSVP Failed',
        'There was an error processing your RSVP. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRSVPCancel = () => {
    setShowRSVPForm(false);
    // Reset form
    setRSVPForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      gender: '',
    });
  };

  const handleShare = async () => {
    if (isWeb && navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: event.shareUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(event.shareUrl);
        Alert.alert('Link Copied', 'Event link copied to clipboard!');
      }
    } else {
      // Mobile share or fallback
      Alert.alert('Share Event', `Share this link: ${event.shareUrl}`);
    }
  };

  const handleDownloadApp = () => {
    const isIOS = Platform.OS === 'ios' || (isWeb && /iPad|iPhone|iPod/.test(navigator.userAgent));
    const isAndroid = Platform.OS === 'android' || (isWeb && /Android/.test(navigator.userAgent));
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/tikiti', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=com.tikiti', '_blank');
    } else {
      Alert.alert('Download App', 'Visit your app store to download Tikiti');
    }
  };

  const openGoogleMaps = () => {
    if (!event?.location) return;
    
    const location = event.location;
    const encodedLocation = encodeURIComponent(location);
    
    // For web, always use Google Maps web URL
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    
    if (isWeb) {
      // Open in new tab for web
      window.open(googleMapsUrl, '_blank');
    } else {
      // Use Linking for mobile
      Linking.openURL(googleMapsUrl).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorText}>
          The event you're looking for doesn't exist or has been removed.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Web Header */}
      {isWeb && (
        <View style={styles.webHeader}>
          <View style={styles.headerContent}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadApp}>
              <Feather name="download" size={16} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>Get App</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isWeb && { minHeight: '100%' }}
      >
        {/* Event Banner */}
        <View style={styles.eventBanner}>
          {event.imageBase64 ? (
            <Image
              source={{ uri: event.imageBase64.startsWith('data:') ? event.imageBase64 : `data:image/jpeg;base64,${event.imageBase64}` }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Feather name="image" size={isWeb ? 64 : 48} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Event Poster</Text>
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>

        {/* Event Information */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <Text style={styles.eventCategory}>{event.category}</Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Feather name="calendar" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{event.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="clock" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{event.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{event.location}</Text>
              <TouchableOpacity 
                style={styles.viewMapButton}
                onPress={openGoogleMaps}
              >
                <Text style={styles.viewMapText}>View</Text>
                <Feather name="external-link" size={16} color={Colors.primary[600]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="tag" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>
                {event.eventType === 'free' ? 'Free Event' : event.price}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Event Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Feather name="users" size={24} color={Colors.primary[500]} />
              <Text style={styles.infoNumber}>{event.totalTickets}</Text>
              <Text style={styles.infoLabel}>Total Tickets</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Feather name="user" size={24} color={Colors.success[500]} />
              <Text style={styles.infoNumber}>{event.soldTickets}</Text>
              <Text style={styles.infoLabel}>Sold</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Feather name="ticket" size={24} color={Colors.warning[500]} />
              <Text style={styles.infoNumber}>{event.availableTickets}</Text>
              <Text style={styles.infoLabel}>Available</Text>
            </View>
          </View>
        </View>



        {/* Organizer Info */}
        <View style={styles.organizerSection}>
          <Text style={styles.sectionTitle}>Organized By</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>{event.organizer}</Text>
              <Text style={styles.organizerContact}>{event.contactEmail}</Text>
              <Text style={styles.organizerContact}>{event.contactPhone}</Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Feather name="mail" size={16} color={Colors.primary[600]} />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.actionContent}>
          {/* Quantity Selector for Paid Events */}
          {event.eventType === 'paid' && (
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
              >
                <Feather name="minus" size={16} color={Colors.primary[500]} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{ticketQuantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
              >
                <Feather name="plus" size={16} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Feather name="share-2" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.purchaseButton} 
              onPress={handleTicketPurchase}
            >
              <Feather 
                name={event.eventType === 'free' ? 'user-plus' : 'credit-card'} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.purchaseButtonText}>
                {event.eventType === 'free' 
                  ? 'RSVP Free' 
                  : `Buy ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* RSVP Form Modal */}
      <Modal
        visible={showRSVPForm}
        transparent={true}
        animationType="slide"
        onRequestClose={handleRSVPCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleRSVPCancel}
          />
          
          <View style={styles.rsvpModalContainer}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />
            
            {/* Modal content */}
            <View style={styles.rsvpModalContent}>
              <Text style={styles.rsvpModalTitle}>Complete Your RSVP</Text>
              <Text style={styles.rsvpModalSubtitle}>
                Please provide your details to register for {event?.name}
              </Text>
              
              {/* Form Fields */}
              <View style={styles.formContainer}>
                <View style={styles.formRow}>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.formLabel}>First Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={rsvpForm.firstName}
                      onChangeText={(text) => setRSVPForm({...rsvpForm, firstName: text})}
                      placeholder="Enter first name"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  </View>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.formLabel}>Last Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={rsvpForm.lastName}
                      onChangeText={(text) => setRSVPForm({...rsvpForm, lastName: text})}
                      placeholder="Enter last name"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={rsvpForm.email}
                    onChangeText={(text) => setRSVPForm({...rsvpForm, email: text})}
                    placeholder="Enter email address"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={rsvpForm.phoneNumber}
                    onChangeText={(text) => setRSVPForm({...rsvpForm, phoneNumber: text})}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Gender *</Text>
                  <View style={styles.genderContainer}>
                    {['Male', 'Female', 'Other'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          rsvpForm.gender === gender && styles.genderOptionSelected
                        ]}
                        onPress={() => setRSVPForm({...rsvpForm, gender})}
                      >
                        <Text style={[
                          styles.genderOptionText,
                          rsvpForm.gender === gender && styles.genderOptionTextSelected
                        ]}>
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Action buttons */}
              <View style={styles.rsvpModalActions}>
                <TouchableOpacity 
                  style={[
                    styles.rsvpCancelButton,
                    submittingRSVP && styles.buttonDisabled
                  ]}
                  onPress={handleRSVPCancel}
                  disabled={submittingRSVP}
                >
                  <Text style={styles.rsvpCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.rsvpSubmitButton,
                    submittingRSVP && styles.rsvpSubmitButtonLoading
                  ]}
                  onPress={handleRSVPSubmit}
                  disabled={submittingRSVP}
                >
                  {submittingRSVP ? (
                    <Text style={styles.rsvpSubmitText}>Submitting...</Text>
                  ) : (
                    <Text style={styles.rsvpSubmitText}>Complete RSVP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    ...(isWeb && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  webHeader: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  logo: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[600],
    letterSpacing: Typography.letterSpacing.tight,
  },
  logoImage: {
    height: 40,
    width: 40,
    borderRadius: BorderRadius.lg,
  },
  downloadButton: {
    ...Components.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  downloadButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
    fontWeight: Typography.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing[5],
  },
  errorTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  content: {
    flex: 1,
    maxWidth: isWeb ? 800 : '100%',
    marginHorizontal: 'auto',
    width: '100%',
    ...(isWeb && {
      overflowY: 'scroll',
      height: '100%',
    }),
  },
  eventBanner: {
    position: 'relative',
    margin: Spacing[5],
    marginBottom: 0,
  },
  eventImage: {
    height: isWeb ? 280 : 200,
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background.tertiary,
  },
  eventImagePlaceholder: {
    height: isWeb ? 280 : 200,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border.medium,
  },
  imagePlaceholderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    marginTop: Spacing[2],
    fontWeight: Typography.fontWeight.medium,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    backgroundColor: Colors.success[500],
    ...Shadows.md,
  },
  statusText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  eventInfo: {
    ...Components.card.primary,
    margin: Spacing[5],
    padding: Spacing[6],
  },
  eventTitle: {
    fontSize: isWeb ? Typography.fontSize['4xl'] : Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
    lineHeight: Typography.lineHeight.tight,
  },
  eventCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[6],
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  eventDetails: {
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  detailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  viewMapButton: {
    ...Components.button.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    gap: Spacing[1],
  },
  viewMapText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing[6],
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    minHeight: 100,
    ...Shadows.sm,
  },
  infoNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  organizerSection: {
    ...Components.card.primary,
    margin: Spacing[5],
    marginTop: 0,
    marginBottom: 120, // Space for sticky bottom
    padding: Spacing[6],
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  organizerContact: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing[1],
  },
  contactButton: {
    ...Components.button.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  contactButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[600],
  },

  bottomAction: {
    position: isWeb ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    ...Shadows.xl,
    ...(isWeb && {
      zIndex: 1000,
    }),
  },
  actionContent: {
    maxWidth: isWeb ? 800 : '100%',
    marginHorizontal: 'auto',
    width: '100%',
    padding: Spacing[5],
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
    gap: Spacing[4],
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  quantityText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  purchaseButton: {
    ...Components.button.primary,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[2],
    ...Shadows.lg,
  },
  purchaseButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // RSVP Form Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  rsvpModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
    paddingHorizontal: Spacing[6],
    ...Shadows['2xl'],
    maxHeight: '90%',
    ...(isWeb && {
      maxWidth: 600,
      alignSelf: 'center',
      borderRadius: BorderRadius['3xl'],
      marginTop: 50,
    }),
  },
  rsvpModalContent: {
    flex: 1,
  },
  rsvpModalTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  rsvpModalSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  formContainer: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  formField: {
    marginBottom: Spacing[4],
  },
  formFieldHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.white,
    ...Shadows.sm,
    ...(isWeb && {
      outlineStyle: 'none',
    }),
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    ...Shadows.sm,
  },
  genderOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  genderOptionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  genderOptionTextSelected: {
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  rsvpModalActions: {
    flexDirection: 'row',
    gap: Spacing[4],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  rsvpCancelButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.sm,
  },
  rsvpCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray[700],
    textAlign: 'center',
  },
  rsvpSubmitButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[500],
    ...Shadows.lg,
  },
  rsvpSubmitButtonLoading: {
    backgroundColor: Colors.primary[400],
  },
  rsvpSubmitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default EventWebScreen;