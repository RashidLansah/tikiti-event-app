import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  AppState,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EventListSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { eventService, bookingService } from '../../services/firestoreService';
import notificationService from '../../services/notificationService';
import logger from '../../utils/logger';

const PG = {
  paper: '#faf9f2',
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  muted: '#65675d',
  line: '#deded4',
};

const CATEGORIES = ['All', 'Conferences', 'Workshops', 'Meetups', 'Startups', 'Community'];

// ─── Helpers ────────────────────────────────────────────────────
const getLocationString = (location) => {
  if (!location) return 'Accra';
  if (typeof location === 'object') return location.name || location.address || 'Accra';
  return location;
};

const getDateShort = (dateStr) => {
  if (!dateStr) return '';
  try {
    // Handle "09 Sep 2026" format from scraped events
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  } catch { return dateStr; }
};

const getImageUri = (event) => {
  if (event.imageBase64) {
    return event.imageBase64.startsWith('data:')
      ? event.imageBase64
      : `data:image/jpeg;base64,${event.imageBase64}`;
  }
  if (event.imageUrl) return event.imageUrl;
  if (event.coverImage) return event.coverImage;
  return null;
};

const money = (price) => (!price || price === '0' ? 'Free' : `GH₵ ${price}`);

// ─── Event row (compact list item) ──────────────────────────────
const EventRow = ({ event, onPress, onSave, saved, going }) => {
  const imgUri = getImageUri(event);
  return (
  <View style={styles.eventRow}>
    <TouchableOpacity style={styles.eventRowMain} onPress={onPress} activeOpacity={0.8}>
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={styles.eventThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.eventThumb, { backgroundColor: PG.purple }]} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 }}>
          <Text style={styles.eventRowMeta} numberOfLines={1}>
            {getDateShort(event.date)} · {(event.category || '').toUpperCase()}
          </Text>
          {going && (
            <View style={[styles.externalBadge, { backgroundColor: '#e8f5ee' }]}>
              <Feather name="check" size={9} color="#1a8c4e" />
              <Text style={[styles.externalBadgeText, { color: '#1a8c4e' }]}>Going</Text>
            </View>
          )}
          {event.isOnline && (
            <View style={[styles.externalBadge, { backgroundColor: '#e8f5e9' }]}>
              <Feather name="wifi" size={9} color="#2e7d32" />
              <Text style={[styles.externalBadgeText, { color: '#2e7d32' }]}>Online</Text>
            </View>
          )}
          {event.isScraped && (
            <View style={styles.externalBadge}>
              <Feather name="external-link" size={9} color={PG.muted} />
              <Text style={styles.externalBadgeText}>External</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventRowName} numberOfLines={2}>{event.name}</Text>
        <Text style={styles.eventRowSub} numberOfLines={1}>
          {getLocationString(event.location)} · {money(event.price)}
        </Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.rowSave, saved && styles.rowSaveSaved]}
      onPress={onSave}
      activeOpacity={0.7}
    >
      <Feather name="heart" size={16} color={saved ? '#fff' : PG.muted} />
    </TouchableOpacity>
  </View>
  );
};

