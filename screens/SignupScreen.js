import React, { useState } from 'react';
import { TextInput, Button, View, Text , StyleSheet } from 'react-native';
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
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});


export default SignupScreen;
