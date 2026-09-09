import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  muted: '#454633',
};

// Splash screen matching the reference design exactly:
// - Yellow background
// - Large ✱ symbol spins in from small+rotated (splash-turn)
// - tikiti wordmark slides up (splash-word, 0.35s delay)
// - "GOOD THINGS START HERE." fades up (splash-word, 0.7s delay)
// - Purple progress bar fills over 2s (intro-line)
// - "A little curiosity goes a long way."
// Total ~2.1s then calls onComplete

const TikitiLoader = ({ duration = 2100, onComplete }) => {
  // Symbol: scale 0.2→1.08→1, rotate -150→15→0 over 1.25s
  const symbolScale = useRef(new Animated.Value(0.2)).current;
  const symbolRotate = useRef(new Animated.Value(-150)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;

  // Wordmark + caption: translateY 18→0, opacity 0→1
  const wordmarkY = useRef(new Animated.Value(18)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const captionY = useRef(new Animated.Value(18)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;

  // Progress bar: scaleX 0→1 over 2s
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Symbol spin-in: 1.25s, cubic-bezier(.2,.8,.3,1) approximated with spring
    Animated.parallel([
      Animated.timing(symbolOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(symbolScale, { toValue: 1.08, duration: 812, useNativeDriver: true }),
          Animated.timing(symbolRotate, { toValue: 15, duration: 812, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(symbolScale, { toValue: 1, duration: 438, useNativeDriver: true }),
          Animated.timing(symbolRotate, { toValue: 0, duration: 438, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Wordmark slide up: 0.8s delay 0.35s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(wordmarkY, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
    }, 350);

    // Caption slide up: 0.6s delay 0.7s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(captionY, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(captionOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 700);

    // Progress bar: 2s
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Auto-advance after ~2.1s
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const symbolRotateStr = symbolRotate.interpolate({
    inputRange: [-150, 0, 15],
    outputRange: ['-150deg', '0deg', '15deg'],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Center content */}
      <View style={styles.center}>
        {/* ✱ symbol */}
        <Animated.Text
          style={[
            styles.symbol,
            {
              opacity: symbolOpacity,
              transform: [{ scale: symbolScale }, { rotate: symbolRotateStr }],
            },
          ]}
          aria-hidden
        >
          {'✱'}
        </Animated.Text>

        {/* tikiti wordmark */}
        <Animated.View
          style={{
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkY }],
          }}
        >
          <Text style={styles.wordmark}>
            tikiti<Text style={styles.wordmarkStar}>{'✱'}</Text>
          </Text>
        </Animated.View>

        {/* Caption */}
        <Animated.Text
          style={[styles.caption, { opacity: captionOpacity, transform: [{ translateY: captionY }] }]}
        >
          GOOD THINGS START HERE.
        </Animated.Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Progress track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.tagline}>A little curiosity goes a long way.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PG.yellow,
    flexDirection: 'column',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 132,
    color: PG.red,
    lineHeight: 145,
    textAlign: 'center',
  },
  wordmark: {
    fontSize: 87,
    fontWeight: '700',
    letterSpacing: -7,
    lineHeight: 96,
    color: PG.fg,
    textAlign: 'center',
    marginTop: -8,
  },
  wordmarkStar: {
    fontSize: 51,
    letterSpacing: 0,
    color: PG.red,
  },
  caption: {
    fontSize: 11,
    letterSpacing: 1.7,
    color: PG.fg,
    marginTop: 28,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 18,
  },
  progressTrack: {
    width: 90,
    height: 4,
    backgroundColor: 'rgba(32,34,32,0.12)',
    borderRadius: 9,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PG.purple,
    borderRadius: 9,
  },
  tagline: {
    fontSize: 12,
    color: PG.muted,
  },
});

export default TikitiLoader;
