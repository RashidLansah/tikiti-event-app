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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { eventService, bookingService } from '../../services/firestoreService';
import QRCode from 'qrcode';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const EventWebScreen = ({ route, navigation }) => {
  const { eventId } = route?.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  
  // RSVP Form states
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [rsvpForm, setRSVPForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
  });
  
  // Ticket states
  const [userBooking, setUserBooking] = useState(null);
  const [showTicketDownload, setShowTicketDownload] = useState(false);

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
    if (event.eventType !== 'free') {
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
      
      // Generate unique booking reference
      const bookingReference = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
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
        bookingReference, // Add booking reference for ticket
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

      const bookingResult = await bookingService.create(bookingData);
      
      console.log('✅ Web RSVP successful');
      
      // Store booking data for ticket generation
      setUserBooking({
        ...bookingData,
        id: bookingResult.id || bookingReference,
        bookingReference
      });
      
      setSubmittingRSVP(false);
      setShowTicketDownload(true);
      resetForm();
      
      Alert.alert(
        'RSVP Confirmed!',
        `Thank you ${rsvpForm.firstName}! You have successfully registered for ${event.name}. You can now download your ticket.`,
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

  // Generate and download ticket
  const handleDownloadTicket = async () => {
    if (!userBooking || !isWeb) return;

    try {
      console.log('🎫 Generating ticket for booking:', userBooking.bookingReference);
      
      // Generate QR code data
      const qrData = JSON.stringify({
        bookingId: userBooking.id,
        bookingReference: userBooking.bookingReference,
        eventId: event.id,
        eventName: event.name,
        attendeeName: userBooking.userName,
        attendeeEmail: userBooking.userEmail,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        ticketType: 'RSVP',
        status: 'confirmed'
      });
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create ticket HTML content
      const ticketHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Event Ticket - ${event.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .ticket { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .ticket-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .ticket-title { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; }
            .ticket-subtitle { font-size: 16px; opacity: 0.9; margin: 0; }
            .ticket-body { padding: 30px; }
            .event-info { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .qr-section { text-align: center; background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
            .qr-code { margin: 20px 0; }
            .booking-ref { font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea; margin: 15px 0; }
            .instructions { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            @media print { body { background: white; } .ticket { box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="ticket-header">
              <div class="ticket-title">${event.name}</div>
              <div class="ticket-subtitle">Event Ticket</div>
            </div>
            
            <div class="ticket-body">
              <div class="event-info">
                <div class="info-row">
                  <span class="info-label">Attendee Name:</span>
                  <span class="info-value">${userBooking.userName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${userBooking.userEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Event Date:</span>
                  <span class="info-value">${event.date}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Event Time:</span>
                  <span class="info-value">${event.time}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${event.location}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ticket Type:</span>
                  <span class="info-value">FREE RSVP</span>
                </div>
              </div>
              
              <div class="qr-section">
                <h3 style="margin-top: 0; color: #333;">Entry QR Code</h3>
                <div class="qr-code">
                  <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 200px; height: auto;" />
                </div>
                <div class="booking-ref">Booking Reference: ${userBooking.bookingReference}</div>
                <p style="color: #666; margin: 10px 0 0 0;">Present this QR code at the event entrance</p>
              </div>
              
              <div class="instructions">
                <h4 style="margin-top: 0; color: #856404;">Important Instructions:</h4>
                <ul style="margin: 10px 0 0 0; color: #856404;">
                  <li>Please arrive 15 minutes before the event starts</li>
                  <li>Present this ticket (digital or printed) at the entrance</li>
                  <li>Keep your booking reference safe: <strong>${userBooking.bookingReference}</strong></li>
                  <li>Contact the organizer if you have any questions</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Powered by Tikiti</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Create and download the ticket
      const blob = new Blob([ticketHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tikiti-Ticket-${userBooking.bookingReference}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Alert.alert(
        'Ticket Downloaded!',
        'Your ticket has been downloaded successfully. You can open it in any browser or print it for the event.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error generating ticket:', error);
      Alert.alert(
        'Download Failed',
        'There was an error generating your ticket. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const resetForm = () => {
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

          {/* Success Message or RSVP Form */}
          {showTicketDownload && userBooking ? (
            <View style={styles.successSection}>
              <Feather name="check-circle" size={24} color={Colors.success[500]} />
              <Text style={styles.successTitle}>Registration Confirmed!</Text>
              <Text style={styles.successSubtitle}>
                You're all set for {event.name}
              </Text>
              <TouchableOpacity 
                style={styles.downloadTicketButton} 
                onPress={handleDownloadTicket}
              >
                <Feather name="download" size={20} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>Download Your Ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.rsvpSection}>
              <Text style={styles.sectionTitle}>Register for this Event</Text>
              <Text style={styles.rsvpSubtitle}>
                Please provide your details to complete your registration
              </Text>
              
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

                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    submittingRSVP && styles.submitButtonLoading
                  ]}
                  onPress={handleRSVPSubmit}
                  disabled={submittingRSVP}
                >
                  {submittingRSVP ? (
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Complete Registration</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>




      </ScrollView>

      {/* Share Button */}
      <View style={styles.bottomAction}>
        <View style={styles.actionContent}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Feather name="share-2" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  // New styles for simplified layout
  rsvpSection: {
    marginTop: Spacing[6],
    paddingTop: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  rsvpSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing[6],
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[6],
    ...Shadows.lg,
  },
  submitButtonLoading: {
    backgroundColor: Colors.primary[400],
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  successSection: {
    marginTop: Spacing[6],
    paddingTop: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  successSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing[6],
  },
  downloadTicketButton: {
    backgroundColor: Colors.success[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    gap: Spacing[2],
    ...Shadows.lg,
  },
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

  // Ticket Download Styles
  ticketDownloadSection: {
    alignItems: 'center',
    gap: Spacing[4],
  },
  successMessage: {
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  successTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  successSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  downloadButton: {
    ...Components.button.primary,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[2],
    backgroundColor: Colors.success[500],
    ...Shadows.lg,
  },
  downloadButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
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