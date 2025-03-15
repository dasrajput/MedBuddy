import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { firestore } from '../firebaseConfig'; // Adjust the import based on your project structure
import { query, collection, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';
import { cancelNotification } from '../services/notificationService';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';


const Reminderhistory = ({ route }) => {
  const { userId } = route.params; // Get userId from route params
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyQuery = query(
          collection(firestore, 'reminders'),
          where('userId', '==', userId),
          where('status', 'in', ['completed', 'cancelled'])
        );
        const querySnapshot = await getDocs(historyQuery);
        const reminders = [];
        querySnapshot.forEach((doc) => {
          reminders.push({ id: doc.id, ...doc.data() });
        });
        setHistory(reminders);
      } catch (error) {
        console.error('Error fetching reminder history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const deleteAllReminders = async () => {
    try {
      setDeleting(true);
      const remindersQuery = query(collection(firestore, 'reminders'), where('userId', '==', userId));
      const querySnapshot = await getDocs(remindersQuery);
      
      // Create an array of promises to delete each reminder and cancel notifications
      const deletePromises = querySnapshot.docs.map(async doc => {
        const reminderData = doc.data();
        
        // Cancel the notification if it exists
        if (reminderData.notificationId) {
          await cancelNotification(reminderData.notificationId);
        }
        
        return deleteDoc(doc.ref); // Delete the document
      });
  
      await Promise.all(deletePromises); // Wait for all deletions to complete
      Alert.alert('Success', 'All reminders have been deleted.');
      setHistory([]); // Clear the history state
      setDeleting(false);
    } catch (error) {
      console.error('Error deleting reminders:', error);
      Alert.alert('Error', 'Failed to delete reminders.');
      setDeleting(false);
    }
  };
  // Add function to delete a single reminder
  const deleteReminder = async (reminderId) => {
    try {
      setDeleting(true);
      
      // Get the reminder document to access the notification ID
      const reminderDoc = await getDoc(doc(firestore, 'reminders', reminderId));
      const reminderData = reminderDoc.data();
      
      // Cancel the notification if it exists
      if (reminderData && reminderData.notificationId) {
        await cancelNotification(reminderData.notificationId);
      }
      
      // Delete the reminder document
      await deleteDoc(doc(firestore, 'reminders', reminderId));
      
      // Update the history state
      setHistory(history.filter(item => item.id !== reminderId));
      
      Alert.alert('Success', 'Reminder deleted successfully.');
      setDeleting(false);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder.');
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Reminder History</Text>
        {deleting ? (
          <ActivityIndicator size="large" color="#E94057" />
        ) : (
          <TouchableOpacity onPress={deleteAllReminders} style={styles.deleteButton}>
            <LinearGradient
              colors={['#EC4899', '#F97316']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.deleteButtonText}>Delete All</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : history.length === 0 ? (
        <Text style={styles.noRemindersText}>No Reminders Found</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.reminderCard}>
              <View style={styles.cardLeft}>
                <Text style={styles.medicineName}>{item.medicineName}</Text>
                <Text style={styles.pillCount}>{item.pills} Pills</Text>
                <Text style={[
                  styles.statusText,
                  item.status === 'cancelled' ? styles.cancelled : styles.completed
                ]}>
                  {item.status}
                </Text>
              </View>
              
              <View style={styles.cardRight}>
                <Text style={styles.timeText}>{item.reminderTime}</Text>
                <Text style={styles.dateText}>
                  {dayjs(item.reminderDate).format('MMM D, YYYY')}
                </Text>
                <TouchableOpacity 
                  style={styles.deleteIcon} 
                  onPress={() => deleteReminder(item.id)}
                >
                  <Text style={styles.deleteIconText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30, // Added top padding
    backgroundColor: '#FFF5F7',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E94057',
    marginLeft: 8, // Balanced spacing
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Increased border radius
    padding: 18, // Increased padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6, // Softer shadow
    elevation: 3,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6, // Increased spacing
  },
  pillCount: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 6, // Consistent spacing
  },
  dateText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 6,
  },
  deleteIcon: {
    backgroundColor: '#E94057',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 20,
  },
  deleteButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  itemDeleteButton: {
    backgroundColor: '#E94057',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRemindersText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 40,
  },
  // Keep other existing styles but update colors to match theme
  cancelled: {
    color: '#FF5252',
  },
  completed: {
    color: '#4CAF50',
  },
});

export default Reminderhistory;