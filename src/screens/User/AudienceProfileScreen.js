import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import {
  userProfileService,
  INTEREST_TAGS,
  INDUSTRY_OPTIONS,
} from '../../services/userProfileService';

const AudienceProfileScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [interests, setInterests] = useState([]);
  const [profession, setProfession] = useState('');
  const [industry, setIndustry] = useState('');
  const [allowOrganizerContact, setAllowOrganizerContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (userProfile) {
      setInterests(userProfile.interests || []);
      setProfession(userProfile.profession || '');
      setIndustry(userProfile.industry || '');
      setAllowOrganizerContact(userProfile.allowOrganizerContact ?? false);
    }
  }, [userProfile]);

  const toggleInterest = (tag) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await userProfileService.updateInterests(user.uid, {
        interests,
        profession,
        industry,
      });
      await userProfileService.updateConsent(user.uid, allowOrganizerContact);
      Alert.alert('Saved', 'Your event preferences have been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const bg = isDarkMode ? colors.background.primary : Colors.background?.primary || '#fefff7';
  const cardBg = isDarkMode ? colors.background.secondary : '#fff';
  const textPrimary = colors.text.primary;
  const textSecondary = colors.text.secondary;
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Event Preferences</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary?.[500] || '#333'} />
          ) : (
            <Text style={[styles.saveBtnText, { color: Colors.primary?.[500] || '#333' }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f0f8ff' }]}>
          <Feather name="info" size={16} color={Colors.primary?.[500] || '#333'} style={{ marginTop: 2 }} />
          <Text style={[styles.infoText, { color: textSecondary }]}>
            This helps us show you events you'll actually care about — and lets organisers find the right audience for their events.
          </Text>
        </View>

        {/* Profession */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Profession</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: textPrimary,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
                borderColor,
              },
            ]}
            placeholder="e.g. Product Designer, Software Engineer, Founder"
            placeholderTextColor={textSecondary}
            value={profession}
            onChangeText={setProfession}
            returnKeyType="done"
          />
        </View>

        {/* Industry */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Industry</Text>
          <TouchableOpacity
            style={[
              styles.picker,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
                borderColor,
              },
            ]}
            onPress={() => setShowIndustryPicker(!showIndustryPicker)}
          >
            <Text style={[styles.pickerValue, { color: industry ? textPrimary : textSecondary }]}>
              {industry || 'Select your industry'}
            </Text>
            <Feather name={showIndustryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={textSecondary} />
          </TouchableOpacity>

          {showIndustryPicker && (
            <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
              {INDUSTRY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: borderColor },
                    industry === opt && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f8ff' },
                  ]}
                  onPress={() => {
                    setIndustry(opt);
                    setShowIndustryPicker(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: textPrimary }]}>{opt}</Text>
                  {industry === opt && (
                    <Feather name="check" size={16} color={Colors.primary?.[500] || '#333'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Interests */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Event Interests</Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Select all that apply
          </Text>
          <View style={styles.tagGrid}>
            {INTEREST_TAGS.map((tag) => {
              const selected = interests.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleInterest(tag)}
                  style={[
                    styles.tag,
                    selected
                      ? { backgroundColor: Colors.primary?.[500] || '#333' }
                      : {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
                          borderColor,
                          borderWidth: 1,
                        },
                  ]}
                >
                  {selected && (
                    <Feather name="check" size={12} color="#fff" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    style={[
                      styles.tagText,
                      { color: selected ? '#fff' : textPrimary },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Consent */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.consentRow}>
            <View style={styles.consentTextBlock}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Allow organisers to reach me
              </Text>
              <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                Organisers can send you personalised event invitations based on your interests. You can turn this off at any time.
              </Text>
            </View>
            <Switch
              value={allowOrganizerContact}
              onValueChange={setAllowOrganizerContact}
              trackColor={{ false: Colors.gray?.[300] || '#ccc', true: Colors.primary?.[200] || '#aaa' }}
              thumbColor={allowOrganizerContact ? (Colors.primary?.[500] || '#333') : (Colors.gray?.[400] || '#888')}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
  },
  saveBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  saveBtnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
  },
  scroll: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    padding: Spacing[5],
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing[3],
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
  },
  picker: {
    height: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  dropdownList: {
    marginTop: Spacing[2],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 99,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '500',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[4],
  },
  consentTextBlock: {
    flex: 1,
  },
  saveButton: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    backgroundColor: Colors.primary?.[500] || '#333',
    paddingVertical: Spacing[4],
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AudienceProfileScreen;
