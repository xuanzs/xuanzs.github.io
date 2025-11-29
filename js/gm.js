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
// GLOBAL LISTENER HANDLES (IMPORTANT: prevent duplicate onSnapshot)
// ===========================
let unsubFreeze = null;
let unsubShutdown = null;
let unsubSubmission = null;
let unsubGM = null;

let lastFreezeStatus = null;
let lastShutdownStation = null;

// ✅ MUST be before fillTeamDropdowns() gets called
let teamsLoaded = false;
let cachedTeamOptions = null;

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
  setupFreezeListener();           // skills/pause
  setupShutdownListener();         // skills/shutdown
  fillTeamDropdowns();             // assignments -> team dropdown options
  setupSubmissionListener();       // stationSubmission/stationX
  setupGMStatusListener();         // authentication/gamemaster
  getStatusOnceForInitialUI();     // optional: set background once quickly
  // default: start locked until status says occupied
  disableAllRows();

  // cleanup listeners if leaving page
  window.addEventListener("beforeunload", cleanupListeners);
}

function cleanupListeners() {
  if (unsubFreeze) unsubFreeze();
  if (unsubShutdown) unsubShutdown();
  if (unsubSubmission) unsubSubmission();
  if (unsubGM) unsubGM();
  unsubFreeze = unsubShutdown = unsubSubmission = unsubGM = null;
}

// ===========================
// AUDIO
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

// ===========================
// FREEZE FUNCTIONALITY (skills/pause)
// ===========================
function setupFreezeListener() {
  if (unsubFreeze) unsubFreeze();

  unsubFreeze = db
    .collection("skills")
    .doc("pause")
    .onSnapshot((doc) => {
      if (!doc.exists) return;

      const status = doc.data()?.status;
      if (!status) return;

      // prevent repeated alerts when snapshot fires but status unchanged
      if (status === lastFreezeStatus) return;
      lastFreezeStatus = status;

      if (status === "Freeze") {
        alert("You are FREEZED");
        element.style.backgroundColor = "blue";
        playSound("/sound/airHorn.mp3").catch((err) =>
          console.error("Error playing sound:", err)
        );
      } else {
        // any non-Freeze treated as Unfreeze
        if (element.style.backgroundColor === "blue") {
          alert("You are UNfreezed");
        }
        // don't force green here if occupied should be red; GM listener controls main color
      }
    });
}

// ===========================
// SHUTDOWN FUNCTIONALITY (skills/shutdown)  ✅ fixed doc
// ===========================
function setupShutdownListener() {
  if (unsubShutdown) unsubShutdown();

  unsubShutdown = db
    .collection("skills")
    .doc("shutdown")
    .onSnapshot((doc) => {
      if (!doc.exists) return;

      const shutStation = doc.data()?.station;
      if (!shutStation) return;

      // prevent repeated alerts
      if (shutStation === lastShutdownStation) return;
      lastShutdownStation = shutStation;

      if (String(stationId) === String(shutStation)) {
        alert("Your station is SHUTDOWN");
        playSound("/sound/alarm2.mp3").catch((err) =>
          console.error("Error playing sound:", err)
        );
      }
    });
}

// ===========================
// STATUS MANAGEMENT (authentication/gamemaster)
// IMPORTANT FIXES:
// 1) Only ONE gm onSnapshot listener for the whole page (no duplicates)
// 2) Update only the specific field path (no overwriting accounts map)
// ===========================
function setupGMStatusListener() {
  if (unsubGM) unsubGM();

  unsubGM = gmDocRef.onSnapshot((doc) => {
    const status = doc.data()?.accounts?.[`gm${stationId}`]?.status;

    // If freeze set blue, keep blue, but still manage dropdowns
    if (status === "occupied") {
      // only set red if not freezed
      if (element.style.backgroundColor !== "blue") {
        element.style.backgroundColor = "red";
      }
      updateDropdownStates();
    } else if (status === "vacant") {
      if (element.style.backgroundColor !== "blue") {
        element.style.backgroundColor = "green";
      }
      disableAllRows();
    } else {
      // unknown => safest lock
      disableAllRows();
    }
  });
}

function getStatusOnceForInitialUI() {
  gmDocRef
    .get()
    .then((doc) => {
      const status = doc.data()?.accounts?.[`gm${stationId}`]?.status;
      if (status === "occupied") {
        if (element.style.backgroundColor !== "blue") {
          element.style.backgroundColor = "red";
        }
      } else if (status === "vacant") {
        if (element.style.backgroundColor !== "blue") {
          element.style.backgroundColor = "green";
        }
      }
    })
    .catch((e) => console.error("getStatusOnceForInitialUI error:", e));
}

