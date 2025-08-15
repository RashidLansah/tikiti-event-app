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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { bookingService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

const MyTicketsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserTickets = async () => {
    if (!user) return;
    
    try {
      const userTickets = await bookingService.getUserBookings(user.uid);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load your tickets');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadUserTickets();
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return Colors.success[500];
      case 'cancelled':
        return Colors.error[500];
      default:
        return Colors.warning[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'clock';
    }
  };

  const TicketCard = ({ ticket }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
      onPress={() => navigation.navigate('Ticket', { 
        event: {
          id: ticket.eventId,
          name: ticket.eventName,
          date: ticket.eventDate,
          time: ticket.eventTime,
          location: ticket.eventLocation,
        },
        quantity: ticket.quantity,
        purchaseId: ticket.id,
        qrCode: ticket.qrCode || `TKT${ticket.id.slice(-8).toUpperCase()}`,
        status: ticket.status || 'confirmed'
      })}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventName, { color: colors.text.primary }]} numberOfLines={1}>
            {ticket.eventName}
          </Text>
          <Text style={[styles.eventDate, { color: colors.text.secondary }]}>
            {formatDate(ticket.eventDate)} • {ticket.eventTime}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status || 'confirmed') }]}>
          <Feather 
            name={getStatusIcon(ticket.status || 'confirmed')} 
            size={12} 
            color={colors.white} 
          />
        </View>
      </View>

      <View style={styles.ticketDetails}>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={colors.text.tertiary} />
          <Text style={[styles.locationText, { color: colors.text.secondary }]} numberOfLines={1}>
            {ticket.eventLocation}
          </Text>
        </View>
        
        <View style={styles.ticketInfo}>
          <View style={styles.quantityRow}>
            <Feather name="users" size={14} color={colors.text.tertiary} />
            <Text style={[styles.quantityText, { color: colors.text.secondary }]}>
              {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Feather name="dollar-sign" size={14} color={colors.text.tertiary} />
            <Text style={[styles.priceText, { color: colors.text.secondary }]}>
              {ticket.totalPrice > 0 ? `₵${ticket.totalPrice.toFixed(2)}` : 'Free'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.qrIndicator, { borderTopColor: colors.border.light }]}>
        <Feather name="smartphone" size={16} color={colors.primary[500]} />
        <Text style={[styles.qrText, { color: colors.primary[500] }]}>Tap to view QR code</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="credit-card" size={64} color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>No Tickets Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
        Tickets you purchase will appear here
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: colors.primary[500] }]}
        onPress={() => navigation.navigate('Events')}
      >
        <Feather name="calendar" size={18} color={colors.white} />
        <Text style={[styles.browseButtonText, { color: colors.white }]}>Browse Events</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your tickets...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>My Tickets</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {tickets.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
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
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
  },
  ticketsList: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
    padding: Spacing[4],
    ...Shadows.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  eventInfo: {
    flex: 1,
    marginRight: Spacing[3],
  },
  eventName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  eventDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  ticketDetails: {
    marginBottom: Spacing[3],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing[2],
    flex: 1,
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing[2],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing[2],
  },
  qrIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  qrText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
    marginLeft: Spacing[2],
    fontWeight: Typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[12],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing[8],
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
  },
  browseButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginLeft: Spacing[2],
  },
});

export default MyTicketsScreen;