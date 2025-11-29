window.onload = function() {
  if(localStorage.getItem("runFunction") === "1") {
    localStorage.removeItem("runFunction");
    openNpcMainPage();
  }
}

const mainPage = document.getElementById("mainPage");
const npcMainPage = document.getElementById("npcMainPage");
const selfiePage = document.getElementById("selfiePage");
const smilePage = document.getElementById("smilePage");

// Main Page

const checkin = document.querySelector(".anabelle-checkin button");
const npcPic = document.querySelector(".npcPic button");
const smilePic = document.querySelector(".smilePic button");
const mission4 = document.querySelector(".mission4 button");
const searchPuzzle = document.querySelector(".searchPuzzle button");

const bucketDocRef = db.collection("bucketList");

function openNpcMainPage() {
  mainPage.classList.remove("active");
  npcMainPage.classList.add("active");
}

function openSmilePage() {
  mainPage.classList.remove("active");
  smilePage.classList.add("active");
}

bucketDocRef.doc("checkin").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const count = data.count;

    if (count !== 3) {
      checkin.textContent = `带 Anabelle 去打卡三层 (${count}/3)`;
    } else {
      checkin.innerHTML = `<span class="checkin-text">带 Anabelle 去打卡三层 (${count}/3)</span>
      <span class="tick">✓</span>`;
    }
    
  }
});

bucketDocRef.doc("overall").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const count = data.count;

    if (count !== 14) {
      npcPic.textContent = `每组至少和3位npc合照 (${count}/14)`;
    } else {
      npcPic.innerHTML = `<span class="overall-text">每组至少和3位npc合照 (${count}/14)</span>
      <span class="tick">✓</span>`;
    }
  }
});

bucketDocRef.doc("smiles").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const count = data.count;

    if (count !== 100) {
      smilePic.textContent = `集齐100个笑容 (${count}/100)`;
    } else {
      smilePic.innerHTML = `<span class="smile-text">集齐100个笑容 (${count}/100)</span>
      <span class="tick">✓</span>`;
    }
  }
});

bucketDocRef.doc("mission4").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const status = data.status;

    if (status === "completed") {
      mission4.innerHTML = `<span class="mission-text">封印第7层</span>
      <span class="tick">✓</span>`;
    } else {
      mission4.textContent = `封印第7层`;
    }
  }
});

bucketDocRef.doc("puzzle").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const left = data.left;
    const right = data.right;

    if (left === 4) {
      searchPuzzle.innerHTML = `<span class="puzzle-text">寻找消失的部件 (${left}/${right})</span>
      <span class="tick">✓</span>`;
    } else {
      searchPuzzle.textContent = `寻找消失的部件 (${left}/${right})`;
    }
  }
});

bucketDocRef.doc("notification").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    const status = data.status;
    const notiIcon = document.querySelector(".mainPage i");

    if (status === true) {
      // Only create badge if it doesn’t already exist
      if (!notiIcon.querySelector(".notification-badge")) {
        const badge = document.createElement("span");
        badge.classList.add("notification-badge");
        badge.textContent = "1";
        notiIcon.appendChild(badge);
      }
    } else {
      // Remove existing badge if notification turned off
      const existingBadge = notiIcon.querySelector(".notification-badge");
      if (existingBadge) existingBadge.remove();
    }
  }
});


function Notify() {
  let checkin = false;
  let overall = false;
  let smiles = false;
  let mission = false;

  function checkAllComplete() {
    if (checkin && overall && smiles && mission) {
      bucketDocRef.doc("notification").set({
        status: true,
      });
      console.log("✅ All tasks completed! Notification triggered.");
    } else {
      bucketDocRef.doc("notification").set({
        status: false,
      });
    }
  }

  bucketDocRef.doc("checkin").onSnapshot((doc) => {
    if (doc.exists) {
      const count = doc.data().count || 0;
      checkin = (count === 3);
      checkAllComplete();
    }
  });

  bucketDocRef.doc("overall").onSnapshot((doc) => {
    if (doc.exists) {
      const count = doc.data().count || 0;
      overall = (count === 14);
      checkAllComplete();
    }
  });

  bucketDocRef.doc("smiles").onSnapshot((doc) => {
    if (doc.exists) {
      const count = doc.data().count || 0;
      smiles = (count === 100);
      checkAllComplete();
    }
  });

  bucketDocRef.doc("mission4").onSnapshot((doc) => {
    if (doc.exists) {
      const status = doc.data().status;
      mission = (status === "completed");
      checkAllComplete();
    }
  });
}

