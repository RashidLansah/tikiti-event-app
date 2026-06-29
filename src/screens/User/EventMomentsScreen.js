import React, { useState, useEffect, useCallback } from 'react';
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
  Share,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import eventMediaService from '../../services/eventMediaService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 2) / 3; // 3 columns with 1px gaps

const EventMomentsScreen = ({ navigation, route }) => {
  const { event } = route.params;
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadMedia = useCallback(async () => {
    try {
      const { docs, lastDoc: last, hasMore: more } = await eventMediaService.getAttendeePosts(event.id, 30);
      setMedia(docs);
      setLastDoc(last);
      setHasMore(more);
      setTotalCount(docs.length);
    } catch (err) {
      console.error('EventMomentsScreen: failed to load media', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [event.id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const { docs, lastDoc: last, hasMore: more } = await eventMediaService.getAttendeePosts(event.id, 30, lastDoc);
      setMedia((prev) => [...prev, ...docs]);
      setLastDoc(last);
      setHasMore(more);
      setTotalCount((prev) => prev + docs.length);
    } catch (err) {
      console.error('EventMomentsScreen: loadMore error', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, event.id]);

  useFocusEffect(
    useCallback(() => {
      loadMedia();
    }, [loadMedia])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const openGallery = (index) => {
    const photos = media.map((m) => m.videoUrl || m.thumbnailUrl).filter(Boolean);
    navigation.navigate('PhotoGallery', { photos, initialIndex: index });
  };

  const renderCell = ({ item, index }) => (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => openGallery(index)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.videoUrl }}
        style={styles.cellImage}
        resizeMode="cover"
      />
      {/* Video indicator */}
      {item.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <Feather name="play" size={12} color="#fff" />
        </View>
      )}
      {/* Verification badge */}
      {item.verificationLevel === 'checked_in' && (
        <View style={styles.verifiedDot} />
      )}
      {/* Like count overlay */}
      {item.likes > 0 && (
        <View style={styles.likeOverlay}>
          <Feather name="heart" size={10} color="#fff" />
          <Text style={styles.likeCount}>{item.likes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.background?.primary || '#fff' }]}>
      <Feather name="camera-off" size={48} color={colors.text?.tertiary || Colors.secondary[600]} />
      <Text style={[styles.emptyTitle, { color: colors.text?.primary || Colors.primary[800] }]}>
        No moments yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text?.tertiary || Colors.secondary[600] }]}>
        Be the first to share a photo or video from this event.
      </Text>
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.primary?.[500] || Colors.primary[500] }]}
        onPress={() => navigation.navigate('PostEventVideo', { event })}
      >
        <Feather name="camera" size={16} color="#fff" />
        <Text style={styles.shareBtnText}>Share a Moment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.listHeader, { borderBottomColor: colors.border?.light || Colors.secondary[300] }]}>
      <Text style={[styles.countText, { color: colors.text?.tertiary || Colors.secondary[600] }]}>
        {totalCount} {totalCount === 1 ? 'moment' : 'moments'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background?.primary || '#fff' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border?.light || Colors.secondary[300] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.text?.primary || Colors.primary[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text?.primary || Colors.primary[800] }]} numberOfLines={1}>
            Moments
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text?.tertiary || Colors.secondary[600] }]} numberOfLines={1}>
            {event.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.shareIconBtn, { backgroundColor: colors.primary?.[500] || Colors.primary[500] }]}
          onPress={() => navigation.navigate('PostEventVideo', { event })}
        >
          <Feather name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary?.[500] || Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id}
          renderItem={renderCell}
          numColumns={3}
          ListHeaderComponent={media.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary?.[500] || Colors.primary[500]} style={{ paddingVertical: 16 }} />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary?.[500] || Colors.primary[500]}
            />
          }
          contentContainerStyle={media.length === 0 ? styles.emptyList : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography?.fontSize?.lg || 18,
    fontWeight: Typography?.fontWeight?.bold || '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerSubtitle: {
    fontSize: Typography?.fontSize?.sm || 13,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  shareIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countText: {
    fontSize: Typography?.fontSize?.sm || 13,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  row: {
    gap: 1,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: Colors.secondary[200],
    position: 'relative',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success?.[500] || '#22C55E',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  likeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likeCount: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-SemiBold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: Typography?.fontSize?.lg || 18,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: Typography?.fontSize?.sm || 13,
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: Typography?.fontSize?.sm || 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
});

export default EventMomentsScreen;