function setVacantStatus() {
  if (element.style.backgroundColor !== "blue") {
    element.style.backgroundColor = "green";
  }
  return updateStationStatus("vacant");
}

function setOccupiedStatus() {
  if (element.style.backgroundColor !== "blue") {
    element.style.backgroundColor = "red";
  }
  return updateStationStatus("occupied");
}

function updateStationStatus(status) {
  // ✅ only update one field, do not overwrite accounts map
  return gmDocRef
    .update({
      [`accounts.gm${stationId}.status`]: status,
    })
    .catch(() => {
      // if doc doesn't exist yet, create it once
      return gmDocRef.set(
        {
          accounts: {
            [`gm${stationId}`]: { status },
          },
        },
        { merge: true }
      );
    });
}

// ===========================
// DROPDOWN POPULATION
// ===========================


function fillTeamDropdowns() {
  const teamSelects = document.querySelectorAll(".row .top select");

  // bind change listener once per select
  teamSelects.forEach((s) => {
    if (s.dataset.bound === "1") return;
    s.dataset.bound = "1";
    s.addEventListener("change", () => fillBabyDropdown(s)); // ✅ correct function name
  });

  // load once
  if (teamsLoaded && cachedTeamOptions) {
    applyTeamOptions(teamSelects, cachedTeamOptions);
    return;
  }

  db.collection("assignments")
    .get()
    .then((qs) => {
      const opts = [];
      qs.forEach((doc) => opts.push({ id: doc.id, name: doc.data().name }));

      teamsLoaded = true;
      cachedTeamOptions = opts;

      applyTeamOptions(teamSelects, opts);
    })
    .catch((err) => console.error("Error loading teams:", err));
}

