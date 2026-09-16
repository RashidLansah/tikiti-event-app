import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#65675d',
  line: '#deded4',
};

const { width: SCREEN_W } = Dimensions.get('window');
const TABS = [
  { name: 'Events', icon: 'compass', label: 'Discover' },
  { name: 'Saved', icon: 'heart', label: 'Saved' },
  { name: 'My Tickets', icon: 'credit-card', label: 'Tickets' },
  { name: 'Profile', icon: 'user', label: 'You' },
];

const RegistrationSuccessScreen = ({ navigation, route }) => {
  const { event, booking, isFree, ticketCount = 1 } = route.params || {};
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState('issuing'); // issuing | flying | done
  const [statusText, setStatusText] = useState('Getting your ticket ready…');
  const [ghost, setGhost] = useState(null); // { x, y, w, h, dx, dy }

  const ticketRef = useRef(null);
  const tabIconRef = useRef(null);

  const slideY = useRef(new Animated.Value(-260)).current;
  const ticketOpacity = useRef(new Animated.Value(1)).current;
  const flight = useRef(new Animated.Value(0)).current;
  const tabPulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  const timer = useRef(null);

  const play = () => {
    clearTimeout(timer.current);
    setGhost(null);
    setPhase('issuing');
    setStatusText('Getting your ticket ready…');
    slideY.setValue(-260);
    ticketOpacity.setValue(1);
    flight.setValue(0);
    Animated.timing(slideY, {
      toValue: 0,
      duration: 800,
      easing: Easing.bezier(0.22, 0.8, 0.28, 1),
      delay: 300,
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(startFlight, 1950 + 300);
  };

  useEffect(() => {
    play();
    return () => clearTimeout(timer.current);
  }, []);

  const startFlight = () => {
    const ticket = ticketRef.current;
    const target = tabIconRef.current;
    if (!ticket || !target) return arrive();

    ticket.measureInWindow((x, y, w, h) => {
      target.measureInWindow((tx, ty, tw, th) => {
        const dx = tx + tw / 2 - (x + w / 2);
        const dy = ty + th / 2 - (y + h / 2);
        setGhost({ x, y, w, h, dx, dy });
        setPhase('flying');
        setStatusText('Off to your Tickets…');
        ticketOpacity.setValue(0);
        Animated.timing(flight, {
          toValue: 1,
          duration: 950,
          easing: Easing.bezier(0.45, 0, 0.25, 1),
          useNativeDriver: true,
        }).start(arrive);
      });
    });
  };

  const arrive = () => {
    setGhost(null);
    setPhase('done');
    setStatusText('Your ticket is in the Tickets tab below.');
    tabPulse.setValue(0);
    ring.setValue(0);
    Animated.parallel([
      Animated.timing(tabPulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  const goToTab = (name) => {
    const index = TABS.findIndex((t) => t.name === name);
    navigation.reset({
      index: 0,
      routes: [{ name: 'UserFlow', state: { routes: TABS.map((t) => ({ name: t.name })), index } }],
    });
  };

  const refId = (booking?.id || Date.now().toString()).slice(-8).toUpperCase();
  const qty = booking?.quantity || 1;
  const total = booking?.totalPrice;
  const eventName = event?.name || event?.title || 'Event';
  const eventDate = event?.dateShort || event?.date || 'Date TBA';
  const qrPayload = JSON.stringify({
    ticketId: booking?.qrCode || `TKT${refId}`,
    eventId: event?.id,
    eventName,
    userId: booking?.userId,
    userName: booking?.userName || '',
    purchaseId: booking?.id,
    quantity: qty,
    status: 'confirmed',
  });

  const ticketBody = (
    <>
      <View style={styles.ticketHeading}>
        <Text style={styles.ticketLogo}>tikiti<Text style={{ color: PG.red }}>✳︎</Text></Text>
        <View style={styles.labelTag}>
          <Text style={styles.labelTagText}>{isFree ? 'FREE ENTRY' : 'PAID'}</Text>
        </View>
      </View>
      <Text style={styles.ticketEventName} numberOfLines={2}>{eventName}</Text>
      <Text style={styles.ticketMeta}>{eventDate} · ACCRA</Text>
      <View style={styles.receiptDivider} />
      <View style={styles.receiptMeta}>
        <Text style={styles.receiptMetaText}>{qty} {qty === 1 ? 'TICKET' : 'TICKETS'}</Text>
        <Text style={styles.receiptMetaAmount}>{total ? `₵${total}` : 'Free'}</Text>
      </View>
      <View style={styles.qrWrap}>
        <QRCode value={qrPayload} size={88} color={PG.fg} backgroundColor="#fff" />
      </View>
      <Text style={styles.ticketFine}>Ref: {refId} · Scan at the door</Text>
    </>
  );

  const ghostStyle = ghost && {
    position: 'absolute',
    left: ghost.x,
    top: ghost.y,
    width: ghost.w,
    height: ghost.h,
    opacity: flight.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1, 0.1] }),
    transform: [
      { translateX: flight.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, ghost.dx * 0.2, ghost.dx] }) },
      { translateY: flight.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, ghost.dy * 0.18 - 35, ghost.dy] }) },
      { rotate: flight.interpolate({ inputRange: [0, 0.35, 1], outputRange: ['0deg', '-10deg', '10deg'] }) },
      { scale: flight.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0.88, 0.08] }) },
    ],
  };

  const pulseStyle = {
    transform: [
      { scale: tabPulse.interpolate({ inputRange: [0, 0.35, 0.65, 1], outputRange: [1, 1.5, 0.95, 1] }) },
      { rotate: tabPulse.interpolate({ inputRange: [0, 0.35, 0.65, 1], outputRange: ['0deg', '-9deg', '5deg', '0deg'] }) },
    ],
  };
  const ringStyle = {
    opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.9] }) }],
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={PG.bg} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.successMark}>
            <Feather name="check" size={22} color="#fff" />
          </View>

          <Text style={styles.eyebrow}>
            {isFree ? 'FREE REGISTRATION CONFIRMED' : 'PAYMENT CONFIRMED'}
          </Text>

          <Text style={styles.h1}>
            ONE GOOD PLAN.{'\n'}<Text style={styles.h1Em}>ONE HAPPY TICKET.</Text>
          </Text>

          <Text style={styles.statusText}>{statusText}</Text>

          <View style={styles.dispenser}>
            <View style={styles.slot} />
            <View style={[styles.receiptWindow, phase === 'done' && { opacity: 0 }]}>
              <Animated.View
                ref={ticketRef}
                collapsable={false}
                style={[styles.deliveryTicket, { opacity: ticketOpacity, transform: [{ translateY: slideY }] }]}
              >
                {ticketBody}
              </Animated.View>
            </View>

            {phase === 'done' && (
              <View style={styles.deliveryDone}>
                <Feather name="credit-card" size={44} color={PG.purple} />
                <Text style={styles.doneBig}>Safe in your Tickets.</Text>
                <Text style={styles.doneSub}>Ready whenever you are.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.primary, phase !== 'done' && { opacity: 0.6 }]}
            onPress={() => goToTab('My Tickets')}
            disabled={phase !== 'done'}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>
              {phase === 'done' ? 'View my tickets' : 'Putting it in Tickets…'}
            </Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
            <TouchableOpacity style={styles.textBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.textBtnText}>Back to event ↗</Text>
            </TouchableOpacity>
            {phase === 'done' && (
              <TouchableOpacity style={styles.textBtn} onPress={play} activeOpacity={0.7}>
                <Text style={styles.textBtnText}>Replay the ticket moment ↻</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Tab bar — the flight target */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(({ name, icon, label }) => {
          const isTickets = name === 'My Tickets';
          return (
            <TouchableOpacity key={name} style={styles.tabItem} onPress={() => goToTab(name)} activeOpacity={0.7}>
              <View style={styles.tabInner}>
                <Animated.View
                  ref={isTickets ? tabIconRef : null}
                  collapsable={false}
                  style={[styles.tabIcon, isTickets && phase === 'done' && pulseStyle]}
                >
                  {isTickets && phase === 'done' && <Animated.View style={[styles.arrivalRing, ringStyle]} />}
                  <Feather name={icon} size={22} color={isTickets ? PG.red : PG.muted} />
                  {isTickets && (phase === 'done' ? ticketCount : ticketCount - 1) > 0 && (
                    <View style={styles.ticketCount}>
                      <Text style={styles.ticketCountText}>
                        {phase === 'done' ? ticketCount : ticketCount - 1}
                      </Text>
                    </View>
                  )}
                </Animated.View>
                <Text style={[styles.tabLabel, isTickets && styles.tabLabelActive]}>{label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {ghost && (
        <Animated.View pointerEvents="none" style={[styles.deliveryTicket, ghostStyle]}>
          {ticketBody}
        </Animated.View>
      )}
    </View>
  );
};

// Mirrors the CSS repeating-linear-gradient barcode: 2 on 3 off, 4 on 2 off, 1 on 5 off
export function Barcode({ height = 50, width = '100%', opacity = 1, color = PG.fg, style }) {
  const bars = [];
  for (let i = 0; i < 20; i++) {
    bars.push(<View key={`a${i}`} style={{ width: 2, height, backgroundColor: color, marginRight: 3 }} />);
    bars.push(<View key={`b${i}`} style={{ width: 4, height, backgroundColor: color, marginRight: 2 }} />);
    bars.push(<View key={`c${i}`} style={{ width: 1, height, backgroundColor: color, marginRight: 5 }} />);
  }
  return (
    <View style={[{ width, height, flexDirection: 'row', overflow: 'hidden', opacity, alignSelf: 'center' }, style]}>
      {bars}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PG.bg },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 12, alignItems: 'center' },

  successMark: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: PG.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700', color: PG.muted, marginBottom: 14, textAlign: 'center' },
  h1: { fontSize: 36, fontWeight: '900', color: PG.fg, letterSpacing: -1.2, lineHeight: 35, textAlign: 'center', marginBottom: 10 },
  h1Em: { color: PG.red },
  statusText: { fontSize: 13, color: PG.muted, marginBottom: 12, minHeight: 21, textAlign: 'center' },

  dispenser: { width: '100%', maxWidth: 298, minHeight: 260, alignItems: 'center' },
  slot: {
    height: 12, backgroundColor: PG.fg, borderRadius: 12, alignSelf: 'stretch', zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 0, elevation: 4,
  },
  receiptWindow: { overflow: 'hidden', alignSelf: 'stretch', paddingHorizontal: 12, paddingTop: 5, paddingBottom: 12 },
  deliveryTicket: {
    backgroundColor: PG.bg, borderWidth: 1, borderColor: 'rgba(32,34,32,0.15)',
    borderRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, minHeight: 230,
    shadowColor: PG.fg, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18, elevation: 8,
  },
  ticketHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketLogo: { fontSize: 27, fontWeight: '700', letterSpacing: -2, color: PG.fg },
  labelTag: { borderWidth: 1, borderColor: PG.line, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  labelTagText: { fontSize: 9, letterSpacing: 0.3, fontWeight: '700', color: PG.muted },
  ticketEventName: { fontSize: 29, fontWeight: '700', color: PG.fg, lineHeight: 29, marginTop: 14, marginBottom: 8 },
  ticketMeta: { fontSize: 11, color: PG.muted, marginBottom: 12 },
  receiptDivider: { borderTopWidth: 1, borderTopColor: '#b5b5a7', borderStyle: 'dashed', marginHorizontal: -18, marginVertical: 10 },
  receiptMeta: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  receiptMetaText: { fontSize: 11, fontWeight: '600', color: PG.muted },
  receiptMetaAmount: { fontSize: 11, fontWeight: '700', color: PG.fg },
  qrWrap: { alignSelf: 'center', padding: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: PG.line },
  ticketFine: { fontSize: 10, color: PG.muted, textAlign: 'center', marginTop: 9 },

  deliveryDone: { position: 'absolute', top: 40, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 25 },
  doneBig: { fontSize: 30, fontWeight: '800', color: PG.fg, textAlign: 'center', letterSpacing: -0.5 },
  doneSub: { fontSize: 14, color: PG.muted },

  bottom: { paddingHorizontal: 22, paddingBottom: 8, paddingTop: 8, gap: 4 },
  primary: {
    backgroundColor: PG.red, height: 54, borderRadius: 40, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  textBtn: { alignItems: 'center', paddingVertical: 10 },
  textBtnText: { fontSize: 12, color: PG.muted },

  tabBar: {
    flexDirection: 'row', backgroundColor: 'rgba(250,249,242,0.96)',
    borderTopWidth: 1, borderTopColor: PG.line, paddingTop: 11, paddingHorizontal: 5,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 5 },
  tabIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, color: PG.muted, marginTop: 2 },
  tabLabelActive: { color: PG.red, fontWeight: '700' },
  ticketCount: {
    position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: PG.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  ticketCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  arrivalRing: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: PG.red },
});

export default RegistrationSuccessScreen;
