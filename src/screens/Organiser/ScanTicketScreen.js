import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Animated,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { bookingService } from '../../services/firestoreService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import logger from '../../utils/logger';

const { width, height } = Dimensions.get('window');

const ScanTicketScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedTickets, setScannedTickets] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    scannedToday: 0,
    valid: 0,
    invalid: 0,
  });
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Load today's scanned tickets
  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      // In a real implementation, you'd fetch today's scanned tickets from Firebase
      // For now, we'll use local state
      const today = new Date().toDateString();
      const todayScanned = scannedTickets.filter(ticket => 
        new Date(ticket.scannedAt).toDateString() === today
      );
      
      setStats({
        scannedToday: todayScanned.length,
        valid: todayScanned.filter(t => t.isValid).length,
        invalid: todayScanned.filter(t => !t.isValid).length,
      });
    } catch (error) {
      logger.error('Error loading stats:', error);
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnimation.stopAnimation();
    scanAnimation.setValue(0);
  };

  const handleStartScan = async () => {
    logger.log('🎯 Starting scan process...');
    logger.log('📋 Permission status:', permission);
    
    if (!permission) {
      logger.log('❌ No permission object found');
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
      return;
    }
    
    if (!permission.granted) {
      logger.log('📱 Requesting camera permission...');
      const { granted } = await requestPermission();
      logger.log('✅ Permission granted:', granted);
      if (!granted) {
        Alert.alert('No Access', 'No access to camera. Please enable camera permission in settings.');
        return;
      }
    }
    
    logger.log('✅ Camera permission confirmed');
    setIsScanning(true);
    setScanResult(null);
    setIsProcessing(false);
    startScanAnimation();
    logger.log('📸 Camera should be opening...');
    logger.log('🔄 States: isScanning=true, isProcessing=false');
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    logger.log('🔍 BARCODE SCAN EVENT TRIGGERED!');
    logger.log('📱 Barcode type:', type);
    logger.log('📱 QR Code data:', data);
    logger.log('📱 Data length:', data?.length);
    logger.log('📱 Is processing:', isProcessing);
    
    if (isProcessing) {
      logger.log('⏳ Already processing, ignoring scan');
      return; // Prevent multiple scans
    }
    
    // Provide haptic feedback
    Vibration.vibrate(100);
    logger.log('✅ Vibration triggered');
    
    setIsProcessing(true);
      setIsScanning(false);
    stopScanAnimation();
    logger.log('🔄 States updated: processing=true, scanning=false');
    
    try {
      // Parse the QR code data
      logger.log('🔍 Raw QR data received:', data);
      
      let ticketData;
      try {
        ticketData = JSON.parse(data);
        logger.log('✅ Successfully parsed JSON:', ticketData);
      } catch (parseError) {
        logger.log('❌ JSON parse failed, trying other formats:', parseError.message);
        logger.log('📝 Raw data:', data);
        
        // Try pipe-separated format: "SIMPLE123|Test Event|Test User|test-booking-123|confirmed"
        if (data.includes('|')) {
          logger.log('🔍 Trying pipe-separated format');
          const parts = data.split('|');
          if (parts.length >= 5) {
            ticketData = {
              ticketId: parts[0],
              eventName: parts[1],
              userName: parts[2],
              purchaseId: parts[3],
              status: parts[4]
            };
            logger.log('✅ Successfully parsed pipe format:', ticketData);
          } else {
            logger.log('❌ Invalid pipe format - not enough parts');
          }
        }
        
        // Try minimal format (just ticket ID)
        else if (data.length < 50 && !data.includes(' ')) {
          logger.log('🔍 Trying minimal format (ticket ID only)');
          ticketData = {
            ticketId: data,
            eventName: 'Unknown Event',
            userName: 'Unknown User',
            purchaseId: 'test-booking-123', // Use test booking for minimal format
            status: 'confirmed'
          };
          logger.log('✅ Successfully parsed minimal format:', ticketData);
        }
        
        // If all parsing fails
        else {
          setScanResult({
            ticketId: 'UNKNOWN-FORMAT',
            eventName: 'Unknown Format',
            attendeeName: 'Raw Data: ' + data.substring(0, 50),
            isValid: false,
            error: 'QR code format not recognized',
          });
          return;
        }
      }
      
      // Validate ticket in Firebase
      const isValid = await validateTicket(ticketData);
      
      const scanResult = {
        ticketId: ticketData.ticketId || ticketData.bookingReference,
        eventName: ticketData.eventName,
        attendeeName: ticketData.attendeeName || ticketData.userName,
        userId: ticketData.userId,
        purchaseId: ticketData.purchaseId,
        quantity: ticketData.quantity || 1,
        isValid: isValid,
        scannedAt: new Date().toISOString(),
        rawData: ticketData,
      };
      
      // Update scanned tickets list
      setScannedTickets(prev => [...prev, scanResult]);
      setScanResult(scanResult);
      
      // Update stats
      loadTodayStats();
      
      // If valid, mark ticket as used and notify attendee
      if (isValid) {
        await markTicketAsUsed(ticketData.purchaseId);

        // Send check-in confirmation push notification to attendee
        if (ticketData.userId) {
          notificationService.sendCheckInConfirmation(
            ticketData.userId,
            ticketData.eventName || 'the event',
            ticketData.eventId || ''
          ).catch(err => console.warn('Failed to send check-in notification:', err));
        }
      }
      
    } catch (error) {
      logger.error('Error processing QR code:', error);
      setScanResult({
        ticketId: 'INVALID',
        eventName: 'Unknown Event',
        attendeeName: 'Unknown',
        isValid: false,
        error: 'Invalid QR code format',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateTicket = async (ticketData) => {
    try {
      logger.log('🎫 Validating ticket data:', ticketData);
      
      // Check if required fields exist
      if (!ticketData.purchaseId) {
        logger.log('❌ No purchaseId found in ticket data');
        return false;
      }
      
      logger.log('🔍 Looking up booking:', ticketData.purchaseId);
      
      // Check if booking exists and is valid
      const booking = await bookingService.getById(ticketData.purchaseId);
      logger.log('📋 Booking found:', booking);
      
      if (!booking) {
        logger.log('❌ Booking not found');
        return false; // Booking doesn't exist
      }
      
      if (booking.status === 'used') {
        logger.log('❌ Ticket already used');
        return false; // Already used
      }
      
      if (booking.status !== 'confirmed') {
        logger.log('❌ Booking not confirmed, status:', booking.status);
        return false; // Not confirmed
      }
      
      // Check if event date is today or in the future (allow future events)
      if (booking.eventDate) {
        const eventDate = new Date(booking.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
          logger.log('❌ Event date has passed');
          return false; // Event date has passed
        }
      }
      
      logger.log('✅ Ticket validation successful');
      return true;
    } catch (error) {
      logger.error('❌ Error validating ticket:', error);
      logger.error('❌ Error details:', error.message);
      return false;
    }
  };

  const markTicketAsUsed = async (purchaseId) => {
    try {
      logger.log('🏷️ Marking ticket as used:', purchaseId);
      
      if (!purchaseId) {
        logger.log('❌ No purchaseId provided');
        return;
      }
      
      await bookingService.update(purchaseId, {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedBy: user?.uid,
      });
      logger.log('✅ Ticket marked as used successfully:', purchaseId);
    } catch (error) {
      logger.error('❌ Error marking ticket as used:', error);
      logger.error('❌ Error details:', error.message);
    }
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Ticket Entry',
      'Enter ticket ID:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Verify',
          onPress: (ticketId) => {
            if (ticketId) {
              const mockResult = {
                ticketId: ticketId,
                eventName: 'Music Festival 2025',
                attendeeName: 'Jane Smith',
                seatNumber: 'B-22',
                isValid: true,
              };
              setScanResult(mockResult);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderScanArea = () => {
    if (isScanning) {
      return (
        <Modal
          visible={isScanning}
          animationType="slide"
          onRequestClose={() => setIsScanning(false)}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'aztec', 'ean13', 'ean8', 'code39', 'code128', 'code93', 'codabar', 'itf14', 'datamatrix', 'upc_e', 'upc_a'],
              }}
              enableTorch={false}
            />
            
            {/* Overlay positioned absolutely to avoid CameraView children warning */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 100],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              
              <Text style={styles.scanInstruction}>
                Point camera at QR code to scan ticket
              </Text>
              
              <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>🔍 Scanner Active</Text>
                  <Text style={styles.debugText}>📱 Looking for QR codes...</Text>
                  <Text style={styles.debugText}>💡 Try different angles & distances</Text>
                </View>
                

                
              <TouchableOpacity
                style={styles.closeCameraButton}
                onPress={() => {
                  setIsScanning(false);
                  stopScanAnimation();
                  logger.log('❌ Camera closed by user');
                }}
              >
                <Feather name="x" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    return (
    <View style={styles.scanArea}>
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
      
      <Text style={styles.scanInstruction}>
          Tap "Start Scan" to begin scanning QR codes
      </Text>
    </View>
  );
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <View style={styles.resultContainer}>
        <View style={[
          styles.resultHeader,
          { backgroundColor: scanResult.isValid ? Colors.success[50] : Colors.error[50] }
        ]}>
      <View style={[
            styles.resultIconContainer,
            { backgroundColor: scanResult.isValid ? Colors.success[500] : Colors.error[500] }
      ]}>
          <Feather
              name={scanResult.isValid ? "check" : "x"}
            size={24}
              color={Colors.white}
          />
          </View>
          <View style={styles.resultHeaderText}>
          <Text style={[
            styles.resultTitle,
              { color: scanResult.isValid ? Colors.success[600] : Colors.error[600] }
          ]}>
            {scanResult.isValid ? 'Valid Ticket' : 'Invalid Ticket'}
          </Text>
            <Text style={styles.resultSubtitle}>
              {scanResult.isValid ? 'Entry Granted' : 'Access Denied'}
            </Text>
          </View>
        </View>
        
        <View style={styles.resultBody}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Ticket ID</Text>
          <Text style={styles.resultValue}>{scanResult.ticketId}</Text>
        </View>
        
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Event</Text>
          <Text style={styles.resultValue}>{scanResult.eventName}</Text>
        </View>
        
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Attendee</Text>
          <Text style={styles.resultValue}>{scanResult.attendeeName}</Text>
        </View>
        
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Seat</Text>
            <Text style={styles.resultValue}>{scanResult.seatNumber || 'General Admission'}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.nextScanButton}
          onPress={() => setScanResult(null)}
        >
          <Feather name="refresh-cw" size={16} color={Colors.primary[500]} />
            <Text style={styles.nextScanButtonText}>Scan Next Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Ticket Scanner</Text>
          <Text style={styles.subtitle}>Verify attendee tickets</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {renderScanArea()}
      
      {renderScanResult()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, (isScanning || isProcessing) && styles.disabledButton]}
          onPress={handleStartScan}
          disabled={isScanning || isProcessing}
        >
          <View style={styles.buttonIconContainer}>
            <Feather 
              name={isScanning ? "search" : "camera"} 
              size={24} 
              color="white" 
            />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.primaryButtonText}>
              {isScanning ? 'Scanning QR Code...' : isProcessing ? 'Processing Ticket...' : 'Scan QR Code'}
            </Text>
            <Text style={styles.primaryButtonSubtext}>
              {isScanning ? 'Point camera at ticket' : 'Tap to open camera scanner'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, (isScanning || isProcessing) && styles.disabledSecondaryButton]}
          onPress={handleManualEntry}
          disabled={isScanning || isProcessing}
        >
          <View style={[styles.buttonIconContainer, styles.secondaryButtonIconContainer]}>
            <Feather name="edit-3" size={20} color={Colors.primary[500]} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.secondaryButtonText}>Manual Entry</Text>
            <Text style={styles.secondaryButtonSubtext}>Enter ticket ID manually</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.scannedToday}</Text>
          <Text style={styles.statLabel}>Scanned Today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.valid}</Text>
          <Text style={styles.statLabel}>Valid</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.invalid}</Text>
          <Text style={styles.statLabel}>Invalid</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Shadows.sm,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary[300],
  },
  headerContent: {
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Colors.primary[800],
    margin: 20,
    borderRadius: 16,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary[500],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    top: 125,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.success[500],
  },
  scanInstruction: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 20,
    textAlign: 'center',
  },
  resultContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.text.primary,
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    color: Colors.text.tertiary,
  },
  nextScanButton: {
    backgroundColor: Colors.primary[500],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextScanButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanningButton: {
    backgroundColor: Colors.secondary[600],
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  manualButton: {
    flex: 1,
    backgroundColor: Colors.success[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.success[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  manualButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.primary[900],
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  scanAgainButtonText: {
    color: Colors.primary[500],
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  
  // Updated Result Styles
  resultContainer: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: BorderRadius['3xl'],
    ...Shadows.md,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  resultBody: {
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'PlusJakartaSans-SemiBold',
    flex: 1,
    textAlign: 'right',
  },
  nextScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[300],
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  nextScanButtonText: {
    color: Colors.primary[500],
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginLeft: 6,
  },
  
  // Updated Button Styles
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: Colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Shadows.sm,
  },
  disabledButton: {
    backgroundColor: Colors.secondary[600],
    shadowColor: Colors.secondary[600],
    shadowOpacity: 0.2,
  },
  disabledSecondaryButton: {
    backgroundColor: Colors.secondary[100],
    borderColor: Colors.secondary[500],
    opacity: 0.6,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    color: Colors.text.tertiary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  secondaryButtonIconContainer: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  testScanButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 10,
  },
  testScanButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  debugText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default ScanTicketScreen;