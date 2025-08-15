import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/designSystem';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const handleUserSelection = (accountType) => {
    navigation.navigate('Register', { accountType });
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../../assets/icon.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Your Gateway to Amazing Events</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Tikiti!</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose how you'd like to use Tikiti
          </Text>
        </View>

        {/* Account Type Selection */}
        <View style={styles.optionsContainer}>
          {/* User Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleUserSelection('user')}
          >
            <View style={styles.optionIconContainer}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.primary[500] }]}>
                <Feather name="user" size={32} color={Colors.white} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I'm an Attendee</Text>
              <Text style={styles.optionDescription}>
                Discover and book tickets for amazing events in your area
              </Text>
              <View style={styles.optionFeatures}>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Browse events</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Buy tickets</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Digital wallet</Text>
                </View>
              </View>
            </View>
            <View style={styles.optionArrow}>
              <Feather name="arrow-right" size={20} color="Colors.primary[500]" />
            </View>
          </TouchableOpacity>

          {/* Organiser Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleUserSelection('organizer')}
          >
            <View style={styles.optionIconContainer}>
              <View style={[styles.optionIcon, { backgroundColor: 'Colors.success[500]' }]}>
                <Feather name="users" size={32} color="Colors.white" />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I'm an Organiser</Text>
              <Text style={styles.optionDescription}>
                Create and manage events, sell tickets and grow your audience
              </Text>
              <View style={styles.optionFeatures}>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Create events</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Sell tickets</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="check" size={16} color="Colors.success[500]" />
                  <Text style={styles.featureText}>Analytics dashboard</Text>
                </View>
              </View>
            </View>
            <View style={styles.optionArrow}>
              <Feather name="arrow-right" size={20} color="Colors.success[500]" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={handleSignIn}
        >
          <Text style={styles.signInButtonText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing[10],
    paddingHorizontal: Spacing[5],
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[600],
    marginBottom: Spacing[2],
    letterSpacing: Typography.letterSpacing.tight,
  },
  logoImage: {
    height: 80,
    width: 80,
    marginBottom: Spacing[2],
    borderRadius: BorderRadius['2xl'],
    ...Shadows.lg,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Spacing[10],
  },
  welcomeTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  optionsContainer: {
    gap: Spacing[5],
  },
  optionCard: {
    ...Components.card.elevated,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[6],
  },
  optionIconContainer: {
    marginRight: Spacing[4],
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing[3],
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  optionFeatures: {
    gap: Spacing[2],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  optionArrow: {
    marginLeft: Spacing[4],
    padding: Spacing[2],
  },
  footer: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[10],
    paddingTop: Spacing[5],
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.xs,
  },
  footerLink: {
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  signInButton: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  signInButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default WelcomeScreen;