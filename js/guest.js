document.addEventListener("DOMContentLoaded", function () {
  const teamName = document.getElementById("teamName");
  const tableButtons = document.querySelectorAll("#t1 button");
  const rightButtons = document.querySelectorAll(".right button");
  const clearAllButtons = document.querySelectorAll(".bottom .Clear");
  const deleteButtons = document.querySelectorAll(".bottom .Delete");
  const submitButton = document.querySelector(".bottom .Submit");

  const urlParams = new URLSearchParams(window.location.search);
  const team = urlParams.get("team");

  let filled = false;

  if (team) {
    teamName.placeholder = "Team " + team;

    db.collection("assignments")
      .doc("team" + team)
      .onSnapshot(
        (doc) => {
          console.log("onSnapshot fired!");

          if (doc.exists) {
            const data = doc.data();
            console.log("Data received:", data);
            let assignments = data.assignments;

            // if (Array.isArray(assignments)) {
            //   assignments.forEach((item, index) => {
            //     const btn = tableButtons[index];
            //     btn.textContent = item.value || "";
            //     // btn.disabled = false;
            //   });
            // }

            if (!Array.isArray(assignments)) {
              console.warn("Assignments is not an array");
              return;
            }

            assignments.forEach((item, index) => {
              const btn = tableButtons[index];
              btn.textContent = item.value || "";
            })
        
            filled = true;
        
            teamName.style.display = "none";
            document.querySelector(".right").style.display = "none";
            document.querySelector(".bottom").style.display = "none";
            document.querySelector(".container h1").textContent = data.name;
            
        
            highlightCorrectStations(`team${team}`, tableButtons);
            document.body.classList.add("submitted");

            // Shutdown + Restore

            let shutdownStation = null;
            let currentRestoreTeams = [];
            let currentTeamId = "team" + team;

            db.collection("skills")
              .doc("shutdown")
              .onSnapshot((doc) => {
                if (!doc.exists) {
                  shutdownStation = null;
                  applyShutdownIfNeeded();
                  return;
                }

                const data = doc.data();
                shutdownStation = data.station;
                console.log("Shutdown station is:", shutdownStation);
                applyShutdownIfNeeded();
              });

            db.collection("skills")
            .doc("restore")
            .onSnapshot((resDoc) => {
              if (!resDoc.exists) {
                currentRestoreTeams = [];
              } else {
                const data = resDoc.data();
                currentRestoreTeams = data.teams || [];
              }
              applyShutdownIfNeeded();
            });

            function applyShutdownIfNeeded() {
              if (!shutdownStation) return;

              if (currentRestoreTeams.includes(currentTeamId)) {
                console.log(`Team ${currentTeamId} is in restore list, skipping shutdown`);
                resetButtons();
                return;
              }

              tableButtons.forEach((btn) => {
                if (btn.textContent === shutdownStation) {
                  btn.classList.add("btn-shutdown");
                  btn.disabled = true;
                  console.log(
                    `Station ${shutdownStation} shut down for team ${currentTeamId}`
                  );
                }
              });
            }

            function resetButtons() {
              tableButtons.forEach((btn) => {
                btn.classList.remove("btn-shutdown");
                btn.disabled = false;
              });
            }

            // Freeze
            db.collection("skills")
              .doc("pause")
              .onSnapshot((doc) => {
                if (doc.exists) {
                  const data = doc.data();
                  const status = data.status;

                  if (status === "Freeze") {
                    const alarm = new Audio("/sound/airHorn.mp3");

                    alarm.play();
                    alert("You are freezed")
                    console.log("You are freezed");
                  }
                }
              });
          } else {
            teamName.style.display = "block";
            document.querySelector(".right").style.display = "block";
            document.querySelector(".bottom").style.display = "block";
            document.body.classList.remove("submitted");
          }
        },
        (error) => {
          console.error("Error fetching document:", error);
          alert("Failed to load data");
        });
  } else {
    alert("No team selected");
    location.href = "index.html"; // fallback redirect
  }

  // function updateUI(assignments, teamNameText) {
  //   assignments.forEach((item, index) => {
  //     const btn = tableButtons[index];
  //     btn.textContent = item.value || "";
  //   })

  //   filled = true;

  //   teamName.style.display = "none";
  //   document.querySelector(".right").style.display = "none";
  //   document.querySelector(".bottom").style.display = "none";
  //   document.querySelector(".container h1").textContent = teamNameText;
  //   // data.name

  //   highlightCorrectStations(`team${team}`, tableButtons);
  //   document.body.classList.add("submitted");
  // }

  let selectedTableButton = null;
  const assignedButtonsMap = new Map();

  tableButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tableButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      if (!filled) {
        selectedTableButton = btn;
      } else {
        document.getElementById("popup").classList.add("show");
        document.getElementById("overlay").classList.add("show");

        showTop5PairsAndBabyForStation(btn.textContent);
      }
    });
  });

  document.getElementById("overlay").addEventListener("click", () => {
    document.getElementById("popup").classList.remove("show");
    document.getElementById("overlay").classList.remove("show");

    tableButtons.forEach((b) => b.classList.remove("selected"));
  });

  rightButtons.forEach((btn) => {
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
        tableButtons.forEach((b) => b.classList.remove("selected"));
        selectedTableButton = null;
      }
    });
  });

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (selectedTableButton) {
        selectedTableButton.textContent = "";
        const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
        if (usedRightBtn) {
          usedRightBtn.disabled = false;
          assignedButtonsMap.delete(selectedTableButton);
        }
        tableButtons.forEach((b) => b.classList.remove("selected"));
        selectedTableButton = null;
      }
    });
  });

  clearAllButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const confirmed = confirm("Confirm to Clear All?");
      if (!confirmed) return;

      tableButtons.forEach((tableBtn) => {
        tableBtn.textContent = "";
        tableBtn.classList.remove("selected");
      });

      rightButtons.forEach((rightBtn) => {
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
        value: value || null,
      });
    });

    if (teamName.value.trim() === "") {
      teamFilled = false;
      alert("Please fill in team name.");
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

    document.querySelector(".container h1").textContent = teamName.value.trim();
    teamName.style.display = "none";
    document.querySelector(".right").style.display = "none";
    document.querySelector(".bottom").style.display = "none";

    // Save to Firebase under collection "assignments", document "teamX"
    db.collection("assignments")
      .doc("team" + team)
      .set({
        name: teamName.value.trim(),
        assignments: tableData,
        baby: [3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        document.body.classList.add("submitted");
        alert("Submitted successfully!");
      })
      .catch((error) => {
        console.error("Error writing to Firebase:", error);
        alert("Submission failed.");
      });
  });

  // setInterval(() => {
  //     location.reload();
  // }, 10000);
});

