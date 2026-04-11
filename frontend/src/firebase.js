// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Replace with your Firebase project config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD6ddnKhatj4yLBV1J_CJZgRdgOITsei1I",
  authDomain: "threatlens-6aac9.firebaseapp.com",
  projectId: "threatlens-6aac9",
  storageBucket: "threatlens-6aac9.firebasestorage.app",
  messagingSenderId: "343235745497",
  appId: "1:343235745497:web:a7479dd04fd0e33dc890c8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export default app;