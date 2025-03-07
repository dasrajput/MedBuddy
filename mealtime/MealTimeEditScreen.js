import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

const MealTimeEditScreen = () => {
  const { userId, updateMealData, initialMealTimes, initialTotalMeals } = useRoute().params;
  const navigation = useNavigation();
  const [navigating, setNavigating] = useState(false);

  // Initialize state with passed data from the route params
  const [totalMeals, setTotalMeals] = useState(initialTotalMeals || 3); // Default 3 meals
  const [mealTimes, setMealTimes] = useState(initialMealTimes || []);

  // Adjust the meal slots when totalMeals changes
  useEffect(() => {
    if (totalMeals === 2) { // Ensure it's treated as a number
      setMealTimes([
        { name: 'Morning', time: '09:00 AM' },
        { name: 'Evening', time: '08:00 PM' },
      ]);
    } else if (totalMeals === 3) { // Ensure it's treated as a number
      setMealTimes([
        { name: 'Morning', time: '08:30 AM' },
        { name: 'Afternoon', time: '12:30 PM' },
        { name: 'Evening', time: '08:00 PM' },
      ]);
    }
  }, [totalMeals]);

  // Validate meal times against logical ranges
  const validateMealTimes = () => {
    for (let meal of mealTimes) {
      const [hour, minute] = meal.time.split(':')[0].split(':').map(Number); // Extract hour and minute
      const period = meal.time.split(' ')[1]; // Extract AM/PM
  
      if (meal.name === 'Morning' && (period !== 'AM' || hour < 5 || hour >= 12)) {
        Alert.alert('Invalid Time', 'Morning meals must be between 5:00 AM and 11:59 AM.');
        return false;
      }
      if (meal.name === 'Afternoon' && (period === 'AM' || (period === 'PM' && hour >= 5 && hour !== 12))) {
        Alert.alert('Invalid Time', 'Afternoon meals must be between 12:00 PM and 4:59 PM.');
        return false;
      }
      if (meal.name === 'Evening' && ((period === 'PM' && hour < 5) || period === 'AM')) {
        Alert.alert('Invalid Time', 'Evening meals must be between 5:00 PM and 11:59 PM.');
        return false;
      }
    }
    return true;
  };

  // Handle saving changes to the database
  const handleSave = async () => {
    if (!validateMealTimes()) return;

    try {
      setNavigating(true);
      const updatedMealTimes = mealTimes.slice(0, totalMeals); // Ensure mealTimes is sliced according to totalMeals
      await updateMealData(totalMeals, updatedMealTimes);
      Alert.alert('Success', 'Meal times updated successfully!');
      navigation.navigate('Home', { userId });
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal data. Please try again.');
    }
  };

  // Handle meal slot input change
  const handleMealTimeChange = (newTime, index) => {
    const updatedMeals = [...mealTimes];
    updatedMeals[index].time = newTime;
    setMealTimes(updatedMeals);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Meal Times</Text>

      <View style={styles.pickerContainer}>
        <Text style={{ color: '#FFFFFF' }}>Total Meals:</Text>
        <Picker
          selectedValue={totalMeals}
          style={styles.picker}
          onValueChange={(itemValue) => setTotalMeals(itemValue)}
        >
          <Picker.Item label="2 Meals" value={2} />
          <Picker.Item label="3 Meals" value={3} />
        </Picker>
      </View>

      {mealTimes.map((meal, index) => (
        <View key={index} style={styles.mealContainer}>
          <Text style={{ color: '#FFFFFF' }}>{meal.name} Meal Time:</Text>
          <TextInput
            style={styles.input}
            value={meal.time}
            onChangeText={(newTime) => handleMealTimeChange(newTime, index)}
          />
        </View>
      ))}

      
      {navigating ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <Button title="Save Changes" onPress={handleSave} color="#4CAF50" />
          )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212', // Dark background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF', // White color for title
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#4CAF50', // Green border color
    borderRadius: 5,
    color: '#FFFFFF', // White text color
  },
  mealContainer: {
    marginBottom: 10,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#4CAF50', // Green border color
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#1E1E1E', // Darker input background
    color: '#FFFFFF', // White text color
  },
});

export default MealTimeEditScreen;
