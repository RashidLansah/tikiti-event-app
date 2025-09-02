import React, { useState, useEffect } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/firestoreService';

const EventListScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load events and categories from Firestore
  const loadEvents = async () => {
    try {
      let eventsData = [];
      
      // If user has a country set, load events near them
      if (userProfile?.country) {
        console.log('📍 Loading events for user country:', userProfile.country);
        eventsData = await eventService.getNearUser(userProfile.country, 20);
      } else {
        // Fallback to all events if no country set
        console.log('📍 No user country set, loading all events');
        const result = await eventService.getAll(20);
        eventsData = result.events || [];
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to all events on error
      try {
        const result = await eventService.getAll(20);
        setEvents(result.events || []);
      } catch (fallbackError) {
        console.error('Error loading fallback events:', fallbackError);
        setEvents([]);
      }
    }
  };



  // Time filter options
  const timeFilterOptions = [
    { id: 'all', name: 'All', icon: 'calendar' },
    { id: 'live', name: 'Live Now', icon: 'radio' },
    { id: 'today', name: 'Today', icon: 'sun' },
    { id: 'tomorrow', name: 'Tomorrow', icon: 'sunrise' },
    { id: 'thisWeek', name: 'This Week', icon: 'calendar' },
    { id: 'thisMonth', name: 'This Month', icon: 'calendar' },
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
      setLoading(false);
    };
    loadData();
  }, []);

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
      const eventTime = new Date(`${event.date} ${event.startTime}`);
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

  // Get category color for modern tags
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Music': Colors.warning[500],
      'Technology': Colors.primary[500],
      'Art': Colors.error[500],
      'Food': Colors.success[500],
      'Entertainment': Colors.secondary[500],
      'Sports': Colors.primary[600],
      'Business': Colors.gray[600],
      'Education': Colors.primary[400],
      'Health': Colors.success[600],
      'Fashion': Colors.error[400],
    };
    
    return categoryColors[category] || Colors.primary[500];
  };

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

  const EventCard = ({ event, index, isCompact = false }) => {
    const animatedValue = new Animated.Value(0);
    
    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const cardTransform = {
      opacity: animatedValue,
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={cardTransform}>
        <TouchableOpacity
          style={[styles.eventCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
          onPress={() => navigation.navigate('EventDetail', { event })}
          activeOpacity={0.95}
        >
          {/* Compact Image Section */}
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
              <View style={[styles.eventImagePlaceholder, { backgroundColor: colors.background.tertiary }]}>
                <Feather name="image" size={20} color={colors.text.tertiary} />
              </View>
            )}
            
            {/* Modern category tag */}
            <View style={[styles.categoryTag, { backgroundColor: `${colors.background.primary}E6`, borderColor: colors.border.light }]}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(event.category) }]} />
              <Text style={[styles.categoryText, { color: colors.text.primary }]}>{event.category}</Text>
            </View>
          </View>
          
          {/* Content Section */}
          <View style={styles.eventContent}>
            <View style={styles.eventHeader}>
              <Text style={[styles.eventName, { color: colors.text.primary }]} numberOfLines={2}>{event.name}</Text>
              <Text style={[styles.eventPrice, { color: colors.success[500] }]}>{event.type === 'free' ? 'Free' : event.price}</Text>
            </View>
            
            {/* Compact event details */}
            <View style={styles.eventMeta}>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={12} color={colors.text.tertiary} />
                <Text style={[styles.metaText, { color: colors.text.tertiary }]}>{event.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={12} color={colors.text.tertiary} />
                <Text style={[styles.metaText, { color: colors.text.tertiary }]} numberOfLines={1}>
                  {typeof event.location === 'object' ? (event.location.name || event.location.address || 'Location TBA') : (event.location || 'Location TBA')}
                </Text>
              </View>
            </View>
            
            {/* Minimal description */}
            {event.description && (
              <Text style={[styles.eventDescription, { color: colors.text.secondary }]} numberOfLines={2}>
                {event.description}
              </Text>
            )}
            
            {/* Event stats */}
            <View style={[styles.eventStats, { backgroundColor: colors.background.tertiary }]}>
              <View style={styles.statItem}>
                <Feather name="users" size={12} color={colors.text.tertiary} />
                <Text style={[styles.statText, { color: colors.text.tertiary }]}>
                  {event.soldTickets || 0} attending
                </Text>
              </View>
              {event.type === 'paid' && event.price > 0 && (
                <View style={styles.statItem}>
                  <Feather name="dollar-sign" size={12} color={colors.text.tertiary} />
                  <Text style={[styles.statText, { color: colors.text.tertiary }]}>
                    ₵{event.price}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background.primary} />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <View style={styles.headerTop}>
          <View>
              <Text style={[styles.greeting, { color: colors.text.tertiary }]}>Discover</Text>
            <Text style={[styles.title, { color: colors.text.primary }]}>Events near you</Text>
            {userProfile?.country && (
              <View style={styles.locationIndicator}>
                <Feather name="map-pin" size={12} color={colors.primary[500]} />
                <Text style={[styles.locationText, { color: colors.primary[500] }]}>
                  Showing events in {userProfile.country}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.background.tertiary }]}>
            <Feather name="bell" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {/* Modern Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
          <Feather name="search" size={16} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search events..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Time Filter Pills */}
      <View style={[styles.timeFilterSection, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <FlatList
          data={timeFilterOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.timeFilterContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.timeFilterPill,
                { backgroundColor: colors.background.tertiary },
                selectedTimeFilter === item.id && { backgroundColor: colors.primary[500] }
              ]}
              onPress={() => setSelectedTimeFilter(item.id)}
              activeOpacity={0.7}
            >
              <Feather 
                name={item.icon} 
                size={14} 
                color={selectedTimeFilter === item.id ? colors.white : colors.text.secondary} 
              />
              <Text style={[
                styles.timeFilterPillText,
                { color: colors.text.secondary },
                selectedTimeFilter === item.id && { color: colors.white, fontWeight: Typography.fontWeight.semibold }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
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
          <View style={[styles.noEventsContainer, { backgroundColor: colors.background.secondary }]}>
            <Feather name="calendar" size={48} color={colors.text.tertiary} />
            <Text style={[styles.noEventsText, { color: colors.text.secondary }]}>No events found</Text>
            <Text style={[styles.noEventsSubtext, { color: colors.text.tertiary }]}>
              {events.length === 0 
                ? "No events available yet. Check back later!" 
                : "Try adjusting your search criteria"
              }
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.primary[500] }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color={colors.white} />
                  <Text style={[styles.refreshButtonText, { color: colors.white }]}>Refresh Events</Text>
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
    backgroundColor: Colors.gray[50],
  },
  
  // Modern Header Styles
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[5],
    paddingTop: 50,
    paddingBottom: Spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[5],
  },
  greeting: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
    gap: Spacing[1],
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary[500],
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modern Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.normal,
  },
  
  // Time Filter
  timeFilterSection: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeFilterContainer: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  timeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    borderWidth: 0,
  },
  timeFilterPillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },


  eventsList: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  eventsListContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
  },
  
  // Modern Event Card Styles
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing[4],
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  // Compact Image Container
  eventImageContainer: {
    height: 120,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modern Category Tag
  categoryTag: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // backgroundColor is set dynamically via getCategoryColor
  },
  categoryText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  
  // Compact Content Area
  eventContent: {
    padding: Spacing[4],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[2],
  },
  eventName: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginRight: Spacing[2],
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.lg,
  },
  eventPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
  },
  
  // Compact Meta Information
  eventMeta: {
    gap: Spacing[1],
    marginBottom: Spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  
  // Minimal Description
  eventDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    marginBottom: Spacing[2],
  },
  
  // Event Stats
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    marginTop: Spacing[1],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  // Modern Empty State
  noEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[16],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[8],
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  noEventsText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  noEventsSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing[6],
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    ...Shadows.sm,
  },
  refreshButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  
  // Loading State
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },

  // Time-based Section Styles
  timeSection: {
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[4],
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  eventCount: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
  },
  eventCountText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[600],
  },
  sectionEvents: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },

});

export default EventListScreen;