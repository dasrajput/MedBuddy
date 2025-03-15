import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { saveUserData, getUserData } from '../services/firebaseService'; // Your Firebase function
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

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

      navigation.navigate('Home', { userId, userName: name });
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo and App Name */}
      <Image source={require('./2.png')} style={styles.logo} />
      <Text style={styles.appName}>MedBuddy</Text>

      {/* Title */}
      <Text style={styles.title}>Let's Get to Know You! 🎉</Text>

      {/* Form Box */}
      <View style={styles.formBox}>
        {/* Name Input */}
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#A8A8A8"
          value={name}
          onChangeText={setName}
        />

        {/* Age Input */}
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 28"
          placeholderTextColor="#A8A8A8"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        {/* Gender Picker */}
        <Text style={styles.inputLabel}>Gender</Text>
        <Picker
          selectedValue={gender}
          style={styles.picker}
          dropdownIconColor="#E94057"
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" color="#A8A8A8" />
          <Picker.Item label="Male" value="Male" color="#2C3E50" />
          <Picker.Item label="Female" value="Female" color="#2C3E50" />
          <Picker.Item label="Other" value="Other" color="#2C3E50" />
        </Picker>

        {/* Meal Frequency Picker */}
        <Text style={styles.inputLabel}>Meal Frequency</Text>
        <Picker
          selectedValue={totalMeals}
          style={styles.picker}
          dropdownIconColor="#E94057"
          onValueChange={(itemValue) => setTotalMeals(itemValue)}
        >
          <Picker.Item label="2 Meals per Day" value="2" color="#2C3E50" />
          <Picker.Item label="3 Meals per Day" value="3" color="#2C3E50" />
        </Picker>
      </View>

      {/* Save Button */}
      <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
        <LinearGradient
          colors={['#EC4899', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#FFF5F7', // Match HomeScreen's background
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#E94057', // Pinkish accent to match headers
    marginBottom: 15,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 25,
    color: '#2C3E50', // Dark text like HomeScreen
    textAlign: 'center',
  },
  formBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
    fontSize: 16,
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
  },
  saveButton: {
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IntroductionScreen;