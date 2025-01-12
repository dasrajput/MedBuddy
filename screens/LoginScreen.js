import React, { useState } from 'react';
import { TextInput, Button, View, Text, StyleSheet } from 'react-native';
import { signIn } from '../services/firebaseService';
import { useNavigation } from '@react-navigation/native'; // For navigation
import { CommonActions } from '@react-navigation/native';
import { saveUserData , getUserData } from '../services/firebaseService'; // Your Firebase function


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigation = useNavigation(); // For navigating after login

  const handleLogin = async () => {
    // Validate input fields
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
  
    try {
      // Attempt to log in the user
      const user = await signIn(email, password);
  
      if (user && user.uid) {
        //console.log('User logged in:', user);
  
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
    }
  };
  
  

  return (
    <View style={styles.container}>
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
      <Button title="Login" onPress={handleLogin} />
      <Button 
        title="Don't have an account? Sign Up" 
        onPress={() => navigation.navigate('Signup')} // Navigate to SignupScreen
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LoginScreen;
