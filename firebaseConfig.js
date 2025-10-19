const firebaseConfig = {
  apiKey: "AIzaSyBcWYGKCj42Oz41p3SJA2drBnU7FMs4MhU",
  authDomain: "awe-db.firebaseapp.com",
  projectId: "awe-db",
  storageBucket: "awe-db.firebasestorage.app",
  messagingSenderId: "70964725621",
  appId: "1:70964725621:web:42cdec6e7b963eb3a2b53c",
  measurementId: "G-9EH2X0QJHR",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.db = db;
