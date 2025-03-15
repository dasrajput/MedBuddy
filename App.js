import React, { useState, useEffect } from "react";
import { View, Text, Button, Platform,Image } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import SignupScreen from "./screens/SignupScreen";
import IntroductionScreen from "./screens/IntroductionScreen";
import ManualEntry from "./screens/ManualEntry";
import Ionicons from "react-native-vector-icons/Ionicons";
import MealTimeEditScreen from "./mealtime/MealTimeEditScreen";
import Reminderhistory from "./screens/Reminderhistory";
// Add this import at the top
import { initializeNotifications, setupNotificationListeners } from './services/notificationService';
import Constants from 'expo-constants';

// Stack screen options with profile icon
const HomeScreenOptions = ({ navigation, route }) => ({
  title: "MedBuddy",
  headerStyle: {
    backgroundColor: "#FFF5F7", // Match the background color used in HomeScreen
    shadowColor: "transparent",
    elevation: 0,
    height: 80,
    paddingHorizontal: 20,
  },headerTitleStyle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E94057",
    left: 0, // Adjust this value to fine-tune title position
  },
 
  headerLeft: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
      <Ionicons
        name="person-circle"
        size={40}
        color="#E94057"
        onPress={() => navigation.navigate("Introduction", { userId: route.params.userId })}
      />
      <Image
        source={require('./screens/2.png')}
        style={{ width: 40, height: 40, marginLeft: 65 }}
      />
    </View>
  ),
  headerRight: () => (
    <View style={{ paddingRight: 15 }}>
      <Button
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }}
        title="Logout"
        color="#f00"
      />
    </View>
  ),
});

const Stack = createStackNavigator();

const App = () => {
  // Add state to track if notifications are initialized
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  useEffect(() => {
    // Safe initialization of notifications with error handling
    const initNotifs = async () => {
      try {
        console.log('[APP] Initializing notifications...');
        
        // Check if we're running in Expo Go
        const isExpoGo = Constants?.executionEnvironment === 'storeClient';
        
        if (isExpoGo) {
          console.log('[APP] Running in Expo Go - notifications may have limited functionality');
        }
        
        const success = await initializeNotifications();
        console.log('[APP] Notification initialization result:', success);
        
        if (success) {
          // Set up notification listeners only after successful initialization
          console.log('[APP] Setting up notification listeners...');
          const unsubscribe = setupNotificationListeners();
          setNotificationsInitialized(true);
          
          // Return cleanup function
          return () => {
            console.log('[APP] Cleaning up notification listeners...');
            if (unsubscribe) unsubscribe();
          };
        }
      } catch (error) {
        console.error('[APP] Error initializing notifications:', error);
        // Continue app execution even if notifications fail
        setNotificationsInitialized(false);
      }
    };
    
    initNotifs();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Introduction"
          component={IntroductionScreen} 
          initialParams={{ userId: null, userDoc: null }}
          options={{
            title: "Introduction",
            headerStyle: { backgroundColor: "#4CAF50" },
            headerTintColor: "#fff",
            headerShown: false
          }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ userId: null, name: null  }}
          options={HomeScreenOptions}
        />
        <Stack.Screen
          name="ManualEntry"
          component={ManualEntry}
          options={{
            title: "Add Medication",
            headerStyle: { backgroundColor: "#4CAF50" },
            headerTintColor: "#fff",
            headerShown: false
          }}
        />
        <Stack.Screen
          name="MealTimeEdit"
          component={MealTimeEditScreen}
          options={{
            title: "Edit Meal Times",
            headerStyle: { backgroundColor: "#4CAF50" },
            headerTintColor: "#fff",
            headerShown: false
          }}
        />
        <Stack.Screen
          name="ReminderHistory"
          component={Reminderhistory}
          options={{
            title: "Reminder History",
            headerStyle: { backgroundColor: "#4CAF50" },
            headerTintColor: "#fff",
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;