document.addEventListener("DOMContentLoaded", function () {
    const tableButtons = document.querySelectorAll("#t1 button");
    const rightButtons = document.querySelectorAll('.right1 button');
    const clearAllButtons = document.querySelectorAll('.bottom .Clear');
    const deleteButtons = document.querySelectorAll('.bottom .Delete');

    const urlParams = new URLSearchParams(window.location.search);
    const team = urlParams.get('team');

    if (team) {
        document.querySelector('.table1 h1').textContent = "Team " + team;
    } else {
        alert('No team selected');
        location.href = 'f.html'; // fallback redirect
    }

    let selectedTableButton = null;
    const assignedButtonsMap = new Map();

    tableButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tableButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTableButton = btn;
        });
    });

    rightButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (selectedTableButton) {
                const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
                if (usedRightBtn) {
                    usedRightBtn.disabled = false;
                    assignedButtonsMap.delete(selectedTableButton);
                }

                selectedTableButton.textContent = btn.textContent;
                btn.disabled = true;
                assignedButtonsMap.set(selectedTableButton, btn);
                tableButtons.forEach(b => b.classList.remove('selected'));
                selectedTableButton = null;
            }
        });
    });

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (selectedTableButton) {
                selectedTableButton.textContent = "";
                const usedRightBtn = assignedButtonsMap.get(selectedTableButton);
                if (usedRightBtn) {
                    usedRightBtn.disabled = false;
                    assignedButtonsMap.delete(selectedTableButton);
                }
                tableButtons.forEach(b => b.classList.remove('selected'));
                selectedTableButton = null;
            }
        });
    });

    clearAllButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const confirmed = confirm("Confirm to Clear All?");
            if (!confirmed) return;

            tableButtons.forEach(tableBtn => {
                tableBtn.textContent = "";
                tableBtn.classList.remove("selected");
            });

            rightButtons.forEach(rightBtn => {
                rightBtn.disabled = false;
            });

            assignedButtonsMap.clear();
            selectedTableButton = null;
        });
    });
});
