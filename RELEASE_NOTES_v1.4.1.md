# Tikiti v1.4.1 - Bug Fix Release

## 🐛 Bug Fixes

### Export/Download Functionality for Event Attendees
- **Fixed**: Excel export functionality that was causing "base64 undefined" errors
- **Fixed**: File corruption issues when opening exported Excel files
- **Improved**: Replaced Excel export with reliable PDF export using `expo-print`
- **Added**: Professional PDF formatting with brand colors and comprehensive attendee data
- **Enhanced**: PDF includes all attendee information (name, email, phone, gender, registration type, etc.)

### Contact Features for Organizers
- **Added**: Phone and message buttons for attendees with phone numbers
- **Added**: Direct calling functionality using device's phone app
- **Added**: SMS messaging functionality using device's messaging app
- **Enhanced**: Better error handling for missing phone numbers

### Technical Improvements
- **Updated**: Expo SDK to v54.0.0 for better compatibility
- **Fixed**: Deprecated `expo-file-system` API usage
- **Improved**: File system operations using modern Expo APIs
- **Enhanced**: Error logging and debugging for export functionality

## 📱 What's New

### For Organizers
- **PDF Export**: Generate professional attendee lists as PDF files
- **Contact Attendees**: Call or message attendees directly from the app
- **Better Data Display**: Phone numbers and gender now properly displayed
- **Improved Reliability**: Export functionality works consistently across all devices

### Technical Details
- **Version**: 1.4.1 (Patch release for bug fixes)
- **Build Number**: iOS 4, Android 4
- **Dependencies**: Updated to Expo SDK 54.0.0
- **New Libraries**: Added `expo-print` for PDF generation

## 🎯 Testing Notes

### PDF Export Testing
1. Go to Organizer Profile → Events → Select Event → Attendees
2. Tap the PDF export button (file-text icon)
3. Verify PDF opens correctly with all attendee data
4. Check that phone numbers and gender are included

### Contact Features Testing
1. Look for attendees with phone numbers
2. Tap phone icon → Should open phone app
3. Tap message icon → Should open messaging app
4. Test with attendees without phone numbers → Should show appropriate alerts

## 🚀 Deployment Notes

- **App Store**: Bug fix release - should have faster approval process
- **Version Strategy**: Patch version increment (1.4.0 → 1.4.1)
- **Compatibility**: Maintains full backward compatibility
- **No Breaking Changes**: All existing functionality preserved

## 📋 Release Checklist

- [x] Version numbers updated (1.4.1)
- [x] Build numbers incremented (iOS: 4, Android: 4)
- [x] Temporary development files cleaned up
- [x] PDF export functionality tested
- [x] Contact features tested
- [x] Error handling verified
- [x] Code reviewed and optimized

---

**Release Date**: September 30, 2024  
**Release Type**: Bug Fix (Patch)  
**Target Platforms**: iOS, Android  
**Compatibility**: iOS 13+, Android API 21+
