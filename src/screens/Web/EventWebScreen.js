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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const EventWebScreen = ({ route, navigation }) => {
  const { eventId } = route?.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  // Mock event data - in real app, fetch from API using eventId
  useEffect(() => {
    const fetchEvent = async () => {
      // Simulate API call
      setTimeout(() => {
        const mockEvent = {
          id: eventId || '1',
          name: 'Northern Music Festival 2025',
          date: 'September 15, 2025',
          time: '6:00 PM - 11:00 PM',
          location: 'Tamale Cultural Centre, Sports Stadium Road',
          price: '₵80.00',
          category: 'Music & Entertainment',
          description: 'Join us for an unforgettable night of music featuring the biggest stars from Northern Ghana and special guest artists from across West Africa.',
          organizer: 'Northern Events Ltd.',
          contactEmail: 'info@northernevents.com',
          contactPhone: '+233 20 123 4567',
          totalTickets: 500,
          soldTickets: 320,
          availableTickets: 180,
          status: 'active',
          eventType: 'paid', // or 'free'
          shareUrl: `https://tikiti.com/events/${eventId || '1'}`,
        };
        setEvent(mockEvent);
        setLoading(false);
      }, 1000);
    };

    fetchEvent();
  }, [eventId]);

  const handleTicketPurchase = () => {
    if (event.eventType === 'free') {
      Alert.alert(
        'RSVP Successful!',
        `You have successfully reserved ${ticketQuantity} spot${ticketQuantity > 1 ? 's' : ''} for ${event.name}. Check your email for confirmation.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Redirecting to Payment',
        `You will be redirected to complete your purchase of ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for ${event.name}.`,
        [{ text: 'Continue' }]
      );
    }
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
          <View style={styles.eventImagePlaceholder}>
            <Feather name="image" size={isWeb ? 64 : 48} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>Event Poster</Text>
          </View>
          
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
});

export default EventWebScreen;