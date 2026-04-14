import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Request media library permission and return whether it was granted.
 */
async function ensurePermission() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Download a single photo URL to the camera roll.
 * Returns true on success, throws on failure.
 */
async function downloadPhoto(url) {
  // Build a safe local file name from the URL
  const ext = url.split('?')[0].split('.').pop() || 'jpg';
  const fileName = `tikiti_${Date.now()}.${ext}`;
  const localUri = FileSystem.cacheDirectory + fileName;

  const { uri } = await FileSystem.downloadAsync(url, localUri);
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

// ─── PhotoGalleryScreen ───────────────────────────────────────────────────────

const PhotoGalleryScreen = ({ navigation, route }) => {
  const { photos = [], initialIndex = 0, eventName = '' } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);
  const [saveAllProgress, setSaveAllProgress] = useState(null); // null | { done: number, total: number }

  const flatListRef = useRef(null);

  // ── View tracking ───────────────────────────────────────────────────────────
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 51 }).current;

  // ── Scroll to initial index on mount ────────────────────────────────────────
  const handleLayout = useCallback(() => {
    if (initialIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
    }
  }, [initialIndex]);

  // ── Save current photo ───────────────────────────────────────────────────────
  const handleSaveCurrent = useCallback(async () => {
    if (saving) return;
    const granted = await ensurePermission();
    if (!granted) {
      Alert.alert('Permission required', 'Allow access to Photos so Tikiti can save images.');
      return;
    }

    setSaving(true);
    try {
      const photo = photos[currentIndex];
      await downloadPhoto(photo.videoUrl);
      Alert.alert('Saved', 'Photo saved to your camera roll.');
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Save failed', 'There was a problem saving this photo. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving, photos, currentIndex]);

  // ── Save all photos ──────────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (saveAllProgress !== null) return;
    const granted = await ensurePermission();
    if (!granted) {
      Alert.alert('Permission required', 'Allow access to Photos so Tikiti can save images.');
      return;
    }

    setSaveAllProgress({ done: 0, total: photos.length });
    let successCount = 0;

    for (let i = 0; i < photos.length; i++) {
      try {
        await downloadPhoto(photos[i].videoUrl);
        successCount++;
      } catch (err) {
        console.error(`Failed to save photo ${i + 1}:`, err);
      }
      setSaveAllProgress({ done: i + 1, total: photos.length });
    }

    setSaveAllProgress(null);

    if (successCount === photos.length) {
      Alert.alert('All saved', `${successCount} photos saved to your camera roll.`);
    } else {
      Alert.alert(
        'Partially saved',
        `${successCount} of ${photos.length} photos saved. Some could not be downloaded.`
      );
    }
  }, [saveAllProgress, photos]);

  // ── Render a single full-screen photo ────────────────────────────────────────
  const renderItem = useCallback(({ item }) => (
    <View style={styles.photoSlide}>
      <Image
        source={{ uri: item.videoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  ), []);

  const isSaveAllRunning = saveAllProgress !== null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>

        {/* Event name */}
        <Text
          style={[styles.headerTitle, { fontFamily: Typography.fontFamily.semibold }]}
          numberOfLines={1}
        >
          {eventName}
        </Text>

        {/* Save All — only if multiple photos */}
        {photos.length > 1 ? (
          <TouchableOpacity
            style={styles.saveAllBtn}
            onPress={handleSaveAll}
            activeOpacity={0.8}
            disabled={isSaveAllRunning}
          >
            {isSaveAllRunning ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={[styles.saveAllText, { fontFamily: Typography.fontFamily.semibold }]}>
                Save All
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          // placeholder to keep title centered
          <View style={styles.headerIconBtn} />
        )}
      </View>

      {/* Save-all progress banner */}
      {isSaveAllRunning && saveAllProgress && (
        <View style={[styles.progressBanner, { top: insets.top + 56 + Spacing[2] }]}>
          <Text style={[styles.progressText, { fontFamily: Typography.fontFamily.medium }]}>
            Saving {saveAllProgress.done}/{saveAllProgress.total}...
          </Text>
        </View>
      )}

      {/* ── Photo FlatList ───────────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item, index) => item.id || item.videoUrl || String(index)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onLayout={handleLayout}
        onScrollToIndexFailed={(info) => {
          // Fallback: wait a tick then retry
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
        removeClippedSubviews
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
      />

      {/* ── Page indicator ───────────────────────────────────────────────── */}
      {photos.length > 1 && (
        <View style={[styles.pageIndicator, { bottom: insets.bottom + 80 }]}>
          <Text style={[styles.pageText, { fontFamily: Typography.fontFamily.semibold }]}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      )}

      {/* ── Download button (current photo) ─────────────────────────────── */}
      <TouchableOpacity
        style={[styles.downloadBtn, { bottom: insets.bottom + 24 }]}
        onPress={handleSaveCurrent}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Feather name="download" size={22} color={Colors.white} />
        )}
      </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  headerIconBtn: {
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
  saveAllBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[1],
  },
  saveAllText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
  },
  progressBanner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  progressText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
  },
  photoSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  pageIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  pageText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
  },
  downloadBtn: {
    position: 'absolute',
    right: Spacing[5],
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

export default PhotoGalleryScreen;
