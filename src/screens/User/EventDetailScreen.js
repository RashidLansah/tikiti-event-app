import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ShareButton from '../../components/ShareButton';
import CopyLinkButton from '../../components/CopyLinkButton';
import { eventService, bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const EventDetailScreen = ({ navigation, route }) => {
  const { event: eventParam } = route.params;
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [event, setEvent] = useState(eventParam);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userBooking, setUserBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  
  // Note: RSVP form removed - app users use their existing profile data

  // Fetch real-time attendee count
  const fetchAttendeeCount = async () => {
    if (!event?.id || !user) {
      console.log('⚠️ Skipping attendee fetch: no event ID or user not authenticated');
      return;
    }
    
    try {
      setLoadingAttendees(true);
      const attendees = await bookingService.getEventAttendees(event.id);
      setAttendeeCount(attendees?.length || 0);
    } catch (error) {
      console.error('Error fetching attendee count:', error);
      // Don't show error to user, just set count to 0
      setAttendeeCount(0);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    fetchAttendeeCount();
  }, [event?.id, user]);

  // Handle opening directions in Google Maps
  const handleGetDirections = () => {
    console.log('🗺️ Get Directions clicked');
    console.log('📍 Event location:', event.location);
    
    if (!event.location) {
      console.log('❌ No location data');
      Alert.alert('Error', 'Location information is not available for this event.');
      return;
    }

    let locationString = '';
    let coordinates = null;

    // Handle different location formats
    if (typeof event.location === 'object') {
      locationString = event.location.address || event.location.name || '';
      coordinates = event.location.coordinates;
      console.log('📍 Object location - String:', locationString, 'Coordinates:', coordinates);
    } else {
      locationString = event.location;
      console.log('📍 String location:', locationString);
    }

    if (!locationString && !coordinates) {
      console.log('❌ No valid location data');
      Alert.alert('Error', 'Location information is not available for this event.');
      return;
    }

    // Create Google Maps URL
    let mapsUrl = '';
    
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      // Use coordinates if available (more accurate)
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
      console.log('🗺️ Using coordinates URL:', mapsUrl);
    } else {
      // Use address string
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationString)}`;
      console.log('🗺️ Using address URL:', mapsUrl);
    }

    // Try to open in Google Maps app first, then fallback to web
    const googleMapsUrl = Platform.OS === 'ios' 
      ? `comgooglemaps://?daddr=${coordinates ? `${coordinates.latitude},${coordinates.longitude}` : encodeURIComponent(locationString)}&directionsmode=driving`
      : `google.navigation:q=${coordinates ? `${coordinates.latitude},${coordinates.longitude}` : encodeURIComponent(locationString)}`;

    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 Google Maps URL:', googleMapsUrl);

    Linking.canOpenURL(googleMapsUrl)
      .then((supported) => {
        console.log('📱 Can open Google Maps app:', supported);
        if (supported) {
          console.log('✅ Opening Google Maps app');
          return Linking.openURL(googleMapsUrl);
        } else {
          console.log('🌐 Opening web version');
          // Fallback to web version
          return Linking.openURL(mapsUrl);
        }
      })
      .catch((err) => {
        console.error('💥 Error opening maps:', err);
        // Final fallback to web version
        Linking.openURL(mapsUrl).catch((webErr) => {
          console.error('💥 Error opening web maps:', webErr);
          Alert.alert('Error', 'Unable to open maps. Please try again.');
        });
      });
  };

  // Load real-time event data
  useEffect(() => {
    if (event?.id) {
      const unsubscribe = eventService.subscribe(event.id, (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() });
        }
      });

      return () => unsubscribe();
    }
  }, [event?.id]);

  // Check if user has already booked/RSVP'd for this event
  useEffect(() => {
    const checkUserBooking = async () => {
      if (user && event?.id) {
        setCheckingBooking(true);
        try {
          const existingBooking = await bookingService.getUserBookingForEvent(user.uid, event.id);
          setUserBooking(existingBooking);
        } catch (error) {
          console.error('Error checking user booking:', error);
        } finally {
          setCheckingBooking(false);
        }
      }
    };

    checkUserBooking();
  }, [user, event?.id]);

  const handleCancelBooking = async () => {
    if (!userBooking) return;

    const actionText = event.type === 'free' ? 'withdraw your RSVP' : 'cancel your booking';
    const confirmText = event.type === 'free' ? 'Withdraw RSVP' : 'Cancel Booking';
    
    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to ${actionText} for this event?`,
      [
        { text: 'Keep Registration', style: 'cancel' },
        {
          text: confirmText,
          style: 'destructive',
          onPress: async () => {
            setBooking(true);
            try {
              await bookingService.cancelBooking(
                userBooking.id,
                event.id,
                userBooking.quantity
              );
              
              setUserBooking(null);
              
              const successMessage = event.type === 'free' 
                ? 'Your RSVP has been withdrawn successfully.'
                : 'Your booking has been cancelled successfully.';
              
              Alert.alert('Success', successMessage);
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel. Please try again.');
            } finally {
              setBooking(false);
            }
          }
        }
      ]
    );
  };

  const handleBookTicket = async () => {
    if (!user) {
      const actionText = event.type === 'free' ? 'register for this event' : 'book tickets';
      Alert.alert('Login Required', `Please login to ${actionText}`, [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!event) {
      Alert.alert('Error', 'Event information not available');
      return;
    }

    // Check if event is full
    if (event.availableTickets <= 0) {
      Alert.alert('Event Full', 'Sorry, this event is fully booked. No more spots are available.');
      return;
    }

    // Check if event is active
    if (event.status !== 'active' && event.isActive !== true) {
      Alert.alert('Event Not Available', 'This event is no longer accepting bookings.');
      return;
    }

    if (event.type !== 'free' && event.availableTickets < ticketQuantity) {
      Alert.alert('Not Enough Tickets', `Only ${event.availableTickets} spots remaining. Cannot book ${ticketQuantity} tickets.`);
      return;
    }

    // For app users, proceed directly since we already have their details
    await processBooking();
  };

  // Form handlers removed - direct RSVP for app users

  const processBooking = async () => {
    setBooking(true);

    try {
      console.log('🚀 Starting booking process...');
      const finalQuantity = event.type === 'free' ? 1 : ticketQuantity;
      const bookingData = {
        eventId: event.id,
        userId: user.uid,
        quantity: finalQuantity,
        totalPrice: event.type === 'free' ? 0 : (event.price * finalQuantity),
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        userEmail: user.email,
        userName: user.displayName || 'Guest',
        registrationType: event.type === 'free' ? 'rsvp' : 'purchase',
        // For app users, we use their existing profile information
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
      };

      console.log('📝 Creating booking with data:', bookingData);
      const bookingResult = await bookingService.create(bookingData);
      console.log('✅ Booking created successfully:', bookingResult);
      
      // If we get here, the booking was successful - no need to continue if there are errors
      console.log('🎯 Core booking process completed successfully');

      const successTitle = event.type === 'free' ? 'RSVP Confirmed!' : 'Booking Confirmed!';
      const successMessage = event.type === 'free' 
        ? `You have successfully registered for ${event.name}`
        : `Successfully booked ${finalQuantity} ticket(s) for ${event.name}`;
      
      // Send RSVP confirmation notification (non-blocking)
      if (event.type === 'free') {
        notificationService.sendRSVPConfirmation(user.uid, event.name, event.id).catch(error => {
          console.warn('Failed to send RSVP confirmation notification:', error);
        });
        // Schedule event reminder notification (non-blocking)
        notificationService.scheduleEventReminder(user.uid, event.name, event.id, event.date).catch(error => {
          console.warn('Failed to schedule event reminder notification:', error);
        });
      }
      
      // Send new RSVP notification to organizer (non-blocking)
      if (event.organizerId) {
        const attendeeName = userProfile?.displayName || userProfile?.email || 'Someone';
        notificationService.sendNewRSVPNotification(event.organizerId, event.name, attendeeName, event.id).catch(error => {
          console.warn('Failed to send new RSVP notification to organizer:', error);
        });
      }
      
      // Refresh user booking status (non-blocking)
      bookingService.getUserBookingForEvent(user.uid, event.id).then(newBooking => {
        setUserBooking(newBooking);
      }).catch(error => {
        console.warn('Failed to refresh user booking status:', error);
      });
      
      // Update the event state to reflect new booking numbers (non-blocking)
      if (event?.id) {
        eventService.getById(event.id).then(updatedEvent => {
          if (updatedEvent) {
            setEvent(updatedEvent);
          }
        }).catch(error => {
          console.warn('Failed to refresh event data:', error);
        });
      }

      console.log('🎉 Showing success alert:', successTitle, successMessage);
      
      // Always show success alert - the booking was successful
      Alert.alert(
        successTitle,
        successMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('❌ Booking error:', error);
      
      // Handle specific error messages
      if (error.message.includes('spots remaining') || error.message.includes('spots available')) {
        Alert.alert('Event Full', error.message);
      } else if (error.message.includes('no longer accepting')) {
        Alert.alert('Event Not Available', error.message);
      } else {
        Alert.alert('Booking Failed', error.message || 'Please try again later');
      }
    } finally {
      setBooking(false);
    }
  };


  const handleBuyTicket = () => {
    const priceValue = parseFloat(event.price.replace('₵', ''));
    const total = (priceValue * ticketQuantity).toFixed(2);
    
    Alert.alert(
      'Purchase Confirmation',
      `Buy ${ticketQuantity} ticket(s) for ${event.name}?\n\nTotal: ₵${total}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Buy Now',
          onPress: () => {
            navigation.navigate('Ticket', { 
              event,
              quantity: ticketQuantity,
              purchaseId: 'TKT-' + Date.now()
            });
          },
        },
      ]
    );
  };




  const adjustQuantity = (delta) => {
    const newQuantity = ticketQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setTicketQuantity(newQuantity);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: 'transparent' }]}>
      <TouchableOpacity 
        style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <CopyLinkButton
          event={event}
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          iconSize={24}
          iconColor="#FFFFFF"
        />
        
        <ShareButton
          event={event}
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          iconSize={24}
          iconColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderImageGallery = () => (
    <View style={styles.imageContainer}>
      {event.imageBase64 ? (
        <Image
          source={{ 
            uri: event.imageBase64.startsWith('data:') 
              ? event.imageBase64 
              : `data:image/jpeg;base64,${event.imageBase64}` 
          }}
          style={styles.eventImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.background.secondary }]}>
          <Feather name="image" size={48} color={colors.text.tertiary} />
          <Text style={[styles.imageText, { color: colors.text.tertiary }]}>No image available</Text>
      </View>
      )}
      
      <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary[500]}E6` }]}>
        <Text style={[styles.categoryText, { color: colors.white }]}>{event.category}</Text>
      </View>
    </View>
  );

  const renderEventInfo = () => (
    <View style={styles.infoSection}>
      <View style={[styles.infoCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
          <Feather name="calendar" size={20} color={colors.primary[500]} />
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Date & Time</Text>
          <Text style={[styles.infoValue, { color: colors.text.primary }]}>{event.date}</Text>
          <Text style={[styles.infoSubValue, { color: colors.text.tertiary }]}>{event.startTime || event.time} - {event.endTime}</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success[100] }]}>
          <Feather name="map-pin" size={20} color={colors.success[500]} />
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Location</Text>
          <Text style={[styles.infoValue, { color: colors.text.primary }]}>
            {typeof event.location === 'object' ? (event.location.name || event.location.address || 'Location TBA') : (event.location || 'Location TBA')}
          </Text>
          <TouchableOpacity 
            onPress={handleGetDirections}
            activeOpacity={0.7}
            style={styles.directionsTouchable}
          >
            <View style={styles.directionsButton}>
              <Feather name="navigation" size={16} color={colors.primary[500]} />
              <Text style={[styles.mapLink, { color: colors.primary[500] }]}>Get Directions</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.warning[100] }]}>
          <Feather name="users" size={20} color={colors.warning[500]} />
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Attendees</Text>
          <Text style={[styles.infoValue, { color: colors.text.primary }]}>
            {loadingAttendees ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              `${attendeeCount} going`
            )}
          </Text>
          <Text style={[styles.infoSubValue, { color: colors.text.tertiary }]}>
            {(event.totalTickets || 0) - attendeeCount} spots left
          </Text>
        </View>
      </View>
    </View>
  );


  const renderBookingStatus = () => {
    if (!userBooking) return null;

    const isRSVP = userBooking.registrationType === 'rsvp';
    const statusText = isRSVP ? 'You have RSVP\'d for this event' : 'You have booked tickets for this event';
    const iconName = isRSVP ? 'user-check' : 'check-circle';
    
    return (
      <View style={[styles.bookingStatusBanner, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
        <View style={styles.statusContent}>
          <Feather name={iconName} size={24} color={colors.success[500]} />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: colors.success[700] }]}>Registration Confirmed</Text>
            <Text style={[styles.statusSubtitle, { color: colors.success[600] }]}>{statusText}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.cancelButton, { backgroundColor: colors.error[50], borderColor: colors.error[200] }]}
          onPress={handleCancelBooking}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator size="small" color={colors.error[500]} />
          ) : (
            <>
              <Feather name="x" size={16} color={colors.error[500]} />
              <Text style={[styles.cancelButtonText, { color: colors.error[600] }]}>
                {isRSVP ? 'Withdraw' : 'Cancel'}
              </Text>
            </>
          )}
      </TouchableOpacity>
    </View>
  );
  };


  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background.primary} />
      {renderHeader()}
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}

        <View style={[styles.contentContainer, { backgroundColor: colors.background.primary }]}>
          {renderBookingStatus()}
          
          <Text style={[styles.eventName, { color: colors.text.primary }]}>{event.name}</Text>
          <Text style={[styles.eventPrice, { color: colors.success[500] }]}>
            {event.type === 'free' ? 'Free' : `From ₵${event.price}`}
          </Text>

          {renderEventInfo()}

          <View style={[styles.descriptionSection, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About This Event</Text>
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              {event.description || 'No description available for this event.'}
            </Text>
          </View>

          <View style={[styles.organizerSection, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Organizer</Text>
            <View style={[styles.organizerCard, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light }]}>
              <View style={[styles.organizerAvatar, { backgroundColor: colors.primary[500] }]}>
                <Text style={[styles.organizerAvatarText, { color: colors.white }]}>
                  {event.organizerName?.[0]?.toUpperCase() || 'O'}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={[styles.organizerName, { color: colors.text.primary }]}>
                  {event.organizerName || 'Event Organizer'}
                </Text>
                {event.organizerEmail && (
                  <Text style={[styles.organizerStats, { color: colors.text.secondary }]}>
                    ✉️ {event.organizerEmail}
                  </Text>
                )}
                {event.organizerPhone && (
                  <Text style={[styles.organizerPhone, { color: colors.text.secondary }]}>
                    📞 {event.organizerPhone}
                  </Text>
                )}
              </View>
              <View style={styles.contactButtons}>
                {event.organizerPhone && (
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: colors.primary[500] }]}
                    onPress={() => {
                      const phoneNumber = event.organizerPhone.replace(/\s/g, ''); // Remove spaces
                      Linking.openURL(`tel:${phoneNumber}`);
                    }}
                  >
                    <Feather name="phone" size={16} color={colors.white} />
                    <Text style={[styles.contactButtonText, { color: colors.white }]}>Call</Text>
                  </TouchableOpacity>
                )}
                {event.organizerEmail && (
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: colors.success[500], marginLeft: 8 }]}
                    onPress={() => {
                      Linking.openURL(`mailto:${event.organizerEmail}`);
                    }}
                  >
                    <Feather name="mail" size={16} color={colors.white} />
                    <Text style={[styles.contactButtonText, { color: colors.white }]}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>


          <View style={[styles.ticketSection, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {event.type === 'free' ? 'Registration' : 'Select Tickets'}
            </Text>
            <View style={[styles.ticketCard, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light }]}>
              <View style={styles.ticketInfo}>
                <View>
                  <Text style={[styles.ticketType, { color: colors.text.primary }]}>
                    {event.type === 'free' ? 'Free Registration' : 'General Admission'}
                  </Text>
                  <Text style={[styles.ticketDescription, { color: colors.text.secondary }]}>
                    {event.type === 'free' ? 'Reserve your spot' : 'Full event access'}
                  </Text>
                </View>
                <Text style={[styles.ticketPrice, { color: colors.success[500] }]}>
                  {event.type === 'free' ? 'Free' : `₵${event.price}`}
                </Text>
              </View>
              
              {event.type !== 'free' && (
              <View style={styles.quantitySelector}>
                  <Text style={[styles.quantityLabel, { color: colors.text.secondary }]}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      { backgroundColor: colors.primary[500] },
                      ticketQuantity <= 1 && { backgroundColor: colors.gray[300] }
                    ]}
                    onPress={() => adjustQuantity(-1)}
                    disabled={ticketQuantity <= 1}
                  >
                    <Feather name="minus" size={16} color={colors.white} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.quantityValue, { color: colors.text.primary }]}>{ticketQuantity}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      { backgroundColor: colors.primary[500] },
                      ticketQuantity >= 10 && { backgroundColor: colors.gray[300] }
                    ]}
                    onPress={() => adjustQuantity(1)}
                    disabled={ticketQuantity >= 10}
                  >
                    <Feather name="plus" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {!userBooking && (
        <View style={[styles.purchaseContainer, { backgroundColor: colors.background.secondary, borderTopColor: colors.border.light }]}>
        <View style={styles.totalSection}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
              {event.type === 'free' ? 'Registration' : 'Total'}
            </Text>
            <Text style={[styles.totalSubLabel, { color: colors.text.secondary }]}>
              {event.type === 'free' ? '1 spot reserved' : `${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Text style={[styles.totalAmount, { color: colors.success[500] }]}>
            {event.type === 'free' ? 'Free Event' : `₵${(event.price * ticketQuantity).toFixed(2)}`}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.buyButton, 
            { backgroundColor: colors.primary[500] },
            booking && { backgroundColor: colors.gray[400] }
          ]} 
          onPress={handleBookTicket}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Feather 
                name={event.type === 'free' ? 'user-plus' : 'credit-card'} 
                size={20} 
                color={colors.white} 
              />
              <Text style={[styles.buyButtonText, { color: colors.white }]}>
                {event.type === 'free' ? 'RSVP Now' : 'Buy Tickets'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      )}

      {/* RSVP Form Modal removed - app users RSVP directly */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[3],
  },
  imageText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  categoryBadge: {
    position: 'absolute',
    top: 80,
    right: 24,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 24,
    flex: 1,
  },
  eventName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  eventPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 32,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoSubValue: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  mapLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 4,
  },
  directionsTouchable: {
    alignSelf: 'flex-start',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B5563',
    fontWeight: '400',
  },
  organizerSection: {
    marginBottom: 32,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  organizerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  organizerStats: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  organizerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  contactButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bookingStatusBanner: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[200],
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success[700],
    marginBottom: Spacing[1],
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success[600],
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[200],
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    gap: Spacing[1],
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  ticketSection: {
    marginBottom: 32,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  ticketType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  
  // RSVP form styles removed - direct RSVP for app users
});

export default EventDetailScreen;