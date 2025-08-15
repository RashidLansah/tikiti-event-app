import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { bookingService } from '../../services/firestoreService';


const ProfileScreen = () => {
  const { user, userProfile, logout } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [ticketStats, setTicketStats] = useState({ total: 0, upcoming: 0 });

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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{ticketStats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Total Tickets</Text>
            <Feather name="credit-card" size={20} color={getSubtleIconColor(colors.primary[500])} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{ticketStats.upcoming}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Upcoming Events</Text>
            <Feather name="calendar" size={20} color={getSubtleIconColor(colors.success[500])} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{userProfile?.accountType === 'organizer' ? 'Organizer' : 'Attendee'}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Account Type</Text>
            <Feather name="user" size={20} color={getSubtleIconColor(colors.text.secondary)} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quick Actions</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="credit-card" size={20} color={getSubtleIconColor(colors.primary[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>My Tickets</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>View your purchased tickets</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="calendar" size={20} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Browse Events</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Discover new events</Text>
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

          <View style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="map-pin" size={20} color={getSubtleIconColor(colors.text.secondary)} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Location Services</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Find events near you</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={locationEnabled ? colors.primary[500] : colors.gray[400]}
            />
          </View>

          <View style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="mail" size={20} color={getSubtleIconColor(colors.primary[400])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Marketing Emails</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Event recommendations</Text>
            </View>
            <Switch
              value={marketingEnabled}
              onValueChange={setMarketingEnabled}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={marketingEnabled ? colors.primary[500] : colors.gray[400]}
            />
          </View>
        </View>

        {/* Support & About */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Support & About</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="help-circle" size={20} color={getSubtleIconColor(colors.primary[400])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Help & Support</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>Get help with your account</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.menuIcon}>
              <Feather name="shield" size={20} color={getSubtleIconColor(colors.success[500])} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Privacy Policy</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>How we protect your data</Text>
            </View>
            <Feather name="chevron-right" size={20} color={getSubtleIconColor(colors.text.tertiary)} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent' }]}>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 8,
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
});

export default ProfileScreen; 