import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import React, { useState, useEffect } from "react";
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Define a background task name
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Track pending notifications with their scheduled times
let pendingNotifications = new Map(); // Change to Map to store timing info
let isNavigatingFromManualEntry = false;
let recentlyScheduledIds = new Set();

// Add export for the setupNotificationListeners function
export const setupNotificationListeners = () => {
  console.log('[NOTIFICATION] Setting up notification listeners');

  // This listener handles foreground notifications
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    const notificationId = notification.request.identifier;
    console.log('[NOTIFICATION LISTENER] Received in foreground:', notificationId);

    // Store the scheduled time if it's not already stored
    if (!pendingNotifications.has(notificationId) && notification.request.trigger?.seconds) {
      const triggerTime = new Date().getTime() + (notification.request.trigger.seconds * 1000);
      pendingNotifications.set(notificationId, triggerTime);
      console.log('[NOTIFICATION LISTENER] Added trigger time for:', notificationId, new Date(triggerTime).toString());
    }
  });

  // This listener handles notification responses (when user taps)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[NOTIFICATION LISTENER] User responded to notification');
    const { notification } = response;
    const { data } = notification.request.content;

    if (data && data.reminderId) {
      console.log('[NOTIFICATION LISTENER] Handling reminder:', data.reminderId);
      // Handle the reminder action (e.g., mark as taken)
      // You can add code here to update the reminder status
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};

// Register the background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('[BACKGROUND] Checking for due notifications');
    const now = new Date().getTime();

    // Check all pending notifications
    let hasShownNotification = false;

    pendingNotifications.forEach((scheduledTime, notificationId) => {
      // If it's time to show the notification
      if (now >= scheduledTime && recentlyScheduledIds.has(notificationId)) {
        console.log('[BACKGROUND] Showing notification:', notificationId);

        // Get the notification data
        Notifications.getAllScheduledNotificationsAsync().then(notifications => {
          const notification = notifications.find(n => n.identifier === notificationId);
          if (notification) {
            // Reschedule it to show immediately
            Notifications.scheduleNotificationAsync({
              content: notification.content,
              trigger: null, // Show immediately
            });
          }
        });

        // Remove from tracking
        recentlyScheduledIds.delete(notificationId);
        pendingNotifications.delete(notificationId);

        hasShownNotification = true;
      }
    });

    return hasShownNotification
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BACKGROUND] Error in background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background fetch
const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60, // 1 minute minimum
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[BACKGROUND] Registered background fetch');
    return true;
  } catch (error) {
    console.error('[BACKGROUND] Error registering background fetch:', error);
    return false;
  }
};

