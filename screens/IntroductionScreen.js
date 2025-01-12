import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { saveUserData, getUserData } from '../services/firebaseService'; // Your Firebase function
import { Picker } from '@react-native-picker/picker';

const IntroductionScreen = ({ route, navigation }) => {
  const { userId, userDoc } = route.params;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [totalMeals, setTotalMeals] = useState('2');
  const [isSaving, setIsSaving] = useState(false);

  // Load user data if `userDoc` is not provided
  useEffect(() => {
    if (!userDoc) {
      const fetchUserData = async () => {
        try {
          const fetchedUserDoc = await getUserData(userId);
          if (fetchedUserDoc) {
            setName(fetchedUserDoc.name || '');
            setAge(fetchedUserDoc.age || '');
            setGender(fetchedUserDoc.gender || '');
            setTotalMeals(fetchedUserDoc.totalMeals || '2');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUserData();
    } else {
      // Populate state with provided `userDoc` data
      setName(userDoc.name || '');
      setAge(userDoc.age || '');
      setGender(userDoc.gender || '');
      setTotalMeals(userDoc.totalMeals || '2');
    }
  }, [userId, userDoc]);

  const handleSave = async () => {
    if (!name.trim() || !age.trim() || !gender || !totalMeals) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (isNaN(age) || age <= 0 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // // Define default meal times based on totalMeals
    // let mealTimes = [];
    // if (totalMeals === '2') {
    //   mealTimes = [
    //     { name: 'Morning', time: '09:00 AM' },
    //     { name: 'Evening', time: '08:00 PM' },
    //   ];
    // } else if (totalMeals === '3') {
    //   mealTimes = [
    //     { name: 'Morning', time: '08:30 AM' },
    //     { name: 'Afternoon', time: '12:30 PM' },
    //     { name: 'Evening', time: '08:00 PM' },
    //   ];
    // }

    try {
      setIsSaving(true);

      // Fetch existing user data to avoid unnecessary updates
      const existingUserData = userDoc || (await getUserData(userId));

      const updatedData = {
        name,
        age,
        gender,
        timezone: existingUserData?.timezone !== timezone ? timezone : existingUserData.timezone,
        totalMeals,
        // mealTimes,
      };

      // Save data only if it has changed
      const isDataChanged = JSON.stringify(existingUserData) !== JSON.stringify(updatedData);
      if (isDataChanged) {
        await saveUserData(userId, updatedData);
        Alert.alert('Success', 'Data saved successfully');
      } else {
        Alert.alert('Info', 'No changes detected');
      }

      navigation.navigate('Home', { userId });
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Tell us about yourself</Text>

      {/* Form Box */}
      <View style={styles.formBox}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <Picker
          selectedValue={gender}
          style={styles.input}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
        <Picker
          selectedValue={totalMeals}
          style={styles.input}
          onValueChange={(itemValue) => setTotalMeals(itemValue)}
        >
          <Picker.Item label="2 Meals per Day" value="2" />
          <Picker.Item label="3 Meals per Day" value="3" />
        </Picker>
      </View>

      {/* Save Button */}
      <Button title={isSaving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={isSaving} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#121212', // Dark background
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF', // White color for title
  },
  formBox: {
    width: '100%',
    backgroundColor: '#1E1E1E', // Darker background for form
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
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

export default IntroductionScreen;