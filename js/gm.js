// ===========================
// CONSTANTS & CONFIGURATION
// ===========================
const MAX_ROWS = 4;
const MAX_PAIRS = 5;

const urlParams = new URLSearchParams(window.location.search);
const stationId = urlParams.get("id");

const element = document.querySelector(".container");
const stationName = document.querySelector(".left h1");
const gmDocRef = db.collection("authentication").doc("gamemaster");

// ===========================
// INITIALIZATION
// ===========================
if (!stationId) {
  alert("No GM selected!");
  location.href = "../index.html";
} else {
  stationName.textContent = "Station " + stationId;
  initializeApp();
}

function initializeApp() {
  setupFreezeListener();
  setupShutdownListener();
  fillTeamDropdowns();
  loadSubmissionData();
  setVacantStatus();
}

// ===========================
// AUDIO & FREEZE FUNCTIONALITY
// ===========================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

async function playSound(url) {
  await audioContext.resume();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}

function setupFreezeListener() {
  db.collection("skills")
    .doc("pause")
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      
      const status = doc.data().status;
      
      if (status === "Freeze") {
        alert("You are FREEZED");
        element.style.backgroundColor = "blue";
        playSound("/sound/airHorn.mp3")
          .then(() => console.log("Sound played successfully"))
          .catch((err) => console.error("Error playing sound:", err));
      } else if (element.style.backgroundColor === "blue") {
        alert("You are UNfreezed");
        element.style.backgroundColor = "green";
      }
    });
}

function setupShutdownListener() {
  db.collection("skills")
    .doc("pause")
    .onSnapshot((doc) => {
      const data = doc.data();
      const shutStation = data.station;

      if (stationId === shutStation) {
        alert("Your station is SHUTDOWN");
        playSound("/sound/alarm2.mp3")
          .then(() => console.log("Sound played successfully"))
          .catch((err) => console.error("Error playing sound:", err));
      }
    })
}

// ===========================
// STATUS MANAGEMENT
// ===========================
function setVacantStatus() {
  element.style.backgroundColor = "green";
  updateStationStatus("vacant");
  // Status update will trigger onSnapshot which will disable all dropdowns
}

function setOccupiedStatus() {
  element.style.backgroundColor = "red";
  updateStationStatus("occupied");
  // Status update will trigger onSnapshot which will enable required dropdowns
}

function updateStationStatus(status) {
  gmDocRef.set({
    accounts: {
      [`gm${stationId}`]: { status }
    }
  }, { merge: true });
}

// ===========================
// DROPDOWN POPULATION
// ===========================
function fillTeamDropdowns() {
  const teamSelects = document.querySelectorAll(".top select");

  db.collection("assignments")
    .get().then((querySnapshot) => {
      // Clear existing options first (except the empty option)
      teamSelects.forEach((select) => {
        // Keep only the first empty option if it exists
        const hasEmptyOption = select.options[0]?.value === "";
        select.innerHTML = hasEmptyOption ? '<option value=""></option>' : '';
      });

      querySnapshot.forEach((doc) => {
        const { name: teamName } = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = teamName;

        teamSelects.forEach((select) => {
          select.appendChild(option.cloneNode(true));
        });
      });

      teamSelects.forEach((select) => {
        select.addEventListener("change", () => fillBabyDropdown(select));
      });
    })
    // .catch((error) => console.error("Error loading teams:", error));
}

function fillBabyDropdown(teamSelect) {
  const teamId = teamSelect.value;
  if (!teamId) return;

  const parentRow = teamSelect.closest(".row");
  const pairClass = teamSelect.className;
  const babySelect = parentRow.querySelector(`.bottom .s${pairClass.substring(1)}`);

  babySelect.innerHTML = '<option value=""></option>';

  db.collection("assignments")
    .doc(teamId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        console.error("Team not found in Firestore.");
        return;
      }

      const babies = doc.data().baby || [];
      babies.forEach((baby) => {
        const option = document.createElement("option");
        option.value = baby;
        option.textContent = baby;
        babySelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error loading baby options:", error));
}

// ===========================
// DATA LOADING
// ===========================
function loadSubmissionData() {
  // Listen to station submission data
  db.collection("stationSubmission")
    .doc(`station${stationId}`)
    .onSnapshot((doc) => {
      if (!doc.exists) {
        // No data yet, check gamemaster status to determine if dropdowns should be enabled
        checkGamemasterStatusAndUpdateDropdowns();
        return;
      }

      const data = doc.data();
      
      // Fill all existing data into dropdowns
      for (let row = 1; row <= MAX_ROWS; row++) {
        const rowData = data[`row${row}`];
        if (!rowData) continue;

        for (let i = 0; i < MAX_PAIRS; i++) {
          if (rowData.team[i]) {
            const teamSelect = getInput(row, "top", "p", i + 1);
            const babySelect = getInput(row, "bottom", "s", i + 1);
            
            ensureOptionExistsAndSelect(teamSelect, rowData.team[i]);
            ensureOptionExistsAndSelect(babySelect, rowData.baby[i]);
          }
        }
      }
      
      // After filling data, check gamemaster status and update dropdowns
      checkGamemasterStatusAndUpdateDropdowns();
    });
}

function ensureOptionExistsAndSelect(select, value) {
  if (!value) return;

  const hasOption = [...select.options].some((opt) => opt.value === value);

  if (!hasOption) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);

    // Fetch team name if it's a team ID
    if (/^team\d+$/.test(value)) {
      db.collection("assignments")
        .doc(value)
        .get()
        .then((doc) => {
          if (doc.exists) {
            opt.textContent = doc.data().name;
          }
        });
    }
  }

  select.value = value;
}

