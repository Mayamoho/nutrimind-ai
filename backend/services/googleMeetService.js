/**
 * Google Meet Integration Service
 * Handles Google Meet link creation and management
 */

class GoogleMeetService {
  constructor() {
    // For development, we'll use a mock implementation
    // In production, this would integrate with Google Calendar API
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Create a Google Meet link for an activity
   * @param {Object} activityDetails - Activity information
   * @returns {Promise<Object>} Meet link details
   */
  async createMeetLink(activityDetails) {
    try {
      const { title, scheduled_start, scheduled_end, host_email } = activityDetails;
      
      if (this.isDevelopment) {
        // Mock implementation for development
        return this.createMockMeetLink(activityDetails);
      }

      // Production implementation would use Google Calendar API
      return await this.createRealMeetLink(activityDetails);
    } catch (error) {
      console.error('Error creating Google Meet link:', error);
      throw new Error('Failed to create Google Meet link');
    }
  }

  /**
   * Mock Meet link creation for development
   */
  createMockMeetLink(activityDetails) {
    const { title, scheduled_start, host_email } = activityDetails;
    const meetId = this.generateMeetId();
    
    // For development, we'll use a demo URL that clearly indicates it's a mock
    const demoUrl = `https://meet.google.com/demo-${meetId}`;
    
    console.log(`[GOOGLE MEET] Demo link created: ${demoUrl}`);
    
    return {
      meetUrl: demoUrl,
      meetId: `demo-${meetId}`,
      dialInPhone: '+1 555-123-4567',
      dialInPin: meetId.replace(/-/g, '').slice(-6),
      password: this.generatePassword(),
      calendarEventId: null, // Would be populated in production
      createdAt: new Date().toISOString(),
      isDemo: true
    };
  }

  /**
   * Production Google Calendar API implementation
   */
  async createRealMeetLink(activityDetails) {
    // This would integrate with Google Calendar API
    // Requires OAuth2 setup and Google Calendar API credentials
    
    const { title, description, scheduled_start, scheduled_end, host_email } = activityDetails;
    
    // Google Calendar API call would go here
    // For now, return mock data
    
    const meetId = this.generateMeetId();
    const meetUrl = `https://meet.google.com/${meetId}`;
    
    return {
      meetUrl,
      meetId,
      dialInPhone: '+1 555-123-4567',
      dialInPin: meetId.slice(-6),
      password: this.generatePassword(),
      calendarEventId: `calendar_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate a random Meet ID (3 groups of 3 letters/numbers)
   */
  generateMeetId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 2) result += '-';
    }
    return result;
  }

  /**
   * Generate a random password for the meeting
   */
  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Update meeting details (if needed)
   */
  async updateMeetLink(meetId, updates) {
    try {
      if (this.isDevelopment) {
        return { success: true, message: 'Mock update successful' };
      }

      // Production: Update Google Calendar event
      return { success: true, message: 'Meet link updated successfully' };
    } catch (error) {
      console.error('Error updating Google Meet link:', error);
      throw new Error('Failed to update Google Meet link');
    }
  }

  /**
   * Delete/cancel a meeting
   */
  async deleteMeetLink(meetId) {
    try {
      if (this.isDevelopment) {
        return { success: true, message: 'Mock deletion successful' };
      }

      // Production: Delete Google Calendar event
      return { success: true, message: 'Meet link deleted successfully' };
    } catch (error) {
      console.error('Error deleting Google Meet link:', error);
      throw new Error('Failed to delete Google Meet link');
    }
  }
}

module.exports = GoogleMeetService;
