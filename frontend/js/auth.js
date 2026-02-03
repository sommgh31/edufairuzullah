// auth.js (Firebase-based authentication – PROPER VERSION)

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { app } from "./firebase-init.js";

// ===== INIT =====
const auth = getAuth(app);
const db = getFirestore(app);

// ===== REGISTER =====
export async function register(name, email, password, role) {
    try {
        // 1️⃣ Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // 2️⃣ Save extra data (role, name) in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name,
            email,
            role,
            createdAt: new Date()
        });

        // 3️⃣ Save session locally (optional but useful)
        const userData = {
            uid: user.uid,
            email,
            name,
            role
        };

        localStorage.setItem("currentUser", JSON.stringify(userData));

        return { success: true, user: userData };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== LOGIN =====
export async function login(email, password) {
    try {
        // 1️⃣ Firebase Auth login
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // 2️⃣ Get role & name from Firestore
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
            throw new Error("User profile not found");
        }

        const profile = snap.data();

        const userData = {
            uid: user.uid,
            email: user.email,
            name: profile.name,
            role: profile.role
        };

        localStorage.setItem("currentUser", JSON.stringify(userData));

        return { success: true, user: userData };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== LOGOUT =====
export async function logout() {
    await signOut(auth);
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

// ===== SESSION HELPERS =====
export function isAuthenticated() {
    return !!localStorage.getItem("currentUser");
}

export function getCurrentUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
}

// ===== AUTH STATE SYNC (optional but good practice) =====
onAuthStateChanged(auth, (user) => {
    if (!user) {
        localStorage.removeItem("currentUser");
    }
});
