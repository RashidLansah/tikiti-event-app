import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const { width, height } = Dimensions.get('window');

const AuthChoiceScreen = ({ navigation }) => {
  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const renderIllustrationPlaceholder = () => {
    return (
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationPlaceholder}>
          <Feather 
            name="users" 
            size={64} 
            color={Colors.primary[500]} 
          />
          <Text style={[styles.placeholderText, { color: Colors.primary[500] }]}>
            Welcome Illustration
          </Text>
          <Text style={styles.placeholderSubtext}>
            Replace with real image
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.background.primary} barStyle="dark-content" />
      
      {/* Illustration Section */}
      <View style={styles.illustrationSection}>
        {renderIllustrationPlaceholder()}
      </View>
      
      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome to Tikiti!</Text>
          <Text style={styles.subtitle}>
            Your gateway to amazing events. Join thousands of event enthusiasts and organizers.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Feather name="user-plus" size={24} color={Colors.white} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <Text style={styles.primaryButtonSubtext}>Join the community</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color={Colors.white} />
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Feather name="log-in" size={24} color={Colors.primary[500]} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.secondaryButtonText}>Sign In</Text>
                <Text style={styles.secondaryButtonSubtext}>Already have an account?</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  illustrationSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
    paddingTop: Spacing[16],
  },
  illustrationContainer: {
    width: width * 0.7,
    height: height * 0.3,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  illustrationPlaceholder: {
    width: '90%',
    height: '90%',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[3],
  },
  placeholderText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing[10],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    paddingHorizontal: Spacing[4],
  },
  actionsContainer: {
    gap: Spacing[4],
    marginBottom: Spacing[8],
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.lg,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary[100],
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonTextContainer: {
    marginLeft: Spacing[4],
    flex: 1,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[100],
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  footer: {
    paddingTop: Spacing[4],
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
});

export default AuthChoiceScreen;
