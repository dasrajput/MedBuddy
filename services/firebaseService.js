import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';

import { getAuth } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';


export const saveUserData = async (userId, data) => {
  try {
    // Get the current authenticated user
    const currentUser = getAuth().currentUser;

    // Validate inputs
    if (!userId) throw new Error('User ID is required');
    if (!data || typeof data !== 'object') throw new Error('Invalid data format');
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('You are not authorized to save this data');
    }

    // Check if mealTimes is defined and is an array
    if (data.mealTimes && !Array.isArray(data.mealTimes)) {
      throw new Error('mealTimes must be an array');
    }

    // Create a reference to the Firestore document
    const userDocRef = doc(firestore, 'users', userId);

    // Save user data to Firestore
    await setDoc(userDocRef, data, { merge: true }); // Use merge to avoid overwriting
    console.log('User data saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
};

export const saveReminder = async (userId, reminderData) => {
  try {
    const currentUser = getAuth().currentUser;
    console.log("Current user:", currentUser); // Debug statement to check current user

    if (!userId) throw new Error('User ID is required');
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('You are not authorized to save this data');
    }

    // Create a reference to the Firestore collection for reminders
    const remindersCollectionRef = collection(firestore, 'reminders');
    
    console.log("Attempting to save reminder data to Firestore:", reminderData); // Debug statement

    // Save reminder data to Firestore
    const docRef = await addDoc(remindersCollectionRef, { ...reminderData, userId });
    console.log('Reminder saved successfully with ID:', docRef.id); // Debug statement to confirm save

    return { success: true };
  } catch (error) {
    console.error('Error saving reminder:', error);
    return { success: false, error: error.message };
  }
};


export const getUserData = async (userId) => {
  try {
    const currentUser = getAuth().currentUser;
    if (!userId) throw new Error('User ID is required');
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('You are not authorized to view this data');
    }
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      console.log('User data retrieved successfully:', userDoc.data());
      return userDoc.data(); // Return the user data
    } else {
      console.warn('No user data found for the given ID');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};


// Function to handle signup
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Define the data you want to store in Firestore
    const userData = {
      email: user.email,
      uid: user.uid,
      createdAt: new Date().toISOString(), // Optional: Add createdAt timestamp
    };

    // Save the user data to Firestore
    await saveUserData(user.uid, userData);
    
    console.log('User signed up successfully');
    return { success: true, userCredential }; // Return success and userCredential if signup is successful
  } catch (error) {
    console.error('Signup error:', error);

    // Return an error message to be handled by SignupScreen
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: 'Email is already in use' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email format' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, message: 'Weak password' };
    } else {
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  }
};


// Function to handle login
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user); // Log the user object for debugging
    console.log('this is getting triggered ddddddddddddddddddddd')
    return userCredential.user; // Return the user object instead of the whole userCredential
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'auth/user-not-found') {
      console.error('No user found with this email');
    } else if (error.code === 'auth/wrong-password') {
      console.error('Incorrect password');
    } else if (error.code === 'auth/invalid-email') {
      console.error('Invalid email format');
    } else {
      console.error('Login error:', error.message);
    }
    return null;
  }
};
