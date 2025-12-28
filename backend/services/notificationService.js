/**
 * Comprehensive Notification Service - Smart Notifications & Reminders
 */

const db = require('../db');
const { getCountryMeals } = require('./comprehensiveMealDatabase');

class NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    throw new Error('Strategy must implement generateNotification method');
  }
}

class MealReminderStrategy extends NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const mealTimes = settings?.meal_times || {
      breakfast: "08:00",
      lunch: "12:00", 
      dinner: "18:00"
    };
    
    for (const [mealType, timeStr] of Object.entries(mealTimes)) {
      const [targetHour, targetMinute] = timeStr.split(':').map(Number);
      const timeDiff = Math.abs((currentHour * 60 + currentMinutes) - (targetHour * 60 + targetMinute));
      
      if (timeDiff <= 15) { // Within 15 minutes
        const countryMeals = getCountryMeals(userData.country || 'US');
        const mealSuggestions = countryMeals[mealType] || [];
        
        const todayLog = userContext.today || {};
        const caloriesConsumed = todayLog.calories || 0;
        const caloriesTarget = userContext.goals?.calories || 2000;
        const remainingCalories = caloriesTarget - caloriesConsumed;
        
        const message = this.generateMealMessage(
          mealType, 
          userData.country, 
          mealSuggestions, 
          remainingCalories,
          userData.email
        );
        
        return {
          type: 'meal',
          title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Time!`,
          message,
          scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0),
          metadata: { 
            mealType, 
            country: userData.country,
            remainingCalories,
            suggestions: mealSuggestions.slice(0, 3)
          }
        };
      }
    }
    
    return null;
  }
  
  generateMealMessage(mealType, country, suggestions, remainingCalories, email) {
    const userName = email.split('@')[0];
    const baseMessage = `Hi ${userName}! It's time for ${mealType}!`;
    
    if (suggestions.length > 0) {
      const suggestionText = suggestions.slice(0, 2).join(', ');
      return `${baseMessage} Try: ${suggestionText}. You have ${remainingCalories} calories remaining today.`;
    }
    
    return `${baseMessage} Enjoy a nutritious meal! You have ${remainingCalories} calories remaining today.`;
  }
}
class HydrationReminderStrategy extends NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    const todayLog = userContext.today || {};
    const waterIntake = todayLog.water || 0;
    const waterTarget = this.calculateWaterTarget(userData);
    const progress = (waterIntake / waterTarget) * 100;
    const interval = settings?.hydration_interval || 2; // hours
    
    // Check if user needs hydration reminder
    if (progress < 100) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Only send reminders during reasonable hours (8 AM - 10 PM)
      if (currentHour < 8 || currentHour > 22) {
        return null;
      }
      
      // Check if we should send a reminder based on interval
      // Use a simple approach: send at specific hours based on interval
      const reminderHours = [9, 11, 14, 16, 18, 20]; // Default reminder times
      const shouldRemind = reminderHours.includes(currentHour) && 
                         now.getMinutes() === 0; // Only at the top of the hour
      
      if (shouldRemind) {
        const remaining = Math.round(waterTarget - waterIntake);
        const glassesNeeded = Math.ceil(remaining / 250); // 250ml per glass
        
        return {
          type: 'hydration',
          title: 'Hydration Reminder',
          message: `Time to hydrate! You need ${remaining}ml more water (${glassesNeeded} glasses) to reach your daily goal.`,
          scheduledTime: new Date(),
          metadata: { 
            remaining, 
            glassesNeeded, 
            progress: Math.round(progress),
            waterTarget
          }
        };
      }
    }
    
    return null;
  }
  
  calculateWaterTarget(userData) {
    // 33ml per kg body weight
    const weight = parseFloat(userData.weight) || 70;
    return Math.round(weight * 33);
  }
}