Notify();

// Notification

const notiIcon = document.querySelector(".mainPage i");
const popup = document.getElementById("popup");
const p = document.querySelector(".popup p");
const overlay2 = document.getElementById("overlay-2");

if (notiIcon && popup && p && overlay2) {
  notiIcon.addEventListener("click", async () => {
    try {
      const doc = await bucketDocRef.doc("notification").get();

      if (doc.exists) {
        const { status } = doc.data();

        if (status === true) {
          p.innerHTML = `
            找到8个蜡烛 (红黄白蓝各2个) 去表演室进行“终幕仪典” 用笑声吸引小丑直到它出现 
            所有玩家握着蜡烛且无表情撑过小丑的死亡倒数 “10秒”
            <br><br>
            *仪式过程中若有任何表情或行为上动了，一切视为失败...
          `;
          p.style.color = "black";
          popup.classList.add("active");
          overlay2.classList.add("active");
        } else {
          popup.classList.add("active");
          overlay2.classList.add("active");
          p.textContent = "No notification";
          p.style.color = "gray";
        }
      } else {
        popup.classList.add("active");
        overlay2.classList.add("active");
        p.textContent = "No notification";
        p.style.color = "gray";
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
    }
  });

  overlay2.addEventListener("click", () => {
    popup.classList.remove("active");
    overlay2.classList.remove("active");
  });
} else {
  console.error("Popup elements not found in DOM");
}



// NPC 合照 Main Page

function backMainPage() {
  npcMainPage.classList.remove("active");
  smilePage.classList.remove("active");
  mainPage.classList.add("active");
}

const groupBtns = document.querySelectorAll("._14Btn button");

const colorClasses = ["npc-red", "npc-blue", "npc-green", "npc-yellow", "npc-cyan", "npc-orange"];

groupBtns.forEach((btn) => {
  const randomClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
  btn.classList.add(randomClass);
});

groupBtns.forEach((btn) => {
  db.collection("assignments")
    .doc(btn.id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const name = data.name;

        db.collection("npcPic")
          .doc(btn.id)
          .onSnapshot((picDoc) => {
            if (picDoc.exists) {
              const picData = picDoc.data();
              const count = picData.count;

              if (count) {
                btn.textContent = `${name} (${count}/3)`;
              } else {
                btn.textContent = `${name} (0/3)`;
              }
            } else {
              btn.textContent = `${name} (0/3)`;
            }
          });
      }
    });
});


const selfieTitle = document.querySelector(".selfieTitle h3");
// selfieTitle.textContent = "group";

groupBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // npcMainPage.classList.remove("active");
    // selfiePage.classList.add("active");

    db.collection("assignments")
      .doc(btn.id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const name = data.name;

          const teamNo = btn.id.split("team")[1];

          location.href = `npcPic.html?id=${teamNo}`;

          console.log(teamNo);
          return;

          // selfieTitle.textContent = name;
          // selfieTitle.setAttribute("data-team-id", btn.id);
        }
      });
  });
});

// 100 张微笑

const url =
  "https://script.google.com/macros/s/AKfycbyRvX9OnF4zi65H0UfoiRT2InHa4SJfb5PEg4dg-unyscIi6fsm5PlRclEpgkJsWdb2/exec";
const smileUpload = document.getElementById("smileUpload");
const submitBtn = document.getElementById("smileSubmitBtn");
const imgPre = document.getElementById("imagePreview");

const images = document.getElementById("images");

