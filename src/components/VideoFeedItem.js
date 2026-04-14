import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';
import eventMediaService from '../services/eventMediaService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── CTA label ───────────────────────────────────────────────────────────────

function getCtaLabel(eventStatus, eventType) {
  if (eventStatus === 'live') return 'Join Now';
  if (eventStatus === 'past') return 'See Similar Events';
  return eventType === 'free' ? 'Register Free' : 'Get Ticket';
}

// ─── Verification badge ───────────────────────────────────────────────────────

function VerificationBadge({ level }) {
  if (level === 'organizer') {
    return (
      <View style={[styles.badge, { backgroundColor: '#6366f1' }]}>
        <Feather name="award" size={10} color={Colors.white} />
        <Text style={[styles.badgeText, { fontFamily: Typography.fontFamily.semibold }]}>Organizer</Text>
      </View>
    );
  }
  if (level === 'checked_in') {
    return (
      <View style={[styles.badge, { backgroundColor: '#22c55e' }]}>
        <Feather name="check-circle" size={10} color={Colors.white} />
        <Text style={[styles.badgeText, { fontFamily: Typography.fontFamily.semibold }]}>Attended</Text>
      </View>
    );
  }
  if (level === 'has_ticket') {
    return (
      <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Feather name="tag" size={10} color={Colors.white} />
        <Text style={[styles.badgeText, { fontFamily: Typography.fontFamily.semibold }]}>Ticket holder</Text>
      </View>
    );
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VideoFeedItem = ({ item, isActive, onEventPress, onReport }) => {
  const { colors } = useTheme();
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reported, setReported] = useState(false);

  // Play / pause based on active state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
      if (item.id) eventMediaService.recordView(item.id);
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive]);

  const handleLike = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    if (item.id) eventMediaService.toggleLike(item.id, newLiked);
  }, [liked, item.id]);

  const handleReport = useCallback(() => {
    if (reported || !item.id) return;
    setReported(true);
    eventMediaService.report(item.id);
    onReport?.();
  }, [reported, item.id, onReport]);

  return (
    <View style={styles.container}>
      {/* Video layer */}
      <TouchableWithoutFeedback onPress={() => setMuted((m) => !m)}>
        <View style={StyleSheet.absoluteFill}>
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted={muted}
            shouldPlay={false}
            onReadyForDisplay={() => setLoading(false)}
            onPlaybackStatusUpdate={(s) => setStatus(s)}
          />

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}

          {muted && (
            <View style={styles.mutedPill}>
              <Feather name="volume-x" size={13} color={Colors.white} />
              <Text style={[styles.mutedText, { fontFamily: Typography.fontFamily.medium }]}>Muted</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Gradient overlay — always dark for readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.82)']}
        locations={[0.35, 0.65, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Right action rail */}
      <View style={styles.actionRail}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Feather
            name={liked ? 'heart' : 'heart'}
            size={26}
            color={liked ? '#f43f5e' : Colors.white}
          />
          <Text style={[styles.actionCount, { fontFamily: Typography.fontFamily.semibold }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionBtn}>
          <Feather name="eye" size={24} color={Colors.white} />
          <Text style={[styles.actionCount, { fontFamily: Typography.fontFamily.semibold }]}>
            {item.views || 0}
          </Text>
        </View>

        {!reported && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleReport} activeOpacity={0.7}>
            <Feather name="flag" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom info */}
      <View style={styles.infoArea}>
        <VerificationBadge level={item.verificationLevel} />

        {/* Event name — tappable */}
        <TouchableOpacity
          onPress={() => onEventPress?.(item)}
          activeOpacity={0.8}
          style={styles.eventRow}
        >
          <Feather name="calendar" size={13} color="rgba(255,255,255,0.75)" />
          <Text
            style={[styles.eventName, { fontFamily: Typography.fontFamily.bold }]}
            numberOfLines={1}
          >
            {item.eventName}
          </Text>
          <Feather name="chevron-right" size={13} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>

        {/* Caption */}
        {!!item.caption && (
          <Text
            style={[styles.caption, { fontFamily: Typography.fontFamily.regular }]}
            numberOfLines={2}
          >
            {item.caption}
          </Text>
        )}

        {/* Meta chips */}
        <View style={styles.metaRow}>
          {!!item.eventCity && (
            <View style={styles.metaChip}>
              <Feather name="map-pin" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.metaText, { fontFamily: Typography.fontFamily.medium }]}>
                {item.eventCity}
              </Text>
            </View>
          )}
          {!!item.eventCategory && (
            <View style={styles.metaChip}>
              <Text style={[styles.metaText, { fontFamily: Typography.fontFamily.medium }]}>
                {item.eventCategory}
              </Text>
            </View>
          )}
        </View>

        {/* CTA button */}
        {item.eventStatus !== 'past' && (
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => onEventPress?.(item)}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, { fontFamily: Typography.fontFamily.bold, color: Colors.white }]}>
              {getCtaLabel(item.eventStatus, item.eventType)}
            </Text>
            <Feather name="arrow-right" size={14} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  mutedPill: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    marginTop: -18,
  },
  mutedText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.55,
  },
  actionRail: {
    position: 'absolute',
    right: 14,
    bottom: 160,
    alignItems: 'center',
    gap: Spacing[5],
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
  },
  infoArea: {
    position: 'absolute',
    left: Spacing[4],
    right: 72,
    bottom: 96,
    gap: Spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventName: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  caption: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.full,
    marginTop: Spacing[1],
  },
  ctaText: {
    fontSize: Typography.fontSize.sm,
  },
});

export default VideoFeedItem;