class ExerciseReminderStrategy extends NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    const exerciseTime = settings?.exercise_time || "09:00";
    const [targetHour, targetMinute] = exerciseTime.split(':').map(Number);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const timeDiff = Math.abs((currentHour * 60 + currentMinutes) - (targetHour * 60 + targetMinute));
    
    if (timeDiff <= 15) {
      const todayLog = userContext.today || {};
      const hasExercised = todayLog.exercises && todayLog.exercises.length > 0;
      
      if (!hasExercised) {
        const weightGoal = userContext.goals?.weightGoal || 'maintain';
        const message = this.generateExerciseMessage(weightGoal, userData.country);
        
        return {
          type: 'exercise',
          title: 'Exercise Reminder',
          message,
          scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0),
          metadata: { 
            weightGoal,
            country: userData.country,
            hasExercised
          }
        };
      }
    }
    
    return null;
  }
  
  generateExerciseMessage(weightGoal, country) {
    const countryExercises = {
      'India': ['Yoga', 'Brisk walking', 'Cricket', 'Dancing'],
      'US': ['Gym workout', 'Running', 'Cycling', 'Swimming'],
      'China': ['Tai Chi', 'Badminton', 'Table tennis', 'Jogging']
    };
    
    const exercises = countryExercises[country] || countryExercises['US'];
    const suggestion = exercises[Math.floor(Math.random() * exercises.length)];
    
    if (weightGoal === 'loss') {
      return `Time for your workout! Try ${suggestion} for effective calorie burning.`;
    } else if (weightGoal === 'gain') {
      return `Let's build some strength! Today's perfect for ${suggestion} and resistance training.`;
    }
    
    return `Stay active! How about some ${suggestion} today?`;
  }
}
class ProgressReminderStrategy extends NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    const progressDay = settings?.progress_day || "sunday";
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3);
    
    if (today === progressDay.slice(0, 3)) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Send progress reminder at 6 PM on progress day
      if (currentHour === 18) {
        const weekData = await this.getWeeklyProgress(userData.email);
        const message = this.generateProgressMessage(weekData, userData);
        
        return {
          type: 'progress',
          title: 'Weekly Progress Check-in',
          message,
          scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0),
          metadata: { 
            weekData,
            progressDay
          }
        };
      }
    }
    
    return null;
  }
  
  async getWeeklyProgress(userEmail) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const query = `
      SELECT date, foods, exercises, water_intake 
      FROM daily_logs 
      WHERE user_email = $1 AND date >= $2
      ORDER BY date DESC
    `;
    
    const result = await db.query(query, [userEmail, oneWeekAgo]);
    return result.rows;
  }
  
  generateProgressMessage(weekData, userData) {
    const totalDays = weekData.length;
    const daysLogged = weekData.filter(day => day.foods && day.foods.length > 0).length;
    const avgWater = weekData.reduce((sum, day) => sum + (day.water_intake || 0), 0) / totalDays;
    const totalExercises = weekData.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
    
    return `Weekly Summary: You logged food ${daysLogged}/${totalDays} days. Average water intake: ${Math.round(avgWater)}ml/day. Total workouts: ${totalExercises}. Keep up the great work!`;
  }
}

class ActivityReminderStrategy extends NotificationStrategy {
  async generateNotification(userData, userContext, settings) {
    const now = new Date();
    
    // Get upcoming activities for this user
    const activitiesQuery = `
      SELECT la.*, lap.participant_email,
             CASE WHEN lap.participant_email IS NOT NULL THEN true ELSE false END as is_joined
      FROM live_activities la
      LEFT JOIN live_activity_participants lap ON la.id = lap.activity_id AND lap.participant_email = $1
      WHERE la.is_active = true 
        AND la.scheduled_start BETWEEN $2 AND $3
        AND (lap.participant_email = $1 OR la.scheduled_start > CURRENT_TIMESTAMP)
      ORDER BY la.scheduled_start ASC
    `;
    
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const result = await db.query(activitiesQuery, [userData.email, now, oneHourFromNow]);
    
    const notifications = [];
    
    for (const activity of result.rows) {
      const activityStart = new Date(activity.scheduled_start);
      const timeDiff = activityStart.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));
      
