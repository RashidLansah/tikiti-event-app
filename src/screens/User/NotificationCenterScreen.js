import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const NotificationCenterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      setNotifications(userNotifications);
      
      const unread = await notificationService.getUnreadCount(user.uid);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data?.eventId) {
      navigation.navigate('EventDetail', { 
        event: { id: notification.data.eventId } 
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [user?.uid])
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'rsvp_confirmation':
        return 'check-circle';
      case 'event_reminder':
        return 'clock';
      case 'new_rsvp':
        return 'user-plus';
      case 'event_update':
        return 'edit';
      case 'welcome':
        return 'star';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'rsvp_confirmation':
        return colors.success[500];
      case 'event_reminder':
        return colors.warning[500];
      case 'new_rsvp':
        return colors.primary[500];
      case 'event_update':
        return colors.info[500];
      case 'welcome':
        return colors.primary[500];
      default:
        return colors.text.secondary;
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = date.toDate();
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: colors.background.secondary,
          borderLeftColor: item.read ? 'transparent' : colors.primary[500],
        }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' }
        ]}>
          <Feather 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        
        <View style={styles.textContent}>
          <Text style={[
            styles.notificationTitle,
            { 
              color: colors.text.primary,
              fontWeight: item.read ? Typography.fontWeight.medium : Typography.fontWeight.bold
            }
          ]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: colors.text.secondary }]}>
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.text.tertiary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary[500] }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="bell-off" size={48} color={colors.text.tertiary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        No Notifications Yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
        When you RSVP to events or receive updates, they'll appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Notifications
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing[4],
    fontSize: Typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: 50,
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing[2],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  listContainer: {
    padding: Spacing[4],
    flexGrow: 1,
  },
  notificationItem: {
    marginBottom: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[4],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing[1],
  },
  notificationBody: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing[2],
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing[2],
    marginTop: Spacing[1],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationCenterScreen;
