const firebaseConfig = {
    apiKey: "AIzaSyBcWYGKCj42Oz41p3SJA2drBnU7FMs4MhU",
    authDomain: "awe-db.firebaseapp.com",
    projectId: "awe-db",
    storageBucket: "awe-db.firebasestorage.app",
    messagingSenderId: "70964725621",
    appId: "1:70964725621:web:42cdec6e7b963eb3a2b53c",
    measurementId: "G-9EH2X0QJHR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Authentication Admin
db.collection("authentication").doc("admin").set({
    id: "001",
    password: "admin"
});

// Authentication GM
db.collection("authentication").doc("gamemaster").set({
  accounts: {
    gm1: { id: "1", password: "pw1", status: "vacant"},
    gm2: { id: "2", password: "pw2", status: "vacant" },
    gm3: { id: "3", password: "pw3", status: "vacant" },
    gm4: { id: "4", password: "pw4", status: "vacant" },
    gm5: { id: "5", password: "pw5", status: "vacant" },
    gm6: { id: "6", password: "pw6", status: "vacant" },
    gm7: { id: "7", password: "pw7", status: "vacant" },
    gm8: { id: "8", password: "pw8", status: "vacant" },
    gm9: { id: "9", password: "pw9", status: "vacant" },
    gm10: { id: "10", password: "pw10", status: "vacant" },
    gm11: { id: "11", password: "pw11", status: "vacant" },
    gm12: { id: "12", password: "pw12", status: "vacant" },
    gm13: { id: "13", password: "pw13", status: "vacant" },
    gm14: { id: "14", password: "pw14", status: "vacant" },
    gm15: { id: "15", password: "pw15", status: "vacant" },
    gm16: { id: "16", password: "pw16", status: "vacant" },
    gm17: { id: "17", password: "pw17", status: "vacant" },
    gm18: { id: "18", password: "pw18", status: "vacant" },
    gm19: { id: "19", password: "pw19", status: "vacant" },
    gm20: { id: "20", password: "pw20", status: "vacant" },
    gm21: { id: "21", password: "pw21", status: "vacant" },
    gm22: { id: "22", password: "pw22", status: "vacant" },
    gm23: { id: "23", password: "pw23", status: "vacant" },
    gm24: { id: "24", password: "pw24", status: "vacant" },
    gm25: { id: "25", password: "pw25", status: "vacant" }
  }
});

// // Team
// for (let i = 1; i <= 15; i++) {
//     db.collection("assignments").doc(`team${i}`).set({
//         baby: [
//             3, 3, 2, 2, 2, 2, 2,
//             1, 1, 1, 1, 1, 1, 1, 1
//         ]
//     });
// }

// db.collection("assignments").doc(`team1`).set({
//     baby: [
//         3, 3, 2, 2, 2, 2, 2,
//         1, 1, 1, 1, 1, 1, 1, 1
//     ]
// });