      // Send reminders: 15 minutes before and at start time (removed 5 minutes)
      if (minutesUntil === 15 || minutesUntil === 0) {
        const reminderType = minutesUntil === 0 ? 'starting' : `${minutesUntil} minutes`;
        const message = this.generateActivityReminderMessage(activity, reminderType, userData.email, activity.is_joined);
        
        notifications.push({
          type: 'activity',
          title: `Activity ${reminderType === 'starting' ? 'Starting' : 'Reminder'}`,
          message,
          scheduledTime: new Date(),
          metadata: {
            activityId: activity.id,
            activityType: activity.activity_type,
            reminderType,
            isJoined: activity.is_joined,
            startTime: activity.scheduled_start
          }
        });
      }
    }
    
    return notifications.length > 0 ? notifications : null; // Return all notifications
  }
  
  generateActivityReminderMessage(activity, reminderType, userEmail, isJoined) {
    const userName = userEmail.split('@')[0];
    const activityName = activity.title;
    
    if (!isJoined) {
      return `Hi ${userName}! ${activityName} is ${reminderType}! Don't forget to join if you're interested.`;
    }
    
    if (reminderType === 'starting') {
      return `Hi ${userName}! ${activityName} is starting now! Get ready for your ${activity.activity_type.replace('_', ' ')} session.`;
    }
    
    return `Hi ${userName}! ${activityName} starts in ${reminderType}! Prepare for your ${activity.activity_type.replace('_', ' ')} session.`;
  }
}

// Main Notification Service Class
class NotificationService {
  constructor() {
    this.strategies = {
      meal: new MealReminderStrategy(),
      hydration: new HydrationReminderStrategy(),
      exercise: new ExerciseReminderStrategy(),
      progress: new ProgressReminderStrategy(),
      activity: new ActivityReminderStrategy()
    };
    this.sentNotifications = new Map(); // Track sent notifications to prevent duplicates
  }

  async generateNotifications(userData, userContext, settings) {
    const notifications = [];
    
    for (const [type, strategy] of Object.entries(this.strategies)) {
      if (settings[`${type}_reminders`] !== false) {
        const notification = await strategy.generateNotification(userData, userContext, settings);
        if (notification) {
          // Handle case where notification might be an array (from ActivityReminderStrategy)
          const notificationsToProcess = Array.isArray(notification) ? notification : [notification];
          
          for (const notif of notificationsToProcess) {
            // Create a unique key for this notification
            const key = `${userData.email}-${type}-${notif.title}-${new Date().getHours()}`;
            
            // Only add notification if not already sent in the last hour
            if (!this.sentNotifications.has(key) || 
                Date.now() - this.sentNotifications.get(key) > 60 * 60 * 1000) {
              notifications.push(notif);
              this.sentNotifications.set(key, Date.now());
            }
          }
        }
      }
    }
    
    return notifications;
  }

