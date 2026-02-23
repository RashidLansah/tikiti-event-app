import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Colors, Typography } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ────────────────────────────────────────────────────────
// Base Skeleton — pulsing gray placeholder
// ────────────────────────────────────────────────────────
const Skeleton = ({ width, height, borderRadius = 16, style }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.background.tertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ────────────────────────────────────────────────────────
// EventListSkeleton — Matches EventListScreen layout
// Header + search + PillTabBar + event cards
// ────────────────────────────────────────────────────────
export const EventListSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={skeletonStyles.header}>
      <View style={skeletonStyles.headerTop}>
        <View>
          <Skeleton width={80} height={16} borderRadius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width={180} height={28} borderRadius={4} />
        </View>
        <Skeleton width={56} height={56} borderRadius={28} />
      </View>

      {/* Search Bar */}
      <Skeleton
        width={SCREEN_WIDTH - 40}
        height={60}
        borderRadius={24}
      />
    </View>

    {/* PillTabBar */}
    <View style={skeletonStyles.pillTabBar}>
      <Skeleton width={SCREEN_WIDTH - 40} height={58} borderRadius={40} />
    </View>

    {/* Event Cards */}
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
    >
      {[1, 2, 3].map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </ScrollView>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// EventCardSkeleton — Single event card placeholder
// ────────────────────────────────────────────────────────
export const EventCardSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.eventCard, { backgroundColor: colors.background.secondary }]}>
    {/* Image */}
    <Skeleton
      width="100%"
      height={161}
      borderRadius={18}
      style={{ marginBottom: 17 }}
    />

    {/* Title */}
    <Skeleton
      width="75%"
      height={24}
      borderRadius={4}
      style={{ marginBottom: 17 }}
    />

    {/* Pills */}
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <Skeleton width={140} height={28} borderRadius={4} />
        <Skeleton width={80} height={28} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <Skeleton width={120} height={28} borderRadius={4} />
        <Skeleton width={70} height={28} borderRadius={4} />
      </View>
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// MyEventsSkeleton — Matches MyTicketsScreen layout
// Header + PillTabBar + registered event cards
// ────────────────────────────────────────────────────────
export const MyEventsSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={skeletonStyles.header}>
      <Skeleton width={30} height={16} borderRadius={4} />
      <View style={{ height: 8 }} />
      <Skeleton width={200} height={28} borderRadius={4} />
    </View>

    {/* PillTabBar */}
    <View style={skeletonStyles.pillTabBar}>
      <Skeleton width={SCREEN_WIDTH - 40} height={58} borderRadius={40} />
    </View>

    {/* Event Cards */}
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
    >
      {[1, 2].map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </ScrollView>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// EventDetailSkeleton — Matches EventDetailScreen (registered view)
// Header + Card + PillTabBar + content
// ────────────────────────────────────────────────────────
export const EventDetailSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={[skeletonStyles.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Skeleton width={160} height={28} borderRadius={4} />
    </View>

    <View style={{ paddingHorizontal: 20 }}>
      {/* Event Card */}
      <View style={[skeletonStyles.eventCard, { backgroundColor: colors.background.secondary }]}>
        <Skeleton width="100%" height={161} borderRadius={18} style={{ marginBottom: 17 }} />
        <Skeleton width="80%" height={24} borderRadius={4} style={{ marginBottom: 17 }} />
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Skeleton width={140} height={28} borderRadius={4} />
            <Skeleton width={80} height={28} borderRadius={4} />
          </View>
          <Skeleton width={160} height={28} borderRadius={4} />
        </View>
      </View>

      {/* Days left pill */}
      <View style={{ marginTop: 16 }}>
        <Skeleton width={120} height={30} borderRadius={30} />
      </View>

      {/* PillTabBar */}
      <View style={{ marginTop: 20, marginBottom: 16 }}>
        <Skeleton width="100%" height={58} borderRadius={40} />
      </View>

      {/* Tab content placeholder */}
      <View style={[skeletonStyles.eventCard, { backgroundColor: colors.background.secondary }]}>
        <Skeleton width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 24 }} />
        <Skeleton width={240} height={240} borderRadius={16} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ alignSelf: 'center' }} />
      </View>
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// DashboardSkeleton — Matches DashboardScreen layout
// Header + Stats cards + PillTabBar + Event list
// ────────────────────────────────────────────────────────
export const DashboardSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={skeletonStyles.header}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Skeleton width={100} height={16} borderRadius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width={160} height={28} borderRadius={4} />
        </View>
        <Skeleton width={56} height={56} borderRadius={28} />
      </View>
    </View>

    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[skeletonStyles.statsCard, { flex: 1, backgroundColor: colors.background.secondary }]}
          >
            <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width={40} height={32} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* PillTabBar */}
      <Skeleton width="100%" height={58} borderRadius={40} style={{ marginBottom: 16 }} />

      {/* Event cards */}
      {[1, 2].map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </ScrollView>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// ProfileSkeleton — Profile page placeholder
// ────────────────────────────────────────────────────────
export const ProfileSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    <View style={[skeletonStyles.header, { alignItems: 'center', paddingTop: 60 }]}>
      {/* Avatar */}
      <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
      <Skeleton width={160} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width={200} height={16} borderRadius={4} />
    </View>

    <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 32 }}>
      {/* Menu items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[skeletonStyles.menuItem, { backgroundColor: colors.background.secondary }]}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="60%" height={16} borderRadius={4} />
          </View>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// NetworkSkeleton — Matches NetworkScreen layout
// Header + Scan button + section + connection rows
// ────────────────────────────────────────────────────────
export const NetworkSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={[skeletonStyles.networkHeader, { borderBottomColor: colors.border.light }]}>
      <Skeleton width={120} height={28} borderRadius={4} />
      <Skeleton width={40} height={40} borderRadius={20} />
    </View>

    <View style={{ paddingHorizontal: 20 }}>
      {/* Scan QR Code button */}
      <Skeleton width="100%" height={52} borderRadius={16} style={{ marginTop: 16, marginBottom: 24 }} />

      {/* Section header */}
      <Skeleton width={180} height={18} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Connection rows */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={[skeletonStyles.connectionRow, { borderBottomColor: colors.border.light }]}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
            <Skeleton width="60%" height={16} borderRadius={4} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={24} height={24} borderRadius={12} />
            </View>
          </View>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// NotificationSkeleton — Matches NotificationCenterScreen layout
