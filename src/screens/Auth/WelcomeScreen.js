import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Text animation with delay
    setTimeout(() => {
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);

    // Buttons animation with delay
    setTimeout(() => {
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Subtle pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow pulse animation
    const glowPulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    setTimeout(() => {
      pulseAnimation.start();
      glowPulseAnimation.start();
    }, 1500);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo and Branding */}
      <View style={styles.logoContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { translateY: slideUpAnim }
            ],
          }}
        >
          {/* Subtle white glow background */}
          <Animated.View 
            style={[
              styles.logoGlow,
              {
                transform: [{ scale: glowPulseAnim }],
              }
            ]} 
          />
          <Image 
            source={require('../../../tikiti-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
            tintColor={undefined}
          />
        </Animated.View>
        <Animated.Text 
          style={[
            styles.tagline, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }
          ]}
        >
          WHERE AMAZING EVENTS HAPPEN
        </Animated.Text>
      </View>

      {/* Action Buttons */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: buttonFadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.primaryButtonText}>
            Create Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.secondaryButtonText}>
            Sign In
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing[6],
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[20],
  },
  logoGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: Spacing[6],
  },
  tagline: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
    letterSpacing: 2,
  },
  buttonContainer: {
    paddingBottom: Spacing[12],
    gap: Spacing[4],
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
  },
});

export default WelcomeScreen;