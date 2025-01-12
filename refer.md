# MedBuddy Application Reference

## Overview
MedBuddy is a mobile application designed to help users manage their meal schedules and medication reminders efficiently. It provides features for meal time tracking, medication reminders, and profile management, all integrated with Firebase for real-time data storage.

## Key Features
1. **User Profile Management**: Users can input their personal details (name, age, gender, timezone) in the Introduction Screen.
2. **Meal Time Management**: Users can set the number of meals per day (2 or 3) and customize meal times.
3. **Medication Reminder System**: Users can manually enter pill details and receive notifications.

## Codebase Structure
- **app.js**: Main entry point for the application, setting up navigation and screen components.
- **screens/**: Contains all screen components, including Login, Signup, Home, and Introduction screens.
- **mealtime/**: Contains logic and components related to meal time management.
- **components/**: Contains reusable UI components like ImageUploader.
- **firebaseConfig.js**: Initializes Firebase services for the MedBuddy application.
- **firebaseService.js**: Contains functions for interacting with Firestore and Firebase Authentication.

## UI Theme
- **Color Palette**: Black and green theme with white text for improved readability.
- **Button Styles**: Consistent button styles across the application with a modern look.

## Important Components
- **LoginScreen**: Handles user authentication and input validation.
- **SignupScreen**: Allows new users to create an account.
- **HomeScreen**: Displays user's meal schedule and allows image uploads.
- **MealTimeEditScreen**: Enables users to edit their meal times.
- **ImageUploader**: Component for uploading images, integrated with OCR functionality.

## Firebase Configuration

### firebaseConfig.js
- **Purpose**: Initializes Firebase services for the MedBuddy application.
- **Key Exports**:
  - `auth`: Firebase authentication instance.
  - `firestore`: Firestore database instance.

### Configuration Details
- **apiKey**: Unique key for Firebase project.
- **authDomain**: Domain for Firebase authentication.
- **projectId**: Identifier for the Firebase project.
- **storageBucket**: Storage bucket for file uploads.
- **messagingSenderId**: Identifier for messaging.
- **appId**: Unique identifier for the app.
- **measurementId**: Optional measurement ID for analytics.

## Firebase Service Functions

### firebaseService.js
- **Purpose**: Contains functions for interacting with Firestore and Firebase Authentication.

### Key Functions
1. **saveUserData**: Saves user data to Firestore.
   - Validates user ID and data format.
   - Merges data to avoid overwriting existing user information.

2. **getUserData**: Retrieves user data from Firestore.
   - Validates user ID and ensures the user is authenticated.

3. **signUp**: Handles user registration.
   - Creates a new user with email and password.
   - Saves user data to Firestore upon successful signup.

4. **signIn**: Authenticates users.
   - Returns user object upon successful login.
   - Handles specific error codes for better user feedback.

## Notes
- The application uses React Navigation for screen transitions and state management.
- Firebase is used for user data storage and retrieval.

## Future Enhancements
1. **OCR Integration**: Add scanning functionality to automate medication entry.
2. **Improved Notifications**: Use push notifications for reminders.
3. **Analytics Dashboard**: Provide insights into users' meal and medication habits.

---

This document serves as a quick reference for understanding the MedBuddy application's structure and functionality.

## HomeScreen.js

### Imports
- **React**: Library for building user interfaces.
- **useState**: Hook for managing state in functional components.
- **View, Text, StyleSheet, Button, ScrollView, Alert, TouchableOpacity**: React Native components for building the UI.
- **useNavigation**: Hook from React Navigation for navigating between screens.
- **useMealData**: Custom hook for managing meal data.
- **ImageUploader**: Component for uploading images.
- **Clipboard**: Expo module for clipboard functionality.

### Functional Components
- **HomeScreen**: Main component for displaying the user's meal schedule and image uploader.

### State Variables
- `userId`: Retrieved from route parameters.
- `uploadedImageData`: Stores data from uploaded images.

### Functions
1. **renderMealSlots**: Renders meal slots based on the user's meal schedule.
   - Uses `totalMeals` to determine how many meal slots to display.
   - Maps over `mealTimes` to create individual meal slot views.

2. **handleCopy**: Copies uploaded image data to the clipboard.
   - Uses `Clipboard.setStringAsync` to copy data.
   - Alerts the user if the copy operation fails.

3. **handleResult**: Callback function for handling OCR results from the image uploader.
   - Logs OCR detections and updates `uploadedImageData` state.

### Rendered UI
- **Meal Schedule Box**: Displays the user's meal schedule with meal slots.
- **Edit Button**: Navigates to the Meal Time Edit screen.
- **Image Uploader**: Allows users to upload prescription stickers.

---

## LoginScreen.js

### Imports
- **React**: Library for building user interfaces.
- **useState**: Hook for managing state in functional components.
- **TextInput, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator**: React Native components for building the UI.
- **signIn**: Function for authenticating users.
- **useNavigation**: Hook from React Navigation for navigating between screens.

### Functional Components
- **LoginScreen**: Main component for user login.

### State Variables
- `email`: Stores the user's email input.
- `password`: Stores the user's password input.
- `error`: Stores error messages.
- `loading`: Indicates whether the login process is ongoing.

### Functions
1. **handleLogin**: Validates input fields and attempts to log in the user.
   - Sets loading state while processing.
   - Navigates to the Home or Introduction screen based on the user's data.

### Rendered UI
- **Title**: Displays the login title.
- **Text Inputs**: For email and password input.
- **Loading Indicator**: Displays while logging in.
- **Login Button**: Triggers the login process.
- **Sign Up Link**: Navigates to the Signup screen.

---

## SignupScreen.js

### Imports
- **React**: Library for building user interfaces.
- **useState**: Hook for managing state in functional components.
- **TextInput, View, Text, StyleSheet, TouchableOpacity**: React Native components for building the UI.
- **signUp**: Function for creating new user accounts.

### Functional Components
- **SignupScreen**: Main component for user registration.

### State Variables
- `email`: Stores the user's email input.
- `password`: Stores the user's password input.
- `error`: Stores error messages.

### Functions
1. **handleSignup**: Calls the signUp function to create a new user account.
   - Displays success or error messages based on the outcome.

### Rendered UI
- **Title**: Displays the signup title.
- **Text Inputs**: For email and password input.
- **Sign Up Button**: Triggers the signup process.

---

## IntroductionScreen.js

### Imports
- **React**: Library for building user interfaces.
- **useEffect, useState**: Hooks for managing state and lifecycle methods.
- **View, Text, TextInput, Button, StyleSheet, Alert**: React Native components for building the UI.
- **saveUserData, getUserData**: Functions for interacting with Firebase.
- **Picker**: For selecting options from a dropdown.

### Functional Components
- **IntroductionScreen**: Main component for onboarding users.

### State Variables
- `name`: Stores the user's name input.
- `age`: Stores the user's age input.
- `gender`: Stores the user's selected gender.
- `totalMeals`: Stores the number of meals per day.
- `isSaving`: Indicates whether the save operation is ongoing.

### Functions
1. **handleSave**: Validates input fields and saves user data to Firebase.
   - Checks for empty fields and valid age.
   - Alerts the user on success or failure.

### Rendered UI
- **Title**: Displays the onboarding title.
- **Form Box**: Contains inputs for name, age, gender, and total meals.
- **Save Button**: Triggers the save operation.

---

## MealTimeEditScreen.js

### Imports
- **React**: Library for building user interfaces.
- **useState, useEffect**: Hooks for managing state and lifecycle methods.
- **View, Text, TextInput, Button, StyleSheet, Alert**: React Native components for building the UI.
- **Picker**: For selecting options from a dropdown.
- **useNavigation, useRoute**: Hooks from React Navigation for routing.

### Functional Components
- **MealTimeEditScreen**: Main component for editing meal times.

### State Variables
- `totalMeals`: Stores the number of meals per day.
- `mealTimes`: Stores the meal time data.

### Functions
1. **validateMealTimes**: Checks if meal times are within valid ranges.
2. **handleSave**: Validates meal times and saves changes to Firebase.
3. **handleMealTimeChange**: Updates meal time based on user input.

### Rendered UI
- **Title**: Displays the title for editing meal times.
- **Picker**: For selecting the total number of meals.
- **Text Inputs**: For entering meal times.
- **Save Button**: Triggers the save operation.
