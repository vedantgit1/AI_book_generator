import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDxviAdjRPGd6OV-d7tmTHB00uHk9A_i_0",
    authDomain: "aetherwriter-ai-9988.firebaseapp.com",
    projectId: "aetherwriter-ai-9988",
    storageBucket: "aetherwriter-ai-9988.firebasestorage.app",
    messagingSenderId: "158254084240",
    appId: "1:158254084240:web:2a0d210782292f1d62e815"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
