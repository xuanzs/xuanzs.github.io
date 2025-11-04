function opentab(event, tab) {
  document.querySelectorAll(".bar").forEach((bar) => {
    bar.classList.remove("active");
  });

  event.currentTarget.classList.add("active");

  const station = document.getElementById("station");
  const baby = document.getElementById("baby");
  const bucket = document.getElementById("bucket");


  if (tab === "station") {
    baby.style.visibility = "hidden";
    bucket.style.visibility = "hidden";

    station.style.visibility = "visible";

  } else if (tab === "baby") {
    station.style.visibility = "hidden";
    bucket.style.visibility = "hidden";
    
    baby.style.visibility = "visible";

  } else if (tab === "bucketList") {
    station.style.visibility = "hidden";
    baby.style.visibility = "hidden";

    bucket.style.visibility = "visible";
  }
}

// Shutdown Card

const shutDrop = document.getElementById("shutDrop");
const shutDropArray = [];

for (let i = 1; i <= 25; i++) {
  shutDropArray.push(String(i));
}

shutDropArray.forEach((item) => {
  const option = document.createElement("option");

  option.value = item;
  option.textContent = item;
  shutDrop.appendChild(option);
});

db.collection("skills")
  .doc("shutdown")
  .get()
  .then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const station = data.station;

      console.log("Shutdown station:", station);

      shutDrop.value = station;
      shutDrop.disabled = true;
    } else {
      console.log("No 'shutdown' doc found in Firestore");
    }
  })
  .catch((err) => {
    console.error("Error loading restore teams:", err);
  });

const shutBtn = document.getElementById("shutBtn");

shutBtn.addEventListener("click", () => {
  const selectedValue = shutDrop.value;

  if (selectedValue === "") {
    alert("Please select a station");
  } else {
    const confirmShutdown = confirm(
      `Confirm shutting down station ${selectedValue}?`
    );

    if (confirmShutdown) {
      db.collection("skills")
        .doc("shutdown")
        .set({
          station: selectedValue,
        })
        .then(() => {
          alert(`Shutting down station ${selectedValue}`);
          shutDrop.disabled = true;
        })
        .catch((err) => {
          console.error("Error writing to Firebase:", err);
          alert("Submission failed.");
        });
    } else {
      alert("Shutdown cancelled.");
    }
  }
});

// Restore Card

const restoreSelects = document.querySelectorAll(".resDrops select");
const restoreBtn = document.getElementById("resBtn");

