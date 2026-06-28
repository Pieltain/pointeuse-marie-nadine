const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";

let employees = [];
let authToken = "";
let currentPin = "";
let lastAction = "";

function $(id) { return document.getElementById(id); }

function updateClock() {
  $("clock").innerText = new Date().toLocaleTimeString("fr-BE", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
}

function setMessage(text) { $("message").innerText = text; }

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 999999);
    params.callback = cb;
    const s = document.createElement("script");
    window[cb] = data => { delete window[cb]; s.remove(); resolve(data); };
    s.onerror = () => { delete window[cb]; s.remove(); reject(new Error("JSONP failed")); };
    s.src = API_URL + "?" + new URLSearchParams(params).toString();
    document.body.appendChild(s);
  });
}

function selectedEmployeeId() { return $("employeeSelect").value; }
function selectedEmployee() { return employees.find(e => String(e.id) === String(selectedEmployeeId())); }

function setEmployeeTheme() {
  const emp = selectedEmployee();
  const color = emp && (emp.color || emp.couleur) ? (emp.color || emp.couleur) : "#238636";
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-soft", makeSoftColor(color));
  $("employeeBadge").innerText = emp ? emp.name : "—";
}

function makeSoftColor(hex) {
  if (!hex || !hex.startsWith("#") || hex.length !== 7) return "#e7f4ea";
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const mix = c => Math.round(c + (255-c)*0.86);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function disableClockButtons() { $("arrivalBtn").disabled = true; $("departureBtn").disabled = true; }

function updateClockButtons() {
  if (!authToken) { disableClockButtons(); return; }
  if (lastAction === "Arrivée") { $("arrivalBtn").disabled = true; $("departureBtn").disabled = false; }
  else { $("arrivalBtn").disabled = false; $("departureBtn").disabled = true; }
}

function renderPin() { $("pinDisplay").innerText = currentPin ? "•".repeat(currentPin.length) : "----"; }
function clearPin() { currentPin = ""; authToken = ""; renderPin(); updateClockButtons(); setMessage("Entrez le PIN"); }
function backspacePin() { currentPin = currentPin.slice(0,-1); renderPin(); verifyPinIfReady(); }
function pressKey(key) { if (currentPin.length >= 6) return; currentPin += key; renderPin(); verifyPinIfReady(); }

async function verifyPinIfReady() {
  authToken = ""; updateClockButtons();
  if (currentPin.length < 4) { setMessage("Entrez le PIN"); return; }
  try {
    const result = await jsonp({action:"verifyPin", employeeId:selectedEmployeeId(), pin:currentPin});
    if (result.ok) { authToken = result.token; setMessage("PIN correct"); }
    else setMessage("PIN incorrect");
  } catch(e) { setMessage("Erreur PIN"); }
  updateClockButtons();
}

async function loadEmployees() {
  setMessage("Chargement..."); disableClockButtons();
  try {
    const data = await jsonp({action:"employees", includeInactive:"true"});
    employees = data.employees || [];
    const activeEmployees = employees.filter(e => e.active !== false);
    const select = $("employeeSelect");
    select.innerHTML = "";
    activeEmployees.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = emp.name;
      select.appendChild(option);
    });
    renderEmployeeList();
    populateEditSelect();
    setEmployeeTheme();
    await loadLastClocking();
  } catch(e) { setMessage("Erreur employés"); }
}

function renderEmployeeList() {
  $("employeeList").innerHTML = employees.map(e => {
    const color = e.color || e.couleur || "#218838";
    const cls = e.active === false ? "employee-item inactive" : "employee-item";
    return `<div class="${cls}"><span class="color-dot" style="background:${color}"></span>${e.name} ${e.active===false ? "(inactif)" : ""}</div>`;
  }).join("");
}

function populateEditSelect() {
  const s = $("editEmployeeSelect");
  if (!s) return;
  s.innerHTML = "";
  employees.forEach(e => {
    const o = document.createElement("option");
    o.value = e.id;
    o.textContent = e.name;
    s.appendChild(o);
  });
  loadEmployeeForEdit();
}

