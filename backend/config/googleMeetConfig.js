/**
 * Google Meet API Configuration
 * For production deployment, you'll need to set up Google Calendar API
 */

const GOOGLE_MEET_CONFIG = {
  // Development: Mock implementation
  development: {
    useMock: true,
    mockMeetDomain: 'meet.google.com'
  },
  
  // Production: Requires Google Calendar API setup
  production: {
    useMock: false,
    // Add your Google Calendar API credentials here
    googleCalendar: {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    }
  },
  
  // Meeting settings
  meetingSettings: {
    defaultDuration: 60, // minutes
    allowDialIn: true,
    requirePassword: true,
    autoRecord: false
  }
};

module.exports = GOOGLE_MEET_CONFIG;
