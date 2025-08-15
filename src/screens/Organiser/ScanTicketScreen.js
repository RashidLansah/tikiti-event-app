import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ScanTicketScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      const mockScanResult = {
        ticketId: 'TKT-001-2025',
        eventName: 'Music Festival 2025',
        attendeeName: 'John Doe',
        seatNumber: 'A-15',
        isValid: Math.random() > 0.3, // 70% chance of valid ticket
      };
      setScanResult(mockScanResult);
    }, 2000);
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

  const renderScanArea = () => (
    <View style={styles.scanArea}>
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        {isScanning && (
          <View style={styles.scanLine} />
        )}
      </View>
      
      <Text style={styles.scanInstruction}>
        {isScanning ? 'Scanning...' : 'Point camera at QR code'}
      </Text>
    </View>
  );

  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <View style={[
        styles.resultContainer,
        { backgroundColor: scanResult.isValid ? '#d4edda' : '#f8d7da' }
      ]}>
        <View style={styles.resultTitleContainer}>
          <Feather 
            name={scanResult.isValid ? "check-circle" : "x-circle"} 
            size={24} 
            color={scanResult.isValid ? '#10B981' : '#EF4444'} 
            style={styles.resultIcon}
          />
          <Text style={[
            styles.resultTitle,
            { color: scanResult.isValid ? '#10B981' : '#EF4444' }
          ]}>
            {scanResult.isValid ? 'Valid Ticket' : 'Invalid Ticket'}
          </Text>
        </View>
        
        <View style={styles.resultDetails}>
          <Text style={styles.resultLabel}>Ticket ID:</Text>
          <Text style={styles.resultValue}>{scanResult.ticketId}</Text>
        </View>
        
        <View style={styles.resultDetails}>
          <Text style={styles.resultLabel}>Event:</Text>
          <Text style={styles.resultValue}>{scanResult.eventName}</Text>
        </View>
        
        <View style={styles.resultDetails}>
          <Text style={styles.resultLabel}>Attendee:</Text>
          <Text style={styles.resultValue}>{scanResult.attendeeName}</Text>
        </View>
        
        <View style={styles.resultDetails}>
          <Text style={styles.resultLabel}>Seat:</Text>
          <Text style={styles.resultValue}>{scanResult.seatNumber}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.nextScanButton}
          onPress={() => setScanResult(null)}
        >
          <View style={styles.buttonContent}>
            <Feather name="refresh-cw" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.nextScanButtonText}>Scan Next Ticket</Text>
          </View>
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
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={handleStartScan}
          disabled={isScanning}
        >
          <View style={styles.buttonContent}>
            <Feather 
              name={isScanning ? "search" : "camera"} 
              size={20} 
              color="white" 
              style={styles.buttonIcon}
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualEntry}
        >
          <View style={styles.buttonContent}>
            <Feather 
              name="edit-3" 
              size={20} 
              color="white" 
              style={styles.buttonIcon}
            />
            <Text style={styles.manualButtonText}>Manual Entry</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>42</Text>
          <Text style={styles.statLabel}>Scanned Today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>38</Text>
          <Text style={styles.statLabel}>Valid</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>4</Text>
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
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
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
  },
});

export default ScanTicketScreen;