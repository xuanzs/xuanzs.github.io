const url =
  "https://script.google.com/macros/s/AKfycbzpiQoYAXFG4Q40qD8c22XWrNx5UiQxuI02FWSLC9TaPfFa-wpTgd2OsCaQvAUvNF04Lg/exec";
const fileInput = document.getElementById("fileInput");
const submitBtn = document.getElementById("npcSubmitBtn");
const imgPre = document.getElementById("imagePreview");

let selectedFiles = [];

const overlay = document.getElementById("overlay");

const selfieTitle = document.querySelector(".selfieTitle h3");

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
} else {
  alert("Error");
  location.href = "bucketList.html";
}

function backNpcMainPage() {
  location.href = "bucketList.html";
}

fileInput.addEventListener("change", () => {
  if (selectedFiles.length >= 3) {
    alert("You can only upload a maximum of 3 images.");
    fileInput.disabled = true;
    return;
  }

  const file = fileInput.files[0];
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
                  count: 0,
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
      selectedFiles = [];
      fileInput.value = "";
      imgPre.innerHTML = "";
      submitBtn.disabled = true;
    })
    .catch(() => {
      overlay.style.visibility = "hidden";
      selectedFiles = [];
    });
});
