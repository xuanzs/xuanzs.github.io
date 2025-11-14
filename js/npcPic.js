const url =
  "https://script.google.com/macros/s/AKfycbzgMqOEyPeqqkkKTrJqH3NOFzYXyxICbVomCurdhaMgi2uTlSb6Pqkr4pmf0ekvhcnc1Q/exec";
const fileInput = document.getElementById("fileInput");
const submitBtn = document.getElementById("npcSubmitBtn");
const imgPre = document.getElementById("imagePreview");

let selectedFiles = [];

const overlay = document.getElementById("overlay");

const selfieTitle = document.querySelector(".selfieTitle h3");
const selfieDesc = document.querySelector(".selfieTitle h5");

const urlParams = new URLSearchParams(window.location.search);
const teamNo = urlParams.get("id");

if (teamNo) {
  db.collection("assignments")
    .doc(`team${teamNo}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const name = data.name;
        selfieTitle.textContent = name;
      }
    });

  db.collection("npcPic")
    .doc(`team${teamNo}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const count = parseInt(data.count);
        const imageUrls = data.imageUrls || [];

        if (count === 3) {
          fileInput.style.display = "none";
          submitBtn.style.display = "none";
          selfieDesc.style.display = "none";

          console.log("Count is 3 - showing existing uploaded images");

          showImages(imageUrls);
        }
      } else {
        console.warn(`No npcPic document found for team${teamNo}`);
      }
    })
    .catch((err) => {
      console.error("Error getting npcPic doc:", err);
    });
} else {
  alert("Error");
  location.href = "bucketList.html";
}

function backNpcMainPage() {
  localStorage.setItem("runFunction", "1");
  location.href = "bucketList.html";
}

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

fileInput.addEventListener("change", () => {
  if (selectedFiles.length >= 3) {
    alert("You can only upload a maximum of 3 images.");
    fileInput.disabled = true;
    return;
  }

  const file = fileInput.files[0];
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

      if (selectedFiles.length < 3) {
        fileInput.value = "";
        fileInput.disabled = false;
      }

      if (selectedFiles.length === 0) {
        fileInput.value = "";
        submitBtn.disabled = true;
      }
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(removeBtn);
    imgPre.appendChild(imgContainer);

    selectedFiles.push(file);

    submitBtn.disabled = false;

    if (selectedFiles.length >= 3) {
      fileInput.disabled = true;
    }

    // Clear file input
    fileInput.value = "";
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
            team: `team${teamNo}`,
          };

          const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(obj),
          });
          const data = await response.json();

          if (data.success) {
            console.log("Upload successful:", data.url);

            await db
              .collection("npcPic")
              .doc(data.team)
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
      // location.reload(); // Reload to show uploaded images
      selectedFiles = [];
      imgPre.innerHTML = "";
      submitBtn.disabled = true;
    })
    .catch((err) => {
      overlay.style.visibility = "hidden";
      alert("Upload failed: " + err);
      selectedFiles = [];
      fileInput.value = "";
      imgPre.innerHTML = "";
    });
});
