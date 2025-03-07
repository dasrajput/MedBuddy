import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signIn } from '../services/firebaseService';
import { useNavigation } from '@react-navigation/native'; // For navigation
import { CommonActions } from '@react-navigation/native';
import { saveUserData , getUserData } from '../services/firebaseService'; // Your Firebase function


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation(); // For navigating after login

  const handleLogin = async () => {
    // Validate input fields
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true); // Start loading
    try {
      // Attempt to log in the user
      const user = await signIn(email, password);

      if (user && user.uid) {
        // Clear any previous errors
        setError('');

        // Fetch user data from Firestore
        const userDoc = await getUserData(user.uid);

        if (!userDoc || !userDoc.name || !userDoc.age || !userDoc.gender) {
          // Navigate to Introduction screen with userId parameter
          navigation.reset({
            index: 0, // Prevent going back to login page
            routes: [
              {
                name: 'Introduction',
                params: { userId: user.uid, userDoc }, // Pass userId correctly
              },
            ],
          });
        } else {
          // Navigate to HomeScreen with userId parameter
          navigation.reset({
            index: 0, // Prevent going back to login page
            routes: [
              {
                name: 'Home',
                params: { userId: user.uid, userDoc }, // Pass userId correctly
              },
            ],
          });
        }
      } else {
        // Display error if login fails but no specific message is available
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Catch unexpected errors and display their messages
      console.error('Login error:', error);
  
      // Provide a user-friendly error message
      setError(
        error.message || 'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setLoading(false); // Stop loading
    }
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MedBuddy Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212', // Dark background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF', // White color for title
  },
  input: {
    height: 50,
    borderColor: '#4CAF50', // Green border color
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: '#1E1E1E', // Darker input background
    color: '#FFFFFF', // White text color
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default LoginScreen;
