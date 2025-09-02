# Event Archiving System

## Overview

The Event Archiving System automatically manages past events to keep your database clean and improve performance. It provides both automatic and manual archiving capabilities with a comprehensive audit trail.

## Features

### ✅ **Automatic Archiving**
- Events are automatically archived 24-48 hours after they end
- Configurable buffer time to account for event extensions
- Batch processing to avoid overwhelming the database
- Comprehensive error handling and logging

### ✅ **Manual Archiving**
- Organizers can manually archive their own events
- Immediate archiving for cancelled events
- Restore functionality for accidentally archived events

### ✅ **Event Status Management**
- `active` - Event is live and visible
- `archived` - Event has ended and been archived
- `cancelled` - Event was cancelled before it started

### ✅ **Archive History & Audit Trail**
- Complete log of all archiving actions
- Track who archived what and when
- Restore history for accountability

## How It Works

### **Current Implementation (Phase 1)**
Events are automatically filtered out of queries when they have ended + 2-hour buffer:

```javascript
// Events disappear from lists automatically
const bufferTime = new Date(eventEndTime.getTime() + 2 * 60 * 60 * 1000);
if (now <= bufferTime) {
  // Show event
} else {
  // Hide event (effectively archived)
}
```

### **Future Implementation (Phase 2)**
Full archiving system with database storage:

```javascript
// Events are moved to archived collection
await eventArchivingService.archivePastEvents(24); // 24-hour buffer
```

## Database Schema

### **Events Collection**
```javascript
{
  id: "event123",
  name: "Tech Conference 2024",
  date: "2024-01-15",
  startTime: "09:00",
  endTime: "17:00",
  status: "active", // active, archived, cancelled
  isActive: true,
  organizerId: "org123",
  // ... other event fields
}
```

### **Archived Events Collection**
```javascript
{
  id: "archived_event456",
  originalEventId: "event123",
  name: "Tech Conference 2024",
  date: "2024-01-15",
  startTime: "09:00",
  endTime: "17:00",
  archivedAt: "2024-01-17T10:00:00Z",
  archivedBy: "system", // or user ID
  archiveReason: "automatic", // automatic, manual, cancelled
  archivedFrom: "events",
  originalCreatedAt: "2024-01-10T10:00:00Z",
  originalUpdatedAt: "2024-01-15T08:00:00Z",
  // ... all original event fields
}
```

### **Archive Log Collection**
```javascript
{
  id: "log789",
  eventId: "event123",
  archivedEventId: "archived_event456",
  action: "archived", // archived, restored
  userId: "system", // or user ID
  timestamp: "2024-01-17T10:00:00Z",
  createdAt: "2024-01-17T10:00:00Z"
}
```

## Usage

### **Automatic Archiving**

The system automatically archives events based on their end time:

```javascript
import eventArchivingService from './src/services/eventArchivingService';

// Archive events that ended 24 hours ago
const result = await eventArchivingService.archivePastEvents(24);

console.log(`Archived ${result.archivedCount} events`);
```

### **Manual Archiving**

Organizers can manually archive their events:

```javascript
// Archive a specific event
const result = await eventArchivingService.manualArchiveEvent(
  'event123', 
  'organizer456', 
  'Event was cancelled'
);
```

### **Restore Events**

Restore accidentally archived events:

```javascript
// Restore an archived event
const result = await eventArchivingService.restoreEvent(
  'archived_event456', 
  'organizer456'
);
```

### **Get Archive Statistics**

```javascript
const stats = await eventArchivingService.getArchiveStats();
console.log(`Active: ${stats.activeEvents}, Archived: ${stats.archivedEvents}`);
```

## Command Line Script

Run the archiving script manually or via cron job:

```bash
# Archive events with 24-hour buffer
node scripts/archiveEvents.js

# Archive events with 48-hour buffer
node scripts/archiveEvents.js --buffer-hours 48

# Preview what would be archived (dry run)
node scripts/archiveEvents.js --dry-run

# Show archive statistics
node scripts/archiveEvents.js --stats

# Clean up old archive logs
node scripts/archiveEvents.js --cleanup-logs
```

## Scheduling

### **Cron Job Example**

Add to your crontab to run daily at 2 AM:

```bash
# Archive events daily at 2 AM
0 2 * * * cd /path/to/tikiti && node scripts/archiveEvents.js --buffer-hours 24

# Clean up logs weekly on Sunday at 3 AM
0 3 * * 0 cd /path/to/tikiti && node scripts/archiveEvents.js --cleanup-logs
```

### **Cloud Functions (Firebase)**

For serverless execution:

```javascript
// functions/archiveEvents.js
const functions = require('firebase-functions');
const eventArchivingService = require('./src/services/eventArchivingService');

exports.archiveEvents = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    const result = await eventArchivingService.archivePastEvents(24);
    console.log(`Archived ${result.archivedCount} events`);
    return result;
  });
```

## Performance Benefits

### **Query Performance**
- **Faster Event Lists** - Fewer documents to scan
- **Reduced Index Size** - Smaller active events collection
- **Better Caching** - More relevant data in cache

### **Storage Optimization**
- **Cleaner Database** - Old events moved to archive
- **Reduced Costs** - Less active data to query
- **Better Organization** - Clear separation of active vs archived

### **User Experience**
- **Faster Loading** - Only relevant events shown
- **Cleaner Interface** - No outdated events cluttering the UI
- **Better Search** - Search results focus on current events

## Configuration

### **Buffer Times**
- **Default**: 24 hours after event ends
- **Recommended**: 24-48 hours for most events
- **Custom**: Configurable per event type

### **Batch Sizes**
- **Default**: 10 events per batch
- **Adjustable**: Based on database capacity
- **Delay**: 1 second between batches

### **Retention Policy**
- **Archive Logs**: 90 days (configurable)
- **Archived Events**: Permanent (can be restored)
- **Cleanup**: Automatic log cleanup

## Monitoring

### **Logs to Monitor**
```javascript
// Success logs
✅ Event event123 archived successfully
✅ Archiving complete: 15 successful, 0 failed

// Error logs
❌ Error archiving event event456: Event not found
❌ Bulk archiving failed: Database connection timeout
```

### **Metrics to Track**
- **Archive Rate**: Percentage of events archived
- **Error Rate**: Failed archiving attempts
- **Performance**: Time to complete archiving
- **Storage**: Archive collection size

## Troubleshooting

### **Common Issues**

1. **Events Not Archiving**
   - Check event end time format
   - Verify buffer time calculation
   - Check database permissions

2. **Archive Failures**
   - Review error logs
   - Check database connectivity
   - Verify event document structure

3. **Performance Issues**
   - Reduce batch size
   - Increase delay between batches
   - Check database indexes

### **Recovery**

If archiving fails:
1. Check error logs for specific issues
2. Verify database permissions
3. Test with a single event first
4. Contact support if issues persist

## Future Enhancements

### **Planned Features**
- **Smart Archiving** - ML-based archiving decisions
- **Event Analytics** - Post-event insights before archiving
- **Bulk Operations** - Archive multiple events at once
- **Archive Search** - Search through archived events
- **Export Functionality** - Export archived events to CSV/JSON

### **Integration Opportunities**
- **Analytics Dashboard** - Archive statistics and trends
- **Notification System** - Alert organizers before archiving
- **Backup System** - Automated backups before archiving
- **API Endpoints** - REST API for archive management

## Support

For issues with the archiving system:
- Check the logs for error messages
- Review this documentation
- Test with dry-run mode first
- Contact the development team

---

**Note**: This system is designed to be safe and reversible. Events can always be restored from the archive if needed.
