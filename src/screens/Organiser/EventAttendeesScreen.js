import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import TikitiLoader from '../../components/TikitiLoader';
import pdfExportService from '../../services/pdfExportService';

const EventAttendeesScreen = ({ navigation, route }) => {
  console.log('🚀 EventAttendeesScreen component mounting...');
  console.log('📋 Route params:', route?.params);
  
  const { user } = useAuth();
  const { event } = route?.params || {};
  
  // Safety check for event
  if (!event) {
    console.error('❌ No event data provided to EventAttendeesScreen');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={64} color={Colors.error[500]} />
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorSubtitle}>Unable to load event data</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'rsvp', 'paid'

  console.log('🎯 EventAttendeesScreen loaded for event:', event?.name || 'Unknown Event');
  console.log('🆔 Event ID:', event?.id);

  const fetchAttendees = async () => {
    try {
      console.log('📊 Fetching attendees for event ID:', event.id);
      setError(null); // Clear any previous errors
      
      if (!event.id) {
        throw new Error('Event ID is missing');
      }
      
      if (!user) {
        console.log('⚠️ User not authenticated, skipping attendee fetch');
        setAttendees([]);
        return;
      }
      
      const eventAttendees = await bookingService.getEventAttendees(event.id);
      console.log('✅ Fetched attendees:', eventAttendees?.length || 0);
      console.log('📋 Sample attendee data:', eventAttendees?.[0] || 'No attendees');
      
      setAttendees(eventAttendees || []);
    } catch (error) {
      console.error('❌ Error fetching attendees:', error);
      setError(error.message || 'Failed to load attendees');
      setAttendees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendees();
    setRefreshing(false);
  };

  const handleExportAttendees = async () => {
    if (!attendees || attendees.length === 0) {
      Alert.alert('No Data', 'There are no attendees to export.');
      return;
    }

    setExporting(true);
    try {
      console.log('📄 Starting PDF export...');
      await pdfExportService.exportAndShareAttendees(attendees, event);
      console.log('✅ PDF export completed successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      Alert.alert(
        'Export Failed', 
        `Failed to export attendees: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleCallAttendee = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This attendee has not provided a phone number.');
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(err => {
      console.error('Error opening phone app:', err);
      Alert.alert('Error', 'Unable to open phone app. Please try calling manually.');
    });
  };

  const handleMessageAttendee = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This attendee has not provided a phone number.');
      return;
    }

    const messageUrl = `sms:${phoneNumber}`;
    Linking.openURL(messageUrl).catch(err => {
      console.error('Error opening message app:', err);
      Alert.alert('Error', 'Unable to open message app. Please try messaging manually.');
    });
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered for event ID:', event.id);
    if (event.id) {
      fetchAttendees();
    } else {
      console.error('❌ useEffect: No event ID available');
      setError('Event ID is missing');
      setLoading(false);
    }
  }, [event?.id, user]); // Safe navigation

  // Filter and search logic
  const getFilteredAttendees = () => {
    let filtered = attendees;

    // Apply registration type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(attendee => 
        attendee.registrationType === selectedFilter
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(attendee => {
        const fullName = `${attendee.firstName || ''} ${attendee.lastName || ''}`.toLowerCase();
        const userName = (attendee.userName || '').toLowerCase();
        const email = (attendee.userEmail || '').toLowerCase();
        const phone = (attendee.phoneNumber || '').toLowerCase();
        
        return fullName.includes(query) || 
               userName.includes(query) || 
               email.includes(query) || 
               phone.includes(query);
      });
    }

    return filtered;
  };

  const filteredAttendees = getFilteredAttendees();

  const renderAttendeeItem = ({ item }) => {
    try {
      return (
        <View style={styles.attendeeCard}>
          <View style={styles.attendeeAvatar}>
            <Text style={styles.attendeeInitial}>
              {(item?.firstName?.[0] || item?.userName?.[0] || 'A').toUpperCase()}
            </Text>
          </View>
          <View style={styles.attendeeInfo}>
            <Text style={styles.attendeeName}>
              {item?.firstName && item?.lastName 
                ? `${item.firstName} ${item.lastName}` 
                : (item?.userName || 'Unknown')
              }
            </Text>
            <Text style={styles.attendeeEmail}>{item?.userEmail || 'No email'}</Text>
            
            {/* Additional Info Row */}
            <View style={styles.additionalInfo}>
              {item?.phoneNumber && (
                <View style={styles.infoItem}>
                  <Feather name="phone" size={12} color={Colors.text.tertiary} />
                  <Text style={styles.infoText}>{item.phoneNumber}</Text>
                  <View style={styles.contactButtons}>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => handleCallAttendee(item.phoneNumber)}
                    >
                      <Feather name="phone" size={14} color={Colors.primary[500]} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => handleMessageAttendee(item.phoneNumber)}
                    >
                      <Feather name="message-circle" size={14} color={Colors.primary[500]} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {item?.gender && (
                <View style={styles.infoItem}>
                  <Feather name="user" size={12} color={Colors.text.tertiary} />
                  <Text style={styles.infoText}>{item.gender}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.attendeeDetails}>
              <View style={styles.attendeeTag}>
                <Feather 
                  name={item?.registrationType === 'rsvp' ? 'user-check' : 'credit-card'} 
                  size={12} 
                  color={item?.registrationType === 'rsvp' ? Colors.success[500] : Colors.primary[500]} 
                />
                <Text style={[
                  styles.attendeeTagText,
                  { color: item?.registrationType === 'rsvp' ? Colors.success[500] : Colors.primary[500] }
                ]}>
                  {item?.registrationType === 'rsvp' ? 'RSVP' : 'Paid'}
                </Text>
              </View>
              <Text style={styles.attendeeQuantity}>
                {item?.quantity || 1} ticket{(item?.quantity || 1) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.attendeeAmount}>
            <Text style={styles.amountText}>
              {(item?.totalPrice || 0) === 0 ? 'Free' : `₵${item?.totalPrice || 0}`}
            </Text>
            <Text style={styles.dateText}>
              {item?.createdAt?.toDate ? 
                item.createdAt.toDate().toLocaleDateString() + ' ' + 
                item.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                'Recent'
              }
            </Text>
          </View>
        </View>
      );
    } catch (renderError) {
      console.error('❌ Error rendering attendee item:', renderError);
      return (
        <View style={styles.attendeeCard}>
          <Text style={styles.errorText}>Error displaying attendee</Text>
        </View>
      );
    }
  };

  const renderEmptyState = (searchQuery, selectedFilter, totalAttendees) => {
    if (totalAttendees === 0) {
      // No attendees at all
      return (
        <View style={styles.emptyState}>
          <Feather name="users" size={64} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Attendees Yet</Text>
          <Text style={styles.emptySubtitle}>
            When people register or buy tickets for your event, they'll appear here.
          </Text>
        </View>
      );
    }

    if (searchQuery || selectedFilter !== 'all') {
      // No results for search/filter
      return (
        <View style={styles.emptyState}>
          <Feather name="search" size={64} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? `No attendees match "${searchQuery}". Try a different search term.`
              : `No ${selectedFilter === 'rsvp' ? 'RSVP' : 'paid'} attendees found.`
            }
          </Text>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <TikitiLoader duration={1500} message="Loading attendees..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Feather name="alert-triangle" size={64} color={Colors.error[500]} />
            <Text style={styles.errorTitle}>Error Loading Attendees</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setError(null);
                setLoading(true);
                fetchAttendees();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Event Attendees</Text>
          <Text style={styles.headerSubtitle}>
            {searchQuery || selectedFilter !== 'all' 
              ? `${filteredAttendees.length} of ${attendees.length} shown`
              : `${attendees.length} registered`
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExportAttendees}
          disabled={exporting || attendees.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <Feather name="file-text" size={20} color={Colors.primary[500]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{attendees.length}</Text>
          <Text style={styles.statLabel}>Total Attendees</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {attendees.filter(a => a.registrationType === 'rsvp').length}
          </Text>
          <Text style={styles.statLabel}>Free RSVPs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {attendees.filter(a => a.registrationType === 'purchase').length}
          </Text>
          <Text style={styles.statLabel}>Paid Tickets</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive
            ]}>
              All ({attendees.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'rsvp' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('rsvp')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'rsvp' && styles.filterButtonTextActive
            ]}>
              RSVPs ({attendees.filter(a => a.registrationType === 'rsvp').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'purchase' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('purchase')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'purchase' && styles.filterButtonTextActive
            ]}>
              Paid ({attendees.filter(a => a.registrationType === 'purchase').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendees List */}
      <FlatList
        data={filteredAttendees}
        renderItem={renderAttendeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => renderEmptyState(searchQuery, selectedFilter, attendees.length)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing[4],
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
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
  headerInfo: {
    flex: 1,
    marginLeft: Spacing[4],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  exportButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  listContainer: {
    paddingHorizontal: Spacing[5],
  },
  attendeeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  attendeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  attendeeInitial: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  attendeeEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  infoText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  attendeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  attendeeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    gap: Spacing[1],
  },
  attendeeTagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  attendeeQuantity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  attendeeAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing[1],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  errorContent: {
    alignItems: 'center',
    marginTop: Spacing[8],
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  backButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    padding: Spacing[4],
  },
  
  // Contact button styles
  contactButtons: {
    flexDirection: 'row',
    marginLeft: Spacing[2],
    gap: Spacing[1],
  },
  contactButton: {
    backgroundColor: Colors.primary[50],
    padding: Spacing[1],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  
  // Search and Filter styles
  searchFilterContainer: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing[3],
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: Spacing[1],
    marginLeft: Spacing[2],
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
    ...Shadows.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  clearFiltersButton: {
    marginTop: Spacing[4],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  clearFiltersText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default EventAttendeesScreen;
