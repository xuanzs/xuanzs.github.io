document.addEventListener("DOMContentLoaded", function () {
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
    
    const teamName = document.getElementById('teamName');
    const tableButtons = document.querySelectorAll("#t1 button");
    const rightButtons = document.querySelectorAll('.right button');
    const clearAllButtons = document.querySelectorAll('.bottom .Clear');
    const deleteButtons = document.querySelectorAll('.bottom .Delete');
    const submitButton = document.querySelector('.bottom .Submit');

    const urlParams = new URLSearchParams(window.location.search);
    const team = urlParams.get('team');

    if (team) {
        teamName.placeholder = "Team " + team;

        db.collection("assignments").doc("team" + team).get().then((doc) => {
            if(doc.exists){
                const data = doc.data();
                const assignments = data.assignments;

                if(Array.isArray(assignments)){
                    assignments.forEach((item, index) => {
                        const btn = tableButtons[index];
                        btn.textContent = item.value || "";
                        btn.disabled = true;
                    });
                }

                teamName.style.display = 'none';
                document.querySelector('.right').style.display = 'none';
                document.querySelector('.bottom').style.display = 'none';
                document.querySelector('.container h1').textContent = data.name;
            } else {
                teamName.style.display = 'block';
                document.querySelector('.right').style.display = 'block';
                document.querySelector('.bottom').style.display = 'block';
            }
        }).catch((error) => {
            console.error("Error fetching document:", error);
            alert("Failed to load data");
        })
    } else {
        alert('No team selected');
        location.href = 'index.html'; // fallback redirect
    }

    let selectedTableButton = null;
    const assignedButtonsMap = new Map();

    tableButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tableButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTableButton = btn;
        });
    });

    rightButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (selectedTableButton) {
                const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
                if (usedRightBtn) {
                    usedRightBtn.disabled = false;
                    assignedButtonsMap.delete(selectedTableButton);
                }

                selectedTableButton.textContent = btn.textContent;
                btn.disabled = true;
                assignedButtonsMap.set(selectedTableButton, btn);
                tableButtons.forEach(b => b.classList.remove('selected'));
                selectedTableButton = null;
            }
        });
    });

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (selectedTableButton) {
                selectedTableButton.textContent = "";
                const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
                if (usedRightBtn) {
                    usedRightBtn.disabled = false;
                    assignedButtonsMap.delete(selectedTableButton);
                }
                tableButtons.forEach(b => b.classList.remove('selected'));
                selectedTableButton = null;
            }
        });
    });

    clearAllButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const confirmed = confirm("Confirm to Clear All?");
            if (!confirmed) return;

            tableButtons.forEach(tableBtn => {
                tableBtn.textContent = "";
                tableBtn.classList.remove("selected");
            });

            rightButtons.forEach(rightBtn => {
                rightBtn.disabled = false;
            });

            assignedButtonsMap.clear();
            selectedTableButton = null;
        });
    });

    submitButton.addEventListener("click", () => {
        const tableData = [];
        let numFilled = true;
        let teamFilled = true;

        tableButtons.forEach((btn, index) => {
            const value = btn.textContent.trim();

            if (value === "") {
                numFilled = false;
            }
            tableData.push({
                position: index + 1,
                value: value || null
            });
        });

        if (teamName.value.trim() === "") {
            teamFilled = false;
            alert("Please fill in team name.")
            return;
        }    

        if (!numFilled) {
            alert("Please assign all 25 positions before submitting.");
            return;
        }
    
        if (!team) {
            alert("Team not found in URL.");
            return;
        }
    
        document.querySelector('.container h1').textContent = teamName.value.trim();
        teamName.style.display = 'none';
        document.querySelector('.right').style.display = 'none';
        document.querySelector('.bottom').style.display = 'none';

        // Save to Firebase under collection "assignments", document "teamX"
        db.collection("assignments").doc("team" + team).set({
            name: teamName.value.trim(),
            assignments: tableData,
            baby: [
                3, 3, 2, 2, 2, 2, 2,
                1, 1, 1, 1, 1, 1, 1, 1
            ],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("Submitted successfully!");
        })
        .catch((error) => {
            console.error("Error writing to Firebase:", error);
            alert("Submission failed.");
        });
    });
});