// ===========================
// DROPDOWN STATE MANAGEMENT
// ===========================
function checkGamemasterStatusAndUpdateDropdowns() {
  gmDocRef.onSnapshot((doc) => {
    if (!doc.exists) {
      disableAllRows();
      return;
    }

    const data = doc.data();
    const gmData = data.accounts?.[`gm${stationId}`];
    const status = gmData?.status;

    if (status === "occupied") {
      // Only enable required dropdowns when occupied
      updateDropdownStates();
    } else {
      // If vacant, disable all dropdowns
      disableAllRows();
    }
  });
}

function updateDropdownStates() {
  // First, disable all dropdowns
  disableAllRows();

  // Process each column (pair position) from 1 to 5
  for (let col = 1; col <= MAX_PAIRS; col++) {
    enableDropdownsForColumn(col);
  }
}

function disableAllRows() {
  for (let row = 1; row <= MAX_ROWS; row++) {
    const selects = document.querySelectorAll(`.r${row} select`);
    selects.forEach((select) => (select.disabled = true));
  }
}

function enableDropdownsForColumn(col) {
  // Check if row 4 has baby = 4 (column closed)
  const row4Baby = getInput(4, "bottom", "s", col);
  if (row4Baby && parseInt(row4Baby.value) === 4) {
    return; // This column is closed, don't open any dropdowns
  }

  // Process from Row 1 to Row 3 (not Row 4 - it's manually managed)
  for (let row = 1; row <= 3; row++) {
    const teamSelect = getInput(row, "top", "p", col);
    const babySelect = getInput(row, "bottom", "s", col);

    if (!teamSelect || !babySelect) continue;

    const teamValue = teamSelect.value;
    const babyValue = babySelect.value;

    // If current position is filled
    if (teamValue && babyValue) {
      const babyNum = parseInt(babyValue);

      // ROW 1: If baby !== 3, open above (row 2) and right side
      if (row === 1) {
        if (babyNum !== 3) {
          // Open above (row 2, same column)
          const row2Team = getInput(2, "top", "p", col);
          const row2Baby = getInput(2, "bottom", "s", col);
          if (row2Team && row2Baby && !row2Team.value) {
            row2Team.disabled = false;
            row2Baby.disabled = false;
          }

          // Open right side (row 1, next column)
          const nextTeam = getInput(1, "top", "p", col + 1);
          const nextBaby = getInput(1, "bottom", "s", col + 1);
          if (nextTeam && nextBaby && !nextTeam.value) {
            nextTeam.disabled = false;
            nextBaby.disabled = false;
          }
        } else {
          // baby === 3: only open right side, don't open above
          const nextTeam = getInput(1, "top", "p", col + 1);
          const nextBaby = getInput(1, "bottom", "s", col + 1);
          if (nextTeam && nextBaby && !nextTeam.value) {
            nextTeam.disabled = false;
            nextBaby.disabled = false;
          }
        }
      }
      // ROW 2: If baby === 2, open above (row 3). If baby === 3, don't open above
      else if (row === 2) {
        if (babyNum === 2) {
          // Open above (row 3, same column)
          const row3Team = getInput(3, "top", "p", col);
          const row3Baby = getInput(3, "bottom", "s", col);
          if (row3Team && row3Baby && !row3Team.value) {
            row3Team.disabled = false;
            row3Baby.disabled = false;
          }
        }
        // If baby === 3, that's the end, don't open above
      }
      // ROW 3: Don't automatically open row 4
      // Row 4 is manually managed, not opened by the system
    }
    // If current position is empty
    else {
      // ROW 1: Always enable if empty (starting point)
      if (row === 1) {
        teamSelect.disabled = false;
        babySelect.disabled = false;
      }
      // ROW 2: Enable if row 1 baby !== 3
      else if (row === 2) {
        const row1Team = getInput(1, "top", "p", col);
        const row1Baby = getInput(1, "bottom", "s", col);
        
        if (row1Team?.value && row1Baby?.value) {
          const row1BabyNum = parseInt(row1Baby.value);
          
          if (row1BabyNum !== 3) {
            teamSelect.disabled = false;
            babySelect.disabled = false;
          }
        }
      }
      // ROW 3: Enable if row 2 baby === 2
      else if (row === 3) {
        const row2Team = getInput(2, "top", "p", col);
        const row2Baby = getInput(2, "bottom", "s", col);
        
        if (row2Team?.value && row2Baby?.value) {
          const row2BabyNum = parseInt(row2Baby.value);
          
          if (row2BabyNum === 2) {
            teamSelect.disabled = false;
            babySelect.disabled = false;
          }
        }
      }
      
      // Stop processing this column after first empty position
      break;
    }
  }
}

