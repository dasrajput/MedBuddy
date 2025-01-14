import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMealData } from '../mealtime/MealTimeLogic'; // Use the custom hook for meal data management
import ImageUploader from '../components/ImageUploader'; // Import the ImageUploader component
import * as Clipboard from 'expo-clipboard';
import { query, collection, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ route }) => {
  const { userId, refreshReminders } = route.params || {};
  const navigation = useNavigation();
  const [uploadedImageData, setUploadedImageData] = useState(null);
  const [activeReminders, setActiveReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [crossLoading, setCrossLoading] = useState(false);
  const [loadHistory, setLoadHistory] = useState(false);

  // Ensure userId is available before proceeding
  if (!userId) {
    return <Text>User ID not found!</Text>;
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
        <Text style={styles.mealText}>{meal.name} Meal: {meal.time}</Text>
      </View>
    ));
  };

  const fetchReminders = async () => {
    setLoading(true); // Set loading to true
    try {
      const remindersQuery = query(collection(firestore, 'reminders'), where('userId', '==', userId), where('status', '==', 'active'));
      const querySnapshot = await getDocs(remindersQuery);
      const reminders = [];
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() });
      });
      setActiveReminders(reminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  const cancelReminder = async (reminderId) => {
    try {
      setCrossLoading(true);
      const reminderRef = doc(firestore, 'reminders', reminderId);
      await updateDoc(reminderRef, { status: 'cancelled' });
      Alert.alert('Reminder cancelled successfully.');
      fetchReminders(); // Refresh reminders after cancellation
      setCrossLoading(false);
    } catch (error) {
      console.error('Error cancelling reminder:', error);
    }
  };
  
  const cancelAllReminders = async () => {
    try {
      setCrossLoading(true);
      const remindersQuery = query(collection(firestore, 'reminders'), where('userId', '==', userId), where('status', '==', 'active'));
      const querySnapshot = await getDocs(remindersQuery);
      
      // Use map to create an array of promises for updating each reminder
      const promises = querySnapshot.docs.map(doc => {
        const reminderRef = doc.ref; // Get the reference directly from the document snapshot
        return updateDoc(reminderRef, { status: 'cancelled' }); // Update the status to 'cancelled'
      });
  
      await Promise.all(promises); // Wait for all updates to complete
      Alert.alert('All active reminders have been cancelled.');
      fetchReminders(); // Refresh reminders after cancellation
      setCrossLoading(false);
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  };

  useEffect(() => {
    fetchReminders(); // Fetch reminders when the component mounts
    if (refreshReminders) {
      fetchReminders(); // Fetch reminders again if coming from ManualEntry with refresh flag
    }
  }, [refreshReminders]);

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
  
  // In your render method
  

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(JSON.stringify(uploadedImageData, null, 2));
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Failed to copy to clipboard');
    }
  };

  // Callback function to handle OCR detection results
  const handleResult = (data) => {
    console.log('OCR Detections from server:', data);
    setUploadedImageData(data);
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
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={handleEditMealTimes}><Text style={styles.addButtonText}>Edit Meal Times</Text></TouchableOpacity>
          )}
        
        </View>
      </View>

      {/* Welcome Header */}
      <Text style={styles.headerText}>Welcome to Home Screen, User: {userId}</Text>

      {/* Image Uploader */}
      <View style={styles.uploaderBox}>
        <Text style={styles.uploaderTitle}>Upload Prescription Sticker:</Text>
        <ImageUploader onResult={handleResult} userId={userId} />
      </View>

      {/* Active Reminders Section */}
      <View style={styles.activeRemindersSection}>
        <Text style={styles.activeRemindersTitle}>Active Reminders</Text>

        
        {loadHistory ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('ReminderHistory', { userId })} style={styles.historyButton}>
            <Text style={styles.historyButtonText}>See History</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={cancelAllReminders} style={styles.dustbinButton}>
          <Ionicons name="trash-bin" size={24} color="red" />
        </TouchableOpacity>
        <View style={styles.remindersContainer}>
          {loading ? ( // Show loading indicator while fetching
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : activeReminders.length > 0 ? (
            activeReminders.map((reminder) => (
              <View key={reminder.id} style={styles.remindersBox}>  
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <View style={{flex: 1, marginLeft: 10}}>  
                    <Text style={styles.medicineName}>{reminder.medicineName}</Text>  
                    <Text style={styles.pillsText}>{reminder.numberOfPills} Pills</Text>  
                  </View>   
                   
                  {crossLoading ? (
                    <ActivityIndicator size="large" color="#4CAF50" />
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
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ManualEntry', { userId })}>
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212', // Dark background
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50', // Green color for header text
  },
  scheduleBox: {
    width: '100%',
    backgroundColor: '#1E1E1E', // Darker box background
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#4CAF50',
  },
  mealScheduleContainer: {
    marginBottom: 20,
  },
  mealSlot: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  mealText: {
    fontSize: 16,
    color: '#FFFFFF', // White color for meal text
  },
  buttonContainer: {
    marginTop: 10,
  },
  uploaderBox: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4CAF50',
  },
  activeRemindersSection: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
  },
  activeRemindersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4CAF50',
  },
  remindersContainer: {
    marginBottom: 20,
  },
  remindersBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 16,
    color: '#FFFFFF', // White color for reminder text
  },
  cancelText: {
    color: '#FF0000', // Red color for cancel text
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'red',
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
    color: '#FFFFFF',
  },
  pillsText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dustbinButton: {
    
    position: 'absolute',
    right: 10,
    top: 10,
  },
  historyButton: {
    width: 110,
    height: 40,
    margin: 10,
    padding: 10,
    backgroundColor: '#4CAF50', // Match the theme color
    borderRadius: 5,
  },
  
  historyButtonText: {
    fontSize: 16,
    color: '#FFFFFF', // White text for contrast
    fontWeight: 'bold',
  }
});

export default HomeScreen;