import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore"; // Firestore for database
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBphaZlFzmkecnvRwO8wpmKc30oM16Y7YM",
  authDomain: "budgeto-90872.firebaseapp.com",
  projectId: "budgeto-90872",
  storageBucket: "budgeto-90872.appspot.com",
  messagingSenderId: "965257383799",
  appId: "1:965257383799:web:344f22b08ae46c3b79db72",
  measurementId: "G-KH362KL52B",
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore (database)
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
