import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * TikitiLoader — Branded full-screen loading component
 * Matches the tikiti-web LoadingScreen: Tikiti logo text + animated progress bar
 *
 * @param {number} duration - Total animation duration in ms (default: 2000)
 * @param {function} onComplete - Optional callback when loading completes
 * @param {string} message - Optional message below progress bar
 */
const TikitiLoader = ({ duration = 2000, onComplete, message }) => {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, [duration]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 157],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        {/* Logo Text */}
        <Text style={[styles.logo, { color: colors.text.primary }]}>Tikiti</Text>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.background.tertiary }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.text.primary }]} />
        </View>

        {/* Optional message */}
        {message && <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary, // #fefff7
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 64,
    color: Colors.black,
    letterSpacing: -1,
  },
  progressTrack: {
    width: 157,
    height: 24,
    backgroundColor: '#d9d9d9',
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 16,
  },
  message: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },
});

export default TikitiLoader;
