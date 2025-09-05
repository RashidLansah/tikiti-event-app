import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
// import emailService from './emailService'; // Commented out to avoid circular dependency

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
        readAt: new Date(),
      });
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date(),
        });
      });
      
      await batch.commit();
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const unreadCount = querySnapshot.size;
      console.log('📊 Unread notification count:', unreadCount);
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get unread count (legacy method - keeping for compatibility)
  async getUnreadCountLegacy(userId) {
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
  async scheduleEventReminder(userId, eventName, eventId, eventDate, eventTime) {
    try {
      // Parse the event date and time properly
      let eventDateTime;
      
      if (typeof eventDate === 'string') {
        // If eventDate is a string, combine it with eventTime
        const dateStr = eventDate.includes('T') ? eventDate : `${eventDate}T${eventTime || '12:00'}`;
        eventDateTime = new Date(dateStr);
      } else {
        // If eventDate is already a Date object
        eventDateTime = new Date(eventDate);
        if (eventTime) {
          // Set the time if provided
          const [hours, minutes] = eventTime.split(':');
          eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
      }
      
      // Calculate reminder time (1 hour before event)
      const reminderTime = new Date(eventDateTime);
      reminderTime.setHours(reminderTime.getHours() - 1);
      
      console.log('📅 Event scheduled for:', eventDateTime.toISOString());
      console.log('⏰ Reminder scheduled for:', reminderTime.toISOString());
      console.log('🕐 Current time:', new Date().toISOString());
      
      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        const title = 'Event Reminder ⏰';
        const body = `"${eventName}" starts in 1 hour. Don't forget to attend!`;
        
        // Save to Firestore
        await this.saveNotification(userId, 'event_reminder', title, body, {
          eventId,
          eventName,
          scheduledFor: reminderTime,
          eventDateTime: eventDateTime,
        });
        
        // Schedule local notification
        await this.scheduleNotification(title, body, reminderTime, { eventId });
        
        console.log('✅ Event reminder scheduled successfully');
      } else {
        console.log('⚠️ Event reminder time is in the past, skipping scheduling');
      }
    } catch (error) {
      console.error('❌ Error scheduling event reminder:', error);
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

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      console.log(`✅ Marked ${querySnapshot.docs.length} notifications as read`);
      return { success: true, count: querySnapshot.docs.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Clear all notifications for a user (delete them)
  async clearAllNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleared ${querySnapshot.docs.length} notifications`);
      return { success: true, count: querySnapshot.docs.length };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();