// Header + notification items
// ────────────────────────────────────────────────────────
export const NotificationSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={[skeletonStyles.networkHeader, { borderBottomColor: colors.border.light }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={24} height={24} borderRadius={4} />
        <Skeleton width={140} height={28} borderRadius={4} />
      </View>
      <Skeleton width={24} height={24} borderRadius={4} />
    </View>

    {/* Notification items */}
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[skeletonStyles.notificationItem, { backgroundColor: colors.background.secondary }]}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <Skeleton width="70%" height={16} borderRadius={4} />
            <Skeleton width="90%" height={14} borderRadius={4} />
            <Skeleton width={80} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// AttendeesSkeleton — Matches EventAttendeesScreen layout
// Header + stats + search + attendee rows
// ────────────────────────────────────────────────────────
export const AttendeesSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={[skeletonStyles.container, { backgroundColor: colors.background.primary }]}>
    {/* Header */}
    <View style={[skeletonStyles.networkHeader, { borderBottomColor: colors.border.light }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={24} height={24} borderRadius={4} />
        <View style={{ gap: 4 }}>
          <Skeleton width={160} height={22} borderRadius={4} />
          <Skeleton width={100} height={14} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={36} height={36} borderRadius={18} />
    </View>

    <View style={{ paddingHorizontal: 20 }}>
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 16 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[skeletonStyles.statsCard, { flex: 1, backgroundColor: colors.background.secondary }]}>
            <Skeleton width={40} height={28} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Search bar */}
      <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 16 }} />

      {/* Attendee rows */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[skeletonStyles.connectionRow, { borderBottomColor: colors.border.light }]}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <Skeleton width="55%" height={16} borderRadius={4} />
            <Skeleton width="75%" height={13} borderRadius={4} />
          </View>
          <Skeleton width={60} height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
  );
};

// ────────────────────────────────────────────────────────
// InlineLoader — Small inline loading placeholder
// ────────────────────────────────────────────────────────
export const InlineLoader = ({ width = 100, height = 16 }) => (
  <Skeleton width={width} height={height} borderRadius={4} />
);

// ────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────
const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  pillTabBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  eventCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 14,
    paddingBottom: 15,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
  },
  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
});

export default Skeleton;