restoreSelects.forEach((select) => {
  for (let i = 1; i <= 14; i++) {
    db.collection("assignments")
      .doc(`team${i}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        const name = data.name;

        const option = document.createElement("option");

        option.value = `team${i}`;
        option.textContent = name;
        select.appendChild(option);
      });
  }
});

db.collection("skills")
  .doc("restore")
  .get()
  .then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const teams = data.teams || [];

      console.log("Restored teams:", teams);

      teams.forEach((team, i) => {
        if (restoreSelects[i]) {
          restoreSelects[i].value = team;
          restoreSelects[i].disabled = true;
        }
      });
    } else {
      console.log("No 'restore' doc found in Firestore");
    }
  })
  .catch((err) => {
    console.error("Error loading restore teams:", err);
  });

restoreBtn.addEventListener("click", async () => {
  try {
    const selectedTeams = Array.from(restoreSelects)
      .map((select) => select.value)
      .filter((value) => value !== "");

    if (selectedTeams.length === 0) {
      alert("Please select at least one station to restore");
      return;
    }

    const docRef = db.collection("skills").doc("restore");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      await docRef.set({
        teams: selectedTeams,
      });
      alert(`Added new restore list: ${selectedTeams.join(", ")}`);
      restoreSelects.forEach((select) => {
        if (select.value !== "") {
          select.disabled = true;
        }
      });
      return;
    }

    const existingTeams = docSnap.data().teams || [];

    const newTeams = selectedTeams.filter(
      (team) => !existingTeams.includes(team)
    );

    if (newTeams.length === 0) {
      alert("Selected teams already exist in restore list");
      return;
    }

    await docRef.set(
      {
        teams: firebase.firestore.FieldValue.arrayUnion(...newTeams),
      },
      { merge: true }
    );

    alert(`Added new temas: ${newTeams.join(", ")}`);

    restoreSelects.forEach((select) => {
      if (select.value !== "") {
        select.disabled = true;
      }
    });
  } catch (err) {
    console.error("Error updating restore list:", err);
    alert("An error ocurred while restoring teams.");
  }
});

// Swap Card

const swapDrops = document.querySelectorAll(".swapDrops select");
const swapDropArray = Array.from({ length: 25 }, (_, i) => String(i + 1));

try {
  swapDrops.forEach((drop) => {
    swapDropArray.forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      drop.appendChild(option);
    });
  });
} catch (err) {
  console.error(err);
}

const swapBtn = document.getElementById("swapBtn");

const swapDrop1 = document.querySelectorAll(".line-1 select");
const swapDrop2 = document.querySelectorAll(".line-2 select");

db.collection("skills")
  .doc("swap")
  .onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const swap1 = Array.isArray(data.swap1) ? data.swap1 : [];
      const swap2 = Array.isArray(data.swap2) ? data.swap2 : [];

      swapDrop1.forEach((drop, i) => {
        if (swap1[i]) {
          drop.value = swap1[i];
          drop.disabled = true;
        }
      });

      swapDrop2.forEach((drop, i) => {
        if (swap2[i]) {
          drop.value = swap2[i];
          drop.disabled = true;
        }
      });
    }
  });

swapBtn.addEventListener("click", async () => {
  try {
    const selectedStation1 = Array.from(swapDrop1)
      .map((select) => select.value)
      .filter((value) => value !== "");

    const selectedStation2 = Array.from(swapDrop2)
      .map((select) => select.value)
      .filter((value) => value !== "");

    if (selectedStation1.length === 0 && selectedStation2.length === 0) {
      alert("Please select at least one station to swap");
      return;
    }

    if (selectedStation1[0] === selectedStation1[1]) {
      alert("The two stations cannot be the same");
      return;
    }

    if (
      selectedStation2.length === 2 &&
      selectedStation2[0] === selectedStation2[1]
    ) {
      alert("The two stations cannot be the same");
      return;
    }

    const docRef = db.collection("skills").doc("swap");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      if (selectedStation1.length === 0) {
        alert("Please fill Line 1 first before starting swap");
        return;
      }

      await docRef.set({ swap1: selectedStation1, status1: "unswapped" });
      alert("Added first line for station swap");
      swapping();
      swapDrop1.forEach((select) => {
        select.disabled = true;
      });
      return;
    }

    const data = docSnap.data();

    if (data.swap1 && !data.swap2) {
      if (selectedStation1.length === 0) {
        alert("Please fill Line 1 first before starting swap");
        return;
      }

      await docRef.set(
        { swap2: selectedStation2, status2: "unswapped" },
        { merge: true }
      );
      alert("Added second line for station swap");
      swapping();
      swapDrop2.forEach((select) => {
        select.disabled = true;
      });
      return;
    }

    if (data.swap1 && data.swap2) {
      alert("Both swap lines already exists");
      return;
    }
  } catch (err) {
    console.error("Error handling swap:", err);
    alert("An error occurred while saving the swap data.");
  }
});

async function swapping() {
  const swapDoc = await db.collection("skills").doc("swap").get();
  if (!swapDoc.exists) return;

  const swapData = swapDoc.data();

  // Swap 1
  if (swapData.status1 === "unswapped" && Array.isArray(swapData.swap1)) {
    const [a, b] = swapData.swap1;
    await performSwap(a, b, "status1");
  }

  // Swap 2
  if (swapData.status2 === "unswapped" && Array.isArray(swapData.swap2)) {
    const [a, b] = swapData.swap2;
    await performSwap(a, b, "status2");
  }
}

async function performSwap(a, b, statusKey) {
  console.log(`Starting swap: ${a} <-> ${b}`);

  for (let i = 1; i <= 14; i++) {
    const teamId = "team" + i;
    const teamDocRef = db.collection("assignments").doc(teamId);
    const teamDoc = await teamDocRef.get();

    if (!teamDoc.exists) continue;

    let updated = false;
    let assignments = teamDoc.data().assignments || [];

    assignments = assignments.map((item) => {
      if (item.value === a) {
        updated = true;
        return { ...item, value: b };
      }
      if (item.value === b) {
        updated = true;
        return { ...item, value: a };
      }
      return item;
    });

    if (updated) {
      await teamDocRef.update({ assignments });
      console.log(`Swapped ${a} <-> ${b} for ${teamId}`);
    }

    if (i === 14) {
      await db
        .collection("skills")
        .doc("swap")
        .update({ [statusKey]: "swapped" });
      console.log(`${statusKey} marked as swapped`);
    }
  }
}

// Freeze

const pauseBtn = document.getElementById("pauseBtn");
const docRef = db.collection("skills").doc("pause");

docRef.set({
  status: "Unfreeze",
});

pauseBtn.addEventListener("click", () => {
  docRef.get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const status = data.status;

      if (status === "Unfreeze") {
        docRef.set({
          status: "Freeze",
        });

        pauseBtn.textContent = "Freezed";
        pauseBtn.style.background = "green";
      } else {
        docRef.set({
          status: "Unfreeze",
        });

        pauseBtn.textContent = "Unfreezed";
        pauseBtn.style.background = "red";
      }
    }
  });
});

// Baby

const stationDrop = document.getElementById("stationDrop");

const stationDropArray = [];

for (let i = 1; i <= 25; i++) {
  stationDropArray.push(String(i));
}

stationDropArray.forEach((item) => {
  const option = document.createElement("option");

  option.value = item;
  option.textContent = item;
  stationDrop.appendChild(option);
});

let station = 0;

stationDrop.addEventListener("change", () => {
  station = stationDrop.value;
  console.log("Current station", station);

  fillTeamDrop();
  fillPreFilledValues();
});

function ensureOptionExistsAndSelect(select, value) {
  if (!value) return;

  const hasOption = [...select.options].some((opt) => opt.value === value);

  if (!hasOption) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);

    if (/^team\d+$/.test(value)) {
      db.collection("assignments")
        .doc(value)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            const name = data.name;

            opt.textContent = name;
          }
        });
    }
  }

  select.value = value;
}

function fillTeamDrop() {
  const teamSelects = document.querySelectorAll(".row .top select");

  db.collection("assignments")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const teamName = data.name;

        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = teamName;

        teamSelects.forEach((select) => {
          select.appendChild(option.cloneNode(true));
        });
      });

      teamSelects.forEach((select) => {
        select.addEventListener("change", () => {
          fillBabyDrop(select);
        });
      });
    })
    .catch((error) => {
      console.error("Error loading teams:", error);
    });
}

function fillBabyDrop(teamSelectElement) {
  const selectedTeamId = teamSelectElement.value;

  if (!selectedTeamId) return;

  const parentRow = teamSelectElement.closest(".row");
  // const pairClass = teamSelectElement.className;
  const rowNumber = Array.from(parentRow.classList).find((cls) =>
    cls.startsWith("r")
  );

  const rowNumberParsed = parseInt(rowNumber.replace("r", ""), 10);

  if (isNaN(rowNumberParsed) || rowNumberParsed > 3) return;

  const pairClass = teamSelectElement.className;

  const babySelectElement = parentRow.querySelector(
    `.bottom .s${pairClass.substring(1)}`
  );

  babySelectElement.innerHTML = '<option value=""></option>';

  db.collection("assignments")
    .doc(selectedTeamId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const babies = data.baby || [];

        babies.forEach((baby) => {
          const option = document.createElement("option");
          option.value = baby;
          option.textContent = baby;
          babySelectElement.appendChild(option);
        });
      } else {
        console.error("Team not found in Firestore.");
      }
    })
    .catch((error) => {
      console.error("Error loading baby options:", error);
    });
}

function fillPreFilledValues() {
  db.collection("stationSubmission")
    .doc(`station${station}`)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        console.log(data);
        let see = [];
        count = 0;
        let inside = [];

        for (let row = 1; row <= 4; row++) {
          const rowData = data[`row${row}`];
          if (!rowData) continue;
          console.log(rowData.team);

          for (let i = 0; i <= 4; i++) {
            if (rowData.team[i] !== "") {
              see.push(rowData.team[i]);

              const p = getInput(row, "top", "p", i + 1);
              const s = getInput(row, "bottom", "s", i + 1);
              const teamValue = rowData.team[i];
              const babyValue = rowData.baby[i];

              inside.push(teamValue, babyValue);

              ensureOptionExistsAndSelect(p, teamValue);
              ensureOptionExistsAndSelect(s, babyValue);

              count++;
            }
          }
        }
        console.log(see);
        console.log(count);
        console.log(inside);
      } else {
        window.location.reload();
      }
    });
}

function getInput(row, section, prefix, index) {
  return document.querySelector(`.r${row} .${section} .${prefix}${index}`);
}

function isInputEmpty(input) {
  return !input || input.value.trim() === "";
}

function isSameAsPreviousRow(row, index) {
  const currentP = getInput(row, "top", "p", index);
  const currentS = getInput(row, "bottom", "s", index);
  const prevP = getInput(row - 1, "top", "p", index);
  const prevS = getInput(row - 1, "bottom", "s", index);

  return (
    prevP &&
    prevS &&
    currentP.value === prevP.value &&
    currentS.value === prevS.value
  );
}

function isSmallerAsPreviousRow(row, index) {
  const currentP = getInput(row, "top", "p", index);
  const currentS = getInput(row, "bottom", "s", index);
  const prevP = getInput(row - 1, "top", "p", index);
  const prevS = getInput(row - 1, "bottom", "s", index);

  return (
    prevP &&
    prevS &&
    currentP.value < prevP.value &&
    currentS.value < prevS.value
  );
}

function validatePair(p, s, row, pairIndex) {
  if (isInputEmpty(p) || isInputEmpty(s)) {
    alert(`Please fill in Row ${row} - Pair ${pairIndex}`);
    return false;
  }
  return true;
}

function disableInputs(...inputs) {
  inputs.forEach((input) => {
    if (input) input.disabled = true;
  });
}

function enableInputs(...inputs) {
  inputs.forEach((input) => {
    if (input) input.disabled = false;
  });
}

function handleNextPairOfRow(row, pair) {
  const nextP = getInput(row, "top", "p", pair + 1);
  const nextS = getInput(row, "bottom", "s", pair + 1);

  // If next pair exists in current row
  if (nextP && nextS) {
    if (row > 1) {
      let enabledNext = false;

      // Look ahead up to 4 pairs in the row above
      for (let k = 1; k <= 4; k++) {
        const aboveP = getInput(row - 1, "top", "p", pair + k);
        const aboveS = getInput(row - 1, "bottom", "s", pair + k);
        const currNextP = getInput(row, "top", "p", pair + k);
        const currNextS = getInput(row, "bottom", "s", pair + k);

        if (aboveP && currNextP && currNextS && Number(aboveS.value) < 3) {
          enableInputs(currNextP, currNextS);
          enabledNext = true;
          break;
        }
      }

      if (!enabledNext) {
        alert(`Row ${row} complete`);
        enableNextRowIfNeeded(row);
      }
    } else {
      enableInputs(nextP, nextS);
    }

    alert(`Pair ${pair} filled!`);
  } else {
    alert(`Row ${row} complete!`);
    enableNextRowIfNeeded(row);
  }
}

function enableNextRowIfNeeded(currentRow) {
  for (let nextRow = currentRow + 1; nextRow <= 3; nextRow++) {
    for (let h = 1; h <= MAX_PAIRS; h++) {
      const currentS = getInput(nextRow - 1, "bottom", "s", h);
      const nextP = getInput(nextRow, "top", "p", h);
      const nextS = getInput(nextRow, "bottom", "s", h);

      if (currentS && nextP && nextS && Number(currentS.value) === 2) {
        enableInputs(nextP, nextS);
      }
    }
    return;
  }
}

async function submitBtn() {
  const MAX_ROWS = 4;
  const MAX_PAIRS = 5;
  const allData = {};
  let submitted = false;

  let submittedRow = null;

  const row = 4;
  const team = [];
  const baby = [];

  // ✅ Step 1: Load existing submission data to prevent overwriting
  let existingData = {};
  try {
    const docSnap = await db
      .collection("stationSubmission")
      .doc(`station${station}`)
      .get();
    if (docSnap.exists) {
      existingData = docSnap.data();
    }
  } catch (error) {
    console.error("Error fetching existing data:", error);
  }

  for (let pair = 1; pair <= MAX_PAIRS; pair++) {
    const p = getInput(row, "top", "p", pair);
    const s = getInput(row, "bottom", "s", pair);

    const pValue = p?.value?.trim();
    const sValue = s?.value?.trim();

    team.push(pValue || "");
    baby.push(sValue || "");

    if (!p.disabled && !s.disabled && sValue !== "") {
      // 1. Validate empty inputs
      if (!pValue || !sValue) {
        alert(`Please fill in Row ${row} - Pair ${pair}`);
        return;
      }

      // 2. Prevent identical to row below
      if (row > 1) {
        const belowP = getInput(row - 1, "top", "p", pair);
        const belowS = getInput(row - 1, "bottom", "s", pair);

        const belowPValue = belowP?.value?.trim();
        const belowSValue = belowS?.value?.trim();

        if (pValue === belowPValue && sValue === belowSValue) {
          alert("Current pair can't be same as pair below!");
          return;
        }
      }

      // 3. Enforce baby value > baby below
      if (row > 1) {
        const belowS = getInput(row - 1, "bottom", "s", pair);
        const belowBaby = parseFloat(belowS?.value);

        if (!isNaN(belowBaby) && parseFloat(sValue) <= belowBaby) {
          alert(
            `In Row ${row} - Pair ${pair}: Baby must be greater than Row ${
              row - 1
            }`
          );
          return;
        }
      }

      // 4. Disable submitted pair
      disableInputs(p, s);

      if (row === 1 && parseInt(sValue) < 3) {
        const aboveP = getInput(row + 1, "top", "p", pair);
        const aboveS = getInput(row + 1, "bottom", "s", pair);

        if (aboveP && aboveS && aboveP.disabled && aboveS.disabled) {
          aboveP.disabled = false;
          aboveS.disabled = false;
          console.log(
            `Enabled Row ${
              row + 1
            } - Pair ${pair} because baby was < 3 in Row ${row}`
          );
        }
      }

      // 5. Save to history
      const submissionEntry = {
        team: pValue,
        baby: sValue,
        pair: `Row${row}-Pair${pair}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await db
          .collection("submissionHistory")
          .doc(`station${station}`)
          .collection("entries")
          .add(submissionEntry);

        console.log(`Logged Row${row}-Pair${pair} to history`);

        await removeBabyFromAssignment(pValue, sValue);
        console.log(`Removed baby ${sValue} from team ${pValue}`);
      } catch (error) {
        console.error("Error logging submission", error);
      }

      // 6. Determine if next pair in same row should be enabled
      let enabledNext = false;
      if (row > 1) {
        for (let k = pair + 1; k <= MAX_PAIRS; k++) {
          const prevRowS = getInput(row - 1, "bottom", "s", k);
          const prevBaby = parseFloat(prevRowS?.value);
          const nextP = getInput(row, "top", "p", k);
          const nextS = getInput(row, "bottom", "s", k);

          if (!isNaN(prevBaby) && prevBaby < 3 && nextP && nextS) {
            nextP.disabled = false;
            nextS.disabled = false;
            enabledNext = true;
            break;
          }
        }
      } else {
        // For row 1: just enable next pair
        const nextP = getInput(row, "top", "p", pair + 1);
        const nextS = getInput(row, "bottom", "s", pair + 1);
        if (nextP && nextS) {
          nextP.disabled = false;
          nextS.disabled = false;
          enabledNext = true;
        }
      }

      // 7. Enable next row pairs if needed (when current row completes)
      if (!enabledNext) {
        // alert(`Row ${row} complete!`);

        if (row < MAX_ROWS) {
          for (let h = 1; h <= MAX_PAIRS; h++) {
            const currentS = getInput(row, "bottom", "s", h);
            const nextRowP = getInput(row + 1, "top", "p", h);
            const nextRowS = getInput(row + 1, "bottom", "s", h);

            if (parseInt(currentS?.value) <= 2 && currentS.value === "") {
              if (nextRowP && nextRowS) {
                nextRowP.disabled = false;
                nextRowS.disabled = false;

                if (h === pair && parseInt(currentS?.value) === 2) {
                  console.log(
                    `Enabled Row ${row + 1} - Pair ${pair} because baby was 2`
                  );
                }
              }
            }
          }
        }
      }

      // 🔁 Always check for Row 3 enablement if baby is 2 in Row 2
      if (row === 2 && parseInt(sValue) <= 2 && row + 1 <= MAX_ROWS) {
        const row3P = getInput(3, "top", "p", pair);
        const row3S = getInput(3, "bottom", "s", pair);

        if (row3P && row3S) {
          row3P.disabled = false;
          row3S.disabled = false;
          console.log(
            `Enabled Row 3 - Pair ${pair} because baby was 2 in Row 2`
          );
        }
      }

      // 8. Alert successful pair
      alert(`Row ${row} - Pair ${pair} filled!`);
      submitted = true;
      break; // Only submit one pair per click
    }
  }

  allData[`row${row}`] = { team, baby };

  if (submitted) {
    submittedRow = row;
    allData[`row${row}`] = { team, baby };
  }

  if (!submitted) {
    alert("No active pair found to submit.");
    return;
  }

  // 9. Save latest full submission
  const docRef = db.collection("stationSubmission").doc(`station${station}`);

  try {
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      await docRef.set({
        ...allData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("Document created with set()");
    } else {
      await docRef.update({
        [`row${submittedRow}`]: allData[`row${submittedRow}`],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("Document updated");
    }
  } catch (error) {
    console.error("Error writing document:", error);
    alert("Error saving data.");
  }
}

async function removeBabyFromAssignment(teamId, babyValue) {
  try {
    const docRef = db.collection("assignments").doc(teamId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const babies = data.baby || [];

      const index = babies.indexOf(Number(babyValue));
      if (index > -1) {
        babies.splice(index, 1);
      } else {
        console.warn(`Baby ${babyValue} not found in team ${teamId}`);
        return;
      }

      await docRef.update({ baby: babies });
      console.log(
        `Removed one occurence of baby ${babyValue} from team ${teamId}`
      );
    } else {
      console.warn(`Team ${teamId} not found.`);
    }
  } catch (error) {
    console.error("Error removing baby from assignment", error);
  }
}