// ===========================
// SUBMISSION LOGIC
// ===========================
async function submitBtn() {
  let submittedPair = null;

  // Find the first active (enabled and filled) pair
  for (let row = 1; row <= MAX_ROWS && !submittedPair; row++) {
    for (let col = 1; col <= MAX_PAIRS && !submittedPair; col++) {
      const teamSelect = getInput(row, "top", "p", col);
      const babySelect = getInput(row, "bottom", "s", col);

      const teamValue = teamSelect?.value?.trim();
      const babyValue = babySelect?.value?.trim();

      // Check if this pair is active and filled
      if (!teamSelect.disabled && !babySelect.disabled && teamValue && babyValue) {
        submittedPair = { row, col, teamValue, babyValue, teamSelect, babySelect };
      }
    }
  }

  if (!submittedPair) {
    alert("No active pair found to submit.");
    return;
  }

  const { row, col, teamValue, babyValue, teamSelect, babySelect } = submittedPair;

  // Validate submission
  if (!validateSubmission(row, col, teamValue, babyValue)) {
    return;
  }

  // Disable the submitted pair
  teamSelect.disabled = true;
  babySelect.disabled = true;

  // Log to history
  await logSubmission(row, col, teamValue, babyValue);

  // Remove baby from assignment
  await removeBabyFromAssignment(teamValue, babyValue);

  // Update Firestore with new row data
  await updateStationSubmission(row, col, teamValue, babyValue);

  // Update dropdown states based on new submission
  // After submission, status is set to vacant which will trigger
  // the onSnapshot listener to disable all dropdowns
  
  alert(`Row ${row} - Pair ${col} submitted successfully!`);
  setVacantStatus();
}

function validateSubmission(row, col, teamValue, babyValue) {
  // Check if different from row below
  if (row > 1) {
    const belowTeam = getInput(row - 1, "top", "p", col)?.value;
    const belowBaby = getInput(row - 1, "bottom", "s", col)?.value;

    if (teamValue === belowTeam && babyValue === belowBaby) {
      alert("Current pair can't be same as pair below!");
      return false;
    }

    // Check if baby value is greater than row below
    const belowBabyNum = parseFloat(belowBaby);
    const babyNum = parseFloat(babyValue);

    if (!isNaN(belowBabyNum) && babyNum <= belowBabyNum) {
      alert(`Baby value must be greater than Row ${row - 1}`);
      return false;
    }
  }

  return true;
}

async function logSubmission(row, col, teamValue, babyValue) {
  try {
    await db
      .collection("submissionHistory")
      .doc(`station${stationId}`)
      .collection("entries")
      .add({
        team: teamValue,
        baby: babyValue,
        pair: `Row${row}-Pair${col}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    console.log(`Logged Row${row}-Pair${col} to history`);
  } catch (error) {
    console.error("Error logging submission:", error);
  }
}

async function updateStationSubmission(row, col, teamValue, babyValue) {
  const docRef = db.collection("stationSubmission").doc(`station${stationId}`);

  try {
    const docSnap = await docRef.get();
    
    // Build the row data
    const rowData = { team: [], baby: [] };
    for (let i = 1; i <= MAX_PAIRS; i++) {
      const t = getInput(row, "top", "p", i)?.value || "";
      const b = getInput(row, "bottom", "s", i)?.value || "";
      rowData.team.push(t);
      rowData.baby.push(b);
    }

    if (!docSnap.exists) {
      const allData = {};
      for (let r = 1; r <= MAX_ROWS; r++) {
        allData[`row${r}`] = r === row ? rowData : { team: ["", "", "", "", ""], baby: ["", "", "", "", ""] };
      }
      await docRef.set({
        ...allData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        [`row${row}`]: rowData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating submission:", error);
    alert("Error saving data.");
  }
}

async function removeBabyFromAssignment(teamId, babyValue) {
  try {
    const docRef = db.collection("assignments").doc(teamId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn(`Team ${teamId} not found.`);
      return;
    }

    const babies = docSnap.data().baby || [];
    const index = babies.indexOf(Number(babyValue));
    
    if (index > -1) {
      babies.splice(index, 1);
      await docRef.update({ baby: babies });
      console.log(`Removed baby ${babyValue} from team ${teamId}`);
    } else {
      console.warn(`Baby ${babyValue} not found in team ${teamId}`);
    }
  } catch (error) {
    console.error("Error removing baby from assignment:", error);
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function getInput(row, section, prefix, index) {
  return document.querySelector(`.r${row} .${section} .${prefix}${index}`);
}

document.addEventListener("DOMContentLoaded", () => {
  // fillTeamDropdowns();
  loadSubmissionData();
});