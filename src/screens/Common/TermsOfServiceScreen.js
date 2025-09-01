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

const TermsOfServiceScreen = ({ navigation }) => {
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
        <Text style={[styles.title, { color: colors.text.primary }]}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.lastUpdated, { color: colors.text.tertiary }]}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            By accessing and using Tikiti, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>2. Description of Service</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            Tikiti is an event management platform that allows users to create, discover, and attend events. The service includes features for event creation, ticket management, attendee tracking, and event discovery.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>3. User Accounts</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            To use certain features of our service, you must create an account. You are responsible for:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Providing accurate and complete information{'\n'}
            • Maintaining the security of your account{'\n'}
            • All activities that occur under your account{'\n'}
            • Notifying us of any unauthorized use
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>4. User Conduct</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            You agree not to use the service to:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Violate any laws or regulations{'\n'}
            • Infringe on the rights of others{'\n'}
            • Post false, misleading, or fraudulent content{'\n'}
            • Spam or send unsolicited communications{'\n'}
            • Interfere with the service's operation{'\n'}
            • Create events for illegal or harmful purposes
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>5. Event Creation and Management</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            As an event organizer, you are responsible for:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • Providing accurate event information{'\n'}
            • Complying with all applicable laws and regulations{'\n'}
            • Managing attendee expectations{'\n'}
            • Handling refunds and cancellations appropriately{'\n'}
            • Ensuring event safety and security
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>6. Payments and Refunds</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • All payments are processed securely through third-party payment providers{'\n'}
            • Refund policies are determined by individual event organizers{'\n'}
            • We are not responsible for payment disputes between organizers and attendees{'\n'}
            • Service fees may apply to certain transactions
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>7. Intellectual Property</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            • You retain ownership of content you create and share{'\n'}
            • You grant us a license to use your content to provide our services{'\n'}
            • You may not use our trademarks or intellectual property without permission{'\n'}
            • We respect the intellectual property rights of others
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>8. Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>9. Disclaimers</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or secure. We are not responsible for the content, quality, or safety of events created by users.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>10. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>11. Termination</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We may terminate or suspend your account at any time for violations of these terms. You may also terminate your account at any time by contacting us.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>12. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>13. Governing Law</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            These terms shall be governed by and construed in accordance with the laws of Ghana, without regard to conflict of law principles.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>14. Contact Information</Text>
          <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
            If you have any questions about these terms, please contact us at:
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
  paragraph: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing[4],
  },
});

export default TermsOfServiceScreen;
