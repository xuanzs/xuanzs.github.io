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
    gm1: { id: "gm1", password: "pw1" },
    gm2: { id: "gm2", password: "pw2" },
    gm3: { id: "gm3", password: "pw3" },
    gm4: { id: "gm4", password: "pw4" },
    gm5: { id: "gm5", password: "pw5" },
    gm6: { id: "gm6", password: "pw6" },
    gm7: { id: "gm7", password: "pw7" },
    gm8: { id: "gm8", password: "pw8" },
    gm9: { id: "gm9", password: "pw9" },
    gm10: { id: "gm10", password: "pw10" },
    gm11: { id: "gm11", password: "pw11" },
    gm12: { id: "gm12", password: "pw12" },
    gm13: { id: "gm13", password: "pw13" },
    gm14: { id: "gm14", password: "pw14" },
    gm15: { id: "gm15", password: "pw15" },
    gm16: { id: "gm16", password: "pw16" },
    gm17: { id: "gm17", password: "pw17" },
    gm18: { id: "gm18", password: "pw18" },
    gm19: { id: "gm19", password: "pw19" },
    gm20: { id: "gm20", password: "pw20" },
    gm21: { id: "gm21", password: "pw21" },
    gm22: { id: "gm22", password: "pw22" },
    gm23: { id: "gm23", password: "pw23" },
    gm24: { id: "gm24", password: "pw24" },
    gm25: { id: "gm25", password: "pw25" }
  }
})

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


