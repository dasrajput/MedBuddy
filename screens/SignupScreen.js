import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { signUp } from '../services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';

// Add at the top with other imports
import { useNavigation } from '@react-navigation/native';

const SignupScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    const result = await signUp(email, password);
    if (result.success) {
      console.log('User signed up:', result.userCredential);
      
      // Show success alert
      Alert.alert(
        "Success",
        "Account created successfully🎨🔥! Please login with your credentials. 🚀",
        [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate to Login screen after user acknowledges
              navigation.navigate('Login');
            }
          }
        ]
      );
       // Clear the form fields
       setEmail('');
       setPassword('');
       setError('');
     } else {
       setError(result.message);
     }
   };

  return (
    <View style={styles.container}>
      <Image
        source={require('./2.png')} // Use the same logo
        style={styles.logo}
      />
      
      <Text style={styles.title}>MedBuddy</Text>
      <Text style={styles.subtitle}>Your Personal Health Assistant</Text>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#A8A8A8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#A8A8A8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handleSignup}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#EC4899', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

// Add to styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFF5F7', // Subtle pinkish background
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 0,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    color: '#7F8C8D',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#E94057', // Pinkish label color
  },
  input: {
    height: 55,
    borderColor: '#E94057', // Pinkish border color
    borderWidth: 1.5,
    marginBottom: 20,
    paddingLeft: 15,
    borderRadius: 8,
    backgroundColor: '#F9F0F2', // Pinkish background
    color: '#E94057', // Pinkish text color
    fontSize: 16,
  },
  error: {
    color: '#E74C3C',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  button: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  link: {
    marginTop: 20,
    color: '#7F8C8D',
    textAlign: 'center',
    fontSize: 16,
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#E94057', // Matching the pink accent from LoginScreen
  },
});

export default SignupScreen;