function showImages(imageUrls) {
  images.innerHTML = "";

  imageUrls.forEach((driveUrl, index) => {
    let fileId;
    try {
      if (driveUrl.includes("/d/")) {
        fileId = driveUrl.split("/d/")[1].split("/")[0];
      } else if (driveUrl.includes("id=")) {
        fileId = new URL(driveUrl).searchParams.get("id");
      } else {
        fileId = driveUrl;
      }
    } catch (e) {
      console.error("Failed to parse URL:", driveUrl, e);
      return;
    }

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("img-container");
    imgContainer.style.display = "inline-block";
    imgContainer.style.position = "relative";

    const img = document.createElement("img");
    img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h800`;
    img.alt = `Image ${index + 1}`;
    img.style.width = "200px";
    img.style.height = "auto";
    img.style.margin = "10px";
    img.style.borderRadius = "8px";
    img.style.objectFit = "contain";
    img.style.cursor = "pointer";
    img.style.border = "2px solid #ddd";

    img.onerror = function () {
      this.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
      this.onerror = function () {
        console.error("Image failed for fileId:", fileId);
        this.style.display = "none";

        const errorBox = document.createElement("div");
        errorBox.textContent = "Image unavailable";
        errorBox.style.width = "150px";
        errorBox.style.height = "150px";
        errorBox.style.backgroundColor = "#f0f0f0";
        errorBox.style.display = "inline-flex";
        errorBox.style.alignItems = "center";
        errorBox.style.justifyContent = "center";
        errorBox.style.margin = "10px";
        errorBox.style.borderRadius = "8px";
        errorBox.style.border = "2px solid #ddd";
        errorBox.style.cursor = "pointer";
        errorBox.style.color = "#666";
        errorBox.onclick = () => {
          window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank");
        };
        this.parentNode.insertBefore(errorBox, this);
      };
    };

    img.addEventListener("click", () => {
      window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank");
    });

    imgContainer.appendChild(img);
    images.appendChild(imgContainer);
  });
}

// db.collection("smiles").doc("list").onSnapshot((doc) => {
//   if (doc.exists) {
//     const data = doc.data();
//     const imageUrls = data.imageUrls || [];
//     showImages(imageUrls);
//   } else {
//     console.warn("No document found at smiles/list");
//   }
// });

let selectedFiles = [];

const overlay = document.getElementById("overlay");

smileUpload.addEventListener("change", () => {
  // if (selectedFiles.length >= 1) {
  //   alert("You can only upload a maximum of 1 images")
  //   smileUpload.disabled = true;
  //   return;
  // }

  const file = smileUpload.files[0];
  if (!file) return;

  const fr = new FileReader();

  fr.onloadend = () => {
    const img = document.createElement("img");
    img.src = fr.result;

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("img-container");

    const removeBtn = document.createElement("div");
    removeBtn.classList.add("remove-btn");
    removeBtn.textContent = "X";

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      imgContainer.remove();

      const index = selectedFiles.indexOf(file);
      if (index > -1) {
        selectedFiles.splice(index, 1);
      }

      if (selectedFiles.length === 0) {
        smileUpload.value = "";
        submitBtn.disabled = true;
      }
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(removeBtn);
    imgPre.appendChild(imgContainer);

    selectedFiles.push(file);

    submitBtn.disabled = false;

    smileUpload.value = "";
  };

  fr.readAsDataURL(file);
});

submitBtn.addEventListener("click", () => {
  overlay.style.visibility = "visible";

  const uploadPromises = selectedFiles.map(async (file) => {
    const fr = new FileReader();
    return new Promise((resolve, reject) => {
      fr.onloadend = async () => {
        try {
          const res = fr.result;
          const spt = res.split("base64,")[1];

          const obj = {
            base64: spt,
            type: file.type,
            name: file.name,
          };

          const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(obj),
          });
          const data = await response.json();

          if (data.success) {
            console.log("Upload successful:", data.url);

            await db
              .collection("smiles")
              .doc("list")
              .set(
                {
                  imageUrls: firebase.firestore.FieldValue.arrayUnion(data.url),
                },
                { merge: true }
              );

            resolve();
          } else {
            console.error("Upload failed:", data.error);
            reject(data.error);
          }
        } catch (err) {
          console.error("Error:", err);
          reject(err);
        }
      };

      fr.readAsDataURL(file);
    });
  });

  Promise.all(uploadPromises)
    .then(() => {
      overlay.style.visibility = "hidden";
      alert("Images uploaded successfully!");
      selectedFiles = [];
      imgPre.innerHTML = "";
      submitBtn.disabled = true;
    })
    .catch((err) => {
      overlay.style.visibility = "hidden";
      alert("Upload failed: " + err);
      selectedFiles = [];
      smileUpload.value = "";
      imgPre.innerHTML = "";
    });
});
