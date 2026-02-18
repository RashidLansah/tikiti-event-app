import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import PillTabBar from '../../components/PillTabBar';
import { EventListSkeleton } from '../../components/Skeleton';
import TikitiLoader from '../../components/TikitiLoader';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { eventService, bookingService, getFirestoreErrorMessage } from '../../services/firestoreService';
import notificationService from '../../services/notificationService';
import logger from '../../utils/logger';

const EventListScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { userProfile, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const searchInputRef = useRef(null);

  // Load unread notifications count
  const loadUnreadNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      const count = await notificationService.getUnreadCount(user.uid);
      setUnreadNotifications(count);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  // Load events and categories from Firestore
  const loadEvents = async () => {
    try {
      let eventsData = [];

      // If user has a country set, load events near them
      if (userProfile?.organisationCountry) {
        logger.log('Loading events for user country:', userProfile.organisationCountry);
        eventsData = await eventService.getNearUser(userProfile.organisationCountry, 20);
      } else {
        logger.log('No user country set, loading all events');
        const result = await eventService.getAll(20);
        eventsData = result.events || [];
      }

      setEvents(eventsData);
    } catch (error) {
      logger.error('Error loading events:', error);
      // Fallback to all events on error
      try {
        const result = await eventService.getAll(20);
        setEvents(result.events || []);
      } catch (fallbackError) {
        logger.error('Error loading fallback events:', fallbackError);
        setEvents([]);
        Alert.alert('Couldn\'t Load Events', getFirestoreErrorMessage(fallbackError));
      }
    }
  };



  // Time filter options (PillTabBar format)
  const timeFilterOptions = [
    { key: 'all', label: 'All', icon: 'calendar' },
    { key: 'live', label: 'Live Now', icon: 'radio' },
    { key: 'today', label: 'Today', icon: 'sun' },
    { key: 'tomorrow', label: 'Tomorrow', icon: 'sunrise' },
    { key: 'thisWeek', label: 'This Week', icon: 'calendar' },
    { key: 'thisMonth', label: 'This Month', icon: 'calendar' },
  ];

  // Filter events by time
  const filterEventsByTime = (events, timeFilter) => {
    if (timeFilter === 'all') return events;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      switch (timeFilter) {
        case 'live':
          // Events happening now (within 2 hours of current time)
          const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
          return eventDate >= now && eventDate <= twoHoursFromNow;
        
        case 'today':
          // Events happening today
          return eventDate >= today && eventDate < tomorrow;
        
        case 'tomorrow':
          // Events happening tomorrow
          return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        
        case 'thisWeek':
          // Events happening this week
          return eventDate >= today && eventDate < nextWeek;
        
        case 'thisMonth':
          // Events happening this month
          return eventDate >= today && eventDate < nextMonth;
        
        default:
          return true;
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh events
      await loadEvents();
      console.log('📱 Events refreshed successfully');
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Removed sample data initialization - only show real events created by organizers

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadEvents();
      await loadUnreadNotifications();
      setLoading(false);
    };
    loadData();
  }, [userProfile, user]);

  // Set up real-time listener for all events
  useEffect(() => {
    const unsubscribe = eventService.listenToAllEvents((updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // No dummy events - only show real events created by organizers

  // Time-based event categorization
  const categorizeEventsByTime = (events) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekend = new Date(today);
    thisWeekend.setDate(today.getDate() + (6 - today.getDay())); // Next Saturday
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const categorized = {
      happeningNow: [],
      today: [],
      tomorrow: [],
      thisWeekend: [],
      nextWeek: [],
      thisMonth: [],
      upcoming: []
    };

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const eventTime = new Date(`${event.date} ${event.startTime || event.time || '00:00'}`);
      const eventEndTime = new Date(`${event.date} ${event.endTime || '23:59'}`);

      // Happening now (event is currently active)
      if (now >= eventTime && now <= eventEndTime) {
        categorized.happeningNow.push(event);
      }
      // Today's events
      else if (eventDate.toDateString() === today.toDateString()) {
        categorized.today.push(event);
      }
      // Tomorrow's events
      else if (eventDate.toDateString() === tomorrow.toDateString()) {
        categorized.tomorrow.push(event);
      }
      // This weekend (Friday-Sunday)
      else if (eventDate >= thisWeekend && eventDate <= new Date(thisWeekend.getTime() + 2 * 24 * 60 * 60 * 1000)) {
        categorized.thisWeekend.push(event);
      }
      // Next week
      else if (eventDate >= nextWeek && eventDate < new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        categorized.nextWeek.push(event);
      }
      // This month
      else if (eventDate <= thisMonth) {
        categorized.thisMonth.push(event);
      }
      // Future events
      else {
        categorized.upcoming.push(event);
      }
    });

    return categorized;
  };

  // Filter events based on search query only
  const filteredEvents = events.filter(event => {
    const locationText = typeof event.location === 'object' ? 
      (event.location.name || event.location.address || '') : 
      (event.location || '');
    
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationText.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Apply time filter to the already filtered events
  const timeFilteredEvents = filterEventsByTime(filteredEvents, selectedTimeFilter);

  // Categorize filtered events by time
  const timeBasedEvents = categorizeEventsByTime(timeFilteredEvents);

  // Time-based section header component
  const TimeSection = ({ title, subtitle, icon, count, events }) => {
    if (events.length === 0) return null;

    const displayEvents = events;

    return (
      <View style={styles.timeSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary[100] }]}>
              <Feather name={icon} size={16} color={colors.primary[500]} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{title}</Text>
              {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>}
            </View>
          </View>
          <View style={[styles.eventCount, { backgroundColor: colors.primary[50] }]}>
            <Text style={[styles.eventCountText, { color: colors.primary[600] }]}>{count}</Text>
          </View>
        </View>
        
        <View style={styles.sectionEvents}>
          {displayEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} isCompact={false} />
          ))}
        </View>
      </View>
    );
  };

  // Format date for card pill (e.g., "Fri.14 May 2026")
  const getCardFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const eventDate = new Date(dateStr);
      const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
      const day = eventDate.getDate();
      const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
      const year = eventDate.getFullYear();
      return `${weekday}.${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Get location string from event
  const getCardLocationString = (location) => {
    if (!location) return 'Location TBA';
    if (typeof location === 'object') {
      return location.name || location.address || 'Location TBA';
    }
    return location;
  };

  const EventCard = ({ event, index }) => {
    const animatedValue = new Animated.Value(0);
    const [attendeeCount, setAttendeeCount] = useState(0);

    // Fetch attendee count
    useEffect(() => {
      if (event?.id && user) {
        bookingService.getEventAttendees(event.id)
          .then(attendees => setAttendeeCount(attendees?.length || 0))
          .catch(() => setAttendeeCount(0));
      }
    }, [event?.id, user]);

    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const cardTransform = {
      opacity: 1,
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    const eventTime = event.startTime || event.time || '';

    return (
      <Animated.View style={cardTransform}>
        <TouchableOpacity
          style={styles.eventCard}
          onPress={() => navigation.navigate('EventDetail', { event })}
          activeOpacity={0.9}
        >
          {/* Event Image */}
          <View style={styles.eventImageContainer}>
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
              <View style={[styles.eventImagePlaceholder, { backgroundColor: colors.primary[200] }]}>
                <Feather name="image" size={24} color={colors.primary[400]} />
              </View>
            )}

            {/* Attendee count badge on image */}
            {attendeeCount > 0 && (
              <View style={styles.attendeeBadge}>
                <Feather name="users" size={12} color={Colors.text.primary} />
                <Text style={styles.attendeeBadgeText}>{attendeeCount}</Text>
              </View>
            )}
          </View>

          {/* Event Title */}
          <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>

          {/* Date, Time, Location pills */}
          <View style={styles.cardPillsContainer}>
            <View style={styles.cardPillRow}>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>{getCardFormattedDate(event.date)}</Text>
              </View>
              {eventTime ? (
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>{eventTime}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardPillRow}>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>{getCardLocationString(event.location)}</Text>
              </View>
              {attendeeCount > 0 && (
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>{attendeeCount} going</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return <TikitiLoader duration={1500} message="Loading events..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background.primary} />
      
      {/* Header — matching Figma */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.text.secondary }]}>Discover</Text>
            <Text style={[styles.title, { color: colors.text.primary }]}>Events near you</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationCenter')}
          >
            <Feather name="bell" size={24} color={Colors.text.primary} />
            {unreadNotifications > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.primary[500] }]}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar — matching Figma */}
        <TouchableOpacity
          style={[
            styles.searchContainer,
            {
              borderColor: isSearchFocused ? colors.primary[500] : 'rgba(0,0,0,0.1)',
            },
          ]}
          activeOpacity={1}
          onPress={() => {
            searchInputRef.current?.focus();
          }}
        >
          <Feather name="search" size={24} color={isSearchFocused ? colors.primary[500] : 'rgba(0,0,0,0.56)'} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search events..,"
            placeholderTextColor="rgba(0,0,0,0.56)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            editable={true}
            pointerEvents="auto"
            selectTextOnFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Time Filter Pills */}
      <View style={styles.timeFilterSection}>
        <PillTabBar
          tabs={timeFilterOptions}
          activeTab={selectedTimeFilter}
          onTabPress={setSelectedTimeFilter}
        />
      </View>



      <ScrollView
        style={[styles.eventsList, { backgroundColor: colors.background.primary }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
            title="Pull to refresh events..."
            titleColor={colors.text.secondary}
          />
        }
      >
        {/* Time-based Event Sections */}
        {timeFilteredEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Feather name="calendar" size={24} color={Colors.text.tertiary} />
            <View style={styles.noEventsTextContainer}>
              <Text style={styles.noEventsText}>No events found</Text>
              <Text style={styles.noEventsSubtext}>
                {events.length === 0
                  ? 'No events available yet. Check back later'
                  : 'Try adjusting your search criteria'
                }
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={18} color={Colors.white} />
                  <Text style={styles.refreshButtonText}>Refresh Events</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Happening Now - Urgent Priority */}
            <TimeSection
              title="🔴 Happening Now"
              subtitle="Events currently in progress"
              icon="radio"
              count={timeBasedEvents.happeningNow.length}
              events={timeBasedEvents.happeningNow}
            />

            {/* Today's Events - High Priority */}
            <TimeSection
              title="Today"
              subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
              icon="calendar"
              count={timeBasedEvents.today.length}
              events={timeBasedEvents.today}
            />

            {/* Tomorrow's Events */}
            <TimeSection
              title="Tomorrow"
              subtitle={`${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
              icon="sunrise"
              count={timeBasedEvents.tomorrow.length}
              events={timeBasedEvents.tomorrow}
            />

            {/* This Weekend */}
            <TimeSection
              title="This Weekend"
              subtitle="Friday - Sunday events"
              icon="coffee"
              count={timeBasedEvents.thisWeekend.length}
              events={timeBasedEvents.thisWeekend}
            />

            {/* Next Week */}
            <TimeSection
              title="Next Week"
              subtitle="Plan ahead for next week"
              icon="clock"
              count={timeBasedEvents.nextWeek.length}
              events={timeBasedEvents.nextWeek}
            />

            {/* This Month */}
            <TimeSection
              title="This Month"
              subtitle={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} events`}
              icon="bookmark"
              count={timeBasedEvents.thisMonth.length}
              events={timeBasedEvents.thisMonth}
            />

            {/* Upcoming Events */}
            <TimeSection
              title="Upcoming"
              subtitle="Future events to look forward to"
              icon="arrow-right"
              count={timeBasedEvents.upcoming.length}
              events={timeBasedEvents.upcoming}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ─── Header (Figma 44:237) ──────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  greeting: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  title: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 24,
    color: Colors.text.primary,
  },
  notificationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },

  // ─── Search Bar (Figma) ─────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 17,
    height: 60,
    gap: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: 0,
  },

  // ─── Time Filter PillTabBar ─────────────────────────
  timeFilterSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  // ─── Events list ────────────────────────────────────
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // ─── Event Card (Figma — gray card with pills) ─────
  eventCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 14,
    paddingBottom: 15,
    marginBottom: 16,
  },
  eventImageContainer: {
    width: '100%',
    height: 161,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 17,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  attendeeBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
    color: Colors.text.primary,
  },
  eventName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 24,
    color: Colors.black,
    marginBottom: 17,
  },
  cardPillsContainer: {
    gap: 8,
  },
  cardPillRow: {
    flexDirection: 'row',
    gap: 7,
  },
  cardPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cardPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16,
    color: Colors.black,
  },

  // ─── Empty State (Figma) ────────────────────────────
  noEventsContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 62,
    paddingVertical: 64,
    alignItems: 'center',
    gap: 40,
  },
  noEventsTextContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  noEventsText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  noEventsSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060606',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 9,
    width: 167,
  },
  refreshButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },

  // ─── Loading ────────────────────────────────────────
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },

  // ─── Time-based Section ─────────────────────────────
  timeSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  eventCount: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  eventCountText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text.primary,
  },
  sectionEvents: {
    gap: 0,
  },
});

export default EventListScreen;