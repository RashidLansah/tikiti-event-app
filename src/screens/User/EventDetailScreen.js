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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ShareButton from '../../components/ShareButton';
import { eventService, bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userBooking, setUserBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);

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

    if (!event || (event.type !== 'free' && event.availableTickets < ticketQuantity)) {
      Alert.alert('Error', 'Not enough tickets available');
      return;
    }

    setBooking(true);

    try {
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
      };

      await bookingService.create(bookingData);

      const successTitle = event.type === 'free' ? 'RSVP Confirmed!' : 'Booking Confirmed!';
      const successMessage = event.type === 'free' 
        ? `You have successfully registered for ${event.name}`
        : `Successfully booked ${finalQuantity} ticket(s) for ${event.name}`;
      
      // Refresh user booking status
      const newBooking = await bookingService.getUserBookingForEvent(user.uid, event.id);
      setUserBooking(newBooking);
      
      Alert.alert(
        successTitle,
        successMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', 'Please try again later');
    } finally {
      setBooking(false);
    }
  };

  // Mock data for enhanced features
  const eventImages = [
    '🎭', '🎪', '🎨', '🎬', '🎤'
  ];

  // Reviews will be implemented later
  const reviews = [];

  // Related events will be fetched from database later
  const relatedEvents = [];

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



  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    Alert.alert(
      isFavorited ? 'Removed from Favorites' : 'Added to Favorites',
      isFavorited ? 'Event removed from your favorites' : 'Event saved to your favorites'
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
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={toggleFavorite}
        >
          <Feather 
            name="heart" 
            size={24} 
            color={isFavorited ? "#EF4444" : "#FFFFFF"} 
          />
        </TouchableOpacity>
        
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
          <Text style={[styles.infoSubValue, { color: colors.text.tertiary }]}>{event.startTime} - {event.endTime}</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success[100] }]}>
          <Feather name="map-pin" size={20} color={colors.success[500]} />
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Location</Text>
          <Text style={[styles.infoValue, { color: colors.text.primary }]}>{event.location}</Text>
          <TouchableOpacity>
            <Text style={[styles.mapLink, { color: colors.primary[500] }]}>View on map</Text>
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
            {event.soldTickets || 0} going
          </Text>
          <Text style={[styles.infoSubValue, { color: colors.text.tertiary }]}>
            {event.availableTickets || event.totalTickets || 0} spots left
          </Text>
        </View>
      </View>
    </View>
  );

  const renderReviews = () => (
    <View style={[styles.reviewsSection, { backgroundColor: colors.background.secondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Reviews</Text>
      <View style={[styles.emptyState, { backgroundColor: colors.background.tertiary }]}>
        <Feather name="message-square" size={48} color={colors.text.tertiary} />
        <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>No Reviews Yet</Text>
        <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
          Be the first to share your experience about this event
        </Text>
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

  const renderRelatedEvents = () => (
    <View style={[styles.relatedSection, { backgroundColor: colors.background.secondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>You Might Also Like</Text>
      {relatedEvents.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {relatedEvents.map((relatedEvent) => (
            <TouchableOpacity key={relatedEvent.id} style={styles.relatedEventCard}>
              <View style={styles.relatedEventImage}>
                <Text style={styles.relatedEventEmoji}>🎪</Text>
              </View>
              <Text style={styles.relatedEventName}>{relatedEvent.name}</Text>
              <Text style={styles.relatedEventPrice}>{relatedEvent.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={48} color={Colors.text.tertiary} />
          <Text style={styles.emptyStateTitle}>No Related Events</Text>
          <Text style={styles.emptyStateSubtitle}>
            Check back later for similar events
          </Text>
        </View>
      )}
    </View>
  );

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
                <Text style={[styles.organizerStats, { color: colors.text.secondary }]}>
                  {event.organizerEmail || 'Contact organizer for details'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary[500] }]}>
                <Feather name="message-circle" size={16} color={colors.white} />
                <Text style={[styles.contactButtonText, { color: colors.white }]}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderReviews()}
          {renderRelatedEvents()}

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
  reviewsSection: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
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
  relatedSection: {
    marginBottom: 32,
  },
  relatedEventCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  relatedEventImage: {
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedEventEmoji: {
    fontSize: 32,
  },
  relatedEventName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  relatedEventPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
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
});

export default EventDetailScreen;