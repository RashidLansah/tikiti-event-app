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

const DatePicker = ({ 
  selectedDate, 
  onSelectDate, 
  placeholder = "Select date",
  minimumDate = new Date() // Default to today
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day,
        date,
        isToday,
        isPast,
        isSelected,
        isEmpty: false
      });
    }
    
    return days;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    return getDaysInMonth(currentMonth);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateSelect = (dayData) => {
    if (dayData.isEmpty || dayData.isPast) return;
    onSelectDate(dayData.date);
    setIsOpen(false);
  };

  // Get month name
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.dateButtonContent}>
          <Feather name="calendar" size={18} color={Colors.text.primary} />
          <Text style={styles.dateButtonText}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
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
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Feather name="x" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={goToPreviousMonth}
              >
                <Feather name="chevron-left" size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
              
              <TouchableOpacity
                style={styles.monthButton}
                onPress={goToNextMonth}
              >
                <Feather name="chevron-right" size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysContainer}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <ScrollView style={styles.calendarContainer}>
              <View style={styles.calendarGrid}>
                {calendarDays.map((dayData, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      dayData.isSelected && styles.dayButtonSelected,
                      dayData.isToday && styles.dayButtonToday,
                      dayData.isPast && styles.dayButtonPast,
                    ]}
                    onPress={() => handleDateSelect(dayData)}
                    disabled={dayData.isEmpty || dayData.isPast}
                  >
                    <Text style={[
                      styles.dayText,
                      dayData.isSelected && styles.dayTextSelected,
                      dayData.isToday && styles.dayTextToday,
                      dayData.isPast && styles.dayTextPast,
                    ]}>
                      {dayData.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  monthButton: {
    padding: Spacing[2],
  },
  monthTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  calendarContainer: {
    maxHeight: 300,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  dayButtonToday: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
  },
  dayButtonPast: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  dayTextToday: {
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  dayTextPast: {
    color: Colors.text.tertiary,
  },
});

export default DatePicker;