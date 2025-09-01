import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const TimePicker = ({ 
  selectedTime, 
  onSelectTime, 
  placeholder = "Select time" 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  // Convert time string to Date object
  const timeStringToDate = (timeString) => {
    if (!timeString) return new Date();
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const date = new Date();
    date.setHours(hour24, parseInt(minutes), 0, 0);
    return date;
  };

  // Convert Date object to time string
  const dateToTimeString = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hour12}:${minutesStr} ${period}`;
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'ios') {
      // On iOS, keep the picker open and update the time
      if (selectedTime) {
        const timeString = dateToTimeString(selectedTime);
        onSelectTime(timeString);
      }
    } else {
      // On Android, close the picker
      setShowPicker(false);
      if (selectedTime) {
        const timeString = dateToTimeString(selectedTime);
        onSelectTime(timeString);
      }
    }
  };

  const showTimePicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={showTimePicker}
      >
        <View style={styles.timeButtonContent}>
          <Feather name="clock" size={18} color={Colors.text.primary} />
          <Text style={styles.timeButtonText}>
            {selectedTime ? formatTime(selectedTime) : placeholder}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={closePicker} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={closePicker} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={selectedTime ? timeStringToDate(selectedTime) : new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={false}
            onChange={handleTimeChange}
            style={styles.picker}
          />
        </View>
      )}
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
  pickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    marginTop: Spacing[2],
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  pickerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  cancelButton: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
  },
  doneButton: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  doneButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[500],
  },
  picker: {
    backgroundColor: Colors.background.primary,
  },
});

export default TimePicker;