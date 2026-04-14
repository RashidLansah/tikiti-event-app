import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import VideoFeedItem from '../../components/VideoFeedItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── EventVideoFeedScreen ─────────────────────────────────────────────────────
// Scoped TikTok-style feed for one event's videos.
// Data is passed in via route.params — no Firestore fetch needed.

const EventVideoFeedScreen = ({ navigation, route }) => {
  const { eventId, eventName = '', videos = [] } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const [screenFocused, setScreenFocused] = useState(false);

  const flatListRef = useRef(null);

  // Pause videos when screen loses focus
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleEventPress = useCallback((item) => {
    navigation.navigate('Events', {
      screen: 'EventDetail',
      params: { event: { id: item.eventId } },
    });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { fontFamily: Typography.fontFamily.semibold }]}
          numberOfLines={1}
        >
          {eventName}
        </Text>

        {/* Spacer to keep title centered */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Video FlatList ───────────────────────────────────────────────── */}
      {videos.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={videos}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={({ item, index }) => (
            <VideoFeedItem
              item={item}
              isActive={screenFocused && index === activeIndex}
              onEventPress={handleEventPress}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          removeClippedSubviews
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
        />
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {videos.length === 0 && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="video-off" size={32} color={Colors.white} />
          </View>
          <Text style={[styles.emptyTitle, { fontFamily: Typography.fontFamily.bold }]}>
            No videos
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily: Typography.fontFamily.regular }]}>
            No videos are available for this event yet.
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    // subtle gradient feel without a library dependency
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    marginHorizontal: Spacing[2],
  },
  headerSpacer: {
    width: 36,
  },
  emptyContainer: {
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EventVideoFeedScreen;
