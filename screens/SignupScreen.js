import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signUp } from '../services/firebaseService';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    const result = await signUp(email, password); // Call the updated signUp function
    if (result.success) {
      console.log('User signed up:', result.userCredential);
      // Navigate to HomeScreen or show success message
    } else {
      setError(result.message); // Set the error message returned from signUp
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MedBuddy Sign Up</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
    width: '100%',
    height: 50,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50', // Green border color
    borderRadius: 4,
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
});

export default SignupScreen;
