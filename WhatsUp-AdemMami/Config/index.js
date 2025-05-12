// Import the Firebase compat libraries
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
// If you use analytics, you might need: import 'firebase/compat/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZl4wVzPlccdbrslvoQcpsg08a1FYBrxI",
  authDomain: "whatsapp-2e41b.firebaseapp.com",
  databaseURL: "https://whatsapp-2e41b-default-rtdb.firebaseio.com",
  projectId: "whatsapp-2e41b",
  storageBucket: "whatsapp-2e41b.firebasestorage.app",
  messagingSenderId: "46746549518",
  appId: "1:46746549518:web:fd7f0e1a49abd732686b5f",
  measurementId: "G-FK3HPG93FY"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// To use analytics with the compat library:
// const analytics = firebase.analytics();

export default firebase; // Export the initialized firebase namespace