// ─── Main screen ────────────────────────────────────────────────
const EventListScreen = ({ navigation }) => {
  const { userProfile, user, updateUserProfile } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // External event registration flow
  const [externalSheet, setExternalSheet] = useState(null); // event object
  const [didYouRegisterSheet, setDidYouRegisterSheet] = useState(null); // event object
  const appStateRef = useRef(AppState.currentState);
  const pendingExternalRef = useRef(null);

  const city = userProfile?.city || userProfile?.organisationCountry || 'Accra';

  // ── Data loading ───────────────────────────────────────────────
  const loadEvents = async () => {
    try {
      let eventsData = [];
      if (userProfile?.organisationCountry) {
        eventsData = await eventService.getNearUser(userProfile.organisationCountry, 20);
      } else {
        const result = await eventService.getAll(20);
        eventsData = result.events || [];
      }
      setEvents(eventsData);
    } catch (error) {
      logger.error('Error loading events:', error);
      try {
        const result = await eventService.getAll(20);
        setEvents(result.events || []);
      } catch (e) {
        logger.error('Fallback failed:', e);
        setEvents([]);
      }
    }
  };

  const [registeredIds, setRegisteredIds] = useState([]);
  const loadRegistered = async () => {
    if (!user?.uid) return;
    try {
      const bookings = await bookingService.getUserBookings(user.uid);
      setRegisteredIds(bookings.filter((b) => b.status !== 'cancelled').map((b) => b.eventId));
    } catch {}
  };

  const loadUnread = async () => {
    if (!user?.uid) return;
    try {
      const count = await notificationService.getUnreadCount(user.uid);
      setUnreadNotifications(count);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEvents(), loadUnread(), loadRegistered()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadEvents(), loadUnread(), loadRegistered()]);
      setLoading(false);
    };
    init();
  }, [userProfile, user]);

  // Note: no realtime listener — scraped events need getAll(), use pull-to-refresh

  // AppState: when user returns from external browser, prompt "Did you register?"
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        if (pendingExternalRef.current) {
          setDidYouRegisterSheet(pendingExternalRef.current);
          pendingExternalRef.current = null;
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  const openExternalEvent = (event) => setExternalSheet(event);

  const confirmOpenExternal = async (event) => {
    setExternalSheet(null);
    if (!event.registrationUrl) return;
    pendingExternalRef.current = event;
    await Linking.openURL(event.registrationUrl);
  };

  const handleDidRegister = async (event, registered) => {
    setDidYouRegisterSheet(null);
    if (!registered || !user) return;
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        source: 'external',
        registrationUrl: event.registrationUrl,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });
      // Schedule a reminder notification
      try {
        await notificationService.scheduleEventReminder({
          ...event,
          id: event.id,
        });
      } catch (_) {}
    } catch (err) {
      logger.error('External booking save error:', err);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────
  const filtered = events.filter((e) => {
    const matchCat = category === 'All' || (e.category || '').toLowerCase() === category.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const featured = filtered[0] || null;
  const rest = filtered.slice(1, 4);

  // ── Save toggle ────────────────────────────────────────────────
  const saved = userProfile?.savedEvents || [];
  const toggleSave = async (id) => {
    if (!user) return;
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    try { await updateUserProfile({ savedEvents: next }); } catch (_) {}
  };

  if (loading) return <EventListSkeleton />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PG.paper} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PG.red}
            colors={[PG.red]}
          />
        }
      >
        {/* ── Top bar ─────────────────────────────────────── */}
        <View style={styles.topline}>
          <View>
            <Text style={styles.kicker}>EXPLORING IN</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Feather name="map-pin" size={13} color={PG.red} />
              <Text style={styles.locationText}>{city}</Text>
              <Feather name="chevron-down" size={13} color={PG.fg} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('NotificationCenter')}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color={PG.fg} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Headline ────────────────────────────────────── */}
        <Text style={styles.h1}>
          {'GO WHERE\n'}<Text style={styles.h1Em}>YOU GROW.</Text>
        </Text>

        {/* ── Search box ──────────────────────────────────── */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={PG.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Events, ideas, your kind of people"
            placeholderTextColor={PG.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClear}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category chips ───────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipSelected]}
              onPress={() => setCategory(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextSelected]}>
                {c === 'All' ? '✱︎ For you' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Empty state ──────────────────────────────────── */}
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Feather name="search" size={32} color={PG.line} />
            <Text style={styles.emptyTitle}>Nothing here just yet.</Text>
            <Text style={styles.emptySub}>
              {events.length === 0
                ? 'No events available yet. Pull to refresh.'
                : 'Try a different search or category.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => { setSearchQuery(''); setCategory('All'); }}
            >
              <Text style={styles.emptyButtonText}>Reset filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Featured event ───────────────────────────────── */}
        {featured && (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>WORTH SHOWING UP FOR</Text>
              <Text style={styles.sectionArrow}>↗</Text>
            </View>

            <TouchableOpacity
              style={styles.feature}
              onPress={() => (featured.isScraped || featured.registrationUrl) ? openExternalEvent(featured) : navigation.navigate('EventDetail', { event: featured })}
              activeOpacity={0.9}
            >
              {/* image */}
              {getImageUri(featured) ? (
                <Image
                  source={{ uri: getImageUri(featured) }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: PG.purple }]} />
              )}
              {/* gradient overlay */}
              <View style={styles.featureOverlay} />
              {/* save button */}
              <TouchableOpacity
                style={[styles.featureSave, saved.includes(featured.id) && styles.featureSaveSaved]}
                onPress={() => toggleSave(featured.id)}
                activeOpacity={0.8}
              >
                <Feather name="heart" size={18} color={saved.includes(featured.id) ? '#fff' : PG.muted} />
              </TouchableOpacity>
              {/* copy */}
              <View style={styles.featureCopy}>
                {registeredIds.includes(featured.id) && (
                  <View style={[styles.externalBadgeFeatured, { backgroundColor: '#e8f5ee', alignSelf: 'flex-start', marginBottom: 6, borderRadius: 20, paddingHorizontal: 9 }]}>
                    <Feather name="check" size={10} color="#1a8c4e" />
                    <Text style={[styles.externalBadgeFeaturedText, { color: '#1a8c4e', fontWeight: '700' }]}>Going</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View style={styles.badge2}>
                    <Text style={styles.badge2Text}>
                      {getDateShort(featured.date)} · {getLocationString(featured.location).toUpperCase()}
                    </Text>
                  </View>
                  {featured.isScraped && (
                    <View style={styles.externalBadgeFeatured}>
                      <Feather name="external-link" size={10} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.externalBadgeFeaturedText}>External</Text>
                    </View>
                  )}
                </View>
                {!getImageUri(featured) && (
                  <Text style={styles.featureTitle} numberOfLines={2}>{featured.name}</Text>
                )}
                <Text style={styles.featureSub}>
                  {money(featured.price) === 'Free' ? 'Free entry' : money(featured.price)}
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── More events ──────────────────────────────────── */}
        {rest.length > 0 && (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>A LITTLE MORE YOUR WAY</Text>
              <TouchableOpacity onPress={() => setCategory('All')} activeOpacity={0.7}>
                <Text style={styles.sectionSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {rest.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                onPress={() => (ev.isScraped || ev.registrationUrl) ? openExternalEvent(ev) : navigation.navigate('EventDetail', { event: ev })}
                onSave={() => toggleSave(ev.id)}
                saved={saved.includes(ev.id)}
                going={registeredIds.includes(ev.id)}
              />
            ))}
          </>
        )}

        {/* ── Community banner ─────────────────────────────── */}
        {filtered.length > 0 && (
          <TouchableOpacity
            style={styles.banner}
            onPress={() => setCategory('Community')}
            activeOpacity={0.85}
          >
            <Text style={styles.bannerText}>{'COME CURIOUS.\nLEAVE CONNECTED.'}</Text>
            <Feather name="arrow-up-right" size={22} color={PG.red} />
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── External event pre-navigation sheet ─── */}
      {!!externalSheet && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(32,34,32,0.45)' }]} activeOpacity={1} onPress={() => setExternalSheet(null)} />
          <View style={[styles.sheet, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetIcon}>
              <Feather name="external-link" size={22} color={PG.purple} />
            </View>
            <Text style={styles.sheetTitle}>{externalSheet?.name}</Text>
            <Text style={styles.sheetBody}>
              This event registers on an external site. We'll check back in to ask if you signed up — so we can save it and remind you.
            </Text>
            <TouchableOpacity style={styles.sheetPrimary} onPress={() => confirmOpenExternal(externalSheet)} activeOpacity={0.85}>
              <Text style={styles.sheetPrimaryText}>Open registration page</Text>
              <Feather name="arrow-right" size={16} color={PG.fg} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetSecondary} onPress={() => setExternalSheet(null)}>
              <Text style={styles.sheetSecondaryText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── "Did you register?" follow-up sheet ─── */}
      {!!didYouRegisterSheet && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(32,34,32,0.45)' }]} activeOpacity={1} onPress={() => setDidYouRegisterSheet(null)} />
          <View style={[styles.sheet, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetIcon}>
              <Feather name="check-circle" size={22} color={PG.purple} />
            </View>
            <Text style={styles.sheetTitle}>Did you register?</Text>
            <Text style={styles.sheetBody}>
              Did you sign up for {didYouRegisterSheet?.name}? We'll save it to your tickets and send you a reminder.
            </Text>
            <TouchableOpacity style={styles.sheetPrimary} onPress={() => handleDidRegister(didYouRegisterSheet, true)} activeOpacity={0.85}>
              <Text style={styles.sheetPrimaryText}>Yes, I registered</Text>
              <Feather name="check" size={16} color={PG.fg} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetSecondary} onPress={() => handleDidRegister(didYouRegisterSheet, false)}>
              <Text style={styles.sheetSecondaryText}>No, I didn't</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PG.paper,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 23,
    paddingBottom: 40,
  },

  // Top bar
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 4,
  },
  kicker: {
    fontSize: 12,
    color: PG.muted,
    marginBottom: 3,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationPin: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: PG.fg,
  },
  locationChevron: {
    fontSize: 14,
    color: PG.fg,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: PG.line,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PG.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Headline
  h1: {
    fontSize: 49,
    fontWeight: '800',
    lineHeight: 47,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    color: PG.fg,
    marginTop: 22,
    marginBottom: 0,
  },
  h1Em: {
    color: PG.red,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PG.line,
    borderRadius: 30,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    height: 49,
    gap: 9,
    marginTop: 19,
    marginBottom: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PG.fg,
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 20,
    color: PG.muted,
    paddingHorizontal: 4,
  },

  // Chips
  chipRow: {
    gap: 7,
    paddingVertical: 10,
    paddingBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: PG.line,
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: PG.fg,
    borderColor: PG.fg,
  },
  chipText: {
    fontSize: 13,
    color: PG.fg,
  },
  chipTextSelected: {
    color: '#fff',
  },

  // Section heading
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: PG.fg,
  },
  sectionArrow: {
    fontSize: 18,
    color: PG.red,
  },
  sectionSeeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: PG.red,
  },

  // Featured card
  feature: {
    position: 'relative',
    backgroundColor: PG.purple,
    borderRadius: 17,
    overflow: 'hidden',
    minHeight: 267,
    marginBottom: 4,
  },
  featureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 17,
  },
  featureSave: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#fff',
    width: 37,
    height: 37,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  featureSaveSaved: {
    backgroundColor: PG.red,
  },
  featureSaveHeart: {
    fontSize: 16,
    color: PG.fg,
  },
  featureCopy: {
    position: 'absolute',
    left: 20,
    bottom: 19,
    right: 20,
    zIndex: 1,
  },
  badge2: {
    backgroundColor: PG.yellow,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: PG.line,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  externalBadgeText: {
    fontSize: 10,
    color: PG.muted,
    fontWeight: '600',
  },
  externalBadgeFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
  },
  externalBadgeFeaturedText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  badge2Text: {
    fontSize: 11,
    fontWeight: '700',
    color: PG.fg,
  },
  featureTitle: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 35,
    color: '#fff',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  featureSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Event row
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: PG.line,
    gap: 13,
  },
  eventRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  eventThumb: {
    width: 78,
    height: 85,
    borderRadius: 9,
    flexShrink: 0,
  },
  eventRowMeta: {
    fontSize: 11,
    color: PG.red,
    fontWeight: '700',
  },
  eventRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: PG.fg,
    lineHeight: 20,
    marginVertical: 5,
  },
  eventRowSub: {
    fontSize: 12,
    color: PG.muted,
  },
  rowSave: {
    padding: 6,
  },
  rowSaveSaved: {
    // heart turns red when saved
  },
  rowSaveHeart: {
    fontSize: 20,
    color: PG.line,
  },

  // Banner
  banner: {
    backgroundColor: PG.yellow,
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
    color: PG.fg,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  bannerSymbol: {
    fontSize: 30,
    color: PG.red,
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    color: PG.purple,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PG.fg,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: PG.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    borderWidth: 1,
    borderColor: PG.line,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PG.fg,
  },

  // ── Bottom sheets ─────────────────────────────────────────────
  sheetBackdrop: {
    backgroundColor: 'rgba(32,34,32,0.4)',
  },
  sheet: {
    backgroundColor: PG.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PG.line,
    marginBottom: 20,
  },
  sheetIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ede9fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PG.fg,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sheetBody: {
    fontSize: 14,
    color: PG.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  sheetPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PG.yellow,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sheetPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: PG.fg,
  },
  sheetSecondary: {
    paddingVertical: 12,
  },
  sheetSecondaryText: {
    fontSize: 14,
    color: PG.muted,
    fontWeight: '500',
  },
});

export default EventListScreen;