function highlightCorrectStations(teamId, tableButtons) {
  firebase
    .firestore()
    .collection("stationSubmission")
    .onSnapshot(
      (snapshot) => {
        const stationTopTeamsMap = new Map();

        snapshot.forEach((doc) => {
          const data = doc.data();
          const top5Teams = getTop5Teams(data);

          const match = doc.id.match(/(\d+)/); // e.g., "station13" → 13
          if (!match) return;
          const stationNumber = parseInt(match[1]);

          stationTopTeamsMap.set(stationNumber, top5Teams);

          console.log(`Station ${stationNumber} top5:`, top5Teams);
        });

        tableButtons.forEach((btn) => {
          const label = btn.textContent.trim(); // e.g., "S13"

          // console.log("Button label:", label);

          const match = label.match(/^S?(\d+)$/i);
          if (!match) return;

          const stationNumber = parseInt(match[1]);
          const topTeams = stationTopTeamsMap.get(stationNumber);

          if (topTeams && topTeams.includes(teamId)) {
            btn.style.backgroundColor = "green";
            btn.style.color = "white";
          } else {
            btn.style.backgroundColor = "white";
            btn.style.color = "black";
          }
        });
      },
      (error) => {
        console.error("Error fetching stationSubmission:", error);
      }
    );
}

