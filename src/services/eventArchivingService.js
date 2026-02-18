import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Event Archiving Service
 *
 * Handles automatic archiving of past events to keep the database clean.
 * Events are archived 24 hours after they end by default.
 *
 * Features:
 * - Automatic archiving of organiser's past events on login
 * - Manual archiving for organisers
 * - Archive history tracking
 * - Event restore capability
 */

class EventArchivingService {
  constructor() {
    this.eventsCollection = collection(db, 'events');
    this.archivedEventsCollection = collection(db, 'archivedEvents');
    this.archiveLogCollection = collection(db, 'archiveLog');
  }

  /**
   * Check if an event should be archived
   * @param {Object} event - Event document
   * @param {number} bufferHours - Hours to wait after event ends before archiving
   * @returns {boolean} - Whether the event should be archived
   */
  shouldArchiveEvent(event, bufferHours = 24) {
    try {
      const now = new Date();
      const eventEndTime = new Date(`${event.date} ${event.endTime || '23:59'}`);

      // Add buffer time after event ends
      const archiveTime = new Date(eventEndTime.getTime() + bufferHours * 60 * 60 * 1000);

      return now >= archiveTime;
    } catch (error) {
      logger.error('Error checking if event should be archived:', error);
      return false;
    }
  }

  /**
   * Archive a single event
   * @param {string} eventId - Event ID to archive
   * @param {string} reason - Reason for archiving ('automatic', 'manual', 'cancelled')
   * @param {string} archivedBy - User ID who archived the event (null for automatic)
   * @returns {Object} - Result of archiving operation
   */
  async archiveEvent(eventId, reason = 'automatic', archivedBy = null) {
    try {
      logger.log(`Archiving event ${eventId} (reason: ${reason})`);

      // Get the event document
      const eventRef = doc(db, 'events', eventId);
      const eventSnapshot = await getDocs(query(this.eventsCollection, where('__name__', '==', eventId)));

      if (eventSnapshot.empty) {
        throw new Error(`Event ${eventId} not found`);
      }

      const eventData = eventSnapshot.docs[0].data();

      // Skip if already archived
      if (eventData.status === 'archived') {
        return { success: true, message: 'Event already archived', originalEventId: eventId };
      }

      // Create archived event document
      const archivedEventData = {
        ...eventData,
        originalEventId: eventId,
        archivedAt: Timestamp.now(),
        archivedBy: archivedBy,
        archiveReason: reason,
        archivedFrom: 'events',
        originalCreatedAt: eventData.createdAt,
        originalUpdatedAt: eventData.updatedAt,
      };

      // Add to archived events collection
      const archivedEventRef = await addDoc(this.archivedEventsCollection, archivedEventData);

      // Log the archiving action
      await this.logArchiveAction(eventId, archivedEventRef.id, reason, archivedBy);

      // Update the original event with archive status
      await updateDoc(eventRef, {
        status: 'archived',
        archivedAt: Timestamp.now(),
        archivedBy: archivedBy,
        archiveReason: reason,
        archivedEventId: archivedEventRef.id,
        isActive: false,
      });

      logger.log(`Event ${eventId} archived successfully`);

      return {
        success: true,
        message: 'Event archived successfully',
        archivedEventId: archivedEventRef.id,
        originalEventId: eventId
      };

    } catch (error) {
      logger.error(`Error archiving event ${eventId}:`, error);
      return {
        success: false,
        message: `Failed to archive event: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Archive past events for a specific organiser (safe for Firestore rules)
   * Only archives events owned by the given organiser.
   * @param {string} organizerId - The organiser's user ID
   * @param {number} bufferHours - Hours to wait after event ends before archiving
   * @returns {Object} - Result of archiving operation
   */
  async archiveOrganizerPastEvents(organizerId, bufferHours = 24) {
    try {
      logger.log(`Starting auto-archive for organiser ${organizerId}`);

      const organizerEventsQuery = query(
        this.eventsCollection,
        where('organizerId', '==', organizerId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(organizerEventsQuery);
      const eventsToArchive = [];

      snapshot.forEach((docSnap) => {
        const eventData = { id: docSnap.id, ...docSnap.data() };
        if (this.shouldArchiveEvent(eventData, bufferHours)) {
          eventsToArchive.push(eventData);
        }
      });

      if (eventsToArchive.length === 0) {
        return { success: true, archivedCount: 0 };
      }

      logger.log(`Found ${eventsToArchive.length} past events to archive`);

      let successCount = 0;
      for (const event of eventsToArchive) {
        const result = await this.archiveEvent(event.id, 'automatic', organizerId);
        if (result.success) successCount++;
      }

      logger.log(`Archived ${successCount}/${eventsToArchive.length} events for organiser`);

      return { success: true, archivedCount: successCount };
    } catch (error) {
      logger.error('Error archiving organiser past events:', error);
      return { success: false, archivedCount: 0 };
    }
  }

  /**
   * Archive multiple events automatically (all active events — requires broad permissions)
   * @param {number} bufferHours - Hours to wait after event ends before archiving
   * @returns {Object} - Result of bulk archiving operation
   */
  async archivePastEvents(bufferHours = 24) {
    try {
      logger.log(`Starting automatic event archiving (buffer: ${bufferHours}h)`);

      const activeEventsQuery = query(
        this.eventsCollection,
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(activeEventsQuery);
      const eventsToArchive = [];

      snapshot.forEach((docSnap) => {
        const eventData = { id: docSnap.id, ...docSnap.data() };
        if (this.shouldArchiveEvent(eventData, bufferHours)) {
          eventsToArchive.push(eventData);
        }
      });

      logger.log(`Found ${eventsToArchive.length} events to archive`);

      if (eventsToArchive.length === 0) {
        return { success: true, message: 'No events to archive', archivedCount: 0 };
      }

      const batchSize = 10;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < eventsToArchive.length; i += batchSize) {
        const batch = eventsToArchive.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(event => this.archiveEvent(event.id, 'automatic', null))
        );

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        });

        // Small delay between batches
        if (i + batchSize < eventsToArchive.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.log(`Archiving complete: ${successCount} successful, ${errorCount} failed`);

      return {
        success: true,
        message: `Archived ${successCount} events successfully`,
        archivedCount: successCount,
        errorCount: errorCount,
      };

    } catch (error) {
      logger.error('Error in bulk archiving:', error);
      return { success: false, message: `Bulk archiving failed: ${error.message}`, error };
    }
  }

  /**
   * Manually archive an event (for organisers)
   */
  async manualArchiveEvent(eventId, organizerId, reason = 'manual') {
    try {
      const eventSnapshot = await getDocs(query(
        this.eventsCollection,
        where('__name__', '==', eventId)
      ));

      if (eventSnapshot.empty) throw new Error('Event not found');

      const eventData = eventSnapshot.docs[0].data();

      if (eventData.organizerId !== organizerId) {
        throw new Error('Unauthorized: You can only archive your own events');
      }

      if (eventData.status === 'archived') {
        throw new Error('Event is already archived');
      }

      return await this.archiveEvent(eventId, reason, organizerId);

    } catch (error) {
      logger.error('Error in manual archiving:', error);
      return { success: false, message: `Manual archiving failed: ${error.message}`, error };
    }
  }

  /**
   * Restore an archived event
   */
  async restoreEvent(archivedEventId, restoredBy) {
    try {
      logger.log(`Restoring archived event ${archivedEventId}`);

      const archivedEventSnapshot = await getDocs(query(
        this.archivedEventsCollection,
        where('__name__', '==', archivedEventId)
      ));

      if (archivedEventSnapshot.empty) throw new Error('Archived event not found');

      const archivedEventData = archivedEventSnapshot.docs[0].data();
      const originalEventId = archivedEventData.originalEventId;

      const originalEventSnapshot = await getDocs(query(
        this.eventsCollection,
        where('__name__', '==', originalEventId)
      ));

      if (!originalEventSnapshot.empty) {
        const originalEventRef = doc(db, 'events', originalEventId);
        await updateDoc(originalEventRef, {
          status: 'active',
          isActive: true,
          restoredAt: Timestamp.now(),
          restoredBy: restoredBy,
          archiveReason: null,
          archivedAt: null,
          archivedBy: null,
        });
      } else {
        const restoredEventData = {
          ...archivedEventData,
          status: 'active',
          isActive: true,
          restoredAt: Timestamp.now(),
          restoredBy: restoredBy,
          createdAt: archivedEventData.originalCreatedAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
          originalEventId: null,
          archivedAt: null,
          archivedBy: null,
          archiveReason: null,
          archivedFrom: null,
          originalCreatedAt: null,
          originalUpdatedAt: null,
        };

        await addDoc(this.eventsCollection, restoredEventData);
      }

      await this.logArchiveAction(originalEventId, archivedEventId, 'restored', restoredBy);

      logger.log(`Event ${originalEventId} restored successfully`);
      return { success: true, message: 'Event restored successfully', eventId: originalEventId };

    } catch (error) {
      logger.error('Error restoring event:', error);
      return { success: false, message: `Restore failed: ${error.message}`, error };
    }
  }

  /**
   * Get archived events for an organiser
   */
  async getArchivedEvents(organizerId, limitCount = 50) {
    try {
      const archivedEventsQuery = query(
        this.archivedEventsCollection,
        where('organizerId', '==', organizerId),
        where('archiveReason', '!=', 'restored')
      );

      const snapshot = await getDocs(archivedEventsQuery);
      const archivedEvents = [];

      snapshot.forEach((docSnap) => {
        archivedEvents.push({ id: docSnap.id, ...docSnap.data() });
      });

      return archivedEvents
        .sort((a, b) => b.archivedAt?.toDate?.() - a.archivedAt?.toDate?.())
        .slice(0, limitCount);

    } catch (error) {
      logger.error('Error getting archived events:', error);
      return [];
    }
  }

  /**
   * Log archive actions for audit trail
   */
  async logArchiveAction(eventId, archivedEventId, action, userId) {
    try {
      await addDoc(this.archiveLogCollection, {
        eventId,
        archivedEventId,
        action,
        userId,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
    } catch (error) {
      logger.error('Error logging archive action:', error);
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats() {
    try {
      const [activeEventsSnapshot, archivedEventsSnapshot] = await Promise.all([
        getDocs(query(this.eventsCollection, where('isActive', '==', true))),
        getDocs(this.archivedEventsCollection)
      ]);

      const activeCount = activeEventsSnapshot.size;
      const archivedCount = archivedEventsSnapshot.size;

      return {
        activeEvents: activeCount,
        archivedEvents: archivedCount,
        totalEvents: activeCount + archivedCount,
        archiveRate: archivedCount / (activeCount + archivedCount) * 100
      };

    } catch (error) {
      logger.error('Error getting archive stats:', error);
      return { activeEvents: 0, archivedEvents: 0, totalEvents: 0, archiveRate: 0 };
    }
  }

  /**
   * Clean up old archive logs (keep only last 90 days)
   */
  async cleanupArchiveLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldLogsQuery = query(
        this.archiveLogCollection,
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(oldLogsQuery);
      const deletePromises = [];

      snapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });

      await Promise.all(deletePromises);
      logger.log(`Cleaned up ${deletePromises.length} old archive logs`);

      return { success: true, deletedCount: deletePromises.length };

    } catch (error) {
      logger.error('Error cleaning up archive logs:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new EventArchivingService();
