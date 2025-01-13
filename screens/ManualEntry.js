import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useMealData } from '../mealtime/MealTimeLogic'; // Import the useMealData hook
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker for custom time selection
import { saveReminder } from '../services/firebaseService';
import { useNavigation } from '@react-navigation/native';

const ManualEntry = ({ route }) => {
  const { userId } = route.params;
  const [medicineName, setMedicineName] = useState('');
  const [numberOfPills, setNumberOfPills] = useState('1'); // Default to 1 pill
  const [timingType, setTimingType] = useState('custom'); // 'custom' or 'meal'
  const [mealTiming, setMealTiming] = useState('before'); // 'before' or 'after'
  const [mealType, setMealType] = useState(''); // Morning, Afternoon, Evening
  const [reminderTime, setReminderTime] = useState(new Date()); // Initialize with current date and time
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { mealTimes } = useMealData(userId); // Fetch meal times from Firestore
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default medicine name based on existing reminders logic
    const existingReminders = []; // Replace with actual logic to fetch reminders
    if (existingReminders.length === 0) {
      setMedicineName('Medicine A');
    } else {
      const lastMedicine = existingReminders[existingReminders.length - 1].name;
      setMedicineName(lastMedicine === 'Medicine A' ? 'Medicine B' : 'Medicine A');
    }
  }, []);

  const handleAddReminder = async () => {
    console.log("Add Reminder button clicked"); // Debug statement to confirm button click
    setLoading(true);

    let calculatedReminderTime;
  
    if (timingType === 'custom') {
      // Use the selected reminder time
      calculatedReminderTime = reminderTime.toISOString(); // Store as ISO string
      console.log("Custom timing selected, reminder time:", calculatedReminderTime); // Debug statement
    } else if (timingType === 'meal') {
      // Calculate reminder time based on meal type
      const mealTime = mealTiming === 'before' ? '00:00:00' : '01:00:00'; // Example: 1 hour after meal
      const mealDate = new Date(reminderTime); // Use the date from reminderTime
      const [hours, minutes] = mealTime.split(':').map(Number);
      mealDate.setHours(hours);
      mealDate.setMinutes(minutes);
      calculatedReminderTime = mealDate.toISOString();
      console.log("Meal timing selected, calculated reminder time:", calculatedReminderTime); // Debug statement
    }
  
    const reminderData = {
      medicineName,
      numberOfPills,
      reminderTime: calculatedReminderTime, // Use calculated reminder time
      status: 'active' // Initial status
    };
  
    console.log("Reminder data to be saved:", reminderData); // Debug statement
  
    const result = await saveReminder(userId, reminderData); // Save reminder to Firebase
    console.log("Result from saveReminder:", result); // Debug statement
    setLoading(false);
  
    if (result.success) {
      Alert.alert('Reminder Set Successfully', '', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home', { userId,refreshReminders: true }), // Redirect to Home screen
        },
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleTimePickerChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderTime;
    setShowTimePicker(false);
    setReminderTime(currentDate); // Ensure this is a Date object
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Reminder</Text>
      <TextInput
        style={styles.input}
        placeholder="Medicine Name"
        value={medicineName}
        onChangeText={setMedicineName}
        placeholderTextColor="#FFFFFF"
      />
      <Text style={styles.label}>Number of Pills:</Text>
      <View style={styles.numberPickerContainer}>
        <TouchableOpacity onPress={() => setNumberOfPills((prev) => (parseInt(prev) > 1 ? (parseInt(prev) - 1).toString() : '1'))}>
          <Text style={styles.numberPickerButton}>-</Text>
        </TouchableOpacity>
        <Text style={styles.numberPickerText}>{numberOfPills}</Text>
        <TouchableOpacity onPress={() => setNumberOfPills((prev) => (parseInt(prev) < 5 ? (parseInt(prev) + 1).toString() : '5'))}>
          <Text style={styles.numberPickerButton}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Timing Type:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleButton, timingType === 'custom' && styles.activeToggle]} onPress={() => setTimingType('custom')}>
          <Text style={styles.toggleText}>Custom Timing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, timingType === 'meal' && styles.activeToggle]} onPress={() => setTimingType('meal')}>
          <Text style={styles.toggleText}>Meal Based</Text>
        </TouchableOpacity>
      </View>
      {timingType === 'meal' && (
        <View>
          <Text style={styles.label}>Meal Timing:</Text>
          <Picker
            selectedValue={mealTiming}
            onValueChange={(itemValue) => setMealTiming(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Before Meal" value="before" />
            <Picker.Item label="After Meal" value="after" />
          </Picker>
          <Text style={styles.label}>Select Meal Type:</Text>
          <Picker
            selectedValue={mealType}
            onValueChange={(itemValue) => setMealType(itemValue)}
            style={styles.picker}
          >
            {mealTimes.map((meal, index) => (
              <Picker.Item key={index} label={`${meal.name} at ${meal.time}`} value={meal.name} />
            ))}
          </Picker>
        </View>
      )}
      {timingType === 'custom' && (
        <View>
          <Text style={styles.label}>Select Reminder Time:</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timePickerText}>{reminderTime ? reminderTime.toLocaleTimeString() : 'Select Time'}</Text>
          </TouchableOpacity>
          {showTimePicker && <DateTimePicker value={reminderTime} mode="time" is24Hour={true} display="default" onChange={handleTimePickerChange} />}
        </View>
      )}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <Button title="Add Reminder" onPress={handleAddReminder} color="#4CAF50" />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  input: {
    height: 50,
    borderColor: '#4CAF50',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#FFFFFF',
  },
  timingContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 5,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#4CAF50',
  },
  toggleText: {
    color: '#FFFFFF',
  },
  numberPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  numberPickerButton: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  numberPickerText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  timePickerText: {
    color: '#FFFFFF',
    fontSize: 18,
    padding: 10,
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#1E1E1E',
    textAlign: 'center',
  },
});

export default ManualEntry;