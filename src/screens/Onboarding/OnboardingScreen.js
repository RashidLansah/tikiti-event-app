import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      id: 1,
      title: 'Browse Amazing\nEvents',
      subtitle: 'Discover concerts, festivals, conferences and local events happening around you. Find your next great experience with just a tap.',
      backgroundColor: Colors.primary[50],
      accentColor: Colors.primary[500],
      // Real illustration - browsing events
      illustration: 'browsing-events',
    },
    {
      id: 2,
      title: 'Super\nClean & Flat',
      subtitle: 'Praesent sapien massa, convallis a pellentesque nec, egestas non nulla sit amet erat tempus convallis quis ac lectus.',
      backgroundColor: Colors.secondary[50],
      accentColor: Colors.secondary[500],
      // Placeholder for illustration - user will replace with real image
      illustration: 'super-clean',
    },
    {
      id: 3,
      title: 'Modern Vibrant\nColors',
      subtitle: 'Praesent sapien massa, convallis a pellentesque nec, egestas non nulla sit amet erat tempus convallis quis ac lectus.',
      backgroundColor: Colors.warning[50],
      accentColor: Colors.warning[500],
      // Placeholder for illustration - user will replace with real image
      illustration: 'modern-colors',
    },
  ];

  const nextSlide = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      setCurrentSlide(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      navigation.navigate('AuthChoice');
    }
  };

  const skipOnboarding = () => {
    navigation.navigate('AuthChoice');
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  const renderIllustrationPlaceholder = (illustration, accentColor) => {
    // This is a placeholder that will be replaced with real illustrations
    const placeholderIcons = {
      'professional-design': 'monitor',
      'super-clean': 'layers',
      'modern-colors': 'palette',
    };

    return (
      <View style={[styles.illustrationContainer, { backgroundColor: Colors.white }]}>
        <View style={[styles.illustrationPlaceholder, { borderColor: accentColor }]}>
          <Feather 
            name={placeholderIcons[illustration] || 'image'} 
            size={64} 
            color={accentColor} 
          />
          <Text style={[styles.placeholderText, { color: accentColor }]}>
            Illustration Placeholder
          </Text>
          <Text style={styles.placeholderSubtext}>
            Replace with real image
          </Text>
        </View>
      </View>
    );
  };

  const renderSlide = (slide) => (
    <Animated.View style={[
      styles.slide, 
      { backgroundColor: slide.backgroundColor },
      { opacity: fadeAnim }
    ]}>
      <StatusBar backgroundColor={slide.backgroundColor} barStyle="dark-content" />
      
      {/* Illustration Area */}
      <View style={styles.illustrationSection}>
        {renderIllustrationPlaceholder(slide.illustration, slide.accentColor)}
      </View>
      
      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={[styles.title, { color: Colors.text.primary }]}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, { color: Colors.text.secondary }]}>
          {slide.subtitle}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={slides[currentSlide]?.backgroundColor} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Tikiti</Text>
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Container */}
      <View style={styles.slidesContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentSlide(slideIndex);
          }}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={{ width }}>
              {renderSlide(slide)}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: slides[currentSlide]?.backgroundColor }]}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                currentSlide === index && [
                  styles.paginationDotActive,
                  { backgroundColor: slides[currentSlide]?.accentColor }
                ],
              ]}
              onPress={() => goToSlide(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>

        {/* Navigation Button */}
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: slides[currentSlide]?.accentColor }]} 
          onPress={nextSlide}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Feather 
            name={currentSlide === slides.length - 1 ? 'check' : 'arrow-right'} 
            size={20} 
            color={Colors.white} 
            style={{ marginLeft: Spacing[2] }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[12],
    paddingBottom: Spacing[4],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
    letterSpacing: Typography.letterSpacing.tight,
  },
  skipButton: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingTop: Spacing[20],
  },
  illustrationSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
  },
  illustrationContainer: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: BorderRadius['3xl'],
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
    paddingBottom: Spacing[8],
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing[4],
    lineHeight: Typography.lineHeight.tight * Typography.fontSize['4xl'],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    paddingHorizontal: Spacing[4],
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    paddingTop: Spacing[6],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[8],
    gap: Spacing[2],
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border.medium,
  },
  paginationDotActive: {
    width: 32,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  nextButton: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius['2xl'],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default OnboardingScreen;