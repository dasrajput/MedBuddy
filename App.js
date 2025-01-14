import React from "react";

import { View, Text, Button } from "react-native";

import { NavigationContainer, useNavigation } from "@react-navigation/native";

import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./screens/LoginScreen";

import HomeScreen from "./screens/HomeScreen";

import SignupScreen from "./screens/SignupScreen";

import IntroductionScreen from "./screens/IntroductionScreen";
import ManualEntry from "./screens/ManualEntry";

import Ionicons from "react-native-vector-icons/Ionicons";

import MealTimeEditScreen from "./mealtime/MealTimeEditScreen"; // Import the MealTimeEditScreen
import ReminderHistory from "./screens/ReminderHistory";

// Stack screen options with profile icon

const HomeScreenOptions = ({ navigation, route }) => ({
  title: "MedBuddy",
  headerStyle: {
    backgroundColor: "#000", // Updated to black
    shadowColor: "transparent", // Remove shadow on iOS
    elevation: 0, // Remove shadow on Android
    height: 80, // Adjust header height
    paddingHorizontal: 20, // Provide padding to the sides
  },

  headerTitleStyle: {
    fontSize: 24, // Increase font size for the title
    fontWeight: "bold", // Make the title bold
    color: "#4CAF50", // Updated to green
    alignSelf: "center", // Center the title horizontally
    paddingLeft: 90,
  },

  headerLeft: () => (
    <Ionicons
      name="person-circle"
      size={40}
      color="#4CAF50" // Updated to green
      style={{ paddingLeft: 20 }} // Add padding to left icon
      onPress={() =>
        navigation.navigate("Introduction", { userId: route.params.userId })
      }
    />
  ),

  headerRight: () => (
    <View style={{ paddingRight: 15 }}>
      {" "}
      {/* Wrap the Button in a View to add padding */}
      <Button
        onPress={() => {
          // Reset the navigation stack and navigate back to Login screen
          navigation.reset({
            index: 0, // Reset stack to prevent going back to Home
            routes: [{ name: "Login" }], // Navigate to Login screen
          });
        }}
        title="Logout"
        color="#f00" // Customize the button color
      />
    </View>
  ),
});

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen
          name="Introduction"
          component={IntroductionScreen}
          initialParams={{ userId: null, userDoc: null }}
          options={{
            title: "Introduction", // Custom title for the Introduction screen

            headerStyle: { backgroundColor: "#4CAF50" }, // Example of a custom header style

            headerTintColor: "#fff", // Custom header text color
          }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ userId: null }}
          options={HomeScreenOptions} // Apply profile icon to the header
        />
        <Stack.Screen
          name="ManualEntry"
          options={{
            title: "Manual Reminder", // Custom title for the Introduction screen

            headerStyle: { backgroundColor: "#4CAF50" }, // Example of a custom header style

            headerTintColor: "#fff", // Custom header text color
          }}
          component={ManualEntry}
          initialParams={{ userId: null, refreshReminders: false }} // Pass userId to ManualEntry
        />
        <Stack.Screen
          name="ReminderHistory"
          component={ReminderHistory}
          initialParams={{ userId: null }}
          options={{
            title: "Reminder History", // Custom title for the Introduction screen

            headerStyle: { backgroundColor: "#4CAF50" }, // Example of a custom header style

            headerTintColor: "#fff", // Custom header text color
          }}
        />
        <Stack.Screen
          name="MealTimeEdit"
          component={MealTimeEditScreen}
          options={{
            title: "Edit Meal Time", // Custom title for the Introduction screen

            headerStyle: { backgroundColor: "#4CAF50" }, // Example of a custom header style

            headerTintColor: "#fff", // Custom header text color
          }}
        />
        
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
