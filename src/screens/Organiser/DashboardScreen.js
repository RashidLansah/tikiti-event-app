import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { eventService, bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import PillTabBar from '../../components/PillTabBar';
import { DashboardSkeleton } from '../../components/Skeleton';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const dashboardTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'menu' },
    { key: 'events', label: 'Events', icon: 'calendar' },
    { key: 'attendees', label: 'Attendees', icon: 'calendar' },
    { key: 'messages', label: 'Messages', icon: 'calendar' },
    { key: 'reports', label: 'Reports', icon: 'calendar' },
  ];

  // Split events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    events.forEach((event) => {
      const eventEndTime = new Date(`${event.date} ${event.endTime || '23:59'}`);
      if (now <= eventEndTime) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

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
        if (!event?.id || !user) {
          console.log('⚠️ Skipping attendee fetch for event card: no event ID or user not authenticated');
          return;
        }
        
        try {
          setLoadingAttendees(true);
          const attendees = await bookingService.getEventAttendees(event.id);
          setAttendeeCount(attendees?.length || 0);
        } catch (error) {
          console.error('Error fetching attendee count for event card:', error);
          // Don't show error to user, just set count to 0
          setAttendeeCount(0);
        } finally {
          setLoadingAttendees(false);
        }
      };

      fetchAttendeeCount();
    }, [event?.id, user]);

    return (
      <TouchableOpacity 
        style={[styles.eventCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
        onPress={() => handleEventPress(event)}
      >
      {event.imageBase64 && (
        <View style={styles.eventImageContainer}>
          <Image 
            source={{ 
              uri: event.imageBase64.startsWith('data:') 
                ? event.imageBase64 
                : `data:image/jpeg;base64,${event.imageBase64}` 
            }} 
            style={styles.eventImage} 
          />
          
          {/* Full Event Badge */}
          {event.availableTickets <= 0 && (
            <View style={[styles.fullEventBadge, { backgroundColor: colors.error[500] }]}>
              <Text style={[styles.fullEventText, { color: colors.white }]}>FULL</Text>
            </View>
          )}
        </View>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>My Events</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={[styles.createButtonText, { color: colors.white }]}>+ Create Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pillTabContainer}>
        <PillTabBar
          tabs={dashboardTabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
      </View>

      <ScrollView 
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <DashboardSkeleton />
        ) : events.length > 0 ? (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Feather name="calendar" size={18} color={colors.primary[500]} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Upcoming Events ({upcomingEvents.length})
                  </Text>
                </View>
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Feather name="clock" size={18} color={colors.text.tertiary} />
                  <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
                    Past Events ({pastEvents.length})
                  </Text>
                </View>
                {pastEvents.map((event) => (
                  <View key={event.id} style={{ opacity: 0.6 }}>
                    <EventCard event={event} />
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary[50] }]}>
              <Feather name="calendar" size={48} color={colors.primary[500]} />
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
    </SafeAreaView>
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
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 0,
  },
  pillTabContainer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
    marginTop: Spacing[2],
    gap: 8,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'PlusJakartaSans-Bold',
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
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  
  // Full Event Badge
  fullEventBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.error[500],
  },
  fullEventText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.white,
    letterSpacing: 0.5,
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
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.text.primary,
    flex: 1,
    letterSpacing: -0.3,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  eventLocation: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  organizerText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginLeft: 4,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.secondary[300],
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: Colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-SemiBold',
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
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  createFirstEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: Colors.primary[500],
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
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.white,
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: Colors.secondary[300],
    borderRadius: 12,
    padding: 24,
    width: '100%',
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.text.secondary,
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
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.text.tertiary,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen;