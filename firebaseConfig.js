
import { initializeApp } from "firebase/app";
import {
  initializeAuth, getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBJwQO68SFBbhWv2FCJp0gM6knC8jo_EzQ",
  authDomain: "medbuddy-e29a3.firebaseapp.com",
  projectId: "medbuddy-e29a3",
  storageBucket: "medbuddy-e29a3.appspot.com",
  messagingSenderId: "1056889903639",
  appId: "1:1056889903639:android:b868f4b2d338b5f4331a52",
  measurementId: "G-XXXXXXX" // Optional, can be left blank
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})
export const firestore = getFirestore(app);
