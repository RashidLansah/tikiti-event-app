import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import eventMediaService from '../../services/eventMediaService';
import notificationService from '../../services/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 2) / 3;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Featured' },
  { key: 'reported', label: 'Reported' },
  { key: 'hidden', label: 'Hidden' },
];

const OrgMomentsScreen = ({ navigation, route }) => {
  const { event } = route.params;

  const [allMedia, setAllMedia] = useState([]);
  const [stats, setStats] = useState({ posts: 0, views: 0, likes: 0, downloads: 0, reported: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const [posts, eventStats] = await Promise.all([
        eventMediaService.getOrganizerPosts(event.id),
        eventMediaService.getEventStats(event.id),
      ]);
      setAllMedia(posts);
      setStats(eventStats);
    } catch (e) {
      console.error('OrgMomentsScreen load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [event.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = allMedia.filter((item) => {
    if (activeFilter === 'featured') return item.featured && !item.hidden;
    if (activeFilter === 'reported') return item.reported;
    if (activeFilter === 'hidden') return item.hidden;
    return !item.hidden;
  });

  const handleFeature = async (item) => {
    setActionLoading(item.id);
    await eventMediaService.featurePost(item.id, !item.featured);
    setAllMedia((prev) =>
      prev.map((m) => m.id === item.id ? { ...m, featured: !item.featured, rankScore: !item.featured ? 200 : 5 } : m)
    );
    setActionLoading(null);
  };

  const handleShareAlbum = async () => {
    const url = `https://tikiti.com/events/${event.id}/moments`;
    try {
      await Share.share({
        message: `📸 Check out the moments from "${event.name}" on Tikiti: ${url}`,
        url,
        title: `${event.name} — Moments`,
      });
    } catch (e) {
      console.error('Share error', e);
    }
  };

  const handleSendNotification = () => {
    Alert.alert(
      'Send Moments Notification',
      `This will send a push notification to all attendees of "${event.name}" to check out the photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await notificationService.sendMomentsNotificationToAllAttendees(event.id, event.name);
              Alert.alert('Sent!', 'Notification sent to all attendees.');
            } catch (e) {
              Alert.alert('Error', 'Failed to send notification. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleHide = (item) => {
    Alert.alert(
      item.hidden ? 'Unhide post?' : 'Hide post?',
      item.hidden
        ? 'This will make the post visible to attendees again.'
        : 'This will remove the post from the attendee view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.hidden ? 'Unhide' : 'Hide',
          style: item.hidden ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(item.id);
            if (item.hidden) {
              await eventMediaService.unhidePost(item.id);
            } else {
              await eventMediaService.hidePost(item.id);
            }
            setAllMedia((prev) =>
              prev.map((m) => m.id === item.id ? { ...m, hidden: !item.hidden } : m)
            );
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const renderStatCard = (icon, value, label, color) => (
    <View style={styles.statCard}>
      <Feather name={icon} size={16} color={color || Colors.primary[500]} />
      <Text style={styles.statValue}>{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderCell = ({ item }) => {
    const isLoading = actionLoading === item.id;
    return (
      <View style={styles.cell}>
        <Image
          source={{ uri: item.thumbnailUrl || item.videoUrl }}
          style={[styles.cellImage, item.hidden && styles.hiddenImage]}
          resizeMode="cover"
        />

        {/* Overlay badges */}
        {item.featured && (
          <View style={[styles.badge, styles.featuredBadge]}>
            <Feather name="star" size={9} color="#fff" />
          </View>
        )}
        {item.reported && (
          <View style={[styles.badge, styles.reportedBadge]}>
            <Feather name="flag" size={9} color="#fff" />
          </View>
        )}
        {item.hidden && (
          <View style={styles.hiddenOverlay}>
            <Feather name="eye-off" size={14} color="#fff" />
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" style={{ flex: 1 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleFeature(item)}>
                <Feather name="star" size={13} color={item.featured ? '#FFD700' : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleHide(item)}>
                <Feather name={item.hidden ? 'eye' : 'eye-off'} size={13} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Like count */}
        {item.likes > 0 && (
          <View style={styles.likeOverlay}>
            <Feather name="heart" size={9} color="#fff" />
            <Text style={styles.likeCount}>{item.likes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="camera-off" size={40} color={Colors.secondary[500]} />
      <Text style={styles.emptyTitle}>
        {activeFilter === 'all' ? 'No moments yet' : `No ${activeFilter} posts`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'all'
          ? 'Attendees haven't shared any photos yet.'
          : `No posts match the "${activeFilter}" filter.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={Colors.primary[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>Moments</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{event.name}</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleSendNotification}>
          <Feather name="send" size={18} color={Colors.primary[700]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleShareAlbum}>
          <Feather name="share-2" size={18} color={Colors.primary[700]} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCell}
          numColumns={3}
          columnWrapperStyle={styles.row}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary[500]} />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : null}
          ListHeaderComponent={
            <>
              {/* Stats */}
              <View style={styles.statsRow}>
                {renderStatCard('camera', stats.posts, 'Posts')}
                {renderStatCard('eye', stats.views, 'Views')}
                {renderStatCard('heart', stats.likes, 'Likes', Colors.error[500])}
                {renderStatCard('download', stats.downloads, 'Saves')}
                {stats.reported > 0 && renderStatCard('flag', stats.reported, 'Reported', Colors.warning[500])}
              </View>

              {/* Filter pills */}
              <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
                    onPress={() => setActiveFilter(f.key)}
                  >
                    <Text style={[styles.filterPillText, activeFilter === f.key && styles.filterPillTextActive]}>
                      {f.label}
                      {f.key === 'reported' && stats.reported > 0 ? ` (${stats.reported})` : ''}
                      {f.key === 'all' ? ` (${allMedia.filter(m => !m.hidden).length})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary[300],
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerIconBtn: { padding: 6, marginLeft: 4 },
  headerTitles: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.primary[800],
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.secondary[600],
    marginTop: 1,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary[300],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary[100],
    borderRadius: 10,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.primary[800],
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.secondary[600],
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary[300],
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.secondary[200],
  },
  filterPillActive: { backgroundColor: Colors.primary[500] },
  filterPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.secondary[700],
  },
  filterPillTextActive: { color: '#fff' },
  row: { gap: 1 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: Colors.secondary[200],
    position: 'relative',
  },
  cellImage: { width: '100%', height: '100%' },
  hiddenImage: { opacity: 0.35 },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 5,
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: { left: 5, backgroundColor: 'rgba(0,0,0,0.55)' },
  reportedBadge: { left: 26, backgroundColor: Colors.error[500] },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5,
    paddingHorizontal: 6,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  likeOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  likeCount: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-SemiBold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyList: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.primary[800],
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.secondary[600],
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OrgMomentsScreen;
