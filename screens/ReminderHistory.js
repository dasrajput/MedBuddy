import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { firestore } from '../firebaseConfig'; // Adjust the import based on your project structure
import { query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import dayjs from 'dayjs';

const ReminderHistory = ({ route }) => {
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

//   if (loading) {
//     return <ActivityIndicator size="large" color="#4CAF50" />;
//   }
  const deleteAllReminders = async () => {
    try {
      setDeleting(true);
      const remindersQuery = query(collection(firestore, 'reminders'), where('userId', '==', userId));
      const querySnapshot = await getDocs(remindersQuery);
      
      // Create an array of promises to delete each reminder
      const deletePromises = querySnapshot.docs.map(doc => {
        return deleteDoc(doc.ref); // Delete each document
      });
  
      await Promise.all(deletePromises); // Wait for all deletions to complete
      Alert.alert('Success', 'All reminders have been deleted.');
      setHistory([]); // Clear the history state
      setDeleting(false);
    } catch (error) {
      console.error('Error deleting reminders:', error);
      Alert.alert('Error', 'Failed to delete reminders.');
    }
  };

  return (
    <View style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
        <Text style={styles.title}>Reminder History</Text>
        {deleting ? (
            <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
            <TouchableOpacity onPress={deleteAllReminders} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete All</Text>
            </TouchableOpacity>
        )}
        </View>

      
        {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
        ) : history.length === 0 ? ( // Check if history is empty
        <Text style={styles.noRemindersText}>No Reminders</Text> // Display message if no reminders
        ) : (
            <View styles={{ width: '100%',height: '100%',marginBottom: '150'}}>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.reminderCard}>
                  <View style={styles.cardContent}>
                    {/* Left Section */}
                    <View style={styles.infoContainer}>
                      <Text style={styles.reminderText}>
                        {item.medicineName} - {item.pills} Pills
                      </Text>
                      <Text style={[
                        styles.reminderStatus,
                        item.status === 'cancelled' ? styles.cancelled : styles.completed
                      ]}>
                        {item.status}
                      </Text>
                    </View>

                    {/* Right Section */}
                    <View style={styles.timeContainer}>
                      <Text style={styles.historyDate}>
                        {dayjs(item.reminderDate).format('DD MMM YYYY')}
                      </Text>
                      <Text style={styles.historyTime}>
                        {item.reminderTime}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4CAF50',
  },
  noRemindersText: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center', // Center the text
    marginTop: 20, // Add some margin for spacing
  },
  reminderCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reminderStatus: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cancelled: {
    color: '#FF5252',
  },
  completed: {
    color: '#4CAF50',
  },
  timeContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  historyDate: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Roboto-Medium',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  deleteButton: {
    marginLeft: 'auto', // Align to the right
    padding: 10,
    backgroundColor: '#FF0000', // Red color for delete action
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF', // White text for contrast
    fontWeight: 'bold',
  },
});

export default ReminderHistory;