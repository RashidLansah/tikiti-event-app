import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { connectionService, bookingService, userService } from '../../services/firestoreService';
import notificationService from '../../services/notificationService';
import { validateSocialCardUrl } from '../../utils/sharingUtils';

const { width, height } = Dimensions.get('window');

const ScanConnectionScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scannedProfile, setScannedProfile] = useState(null);
  const [scannedUserId, setScannedUserId] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  // Request permission on mount if not yet granted
  const ensurePermission = useCallback(async () => {
    if (!permission) return false;
    if (permission.granted) return true;
    const { granted } = await requestPermission();
    return granted;
  }, [permission, requestPermission]);

  const handleBarcodeScanned = async ({ data }) => {
    if (isProcessing) return;

    Vibration.vibrate(100);
    setIsProcessing(true);
    setCameraActive(false);

    try {
      // 1. Parse scanned data
      const result = validateSocialCardUrl(data);

      if (!result.isValid || !result.userId) {
        Alert.alert('Invalid QR Code', 'Not a valid Tikiti QR code.', [
          {
            text: 'Try Again',
            onPress: () => {
              setIsProcessing(false);
              setCameraActive(true);
            },
          },
        ]);
        return;
      }

      // Don't allow scanning yourself
      if (result.userId === user.uid) {
        Alert.alert('Oops', "You can't add yourself as a connection.", [
          {
            text: 'Try Again',
            onPress: () => {
              setIsProcessing(false);
              setCameraActive(true);
            },
          },
        ]);
        return;
      }

      // 2. Fetch scanned user's profile
      const profile = await userService.getProfile(result.userId);

      if (!profile) {
        Alert.alert('User Not Found', 'Could not find this user on Tikiti.', [
          {
            text: 'Try Again',
            onPress: () => {
              setIsProcessing(false);
              setCameraActive(true);
            },
          },
        ]);
        return;
      }

      if (!profile.socialLinks || Object.keys(profile.socialLinks).length === 0) {
        Alert.alert(
          'No Social Links',
          'This user has not set up their social links yet.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsProcessing(false);
                setCameraActive(true);
              },
            },
          ]
        );
        return;
      }

      // 3. Fetch the scanner's events
      const bookings = await bookingService.getUserBookings(user.uid);
      const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

      // Extract unique events
      const eventsMap = {};
      confirmedBookings.forEach((booking) => {
        if (booking.eventId && !eventsMap[booking.eventId]) {
          eventsMap[booking.eventId] = {
            eventId: booking.eventId,
            eventName: booking.eventName || 'Unnamed Event',
            eventDate: booking.eventDate || null,
          };
        }
      });
      const events = Object.values(eventsMap);

      setScannedProfile(profile);
      setScannedUserId(result.userId);
      setUserEvents(events);
      setSelectedEvent(events.length === 1 ? events[0] : null);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert('Error', 'Something went wrong while processing the QR code.', [
        {
          text: 'Try Again',
          onPress: () => {
            setIsProcessing(false);
            setCameraActive(true);
          },
        },
      ]);
    }
  };

  const handleSaveConnection = async () => {
    if (!selectedEvent) {
      Alert.alert('Select Event', 'Please select the event where you met this person.');
      return;
    }

    setSaving(true);

    try {
      await connectionService.saveConnection(user.uid, {
        connectedUserId: scannedUserId,
        connectedUserName:
          scannedProfile.displayName ||
          `${scannedProfile.firstName || ''} ${scannedProfile.lastName || ''}`.trim() ||
          'Unknown',
        connectedUserSocialLinks: scannedProfile.socialLinks,
        eventId: selectedEvent.eventId,
        eventName: selectedEvent.eventName,
        eventDate: selectedEvent.eventDate || null,
      });

      // Send connection notification to both users
      const myName = userProfile?.displayName || user?.displayName || 'Someone';
      const theirName = scannedProfile.displayName ||
        `${scannedProfile.firstName || ''} ${scannedProfile.lastName || ''}`.trim() ||
        'Someone';

      notificationService.sendConnectionMadeNotification(
        user.uid, theirName, selectedEvent.eventName
      ).catch(err => console.warn('Failed to send connection notification:', err));

      notificationService.sendConnectionMadeNotification(
        scannedUserId, myName, selectedEvent.eventName
      ).catch(err => console.warn('Failed to send connection notification:', err));

      Alert.alert('Connection Saved', 'You have successfully saved this connection.', [
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error.message === 'You already saved this connection for this event.'
          ? error.message
          : 'Failed to save connection. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDismissConfirmation = () => {
    setShowConfirmation(false);
    setScannedProfile(null);
    setScannedUserId(null);
    setSelectedEvent(null);
    setIsProcessing(false);
    setCameraActive(true);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getDisplayName = (profile) => {
    return (
      profile?.displayName ||
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
      'Unknown'
    );
  };

  const renderSocialLinksPreview = (socialLinks) => {
    if (!socialLinks) return null;
    const items = [];

    if (socialLinks.instagram) {
      items.push(
        <View key="instagram" style={styles.previewLinkRow}>
          <FontAwesome name="instagram" size={16} color={colors.text.tertiary} />
          <Text style={[styles.previewLinkText, { color: colors.text.secondary }]}>
            @{socialLinks.instagram}
          </Text>
        </View>
      );
    }
    if (socialLinks.twitter) {
      items.push(
        <View key="twitter" style={styles.previewLinkRow}>
          <FontAwesome name="twitter" size={16} color={colors.text.tertiary} />
          <Text style={[styles.previewLinkText, { color: colors.text.secondary }]}>
            @{socialLinks.twitter}
          </Text>
        </View>
      );
    }
    if (socialLinks.linkedin) {
      items.push(
        <View key="linkedin" style={styles.previewLinkRow}>
          <FontAwesome name="linkedin" size={16} color={colors.text.tertiary} />
          <Text style={[styles.previewLinkText, { color: colors.text.secondary }]}>
            {socialLinks.linkedin}
          </Text>
        </View>
      );
    }
    if (socialLinks.phone) {
      items.push(
        <View key="phone" style={styles.previewLinkRow}>
          <Feather name="phone" size={16} color={colors.text.tertiary} />
          <Text style={[styles.previewLinkText, { color: colors.text.secondary }]}>
            {socialLinks.phone}
          </Text>
        </View>
      );
    }

    return <View style={styles.previewLinksContainer}>{items}</View>;
  };

  // Permission not yet loaded
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={64} color={colors.text.disabled} />
          <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionSubtitle, { color: colors.text.tertiary }]}>
            We need access to your camera to scan QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary[500] }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backLinkText, { color: colors.text.tertiary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.black }]}>
      {/* Camera */}
      {cameraActive && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanInstruction}>
            Point your camera at a Tikiti social card QR code
          </Text>
        </View>
      </View>

      {/* Processing indicator */}
      {isProcessing && !showConfirmation && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}

      {/* Confirmation modal */}
      <Modal
        visible={showConfirmation}
        animationType="slide"
        transparent={true}
        onRequestClose={handleDismissConfirmation}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close button */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleDismissConfirmation}
              >
                <Feather name="x" size={24} color={colors.text.tertiary} />
              </TouchableOpacity>

              {/* Scanned user info */}
              <View style={styles.confirmationHeader}>
                <View style={[styles.confirmAvatar, { backgroundColor: colors.primary[500] }]}>
                  <Text style={styles.confirmAvatarText}>
                    {getInitials(getDisplayName(scannedProfile))}
                  </Text>
                </View>
                <Text style={[styles.confirmName, { color: colors.text.primary }]}>
                  {getDisplayName(scannedProfile)}
                </Text>
              </View>

              {/* Social links preview */}
              {scannedProfile && renderSocialLinksPreview(scannedProfile.socialLinks)}

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

              {/* Event selection */}
              <Text style={[styles.selectLabel, { color: colors.text.primary }]}>
                Select Event
              </Text>
              <Text style={[styles.selectHint, { color: colors.text.tertiary }]}>
                Choose the event where you met this person
              </Text>

              {userEvents.length === 0 ? (
                <View style={[styles.noEventsBox, { backgroundColor: colors.background.tertiary }]}>
                  <Feather name="calendar" size={24} color={colors.text.disabled} />
                  <Text style={[styles.noEventsText, { color: colors.text.tertiary }]}>
                    No registered events found. Book an event first to save connections.
                  </Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {userEvents.map((evt) => {
                    const isSelected = selectedEvent?.eventId === evt.eventId;
                    return (
                      <TouchableOpacity
                        key={evt.eventId}
                        style={[
                          styles.eventOption,
                          {
                            backgroundColor: isSelected
                              ? isDarkMode
                                ? colors.primary[200]
                                : Colors.primary[50]
                              : colors.background.secondary,
                            borderColor: isSelected
                              ? colors.primary[500]
                              : colors.border.medium,
                          },
                        ]}
                        onPress={() => setSelectedEvent(evt)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={20}
                          color={isSelected ? colors.primary[500] : colors.text.disabled}
                        />
                        <View style={styles.eventOptionText}>
                          <Text
                            style={[
                              styles.eventOptionName,
                              { color: colors.text.primary },
                            ]}
                            numberOfLines={1}
                          >
                            {evt.eventName}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Save button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary[500],
                    opacity: !selectedEvent || saving || userEvents.length === 0 ? 0.5 : 1,
                  },
                ]}
                onPress={handleSaveConnection}
                disabled={!selectedEvent || saving || userEvents.length === 0}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="user-plus" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Save Connection</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SCAN_FRAME_SIZE = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Camera header
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Scan frame
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanInstruction: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[8],
  },

  // Processing overlay
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing[4],
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[10],
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing[6],
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[8],
  },
  permissionButton: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  permissionButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  backLink: {
    marginTop: Spacing[4],
    padding: Spacing[3],
  },
  backLinkText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  confirmationCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    maxHeight: height * 0.8,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: Spacing[1],
  },

  // Confirmation header
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  confirmAvatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
    ...Shadows.md,
  },
  confirmAvatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  confirmName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
  },

  // Social links preview
  previewLinksContainer: {
    gap: 10,
    marginBottom: Spacing[5],
  },
  previewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing[4],
  },
  previewLinkText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginBottom: Spacing[5],
  },

  // Event selection
  selectLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  selectHint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing[4],
  },
  noEventsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    gap: 12,
    marginBottom: Spacing[5],
  },
  noEventsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  eventsList: {
    gap: 10,
    marginBottom: Spacing[6],
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  eventOptionText: {
    flex: 1,
  },
  eventOptionName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.medium,
  },

  // Save button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default ScanConnectionScreen;
