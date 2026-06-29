import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../context/ThemeContext';
import { Typography, Colors, Spacing, BorderRadius } from '../styles/designSystem';
import eventMediaService from '../services/eventMediaService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_H_MARGIN = Spacing[4]; // 16px each side
const PHOTO_WIDTH = SCREEN_WIDTH - CARD_H_MARGIN * 2;
const PHOTO_HEIGHT = Math.round(PHOTO_WIDTH * (5 / 4)); // 4:5 portrait

// ─── Download helper ──────────────────────────────────────────────────────────

async function savePhoto(url) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Allow photo library access to save images.');
    return false;
  }
  const ext = url.split('?')[0].split('.').pop() || 'jpg';
  const dest = `${FileSystem.cacheDirectory}tikiti_${Date.now()}.${ext}`;
  const { uri } = await FileSystem.downloadAsync(url, dest);
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

// ─── PhotoSlide — individual photo with overlaid actions ─────────────────────

const PhotoSlide = ({ photo, onOpenGallery }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(photo.likes || 0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (photo.id) eventMediaService.toggleLike(photo.id, next);
  }, [liked, photo.id]);

  const handleDownload = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await savePhoto(photo.videoUrl);
      if (ok) {
        if (photo.id) eventMediaService.recordDownload(photo.id);
        Alert.alert('Saved', 'Photo saved to your camera roll.');
      }
    } catch {
      Alert.alert('Error', 'Could not save photo. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving, photo.videoUrl, photo.id]);

  return (
    <View style={styles.slide}>
      {/* Tapping the photo opens the gallery */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={0.95}
        onPress={onOpenGallery}
      >
        <Image
          source={{ uri: photo.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.photoLoading}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Right action rail — box-none passes touches through the container to children */}
      <View style={styles.actionRail} pointerEvents="box-none">
        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Feather name="heart" size={22} color={liked ? '#f43f5e' : Colors.white} />
          <Text style={[styles.actionCount, { fontFamily: Typography.fontFamily.semibold }]}>
            {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
          </Text>
        </TouchableOpacity>

        {/* Views */}
        <View style={styles.actionBtn}>
          <Feather name="eye" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={[styles.actionCount, { fontFamily: Typography.fontFamily.semibold }]}>
            {photo.views || 0}
          </Text>
        </View>

        {/* Download */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} activeOpacity={0.7} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Feather name="download" size={20} color="rgba(255,255,255,0.85)" />
          }
        </TouchableOpacity>
      </View>

    </View>
  );
};

// ─── EventMediaCard ───────────────────────────────────────────────────────────

const EventMediaCard = ({
  event,
  onEventPress,
  onOpenGallery,
}) => {
  const { colors } = useTheme();
  const {
    eventId, eventName, eventDate, eventCity,
    eventCategory,
    photos = [],
  } = event;

  const [photoIndex, setPhotoIndex] = useState(0);
  const flatListRef = useRef(null);

  if (photos.length === 0) return null;

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setPhotoIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const renderPhoto = useCallback(({ item: photo, index }) => (
    <View style={{ width: PHOTO_WIDTH, height: PHOTO_HEIGHT }}>
      <PhotoSlide
        photo={photo}
        onOpenGallery={() => onOpenGallery?.(photos, index, eventName)}
      />
    </View>
  ), [photos, eventName, onOpenGallery]);

  return (
    <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.medium }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => onEventPress?.(event)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[styles.eventName, { color: colors.text.primary, fontFamily: Typography.fontFamily.bold }]}
            numberOfLines={2}
          >
            {eventName}
          </Text>

          <View style={styles.chipsRow}>
            {!!formattedDate && (
              <View style={[styles.chip, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
                <Feather name="calendar" size={10} color={colors.text.tertiary} />
                <Text style={[styles.chipText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.medium }]}>
                  {formattedDate}
                </Text>
              </View>
            )}
            {!!eventCity && (
              <View style={[styles.chip, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
                <Feather name="map-pin" size={10} color={colors.text.tertiary} />
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
        <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
      </TouchableOpacity>

      {/* ── Photo carousel ─────────────────────────────────────────────── */}
      <View>
        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item, i) => item.id || String(i)}
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
          removeClippedSubviews
          windowSize={3}
          initialNumToRender={1}
        />

        {/* Photo counter pill — top right */}
        {photos.length > 1 && (
          <View style={styles.counterPill}>
            <Text style={[styles.counterText, { fontFamily: Typography.fontFamily.semibold }]}>
              {photoIndex + 1}/{photos.length}
            </Text>
          </View>
        )}
      </View>

      {/* Dot indicators */}
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
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_H_MARGIN,
    marginBottom: Spacing[4],
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  headerLeft: {
    flex: 1,
    gap: Spacing[2],
  },
  eventName: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
  },
  // ── Slide ──────────────────────────────────────────────────────────────────
  slide: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: '#111',
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  // ── Actions overlay ────────────────────────────────────────────────────────
  actionRail: {
    position: 'absolute',
    right: Spacing[3],
    bottom: Spacing[4],
    alignItems: 'center',
    gap: Spacing[4],
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionCount: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // ── Counter ────────────────────────────────────────────────────────────────
  counterPill: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  counterText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
  },
  // ── Dots ───────────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

export default EventMediaCard;
