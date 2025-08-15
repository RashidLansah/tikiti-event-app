import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
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
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: '', isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push({ 
        day, 
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0))
      });
    }
    
    return days;
  };

  // Navigate months
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
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Feather name="x" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                <Feather name="chevron-left" size={20} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <Feather name="chevron-right" size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Week Days Header */}
            <View style={styles.weekDaysHeader}>
              {weekDays.map((day, index) => (
                <Text key={index} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((dayData, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    dayData.isSelected && styles.selectedDay,
                    dayData.isToday && !dayData.isSelected && styles.todayDay,
                    dayData.isPast && styles.pastDay
                  ]}
                  onPress={() => handleDateSelect(dayData)}
                  disabled={dayData.isEmpty || dayData.isPast}
                >
                  <Text style={[
                    styles.dayText,
                    dayData.isSelected && styles.selectedDayText,
                    dayData.isToday && !dayData.isSelected && styles.todayDayText,
                    dayData.isPast && styles.pastDayText
                  ]}>
                    {dayData.day}
                  </Text>
                </TouchableOpacity>
              ))}
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
  dateButton: {
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
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateButtonText: {
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
    maxWidth: 350,
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
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  navButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
  },
  monthText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing[1],
  },
  dayText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  selectedDay: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  selectedDayText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  todayDay: {
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.full,
  },
  todayDayText: {
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  pastDay: {
    opacity: 0.3,
  },
  pastDayText: {
    color: Colors.text.tertiary,
  },
});

export default DatePicker; 