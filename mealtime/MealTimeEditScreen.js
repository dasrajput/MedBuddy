import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator,Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native';

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
      {/* Add logo and header */}
      <Image source={require('../screens/2.png')} style={styles.logo} />
      <Text style={styles.appName}>Edit Meal Times</Text>
  
      <View style={styles.formBox}>
        <Text style={styles.inputLabel}>Total Meals</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={totalMeals}
            style={styles.picker}
            dropdownIconColor="#E94057"
            onValueChange={(itemValue) => setTotalMeals(itemValue)}
          >
            <Picker.Item label="2 Meals" value={2} style={styles.pickerItem} />
            <Picker.Item label="3 Meals" value={3} style={styles.pickerItem} />
          </Picker>
        </View>
  
        {mealTimes.map((meal, index) => (
          <View key={index} style={styles.mealSlot}>
            <Text style={styles.mealLabel}>{meal.name} Meal</Text>
            <TextInput
              style={styles.timeInput}
              value={meal.time}
              placeholder="HH:MM AM/PM"
              placeholderTextColor="#A8A8A8"
              onChangeText={(newTime) => handleMealTimeChange(newTime, index)}
            />
          </View>
        ))}
      </View>
  
      {/* Update save button */}
      {navigating ? (
        <ActivityIndicator size="large" color="#E94057" />
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={['#EC4899', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );};

// Update the StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF5F7',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E94057',
    textAlign: 'center',
    marginBottom: 25,
  },
  formBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1.5,
    borderColor: '#E94057',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  pickerItem: {
    fontSize: 16,
    color: '#2C3E50',
  },
  mealSlot: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E94057',
    marginBottom: 5,
  },
  timeInput: {
    fontSize: 16,
    color: '#2C3E50',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 15,
  },
  gradientButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
export default MealTimeEditScreen;