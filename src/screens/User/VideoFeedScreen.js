import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import EventMediaCard from '../../components/EventMediaCard';
import eventMediaService from '../../services/eventMediaService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_SECTIONS = [
  { key: 'all',  label: 'For You' },
  { key: 'live', label: 'Live Now' },
  { key: 'past', label: 'Moments' },
];

// ─── Grouping helper ──────────────────────────────────────────────────────────

function groupByEvent(posts) {
  const map = new Map();

  for (const post of posts) {
    const id = post.eventId;
    if (!id || post.mediaType !== 'photo') continue; // photos only

    if (!map.has(id)) {
      map.set(id, {
        eventId: id,
        eventName: post.eventName || '',
        eventDate: post.eventDate || '',
        eventCity: post.eventCity || '',
        eventCategory: post.eventCategory || '',
        eventStatus: post.eventStatus || 'upcoming',
        eventType: post.eventType || '',
        organizerId: post.organizerId || '',
        photos: [],
      });
    }

    map.get(id).photos.push(post);
  }

  return Array.from(map.values()).filter((g) => g.photos.length > 0);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_PHOTO_HEIGHT = Math.round(((SCREEN_WIDTH - 32) / 4) * 5); // 4:5 portrait

const SkeletonCard = ({ colors }) => (
  <View style={[styles.skeletonCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
    <View style={[styles.skeletonLine, { width: '70%', backgroundColor: colors.border.medium }]} />
    <View style={[styles.skeletonLine, { width: '45%', marginTop: Spacing[1], backgroundColor: colors.border.light }]} />
    <View style={[styles.skeletonPhoto, { height: SKELETON_PHOTO_HEIGHT, backgroundColor: colors.border.medium }]} />
  </View>
);

// ─── VideoFeedScreen ──────────────────────────────────────────────────────────

const VideoFeedScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState('all');
  const [eventGroups, setEventGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setLastDoc(null);
    try {
      const filters = { limitCount: 20 };
      if (activeSection === 'all') {
        filters.eventStatuses = ['past', 'live'];
      } else {
        filters.eventStatuses = [activeSection];
      }
      const { docs, lastDoc: last, hasMore: more } = await eventMediaService.getFeedVideos(filters);
      setEventGroups(groupByEvent(docs));
      setLastDoc(last);
      setHasMore(more);
    } catch (error) {
      console.error('Error loading feed:', error);
      setEventGroups([]);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  const loadMoreFeed = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const filters = { limitCount: 20, after: lastDoc };
      if (activeSection !== 'all') filters.eventStatuses = [activeSection];
      const { docs, lastDoc: last, hasMore: more } = await eventMediaService.getFeedVideos(filters);
      setEventGroups((prev) => groupByEvent([...prev.flatMap((g) => g.posts || [g]), ...docs]));
      setLastDoc(last);
      setHasMore(more);
    } catch (e) {
      console.error('loadMoreFeed error', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, activeSection]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // ── Navigation callbacks ──────────────────────────────────────────────────

  const handleEventPress = useCallback((event) => {
    navigation.navigate('Events', {
      screen: 'EventDetail',
      params: { event: { id: event.eventId } },
    });
  }, [navigation]);

  const handleOpenGallery = useCallback((photos, initialIndex, eventName) => {
    navigation.navigate('PhotoGallery', { photos, initialIndex, eventName });
  }, [navigation]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Section tabs ──────────────────────────────────────────────────── */}
      <View style={[styles.sectionBar, { paddingTop: insets.top + Spacing[2], backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionBarContent}
        >
          {FEED_SECTIONS.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <TouchableOpacity
                key={section.key}
                style={[
                  styles.sectionTab,
                  {
                    backgroundColor: isActive ? colors.primary[500] : colors.background.secondary,
                    borderColor: isActive ? 'transparent' : colors.border.medium,
                  },
                ]}
                onPress={() => setActiveSection(section.key)}
                activeOpacity={0.8}
              >
                {section.key === 'live' && isActive && (
                  <View style={styles.liveDot} />
                )}
                <Text
                  style={[
                    styles.sectionLabel,
                    {
                      fontFamily: isActive ? Typography.fontFamily.bold : Typography.fontFamily.medium,
                      color: isActive ? Colors.white : colors.text.secondary,
                    },
                  ]}
                >
                  {section.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Loading — skeleton cards ───────────────────────────────────────── */}
      {loading && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
        </ScrollView>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && eventGroups.length === 0 && (
        <View style={styles.centeredContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
            <Feather name="image" size={32} color={colors.text.tertiary} />
          </View>
          <Text style={[styles.emptyTitle, { fontFamily: Typography.fontFamily.bold, color: colors.text.primary }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily: Typography.fontFamily.regular, color: colors.text.tertiary }]}>
            {activeSection === 'live'
              ? 'No live events right now. Check back soon.'
              : 'Photos from events will appear here once attendees start sharing.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.border.medium }]}
            onPress={loadFeed}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={14} color={colors.text.secondary} />
            <Text style={[styles.retryText, { fontFamily: Typography.fontFamily.medium, color: colors.text.secondary }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Event photo cards ─────────────────────────────────────────────── */}
      {!loading && eventGroups.length > 0 && (
        <FlatList
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          data={eventGroups}
          keyExtractor={(item) => item.eventId}
          renderItem={({ item: group }) => (
            <EventMediaCard
              event={group}
              onEventPress={handleEventPress}
              onOpenGallery={handleOpenGallery}
            />
          )}
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#333" style={{ paddingVertical: 16 }} />
            ) : (
              <View style={styles.bottomSpacer} />
            )
          }
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sectionBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing[2],
  },
  sectionBarContent: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing[3],
  },
  bottomSpacer: {
    height: 100,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[8],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  retryText: {
    fontSize: Typography.fontSize.sm,
  },
  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonCard: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[2],
    overflow: 'hidden',
  },
  skeletonLine: {
    height: 14,
    borderRadius: BorderRadius.sm,
  },
  skeletonPhoto: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing[2],
  },
});

export default VideoFeedScreen;
