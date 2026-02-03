// firebase-init.js
// Firebase initialization for plain HTML + JS (NO npm, NO bundler)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwo3J8_7biMn67v8xVlZmRpp-MQ9t3oqU",
  authDomain: "edufairuzullah-lms.firebaseapp.com",
  projectId: "edufairuzullah-lms",
  storageBucket: "edufairuzullah-lms.appspot.com",
  messagingSenderId: "626531823036",
  appId: "1:626531823036:web:0596aef035f4bb51de0fb9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
