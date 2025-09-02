import React, { useState, useEffect } from 'react';
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
  Image,
  ActionSheetIOS,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ShareButton from '../../components/ShareButton';
import CopyLinkButton from '../../components/CopyLinkButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { eventService, bookingService } from '../../services/firestoreService';

const { width } = Dimensions.get('window');

const EventDetailScreen = ({ navigation, route }) => {
  const { event } = route.params || {};
  
  // Ensure we have event data, otherwise navigate back
  if (!event) {
    navigation.goBack();
    return null;
  }

  const [isActive, setIsActive] = useState(event?.status === 'active');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Fetch real-time attendee count
  const fetchAttendeeCount = async () => {
    if (!event?.id) return;
    
    try {
      setLoadingAttendees(true);
      const attendees = await bookingService.getEventAttendees(event.id);
      setAttendeeCount(attendees?.length || 0);
    } catch (error) {
      console.error('Error fetching attendee count:', error);
      setAttendeeCount(0);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    fetchAttendeeCount();
  }, [event?.id]);

  // Use the real event data directly
  const eventData = {
    ...event,
    // Ensure we have all required fields with proper fallbacks
    name: event.name || 'Untitled Event',
    date: event.date || 'Date not set',
    startTime: event.startTime || event.time || 'Time not set',
    endTime: event.endTime || '',
    location: event.location || event.address || 'Location not set',
    price: event.price || 0,
    category: event.category || 'General',
    description: event.description || 'No description provided.',
    organizerName: event.organizerName || 'Event Organizer',
    organizerEmail: event.organizerEmail || '',
    totalTickets: event.totalTickets || 0,
    soldTickets: event.soldTickets || 0,
    availableTickets: event.availableTickets || event.totalTickets || 0,
    revenue: (event.soldTickets || 0) * (event.price || 0),
    status: event.status || 'draft',
    type: event.type || (event.price > 0 ? 'paid' : 'free'),
    imageBase64: event.imageBase64 || null,
  };

  const handleToggleEventStatus = async () => {
    try {
      const newStatus = isActive ? 'inactive' : 'active';
      const newIsActive = !isActive;
      
      // Update the event in Firestore
      await eventService.update(event.id, {
        status: newStatus,
        isActive: newIsActive,
      });
      
      // Update local state
      setIsActive(newIsActive);
      
      Alert.alert(
        'Event Status Updated',
        `Event has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`
      );
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert(
        'Error',
        'Failed to update event status. Please try again.'
      );
    }
  };

  const handleEditEvent = () => {
    navigation.navigate('CreateEvent', { event: eventData, isEdit: true });
  };

  const handleScanTickets = () => {
    navigation.navigate('ScanTicket', { event: eventData });
  };

  const handleViewAttendees = () => {
    console.log('🎯 View Attendees button pressed');
    console.log('📊 Event data being passed:', {
      id: eventData.id,
      name: eventData.name,
      totalTickets: eventData.totalTickets,
      soldTickets: eventData.soldTickets
    });
    
    try {
      navigation.navigate('EventAttendees', { event: eventData });
      console.log('✅ Navigation to EventAttendees initiated');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
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
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      
      // Use permanent delete - completely removes the event from Firestore
      await eventService.deletePermanently(event.id);
      
      setShowDeleteModal(false);
      
      // Add a small delay for smooth animation
      setTimeout(() => {
        Alert.alert(
          'Event Deleted',
          `"${eventData.name}" has been permanently deleted.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }, 200);
      
    } catch (error) {
      console.error('Error deleting event:', error);
      setIsDeleting(false);
      
      Alert.alert(
        'Delete Failed',
        'There was an error deleting the event. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const cancelDeleteEvent = () => {
    // Prevent canceling while delete is in progress
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  const salesPercentage = eventData.totalTickets > 0 ? Math.round((attendeeCount / eventData.totalTickets) * 100) : 0;

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
        <View style={styles.headerActions}>
          <CopyLinkButton
            event={eventData}
            style={styles.shareButton}
            iconSize={24}
            iconColor="Colors.primary[500]"
          />
          <ShareButton
            event={eventData}
            style={styles.shareButton}
            iconSize={24}
            iconColor="Colors.primary[500]"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Banner */}
        <View style={styles.eventBanner}>
          {eventData.imageBase64 ? (
            <Image
              source={{ 
                uri: eventData.imageBase64.startsWith('data:') 
                  ? eventData.imageBase64 
                  : `data:image/jpeg;base64,${eventData.imageBase64}` 
              }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Feather name="image" size={48} color={Colors.text.tertiary} />
              <Text style={styles.imagePlaceholderText}>Event Poster</Text>
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: isActive ? Colors.success[500] : Colors.text.secondary }
          ]}>
            <Feather 
              name={isActive ? 'check-circle' : 'pause-circle'} 
              size={16} 
              color={Colors.white} 
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
              <Text style={styles.detailText}>
                {eventData.startTime}
                {eventData.endTime && ` - ${eventData.endTime}`}
              </Text>
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
                <Feather name="user" size={16} color={Colors.primary[500]} />
                <Text style={styles.infoLabel}>Organizer</Text>
                <Text style={styles.infoValue}>{eventData.organizerName}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="mail" size={16} color={Colors.primary[500]} />
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{eventData.organizerEmail || 'Not provided'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="tag" size={16} color={Colors.primary[500]} />
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{eventData.category}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Feather name="clock" size={16} color={Colors.primary[500]} />
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{eventData.status || 'Active'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sales Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>
            {eventData.type === 'paid' ? 'Sales Overview' : 'Attendance Overview'}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="users" size={24} color={Colors.primary[500]} />
              {loadingAttendees ? (
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              ) : (
                <Text style={styles.statNumber}>{attendeeCount}</Text>
              )}
              <Text style={styles.statLabel}>
                {eventData.type === 'paid' ? 'Attendees' : 'Attendees'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Feather name="tag" size={24} color={Colors.success[500]} />
              <Text style={styles.statNumber}>{(eventData.totalTickets || 0) - attendeeCount}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            
            {eventData.type === 'paid' && eventData.price > 0 ? (
              <View style={styles.statCard}>
                <Feather name="dollar-sign" size={24} color={Colors.warning[500]} />
                <Text style={styles.statNumber}>
                  ₵{(attendeeCount * (eventData.price || 0)).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            ) : (
              <View style={styles.statCard}>
                <Feather name="heart" size={24} color={Colors.success[500]} />
                <Text style={styles.statNumber}>Free</Text>
                <Text style={styles.statLabel}>Event</Text>
              </View>
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {eventData.type === 'paid' ? 'Sales Progress' : 'Attendance Progress'}
              </Text>
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
              {attendeeCount} of {eventData.totalTickets} tickets {eventData.type === 'paid' ? 'sold' : 'claimed'}
            </Text>
          </View>
        </View>





        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleScanTickets}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="camera" size={20} color={Colors.white} />
              </View>
              <Text style={[styles.actionButtonText, { color: Colors.white }]}>Scan Tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleViewAttendees}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: Colors.primary[100] }]}>
                <Feather name="users" size={20} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.actionButtonText, { color: Colors.primary[600] }]}>View Attendees</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleEditEvent}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: Colors.success[100] }]}>
                <Feather name="edit-3" size={20} color={Colors.success[500]} />
              </View>
              <Text style={[styles.actionButtonText, { color: Colors.success[600] }]}>Edit Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isActive ? styles.warningAction : styles.successAction
              ]}
              onPress={handleToggleEventStatus}
            >
              <View style={styles.actionIconContainer}>
                <Feather 
                  name={isActive ? 'pause' : 'play'} 
                  size={20} 
                  color={Colors.white} 
                />
              </View>
              <Text style={[styles.actionButtonText, { color: Colors.white }]}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerSubtitle}>
              Once you delete an event, there is no going back. Please be certain.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteEvent}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.error[100] }]}>
              <Feather name="trash-2" size={20} color={Colors.error[500]} />
            </View>
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDeleteEvent}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={cancelDeleteEvent}
            disabled={isDeleting}
          />
          
          <View style={styles.modalContainer}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />
            
            {/* Modal content */}
            <View style={styles.modalContent}>
              {/* Icon */}
              <View style={styles.modalIconContainer}>
                <Feather name="trash-2" size={32} color={Colors.error[500]} />
              </View>
              
              {/* Title and message */}
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Delete Event</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete "{eventData.name}"? This action cannot be undone and all attendee data will be permanently removed.
                </Text>
              </View>
              
              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[
                    styles.modalCancelButton,
                    isDeleting && styles.buttonDisabled
                  ]}
                  onPress={cancelDeleteEvent}
                  disabled={isDeleting}
                >
                  <Text style={[
                    styles.modalCancelText,
                    isDeleting && styles.textDisabled
                  ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalDeleteButton,
                    isDeleting && styles.deleteButtonLoading
                  ]}
                  onPress={confirmDeleteEvent}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator 
                        size="small" 
                        color={Colors.white} 
                        style={styles.loadingSpinner}
                      />
                      <Text style={styles.modalDeleteText}>Deleting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalDeleteText}>Delete Event</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[2],
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
  eventImage: {
    height: 200,
    width: '100%',
    borderRadius: BorderRadius['2xl'],
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
    borderTopColor: Colors.border.light,
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.xl,
    gap: Spacing[3],
    minHeight: 80,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: Colors.primary[500],
    ...Shadows.lg,
  },
  secondaryAction: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.md,
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
    textAlign: 'center',
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.sm,
  },
  dangerZone: {
    ...Components.card.primary,
    margin: Spacing[5],
    marginTop: 0,
    marginBottom: Spacing[10],
    padding: Spacing[6],
    borderColor: Colors.error[200],
    borderWidth: 1,
    backgroundColor: Colors.error[25],
  },
  dangerHeader: {
    marginBottom: Spacing[6],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.error[100],
  },
  dangerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error[600],
    marginBottom: Spacing[2],
  },
  dangerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  deleteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.error[200],
    gap: Spacing[3],
    minHeight: 80,
    ...Shadows.sm,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[600],
    textAlign: 'center',
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

  amenitiesContainer: {
    backgroundColor: Colors.white,
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
    borderColor: Colors.border.light,
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
    color: Colors.text.primary,
    fontWeight: '500',
  },
  additionalInfoSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
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
    color: Colors.text.primary,
    flex: 1,
  },
  additionalInfoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 2,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
    paddingHorizontal: Spacing[6],
    ...Shadows['2xl'],
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing[6],
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
    borderWidth: 2,
    borderColor: Colors.error[100],
  },
  modalTextContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  modalTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray[900],
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing[4],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.sm,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray[700],
    textAlign: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.error[500],
    ...Shadows.lg,
  },
  modalDeleteText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
  
  // Loading states
  buttonDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    opacity: 0.6,
  },
  deleteButtonLoading: {
    backgroundColor: Colors.error[400],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: Spacing[2],
  },
});

export default EventDetailScreen;