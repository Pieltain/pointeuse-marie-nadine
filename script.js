const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";

let employees = [];
let authToken = "";
let currentPin = "";
let lastAction = "";

function $(id) { return document.getElementById(id); }

function updateClock() {
  $("clock").innerText = new Date().toLocaleTimeString("fr-BE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function setMessage(text) { $("message").innerText = text; }

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 999999);
    params.callback = cb;
    const s = document.createElement("script");

    window[cb] = data => {
      delete window[cb];
      s.remove();
      resolve(data);
    };

    s.onerror = () => {
      delete window[cb];
      s.remove();
      reject(new Error("JSONP failed"));
    };

    s.src = API_URL + "?" + new URLSearchParams(params).toString();
    document.body.appendChild(s);
  });
}

function selectedEmployeeId() { return $("employeeSelect").value; }

function selectedEmployeeName() {
  const option = $("employeeSelect").selectedOptions[0];
  return option ? option.textContent : "";
}

function disableClockButtons() {
  $("arrivalBtn").disabled = true;
  $("departureBtn").disabled = true;
}

function updateClockButtons() {
  if (!authToken) {
    disableClockButtons();
    return;
  }

  if (lastAction === "Arrivée") {
    $("arrivalBtn").disabled = true;
    $("departureBtn").disabled = false;
  } else {
    $("arrivalBtn").disabled = false;
    $("departureBtn").disabled = true;
  }
}

function renderPin() {
  $("pinDisplay").innerText = currentPin ? "•".repeat(currentPin.length) : "----";
}

function clearPin() {
  currentPin = "";
  authToken = "";
  renderPin();
  updateClockButtons();
  setMessage("Entrez le PIN");
}

function backspacePin() {
  currentPin = currentPin.slice(0, -1);
  renderPin();
  verifyPinIfReady();
}

function pressKey(key) {
  if (currentPin.length >= 6) return;
  currentPin += key;
  renderPin();
  verifyPinIfReady();
}

async function verifyPinIfReady() {
  authToken = "";
  updateClockButtons();

  if (currentPin.length < 4) {
    setMessage("Entrez le PIN");
    return;
  }

  try {
    const result = await jsonp({
      action: "verifyPin",
      employeeId: selectedEmployeeId(),
      pin: currentPin
    });

    if (result.ok) {
      authToken = result.token;
      setMessage("PIN correct");
    } else {
      setMessage("PIN incorrect");
    }
  } catch (e) {
    setMessage("Erreur PIN");
  }

  updateClockButtons();
}

async function loadEmployees() {
  setMessage("Chargement...");
  disableClockButtons();

  try {
    const data = await jsonp({ action: "employees" });
    employees = data.employees || [];

    const select = $("employeeSelect");
    select.innerHTML = "";

    employees.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = emp.name;
      select.appendChild(option);
    });

    $("employeeList").innerHTML = employees.map(e => "• " + e.name).join("<br>");
    await loadLastClocking();
  } catch(e) {
    setMessage("Erreur employés");
  }
}

async function loadLastClocking() {
  clearPin();
  const employeeId = selectedEmployeeId();
  if (!employeeId) return;

  try {
    const result = await jsonp({ action: "lastClocking", employeeId });
    if (result.action) {
      lastAction = result.action;
      $("lastClocking").innerText = `${result.date}\n${result.time} - ${result.action}`;
    } else {
      lastAction = "Départ";
      $("lastClocking").innerText = "Aucun pointage";
    }
  } catch(e) {
    $("lastClocking").innerText = "Erreur de chargement";
  }

  updateClockButtons();
}

function onEmployeeChange() {
  loadLastClocking();
}

async function clockAction(action) {
  if (!authToken) {
    setMessage("PIN requis");
    return;
  }

  disableClockButtons();
  setMessage("Enregistrement...");

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "clock",
        employeeId: selectedEmployeeId(),
        token: authToken,
        clockAction: action
      })
    });

    const now = new Date();
    lastAction = action;
    $("lastClocking").innerText =
      now.toLocaleDateString("fr-BE") + "\n" +
      now.toLocaleTimeString("fr-BE", {hour:"2-digit", minute:"2-digit"}) +
      " - " + action;

    setMessage("✔ Pointage envoyé");
    clearPin();
  } catch(e) {
    setMessage("Erreur d'envoi");
  }
}

function openAdmin() { $("adminModal").classList.remove("hidden"); }
function closeAdmin() { $("adminModal").classList.add("hidden"); }

async function addEmployee() {
  const adminPassword = $("adminPassword").value;
  const name = $("newName").value.trim();
  const pin = $("newPin").value.trim();
  const active = $("newActive").checked;
  const admin = $("newAdmin").checked;

  if (!adminPassword) { $("adminMessage").innerText = "Mot de passe admin requis"; return; }
  if (!name) { $("adminMessage").innerText = "Nom obligatoire"; return; }
  if (!/^\d{4,6}$/.test(pin)) { $("adminMessage").innerText = "PIN : 4 à 6 chiffres"; return; }

  $("adminMessage").innerText = "Ajout...";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "addEmployee",
        adminPassword, name, pin, active, admin
      })
    });

    $("adminMessage").innerText = "✔ Employé ajouté";
    $("newName").value = "";
    $("newPin").value = "";
    setTimeout(loadEmployees, 1200);
  } catch(e) {
    $("adminMessage").innerText = "Erreur ajout";
  }
}

setInterval(updateClock, 1000);
updateClock();
loadEmployees();
