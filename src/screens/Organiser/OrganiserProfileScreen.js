import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { userService } from '../../services/firestoreService';

const OrganiserProfileScreen = ({ navigation }) => {
  const { logout, userProfile, user, updateUserProfile } = useAuth();

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
    Alert.alert(
      'Switch to Attendee Account',
      'Do you want to switch to attendee mode? This will allow you to browse and book events.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: async () => {
            try {
              await updateUserProfile({ accountType: 'user' });
              Alert.alert(
                'Account Switched',
                'You are now in attendee mode. The app will restart to apply changes.',
                [{ 
                  text: 'OK',
                  onPress: () => {
                    // Force navigation to user flow
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'UserFlow' }],
                    });
                  }
                }]
              );
            } catch (error) {
              console.error('Error switching to attendee:', error);
              Alert.alert('Error', 'Failed to switch account type. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderProfileItem = (icon, label, value) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemHeader}>
        <Feather name={icon} size={20} color={Colors.text.secondary} />
        <Text style={styles.profileItemLabel}>{label}</Text>
      </View>
      <Text style={styles.profileItemValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'O'}
            </Text>
          </View>
          <Text style={styles.name}>{userProfile?.displayName || 'Organiser'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        {renderProfileItem('user', 'Account Type', 'Organiser')}
        {renderProfileItem('mail', 'Email', user?.email)}
        {renderProfileItem('phone', 'Phone', userProfile?.phone || 'Not set')}
        {renderProfileItem('map-pin', 'Location', userProfile?.location || 'Not set')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="edit" size={20} color={Colors.text.secondary} />
          <Text style={styles.settingText}>Edit Profile</Text>
          <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Feather name="lock" size={20} color={Colors.text.secondary} />
          <Text style={styles.settingText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* Switch to Attendee */}
        <TouchableOpacity style={styles.settingItem} onPress={handleSwitchToAttendee}>
          <Feather name="user" size={20} color={Colors.warning[500]} />
          <Text style={styles.settingText}>Switch to Attendee</Text>
          <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={Colors.error[500]} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
    ...Shadows.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  email: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[4],
    textTransform: 'uppercase',
  },
  profileItem: {
    marginBottom: Spacing[4],
  },
  profileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  profileItemLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing[2],
  },
  profileItemValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[6],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginTop: Spacing[4],
    marginBottom: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error[500],
    marginLeft: Spacing[2],
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default OrganiserProfileScreen;
