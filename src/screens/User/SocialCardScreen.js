import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';

import { Feather, FontAwesome } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { generateSocialCardUrl } from '../../utils/sharingUtils';

const SocialCardScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const { isDarkMode, colors } = useTheme();

  const getDisplayName = () => {
    return (
      userProfile?.displayName ||
      user?.displayName ||
      `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
      'User'
    );
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  const socialCardUrl = generateSocialCardUrl(user?.uid);

  const socialLinks = userProfile?.socialLinks || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with me on Tikiti! ${socialCardUrl}`,
        title: 'My Social Card',
      });
    } catch (error) {
      // User cancelled share or an error occurred
    }
  };

  const renderSocialRow = ({ icon, iconFamily, label, value }) => {
    if (!value) return null;
    const IconComponent = iconFamily === 'FontAwesome' ? FontAwesome : Feather;

    return (
      <View style={[styles.socialRow, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[styles.socialIconCircle, { backgroundColor: isDarkMode ? colors.gray[200] : Colors.gray[100] }]}>
          <IconComponent name={icon} size={16} color={colors.text.secondary} />
        </View>
        <Text style={[styles.socialValue, { color: colors.text.primary }]}>{label}{value}</Text>
      </View>
    );
  };

  const hasSocialLinks =
    socialLinks.instagram || socialLinks.twitter || socialLinks.linkedin || socialLinks.phone;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>My Social Card</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Social Card */}
        <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: isDarkMode ? colors.border.light : 'rgba(0,0,0,0.1)' }]}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </View>

          {/* Display Name */}
          <Text style={[styles.displayName, { color: colors.text.primary }]}>{getDisplayName()}</Text>

          {/* Social Links */}
          {hasSocialLinks ? (
            <View style={styles.socialLinksContainer}>
              {renderSocialRow({
                icon: 'instagram',
                iconFamily: 'Feather',
                label: '@',
                value: socialLinks.instagram,
              })}
              {renderSocialRow({
                icon: 'twitter',
                iconFamily: 'FontAwesome',
                label: '@',
                value: socialLinks.twitter,
              })}
              {renderSocialRow({
                icon: 'linkedin',
                iconFamily: 'FontAwesome',
                label: 'linkedin.com/in/',
                value: socialLinks.linkedin,
              })}
              {renderSocialRow({
                icon: 'phone',
                iconFamily: 'Feather',
                label: '',
                value: socialLinks.phone,
              })}
            </View>
          ) : (
            <Text style={[styles.noLinksText, { color: colors.text.tertiary }]}>
              No social links added yet.
            </Text>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, { backgroundColor: Colors.white, borderColor: isDarkMode ? colors.border.light : 'rgba(0,0,0,0.08)' }]}>
            <QRCode value={`https://gettikiti.com/u/${user?.uid}`} size={180} />
          </View>
          <Text style={[styles.qrLabel, { color: colors.text.secondary }]}>Scan to connect with me</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary[500] }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Feather name="share-2" size={18} color={Colors.white} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Share My Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: colors.border.dark }]}
            onPress={() => navigation.navigate('EditSocialLinks')}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={18} color={colors.text.primary} style={styles.buttonIcon} />
            <Text style={[styles.outlineButtonText, { color: colors.text.primary }]}>Edit Links</Text>
          </TouchableOpacity>
        </View>

        {/* Powered by Tikiti */}
        <View style={styles.poweredByContainer}>
          <Text style={[styles.poweredByText, { color: colors.text.disabled }]}>Powered by Tikiti</Text>
        </View>
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
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing[6],
    paddingBottom: Spacing[12],
    alignItems: 'center',
  },

  /* Card */
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarContainer: {
    marginBottom: Spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  displayName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  socialLinksContainer: {
    width: '100%',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  socialIconCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  socialValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  noLinksText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: Spacing[2],
  },

  /* QR Code */
  qrContainer: {
    alignItems: 'center',
    marginTop: Spacing[8],
  },
  qrWrapper: {
    padding: Spacing[5],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Shadows.sm,
  },
  qrLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
  },

  /* Buttons */
  buttonsContainer: {
    width: '100%',
    marginTop: Spacing[8],
    gap: Spacing[3],
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  outlineButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.dark,
  },
  outlineButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },

  /* Powered by */
  poweredByContainer: {
    marginTop: Spacing[10],
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.disabled,
  },
});

export default SocialCardScreen;
