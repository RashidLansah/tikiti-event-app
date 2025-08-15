import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { bookingService } from '../../services/firestoreService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const EventAttendeesScreen = ({ navigation, route }) => {
  const { event } = route.params;
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendees = async () => {
    try {
      const eventAttendees = await bookingService.getEventAttendees(event.id);
      setAttendees(eventAttendees);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendees();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAttendees();
  }, [event.id]);

  const renderAttendeeItem = ({ item }) => (
    <View style={styles.attendeeCard}>
      <View style={styles.attendeeAvatar}>
        <Text style={styles.attendeeInitial}>
          {item.userName?.[0]?.toUpperCase() || 'A'}
        </Text>
      </View>
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName}>{item.userName || 'Unknown'}</Text>
        <Text style={styles.attendeeEmail}>{item.userEmail}</Text>
        <View style={styles.attendeeDetails}>
          <View style={styles.attendeeTag}>
            <Feather 
              name={item.registrationType === 'rsvp' ? 'user-check' : 'credit-card'} 
              size={12} 
              color={item.registrationType === 'rsvp' ? Colors.success[500] : Colors.primary[500]} 
            />
            <Text style={[
              styles.attendeeTagText,
              { color: item.registrationType === 'rsvp' ? Colors.success[500] : Colors.primary[500] }
            ]}>
              {item.registrationType === 'rsvp' ? 'RSVP' : 'Paid'}
            </Text>
          </View>
          <Text style={styles.attendeeQuantity}>
            {item.quantity} ticket{item.quantity > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.attendeeAmount}>
        <Text style={styles.amountText}>
          {item.totalPrice === 0 ? 'Free' : `₵${item.totalPrice}`}
        </Text>
        <Text style={styles.dateText}>
          {item.createdAt?.toDate ? 
            item.createdAt.toDate().toLocaleDateString() : 
            'Recent'
          }
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={64} color={Colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Attendees Yet</Text>
      <Text style={styles.emptySubtitle}>
        When people register or buy tickets for your event, they'll appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading attendees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerSubtitle}>{attendees.length} registered</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Feather name="download" size={20} color={Colors.primary[500]} />
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

      {/* Attendees List */}
      <FlatList
        data={attendees}
        renderItem={renderAttendeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
          />
        }
      />
    </View>
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
});

export default EventAttendeesScreen;