  async saveNotification(userEmail, notification) {
    // Handle case where notification might be an array (from ActivityReminderStrategy)
    const notificationToSave = Array.isArray(notification) ? notification[0] : notification;
    
    // Ensure title is not null
    const title = notificationToSave.title || 'Notification';
    
    const query = `
      INSERT INTO notification_logs 
      (user_email, notification_type, title, message, scheduled_time, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userEmail,
      notificationToSave.type || 'general',
      title,
      notificationToSave.message,
      notificationToSave.scheduledTime,
      JSON.stringify(notificationToSave.metadata)
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async getUserNotificationSettings(userEmail) {
    const query = `
      SELECT * FROM notification_settings WHERE user_email = $1
    `;
    
    const result = await db.query(query, [userEmail]);
    return result.rows[0] || this.getDefaultSettings();
  }

  async updateUserNotificationSettings(userEmail, settings) {
    const query = `
      INSERT INTO notification_settings 
      (user_email, meal_reminders, hydration_reminders, exercise_reminders, progress_reminders, 
       meal_times, hydration_interval, exercise_time, progress_day, notification_channels)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_email) 
      DO UPDATE SET 
        meal_reminders = $2, hydration_reminders = $3, exercise_reminders = $4, progress_reminders = $5,
        meal_times = $6, hydration_interval = $7, exercise_time = $8, progress_day = $9,
        notification_channels = $10, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      userEmail,
      settings.meal_reminders,
      settings.hydration_reminders,
      settings.exercise_reminders,
      settings.progress_reminders,
      JSON.stringify(settings.meal_times),
      settings.hydration_interval,
      settings.exercise_time,
      settings.progress_day,
      JSON.stringify(settings.notification_channels)
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async getNotificationHistory(userEmail, limit = 50) {
    const query = `
      SELECT * FROM notification_logs 
      WHERE user_email = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await db.query(query, [userEmail, limit]);
    return result.rows;
  }

  getDefaultSettings() {
    return {
      meal_reminders: true,
      hydration_reminders: true,
      exercise_reminders: true,
      progress_reminders: true,
      activity_reminders: true,
      meal_times: {
        breakfast: "08:00",
        lunch: "13:30",
        dinner: "21:00"
      },
      hydration_interval: 2,
      exercise_time: "18:00",
      progress_day: "sunday",
      notification_channels: {
        in_app: true,
        email: true
      }
    };
  }

  async sendEmailNotification(userEmail, notification) {
    try {
      const nodemailer = require('nodemailer');
      
      // For development, try to send with Gmail or use ethereal test account
      if (process.env.NODE_ENV !== 'production') {
        // Try to use Gmail if credentials are available and not placeholder
        if (process.env.SMTP_USER && process.env.SMTP_PASS && 
            process.env.SMTP_USER !== 'your-email@gmail.com' && 
            process.env.SMTP_PASS !== 'your-app-password') {
          try {
            console.log(`[EMAIL] Attempting Gmail send to ${userEmail}`);
            let transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: process.env.SMTP_PORT || 587,
              secure: false,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            });

            const mailOptions = {
              from: process.env.SMTP_FROM || 'NutriMind <noreply@nutrimind.ai>',
              to: userEmail,
              subject: notification.title,
              text: notification.message,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #3b82f6;">${notification.title}</h2>
                  <p style="color: #374151; line-height: 1.6;">${notification.message}</p>
                  <div style="margin-top: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 8px;">
                    <p style="font-size: 12px; color: #6b7280;">
                      This is an automated notification from NutriMind. 
                      You can manage your notification settings in your profile.
                    </p>
                  </div>
                </div>
              `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Real Gmail sent to ${userEmail}:`, notification.title);
            return { success: true };
          } catch (gmailError) {
            console.log(`[EMAIL] Gmail failed, falling back to Ethereal: ${gmailError.message}`);
          }
        } else {
          console.log(`[EMAIL] Gmail credentials not set or using placeholders, using Ethereal`);
        }
        
        // Use ethereal test account for development (fallback)
        let testAccount = await nodemailer.createTestAccount();
        let transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        const mailOptions = {
          from: 'NutriMind <noreply@nutrimind.ai>',
          to: userEmail,
          subject: notification.title,
          text: notification.message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">${notification.title}</h2>
              <p style="color: #374151; line-height: 1.6;">${notification.message}</p>
              <div style="margin-top: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="font-size: 12px; color: #6b7280;">
                  This is an automated notification from NutriMind. 
                  You can manage your notification settings in your profile.
                </p>
              </div>
            </div>
          `
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Ethereal email sent to ${userEmail}:`, notification.title);
        console.log(`[EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return { success: true, test: true, previewUrl: nodemailer.getTestMessageUrl(info) };
      }

      // Create a test account for production (replace with real SMTP)
      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || 'NutriMind <noreply@nutrimind.ai>',
        to: userEmail,
        subject: notification.title,
        text: notification.message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">${notification.title}</h2>
            <p style="color: #374151; line-height: 1.6;">${notification.message}</p>
            <div style="margin-top: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="font-size: 12px; color: #6b7280;">
                This is an automated notification from NutriMind. 
                You can manage your notification settings in your profile.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  async processNotifications() {
    const usersQuery = `
      SELECT email, last_name, weight, height, age, gender, country 
      FROM users 
      WHERE email IS NOT NULL
    `;
    
    const usersResult = await db.query(usersQuery);
    
    for (const user of usersResult.rows) {
      try {
        const settings = await this.getUserNotificationSettings(user.email);
        const notifications = await this.generateNotifications(user, {}, settings);
        
        for (const notification of notifications) {
          // Save notification to database
          await this.saveNotification(user.email, notification);
          
          // Send in-app notification (already handled by frontend polling)
          if (settings.notification_channels?.in_app) {
            // In-app notifications are handled by frontend polling
          }
          
          // Send email notification
          if (settings.notification_channels?.email) {
            await this.sendEmailNotification(user.email, notification);
          }
        }
      } catch (error) {
        console.error(`Error processing notifications for ${user.email}:`, error);
      }
    }
  }
}

module.exports = NotificationService;