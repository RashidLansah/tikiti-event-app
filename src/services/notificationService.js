import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
  }

  // Request notification permissions
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  // Get push token
  async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Create a local notification
  async createLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error creating local notification:', error);
    }
  }

  // Schedule a notification for later
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: triggerDate,
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Save notification to Firestore
  async saveNotification(userId, type, title, body, data = {}) {
    try {
      const notification = {
        userId,
        type,
        title,
        body,
        data,
        read: false,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return docRef.id;
    } catch (error) {
      console.error('Error saving notification:', error);
      return null;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // RSVP Confirmation Notification
  async sendRSVPConfirmation(userId, eventName, eventId) {
    const title = 'RSVP Confirmed! 🎉';
    const body = `You've successfully RSVP'd to "${eventName}". We'll remind you before the event starts.`;
    
    // Save to Firestore
    await this.saveNotification(userId, 'rsvp_confirmation', title, body, {
      eventId,
      eventName,
    });
    
    // Show immediate local notification
    await this.createLocalNotification(title, body, { eventId });
  }

  // Event Reminder Notification
  async scheduleEventReminder(userId, eventName, eventId, eventDate) {
    const reminderTime = new Date(eventDate);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before
    
    // Only schedule if reminder time is in the future
    if (reminderTime > new Date()) {
      const title = 'Event Reminder ⏰';
      const body = `"${eventName}" starts in 1 hour. Don't forget to attend!`;
      
      // Save to Firestore
      await this.saveNotification(userId, 'event_reminder', title, body, {
        eventId,
        eventName,
        scheduledFor: reminderTime,
      });
      
      // Schedule local notification
      await this.scheduleNotification(title, body, reminderTime, { eventId });
    }
  }

  // New RSVP Notification (for organizers)
  async sendNewRSVPNotification(organizerId, eventName, attendeeName, eventId) {
    const title = 'New RSVP! 👥';
    const body = `${attendeeName} just RSVP'd to "${eventName}".`;
    
    // Save to Firestore
    await this.saveNotification(organizerId, 'new_rsvp', title, body, {
      eventId,
      eventName,
      attendeeName,
    });
    
    // Show immediate local notification
    await this.createLocalNotification(title, body, { eventId });
  }

  // Event Update Notification
  async sendEventUpdateNotification(userId, eventName, eventId, updateType) {
    const title = 'Event Updated 📝';
    const body = `"${eventName}" has been updated. Check out the changes!`;
    
    // Save to Firestore
    await this.saveNotification(userId, 'event_update', title, body, {
      eventId,
      eventName,
      updateType,
    });
    
    // Show immediate local notification
    await this.createLocalNotification(title, body, { eventId });
  }

  // Welcome Notification
  async sendWelcomeNotification(userId, userName) {
    const title = 'Welcome to Tikiti! 🎉';
    const body = `Hi ${userName}! Discover amazing events happening near you.`;
    
    // Save to Firestore
    await this.saveNotification(userId, 'welcome', title, body, {});
    
    // Show immediate local notification
    await this.createLocalNotification(title, body, {});
  }
}

export default new NotificationService();
