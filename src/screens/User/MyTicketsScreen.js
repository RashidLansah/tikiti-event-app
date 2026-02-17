import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import PillTabBar from '../../components/PillTabBar';
import { MyEventsSkeleton } from '../../components/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { bookingService, eventService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

const MyTicketsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('active');

  // Filter options (PillTabBar format)
  const filterOptions = [
    { key: 'active', label: 'Upcoming', icon: 'calendar' },
    { key: 'attended', label: 'Past', icon: 'check-circle' },
    { key: 'all', label: 'All', icon: 'list' },
  ];

  const loadRegisteredEvents = async () => {
    if (!user) return;

    try {
      const userBookings = await bookingService.getUserBookings(user.uid);

      // Enhance bookings with computed status and fetch event details
      const enhancedBookings = await Promise.all(
        userBookings.map(async (booking) => {
          const eventDate = new Date(booking.eventDate);
          const now = new Date();

          // Try to fetch full event data for image and other details
          let fullEvent = null;
          try {
            fullEvent = await eventService.getById(booking.eventId);
          } catch (err) {
            // Silently fail — we'll use booking data as fallback
          }

          return {
            ...booking,
            fullEvent,
            isActive: booking.status === 'confirmed' && eventDate >= now,
            isAttended:
              (booking.status === 'used' || booking.status === 'confirmed') &&
              eventDate < now,
            isCancelled: booking.status === 'cancelled',
          };
        })
      );

      setAllBookings(enhancedBookings);
      applyFilter(activeFilter, enhancedBookings);
    } catch (error) {
      console.error('Error loading registered events:', error);
      Alert.alert('Error', 'Failed to load your registered events');
    }
  };

  const applyFilter = (filter, bookingsToFilter = allBookings) => {
    let filtered = [];

    switch (filter) {
      case 'active':
        filtered = bookingsToFilter.filter((b) => b.isActive);
        break;
      case 'attended':
        filtered = bookingsToFilter.filter((b) => b.isAttended);
        break;
      case 'all':
        filtered = bookingsToFilter.filter((b) => !b.isCancelled);
        break;
      default:
        filtered = bookingsToFilter.filter((b) => b.isActive);
    }

    setRegisteredEvents(filtered);
    setActiveFilter(filter);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRegisteredEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadRegisteredEvents();
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Reapply filter when activeFilter changes
  useEffect(() => {
    if (allBookings.length > 0) {
      applyFilter(activeFilter, allBookings);
    }
  }, [activeFilter]);

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

  // Calculate days left until event
  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    try {
      const eventDate = new Date(dateStr);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const diffTime = eventDay - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Get location string
  const getLocationString = (location) => {
    if (!location) return 'Location TBA';
    if (typeof location === 'object') {
      return location.name || location.address || 'Location TBA';
    }
    return location;
  };

  // Get days left label
  const getDaysLeftLabel = (daysLeft) => {
    if (daysLeft === null) return '';
    if (daysLeft < 0) return 'Event passed';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days left`;
  };

  const RegisteredEventCard = ({ booking, index }) => {
    const animatedValue = new Animated.Value(0);
    const event = booking.fullEvent || {};
    const daysLeft = getDaysLeft(booking.eventDate);
    const daysLeftLabel = getDaysLeftLabel(daysLeft);

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

    const eventTime = booking.eventTime || event.startTime || event.time || '';
    const eventImage = event.imageBase64 || null;
    const eventLocation = booking.eventLocation || event.location || '';

    return (
      <Animated.View style={cardTransform}>
        <TouchableOpacity
          style={styles.eventCard}
          onPress={() => {
            // Navigate to event detail with the full event data
            const eventData = event.id
              ? event
              : {
                  id: booking.eventId,
                  name: booking.eventName,
                  date: booking.eventDate,
                  time: booking.eventTime,
                  location: booking.eventLocation,
                  ...event,
                };
            navigation.navigate('Events', {
              screen: 'EventDetail',
              params: { event: eventData },
            });
          }}
          activeOpacity={0.9}
        >
          {/* Event Image */}
          <View style={styles.eventImageContainer}>
            {eventImage ? (
              <Image
                source={{
                  uri: eventImage.startsWith('data:')
                    ? eventImage
                    : `data:image/jpeg;base64,${eventImage}`,
                }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.eventImagePlaceholder, { backgroundColor: colors.primary[200] }]}>
                <Feather name="image" size={24} color={colors.primary[400]} />
              </View>
            )}

            {/* Going badge */}
            <View style={styles.goingBadge}>
              <Text style={styles.goingBadgeText}>Going</Text>
            </View>

            {/* Days left badge */}
            {daysLeft !== null && daysLeft >= 0 && (
              <View style={styles.daysLeftBadge}>
                <Feather name="clock" size={12} color={Colors.text.primary} />
                <Text style={styles.daysLeftBadgeText}>{daysLeftLabel}</Text>
              </View>
            )}
          </View>

          {/* Event Title */}
          <Text style={styles.eventName} numberOfLines={2}>
            {booking.eventName}
          </Text>

          {/* Date, Time, Location pills */}
          <View style={styles.cardPillsContainer}>
            <View style={styles.cardPillRow}>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>
                  {getCardFormattedDate(booking.eventDate)}
                </Text>
              </View>
              {eventTime ? (
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>{eventTime}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardPillRow}>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>
                  {getLocationString(eventLocation)}
                </Text>
              </View>
              {booking.quantity > 1 && (
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>
                    {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="calendar" size={24} color={Colors.text.tertiary} />
      <View style={styles.emptyTextContainer}>
        <Text style={styles.emptyTitle}>
          {activeFilter === 'active'
            ? 'No upcoming events'
            : activeFilter === 'attended'
            ? 'No past events'
            : 'No registered events'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {activeFilter === 'active'
            ? "You haven't registered for any upcoming events yet. Discover events and RSVP!"
            : activeFilter === 'attended'
            ? "You haven't attended any events yet."
            : "You haven't registered for any events yet."}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Events')}
      >
        <Feather name="search" size={18} color={Colors.white} />
        <Text style={styles.browseButtonText}>Browse Events</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <MyEventsSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.primary}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text.secondary }]}>My</Text>
          <Text style={[styles.title, { color: colors.text.primary }]}>Registered Events</Text>
        </View>
      </View>

      {/* Filter PillTabBar */}
      <View style={styles.filterSection}>
        <PillTabBar
          tabs={filterOptions}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />
      </View>

      <ScrollView
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {registeredEvents.length === 0 ? (
          <EmptyState />
        ) : (
          registeredEvents.map((booking, index) => (
            <RegisteredEventCard key={booking.id} booking={booking} index={index} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Header ──────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
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

  // ─── Filter PillTabBar ───────────────────────────────
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  // ─── Events list ─────────────────────────────────────
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // ─── Event Card (Figma gray card with pills) ────────
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
    position: 'relative',
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
  goingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goingBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
    color: Colors.black,
  },
  daysLeftBadge: {
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
  daysLeftBadgeText: {
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

  // ─── Empty State ─────────────────────────────────────
  emptyContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 62,
    paddingVertical: 64,
    alignItems: 'center',
    gap: 40,
  },
  emptyTextContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  browseButton: {
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
  browseButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },

  // ─── Loading ─────────────────────────────────────────
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default MyTicketsScreen;
