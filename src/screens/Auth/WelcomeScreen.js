import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PG = {
  yellow: '#f5ee3d',
  red: '#f44929',
  purple: '#6256e8',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#454633',
};

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(24)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  // Mascot bob: translateY + rotate
  const mascotY = useRef(new Animated.Value(0)).current;
  const mascotR = useRef(new Animated.Value(-3)).current;

  // Sparks spin
  const spark1R = useRef(new Animated.Value(0)).current;
  const spark2R = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUpAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.timing(buttonFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 500);

    // Mascot bob loop (3.4s, mirrors CSS keyframes)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(mascotY, { toValue: -12, duration: 1360, useNativeDriver: true }),
          Animated.timing(mascotR, { toValue: 3, duration: 1360, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(mascotY, { toValue: -6, duration: 850, useNativeDriver: true }),
          Animated.timing(mascotR, { toValue: -1, duration: 850, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(mascotY, { toValue: 0, duration: 1190, useNativeDriver: true }),
          Animated.timing(mascotR, { toValue: -3, duration: 1190, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Spark 1 spin (7s, 80deg)
    Animated.loop(
      Animated.sequence([
        Animated.timing(spark1R, { toValue: 80, duration: 3500, useNativeDriver: true }),
        Animated.timing(spark1R, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
    // Spark 2 spin (offset -3s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(spark2R, { toValue: -80, duration: 3500, useNativeDriver: true }),
        Animated.timing(spark2R, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const mascotRotate = mascotR.interpolate({ inputRange: [-3, 3], outputRange: ['-3deg', '3deg'] });
  const spin1 = spark1R.interpolate({ inputRange: [0, 80], outputRange: ['0deg', '80deg'] });
  const spin2 = spark2R.interpolate({ inputRange: [-80, 0], outputRange: ['-80deg', '0deg'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PG.yellow} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

        {/* Top bar */}
        <Animated.View style={[styles.topbar, { opacity: fadeAnim }]}>
          <Text style={styles.logo}>tikiti<Text style={styles.logoStar}>{'✱'}</Text></Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.signinLink}>Sign in ↗</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={[styles.headlineWrap, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
          <Text style={styles.h1}>
            {'STAY CURIOUS.\n'}<Text style={styles.h1Red}>GET TOGETHER.</Text>
          </Text>
          <Text style={styles.sub}>New ideas. Good people.{'\n'}Your next great experience starts here.</Text>
        </Animated.View>

        {/* Art */}
        <View style={styles.artWrap}>
          {/* Spark 1 — purple, top-left */}
          <Animated.Text style={[styles.spark, styles.sparkOne, { transform: [{ rotate: spin1 }] }]}>{'✱'}</Animated.Text>
          {/* Mascot */}
          <Animated.Image
            source={require('../../../assets/welcome-mascot.png')}
            style={[
              styles.mascot,
              { transform: [{ translateY: mascotY }, { rotate: mascotRotate }] },
            ]}
            resizeMode="contain"
          />
          {/* Spark 2 — orange, bottom-right */}
          <Animated.Text style={[styles.spark, styles.sparkTwo, { transform: [{ rotate: spin2 }] }]}>{'✱'}</Animated.Text>
          {/* Art label */}
          <View style={styles.artLabel}>
            <Text style={styles.artLabelText}>YOUR NEXT GOOD THING ↗</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CreateAccount')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
            <Text style={[styles.primaryBtnText, { fontSize: 20 }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>Just here to explore? Jump in</Text>
          </TouchableOpacity>
        </View>

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PG.yellow,
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 18,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 0,
  },
  logo: {
    fontSize: 30,
    fontWeight: '700',
    color: PG.fg,
    letterSpacing: -1.5,
  },
  logoStar: {
    color: PG.red,
  },
  signinLink: {
    fontSize: 14,
    fontWeight: '600',
    color: PG.fg,
  },
  headlineWrap: {
    marginTop: 28,
    marginHorizontal: -5,
  },
  h1: {
    fontSize: 44,
    fontWeight: '900',
    color: PG.fg,
    lineHeight: 42,
    letterSpacing: -1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  h1Red: {
    color: PG.red,
  },
  sub: {
    marginTop: 16,
    fontSize: 14,
    color: PG.muted,
    lineHeight: 21,
    textAlign: 'center',
  },
  artWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: -10,
    marginTop: 18,
    marginBottom: 8,
    minHeight: 215,
    maxHeight: 360,
  },
  mascot: {
    width: '90%',
    height: '100%',
    maxHeight: 315,
  },
  spark: {
    position: 'absolute',
    fontSize: 41,
    fontWeight: '700',
    zIndex: 2,
  },
  sparkOne: {
    color: PG.purple,
    left: 13,
    top: 40,
  },
  sparkTwo: {
    color: PG.red,
    right: 13,
    bottom: 51,
    fontSize: 27,
  },
  artLabel: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: PG.purple,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    transform: [{ rotate: '-4deg' }],
  },
  artLabelText: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#fff',
    fontWeight: '700',
  },
  buttons: {
    paddingBottom: 16,
    paddingTop: 14,
    alignItems: 'center',
    gap: 6,
  },
  primaryBtn: {
    backgroundColor: PG.red,
    height: 56,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    width: '100%',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  ghostBtnText: {
    color: PG.fg,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 15,
    paddingBottom: 4,
  },
});

export default WelcomeScreen;
