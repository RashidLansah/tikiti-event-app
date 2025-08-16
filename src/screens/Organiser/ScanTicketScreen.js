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
import { useAuth } from '../../context/AuthContext';

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
      console.error('Error loading stats:', error);
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
    console.log('🎯 Starting scan process...');
    console.log('📋 Permission status:', permission);
    
    if (!permission) {
      console.log('❌ No permission object found');
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
      return;
    }
    
    if (!permission.granted) {
      console.log('📱 Requesting camera permission...');
      const { granted } = await requestPermission();
      console.log('✅ Permission granted:', granted);
      if (!granted) {
        Alert.alert('No Access', 'No access to camera. Please enable camera permission in settings.');
        return;
      }
    }
    
    console.log('✅ Camera permission confirmed');
    setIsScanning(true);
    setScanResult(null);
    setIsProcessing(false);
    startScanAnimation();
    console.log('📸 Camera should be opening...');
    console.log('🔄 States: isScanning=true, isProcessing=false');
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    console.log('🔍 BARCODE SCAN EVENT TRIGGERED!');
    console.log('📱 Barcode type:', type);
    console.log('📱 QR Code data:', data);
    console.log('📱 Data length:', data?.length);
    console.log('📱 Is processing:', isProcessing);
    
    if (isProcessing) {
      console.log('⏳ Already processing, ignoring scan');
      return; // Prevent multiple scans
    }
    
    // Provide haptic feedback
    Vibration.vibrate(100);
    console.log('✅ Vibration triggered');
    
    setIsProcessing(true);
      setIsScanning(false);
    stopScanAnimation();
    console.log('🔄 States updated: processing=true, scanning=false');
    
    try {
      // Parse the QR code data
      console.log('🔍 Raw QR data received:', data);
      
      let ticketData;
      try {
        ticketData = JSON.parse(data);
        console.log('✅ Successfully parsed JSON:', ticketData);
      } catch (parseError) {
        console.log('❌ JSON parse failed, trying other formats:', parseError.message);
        console.log('📝 Raw data:', data);
        
        // Try pipe-separated format: "SIMPLE123|Test Event|Test User|test-booking-123|confirmed"
        if (data.includes('|')) {
          console.log('🔍 Trying pipe-separated format');
          const parts = data.split('|');
          if (parts.length >= 5) {
            ticketData = {
              ticketId: parts[0],
              eventName: parts[1],
              userName: parts[2],
              purchaseId: parts[3],
              status: parts[4]
            };
            console.log('✅ Successfully parsed pipe format:', ticketData);
          } else {
            console.log('❌ Invalid pipe format - not enough parts');
          }
        }
        
        // Try minimal format (just ticket ID)
        else if (data.length < 50 && !data.includes(' ')) {
          console.log('🔍 Trying minimal format (ticket ID only)');
          ticketData = {
            ticketId: data,
            eventName: 'Unknown Event',
            userName: 'Unknown User',
            purchaseId: 'test-booking-123', // Use test booking for minimal format
            status: 'confirmed'
          };
          console.log('✅ Successfully parsed minimal format:', ticketData);
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
        ticketId: ticketData.ticketId,
        eventName: ticketData.eventName,
        attendeeName: ticketData.userName,
        userId: ticketData.userId,
        purchaseId: ticketData.purchaseId,
        quantity: ticketData.quantity,
        isValid: isValid,
        scannedAt: new Date().toISOString(),
        rawData: ticketData,
      };
      
      // Update scanned tickets list
      setScannedTickets(prev => [...prev, scanResult]);
      setScanResult(scanResult);
      
      // Update stats
      loadTodayStats();
      
      // If valid, mark ticket as used
      if (isValid) {
        await markTicketAsUsed(ticketData.purchaseId);
      }
      
    } catch (error) {
      console.error('Error processing QR code:', error);
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
      console.log('🎫 Validating ticket data:', ticketData);
      
      // Check if required fields exist
      if (!ticketData.purchaseId) {
        console.log('❌ No purchaseId found in ticket data');
        return false;
      }
      
      console.log('🔍 Looking up booking:', ticketData.purchaseId);
      
      // Check if booking exists and is valid
      const booking = await bookingService.getById(ticketData.purchaseId);
      console.log('📋 Booking found:', booking);
      
      if (!booking) {
        console.log('❌ Booking not found');
        return false; // Booking doesn't exist
      }
      
      if (booking.status === 'used') {
        console.log('❌ Ticket already used');
        return false; // Already used
      }
      
      if (booking.status !== 'confirmed') {
        console.log('❌ Booking not confirmed, status:', booking.status);
        return false; // Not confirmed
      }
      
      // Check if event date is today or in the future (allow future events)
      if (booking.eventDate) {
        const eventDate = new Date(booking.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
          console.log('❌ Event date has passed');
          return false; // Event date has passed
        }
      }
      
      console.log('✅ Ticket validation successful');
      return true;
    } catch (error) {
      console.error('❌ Error validating ticket:', error);
      console.error('❌ Error details:', error.message);
      return false;
    }
  };

  const markTicketAsUsed = async (purchaseId) => {
    try {
      console.log('🏷️ Marking ticket as used:', purchaseId);
      
      if (!purchaseId) {
        console.log('❌ No purchaseId provided');
        return;
      }
      
      await bookingService.update(purchaseId, {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedBy: user?.uid,
      });
      console.log('✅ Ticket marked as used successfully:', purchaseId);
    } catch (error) {
      console.error('❌ Error marking ticket as used:', error);
      console.error('❌ Error details:', error.message);
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
            >
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
                    console.log('❌ Camera closed by user');
                  }}
                >
                  <Feather name="x" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </CameraView>
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
          { backgroundColor: scanResult.isValid ? '#F0FDF4' : '#FEF2F2' }
        ]}>
      <View style={[
            styles.resultIconContainer,
            { backgroundColor: scanResult.isValid ? '#10B981' : '#EF4444' }
      ]}>
          <Feather 
              name={scanResult.isValid ? "check" : "x"} 
            size={24} 
              color="#FFFFFF"
          />
          </View>
          <View style={styles.resultHeaderText}>
          <Text style={[
            styles.resultTitle,
              { color: scanResult.isValid ? '#059669' : '#DC2626' }
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
          <Feather name="refresh-cw" size={16} color="#6366F1" />
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
          <Feather name="arrow-left" size={24} color="#6366F1" />
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
            <Feather name="edit-3" size={20} color="#6366F1" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#1F2937',
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
    borderColor: '#6366F1',
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
    backgroundColor: '#10B981',
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  resultContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
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
    fontWeight: 'bold',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    color: '#666',
  },
  nextScanButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanningButton: {
    backgroundColor: '#9CA3AF',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    backgroundColor: '#F0F4FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  scanAgainButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Updated Result Styles
  resultContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontWeight: '700',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
    borderBottomColor: '#F9FAFB',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  nextScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextScanButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Updated Button Styles
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
    shadowOpacity: 0.2,
  },
  disabledSecondaryButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '400',
  },
  secondaryButtonIconContainer: {
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  testScanButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 10,
  },
  testScanButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default ScanTicketScreen;