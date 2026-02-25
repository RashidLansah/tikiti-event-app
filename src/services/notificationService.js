import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';

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

  // ─── Permission & Token Management ───

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    return true;
  }

  async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '4a3d499a-fee7-465b-b0c6-3c9ba76073bc',
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async registerPushToken(userId) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = await this.getPushToken();
      if (!token) return null;

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        pushTokenUpdatedAt: new Date(),
      });

      console.log('Push token registered:', token);
      return token;
    } catch (error) {
      console.error('Error registering push token:', error);
      return null;
    }
  }

  // ─── Push Notification Sending (Expo Push API) ───

  async getUserPushToken(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().expoPushToken || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user push token:', error);
      return null;
    }
  }

  async getEventAttendeePushTokens(eventId) {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const bookingsSnapshot = await getDocs(q);

      const userIds = [];
      bookingsSnapshot.forEach((docSnap) => {
        const booking = docSnap.data();
        if (booking.userId && !userIds.includes(booking.userId)) {
          userIds.push(booking.userId);
        }
      });

      const tokens = [];
      const tokenFetches = userIds.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const token = userSnap.data().expoPushToken;
          if (token) tokens.push(token);
        }
      });
      await Promise.all(tokenFetches);

      console.log(`Found ${tokens.length} push tokens for event ${eventId}`);
      return tokens;
    } catch (error) {
      console.error('Error getting attendee push tokens:', error);
      return [];
    }
  }

  async sendPushNotification(expoPushToken, title, body, data = {}) {
    if (!expoPushToken) return;

    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async sendPushNotificationBatch(expoPushTokens, title, body, data = {}) {
    if (!expoPushTokens || expoPushTokens.length === 0) return;

    try {
      const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      // Expo Push API accepts batches of up to 100
      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        const result = await response.json();
        console.log('Batch push sent:', result);
      }
    } catch (error) {
      console.error('Error sending batch push notifications:', error);
    }
  }

  // ─── Local Notifications ───

  async createLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error creating local notification:', error);
    }
  }

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

  // ─── Firestore Operations ───

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

  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

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

      querySnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true, readAt: new Date() });
      });

      await batch.commit();
      console.log(`Marked ${querySnapshot.docs.length} notifications as read`);
      return { success: true, count: querySnapshot.docs.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
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

  async clearAllNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      console.log(`Cleared ${querySnapshot.docs.length} notifications`);
      return { success: true, count: querySnapshot.docs.length };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // ─── Notification Triggers ───

  // RSVP Confirmation (attendee)
  async sendRSVPConfirmation(userId, eventName, eventId) {
    const title = 'RSVP Confirmed!';
    const body = `You've successfully RSVP'd to "${eventName}". We'll remind you before the event starts.`;
    const data = { eventId, eventName, type: 'rsvp_confirmation' };

    await this.saveNotification(userId, 'rsvp_confirmation', title, body, data);
    await this.createLocalNotification(title, body, data);

    // Send real push notification
    const pushToken = await this.getUserPushToken(userId);
    await this.sendPushNotification(pushToken, title, body, data);
  }

  // Event Reminder - 1 hour before (attendee)
  // NOTE: Push reminders need server-side scheduling (Firebase Cloud Function).
  // For now, the local scheduled notification handles the 1-hour-before reminder.
  async scheduleEventReminder(userId, eventName, eventId, eventDate, eventTime) {
    try {
      let eventDateTime;

      if (typeof eventDate === 'string') {
        const dateStr = eventDate.includes('T') ? eventDate : `${eventDate}T${eventTime || '12:00'}`;
        eventDateTime = new Date(dateStr);
      } else {
        eventDateTime = new Date(eventDate);
        if (eventTime) {
          const [hours, minutes] = eventTime.split(':');
          eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
      }

      const reminderTime = new Date(eventDateTime);
      reminderTime.setHours(reminderTime.getHours() - 1);

      if (reminderTime > new Date()) {
        const title = 'Event Reminder';
        const body = `"${eventName}" starts in 1 hour. Don't forget to attend!`;
        const data = { eventId, eventName, type: 'event_reminder' };

        await this.saveNotification(userId, 'event_reminder', title, body, {
          ...data,
          scheduledFor: reminderTime,
          eventDateTime: eventDateTime,
        });

        await this.scheduleNotification(title, body, reminderTime, data);
        console.log('Event reminder scheduled for:', reminderTime.toISOString());
      } else {
        console.log('Event reminder time is in the past, skipping');
      }
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
    }
  }

  // New RSVP Notification (organiser)
  async sendNewRSVPNotification(organizerId, eventName, attendeeName, eventId) {
    const title = 'New RSVP!';
    const body = `${attendeeName} just RSVP'd to "${eventName}".`;
    const data = { eventId, eventName, attendeeName, type: 'new_rsvp' };

    await this.saveNotification(organizerId, 'new_rsvp', title, body, data);
    await this.createLocalNotification(title, body, data);

    const pushToken = await this.getUserPushToken(organizerId);
    await this.sendPushNotification(pushToken, title, body, data);
  }

  // Event Update - single user (used internally)
  async sendEventUpdateNotification(userId, eventName, eventId, updateType) {
    const title = 'Event Updated';
    const body = `"${eventName}" has been updated. Check out the changes!`;
    const data = { eventId, eventName, updateType, type: 'event_update' };

    await this.saveNotification(userId, 'event_update', title, body, data);
    await this.createLocalNotification(title, body, data);
  }

  // Event Update - all attendees (batch push)
  async sendEventUpdateToAllAttendees(eventId, eventName, updateType) {
    const title = 'Event Updated';
    const body = `"${eventName}" has been updated. Check out the changes!`;
    const data = { eventId, eventName, updateType, type: 'event_update' };

    try {
      // Send push to all attendees
      const tokens = await this.getEventAttendeePushTokens(eventId);
      await this.sendPushNotificationBatch(tokens, title, body, data);

      // Save notification record for each attendee
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const bookingsSnapshot = await getDocs(q);

      const savePromises = [];
      const seenUserIds = new Set();
      bookingsSnapshot.forEach((docSnap) => {
        const booking = docSnap.data();
        if (booking.userId && !seenUserIds.has(booking.userId)) {
          seenUserIds.add(booking.userId);
          savePromises.push(
            this.saveNotification(booking.userId, 'event_update', title, body, data)
          );
        }
      });
      await Promise.all(savePromises);
      console.log(`Event update notifications sent to ${seenUserIds.size} attendees`);
    } catch (error) {
      console.error('Error sending event update to attendees:', error);
    }
  }

  // Event Cancelled - all attendees (batch push)
  async sendEventCancelledToAllAttendees(eventId, eventName) {
    const title = 'Event Cancelled';
    const body = `"${eventName}" has been cancelled. We're sorry for the inconvenience.`;
    const data = { eventId, eventName, type: 'event_cancelled' };

    try {
      const tokens = await this.getEventAttendeePushTokens(eventId);
      await this.sendPushNotificationBatch(tokens, title, body, data);

      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const bookingsSnapshot = await getDocs(q);

      const savePromises = [];
      const seenUserIds = new Set();
      bookingsSnapshot.forEach((docSnap) => {
        const booking = docSnap.data();
        if (booking.userId && !seenUserIds.has(booking.userId)) {
          seenUserIds.add(booking.userId);
          savePromises.push(
            this.saveNotification(booking.userId, 'event_cancelled', title, body, data)
          );
        }
      });
      await Promise.all(savePromises);
      console.log(`Event cancellation sent to ${seenUserIds.size} attendees`);
    } catch (error) {
      console.error('Error sending event cancellation:', error);
    }
  }

  // Check-in Confirmation (attendee - after QR scan)
  async sendCheckInConfirmation(userId, eventName, eventId) {
    const title = 'Checked In!';
    const body = `Welcome to "${eventName}"! You've been successfully checked in. Enjoy the event!`;
    const data = { eventId, eventName, type: 'check_in' };

    await this.saveNotification(userId, 'check_in', title, body, data);

    const pushToken = await this.getUserPushToken(userId);
    await this.sendPushNotification(pushToken, title, body, data);
  }

  // New Connection Made (both users - after social card exchange)
  async sendConnectionMadeNotification(userId, connectedUserName, eventName) {
    const title = 'New Connection!';
    const body = `You connected with ${connectedUserName} at "${eventName}". Check your network to view their details.`;
    const data = { type: 'connection_made', connectedUserName, eventName };

    await this.saveNotification(userId, 'connection_made', title, body, data);

    const pushToken = await this.getUserPushToken(userId);
    await this.sendPushNotification(pushToken, title, body, data);
  }

  // New Event Posted (location-filtered push to all users)
  async sendNewEventNotification(eventId, eventName, eventLocation) {
    const title = 'New Event Near You!';
    const body = `"${eventName}" has just been posted. Check it out!`;
    const data = { eventId, eventName, type: 'new_event' };

    try {
      // Extract event country from location
      let eventCountry = null;
      if (eventLocation) {
        if (typeof eventLocation === 'string') {
          eventCountry = eventLocation;
        } else if (eventLocation.country) {
          eventCountry = eventLocation.country;
        } else if (eventLocation.name) {
          eventCountry = eventLocation.name;
        }
      }

      // Query all users with push tokens
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const tokens = [];
      const recipientUserIds = [];

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        if (!userData.expoPushToken) return;

        const userCountry = userData.country || userData.organisationCountry;

        // If user has a country set, only send if it matches the event's country
        // If user has no country set, send regardless (general notification)
        if (userCountry && eventCountry) {
          if (userCountry.toLowerCase() === eventCountry.toLowerCase()) {
            tokens.push(userData.expoPushToken);
            recipientUserIds.push(docSnap.id);
          }
        } else if (!userCountry) {
          // No country preference set - send to everyone
          tokens.push(userData.expoPushToken);
          recipientUserIds.push(docSnap.id);
        }
      });

      // Send batch push
      await this.sendPushNotificationBatch(tokens, title, body, data);

      // Save notification records
      const savePromises = recipientUserIds.map(uid =>
        this.saveNotification(uid, 'new_event', title, body, data)
      );
      await Promise.all(savePromises);

      console.log(`New event notification sent to ${recipientUserIds.length} users`);
    } catch (error) {
      console.error('Error sending new event notification:', error);
    }
  }

  // Welcome Notification
  async sendWelcomeNotification(userId, userName) {
    const title = 'Welcome to Tikiti!';
    const body = `Hi ${userName}! Discover amazing events happening near you.`;
    const data = { type: 'welcome' };

    await this.saveNotification(userId, 'welcome', title, body, data);
    await this.createLocalNotification(title, body, data);
  }
}

export default new NotificationService();
