import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
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
  { key: 'all',      label: 'For You' },
  { key: 'live',     label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Moments' },
];

// ─── Grouping helper ──────────────────────────────────────────────────────────

/**
 * Takes a flat array of eventMedia documents and returns an array of event
 * groups, each containing `photos` and `videos` sub-arrays.
 * Groups maintain the order in which their first item appears.
 */
function groupByEvent(posts) {
  const map = new Map();

  for (const post of posts) {
    const id = post.eventId;
    if (!id) continue;

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
        videos: [],
      });
    }

    const group = map.get(id);
    if (post.mediaType === 'photo') {
      group.photos.push(post);
    } else {
      group.videos.push(post);
    }
  }

  return Array.from(map.values());
}

// ─── Skeleton card placeholder ────────────────────────────────────────────────

const SkeletonCard = ({ colors }) => (
  <View style={[styles.skeletonCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
    <View style={[styles.skeletonLine, { width: '70%', backgroundColor: colors.border.medium }]} />
    <View style={[styles.skeletonLine, { width: '45%', marginTop: Spacing[1], backgroundColor: colors.border.light }]} />
    <View style={[styles.skeletonPhoto, { backgroundColor: colors.border.medium }]} />
    <View style={styles.skeletonFooterRow}>
      <View style={[styles.skeletonPill, { backgroundColor: colors.border.medium }]} />
      <View style={[styles.skeletonPill, { width: 90, backgroundColor: colors.border.medium }]} />
    </View>
  </View>
);

// ─── VideoFeedScreen ──────────────────────────────────────────────────────────

const VideoFeedScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState('all');
  const [eventGroups, setEventGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { limitCount: 40 };
      if (activeSection !== 'all') {
        filters.eventStatuses = [activeSection];
      }
      const posts = await eventMediaService.getFeedVideos(filters);
      const groups = groupByEvent(posts);
      setEventGroups(groups);
    } catch (error) {
      console.error('Error loading feed:', error);
      setEventGroups([]);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

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

  const handleWatchVideos = useCallback((eventId, videos) => {
    const group = eventGroups.find((g) => g.eventId === eventId);
    navigation.navigate('EventVideoFeed', {
      eventId,
      eventName: group?.eventName || '',
      videos,
    });
  }, [navigation, eventGroups]);

  const handleOpenGallery = useCallback((photos, initialIndex, eventName) => {
    navigation.navigate('PhotoGallery', { photos, initialIndex, eventName });
  }, [navigation]);

  // ── Render ────────────────────────────────────────────────────────────────

  const hasGroups = eventGroups.length > 0 && !loading;

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

      {/* ── Loading state — 3 skeleton cards ──────────────────────────────── */}
      {loading && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
        </ScrollView>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && eventGroups.length === 0 && (
        <View style={styles.centeredContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
            <Feather name="video-off" size={32} color={colors.text.tertiary} />
          </View>
          <Text style={[styles.emptyTitle, { fontFamily: Typography.fontFamily.bold, color: colors.text.primary }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily: Typography.fontFamily.regular, color: colors.text.tertiary }]}>
            {activeSection === 'live'
              ? 'No live events right now. Check back soon.'
              : 'Photos and videos from events will appear here.'}
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

      {/* ── Event group cards ─────────────────────────────────────────────── */}
      {!loading && eventGroups.length > 0 && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {eventGroups.map((group) => (
            <EventMediaCard
              key={group.eventId}
              event={group}
              onEventPress={handleEventPress}
              onWatchVideos={handleWatchVideos}
              onOpenGallery={handleOpenGallery}
            />
          ))}

          {/* Bottom spacer so last card clears the floating tab bar */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const PHOTO_HEIGHT = Math.round(((SCREEN_WIDTH - 32) / 4) * 3);

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
    height: 100, // clears the floating tab bar
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
    height: PHOTO_HEIGHT,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  skeletonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
    gap: Spacing[2],
  },
  skeletonPill: {
    height: 32,
    width: 110,
    borderRadius: BorderRadius.full,
  },
});

export default VideoFeedScreen;
