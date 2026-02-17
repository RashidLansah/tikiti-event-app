import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Colors, Typography } from '../styles/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ────────────────────────────────────────────────────────
// Base Skeleton — pulsing gray placeholder
// ────────────────────────────────────────────────────────
const Skeleton = ({ width, height, borderRadius = 16, style }) => {
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
          backgroundColor: '#f0f0f0',
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
export const EventListSkeleton = () => (
  <View style={skeletonStyles.container}>
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

// ────────────────────────────────────────────────────────
// EventCardSkeleton — Single event card placeholder
// ────────────────────────────────────────────────────────
export const EventCardSkeleton = () => (
  <View style={skeletonStyles.eventCard}>
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

// ────────────────────────────────────────────────────────
// MyEventsSkeleton — Matches MyTicketsScreen layout
// Header + PillTabBar + registered event cards
// ────────────────────────────────────────────────────────
export const MyEventsSkeleton = () => (
  <View style={skeletonStyles.container}>
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

// ────────────────────────────────────────────────────────
// EventDetailSkeleton — Matches EventDetailScreen (registered view)
// Header + Card + PillTabBar + content
// ────────────────────────────────────────────────────────
export const EventDetailSkeleton = () => (
  <View style={skeletonStyles.container}>
    {/* Header */}
    <View style={[skeletonStyles.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Skeleton width={160} height={28} borderRadius={4} />
    </View>

    <View style={{ paddingHorizontal: 20 }}>
      {/* Event Card */}
      <View style={skeletonStyles.eventCard}>
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
      <View style={skeletonStyles.eventCard}>
        <Skeleton width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 24 }} />
        <Skeleton width={240} height={240} borderRadius={16} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ alignSelf: 'center' }} />
      </View>
    </View>
  </View>
);

// ────────────────────────────────────────────────────────
// DashboardSkeleton — Matches DashboardScreen layout
// Header + Stats cards + PillTabBar + Event list
// ────────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <View style={skeletonStyles.container}>
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
            style={[skeletonStyles.statsCard, { flex: 1 }]}
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

// ────────────────────────────────────────────────────────
// ProfileSkeleton — Profile page placeholder
// ────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <View style={skeletonStyles.container}>
    <View style={[skeletonStyles.header, { alignItems: 'center', paddingTop: 60 }]}>
      {/* Avatar */}
      <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
      <Skeleton width={160} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width={200} height={16} borderRadius={4} />
    </View>

    <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 32 }}>
      {/* Menu items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={skeletonStyles.menuItem}>
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
});

export default Skeleton;
