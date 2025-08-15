import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const TimePicker = ({ 
  selectedTime, 
  onSelectTime, 
  placeholder = "Select time" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  // Generate hours (1-12)
  const generateHours = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Generate minutes (0, 15, 30, 45)
  const generateMinutes = () => {
    return [0, 15, 30, 45];
  };

  // Handle time selection
  const handleTimeSelect = () => {
    const hour = selectedHour;
    const minute = selectedMinute;
    const period = isAM ? 'AM' : 'PM';
    
    // Format time as HH:MM AM/PM
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    const timeString = `${formattedHour}:${formattedMinute} ${period}`;
    
    onSelectTime(timeString);
    setIsOpen(false);
  };

  // Handle hour selection
  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
  };

  // Handle minute selection
  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
  };

  // Toggle AM/PM
  const toggleAMPM = () => {
    setIsAM(!isAM);
  };

  const hours = generateHours();
  const minutes = generateMinutes();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.timeButtonContent}>
          <Feather name="clock" size={18} color={Colors.text.primary} />
          <Text style={styles.timeButtonText}>
            {selectedTime ? formatTime(selectedTime) : placeholder}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Feather name="x" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Time Display */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeDisplayText}>
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
              </Text>
              <View style={styles.ampmContainer}>
                <TouchableOpacity
                  style={[styles.ampmButton, isAM && styles.ampmButtonActive]}
                  onPress={() => setIsAM(true)}
                >
                  <Text style={[styles.ampmText, isAM && styles.ampmTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmButton, !isAM && styles.ampmButtonActive]}
                  onPress={() => setIsAM(false)}
                >
                  <Text style={[styles.ampmText, !isAM && styles.ampmTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hours Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Hour</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hoursContainer}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      selectedHour === hour && styles.selectedTimeOption
                    ]}
                    onPress={() => handleHourSelect(hour)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedHour === hour && styles.selectedTimeOptionText
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minutes Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Minute</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.minutesContainer}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      selectedMinute === minute && styles.selectedTimeOption
                    ]}
                    onPress={() => handleMinuteSelect(minute)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedMinute === minute && styles.selectedTimeOptionText
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleTimeSelect}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  timeButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
    fontWeight: Typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  timeDisplayText: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  ampmContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[1],
  },
  ampmButton: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  ampmButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  ampmText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  ampmTextActive: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  selectionSection: {
    padding: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[3],
  },
  hoursContainer: {
    flexDirection: 'row',
  },
  minutesContainer: {
    flexDirection: 'row',
  },
  timeOption: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginRight: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: Colors.primary[500],
  },
  timeOptionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  selectedTimeOptionText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing[5],
    gap: Spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default TimePicker; 