import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { bookingService, eventService } from '../../services/firestoreService';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from './RegistrationSuccessScreen';
import { paymentsApi } from '../../services/paymentsApi';

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#65675d',
  line: '#deded4',
};

const MyTicketsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('Upcoming');

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      try { await paymentsApi.reconcileTickets(); } catch (_) {}
      const raw = (await bookingService.getUserBookings(user.uid))
        .filter((b) => b.status !== 'cancelled' && b.paymentStatus !== 'pending' && b.status !== 'abandoned');
      const enhanced = await Promise.all(raw.map(async (b) => {
        let event = null;
        try { event = await eventService.getById(b.eventId); } catch (_) {}
        const isPast = new Date(b.eventDate) < new Date();
        return { ...b, event, isPast };
      }));
      setBookings(enhanced);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user]);

  const displayed = bookings.filter((b) => tab === 'Upcoming' ? !b.isPast : b.isPast);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={PG.bg} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {/* Topline */}
          <View style={styles.topline}>
            <Text style={styles.logo}>tikiti<Text style={styles.logoStar}>{'✳︎'}</Text></Text>
            <Feather name="credit-card" size={22} color={PG.fg} />
          </View>

          {/* Headline */}
          <Text style={styles.h1}>GOOD THINGS{'\n'}<Text style={styles.h1Em}>COMING UP.</Text></Text>
          <Text style={styles.sub}>Your next experiences, all in one place.</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            {['Upcoming', 'Past'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t}{t === 'Upcoming' ? ` (${bookings.filter(b => !b.isPast).length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={PG.red} style={{ marginTop: 40 }} />
          ) : displayed.length === 0 ? (
            <Empty tab={tab} />
          ) : (
            displayed.map((b) => <TicketCard key={b.id} booking={b} navigation={navigation} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

function TicketCard({ booking, navigation }) {
  const isExternal = booking.source === 'external';
  const qty = booking.quantity || 1;
  const refId = (booking.id || 'TKT').slice(-8).toUpperCase();
  const category = (booking.event?.category || booking.eventCategory || 'Event').toUpperCase();
  const eventName = booking.eventName || booking.event?.name || 'Event';

  if (isExternal) {
    return (
      <View style={styles.ticketCard}>
        {/* External event — grey-toned header */}
        <View style={[styles.ticketTop, { backgroundColor: PG.fg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Feather name="external-link" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.ticketCategory}>EXTERNAL EVENT / {category}</Text>
          </View>
          <Text style={styles.ticketName}>{eventName}</Text>
          <Text style={styles.ticketVenue}>{booking.eventLocation || 'See event site for details'}</Text>
        </View>

        {/* Middle */}
        <View style={styles.ticketMiddle}>
          <View>
            <Text style={styles.ticketFieldLabel}>DATE</Text>
            <Text style={styles.ticketFieldValue}>{booking.eventDate || 'Date TBA'}</Text>
          </View>
          <View>
            <Text style={styles.ticketFieldLabel}>STATUS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.ticketFieldValue, { color: '#1a8c4e' }]}>Registered</Text>
              <Feather name="check" size={14} color="#1a8c4e" />
            </View>
          </View>
        </View>

        {/* Bottom note */}
        <View style={styles.ticketBottom}>
          <Barcode width={180} height={50} opacity={0.3} />
          <Text style={styles.ticketRef}>{refId}{'\n'}<Text style={styles.ticketRefSub}>You registered on the event&apos;s own site</Text></Text>
        </View>

        <TouchableOpacity
          style={styles.viewEvent}
          onPress={() => booking.registrationUrl && Linking.openURL(booking.registrationUrl)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewEventText}>Open registration page</Text>
          <Feather name="external-link" size={14} color={PG.red} />
        </TouchableOpacity>
      </View>
    );
  }

  const venue = booking.event?.location || booking.eventLocation || 'Accra · Venue to be announced';
  const attendee = booking.userName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.userEmail || '';
  const qrPayload = JSON.stringify({
    ticketId: booking.qrCode || `TKT${refId}`,
    eventId: booking.eventId,
    eventName,
    userId: booking.userId,
    userName: attendee,
    purchaseId: booking.id,
    quantity: qty,
    status: 'confirmed',
  });

  return (
    <TouchableOpacity
      style={styles.ticketCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { event: booking.event || { id: booking.eventId } } })}
    >
      <View style={styles.ticketTop}>
        <Text style={styles.ticketCategory}>TIKITI / {category}</Text>
        <Text style={styles.ticketName}>{eventName}</Text>
        <Text style={styles.ticketVenue}>{venue}</Text>
      </View>

      <View style={styles.ticketMiddle}>
        <View>
          <Text style={styles.ticketFieldLabel}>DATE</Text>
          <Text style={styles.ticketFieldValue}>{booking.eventDate || 'Date TBA'}</Text>
        </View>
        {!!attendee && (
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.ticketFieldLabel}>ATTENDEE</Text>
            <Text style={styles.ticketFieldValue} numberOfLines={1}>{attendee}</Text>
          </View>
        )}
        <View>
          <Text style={styles.ticketFieldLabel}>ADMISSION</Text>
          <Text style={styles.ticketFieldValue}>{qty} {qty === 1 ? 'person' : 'people'}</Text>
        </View>
      </View>

      <View style={styles.ticketBottom}>
        <View style={styles.qrWrap}>
          <QRCode value={qrPayload} size={150} color={PG.fg} backgroundColor="#fff" />
        </View>
        <Text style={styles.ticketRef}>{refId}{'\n'}<Text style={styles.ticketRefSub}>Scan at the door</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

function Empty({ tab }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>
        {tab === 'Upcoming' ? 'Your next story is waiting.' : 'The memories start here.'}
      </Text>
      <Text style={styles.emptyText}>
        {tab === 'Upcoming'
          ? 'Find an event you love and register. Your ticket will appear here.'
          : 'Your past events will appear here after you attend.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PG.bg },
  safe: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 40 },

  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  logo: { fontSize: 28, fontWeight: '700', color: PG.fg, letterSpacing: -1 },
  logoStar: { color: PG.red },

  h1: { fontSize: 40, fontWeight: '900', color: PG.fg, letterSpacing: -1.5, lineHeight: 38, marginTop: 4 },
  h1Em: { color: PG.red },
  sub: { fontSize: 14, color: PG.muted, lineHeight: 22, marginTop: 10, marginBottom: 4 },

  tabs: { flexDirection: 'row', borderBottom: 1, borderBottomColor: PG.line, marginTop: 22, marginBottom: 4, gap: 0 },
  tab: { paddingBottom: 12, paddingRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: PG.fg },
  tabText: { fontSize: 14, color: PG.muted, fontWeight: '500' },
  tabTextActive: { color: PG.fg, fontWeight: '700' },

  ticketCard: {
    borderRadius: 19,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: PG.line,
    marginTop: 24,
    overflow: 'hidden',
  },
  // Purple header
  ticketTop: { padding: 22, backgroundColor: PG.purple },
  ticketCategory: { fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  ticketName: { fontSize: 32, fontWeight: '700', color: '#fff', lineHeight: 32, marginVertical: 12, letterSpacing: -0.5 },
  ticketVenue: { fontSize: 13, color: '#fff' },

  // Middle
  ticketMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#b6b6ad',
    borderStyle: 'dashed',
  },
  ticketFieldLabel: { fontSize: 11, color: PG.muted, letterSpacing: 0.5, marginBottom: 5 },
  ticketFieldValue: { fontSize: 14, fontWeight: '700', color: PG.fg },

  // Bottom
  ticketBottom: { padding: 19, alignItems: 'center' },
  qrWrap: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PG.line },
  ticketRef: { fontSize: 12, color: PG.muted, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  ticketRefSub: { fontSize: 12, color: PG.muted },

  viewEvent: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: PG.line, paddingHorizontal: 18, paddingVertical: 12 },
  viewEventText: { fontSize: 13, color: PG.red, fontWeight: '600' },

  empty: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: PG.fg, textAlign: 'center', marginBottom: 10 },
  emptyText: { fontSize: 14, color: PG.muted, textAlign: 'center', lineHeight: 22 },
});

export default MyTicketsScreen;
