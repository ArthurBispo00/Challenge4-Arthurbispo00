// src/config/firebase.ts 

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBptyo7mVMqUgkP0rqhbqEfMR-kXPguUZQ",
  authDomain: "radarmotu-app.firebaseapp.com",
  projectId: "radarmotu-app",
  storageBucket: "radarmotu-app.appspot.com",
  messagingSenderId: "216057105931",
  appId: "1:216057105931:web:bdd36c9204dc4e7831410e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);