function opentab(event, tab) {
  document.querySelectorAll(".bar").forEach((bar) => {
    bar.classList.remove("active");
  });

  event.currentTarget.classList.add("active");

  if (tab === "station") {
    document.getElementById("station").style.visibility = "visible";

    document.getElementById("baby").style.visibility = "hidden";
  } else if (tab === "baby") {
    document.getElementById("station").style.visibility = "hidden";

    document.getElementById("baby").style.visibility = "visible";
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

const restoreSelects = document.querySelectorAll('.resDrops select');
const restoreBtn = document.getElementById('resBtn');

const resArray = [];

restoreSelects.forEach(select => {
  for (let i = 1; i <= 14; i++) {
    db.collection("assignments").doc(`team${i}`).get()
    .then((doc) => {
        const data = doc.data();
        const name = data.name;

        const option = document.createElement('option');

        option.value = `team${i}`;
        option.textContent = name;
        select.appendChild(option);
      });
  }
})

restoreBtn.addEventListener('click', () => {
  restoreSelects.forEach(select => {
    if (select.value !== "") {
      db.collection('skills').doc('restore').set({})
      alert(select.value);
    } else return;
  })
})


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
