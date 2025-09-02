#!/usr/bin/env node

/**
 * Event Archiving Script
 * 
 * This script can be run manually or scheduled via cron job to automatically
 * archive past events. It's designed to keep the database clean and improve
 * performance by moving old events to an archived collection.
 * 
 * Usage:
 *   node scripts/archiveEvents.js [options]
 * 
 * Options:
 *   --buffer-hours <hours>  Hours to wait after event ends before archiving (default: 24)
 *   --dry-run              Show what would be archived without actually archiving
 *   --stats                Show archive statistics
 *   --cleanup-logs         Clean up old archive logs
 *   --help                 Show this help message
 * 
 * Examples:
 *   node scripts/archiveEvents.js                    # Archive events with 24h buffer
 *   node scripts/archiveEvents.js --buffer-hours 48  # Archive events with 48h buffer
 *   node scripts/archiveEvents.js --dry-run          # Preview what would be archived
 *   node scripts/archiveEvents.js --stats            # Show archive statistics
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import eventArchivingService from '../src/services/eventArchivingService.js';

// Firebase configuration (you may need to adjust this based on your setup)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your existing Firebase configuration
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  bufferHours: 24,
  dryRun: false,
  stats: false,
  cleanupLogs: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--buffer-hours':
      options.bufferHours = parseInt(args[++i]) || 24;
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--stats':
      options.stats = true;
      break;
    case '--cleanup-logs':
      options.cleanupLogs = true;
      break;
    case '--help':
      options.help = true;
      break;
    default:
      console.log(`Unknown option: ${arg}`);
      process.exit(1);
  }
}

// Show help
if (options.help) {
  console.log(`
Event Archiving Script

Usage: node scripts/archiveEvents.js [options]

Options:
  --buffer-hours <hours>  Hours to wait after event ends before archiving (default: 24)
  --dry-run              Show what would be archived without actually archiving
  --stats                Show archive statistics
  --cleanup-logs         Clean up old archive logs
  --help                 Show this help message

Examples:
  node scripts/archiveEvents.js                    # Archive events with 24h buffer
  node scripts/archiveEvents.js --buffer-hours 48  # Archive events with 48h buffer
  node scripts/archiveEvents.js --dry-run          # Preview what would be archived
  node scripts/archiveEvents.js --stats            # Show archive statistics
`);
  process.exit(0);
}

// Main execution
async function main() {
  try {
    console.log('🗂️ Event Archiving Script Started');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`⚙️  Options:`, options);
    console.log('');

    // Show statistics
    if (options.stats) {
      console.log('📊 Archive Statistics:');
      const stats = await eventArchivingService.getArchiveStats();
      console.log(`   Active Events: ${stats.activeEvents}`);
      console.log(`   Archived Events: ${stats.archivedEvents}`);
      console.log(`   Total Events: ${stats.totalEvents}`);
      console.log(`   Archive Rate: ${stats.archiveRate.toFixed(1)}%`);
      console.log('');
    }

    // Clean up old logs
    if (options.cleanupLogs) {
      console.log('🧹 Cleaning up old archive logs...');
      const cleanupResult = await eventArchivingService.cleanupArchiveLogs(90);
      if (cleanupResult.success) {
        console.log(`✅ Cleaned up ${cleanupResult.deletedCount} old archive logs`);
      } else {
        console.log(`❌ Cleanup failed: ${cleanupResult.message}`);
      }
      console.log('');
    }

    // Archive events
    if (!options.stats && !options.cleanupLogs) {
      if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No events will be archived');
        console.log(`⏰ Buffer: ${options.bufferHours} hours after event ends`);
        console.log('');
        
        // In dry run mode, we would need to implement a preview function
        // For now, just show what the archiving service would do
        console.log('📋 Events that would be archived:');
        console.log('   (Dry run preview not implemented yet)');
        console.log('   Run without --dry-run to actually archive events');
        
      } else {
        console.log('🗂️ Starting automatic event archiving...');
        console.log(`⏰ Buffer: ${options.bufferHours} hours after event ends`);
        console.log('');
        
        const result = await eventArchivingService.archivePastEvents(options.bufferHours);
        
        if (result.success) {
          console.log(`✅ Archiving completed successfully!`);
          console.log(`📊 Results:`);
          console.log(`   Events archived: ${result.archivedCount}`);
          console.log(`   Errors: ${result.errorCount}`);
          console.log(`   Message: ${result.message}`);
          
          if (result.errorCount > 0) {
            console.log('');
            console.log('❌ Errors encountered:');
            result.results
              .filter(r => !r.success)
              .forEach(r => {
                console.log(`   Event ${r.eventId}: ${r.message}`);
              });
          }
        } else {
          console.log(`❌ Archiving failed: ${result.message}`);
          if (result.error) {
            console.log(`   Error details: ${result.error.message}`);
          }
        }
      }
    }

    console.log('');
    console.log('🏁 Script completed');

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
