# MedBuddy App

MedBuddy is a mobile application designed to help users manage their meal schedules and medication reminders efficiently. This app provides features for meal time tracking, medication reminders (via manual entry and OCR scanning), and profile management, all integrated with Firebase for real-time data storage.

---

## Features

### 1. **User Profile Management**
- Users can input their personal details (name, age, gender, timezone) in the Introduction Screen.
- Data is stored in Firebase for personalized experiences.

### 2. **Meal Time Management**
- Users can:
  - Set the number of meals per day (2 or 3).
  - Customize meal times for Morning, Afternoon, and Evening.
  - Edit meal schedules directly from the app.
- Data is saved and retrieved from Firebase.

### 3. **Medication Reminder System**
- Manual entry feature to input pill details such as:
  - Name
  - Dosage
  - Frequency
  - Reminder time
- OCR functionality (planned) to scan medication labels for easier input.
- Notifications to remind users to take their medications on time.

---

## Installation Guide

### Prerequisites
1. **Node.js**: Ensure you have the latest LTS version of Node.js installed.
2. **Expo CLI**: Install Expo CLI globally using:
   ```bash
   npm install -g expo-cli
   ```
3. **Firebase Configuration**:
   - Create a Firebase project and enable authentication and Firestore.
   - Download the `google-services.json` file for Android or `GoogleService-Info.plist` for iOS.

### Steps to Run the App
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/medbuddy.git
   cd medbuddy
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add Firebase configuration files:
   - Place `google-services.json` in the `android/app` directory for Android.
   - Place `GoogleService-Info.plist` in the `ios` directory for iOS.
4. Start the Expo server:
   ```bash
   npm start
   ```
5. Use the Expo Go app to scan the QR code and run the app on your device.

6. Please refer to backend folder and read its readme.

---

## Codebase Overview

### Directory Structure
```
/
├── components/          # Reusable UI components
├── mealtime/            # Meal time management logic and screens
├── screens/             # App screens (Introduction, Home, etc.)
├── services/            # Firebase service functions
├── navigation/          # Navigation configuration
├── utils/               # Utility functions
└── backend/             # Backend server for OCR and image processing
    ├── api_server.py    # Flask API server
    ├── server.py        # Image processing logic
    ├── uploads/         # Temporary storage for uploaded images
    └── models/          # ML models for image detection
```

### Key Files
1. **HomeScreen.js**:
   - Displays meal schedule and provides navigation options.
   - Fetches meal data from Firebase.

2. **MealTimeEditScreen.js**:
   - Allows users to edit meal times and the number of meals.
   - Updates data in Firebase.

3. **MealTimeLogic.js**:
   - Contains hooks and logic for managing meal data.
   - Fetches and updates meal data from Firebase.

4. **IntroductionScreen.js**:
   - Captures user profile details.
   - Saves data to Firebase during the onboarding process.

5. **FirebaseService.js**:
   - Encapsulates Firebase operations such as `getUserData` and `saveUserData`.

---

## Contributing

### Setting Up the Development Environment
1. Fork the repository and clone it locally.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push them:
   ```bash
   git commit -m "Add feature-name"
   git push origin feature-name
   ```
4. Open a pull request for review.

### Code Style Guidelines
- Follow ESLint rules enforced in the project.
- Use meaningful variable and function names.
- Write comments where necessary to explain complex logic.

---

## Future Enhancements
1. **OCR Integration**:
   - Add scanning functionality to automate medication entry.
2. **Improved Notifications**:
   - Use push notifications to remind users about medication and meal times.
3. **Analytics Dashboard**:
   - Provide insights into users' meal and medication habits.

---

## Support
For any questions or issues, please contact [your-email@example.com].

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.


