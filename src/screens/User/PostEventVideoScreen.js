import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import eventMediaService from '../../services/eventMediaService';

// ─── Context-aware prompts ───────────────────────────────────────────────────

const FORMAL_CATEGORIES = [
  'technology', 'business', 'conference', 'seminar', 'workshop',
  'networking', 'finance', 'education', 'health', 'professional',
];

function getUploadPrompt(category = '') {
  const cat = (category || '').toLowerCase();
  const isFormal = FORMAL_CATEGORIES.some((k) => cat.includes(k));
  return isFormal
    ? { title: 'Share a key insight', subtitle: "What's one thing you're taking away from this event?" }
    : { title: 'Capture the vibe', subtitle: "Show people what the energy is like here." };
}

// ─── Event phase helper ──────────────────────────────────────────────────────

function deriveEventPhase(eventDate) {
  const today = new Date().toISOString().split('T')[0];
  if (!eventDate) return 'pre';
  if (eventDate > today) return 'pre';
  if (eventDate === today) return 'live';
  return 'post';
}

// ─── Screen ──────────────────────────────────────────────────────────────────

const PostEventVideoScreen = ({ navigation, route }) => {
  const { event, booking } = route.params;
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [videoUri, setVideoUri] = useState(null);
  const [videoFilename, setVideoFilename] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const prompt = getUploadPrompt(event?.category);

  // ── Video picker ────────────────────────────────────────────────────────────

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to pick a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 120, // 2 minutes max
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setVideoFilename(asset.fileName || asset.uri.split('/').pop() || 'video.mp4');
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!videoUri) {
      Alert.alert('No video selected', 'Please pick a video to upload.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to post a video.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Determine verification level based on booking check-in status
      const verificationLevel = booking?.checkedIn ? 'checked_in' : 'has_ticket';
      const eventPhase = deriveEventPhase(event?.date);

      // Extract city from event location
      let eventCity = '';
      if (event?.location) {
        if (typeof event.location === 'string') {
          eventCity = event.location;
        } else {
          eventCity = event.location.city || event.location.name || event.location.address || '';
        }
      }

      await eventMediaService.uploadAttendeePost(
        videoUri,
        {
          eventId: event.id,
          userId: user.uid,
          bookingId: booking?.id || null,
          caption: caption.trim(),
          eventPhase,
          verificationLevel,
          eventName: event.name || '',
          eventDate: event.date || '',
          eventCategory: event.category || '',
          eventCity,
          organizerId: event.organizerId || '',
          organizationId: event.organizationId || '',
        },
        (pct) => setUploadProgress(pct)
      );

      Alert.alert(
        'Video posted!',
        'Your video has been shared. It will appear in the event feed shortly.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Video upload error:', error);
      Alert.alert('Upload failed', 'Something went wrong uploading your video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
          disabled={uploading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Post Video</Text>
        <TouchableOpacity
          style={[
            styles.headerPost,
            { backgroundColor: videoUri && !uploading ? colors.primary[500] : colors.gray[300] },
          ]}
          onPress={handleSubmit}
          disabled={!videoUri || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.headerPostText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Event context chip */}
        <View style={[styles.eventChip, { backgroundColor: colors.background.secondary }]}>
          <Feather name="calendar" size={14} color={colors.primary[500]} />
          <Text style={[styles.eventChipText, { color: colors.text.secondary }]} numberOfLines={1}>
            {event?.name}
          </Text>
        </View>

        {/* Context-aware prompt */}
        <View style={styles.promptSection}>
          <Text style={[styles.promptTitle, { color: colors.text.primary }]}>{prompt.title}</Text>
          <Text style={[styles.promptSubtitle, { color: colors.text.secondary }]}>{prompt.subtitle}</Text>
        </View>

        {/* Video picker area */}
        <TouchableOpacity
          style={[
            styles.videoPicker,
            {
              backgroundColor: colors.background.secondary,
              borderColor: videoUri ? colors.primary[500] : colors.border.light,
            },
          ]}
          onPress={handlePickVideo}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {videoUri ? (
            <View style={styles.videoSelected}>
              <View style={[styles.videoIconBadge, { backgroundColor: colors.primary[500] }]}>
                <Feather name="check" size={20} color={Colors.white} />
              </View>
              <Text style={[styles.videoFilename, { color: colors.text.primary }]} numberOfLines={1}>
                {videoFilename}
              </Text>
              <Text style={[styles.videoChangeHint, { color: colors.text.tertiary }]}>
                Tap to change
              </Text>
            </View>
          ) : (
            <View style={styles.videoEmpty}>
              <View style={[styles.videoIconBadge, { backgroundColor: colors.background.primary }]}>
                <Feather name="video" size={28} color={colors.primary[500]} />
              </View>
              <Text style={[styles.videoPickerLabel, { color: colors.text.primary }]}>
                Select video from library
              </Text>
              <Text style={[styles.videoPickerHint, { color: colors.text.tertiary }]}>
                Up to 2 minutes
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Upload progress bar */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border.light }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress}%`, backgroundColor: colors.primary[500] },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.text.tertiary }]}>
              Uploading {uploadProgress}%
            </Text>
          </View>
        )}

        {/* Caption input */}
        <View style={[styles.captionContainer, { backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={[styles.captionInput, { color: colors.text.primary }]}
            placeholder={`Add a caption... (optional)`}
            placeholderTextColor={colors.text.tertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={280}
            editable={!uploading}
          />
          <Text style={[styles.captionCount, { color: colors.text.tertiary }]}>
            {caption.length}/280
          </Text>
        </View>

        {/* Verification badge explanation */}
        <View style={[styles.verificationInfo, { backgroundColor: colors.background.secondary }]}>
          <Feather name="shield" size={14} color={colors.primary[500]} />
          <Text style={[styles.verificationInfoText, { color: colors.text.secondary }]}>
            {booking?.checkedIn
              ? 'Your video will be marked as posted by a verified attendee.'
              : 'Your video will be marked as posted by a ticket holder.'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerPost: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  headerPostText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
  },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  eventChipText: {
    fontSize: Typography.fontSize.sm,
    maxWidth: 260,
  },
  promptSection: {
    marginBottom: Spacing[5],
  },
  promptTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  promptSubtitle: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  videoPicker: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    marginBottom: Spacing[4],
  },
  videoEmpty: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  videoSelected: {
    alignItems: 'center',
    gap: Spacing[2],
    width: '100%',
  },
  videoIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  videoPickerLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  videoPickerHint: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  videoFilename: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    maxWidth: '90%',
  },
  videoChangeHint: {
    fontSize: Typography.fontSize.xs,
  },
  progressContainer: {
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  captionContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    minHeight: 80,
  },
  captionInput: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  captionCount: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'right',
    marginTop: Spacing[2],
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
  },
  verificationInfoText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
    lineHeight: 18,
  },
});

export default PostEventVideoScreen;
