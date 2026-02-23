import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { connectionService } from '../../services/firestoreService';

const NetworkScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [connections, setConnections] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await connectionService.getConnections(user.uid);
      setConnections(data);
      groupByEvent(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Refresh on tab focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConnections();
    }, [fetchConnections])
  );

  const groupByEvent = (data) => {
    const grouped = {};
    data.forEach((conn) => {
      const key = conn.eventId || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          eventId: conn.eventId,
          eventName: conn.eventName || 'Unknown Event',
          eventDate: conn.eventDate || null,
          createdAt: conn.createdAt,
          data: [],
        };
      }
      grouped[key].data.push(conn);
    });

    // Sort sections by most recent connection timestamp
    const sortedSections = Object.values(grouped).sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || a.createdAt?.seconds
        ? new Date(a.createdAt.seconds * 1000)
        : new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || b.createdAt?.seconds
        ? new Date(b.createdAt.seconds * 1000)
        : new Date(b.createdAt || 0);
      return bTime - aTime;
    });

    setSections(sortedSections);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConnections();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const openSocialLink = (type, value) => {
    if (!value) return;
    let url = '';
    switch (type) {
      case 'instagram':
        url = `https://instagram.com/${value}`;
        break;
      case 'twitter':
        url = `https://x.com/${value}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${value}`;
        break;
      case 'phone':
        url = `tel:${value}`;
        break;
      default:
        return;
    }
    Linking.openURL(url).catch(() => {});
  };

  const formatSectionDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = dateValue?.toDate?.()
        ? dateValue.toDate()
        : dateValue?.seconds
          ? new Date(dateValue.seconds * 1000)
          : new Date(dateValue);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderSocialIcons = (socialLinks) => {
    if (!socialLinks) return null;
    const icons = [];

    if (socialLinks.instagram) {
      icons.push(
        <TouchableOpacity
          key="instagram"
          onPress={() => openSocialLink('instagram', socialLinks.instagram)}
          style={styles.socialIconButton}
        >
          <FontAwesome name="instagram" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      );
    }
    if (socialLinks.twitter) {
      icons.push(
        <TouchableOpacity
          key="twitter"
          onPress={() => openSocialLink('twitter', socialLinks.twitter)}
          style={styles.socialIconButton}
        >
          <FontAwesome name="twitter" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      );
    }
    if (socialLinks.linkedin) {
      icons.push(
        <TouchableOpacity
          key="linkedin"
          onPress={() => openSocialLink('linkedin', socialLinks.linkedin)}
          style={styles.socialIconButton}
        >
          <FontAwesome name="linkedin" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      );
    }
    if (socialLinks.phone) {
      icons.push(
        <TouchableOpacity
          key="phone"
          onPress={() => openSocialLink('phone', socialLinks.phone)}
          style={styles.socialIconButton}
        >
          <Feather name="phone" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      );
    }

    return <View style={styles.socialIconsRow}>{icons}</View>;
  };

  const renderConnectionRow = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.connectionRow,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: isDarkMode
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.05)',
          },
        ]}
        onPress={() => navigation.navigate('ConnectionDetail', { connection: item })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
          <Text style={styles.avatarText}>
            {getInitials(item.connectedUserName)}
          </Text>
        </View>

        <View style={styles.connectionInfo}>
          <Text style={[styles.connectionName, { color: colors.text.primary }]}>
            {item.connectedUserName || 'Unknown'}
          </Text>
          {renderSocialIcons(item.connectedUserSocialLinks)}
        </View>

        <Feather name="chevron-right" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => {
    return (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {section.eventName}
        </Text>
        {section.eventDate ? (
          <Text style={[styles.sectionDate, { color: colors.text.tertiary }]}>
            {formatSectionDate(section.eventDate)}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconWrapper,
            { backgroundColor: isDarkMode ? colors.gray[200] : Colors.gray[100] },
          ]}
        >
          <Feather name="users" size={64} color={colors.text.disabled} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          Your Network
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
          Scan someone's QR code at an event to save their contact
        </Text>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => navigation.navigate('ScanConnection')}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={20} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Network</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Network</Text>
        <TouchableOpacity
          style={[styles.headerScanButton, { backgroundColor: isDarkMode ? colors.gray[200] : Colors.secondary[300] }]}
          onPress={() => navigation.navigate('ScanConnection')}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {connections.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderConnectionRow}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerScanButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: Spacing[10],
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  sectionDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // Connection row
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  avatarText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIconButton: {
    padding: 2,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[10],
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[8],
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  scanButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default NetworkScreen;
