import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import VideoFeedItem from '../../components/VideoFeedItem';
import eventMediaService from '../../services/eventMediaService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEED_SECTIONS = [
  { key: 'all',      label: 'For You' },
  { key: 'live',     label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Moments' },
];

const VideoFeedScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState('all');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenFocused, setScreenFocused] = useState(false);

  const flatListRef = useRef(null);

  // Pause all videos when tab loses focus
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

  useEffect(() => {
    loadFeed();
  }, [activeSection]);

  const loadFeed = async () => {
    setLoading(true);
    setActiveIndex(0);
    try {
      const filters = { limitCount: 20 };
      if (activeSection !== 'all') {
        filters.eventStatuses = [activeSection];
      }
      const data = await eventMediaService.getFeedVideos(filters);
      setVideos(data);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || videos.length < 20) return;
    setLoadingMore(true);
    try {
      const filters = { limitCount: 10 };
      if (activeSection !== 'all') filters.eventStatuses = [activeSection];
      const more = await eventMediaService.getFeedVideos(filters);
      const existingIds = new Set(videos.map((v) => v.id));
      const fresh = more.filter((v) => !existingIds.has(v.id));
      if (fresh.length > 0) setVideos((prev) => [...prev, ...fresh]);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleEventPress = useCallback(() => {
    navigation.navigate('Events', { screen: 'EventList' });
  }, [navigation]);

  const handleReport = useCallback(() => {
    Alert.alert('Reported', 'Thanks for letting us know. We will review this video.');
  }, []);

  // When viewing video, the status bar should be light (white icons on dark video).
  // In loading/empty states respect the theme.
  const hasVideos = videos.length > 0 && !loading;

  return (
    <View style={[styles.root, { backgroundColor: hasVideos ? '#000' : colors.background.primary }]}>
      <StatusBar
        barStyle={hasVideos || isDarkMode ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Section tabs — float over video or sit in app background */}
      <View
        style={[
          styles.sectionBar,
          { top: insets.top + Spacing[2] },
        ]}
      >
        {FEED_SECTIONS.map((section) => {
          const isActive = activeSection === section.key;
          return (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.sectionTab,
                {
                  backgroundColor: isActive
                    ? colors.primary[500]
                    : hasVideos
                    ? 'rgba(0,0,0,0.45)'
                    : colors.background.secondary,
                  borderColor: hasVideos ? 'transparent' : colors.border.medium,
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
                    fontFamily: isActive
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                    color: isActive
                      ? Colors.white
                      : hasVideos
                      ? 'rgba(255,255,255,0.85)'
                      : colors.text.secondary,
                  },
                ]}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.statusText, { fontFamily: Typography.fontFamily.regular, color: colors.text.secondary }]}>
            Loading videos...
          </Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <View style={styles.centeredContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
            <Feather name="video-off" size={32} color={colors.text.tertiary} />
          </View>
          <Text style={[styles.emptyTitle, { fontFamily: Typography.fontFamily.bold, color: colors.text.primary }]}>
            No videos yet
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily: Typography.fontFamily.regular, color: colors.text.tertiary }]}>
            {activeSection === 'live'
              ? 'No live events right now. Check back soon.'
              : 'Videos from events will appear here.'}
          </Text>
        </View>
      )}

      {/* Feed */}
      {!loading && videos.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={videos}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={({ item, index }) => (
            <VideoFeedItem
              item={item}
              isActive={screenFocused && index === activeIndex}
              onEventPress={handleEventPress}
              onReport={handleReport}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          getItemLayout={(_, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            ) : null
          }
          removeClippedSubviews
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
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
  statusText: {
    fontSize: Typography.fontSize.sm,
  },
  footerLoader: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoFeedScreen;