function getTop5Teams(stationData) {
  const MAX_ROWS = 4;
  const MAX_PAIRS = 5;

  const topPairs = Array.from({ length: MAX_PAIRS }, () => ({
    team: null,
    baby: -Infinity,
  }));

  for (let row = 1; row <= MAX_ROWS; row++) {
    const rowData = stationData[`row${row}`];
    if (!rowData || !rowData.team || !rowData.baby) continue;

    for (let i = 0; i < MAX_PAIRS; i++) {
      const t = rowData.team[i];
      const b = parseFloat(rowData.baby[i]);

      if (t && !isNaN(b) && b > topPairs[i].baby) {
        topPairs[i] = { team: t, baby: b };
      }
    }
  }

  const result = topPairs.map((pair) => pair.team).filter(Boolean);

  console.log("Top 5 teams for this station:", result);
  return result;
}

let unsubscribeStationPopup = null;

function showTop5PairsAndBabyForStation(stationLabel) {
  if (!stationLabel) {
    console.warn("Invalid station label");
    return;
  }

  const match = stationLabel.match(/^S?(\d+)$/i);
  if (!match) {
    console.warn("Could not extract station number from:", stationLabel);
    return;
  }

  const stationNumber = match[1];

  if (unsubscribeStationPopup) {
    unsubscribeStationPopup();
  }

  unsubscribeStationPopup = firebase
    .firestore()
    .collection("stationSubmission")
    .doc("station" + stationNumber)
    .onSnapshot(
      (doc) => {
        if (!doc.exists) {
          console.log(`❌ No data found for station ${stationNumber}`);
          clearPopupDisplay();
          return;
        }

        const data = doc.data();
        if (!data) {
          console.log(`❌ No valid data in station ${stationNumber}`);
          clearPopupDisplay();
          return;
        }

        const MAX_ROWS = 4;
        const MAX_PAIRS = 5;

        const top5Pairs = Array.from({ length: MAX_PAIRS }, () => ({
          team: null,
          baby: -Infinity,
        }));

        for (let row = 1; row <= MAX_ROWS; row++) {
          const rowData = data[`row${row}`];
          if (
            !rowData ||
            !Array.isArray(rowData.team) ||
            !Array.isArray(rowData.baby)
          )
            continue;

          for (let i = 0; i < MAX_PAIRS; i++) {
            const team = rowData.team[i];
            const baby = parseFloat(rowData.baby[i]);

            if (team && !isNaN(baby)) {
              if (baby > top5Pairs[i].baby) {
                top5Pairs[i] = { team, baby };
              }
            }
          }
        }

        console.log(`📊 Top 5 positional pairs for Station ${stationNumber}:`);
        top5Pairs.forEach(({ team, baby }, index) => {
          if (team !== null) {
            console.log(`#${index + 1}: Team ${team} - Baby: ${baby}`);
          } else {
            console.log(`#${index + 1}: [empty]`);
          }
        });

        // Fill HTML
        document.querySelector(
          ".popup h4"
        ).textContent = `Station ${stationNumber}`;

        const h5Elements = document.querySelectorAll(".babies h5");
        top5Pairs.forEach(({ team, baby }, index) => {
          if (h5Elements[index]) {
            h5Elements[index].textContent = team
              ? `#${index + 1}: Team ${team} - Baby: ${baby}`
              : `#${index + 1}: [No data]`;
          }
        });
      },
      (err) => {
        console.error(`Error fetching station${stationNumber} data:`, err);
      }
    );
}

function clearPopupDisplay() {
  document.querySelector(".popup h4").textContent = "No Data";
  const h5Elements = document.querySelectorAll(".babies h5");
  h5Elements.forEach((h5) => (h5.textContent = ""));
}
