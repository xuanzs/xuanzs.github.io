document.addEventListener("DOMContentLoaded", function () {
  const teamName = document.getElementById("teamName");
  const tableButtons = document.querySelectorAll("#t1 button");
  const rightButtons = document.querySelectorAll(".right button");
  const clearAllButtons = document.querySelectorAll(".bottom .Clear");
  const deleteButtons = document.querySelectorAll(".bottom .Delete");
  const submitButton = document.querySelector(".bottom .Submit");
  const mapBtn = document.querySelector("i");

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
            mapBtn.classList.add("active");

            const data = doc.data();
            console.log("Data received:", data);
            let assignments = data.assignments;

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
            const audioContext = new (window.AudioContext || window.webkitAudioContext) ();

            async function loadAndPlaySound(url) {
              await audioContext.resume();

              const response = await fetch(url);
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);

              source.start(0);
            }

            db.collection("skills")
              .doc("pause")
              .onSnapshot((doc) => {
                if (doc.exists) {
                  const data = doc.data();
                  const status = data.status;

                  let overlay_2 = document.getElementById("overlay-2");

                  if (status === "Freeze") {
                    overlay_2.style.visibility = "visible";

                    alert("You are FREEZED")

                    console.log("Status is Freeze, playing sound...");
                    loadAndPlaySound("/sound/airHorn.mp3").then(() => {
                      console.log("Sound played successfully");
                    })
                    .catch((err) => {
                      console.error("Error playing sound:", err);
                      overlay_2.style.visibility = "visible";
                    });
                  } else {
                    if (overlay_2.style.visibility === "visible") {
                      alert("You are UNfreezed");
                      overlay_2.style.visibility = "hidden";
                    }
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
    location.href = "../index.html";
  }
  

  mapBtn.addEventListener("click", () => {
    sessionStorage.setItem('guestId', `${team}`);
    window.location.href="../map/index.html";
  });

  // ⭐ 核心变量
  let selectedTableButton = null;
  let selectedNumber = null;
  let selectedRightButton = null;
  const assignedButtonsMap = new Map();

  // ⭐ 1️⃣ 表格按钮点击事件（支持两种模式）
  tableButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!filled) {
        // 模式2：如果已经选中了右侧数字，直接填入
        if (selectedNumber !== null && selectedRightButton) {
          // 检查这个单元格是否已经有数字
          const oldRightBtn = assignedButtonsMap.get(btn);
          if (oldRightBtn) {
            // 释放旧数字
            oldRightBtn.disabled = false;
            oldRightBtn.classList.remove('used');
            assignedButtonsMap.delete(btn);
          }

          // 填入新数字
          btn.textContent = selectedNumber;
          
          // 标记右侧按钮为已使用
          selectedRightButton.disabled = true;
          selectedRightButton.classList.add('used');
          selectedRightButton.classList.remove('selected');
          assignedButtonsMap.set(btn, selectedRightButton);

          // 清除选中状态
          rightButtons.forEach((b) => b.classList.remove("selected"));
          tableButtons.forEach((b) => b.classList.remove("selected"));
          selectedNumber = null;
          selectedRightButton = null;
          selectedTableButton = null;
        } else {
          // 模式1：选中这个单元格，等待点击右侧数字
          tableButtons.forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          selectedTableButton = btn;
          
          // 清除右侧选中状态
          rightButtons.forEach((b) => b.classList.remove("selected"));
          selectedNumber = null;
          selectedRightButton = null;
        }
      } else {
        // 已提交后点击显示弹窗
        tableButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
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

  // ⭐ 2️⃣ 右侧数字按钮点击事件（支持两种模式）
  rightButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!btn.disabled && !btn.classList.contains('used')) {
        // 模式1：如果已经选中了表格单元格，直接填入
        if (selectedTableButton) {
          const oldRightBtn = assignedButtonsMap.get(selectedTableButton);
          if (oldRightBtn) {
            oldRightBtn.disabled = false;
            oldRightBtn.classList.remove('used');
            assignedButtonsMap.delete(selectedTableButton);
          }

          selectedTableButton.textContent = btn.textContent;
          btn.disabled = true;
          btn.classList.add('used');
          assignedButtonsMap.set(selectedTableButton, btn);
          
          tableButtons.forEach((b) => b.classList.remove("selected"));
          rightButtons.forEach((b) => b.classList.remove("selected"));
          selectedTableButton = null;
          selectedNumber = null;
          selectedRightButton = null;
        } else {
          // 模式2：选中这个数字，等待点击表格
          rightButtons.forEach((b) => b.classList.remove("selected"));
          btn.classList.add('selected');
          selectedNumber = btn.textContent;
          selectedRightButton = btn;
          
          // 清除表格选中状态
          tableButtons.forEach((b) => b.classList.remove("selected"));
          selectedTableButton = null;
        }
      }
    });
  });

  // ⭐ 3️⃣ Delete 按钮
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (selectedTableButton) {
        selectedTableButton.textContent = "";
        const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
        if (usedRightBtn) {
          usedRightBtn.disabled = false;
          usedRightBtn.classList.remove('used');
          assignedButtonsMap.delete(selectedTableButton);
        }
        tableButtons.forEach((b) => b.classList.remove("selected"));
        selectedTableButton = null;
      }
    });
  });

  // ⭐ 4️⃣ Clear All 按钮
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
        rightBtn.classList.remove('used');
        rightBtn.classList.remove('selected');
      });

      assignedButtonsMap.clear();
      selectedTableButton = null;
      selectedNumber = null;
      selectedRightButton = null;
    });
  });

  submitButton.addEventListener("click", () => {
    const tableData = [];
    let numFilled = true;

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

          const match = doc.id.match(/(\d+)/);
          if (!match) return;
          const stationNumber = parseInt(match[1]);

          stationTopTeamsMap.set(stationNumber, top5Teams);
        });

        tableButtons.forEach((btn) => {
          const label = btn.textContent.trim();
          const match = label.match(/^S?(\d+)$/i);
          if (!match) return;

          const stationNumber = parseInt(match[1]);
          const topTeams = stationTopTeamsMap.get(stationNumber);

          if (topTeams && topTeams.includes(teamId)) {
            btn.style.background = "linear-gradient(180deg, #0A4618FF, #1EFF00FF)";
            btn.style.color = "#FFFFFFFF";
          } else {
            btn.style.background = "linear-gradient(180deg,#fff,#f1f1f1)";
            btn.style.color = "#0b0b0b";
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

  return topPairs.map((pair) => pair.team).filter(Boolean);
}

let unsubscribeStationPopup = null;

function showTop5PairsAndBabyForStation(stationLabel) {
  if (!stationLabel) return;

  const match = stationLabel.match(/^S?(\d+)$/i);
  if (!match) return;

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
          clearPopupDisplay();
          return;
        }

        const data = doc.data();
        if (!data) {
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
          if (!rowData || !Array.isArray(rowData.team) || !Array.isArray(rowData.baby))
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

        document.querySelector(".popup h4").textContent = `Station ${stationNumber}`;
        
        const h5Elements = document.querySelectorAll(".babies h5");
        top5Pairs.forEach(({ team, baby }, index) => {
          if (h5Elements[index]) {
            h5Elements[index].textContent = team
              ? `#${index + 1}: Baby ${baby} -${team}`
              : `#${index + 1}: [No data]`;
          }
        });
      }
    );
}

function clearPopupDisplay() {
  document.querySelector(".popup h4").textContent = "No Data";
  const h5Elements = document.querySelectorAll(".babies h5");
  h5Elements.forEach((h5) => (h5.textContent = ""));
}

const overlay = document.getElementById('overlay');
const popup = document.getElementById('popup');
const btnClose = document.getElementById('popupClose');

function closePopup(){
  popup.classList.remove('show');
  overlay.classList.remove('show');
  document.body.classList.remove('modal-open');
}

overlay.addEventListener('click', closePopup);
btnClose.addEventListener('click', closePopup);
popup.addEventListener('click', (e)=> e.stopPropagation());
window.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && popup.classList.contains('show')) closePopup();
});