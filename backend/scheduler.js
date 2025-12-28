/**
 * Notification Scheduler
 * Runs notification processing at regular intervals
 */

const NotificationService = require('./services/notificationService');

class NotificationScheduler {
  constructor() {
    this.notificationService = new NotificationService();
    this.interval = null;
    this.isRunning = false;
  }

  start(intervalMinutes = 1) {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    console.log(`Starting notification scheduler (runs every ${intervalMinutes} minute(s))`);
    this.isRunning = true;
    
    // Run immediately on start
    this.processNotifications();
    
    // Then run at specified interval
    this.interval = setInterval(() => {
      this.processNotifications();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
      console.log('Notification scheduler stopped');
    }
  }

  async processNotifications() {
    try {
      console.log(`[SCHEDULER] Processing notifications at ${new Date().toISOString()}`);
      await this.notificationService.processNotifications();
      console.log(`[SCHEDULER] Notification processing completed`);
    } catch (error) {
      console.error('[SCHEDULER] Error processing notifications:', error);
    }
  }

  // Method to get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.interval ? new Date(Date.now() + (this.interval._idleTimeout || 60000)) : null
    };
  }
}

// Create singleton instance
const scheduler = new NotificationScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping scheduler...');
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;
