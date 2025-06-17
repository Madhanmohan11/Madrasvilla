// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Assuming you're also using Auth
import { getFirestore } from "firebase/firestore"; // <--- ADD THIS LINE

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvsX3z5RAedeXrxKVRGegvAmpLqKlB_Wg",
  authDomain: "madrasvilla2025.firebaseapp.com",
  projectId: "madrasvilla2025",
  storageBucket: "madrasvilla2025.firebasestorage.app",
  messagingSenderId: "227488898519",
  appId: "1:227488898519:web:0636c4f1d284f0f708bf92",
  measurementId: "G-TNXF7SXW0H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Export auth if you use it elsewhere
export const db = getFirestore(app); // <--- ADD THIS LINE TO EXPORT DB

// You can export other services as needed, e.g., storage
// import { getStorage } from "firebase/storage";
// export const storage = getStorage(app);