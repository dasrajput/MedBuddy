import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMealData } from '../mealtime/MealTimeLogic'; // Use the custom hook for meal data management
import ImageUploader from '../components/ImageUploader'; // Import the ImageUploader component
import * as Clipboard from 'expo-clipboard';
// Update the imports at the top of the file to include getDoc
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { cancelNotification } from '../services/notificationService';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ route }) => {
  const { userId,name, refreshReminders } = route.params || {};
  const navigation = useNavigation();
  const [uploadedImageData, setUploadedImageData] = useState(null);
  const [activeReminders, setActiveReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [crossLoading, setCrossLoading] = useState(false);
  const [loadHistory, setLoadHistory] = useState(false);

  if (!userId) {
    Alert.alert("Error", "User authentication required");
    navigation.navigate('Login');
    return null;
  }

  // Use the custom hook to fetch meal data and provide update functionality
  const { totalMeals, mealTimes, updateMealData } = useMealData(userId);

  // Function to render meal slots based on totalMeals and mealTimes
  const renderMealSlots = () => {
    // Ensure mealTimes is defined and is an array
    if (!mealTimes || !Array.isArray(mealTimes)) {
      return <Text style={styles.mealText}>No meal times available.</Text>; // Display a message if mealTimes is not available
    }

    const slotsToRender = mealTimes.slice(0, totalMeals); // Render meal slots up to the totalMeals count
    return slotsToRender.map((meal, index) => (
      <View key={index} style={styles.mealSlot}>
        <Text style={styles.mealText}>
          {meal.name} Meal: <Text style={styles.mealTimeText}>{meal.time}</Text>
        </Text>
      </View>
    ));
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const remindersQuery = query(
        collection(firestore, 'reminders'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(remindersQuery);
      const reminders = [];
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() });
      });
      setActiveReminders(reminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update the cancelReminder function
  const cancelReminder = async (reminderId) => {
    try {
      setCrossLoading(true);

      // Get the reminder document to access the notification ID
      const reminderRef = doc(firestore, 'reminders', reminderId);
      const reminderDoc = await getDoc(reminderRef);

      if (!reminderDoc.exists()) {
        throw new Error('Reminder not found');
      }

      const reminderData = reminderDoc.data();

      // Cancel the notification if it exists
      if (reminderData && reminderData.notificationId) {
        await cancelNotification(reminderData.notificationId);
        console.log('Notification cancelled:', reminderData.notificationId);
      }

      // Update the reminder status in Firestore
      await updateDoc(reminderRef, { status: 'cancelled' });

      Alert.alert('Reminder cancelled successfully.');
      fetchReminders();
      setCrossLoading(false);
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      Alert.alert('Error', `Failed to cancel reminder: ${error.message}`);
      setCrossLoading(false);
    }
  };

  // Modify the cancelAllReminders function
  const cancelAllReminders = async () => {
    try {
      setCrossLoading(true);
      const remindersQuery = query(
        collection(firestore, 'reminders'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(remindersQuery);

      const promises = querySnapshot.docs.map(async doc => {
        const reminderData = doc.data();
        const reminderRef = doc.ref;

        // Cancel the notification if it exists
        if (reminderData.notificationId) {
          await cancelNotification(reminderData.notificationId);
        }

        // Update the reminder status in Firestore
        return updateDoc(reminderRef, { status: 'cancelled' });
      });

      await Promise.all(promises);
      Alert.alert('All active reminders have been cancelled.');
      fetchReminders();
      setCrossLoading(false);
    } catch (error) {
      console.error('Error cancelling reminders:', error);
      setCrossLoading(false);
    }
  };



  useEffect(() => {
    fetchReminders(); // Fetch reminders when the component mounts
    if (route.params?.refresh) {
      fetchReminders();
      navigation.setParams({ refresh: false });
    }
  }, [route.params]);

  useFocusEffect(
    React.useCallback(() => {
      fetchReminders(); // Fetch reminders whenever the screen is focused
    }, [])
  );

  const handleEditMealTimes = async () => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to edit meal times? All active reminders will be cancelled.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            setNavigating(true);
            await cancelAllReminders(); // Cancel all reminders
            setTimeout(() => {
              navigation.navigate('MealTimeEdit', { userId, updateMealData }); // Navigate to MealTimeEdit
              setNavigating(false); // Stop loading
            }, 2000); // Adjust the delay as needed
          },
        },
      ],
      { cancelable: false }
    );
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Meal Schedule Box */}
      <View style={styles.scheduleBox}>
        <Text style={styles.scheduleTitle}>Your Meal Schedule:</Text>
        <View style={styles.mealScheduleContainer}>
          {renderMealSlots()}
        </View>
        <View >

          {navigating ? (
            <ActivityIndicator size="large" color="#E94057" />
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={handleEditMealTimes}><LinearGradient
              colors={['#EC4899', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            ><Text style={styles.addButtonText}>Edit Meal Times</Text></LinearGradient></TouchableOpacity>
          )}

        </View>
      </View>

      {/* Welcome Header */}
      <LinearGradient
      colors={['#EC4899', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.greetingContainer}
    >
      <Text style={styles.greetingText}>
        Welcome to MedBuddy, {name || 'User'}! 😊
      </Text>
    </LinearGradient>

      {/* Image Uploader */}
      <View style={styles.uploaderBox}>
        <Text style={styles.uploaderTitle}>Upload Prescription Sticker:</Text>
        <ImageUploader
          userId={userId}
          onResult={(ocrResults) => {
            navigation.navigate('ManualEntry', {
              userId,
              ocrResults,
              refreshReminders: true
            });
          }}
        />
      </View>

      {/* Active Reminders Section */}
      <View style={styles.activeRemindersSection}>
        <Text style={styles.activeRemindersTitle}>Active Reminders</Text>


        {loadHistory ? (
          <ActivityIndicator size="small" color="#E94057" />
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('ReminderHistory', { userId })} style={styles.historyButton}><LinearGradient
          colors={['#EC4899', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
            <Text style={styles.historyButtonText}>See History</Text></LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={cancelAllReminders} style={styles.dustbinButton}>
          <Ionicons name="trash-bin" size={24} color="#E94057" />
        </TouchableOpacity>
        <View style={styles.remindersContainer}>
          {loading ? ( // Show loading indicator while fetching
            <ActivityIndicator size="large" color="#E94057" />
          ) : activeReminders.length > 0 ? (
            activeReminders.map((reminder) => (
              <View key={reminder.id} style={styles.remindersBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.medicineName}>{reminder.medicineName}</Text>
                    <Text style={styles.pillsText}>{reminder.pills} Pills</Text>
                  </View>

                  {/* Add Date/Time Section */}
                  <View style={styles.timeContainer}>
                    <Text style={styles.dateText}>
                      {dayjs(reminder.reminderDate).format('DD-MM-YYYY')}
                    </Text>
                    <Text style={styles.timeText}>
                      {reminder.reminderTime}
                    </Text>
                  </View>

                  {crossLoading ? (
                    <ActivityIndicator size="large" color="#E94057" />
                  ) : (
                    <TouchableOpacity onPress={() => cancelReminder(reminder.id)} style={styles.cancelButton}>
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.reminderText}>No active reminders.</Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ManualEntry', { userId })}
        >
          <LinearGradient
            colors={['#EC4899', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFF5F7', // Subtle pinkish background
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50', // Dark text color
    textAlign: 'center', // Center align text
  }, greetingContainer: {
    borderRadius: 10,
    marginVertical: 20,
    padding: 15,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 28, // Larger font size for emphasis
    fontWeight: 'bold',
    color: '#FFFFFF', // White text for contrast
    textAlign: 'center',
  },
  scheduleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
    padding: 15, // Add padding for better text positioning
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#E94057', // Pinkish accent color
  },
  mealSlot: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E94057', // Pinkish border color
    shadowColor: '#E94057', // Pinkish shadow color for glow effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mealText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50', // Dark text color
    textAlign: 'center',
  },mealTimeText: {
    color: '#F97316', // Different color for meal times
    fontWeight: 'bold',
  },
  uploaderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
    padding: 15, // Add padding for better text positioning
  },
  uploaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#E94057', // Pinkish accent color
  },
  activeRemindersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
    padding: 15, // Add padding for better text positioning
  },
  activeRemindersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#E94057', // Pinkish accent color
  },
  remindersBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9F0F2', // Light pink background
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10, // Add margin for spacing
  },
  reminderText: {
    fontSize: 16,
    color: '#2C3E50', // Dark text color
  },
  addButton: {
    borderRadius: 5,
    overflow: 'hidden', // Ensure gradient stays within bounds
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF', // White text for contrast
    textAlign: 'center',
    padding: 10, // Add padding for better button appearance
  },
  cancelButton: {
    backgroundColor: '#E94057', // Pinkish button color
    padding: 9,
    borderRadius: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50', // Dark text color
  },
  pillsText: {
    fontSize: 14,
    color: '#2C3E50', // Dark text color
  },
  dustbinButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  historyButton: {
    borderRadius: 5,
    overflow: 'hidden', // Ensure gradient stays within bounds
    marginTop: 10,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#FFFFFF', // White text for contrast
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10, // Add padding for better button appearance
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginRight: 15,
    minWidth: 100,
  },
  dateText: {
    fontSize: 14,
    color: '#7F8C8D', // Subdued text color
  },
  timeText: {
    fontSize: 16,
    color: '#E94057', // Pinkish accent color
  },
});

export default HomeScreen;