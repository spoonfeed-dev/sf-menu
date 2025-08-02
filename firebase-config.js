// firebase-config.js
// Customer Menu Firebase Config (Read-only - no auth/storage exports for customer app)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ✅ Corrected storageBucket - must be 'amritulya-spoonfeed.appspot.com', not 'firebasestorage.app'
const firebaseConfig = {
  apiKey: "AIzaSyBmUKfd_epflQSVkmvHwXbikE-SPbxlWPk",
  authDomain: "amritulya-spoonfeed.firebaseapp.com",
  projectId: "amritulya-spoonfeed",
  storageBucket: "amritulya-spoonfeed.appspot.com", // <-- FIXED
  messagingSenderId: "1037457154599",
  appId: "1:1037457154599:web:e74b7f48cdbdbd7e57a402",
  measurementId: "G-PJ9BT7E06N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore DB instance for use in the rest of your app
export const db = getFirestore(app);

// No export for Auth or Storage, as customer menu is read-only and doesn't upload or require login
