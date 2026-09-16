import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { eventService, userService } from '../../services/firestoreService';

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#65675d',
  line: '#deded4',
};

const SavedScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const savedIds = userProfile?.savedEvents || [];
      if (savedIds.length === 0) { setSavedEvents([]); setLoading(false); setRefreshing(false); return; }
      const events = await Promise.all(
        savedIds.map((id) => eventService.getById(id).catch(() => null))
      );
      setSavedEvents(events.filter(Boolean));
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user, userProfile?.savedEvents]);

  const unsave = async (eventId) => {
    setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      const current = userProfile?.savedEvents || [];
      await userService.updateProfile(user.uid, { savedEvents: current.filter((id) => id !== eventId) });
    } catch (_) {}
  };

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
            <Feather name="heart" size={22} color={PG.fg} />
          </View>

          {/* Headline */}
          <Text style={styles.h1}>FOR YOUR{'\n'}<Text style={styles.h1Em}>SOMEDAY. OR SATURDAY.</Text></Text>
          <Text style={styles.sub}>Good finds. Kept close.</Text>

          {/* Section heading */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>YOUR SHORTLIST</Text>
            <Text style={styles.sectionCount}>{savedEvents.length} saved</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={PG.red} style={{ marginTop: 40 }} />
          ) : savedEvents.length === 0 ? (
            <Empty />
          ) : (
            savedEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { event } })}
                onUnsave={() => unsave(event.id)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

function EventRow({ event, onPress, onUnsave }) {
  const photo = event.imageBase64
    ? (event.imageBase64.startsWith('data:') ? event.imageBase64 : `data:image/jpeg;base64,${event.imageBase64}`)
    : (event.imageUrl || event.coverImage || event.image);
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onPress} activeOpacity={0.8}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.rowThumb} />
        ) : (
          <View style={[styles.rowThumb, { backgroundColor: PG.line }]} />
        )}
        <View style={styles.rowInfo}>
          <Text style={styles.rowMeta}>
            {event.dateShort || event.date || 'Date TBA'} · {(event.category || 'Event').toUpperCase()}
          </Text>
          <Text style={styles.rowName} numberOfLines={2}>{event.name || event.title}</Text>
          <Text style={styles.rowSub}>Accra · {event.price && event.price !== '0' ? `₵${event.price}` : 'Free'}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rowHeart} onPress={onUnsave} activeOpacity={0.7}>
        <Feather name="heart" size={18} color={PG.red} />
      </TouchableOpacity>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Leave a little heart.</Text>
      <Text style={styles.emptyText}>Tap the heart on an event to keep it here for later.</Text>
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

  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: PG.line },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: PG.fg },
  sectionCount: { fontSize: 13, color: PG.muted },

  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: PG.line, paddingVertical: 14 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowThumb: { width: 68, height: 68, borderRadius: 10 },
  rowInfo: { flex: 1 },
  rowMeta: { fontSize: 11, color: PG.muted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  rowName: { fontSize: 15, fontWeight: '700', color: PG.fg, lineHeight: 20, marginBottom: 3 },
  rowSub: { fontSize: 13, color: PG.muted },
  rowHeart: { padding: 10 },

  empty: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: PG.fg, textAlign: 'center', marginBottom: 10 },
  emptyText: { fontSize: 14, color: PG.muted, textAlign: 'center', lineHeight: 22 },
});

export default SavedScreen;
