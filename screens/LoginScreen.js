import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { signIn } from '../services/firebaseService';
import { useNavigation } from '@react-navigation/native'; // For navigation
import { CommonActions } from '@react-navigation/native';
import { saveUserData, getUserData } from '../services/firebaseService'; // Your Firebase function
import { LinearGradient } from 'expo-linear-gradient';


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
                params: { userId: user.uid, name: userDoc.name }, // Pass userId correctly
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
      <Image
        source={require('./2.png')} // Corrected path
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

        {loading ? (
          <ActivityIndicator size="large" color="#E94057" />
        ) : (
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#EC4899', '#F97316']} // Pink to Orange gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFF5F7',
  },
  logo: {
    width: 200, // Adjust width as needed
    height: 200, // Adjust height as needed
    alignSelf: 'center',
    marginBottom: 0, // Space between logo and title
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
    color: '#34495E',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#E94057', // Pinkish label color
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
    backgroundColor: '#E94057',
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
    // Adding highlight effect
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
    color: '#4A90E2',
  },
});

export default LoginScreen;