function loadEmployeeForEdit() {
  const emp = employees.find(e => String(e.id) === String($("editEmployeeSelect").value));
  if (!emp) return;
  $("editName").value = emp.name || "";
  $("editPin").value = "";
  $("editColor").value = emp.color || emp.couleur || "#218838";
  $("editActive").checked = emp.active !== false;
  $("editAdmin").checked = emp.admin === true;
}

async function loadLastClocking() {
  clearPin(); setEmployeeTheme();
  const employeeId = selectedEmployeeId();
  if (!employeeId) return;
  try {
    const result = await jsonp({action:"lastClocking", employeeId});
    if (result.action) {
      lastAction = result.action;
      $("lastClocking").innerText = `${result.date}\n${result.time} - ${result.action}`;
    } else {
      lastAction = "Départ";
      $("lastClocking").innerText = "Aucun pointage";
    }
  } catch(e) { $("lastClocking").innerText = "Erreur de chargement"; }
  updateClockButtons();
}

function onEmployeeChange() { loadLastClocking(); }

async function clockAction(action) {
  if (!authToken) { setMessage("PIN requis"); return; }
  disableClockButtons(); setMessage("Enregistrement...");
  try {
    await fetch(API_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"clock", employeeId:selectedEmployeeId(), token:authToken, clockAction:action})});
    const now = new Date();
    lastAction = action;
    $("lastClocking").innerText = now.toLocaleDateString("fr-BE") + "\n" + now.toLocaleTimeString("fr-BE", {hour:"2-digit", minute:"2-digit"}) + " - " + action;
    setMessage("✔ Pointage envoyé");
    clearPin();
  } catch(e) { setMessage("Erreur d'envoi"); }
}

function openAdmin() { $("adminModal").classList.remove("hidden"); }
function closeAdmin() { $("adminModal").classList.add("hidden"); }

function showAdminTab(tab) {
  $("adminAdd").classList.toggle("hidden", tab !== "add");
  $("adminEdit").classList.toggle("hidden", tab !== "edit");
  $("tabAdd").classList.toggle("active", tab === "add");
  $("tabEdit").classList.toggle("active", tab === "edit");
}

async function addEmployee() {
  const adminPassword = $("adminPassword").value;
  const name = $("newName").value.trim();
  const pin = $("newPin").value.trim();
  const active = $("newActive").checked;
  const admin = $("newAdmin").checked;
  const color = $("newColor").value;
  if (!adminPassword) { $("adminMessage").innerText = "Mot de passe admin requis"; return; }
  if (!name) { $("adminMessage").innerText = "Nom obligatoire"; return; }
  if (!/^\d{4,6}$/.test(pin)) { $("adminMessage").innerText = "PIN : 4 à 6 chiffres"; return; }
  $("adminMessage").innerText = "Ajout...";
  await fetch(API_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"addEmployee", adminPassword, name, pin, active, admin, color})});
  $("adminMessage").innerText = "✔ Employé ajouté";
  $("newName").value = ""; $("newPin").value = "";
  setTimeout(loadEmployees, 1200);
}

async function updateEmployee() {
  const adminPassword = $("adminPassword").value;
  const employeeId = $("editEmployeeSelect").value;
  const name = $("editName").value.trim();
  const pin = $("editPin").value.trim();
  const color = $("editColor").value;
  const active = $("editActive").checked;
  const admin = $("editAdmin").checked;
  if (!adminPassword) { $("adminMessage").innerText = "Mot de passe admin requis"; return; }
  if (!name) { $("adminMessage").innerText = "Nom obligatoire"; return; }
  if (pin && !/^\d{4,6}$/.test(pin)) { $("adminMessage").innerText = "PIN : 4 à 6 chiffres"; return; }
  $("adminMessage").innerText = "Modification...";
  await fetch(API_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"updateEmployee", adminPassword, employeeId, name, pin, color, active, admin})});
  $("adminMessage").innerText = "✔ Employé modifié";
  $("editPin").value = "";
  setTimeout(loadEmployees, 1200);
}

setInterval(updateClock, 1000);
updateClock();
loadEmployees();
