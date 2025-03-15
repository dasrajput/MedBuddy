import { addDoc, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore  } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';


export const saveUserData = async (userId, data) => {
  try {
    // Get the current authenticated user
    const currentUser = auth.currentUser;

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

// Add debug logs to the saveReminder function
export const saveReminder = async (userId, reminderData) => {
  try {
    console.log('[FIREBASE] Saving reminder for user:', userId);
    console.log('[FIREBASE] Reminder data:', JSON.stringify(reminderData));
    
    const remindersCollection = collection(firestore, 'reminders');
    const docRef = await addDoc(remindersCollection, {
      ...reminderData,
      userId,
      createdAt: serverTimestamp()
    });
    
    console.log('[FIREBASE] Saved reminder with ID:', docRef.id);
    return docRef.id; // Return the string ID directly
  } catch (error) {
    console.error('[FIREBASE] Error saving reminder:', error);
    return null;
  }
};


export const getUserData = async (userId) => {
  try {
    const currentUser = auth.currentUser;
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
      return { success: false, message: `Signup failed: ${error.message}` };
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
    console.error('Login error:', error.message);
    
    // Instead of returning null, throw the error so it can be caught by the login screen
    throw error;
  }
};

// Add this new function to get user's name
export const getUserName = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.name || userData.displayName || 'there'; // Return name, displayName, or default
    } else {
      console.warn('No user data found for the given ID');
      return 'there'; // Default fallback
    }
  } catch (error) {
    console.error('Error retrieving user name:', error);
    return 'there'; // Default fallback on error
  }
};
