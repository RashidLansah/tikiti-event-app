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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/designSystem';
import eventMediaService from '../../services/eventMediaService';

// ─── Context-aware prompts ───────────────────────────────────────────────────

const FORMAL_CATEGORIES = [
  'technology', 'business', 'conference', 'seminar', 'workshop',
  'networking', 'finance', 'education', 'health', 'professional',
];

function getUploadPrompt(category = '', mediaType = 'photo') {
  const cat = (category || '').toLowerCase();
  const isFormal = FORMAL_CATEGORIES.some((k) => cat.includes(k));
  if (mediaType === 'photo') {
    return isFormal
      ? { title: 'Capture the moment', subtitle: 'Share a photo from this event.' }
      : { title: 'Show the vibe', subtitle: "A picture speaks a thousand words — what's the energy like?" };
  }
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
  const { colors } = useTheme();

  const [mediaType, setMediaType] = useState('photo'); // 'photo' | 'video'
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaFilename, setMediaFilename] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const prompt = getUploadPrompt(event?.category, mediaType);

  // ── Media picker ────────────────────────────────────────────────────────────

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to pick media.');
      return;
    }

    const options =
      mediaType === 'photo'
        ? {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.85,
          }
        : {
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
            videoMaxDuration: 120,
          };

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaFilename(asset.fileName || asset.uri.split('/').pop() || (mediaType === 'photo' ? 'photo.jpg' : 'video.mp4'));
    }
  };

  // ── Switch media type ────────────────────────────────────────────────────────

  const handleSwitchType = (type) => {
    if (type === mediaType) return;
    setMediaType(type);
    setMediaUri(null);
    setMediaFilename('');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!mediaUri) {
      Alert.alert('Nothing selected', `Please pick a ${mediaType} to upload.`);
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to post.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const verificationLevel = booking?.checkedIn ? 'checked_in' : 'has_ticket';
      const eventPhase = deriveEventPhase(event?.date);

      let eventCity = '';
      if (event?.location) {
        eventCity = typeof event.location === 'string'
          ? event.location
          : event.location.city || event.location.name || event.location.address || '';
      }

      await eventMediaService.uploadAttendeePost(
        mediaUri,
        {
          eventId: event.id,
          userId: user.uid,
          bookingId: booking?.id || null,
          caption: caption.trim(),
          eventPhase,
          verificationLevel,
          mediaType,
          eventName: event.name || '',
          eventDate: event.date || '',
          eventCategory: event.category || '',
          eventCity,
          organizerId: event.organizerId || '',
          organizationId: event.organizationId || '',
        },
        (pct) => setUploadProgress(pct)
      );

      const label = mediaType === 'photo' ? 'Photo shared!' : 'Video posted!';
      const body = mediaType === 'photo'
        ? 'Your photo has been shared. It will appear in the event feed shortly.'
        : 'Your video has been shared. It will appear in the event feed shortly.';

      Alert.alert(label, body, [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Media upload error:', error);
      Alert.alert('Upload failed', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isReady = !!mediaUri && !uploading;

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
        <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Typography.fontFamily.semibold }]}>
          Share Moment
        </Text>
        <TouchableOpacity
          style={[styles.headerPost, { backgroundColor: isReady ? colors.primary[500] : colors.gray[300] }]}
          onPress={handleSubmit}
          disabled={!isReady}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={[styles.headerPostText, { fontFamily: Typography.fontFamily.semibold }]}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Event chip */}
        <View style={[styles.eventChip, { backgroundColor: colors.background.secondary }]}>
          <Feather name="calendar" size={14} color={colors.primary[500]} />
          <Text style={[styles.eventChipText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>
            {event?.name}
          </Text>
        </View>

        {/* Photo / Video toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.background.secondary }]}>
          {[
            { type: 'photo', icon: 'image', label: 'Photo' },
            { type: 'video', icon: 'video', label: 'Video' },
          ].map(({ type, icon, label }) => {
            const active = mediaType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeTab,
                  active && { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => handleSwitchType(type)}
                activeOpacity={0.75}
              >
                <Feather name={icon} size={15} color={active ? Colors.white : colors.text.secondary} />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: active ? Colors.white : colors.text.secondary,
                      fontFamily: active ? Typography.fontFamily.bold : Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Context-aware prompt */}
        <View style={styles.promptSection}>
          <Text style={[styles.promptTitle, { color: colors.text.primary, fontFamily: Typography.fontFamily.bold }]}>
            {prompt.title}
          </Text>
          <Text style={[styles.promptSubtitle, { color: colors.text.secondary, fontFamily: Typography.fontFamily.regular }]}>
            {prompt.subtitle}
          </Text>
        </View>

        {/* Media picker area */}
        <TouchableOpacity
          style={[
            styles.mediaPicker,
            {
              backgroundColor: colors.background.secondary,
              borderColor: mediaUri ? colors.primary[500] : colors.border.light,
            },
          ]}
          onPress={handlePickMedia}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {mediaUri ? (
            mediaType === 'photo' ? (
              // Photo preview
              <View style={styles.previewContainer}>
                <Image source={{ uri: mediaUri }} style={styles.photoPreview} resizeMode="cover" />
                <View style={[styles.changeOverlay]}>
                  <Feather name="edit-2" size={14} color={Colors.white} />
                  <Text style={[styles.changeOverlayText, { fontFamily: Typography.fontFamily.medium }]}>Tap to change</Text>
                </View>
              </View>
            ) : (
              // Video selected state
              <View style={styles.mediaSelected}>
                <View style={[styles.mediaIconBadge, { backgroundColor: colors.primary[500] }]}>
                  <Feather name="check" size={20} color={Colors.white} />
                </View>
                <Text style={[styles.mediaFilename, { color: colors.text.primary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>
                  {mediaFilename}
                </Text>
                <Text style={[styles.mediaChangeHint, { color: colors.text.tertiary, fontFamily: Typography.fontFamily.regular }]}>
                  Tap to change
                </Text>
              </View>
            )
          ) : (
            // Empty state
            <View style={styles.mediaEmpty}>
              <View style={[styles.mediaIconBadge, { backgroundColor: colors.background.primary }]}>
                <Feather name={mediaType === 'photo' ? 'image' : 'video'} size={28} color={colors.primary[500]} />
              </View>
              <Text style={[styles.mediaPickerLabel, { color: colors.text.primary, fontFamily: Typography.fontFamily.medium }]}>
                {mediaType === 'photo' ? 'Select a photo' : 'Select a video'}
              </Text>
              <Text style={[styles.mediaPickerHint, { color: colors.text.tertiary, fontFamily: Typography.fontFamily.regular }]}>
                {mediaType === 'photo' ? 'From your library' : 'Up to 2 minutes'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Upload progress bar */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border.light }]}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%`, backgroundColor: colors.primary[500] }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.text.tertiary, fontFamily: Typography.fontFamily.regular }]}>
              Uploading {uploadProgress}%
            </Text>
          </View>
        )}

        {/* Caption input */}
        <View style={[styles.captionContainer, { backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={[styles.captionInput, { color: colors.text.primary, fontFamily: Typography.fontFamily.regular }]}
            placeholder="Add a caption... (optional)"
            placeholderTextColor={colors.text.tertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={280}
            editable={!uploading}
          />
          <Text style={[styles.captionCount, { color: colors.text.tertiary, fontFamily: Typography.fontFamily.regular }]}>
            {caption.length}/280
          </Text>
        </View>

        {/* Verification note */}
        <View style={[styles.verificationInfo, { backgroundColor: colors.background.secondary }]}>
          <Feather name="shield" size={14} color={colors.primary[500]} />
          <Text style={[styles.verificationInfoText, { color: colors.text.secondary, fontFamily: Typography.fontFamily.regular }]}>
            {booking?.checkedIn
              ? 'Your post will be marked as shared by a verified attendee.'
              : 'Your post will be marked as shared by a ticket holder.'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  },
  scroll: { flex: 1 },
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
    marginBottom: Spacing[4],
  },
  eventChipText: {
    fontSize: Typography.fontSize.sm,
    maxWidth: 260,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing[5],
    alignSelf: 'flex-start',
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  typeLabel: {
    fontSize: Typography.fontSize.sm,
  },
  promptSection: {
    marginBottom: Spacing[5],
  },
  promptTitle: {
    fontSize: Typography.fontSize.xl,
    marginBottom: Spacing[1],
  },
  promptSubtitle: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  mediaPicker: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: Spacing[4],
    overflow: 'hidden',
  },
  mediaEmpty: {
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[6],
  },
  mediaSelected: {
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[6],
    width: '100%',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  changeOverlayText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
  },
  mediaIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  mediaPickerLabel: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  mediaPickerHint: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  mediaFilename: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    maxWidth: '90%',
  },
  mediaChangeHint: {
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
