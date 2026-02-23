import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { connectionService } from '../../services/firestoreService';

const ConnectionDetailScreen = ({ navigation, route }) => {
  const { connection } = route.params;
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const socialLinks = connection.connectedUserSocialLinks || {};

  const openLink = (type, value) => {
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
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open this link.');
    });
  };

  const handleDeleteConnection = () => {
    Alert.alert(
      'Delete Connection',
      `Are you sure you want to remove ${connection.connectedUserName || 'this connection'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await connectionService.deleteConnection(user.uid, connection.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting connection:', error);
              Alert.alert('Error', 'Failed to delete connection. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSocialLinkRow = (type, icon, label, value, isFontAwesome = true) => {
    if (!value) return null;

    let displayValue = value;
    if (type === 'instagram' || type === 'twitter') {
      displayValue = `@${value}`;
    }

    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.linkRow,
          {
            backgroundColor: colors.background.secondary,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
        onPress={() => openLink(type, value)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.linkIconContainer,
            { backgroundColor: isDarkMode ? colors.gray[200] : Colors.gray[100] },
          ]}
        >
          {isFontAwesome ? (
            <FontAwesome name={icon} size={20} color={colors.text.tertiary} />
          ) : (
            <Feather name={icon} size={20} color={colors.text.tertiary} />
          )}
        </View>
        <View style={styles.linkContent}>
          <Text style={[styles.linkLabel, { color: colors.text.tertiary }]}>{label}</Text>
          <Text style={[styles.linkValue, { color: colors.text.primary }]}>{displayValue}</Text>
        </View>
        <Feather name="external-link" size={18} color={colors.text.disabled} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.light,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDarkMode ? colors.gray[200] : Colors.secondary[300] }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Connection</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.background.secondary,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
            <Text style={styles.avatarText}>
              {getInitials(connection.connectedUserName)}
            </Text>
          </View>

          <Text style={[styles.displayName, { color: colors.text.primary }]}>
            {connection.connectedUserName || 'Unknown'}
          </Text>

          <View style={styles.metAtRow}>
            <Feather name="map-pin" size={14} color={colors.text.tertiary} />
            <Text style={[styles.metAtText, { color: colors.text.tertiary }]}>
              Met at {connection.eventName || 'an event'}
            </Text>
          </View>
        </View>

        {/* Social links */}
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Social Links</Text>

        <View style={styles.linksContainer}>
          {renderSocialLinkRow('instagram', 'instagram', 'Instagram', socialLinks.instagram)}
          {renderSocialLinkRow('twitter', 'twitter', 'X / Twitter', socialLinks.twitter)}
          {renderSocialLinkRow('linkedin', 'linkedin', 'LinkedIn', socialLinks.linkedin)}
          {renderSocialLinkRow('phone', 'phone', 'Phone', socialLinks.phone, false)}

          {Object.keys(socialLinks).length === 0 && (
            <View style={styles.noLinksContainer}>
              <Feather name="link" size={24} color={colors.text.disabled} />
              <Text style={[styles.noLinksText, { color: colors.text.tertiary }]}>
                No social links available
              </Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.error[300] }]}
          onPress={handleDeleteConnection}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={18} color={colors.error[500]} />
          <Text style={[styles.deleteButtonText, { color: colors.error[500] }]}>
            Delete Connection
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[12],
  },

  // Profile card
  profileCard: {
    alignItems: 'center',
    marginHorizontal: Spacing[6],
    marginTop: Spacing[6],
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Shadows.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  avatarText: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  displayName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  metAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metAtText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },

  // Social links section
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing[8],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[6],
  },
  linksContainer: {
    paddingHorizontal: Spacing[6],
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  linkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  linkContent: {
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.tertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  noLinksContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: 8,
  },
  noLinksText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },

  // Delete button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing[6],
    marginTop: Spacing[10],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error[300],
    backgroundColor: 'transparent',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[500],
  },
});

export default ConnectionDetailScreen;
