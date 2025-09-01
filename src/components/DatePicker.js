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

const DatePicker = ({ 
  selectedDate, 
  onSelectDate, 
  placeholder = "Select date",
  minimumDate = new Date() // Default to today
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      // On iOS, keep the picker open and update the date
      if (selectedDate) {
        onSelectDate(selectedDate);
      }
    } else {
      // On Android, close the picker
      setShowPicker(false);
      if (selectedDate) {
        onSelectDate(selectedDate);
      }
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={showDatePicker}
      >
        <View style={styles.dateButtonContent}>
          <Feather name="calendar" size={18} color={Colors.text.primary} />
          <Text style={styles.dateButtonText}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
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
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={closePicker} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
            onChange={handleDateChange}
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
  dateButton: {
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
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateButtonText: {
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

export default DatePicker;