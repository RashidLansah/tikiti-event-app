import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ShareButton from '../../components/ShareButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';

const { width } = Dimensions.get('window');

const EventDetailScreen = ({ navigation, route }) => {
  const { event } = route.params || {};
  const [isActive, setIsActive] = useState(event?.status === 'active');

  // Use actual event data or provide minimal fallback
  const eventData = event || {
    id: 'new',
    name: 'New Event',
    date: 'TBD',
    time: 'TBD',
    location: 'TBD',
    price: 0,
    category: 'General',
    description: 'Event details not available.',
    organizerName: 'Event Organizer',
    organizerEmail: '',
    totalTickets: 0,
    soldTickets: 0,
    availableTickets: 0,
    revenue: 0,
    status: 'draft',
    type: 'free',
  };

  const handleToggleEventStatus = () => {
    const newStatus = isActive ? 'inactive' : 'active';
    setIsActive(!isActive);
    Alert.alert(
      'Event Status Updated',
      `Event has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`
    );
  };

  const handleEditEvent = () => {
    navigation.navigate('CreateEvent', { event: eventData, isEdit: true });
  };

  const handleScanTickets = () => {
    navigation.navigate('ScanTicket', { event: eventData });
  };

  const handleViewAttendees = () => {
    navigation.navigate('EventAttendees', { event: eventData });
  };

  const openGoogleMaps = () => {
    const location = eventData.location;
    
    // Create the Google Maps URL
    const encodedLocation = encodeURIComponent(location);
    
    // Different URLs for different platforms
    const googleMapsUrl = Platform.select({
      ios: `maps://app?q=${encodedLocation}`,
      android: `geo:0,0?q=${encodedLocation}`,
      web: `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
    });
    
    // Fallback URL that works on all platforms
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    
    Linking.canOpenURL(googleMapsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(googleMapsUrl);
        } else {
          // Open in browser as fallback
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        // Fallback to browser
        Linking.openURL(fallbackUrl);
      });
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Event Deleted', 'The event has been successfully deleted.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const salesPercentage = Math.round((eventData.soldTickets / eventData.totalTickets) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="Colors.primary[500]" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <ShareButton
          event={eventData}
          style={styles.shareButton}
          iconSize={24}
          iconColor="Colors.primary[500]"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Banner */}
        <View style={styles.eventBanner}>
          <View style={styles.eventImagePlaceholder}>
            <Feather name="image" size={48} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>Event Poster</Text>
          </View>
          
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: isActive ? 'Colors.success[500]' : '#6B7280' }
          ]}>
            <Feather 
              name={isActive ? 'check-circle' : 'pause-circle'} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.statusText}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Event Information */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{eventData.name}</Text>
          <Text style={styles.eventCategory}>{eventData.category}</Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Feather name="calendar" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{eventData.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="clock" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{eventData.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>{eventData.location}</Text>
              <TouchableOpacity 
                style={styles.viewMapButton}
                onPress={openGoogleMaps}
              >
                <Text style={styles.viewMapText}>View</Text>
                <Feather name="external-link" size={16} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="tag" size={20} color={Colors.primary[500]} />
              <Text style={styles.detailText}>
                {eventData.type === 'free' ? 'Free Event' : `₵${eventData.price}`}
              </Text>
            </View>
          </View>

          {eventData.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{eventData.description}</Text>
            </View>
          )}

          {/* Additional Event Details */}
          <View style={styles.additionalDetails}>
            <Text style={styles.sectionTitle}>Event Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Feather name="user" size={16} color="Colors.primary[500]" />
                <Text style={styles.infoLabel}>Organizer</Text>
                <Text style={styles.infoValue}>{eventData.organizer}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="users" size={16} color="Colors.primary[500]" />
                <Text style={styles.infoLabel}>Age Restriction</Text>
                <Text style={styles.infoValue}>{eventData.ageRestriction}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="truck" size={16} color="Colors.primary[500]" />
                <Text style={styles.infoLabel}>Parking</Text>
                <Text style={styles.infoValue}>{eventData.parking}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="heart" size={16} color="Colors.primary[500]" />
                <Text style={styles.infoLabel}>Accessibility</Text>
                <Text style={styles.infoValue}>{eventData.accessibility}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sales Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="users" size={24} color={Colors.primary[500]} />
              <Text style={styles.statNumber}>{eventData.soldTickets || 0}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            
            <View style={styles.statCard}>
              <Feather name="tag" size={24} color={Colors.success[500]} />
              <Text style={styles.statNumber}>{(eventData.totalTickets || 0) - (eventData.soldTickets || 0)}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            
            <View style={styles.statCard}>
              <Feather name="dollar-sign" size={24} color={Colors.warning[500]} />
              <Text style={styles.statNumber}>
                ₵{((eventData.soldTickets || 0) * (eventData.price || 0)).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          {/* Sales Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Sales Progress</Text>
              <Text style={styles.progressPercentage}>{salesPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${salesPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {eventData.soldTickets} of {eventData.totalTickets} tickets sold
            </Text>
          </View>
        </View>

        {/* Ticket Types */}
        {eventData.ticketTypes && (
          <View style={styles.ticketTypesContainer}>
            <Text style={styles.sectionTitle}>Ticket Types & Pricing</Text>
            
            {eventData.ticketTypes.map((ticket, index) => (
              <View key={index} style={styles.ticketTypeCard}>
                <View style={styles.ticketTypeHeader}>
                  <View style={styles.ticketTypeInfo}>
                    <Text style={styles.ticketTypeName}>{ticket.type}</Text>
                    <Text style={styles.ticketTypePrice}>{ticket.price}</Text>
                  </View>
                  <View style={styles.ticketTypeStats}>
                    <Text style={styles.ticketTypeSold}>{ticket.sold}/{ticket.total}</Text>
                    <Text style={styles.ticketTypeLabel}>Sold</Text>
                  </View>
                </View>
                <View style={styles.ticketProgressBar}>
                  <View 
                    style={[
                      styles.ticketProgressFill,
                      { width: `${(ticket.sold / ticket.total) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Amenities & Features */}
        {eventData.amenities && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.sectionTitle}>Amenities & Features</Text>
            
            <View style={styles.amenitiesGrid}>
              {eventData.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Feather name="check-circle" size={16} color="Colors.success[500]" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>

            {/* Additional Info */}
            <View style={styles.additionalInfoSection}>
              <View style={styles.additionalInfoItem}>
                <Feather name="mail" size={16} color="Colors.primary[500]" />
                <Text style={styles.additionalInfoLabel}>Contact Email</Text>
                <Text style={styles.additionalInfoValue}>{eventData.contactEmail}</Text>
              </View>
              
              <View style={styles.additionalInfoItem}>
                <Feather name="phone" size={16} color="Colors.primary[500]" />
                <Text style={styles.additionalInfoLabel}>Contact Phone</Text>
                <Text style={styles.additionalInfoValue}>{eventData.contactPhone}</Text>
              </View>
              
              <View style={styles.additionalInfoItem}>
                <Feather name="cloud" size={16} color="Colors.primary[500]" />
                <Text style={styles.additionalInfoLabel}>Venue Type</Text>
                <Text style={styles.additionalInfoValue}>{eventData.weather}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleScanTickets}
            >
              <Feather name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Scan Tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleViewAttendees}
            >
              <Feather name="users" size={24} color="Colors.primary[500]" />
              <Text style={[styles.actionButtonText, { color: 'Colors.primary[500]' }]}>View Attendees</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleEditEvent}
            >
              <Feather name="edit-3" size={24} color="Colors.primary[500]" />
              <Text style={[styles.actionButtonText, { color: 'Colors.primary[500]' }]}>Edit Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isActive ? styles.warningAction : styles.successAction
              ]}
              onPress={handleToggleEventStatus}
            >
              <Feather 
                name={isActive ? 'pause' : 'play'} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.actionButtonText}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteEvent}
          >
            <Feather name="trash-2" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Event</Text>
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
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  shareButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
  },
  content: {
    flex: 1,
  },
  eventBanner: {
    position: 'relative',
    margin: Spacing[5],
    marginBottom: 0,
  },
  eventImagePlaceholder: {
    height: 200,
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
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
    lineHeight: Typography.lineHeight.tight,
  },
  eventCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[5],
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  eventDetails: {
    gap: Spacing[4],
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
    marginTop: Spacing[6],
    paddingTop: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  statsContainer: {
    ...Components.card.primary,
    margin: Spacing[5],
    marginTop: 0,
    padding: Spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  progressSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  progressPercentage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[600],
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing[2],
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  actionsContainer: {
    ...Components.card.primary,
    margin: Spacing[5],
    marginTop: 0,
    padding: Spacing[6],
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    gap: Spacing[2],
  },
  primaryAction: {
    backgroundColor: Colors.primary[500],
    ...Shadows.lg,
  },
  secondaryAction: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    ...Shadows.sm,
  },
  successAction: {
    backgroundColor: Colors.success[500],
    ...Shadows.lg,
  },
  warningAction: {
    backgroundColor: Colors.warning[500],
    ...Shadows.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  dangerZone: {
    ...Components.card.primary,
    margin: Spacing[5],
    marginTop: 0,
    marginBottom: Spacing[10],
    padding: Spacing[6],
    borderColor: Colors.error[200],
  },
  dangerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error[500],
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[50],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error[200],
    gap: Spacing[2],
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[500],
  },
  // Additional styles for new sections
  additionalDetails: {
    marginTop: Spacing[6],
    paddingTop: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  infoGrid: {
    gap: Spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    flex: 2,
  },
  ticketTypesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ticketTypeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketTypeInfo: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ticketTypePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: 'Colors.primary[500]',
  },
  ticketTypeStats: {
    alignItems: 'flex-end',
  },
  ticketTypeSold: {
    fontSize: 16,
    fontWeight: '700',
    color: 'Colors.success[500]',
  },
  ticketTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  ticketProgressFill: {
    height: '100%',
    backgroundColor: 'Colors.success[500]',
    borderRadius: 3,
  },
  amenitiesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amenitiesGrid: {
    gap: 12,
    marginBottom: 24,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  additionalInfoSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  additionalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  additionalInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  additionalInfoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 2,
  },
});

export default EventDetailScreen;