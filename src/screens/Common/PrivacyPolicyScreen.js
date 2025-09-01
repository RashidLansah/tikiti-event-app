import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/designSystem';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.gray[200] }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.lastUpdated, { color: colors.text.tertiary }]}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>1. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We collect information you provide directly to us, such as when you create an account, create or attend events, or contact us for support.
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: colors.text.primary }]}>Personal Information:</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Name and email address{'\n'}
            • Profile information (display name, phone number, location){'\n'}
            • Event information you create or attend{'\n'}
            • Payment information (processed securely through third-party providers)
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>2. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We use the information we collect to:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Provide, maintain, and improve our services{'\n'}
            • Process transactions and send related information{'\n'}
            • Send technical notices, updates, and support messages{'\n'}
            • Respond to your comments and questions{'\n'}
            • Monitor and analyze trends and usage{'\n'}
            • Personalize your experience
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>3. Information Sharing</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • To trusted service providers who assist us in operating our app{'\n'}
            • When required by law or to protect our rights{'\n'}
            • In connection with a business transfer or acquisition
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>4. Data Security</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>5. Data Retention</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>6. Your Rights</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            You have the right to:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Access your personal information{'\n'}
            • Correct inaccurate information{'\n'}
            • Delete your account and data{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Data portability
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>7. Children's Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>8. Changes to This Policy</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>9. Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            If you have any questions about this privacy policy, please contact us at:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            Email: gettikiti@gmail.com{'\n'}
            App: Tikiti Event Management
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: Spacing[2],
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing[6],
  },
  lastUpdated: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing[6],
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[6],
    marginBottom: Spacing[3],
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  paragraph: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing[4],
  },
});

export default PrivacyPolicyScreen;
