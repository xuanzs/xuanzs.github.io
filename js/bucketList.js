const mainPage = document.getElementById("mainPage");
const npcMainPage = document.getElementById("npcMainPage");
const selfiePage = document.getElementById("selfiePage");
const smilePage = document.getElementById("smilePage");

// Main Page

function openNpcMainPage() {
  mainPage.classList.remove("active");
  npcMainPage.classList.add("active");
}

function openSmilePage() {
  mainPage.classList.remove("active");
  smilePage.classList.add("active");
}

// NPC 合照 Main Page

function backMainPage() {
  npcMainPage.classList.remove("active");
  smilePage.classList.remove("active");
  mainPage.classList.add("active");
}

const groupBtns = document.querySelectorAll("._14Btn button");

groupBtns.forEach((btn) => {
  db.collection("assignments")
    .doc(btn.id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const name = data.name;

        btn.textContent = name;
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

          const teamNo = btn.id.split('team')[1];

          location.href = `npcPic.html?id=${teamNo}`;

          console.log(teamNo);
          return;

          // selfieTitle.textContent = name;
          // selfieTitle.setAttribute("data-team-id", btn.id);
        }
      });
  });
});



