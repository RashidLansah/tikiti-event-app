import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const EmptyOrganiserScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.gray[200] }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Organiser Dashboard</Text>
      </View>

      {/* Empty State */}
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary[50] }]}>
          <Feather name="calendar" size={48} color={colors.primary[500]} />
        </View>
        
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          Welcome to Organiser Mode!
        </Text>
        
        <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
          You're now an organiser! Start creating amazing events and managing your attendees.
        </Text>

        <TouchableOpacity
          style={[styles.createEventButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Feather name="plus" size={20} color={colors.white} />
          <Text style={[styles.createEventButtonText, { color: colors.white }]}>
            Create Your First Event
          </Text>
        </TouchableOpacity>

        {/* Quick Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.tipsTitle, { color: colors.text.primary }]}>Quick Tips</Text>
          
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.success[500]} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Create detailed event descriptions to attract more attendees
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.success[500]} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Set clear pricing and ticket limits for better management
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.success[500]} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Use high-quality images to make your events stand out
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.success[500]} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Keep your event information up to date
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[12],
    alignItems: 'center',
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[8],
    ...Shadows.medium,
  },
  createEventButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginLeft: Spacing[2],
  },
  tipsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    width: '100%',
    marginTop: Spacing[4],
  },
  tipsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  tipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginLeft: Spacing[3],
    flex: 1,
    lineHeight: 20,
  },
});

export default EmptyOrganiserScreen;
