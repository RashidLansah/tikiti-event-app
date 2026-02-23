import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Feather, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

const EditSocialLinksScreen = ({ navigation }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { isDarkMode, colors } = useTheme();

  const [instagram, setInstagram] = useState(userProfile?.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(userProfile?.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(userProfile?.socialLinks?.linkedin || '');
  const [phone, setPhone] = useState(userProfile?.socialLinks?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        socialLinks: {
          instagram: instagram.trim(),
          twitter: twitter.trim(),
          linkedin: linkedin.trim(),
          phone: phone.trim(),
        },
      });
      Alert.alert('Success', 'Your social links have been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your social links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = ({ icon, iconFamily, prefixHint, placeholder, value, onChangeText, keyboardType }) => {
    const IconComponent = iconFamily === 'FontAwesome' ? FontAwesome : Feather;

    return (
      <View style={[styles.inputRow, { backgroundColor: colors.background.secondary, borderColor: colors.border.medium }]}>
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? colors.gray[200] : Colors.gray[100] }]}>
          <IconComponent name={icon} size={18} color={colors.text.secondary} />
        </View>
        {prefixHint ? (
          <Text style={[styles.prefixHint, { color: colors.text.tertiary }]}>{prefixHint}</Text>
        ) : null}
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Edit Social Links</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Description */}
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            Add your social links so others can connect with you. These will appear on your social card.
          </Text>

          {/* Instagram */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Instagram</Text>
            {renderInputField({
              icon: 'instagram',
              iconFamily: 'Feather',
              prefixHint: '@',
              placeholder: 'username',
              value: instagram,
              onChangeText: setInstagram,
            })}
          </View>

          {/* X / Twitter */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>X / Twitter</Text>
            {renderInputField({
              icon: 'twitter',
              iconFamily: 'FontAwesome',
              prefixHint: '@',
              placeholder: 'username',
              value: twitter,
              onChangeText: setTwitter,
            })}
          </View>

          {/* LinkedIn */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>LinkedIn</Text>
            {renderInputField({
              icon: 'linkedin',
              iconFamily: 'FontAwesome',
              prefixHint: 'linkedin.com/in/',
              placeholder: 'profile-slug',
              value: linkedin,
              onChangeText: setLinkedin,
            })}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Phone</Text>
            {renderInputField({
              icon: 'phone',
              iconFamily: 'Feather',
              prefixHint: null,
              placeholder: '+233 XX XXX XXXX',
              value: phone,
              onChangeText: setPhone,
              keyboardType: 'phone-pad',
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing[6],
    paddingBottom: Spacing[12],
  },
  description: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    marginBottom: Spacing[6],
  },
  fieldGroup: {
    marginBottom: Spacing[5],
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  prefixHint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    paddingLeft: Spacing[3],
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[6],
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default EditSocialLinksScreen;
