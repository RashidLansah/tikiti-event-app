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

/**
 * Event Archiving Service
 * 
 * This service handles the automatic archiving of past events to keep the database clean
 * and improve performance. It provides both automatic and manual archiving capabilities.
 * 
 * Features:
 * - Automatic archiving of events 24-48 hours after they end
 * - Manual archiving for organizers
 * - Event status management (active, archived, cancelled)
 * - Archive history tracking
 * - Performance optimization
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
      const eventDate = new Date(event.date);
      const eventEndTime = new Date(`${event.date} ${event.endTime || '23:59'}`);
      
      // Add buffer time after event ends
      const archiveTime = new Date(eventEndTime.getTime() + bufferHours * 60 * 60 * 1000);
      
      return now >= archiveTime;
    } catch (error) {
      console.error('Error checking if event should be archived:', error);
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
      console.log(`🗂️ Archiving event ${eventId} (reason: ${reason})`);

      // Get the event document
      const eventRef = doc(db, 'events', eventId);
      const eventSnapshot = await getDocs(query(this.eventsCollection, where('__name__', '==', eventId)));
      
      if (eventSnapshot.empty) {
        throw new Error(`Event ${eventId} not found`);
      }

      const eventData = eventSnapshot.docs[0].data();
      const eventDoc = eventSnapshot.docs[0];

      // Create archived event document
      const archivedEventData = {
        ...eventData,
        originalEventId: eventId,
        archivedAt: Timestamp.now(),
        archivedBy: archivedBy,
        archiveReason: reason,
        archivedFrom: 'events',
        // Keep original timestamps for reference
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
        isActive: false, // Ensure it's not active anymore
      });

      console.log(`✅ Event ${eventId} archived successfully`);
      
      return {
        success: true,
        message: 'Event archived successfully',
        archivedEventId: archivedEventRef.id,
        originalEventId: eventId
      };

    } catch (error) {
      console.error(`❌ Error archiving event ${eventId}:`, error);
      return {
        success: false,
        message: `Failed to archive event: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Archive multiple events automatically
   * @param {number} bufferHours - Hours to wait after event ends before archiving
   * @returns {Object} - Result of bulk archiving operation
   */
  async archivePastEvents(bufferHours = 24) {
    try {
      console.log(`🗂️ Starting automatic event archiving (buffer: ${bufferHours}h)`);

      // Get all active events
      const activeEventsQuery = query(
        this.eventsCollection,
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(activeEventsQuery);
      const eventsToArchive = [];

      // Check which events should be archived
      snapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        if (this.shouldArchiveEvent(eventData, bufferHours)) {
          eventsToArchive.push(eventData);
        }
      });

      console.log(`📊 Found ${eventsToArchive.length} events to archive`);

      if (eventsToArchive.length === 0) {
        return {
          success: true,
          message: 'No events to archive',
          archivedCount: 0
        };
      }

      // Archive events in batches to avoid overwhelming the database
      const batchSize = 10;
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < eventsToArchive.length; i += batchSize) {
        const batch = eventsToArchive.slice(i, i + batchSize);
        
        const batchPromises = batch.map(event => 
          this.archiveEvent(event.id, 'automatic', null)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
            results.push({
              eventId: batch[index].id,
              success: true,
              message: 'Archived successfully'
            });
          } else {
            errorCount++;
            results.push({
              eventId: batch[index].id,
              success: false,
              message: result.reason?.message || 'Unknown error'
            });
          }
        });

        // Small delay between batches to be gentle on the database
        if (i + batchSize < eventsToArchive.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Archiving complete: ${successCount} successful, ${errorCount} failed`);

      return {
        success: true,
        message: `Archived ${successCount} events successfully`,
        archivedCount: successCount,
        errorCount: errorCount,
        results: results
      };

    } catch (error) {
      console.error('❌ Error in bulk archiving:', error);
      return {
        success: false,
        message: `Bulk archiving failed: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Manually archive an event (for organizers)
   * @param {string} eventId - Event ID to archive
   * @param {string} organizerId - ID of the organizer archiving the event
   * @param {string} reason - Reason for manual archiving
   * @returns {Object} - Result of archiving operation
   */
  async manualArchiveEvent(eventId, organizerId, reason = 'manual') {
    try {
      // Verify the organizer owns this event
      const eventSnapshot = await getDocs(query(
        this.eventsCollection, 
        where('__name__', '==', eventId)
      ));

      if (eventSnapshot.empty) {
        throw new Error('Event not found');
      }

      const eventData = eventSnapshot.docs[0].data();
      
      if (eventData.organizerId !== organizerId) {
        throw new Error('Unauthorized: You can only archive your own events');
      }

      if (eventData.status === 'archived') {
        throw new Error('Event is already archived');
      }

      return await this.archiveEvent(eventId, reason, organizerId);

    } catch (error) {
      console.error(`❌ Error in manual archiving:`, error);
      return {
        success: false,
        message: `Manual archiving failed: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Restore an archived event
   * @param {string} archivedEventId - Archived event ID
   * @param {string} restoredBy - User ID who restored the event
   * @returns {Object} - Result of restore operation
   */
  async restoreEvent(archivedEventId, restoredBy) {
    try {
      console.log(`🔄 Restoring archived event ${archivedEventId}`);

      // Get the archived event
      const archivedEventSnapshot = await getDocs(query(
        this.archivedEventsCollection,
        where('__name__', '==', archivedEventId)
      ));

      if (archivedEventSnapshot.empty) {
        throw new Error('Archived event not found');
      }

      const archivedEventData = archivedEventSnapshot.docs[0].data();
      const originalEventId = archivedEventData.originalEventId;

      // Check if original event still exists
      const originalEventSnapshot = await getDocs(query(
        this.eventsCollection,
        where('__name__', '==', originalEventId)
      ));

      if (!originalEventSnapshot.empty) {
        // Update the existing event
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
        // Create new event from archived data
        const restoredEventData = {
          ...archivedEventData,
          status: 'active',
          isActive: true,
          restoredAt: Timestamp.now(),
          restoredBy: restoredBy,
          createdAt: archivedEventData.originalCreatedAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Remove archive-specific fields
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

      // Log the restore action
      await this.logArchiveAction(originalEventId, archivedEventId, 'restored', restoredBy);

      console.log(`✅ Event ${originalEventId} restored successfully`);

      return {
        success: true,
        message: 'Event restored successfully',
        eventId: originalEventId
      };

    } catch (error) {
      console.error(`❌ Error restoring event:`, error);
      return {
        success: false,
        message: `Restore failed: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get archived events for an organizer
   * @param {string} organizerId - Organizer ID
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of archived events
   */
  async getArchivedEvents(organizerId, limit = 50) {
    try {
      const archivedEventsQuery = query(
        this.archivedEventsCollection,
        where('organizerId', '==', organizerId),
        where('archiveReason', '!=', 'restored')
      );

      const snapshot = await getDocs(archivedEventsQuery);
      const archivedEvents = [];

      snapshot.forEach((doc) => {
        archivedEvents.push({ id: doc.id, ...doc.data() });
      });

      // Sort by archive date (newest first) and limit
      return archivedEvents
        .sort((a, b) => b.archivedAt?.toDate?.() - a.archivedAt?.toDate?.())
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting archived events:', error);
      return [];
    }
  }

  /**
   * Log archive actions for audit trail
   * @param {string} eventId - Event ID
   * @param {string} archivedEventId - Archived event ID
   * @param {string} action - Action performed ('archived', 'restored')
   * @param {string} userId - User ID who performed the action
   */
  async logArchiveAction(eventId, archivedEventId, action, userId) {
    try {
      await addDoc(this.archiveLogCollection, {
        eventId: eventId,
        archivedEventId: archivedEventId,
        action: action,
        userId: userId,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error logging archive action:', error);
    }
  }

  /**
   * Get archive statistics
   * @returns {Object} - Archive statistics
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
      console.error('Error getting archive stats:', error);
      return {
        activeEvents: 0,
        archivedEvents: 0,
        totalEvents: 0,
        archiveRate: 0
      };
    }
  }

  /**
   * Clean up old archive logs (keep only last 90 days)
   * @param {number} daysToKeep - Number of days to keep logs
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

      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      console.log(`🧹 Cleaned up ${deletePromises.length} old archive logs`);

      return {
        success: true,
        deletedCount: deletePromises.length
      };

    } catch (error) {
      console.error('Error cleaning up archive logs:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default new EventArchivingService();