// Add the export statement for initializeNotifications
export const initializeNotifications = async () => {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('[NOTIFICATION] Permission not granted');
      return false;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const notificationId = notification.request.identifier;
        console.log('[NOTIFICATION HANDLER] Received notification:', notificationId);

        // Get the current time
        const now = new Date().getTime();

        // Get the scheduled time for this notification
        const scheduledTime = pendingNotifications.get(notificationId);
        console.log('[NOTIFICATION HANDLER] Scheduled time:', scheduledTime ? new Date(scheduledTime).toString() : 'unknown');
        console.log('[NOTIFICATION HANDLER] Current time:', new Date(now).toString());

        // If this is a recently scheduled notification AND we're still navigating, suppress it
        if (recentlyScheduledIds.has(notificationId) && isNavigatingFromManualEntry) {
          console.log('[NOTIFICATION HANDLER] Navigation in progress, suppressing notification');
          return {
            shouldShowAlert: false,
            shouldPlaySound: true,
            shouldSetBadge: false,
          };
        }

        // If this is a scheduled notification that should be shown now
        if (scheduledTime) {
          // If it's time to show the notification (or past time)
          if (now >= scheduledTime - 1000) { // 1 second buffer
            console.log('[NOTIFICATION HANDLER] Time to show notification:', notificationId);
            // Remove from tracking
            pendingNotifications.delete(notificationId);
            recentlyScheduledIds.delete(notificationId);
            // Show the notification
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            };
          } else {
            // Not time yet, suppress
            console.log('[NOTIFICATION HANDLER] Not time yet, suppressing');
            return {
              shouldShowAlert: false,
              shouldPlaySound: true,
              shouldSetBadge: false,
            };
          }
        }

        // Default behavior for notifications we're not tracking
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'medbuddy.wav',
        enableVibrate: false,
      });
    }

    // Register background fetch
    await registerBackgroundFetch();

    // Set up a timer to check for due notifications
    setInterval(() => {
      checkDueNotifications();
    }, 10000); // Check every 10 seconds

    console.log('[NOTIFICATION] Initialization complete');
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Error initializing notifications:', error);
    return false;
  }
};
// Add this export function to cancel notifications
export const cancelNotification = async (notificationId) => {
  try {
    console.log('[NOTIFICATION] Cancelling notification:', notificationId);

    // Remove from our tracking maps
    pendingNotifications.delete(notificationId);
    recentlyScheduledIds.delete(notificationId);

    // Cancel the actual notification
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    console.log('[NOTIFICATION] Successfully cancelled notification:', notificationId);
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Error cancelling notification:', error);
    return false;
  }
};
const checkDueNotifications = async () => {
  try {
    console.log('[NOTIFICATION] Checking for due notifications');
    const now = new Date().getTime();

    // Check all pending notifications
    pendingNotifications.forEach((scheduledTime, notificationId) => {
      // If it's time to show the notification
      if (now >= scheduledTime && recentlyScheduledIds.has(notificationId)) {
        console.log('[NOTIFICATION] Time to show notification:', notificationId);

        // Get all scheduled notifications
        Notifications.getAllScheduledNotificationsAsync().then(notifications => {
          // Find our notification
          const notification = notifications.find(n => n.identifier === notificationId);

          if (notification) {
            // Cancel the original notification
            Notifications.cancelScheduledNotificationAsync(notificationId).then(() => {
              // Create a new notification with the same content but show immediately
              const content = notification.request.content;

              // Force the notification to show by using Notifications.presentNotificationAsync
              Notifications.presentNotificationAsync(content).then(newId => {
                console.log('[NOTIFICATION] Presented notification immediately with ID:', newId);
              }).catch(error => {
                console.error('[NOTIFICATION] Error presenting notification:', error);

                // Fallback: try scheduling with null trigger
                Notifications.scheduleNotificationAsync({
                  content,
                  trigger: null, // Show immediately
                }).then(fallbackId => {
                  console.log('[NOTIFICATION] Fallback: scheduled immediate notification with ID:', fallbackId);
                });
              });
            });
          } else {
            console.log('[NOTIFICATION] Could not find notification to reschedule:', notificationId);

            // Even if we can't find the original notification, create a generic one
            // This ensures the user still gets notified even if the original was lost
            const lastKnownData = getLastKnownReminderData(notificationId);
            if (lastKnownData) {
              // In the checkDueNotifications function, update the genericContent
              const genericContent = {
                title: `Hey ${lastKnownData.userName || 'there'}! Time for your medication`,
                body: lastKnownData.customMessage || `It's time to take your ${lastKnownData.medicineName}`,
                sound: 'medbuddy.wav',
                priority: 'max',
                badge: 1,
                color: '#4CAF50', // Green color for the notification icon (Android)
                categoryId: 'medication', // For iOS category actions
                autoDismiss: false, // Keep notification in the tray until user dismisses it
                data: lastKnownData
              };

              // For Android, add enhanced styling
              if (Platform.OS === 'android') {
                genericContent.android = {
                  channelId: 'medication-reminders',
                  color: '#4CAF50',
                  smallIcon: 'ic_notification',
                  style: {
                    type: 'bigtext',
                    title: `Hey ${lastKnownData.userName || 'there'}! 💊`,
                    summary: 'Medication Reminder',
                    bigText: `It's time to take your ${lastKnownData.medicineName}.\n\n${lastKnownData.pills} pill(s) ${lastKnownData.mealRelation} your ${lastKnownData.timeLabel} meal.\n\nStay healthy!`,
                  },
                  sound: true,
                };
              }

              // For iOS, add additional styling
              if (Platform.OS === 'ios') {
                genericContent.ios = {
                  sound: true,
                  _displayInForeground: true,
                  attachments: [
                    // You can add an image attachment if needed
                    // {
                    //   url: 'asset://assets/images/pill_icon.png',
                    //   identifier: 'pillImage',
                    // }
                  ]
                };
              }

              // Show the generic notification immediately
              Notifications.presentNotificationAsync(genericContent).then(newId => {
                console.log('[NOTIFICATION] Presented generic notification with ID:', newId);
              });
            } else {
              console.error('[NOTIFICATION] No data available to create generic notification');
            }
          }
        });

        // Remove from tracking
        recentlyScheduledIds.delete(notificationId);
        pendingNotifications.delete(notificationId);
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error checking due notifications:', error);
  }
};
// Add these helper functions before they're used
// Helper function to get last known reminder data
const reminderDataCache = new Map();

// Add this function to store reminder data when scheduling
const storeReminderData = (notificationId, reminderData) => {
  //hi
  reminderDataCache.set(notificationId, reminderData);
};

// Add this function to retrieve last known reminder data
const getLastKnownReminderData = (notificationId) => {
  return reminderDataCache.get(notificationId) || null;
};

// Add the export for setNavigatingFlag
export const setNavigatingFlag = (value) => {
  console.log('[NOTIFICATION] Setting navigation flag to:', value);
  isNavigatingFromManualEntry = value;

  // Only set timeout when enabling the flag
  if (value === true) {
    setTimeout(() => {
      console.log('[NOTIFICATION] Auto-resetting navigation flag after timeout');
      isNavigatingFromManualEntry = false;
      // We're NOT clearing recentlyScheduledIds here anymore
    }, 5000);
  }
};

// Add the export for scheduleNotification
export const scheduleNotification = async (reminder) => {
  try {
    console.log('[NOTIFICATION] Starting scheduling process...');
    console.log('[NOTIFICATION] Navigation flag status:', isNavigatingFromManualEntry);
    console.log('[NOTIFICATION] Full reminder data:', JSON.stringify(reminder, null, 2));

    // Create a Date object from the reminder's date and time
    const reminderDate = reminder.reminderDate; // Format: "YYYY-MM-DD"
    const reminderTime = reminder.reminderTime; // Format: "h:mm AM/PM"

    console.log('[NOTIFICATION] Extracted date/time:', {
      date: reminderDate,
      time: reminderTime
    });

    if (!reminderDate || !reminderTime) {
      console.error('[NOTIFICATION] Missing date or time in reminder!');
      return null;
    }

    // Parse the time
    const timeParts = reminderTime.split(' ');
    if (timeParts.length !== 2) {
      console.error('[NOTIFICATION] Invalid time format:', reminderTime);
      return null;
    }

    const [timeValue, period] = timeParts;
    const timeSplit = timeValue.split(':');
    if (timeSplit.length !== 2) {
      console.error('[NOTIFICATION] Invalid time value format:', timeValue);
      return null;
    }

    let [hours, minutes] = timeSplit.map(Number);
    console.log('[NOTIFICATION] Parsed time components:', { hours, minutes, period });

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    console.log('[NOTIFICATION] Converted to 24h format:', { hours, minutes });

    // Parse the date
    const dateParts = reminderDate.split('-');
    if (dateParts.length !== 3) {
      console.error('[NOTIFICATION] Invalid date format:', reminderDate);
      return null;
    }

    const [year, month, day] = dateParts.map(Number);
    console.log('[NOTIFICATION] Parsed date components:', { day, month, year });

    // Create the trigger date
    const triggerDate = new Date();
    // Clear time components first to avoid any unexpected behavior
    triggerDate.setHours(0, 0, 0, 0);
    triggerDate.setFullYear(year, month - 1, day); // month is 0-indexed
    triggerDate.setHours(hours, minutes, 0, 0);

    console.log('[NOTIFICATION] Created trigger date:', triggerDate.toString());

    // Calculate time until trigger
    const now = new Date();
    const triggerTimestamp = triggerDate.getTime();
    const currentTimestamp = now.getTime();
    const timeUntilTrigger = triggerTimestamp - currentTimestamp;

    console.log('[NOTIFICATION] Trigger timestamp:', triggerTimestamp);
    console.log('[NOTIFICATION] Current time:', now.toString());
    console.log('[NOTIFICATION] Current timestamp:', currentTimestamp);
    console.log('[NOTIFICATION] Time until trigger (ms):', timeUntilTrigger);
    console.log('[NOTIFICATION] Time until trigger (seconds):', timeUntilTrigger / 1000);

    // If the time is in the past, don't schedule
    if (timeUntilTrigger < 0) {
      console.error('[NOTIFICATION] Cannot schedule notification in the past');
      return null;
    }
    // Calculate seconds until trigger (rounded down)
    const secondsUntilTrigger = Math.floor(timeUntilTrigger / 1000);
    console.log('[NOTIFICATION] Will trigger in', secondsUntilTrigger, 'seconds');
    // In the scheduleNotification function, let's update the notification content
    const content = {
      title: `Hey ${reminder.userName || 'there'}! Time for your medication`,
      body: `${reminder.medicineName}: ${reminder.pills} pill(s) ${reminder.mealRelation} your ${reminder.timeLabel} meal`,
      sound: 'medbuddy.wav',
      priority: 'max',
      badge: 1,
      color: '#4CAF50', // Green color for the notification icon (Android)
      categoryId: 'medication', // For iOS category actions
      autoDismiss: false, // Keep notification in the tray until user dismisses it
      data: {
        reminderId: reminder.id,
        userId: reminder.userId,
        userName: reminder.userName,
        medicineName: reminder.medicineName,
        pills: reminder.pills,
        mealRelation: reminder.mealRelation,
        timeLabel: reminder.timeLabel,
        reminderDate: reminder.reminderDate,
        reminderTime: reminder.reminderTime
      }
    };

    // For Android, we can enhance the styling
    if (Platform.OS === 'android') {
      content.android = {
        channelId: 'medication-reminders',
        color: '#4CAF50',
        smallIcon: 'ic_notification',
        largeIcon: reminder.medicineImage || null, // Optional: display medicine image if available
        style: {
          type: 'bigtext',
          title: `Hey ${reminder.userName || 'there'}! 💊`,
          summary: 'Medication Reminder',
          bigText: `It's time to take your ${reminder.medicineName}.\n\n${reminder.pills} pill(s) ${reminder.mealRelation} your ${reminder.timeLabel} meal.\n\nStay healthy!`,
        },
        sound: true,
      };
    }

    // For iOS, we can add additional styling
    if (Platform.OS === 'ios') {
      content.ios = {
        sound: true,
        _displayInForeground: true,
        attachments: [
          // You can add an image attachment if needed
          // {
          //   url: 'asset://assets/images/pill_icon.png',
          //   identifier: 'pillImage',
          // }
        ]
      };
    }

    console.log('[NOTIFICATION] Notification content:', JSON.stringify(content, null, 2));

    // Schedule the notification with seconds-based trigger for better reliability
    console.log('[NOTIFICATION] Using seconds-based trigger for reliability');
    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        seconds: secondsUntilTrigger,
      },
    });

    console.log('[NOTIFICATION] Successfully scheduled with ID:', notificationId);

    // Store the notification ID and trigger time
    const triggerTime = new Date().getTime() + (secondsUntilTrigger * 1000);
    pendingNotifications.set(notificationId, triggerTime);
    recentlyScheduledIds.add(notificationId);
    // Store reminder data for fallback
    storeReminderData(notificationId, {
      reminderId: reminder.id,
      userId: reminder.userId,
      userName: reminder.userName,
      medicineName: reminder.medicineName,
      pills: reminder.pills,
      mealRelation: reminder.mealRelation,
      timeLabel: reminder.timeLabel,
      customMessage: `Hey ${reminder.userName || 'there'}! Time to take ${reminder.medicineName}: ${reminder.pills} pill(s) ${reminder.mealRelation} your ${reminder.timeLabel} meal`
    });

    console.log('[NOTIFICATION] Added to pending notifications with trigger time:', new Date(triggerTime).toString());

    return notificationId;
  } catch (error) {
    console.error('[NOTIFICATION] Scheduling error:', error);
    return null;
  }
};