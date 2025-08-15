# Tikiti - Event Ticketing App

A React Native mobile app for event ticketing with dual user flows for event attendees and organizers.

## 🚀 Tech Stack

- **React Native** with Expo
- **React Navigation** for navigation
- **Functional Components** with hooks
- **Firebase** (to be integrated for auth and data)
- **SendGrid** (to be integrated for email)
- **MTN MoMo** (to be integrated for payments)
- **react-native-qrcode-svg** and **expo-camera** for QR functionality

## 📱 Features

### For Event Attendees (Users)
- Browse available events
- View event details with comprehensive information
- Purchase tickets with quantity selection
- View digital tickets with QR codes
- Share events and tickets

### For Event Organizers
- Dashboard to manage created events
- Create new events with detailed forms
- Scan and validate tickets at venue
- Real-time scanning statistics

## 🏗️ Project Structure

```
/src
  /components          # Reusable UI components
  /screens
    /Organiser        # Organizer-specific screens
      - DashboardScreen.js
      - CreateEventScreen.js
      - ScanTicketScreen.js
    /User             # User-specific screens
      - EventListScreen.js
      - EventDetailScreen.js
      - TicketScreen.js
  /navigation         # Navigation configuration
    - AppNavigator.js   # Main navigation with role selection
    - OrganiserStack.js # Organizer flow navigation
    - UserStack.js      # User flow navigation
  /assets             # Images and static assets
```

## 🔧 Getting Started

### Prerequisites
- Node.js
- Expo CLI
- Expo Go app on your mobile device

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app to run on your device

## 🧭 Navigation Flow

1. **Role Selection Screen**: Choose between User or Organizer
2. **User Flow**: Event browsing → Event details → Ticket purchase → Digital ticket
3. **Organizer Flow**: Dashboard → Create events → Scan tickets

## 🎨 UI Features

- **Modern design** with consistent styling
- **Interactive elements** with proper feedback
- **Responsive layout** for different screen sizes
- **Placeholder content** for demonstration
- **Mock QR codes** for ticket scanning simulation

## 📝 Current Status

✅ **Completed:**
- Complete UI structure and navigation
- All screens with dummy content
- Role-based navigation flows
- Mock ticket scanning functionality
- Responsive design components

🔄 **To be implemented:**
- Firebase authentication and database
- Real payment integration
- Email notifications
- Real QR code generation
- Image upload functionality
- Push notifications

## 🔮 Next Steps

1. Integrate Firebase for user authentication
2. Set up real-time database for events and tickets
3. Implement payment processing
4. Add email notifications for ticket purchases
5. Integrate real QR code scanning
6. Add image upload for event posters
7. Implement push notifications

## 🎯 Demo Usage

The app currently uses dummy data for demonstration. You can:

- Switch between User and Organizer roles
- Navigate through all screens
- Test the complete user journey
- View mock ticket generation and scanning

Perfect for showcasing the app concept and user experience flow!