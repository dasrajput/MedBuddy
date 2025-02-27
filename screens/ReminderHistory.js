import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { firestore } from '../firebaseConfig'; // Adjust the import based on your project structure
import { query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';

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
                  <Text style={styles.reminderText}>{item.medicineName} - {item.pills} Pills</Text>
                  <Text style={styles.reminderStatus}>{item.status}</Text>
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
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
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
    width: '100%',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reminderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reminderStatus: {
    fontSize: 14,
    color: '#888888',
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