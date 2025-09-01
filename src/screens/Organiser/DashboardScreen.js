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
import { eventService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
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

  const EventCard = ({ event }) => (
    <TouchableOpacity 
      style={styles.eventCard}
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
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventDate}>
           {event.date ? new Date(event.date).toLocaleDateString('en-US', {
             month: 'short',
             day: 'numeric',
             year: 'numeric'
           }) : 'Date TBD'}
         </Text>
        </View>
                 <Text style={styles.eventLocation}>
                   {event.address || (typeof event.location === 'object' ? (event.location.name || event.location.address || 'Location TBA') : (event.location || 'Location TBA'))}
                 </Text>
        <View style={styles.eventStats}>
          {event.type === 'paid' && event.price > 0 ? (
            <>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{event.soldTickets || 0}/{event.totalTickets || 0}</Text>
                <Text style={styles.statLabel}>Tickets Sold</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>₵{(event.soldTickets || 0) * (event.price || 0)}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{event.soldTickets || 0}/{event.totalTickets || 0}</Text>
                <Text style={styles.statLabel}>Attendees</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>Free</Text>
                <Text style={styles.statLabel}>Event</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createButtonText}>+ Create Event</Text>
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
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Events Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first event to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('ScanTicket')}
      >
        <View style={styles.scanButtonContent}>
          <Feather name="camera" size={20} color="#FFFFFF" style={styles.scanButtonIcon} />
          <Text style={styles.scanButtonText}>Scan Tickets</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
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
    marginBottom: 16,
    fontWeight: '500',
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
  scanButton: {
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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