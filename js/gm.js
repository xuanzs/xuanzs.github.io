const urlParams = new URLSearchParams(window.location.search);
const station = urlParams.get("id");

const dropdown = document.querySelector("select");

const stationName = document.querySelector(".left h1");

const element = document.querySelector(".container");

if (station) {
  stationName.textContent = "Station " + station;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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
          // overlay_2.style.visibility = "visible";

          alert("You are FREEZED");
          element.style.backgroundColor = "blue";

          console.log("Status is Freeze, playing sound...");
          loadAndPlaySound("/sound/airHorn.mp3")
            .then(() => {
              console.log("Sound played successfully");
            })
            .catch((err) => {
              console.error("Error playing sound:", err);
              //   overlay_2.style.visibility = "visible";
            });
        } else {
          if (element.style.backgroundColor === "blue") {
            alert("You are UNfreezed");
            element.style.backgroundColor = "green";
          }
        }
      }
    });
} else {
  alert("No GM selected!");
  location.href = "index.html";
}

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

// const element = document.querySelector(".container");

const gmDocRef = db.collection("authentication").doc("gamemaster");

function vacant() {
  element.style.backgroundColor = "green";
  gmDocRef.set({
    accounts: {
      [`gm${station}`]: {
        status: "vacant",
      }
    }
  }, {merge: true});
  disabledSelects();

}

vacant();

function occupied() {
  element.style.backgroundColor = "red";
  // alarm.play();
  gmDocRef.set({
    accounts: {
      [`gm${station}`]: {
        status: "occupied",
      }
    }
  }, {merge: true});
  disabledSelects();
}

function fillTeamDrop() {
  const teamSelects = document.querySelectorAll(".top select");

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

function disabledSelects() {
  const r4Selects = document.querySelectorAll(".r4 select");
  const r3Selects = document.querySelectorAll(".r3 select");
  const r2Selects = document.querySelectorAll(".r2 select");
  const r1Selects = document.querySelectorAll(".r1 select");
  const r1P1 = document.querySelector(".r1 .top .p1");
  const r1S1 = document.querySelector(".r1 .bottom .s1");

  r4Selects.forEach((select) => {
    select.disabled = true;
  });
  r3Selects.forEach((select) => {
    select.disabled = true;
  });
  r2Selects.forEach((select) => {
    select.disabled = true;
  });
  r1Selects.forEach((select) => {
    select.disabled = true;
  });

  gmDocRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const gmData = data.accounts[`gm${station}`];
      const status = gmData.status;

      if (status === "occupied") {
        // Row 3
        for (let i = 1; i <= 5; i++) {
          let p = getInput(3, "top", "p", i);
          let s = getInput(3, "bottom", "s", i);
          let bottomP = getInput(2, "top", "p", i);
          let bottomS = getInput(2, "bottom", "s", i);
      
          if (p.value === "" && bottomS.value < 3 && bottomS.value !== "") {
            p.disabled = false;
            s.disabled = false;
          }
        }
      
        // Row 2
        for (let i = 1; i <= 5; i++) {
          let p = getInput(2, "top", "p", i);
          let s = getInput(2, "bottom", "s", i);
          let bottomP = getInput(1, "top", "p", i);
          let bottomS = getInput(1, "bottom", "s", i);
      
          if (p.value === "" && bottomS.value < 3 && bottomS.value !== "") {
            p.disabled = false;
            s.disabled = false;
          }
        }
      
        // Row 1
        for (let i = 1; i <= 5; i++) {
          let p = getInput(1, "top", "p", i);
          let s = getInput(1, "bottom", "s", i);
      
          if (p.value === "") {
            p.disabled = false;
            s.disabled = false;
          } else {
            p.disabled = true;
            s.disabled = true;
          }
        }
      
        const r4BottomSelects = document.querySelectorAll(".r4 .bottom select");
      
        r4BottomSelects.forEach((select, index) => {
          const babyValue = select.value;
      
          if (babyValue !== "") {
            const r1SelectT = getInput(1, "top", "p", index + 1);
            const r1SelectB = getInput(1, "bottom", "s", index + 1);
            const r2SelectT = getInput(2, "top", "p", index + 1);
            const r2SelectB = getInput(2, "bottom", "s", index + 1);
            const r3SelectT = getInput(3, "top", "p", index + 1);
            const r3SelectB = getInput(3, "bottom", "s", index + 1);
      
            disableInputs(
              r1SelectT,
              r1SelectB,
              r2SelectT,
              r2SelectB,
              r3SelectT,
              r3SelectB
            );
          }
        });
      }
    }
  })
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
        // disabledSelects();
      }
    });
}

// function loadSubmissionData() {
//     db.collection('stationSubmission').doc(`station${station}`).get()
//         .then((doc) => {
//             if (!doc.exists) {
//                 console.log("No submission data found for this station.");
//                 return;
//             }

//             console.log("Data load complete");
//         })
//         .catch((error) => {
//             console.error("Error loading submission data:", error);
//             alert("Failed to load data from database.");
//         });
// }

document.addEventListener("DOMContentLoaded", () => {
  fillTeamDrop();
  fillPreFilledValues();
  // setTimeout(() => {
  //   disabledSelects();
  // }, 1000);
});

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

  for (let row = 1; row <= MAX_ROWS; row++) {
    const team = [];
    const baby = [];

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
        // if (row > 1) {
        //     for (let k = pair + 1; k <= MAX_PAIRS; k++) {
        //         const prevRowS = getInput(row - 1, "bottom", "s", k);
        //         const prevBaby = parseFloat(prevRowS?.value);
        //         const nextP = getInput(row, "top", "p", k);
        //         const nextS = getInput(row, "bottom", "s", k);
        //         const topBaby = parseFloat(getInput(4, "bottom", "s", k)?.value);

        //         if (topBaby !== 4) {
        //             if (!isNaN(prevBaby) && prevBaby < 3 && nextP && nextS) {
        //                 nextP.disabled = false;
        //                 nextS.disabled = false;
        //                 enabledNext = true;
        //                 break;
        //             }
        //         }

        //     }
        // } else {
        //     // For row 1: just enable next pair
        //     const nextP = getInput(row, "top", "p", pair + 1);
        //     const nextS = getInput(row, "bottom", "s", pair + 1);
        //     if (nextP && nextS) {
        //         nextP.disabled = false;
        //         nextS.disabled = false;
        //         enabledNext = true;
        //     }
        // }

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

        vacant();
        break; // Only submit one pair per click
      }
    }

    allData[`row${row}`] = { team, baby };

    if (submitted) {
      submittedRow = row;
      allData[`row${row}`] = { team, baby };
      break; // only one row updates per submission
    }
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
