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
import { bookingService, userService } from '../../services/firestoreService';


const ProfileScreen = ({ navigation }) => {
  const { 
    user, 
    userProfile, 
    logout, 
    updateUserProfile, 
    isOrganizer, 
    hasOrganiserRole, 
    currentRole, 
    switchRole,
    isCurrentlyOrganiser,
    isCurrentlyAttendee 
  } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ticketStats, setTicketStats] = useState({ total: 0, upcoming: 0 });
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Load user ticket statistics when user changes
    loadTicketStats();
  }, [user]);



  const loadTicketStats = async () => {
    if (!user) return;
    
    try {
      // Load user bookings to calculate statistics
      const bookings = await bookingService.getUserBookings(user.uid);
      
      // Filter confirmed bookings only
      const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
      
      // Calculate total tickets (sum of quantities)
      const totalTickets = confirmedBookings.reduce((sum, booking) => sum + (booking.quantity || 1), 0);
      
      // Calculate upcoming events (events with future dates)
      const currentDate = new Date();
      const upcomingEvents = confirmedBookings.filter(booking => {
        // For now, we'll count all confirmed bookings as upcoming
        // In the future, we can check event dates when available
        return true;
      }).length;
      
      setTicketStats({ 
        total: totalTickets, 
        upcoming: upcomingEvents 
      });
    } catch (error) {
      console.error('Error loading ticket stats:', error);
      // Keep default values on error
      setTicketStats({ total: 0, upcoming: 0 });
    }
  };

  const getDisplayName = () => {
    return userProfile?.displayName || 
           user?.displayName || 
           `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
           'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
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

  const handleSwitchToOrganiser = () => {
    if (hasOrganiserRole()) {
      // User has organiser capabilities, switch to organiser role and navigate
      switchRole('organiser');
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrganiserFlow' }],
      });
    } else {
      // User doesn't have organiser capabilities, start upgrade flow
      navigation.navigate('OrganiserUpgrade');
    }
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
            <Text style={[styles.userName, { color: colors.text.primary }]}>{getDisplayName()}</Text>
            <Text style={[styles.userEmail, { color: colors.text.secondary }]}>{user?.email || 'No email'}</Text>
            <Text style={[styles.joinDate, { color: colors.text.tertiary }]}>{getJoinDate()}</Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Type Badge */}
        <View style={styles.accountTypeContainer}>
          <View style={[styles.accountTypeBadge, { backgroundColor: colors.primary[100], borderColor: colors.primary[200] }]}>
            <Feather name={isOrganizer ? "users" : "user"} size={16} color={colors.primary[600]} />
            <Text style={[styles.accountTypeText, { color: colors.primary[700] }]}>
              {isOrganizer ? "Organiser Account" : "Attendee Account"}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.statIconContainer}>
              <Feather name="credit-card" size={24} color={getSubtleIconColor(colors.primary[500])} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{ticketStats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Total Tickets</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.statIconContainer}>
              <Feather name="calendar" size={24} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{ticketStats.upcoming}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Upcoming Events</Text>
          </View>
        </View>



        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
            onPress={() => navigation.navigate('BrowseEvents')}
          >
            <View style={styles.menuIcon}>
              <Feather name="search" size={20} color={getSubtleIconColor(colors.primary[400])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Browse Events</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Discover new events</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <View style={styles.menuIcon}>
              <Feather name="tag" size={20} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>My Tickets</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>View your event tickets</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          {/* Role Switch - Show appropriate option based on current role and capabilities */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
            onPress={isCurrentlyAttendee ? handleSwitchToOrganiser : handleSwitchToAttendee}
          >
            <View style={styles.menuIcon}>
              <Feather 
                name={isCurrentlyAttendee ? "users" : "user"} 
                size={20} 
                color={getSubtleIconColor(colors.warning[500])} 
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>
                {isCurrentlyAttendee 
                  ? (hasOrganiserRole() ? 'Switch to Organiser' : 'Become an Organiser')
                  : 'Switch to Attendee'
                }
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>
                {isCurrentlyAttendee 
                  ? (hasOrganiserRole() ? 'Manage your events' : 'Create and manage events')
                  : 'Browse and attend events'
                }
              </Text>
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
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Event reminders and updates</Text>
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
          <View style={styles.switchingModal}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[styles.switchingText, { color: colors.text.primary }]}>
              Switching to organiser view...
            </Text>
          </View>
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
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[200],
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[700],
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)', // Will be overridden by theme
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#999999',
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
    fontSize: 14,
    color: '#999999',
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

export default ProfileScreen; 