function applyTeamOptions(teamSelects, opts) {
  teamSelects.forEach((select) => {
    // Keep first empty option if exists, otherwise add one
    if (select.options.length === 0 || select.options[0].value !== "") {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "";
      select.insertBefore(empty, select.firstChild);
    }

    // Prevent duplicate options
    const existing = new Set([...select.options].map((o) => o.value));
    opts.forEach(({ id, name }) => {
      if (existing.has(id)) return;
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
  });
}

function fillBabyDropdown(teamSelect) {
  const teamId = teamSelect.value;
  if (!teamId) return;

  const parentRow = teamSelect.closest(".row");
  const pairClass = teamSelect.className; // like "p1"
  const babySelect = parentRow.querySelector(
    `.bottom .s${pairClass.substring(1)}`
  );

  if (!babySelect) return;

  babySelect.innerHTML = '<option value=""></option>';

  db.collection("assignments")
    .doc(teamId)
    .get()
    .then((doc) => {
      if (!doc.exists) return;

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
// DATA LOADING (stationSubmission/stationX)
// IMPORTANT FIX: only ONE listener, no nested gm listener
// ===========================
function setupSubmissionListener() {
  if (unsubSubmission) unsubSubmission();

  unsubSubmission = db
    .collection("stationSubmission")
    .doc(`station${stationId}`)
    .onSnapshot((doc) => {
      if (!doc.exists) return;

      const data = doc.data();

      for (let row = 1; row <= MAX_ROWS; row++) {
        const rowData = data[`row${row}`];
        if (!rowData) continue;

        for (let i = 0; i < MAX_PAIRS; i++) {
          if (rowData.team?.[i]) {
            const teamSelect = getInput(row, "top", "p", i + 1);
            const babySelect = getInput(row, "bottom", "s", i + 1);

            ensureOptionExistsAndSelect(teamSelect, rowData.team[i]);
            ensureOptionExistsAndSelect(babySelect, rowData.baby?.[i]);
          }
        }
      }
      // dropdown enabling is handled by GM listener based on occupied/vacant
    });
}

function ensureOptionExistsAndSelect(select, value) {
  if (!select || value === undefined || value === null || value === "") return;

  const hasOption = [...select.options].some((opt) => opt.value === String(value));
  if (!hasOption) {
    const opt = document.createElement("option");
    opt.value = String(value);
    opt.textContent = String(value);
    select.appendChild(opt);

    if (/^team\d+$/.test(String(value))) {
      db.collection("assignments")
        .doc(String(value))
        .get()
        .then((doc) => {
          if (doc.exists) opt.textContent = doc.data().name;
        });
    }
  }

  select.value = String(value);
}

// ===========================
// DROPDOWN STATE MANAGEMENT
// ===========================
function updateDropdownStates() {
  disableAllRows();

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
  // If row4 baby == 4 => column fully closed
  const row4Baby = getInput(4, "bottom", "s", col);
  if (row4Baby && parseInt(row4Baby.value) === 4) return;

  for (let row = 1; row <= 3; row++) {
    const teamSelect = getInput(row, "top", "p", col);
    const babySelect = getInput(row, "bottom", "s", col);
    if (!teamSelect || !babySelect) continue;

    const teamValue = teamSelect.value;
    const babyValue = babySelect.value;

    if (teamValue && babyValue) {
      const babyNum = parseInt(babyValue);

      if (row === 1) {
        if (babyNum !== 3) {
          const row2Team = getInput(2, "top", "p", col);
          const row2Baby = getInput(2, "bottom", "s", col);
          if (row2Team && row2Baby && !row2Team.value) {
            row2Team.disabled = false;
            row2Baby.disabled = false;
          }
        }
        // open right side always when row1 filled
        const nextTeam = getInput(1, "top", "p", col + 1);
        const nextBaby = getInput(1, "bottom", "s", col + 1);
        if (nextTeam && nextBaby && !nextTeam.value) {
          nextTeam.disabled = false;
          nextBaby.disabled = false;
        }
      } else if (row === 2) {
        if (babyNum === 2) {
          const row3Team = getInput(3, "top", "p", col);
          const row3Baby = getInput(3, "bottom", "s", col);
          if (row3Team && row3Baby && !row3Team.value) {
            row3Team.disabled = false;
            row3Baby.disabled = false;
          }
        }
      }
      // row3 does not open row4 automatically
    } else {
      if (row === 1) {
        teamSelect.disabled = false;
        babySelect.disabled = false;
      } else if (row === 2) {
        const row1Baby = getInput(1, "bottom", "s", col);
        if (row1Baby?.value && parseInt(row1Baby.value) !== 3) {
          teamSelect.disabled = false;
          babySelect.disabled = false;
        }
      } else if (row === 3) {
        const row2Baby = getInput(2, "bottom", "s", col);
        if (row2Baby?.value && parseInt(row2Baby.value) === 2) {
          teamSelect.disabled = false;
          babySelect.disabled = false;
        }
      }
      break; // stop after first empty in this column
    }
  }
}

// ===========================
// SUBMISSION LOGIC
// ===========================
async function submitBtn() {
  let submittedPair = null;

  for (let row = 1; row <= MAX_ROWS && !submittedPair; row++) {
    for (let col = 1; col <= MAX_PAIRS && !submittedPair; col++) {
      const teamSelect = getInput(row, "top", "p", col);
      const babySelect = getInput(row, "bottom", "s", col);

      const teamValue = teamSelect?.value?.trim();
      const babyValue = babySelect?.value?.trim();

      if (
        teamSelect &&
        babySelect &&
        !teamSelect.disabled &&
        !babySelect.disabled &&
        teamValue &&
        babyValue
      ) {
        submittedPair = { row, col, teamValue, babyValue, teamSelect, babySelect };
      }
    }
  }

  if (!submittedPair) {
    alert("No active pair found to submit.");
    return;
  }

  const { row, col, teamValue, babyValue, teamSelect, babySelect } = submittedPair;

  if (!validateSubmission(row, col, teamValue, babyValue)) return;

  teamSelect.disabled = true;
  babySelect.disabled = true;

  await logSubmission(row, col, teamValue, babyValue);
  await removeBabyFromAssignment(teamValue, babyValue);
  await updateStationSubmission(row);

  alert(`Row ${row} - Pair ${col} submitted successfully!`);
  await setVacantStatus();
}

function validateSubmission(row, col, teamValue, babyValue) {
  if (row > 1) {
    const belowTeam = getInput(row - 1, "top", "p", col)?.value;
    const belowBaby = getInput(row - 1, "bottom", "s", col)?.value;

    if (teamValue === belowTeam && babyValue === belowBaby) {
      alert("Current pair can't be same as pair below!");
      return false;
    }

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
  } catch (error) {
    console.error("Error logging submission:", error);
  }
}

async function updateStationSubmission(row) {
  const docRef = db.collection("stationSubmission").doc(`station${stationId}`);

  try {
    const docSnap = await docRef.get();

    const rowData = { team: [], baby: [] };
    for (let i = 1; i <= MAX_PAIRS; i++) {
      rowData.team.push(getInput(row, "top", "p", i)?.value || "");
      rowData.baby.push(getInput(row, "bottom", "s", i)?.value || "");
    }

    if (!docSnap.exists) {
      const allData = {};
      for (let r = 1; r <= MAX_ROWS; r++) {
        allData[`row${r}`] =
          r === row
            ? rowData
            : { team: ["", "", "", "", ""], baby: ["", "", "", "", ""] };
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

    if (!docSnap.exists) return;

    const babies = docSnap.data().baby || [];
    const index = babies.indexOf(Number(babyValue));

    if (index > -1) {
      babies.splice(index, 1);
      await docRef.update({ baby: babies });
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
