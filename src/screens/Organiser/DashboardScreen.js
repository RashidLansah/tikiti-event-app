import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { eventService, bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const organizerEvents = await eventService.getByOrganizer(user.uid);
      setEvents(organizerEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener for events
  useEffect(() => {
    if (!user) return;

    const unsubscribe = eventService.listenToOrganizerEvents(user.uid, (updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Refresh events when screen comes into focus (e.g., after creating a new event)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEvents();
    });

    return unsubscribe;
  }, [navigation]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  const EventCard = ({ event }) => {
    const [attendeeCount, setAttendeeCount] = useState(0);
    const [loadingAttendees, setLoadingAttendees] = useState(false);

    // Fetch real-time attendee count for this event
    useEffect(() => {
      const fetchAttendeeCount = async () => {
        if (!event?.id) return;
        
        try {
          setLoadingAttendees(true);
          const attendees = await bookingService.getEventAttendees(event.id);
          setAttendeeCount(attendees?.length || 0);
        } catch (error) {
          console.error('Error fetching attendee count for event card:', error);
          setAttendeeCount(0);
        } finally {
          setLoadingAttendees(false);
        }
      };

      fetchAttendeeCount();
    }, [event?.id]);

    return (
      <TouchableOpacity 
        style={[styles.eventCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
        onPress={() => handleEventPress(event)}
      >
      {event.imageBase64 && (
        <Image 
          source={{ 
            uri: event.imageBase64.startsWith('data:') 
              ? event.imageBase64 
              : `data:image/jpeg;base64,${event.imageBase64}` 
          }} 
          style={styles.eventImage} 
        />
      )}
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: colors.text.primary }]}>{event.name}</Text>
          <Text style={[styles.eventDate, { color: colors.text.secondary }]}>
           {event.date ? new Date(event.date).toLocaleDateString('en-US', {
             month: 'short',
             day: 'numeric',
             year: 'numeric'
           }) : 'Date TBD'}
         </Text>
        </View>
        <Text style={[styles.eventLocation, { color: colors.text.secondary }]}>
          {event.address || (typeof event.location === 'object' ? (event.location.name || event.location.address || 'Location TBA') : (event.location || 'Location TBA'))}
        </Text>
        
        {/* Organiser info */}
        <View style={[styles.organizerInfo, { backgroundColor: colors.background.primary }]}>
          <Feather name="user" size={12} color={colors.text.tertiary} />
          <Text style={[styles.organizerText, { color: colors.text.tertiary }]} numberOfLines={1}>
            by {event.organizerName || 'Event Organizer'}
          </Text>
        </View>
        
        <View style={[styles.eventStats, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          {event.type === 'paid' && event.price > 0 ? (
            <>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>{loadingAttendees ? '...' : `${attendeeCount}/${event.totalTickets || 0}`}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Tickets Sold</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>₵{loadingAttendees ? '...' : (attendeeCount * (event.price || 0))}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Revenue</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>{loadingAttendees ? '...' : `${attendeeCount}/${event.totalTickets || 0}`}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Attendees</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>Free</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Event</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>My Events</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={[styles.createButtonText, { color: colors.white }]}>+ Create Event</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading events...</Text>
          </View>
        ) : events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary[50] }]}>
              <Feather name="calendar-plus" size={48} color={colors.primary[500]} />
            </View>
            
            <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
              Welcome to Organiser Mode! 🎉
            </Text>
            
            <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
              You're now an organiser! Start creating amazing events and managing your attendees.
            </Text>

            <TouchableOpacity
              style={[styles.createFirstEventButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <Feather name="plus" size={20} color={colors.white} />
              <Text style={[styles.createFirstEventButtonText, { color: colors.white }]}>
                Create Your First Event
              </Text>
            </TouchableOpacity>

            {/* Quick Tips */}
            <View style={[styles.tipsCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.tipsTitle, { color: colors.text.primary }]}>Quick Tips for Success</Text>
              
              <View style={styles.tipItem}>
                <Feather name="check-circle" size={16} color={colors.success[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  Create detailed event descriptions to attract more attendees
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Feather name="check-circle" size={16} color={colors.success[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  Set clear pricing and ticket limits for better management
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Feather name="check-circle" size={16} color={colors.success[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  Use high-quality images to make your events stand out
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Feather name="check-circle" size={16} color={colors.success[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  Keep your event information up to date
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  createButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: Spacing[6],
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    letterSpacing: -0.3,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  organizerText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  createFirstEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen;