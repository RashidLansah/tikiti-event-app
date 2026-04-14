import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Colors, Spacing, BorderRadius } from '../../styles/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_HORIZONTAL_MARGIN = Spacing[4]; // 16 each side
const PHOTO_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const PHOTO_HEIGHT = Math.round((PHOTO_WIDTH / 4) * 3); // 4:3 ratio

// ─── CTA label helper ─────────────────────────────────────────────────────────

function getCtaLabel(eventStatus, eventType) {
  if (eventStatus === 'live') return 'Join Now';
  if (eventStatus === 'past') return null; // no CTA for past events
  return eventType === 'free' ? 'Register Free' : 'Get Ticket';
}

// ─── EventMediaCard ───────────────────────────────────────────────────────────

const EventMediaCard = ({
  event,
  onEventPress,
  onWatchVideos,
  onDownloadPhoto,
  onOpenGallery,
}) => {
  const { colors } = useTheme();
  const { eventId, eventName, eventDate, eventCity, eventCategory, eventStatus, eventType, photos = [], videos = [] } = event;

  const [photoIndex, setPhotoIndex] = useState(0);
  const flatListRef = useRef(null);

  // Skip rendering entirely if no media
  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  const ctaLabel = getCtaLabel(eventStatus, eventType);

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setPhotoIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Format date for display
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const renderPhoto = ({ item: photo, index }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => onOpenGallery?.(photos, index, eventName)}
      style={styles.photoWrapper}
    >
      <Image
        source={{ uri: photo.videoUrl }}
        style={styles.photo}
        resizeMode="cover"
      />
      {/* Download overlay button */}
      <TouchableOpacity
        style={styles.downloadOverlay}
        onPress={() => onDownloadPhoto?.(photo)}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="download" size={14} color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.medium }]}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.eventNameRow}
          onPress={() => onEventPress?.(event)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.eventName, { color: colors.text.primary, fontFamily: Typography.fontFamily.bold }]}
            numberOfLines={2}
          >
            {eventName}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.text.tertiary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Chips row */}
        <View style={styles.chipsRow}>
          {!!formattedDate && (
            <View style={[styles.chip, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Feather name="calendar" size={11} color={colors.text.tertiary} />
              <Text style={[styles.chipText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.medium }]}>
                {formattedDate}
              </Text>
            </View>
          )}
          {!!eventCity && (
            <View style={[styles.chip, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Feather name="map-pin" size={11} color={colors.text.tertiary} />
              <Text style={[styles.chipText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.medium }]}>
                {eventCity}
              </Text>
            </View>
          )}
          {!!eventCategory && (
            <View style={[styles.chip, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Text style={[styles.chipText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.medium }]}>
                {eventCategory}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Photo carousel ───────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={photos}
            keyExtractor={(item) => item.id || item.videoUrl}
            renderItem={renderPhoto}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: PHOTO_WIDTH,
              offset: PHOTO_WIDTH * index,
              index,
            })}
            snapToInterval={PHOTO_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
          />

          {/* Page dots */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === photoIndex ? colors.text.primary : colors.border.dark,
                      width: i === photoIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Footer actions ───────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {/* Video pill — only when there are videos */}
        {videos.length > 0 && (
          <TouchableOpacity
            style={styles.videoPill}
            onPress={() => onWatchVideos?.(eventId, videos)}
            activeOpacity={0.8}
          >
            <Feather name="play" size={13} color={Colors.white} />
            <Text style={[styles.videoPillText, { fontFamily: Typography.fontFamily.semibold }]}>
              Watch {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </Text>
          </TouchableOpacity>
        )}

        {/* CTA button */}
        {!!ctaLabel && (
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => onEventPress?.(event)}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, { fontFamily: Typography.fontFamily.bold, color: Colors.white }]}>
              {ctaLabel}
            </Text>
            <Feather name="arrow-right" size={13} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: Spacing[4],
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  eventNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventName: {
    fontSize: Typography.fontSize.base,
    flex: 1,
    lineHeight: 22,
  },
  chevron: {
    marginTop: 3,
    marginLeft: Spacing[1],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
  },
  carouselContainer: {
    marginBottom: Spacing[3],
  },
  photoWrapper: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  downloadOverlay: {
    position: 'absolute',
    bottom: Spacing[2],
    right: Spacing[2],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  videoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  videoPillText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    fontSize: Typography.fontSize.sm,
  },
});

export default EventMediaCard;
