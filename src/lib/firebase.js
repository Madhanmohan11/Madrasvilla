// src/lib/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ❌ REMOVE analytics import (causes issues in dev / SSR)
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBMlL6uzFwxPxval0XYA1k425p69DtYglY",
  authDomain: "madrasvilla.firebaseapp.com",
  projectId: "madrasvilla",
  storageBucket: "madrasvilla.firebasestorage.app",
  messagingSenderId: "747882133707",
  appId: "1:747882133707:web:9aa21f39d1d8a2a3dc434e",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// ❌ DO NOT use analytics unless you handle window check
