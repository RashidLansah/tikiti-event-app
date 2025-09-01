import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
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
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Generate minutes (0-59, in 5-minute intervals)
  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
      minutes.push(i);
    }
    return minutes;
  };

  // Handle time selection
  const handleTimeSelect = () => {
    const hour12 = selectedHour;
    const minuteStr = selectedMinute.toString().padStart(2, '0');
    const period = isAM ? 'AM' : 'PM';
    const timeString = `${hour12}:${minuteStr} ${period}`;
    onSelectTime(timeString);
    setIsOpen(false);
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Feather name="x" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.timeOptionSelected
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === hour && styles.timeOptionTextSelected
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Minute</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.timeOptionSelected
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === minute && styles.timeOptionTextSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Period</Text>
                <View style={styles.periodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      isAM && styles.periodOptionSelected
                    ]}
                    onPress={() => setIsAM(true)}
                  >
                    <Text style={[
                      styles.periodOptionText,
                      isAM && styles.periodOptionTextSelected
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      !isAM && styles.periodOptionSelected
                    ]}
                    onPress={() => setIsAM(false)}
                  >
                    <Text style={[
                      styles.periodOptionText,
                      !isAM && styles.periodOptionTextSelected
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.timePickerFooter}>
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
                <Text style={styles.confirmButtonText}>Select</Text>
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
    width: '100%',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
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
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing[2],
  },
  timePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[3],
  },
  timeScrollView: {
    maxHeight: 200,
    width: '100%',
  },
  timeOption: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    marginVertical: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary[500],
  },
  timeOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  timeOptionTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  periodOption: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  periodOptionSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  periodOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  periodOptionTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  timePickerFooter: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default TimePicker;