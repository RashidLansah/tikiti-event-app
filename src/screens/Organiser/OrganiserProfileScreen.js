import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { eventService } from '../../services/firestoreService';
import TikitiLoader from '../../components/TikitiLoader';

const OrganiserProfileScreen = ({ navigation }) => {
  const { 
    logout, 
    userProfile, 
    user, 
    updateUserProfile, 
    switchRole,
    hasOrganiserRole,
    currentRole,
    isCurrentlyOrganiser,
    isCurrentlyAttendee 
  } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [eventStats, setEventStats] = useState({ total: 0, active: 0 });
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Load organiser event statistics when user changes
    loadEventStats();
  }, [user]);

  const loadEventStats = async () => {
    if (!user) return;
    
    try {
      // Load organiser events to calculate statistics
      const events = await eventService.getByOrganizer(user.uid);
      
      // Calculate total events
      const totalEvents = events.length;
      
      // Calculate active events (events that are active)
      const activeEvents = events.filter(event => event.isActive === true).length;
      
      setEventStats({ 
        total: totalEvents, 
        active: activeEvents 
      });
    } catch (error) {
      console.error('Error loading event stats:', error);
      // Keep default values on error
      setEventStats({ total: 0, active: 0 });
    }
  };

  const getDisplayName = () => {
    return userProfile?.displayName || 
           user?.displayName || 
           `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
           'Organiser';
  };

  const getInitials = () => {
    const name = userProfile?.organisationName || getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'O';
  };

  const getJoinDate = () => {
    const createdAt = userProfile?.createdAt || user?.metadata?.creationTime;
    if (!createdAt) return 'Member since recently';
    
    const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `Member since ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Helper function to make icons subtle in dark mode
  const getSubtleIconColor = (baseColor) => {
    if (!isDarkMode) return baseColor;
    
    // In dark mode, use more muted versions of colors
    if (baseColor === colors.primary[500]) return colors.gray[500];
    if (baseColor === colors.success[500]) return colors.gray[500];
    if (baseColor === colors.warning[500]) return colors.gray[500];
    if (baseColor === colors.error[500]) return colors.error[400];
    if (baseColor === colors.primary[400]) return colors.gray[600];
    if (baseColor === colors.text.secondary) return colors.gray[600];
    if (baseColor === colors.text.tertiary) return colors.gray[700];
    
    return baseColor;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSwitchToAttendee = () => {
    // Switch to attendee role and navigate to user flow
    switchRole('attendee');
    navigation.reset({
      index: 0,
      routes: [{ name: 'UserFlow' }],
    });
  };

  const handleHelpSupport = () => {
    const email = 'gettikiti@gmail.com';
    const subject = 'Tikiti App Support Request';
    const body = `Hi Tikiti Support Team,

I need help with:

[Please describe your issue here]

Device: ${Platform.OS}
App Version: 1.0.0
User ID: ${user?.uid || 'Not logged in'}

Thank you!`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Email Not Available',
        'Please email us directly at gettikiti@gmail.com',
        [{ text: 'OK' }]
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.gray[200] }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.background.secondary, borderBottomColor: colors.gray[200] }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text.primary }]}>
              {userProfile?.organisationName || getDisplayName()}
            </Text>
            <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
              {userProfile?.organisationDescription || user?.email || 'No email'}
            </Text>
            <Text style={[styles.joinDate, { color: colors.text.tertiary }]}>
              {userProfile?.organisationCountry ? `${userProfile.organisationCountry} • ${getJoinDate()}` : getJoinDate()}
            </Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={16} color={Colors.white} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Type Badge */}
        <View style={styles.accountTypeContainer}>
          <View style={[styles.accountTypeBadge, { backgroundColor: colors.warning[100], borderColor: colors.warning[200] }]}>
            <Feather name="users" size={16} color={colors.warning[600]} />
            <Text style={[styles.accountTypeText, { color: colors.warning[700] }]}>Organiser Account</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.statIconContainer}>
              <Feather name="calendar" size={24} color={getSubtleIconColor(colors.primary[500])} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{eventStats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Total Events</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.statIconContainer}>
              <Feather name="play-circle" size={24} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{eventStats.active}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Active Events</Text>
          </View>
        </View>

        {/* Organisation Details */}
        {(userProfile?.organisationName || userProfile?.eventTypes?.length > 0) && (
          <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Organisation Details</Text>
            
            {userProfile?.organisationName && (
              <View style={[styles.menuItem, { borderBottomColor: colors.border.light }]}>
                <View style={styles.menuIcon}>
                  <Feather name="briefcase" size={20} color={getSubtleIconColor(colors.primary[500])} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Organisation Name</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{userProfile.organisationName}</Text>
                </View>
              </View>
            )}

            {userProfile?.organisationDescription && (
              <View style={[styles.menuItem, { borderBottomColor: colors.border.light }]}>
                <View style={styles.menuIcon}>
                  <Feather name="file-text" size={20} color={getSubtleIconColor(colors.primary[500])} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Description</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{userProfile.organisationDescription}</Text>
                </View>
              </View>
            )}

            {userProfile?.eventTypes?.length > 0 && (
              <View style={[styles.menuItem, { borderBottomColor: colors.border.light }]}>
                <View style={styles.menuIcon}>
                  <Feather name="tag" size={20} color={getSubtleIconColor(colors.primary[500])} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Event Types</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>
                    {userProfile.eventTypes.join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {userProfile?.organisationCountry && (
              <View style={[styles.menuItem, { borderBottomColor: 'transparent' }]}>
                <View style={styles.menuIcon}>
                  <Feather name="map-pin" size={20} color={getSubtleIconColor(colors.primary[500])} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Location</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{userProfile.organisationCountry}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quick Actions</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="plus-circle" size={20} color={getSubtleIconColor(colors.primary[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Create Event</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Start a new event</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="bar-chart-2" size={20} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Analytics</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>View event performance</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          {/* Switch to Attendee */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
            onPress={handleSwitchToAttendee}
          >
            <View style={styles.menuIcon}>
              <Feather name="user" size={20} color={getSubtleIconColor(colors.warning[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Switch to Attendee</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Browse and book events</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Settings</Text>
          
          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name={isDarkMode ? "moon" : "sun"} size={20} color={getSubtleIconColor(colors.primary[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Dark Mode</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Switch between light and dark themes</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={isDarkMode ? colors.primary[500] : colors.gray[400]}
            />
          </View>
          
          <View style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="bell" size={20} color={getSubtleIconColor(colors.warning[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Push Notifications</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Event updates and reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={notificationsEnabled ? colors.primary[500] : colors.gray[400]}
            />
          </View>


        </View>

        {/* Support & About */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Support & About</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
            onPress={handleHelpSupport}
          >
            <View style={styles.menuIcon}>
              <Feather name="help-circle" size={20} color={getSubtleIconColor(colors.primary[400])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Help & Support</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Contact us for assistance</Text>
            </View>
            <Feather name="mail" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.menuIcon}>
              <Feather name="shield" size={20} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Privacy Policy</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>How we protect your data</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
            onPress={() => navigation.navigate('TermsOfService')}
          >
            <View style={styles.menuIcon}>
              <Feather name="file-text" size={20} color={getSubtleIconColor(colors.warning[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Terms of Service</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Our terms and conditions</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error[50], borderColor: colors.error[200] }]} onPress={handleLogout}>
            <Feather name="log-out" size={20} color={getSubtleIconColor(colors.error[500])} />
            <Text style={[styles.logoutButtonText, { color: colors.error[500] }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text.tertiary }]}>Tikiti v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Switching Loading Overlay */}
      {isSwitching && (
        <View style={styles.switchingOverlay}>
          <TikitiLoader duration={1500} message="Switching to attendee view..." />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Colors.white,
    padding: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'center',
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
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  userEmail: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  joinDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  editButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginLeft: Spacing[2],
  },
  accountTypeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  accountTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.warning[100],
    borderColor: Colors.warning[200],
  },
  accountTypeText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.warning[700],
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing[5],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Shadows.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 16,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing[3],
    paddingVertical: Spacing[4],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[4],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.light,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[50],
    marginHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  logoutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[500],
    marginLeft: Spacing[2],
  },
  versionContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  switchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  switchingModal: {
    backgroundColor: Colors.white,
    padding: Spacing[8],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 200,
    ...Shadows.lg,
  },
  switchingText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[4],
    textAlign: 'center',
  },
});

export default OrganiserProfileScreen;