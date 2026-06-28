const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";
const ADMIN_PASSWORD = "6690";

let etatDernierAction = "";
let pinToken = "";

function majHorloge() {
  const maintenant = new Date();
  document.getElementById("horloge").innerText =
    maintenant.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
}

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonpCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const balise = document.createElement("script");
    params.callback = callbackName;
    const query = new URLSearchParams(params).toString();

    window[callbackName] = function(data) {
      delete window[callbackName];
      balise.remove();
      resolve(data);
    };

    balise.onerror = function() {
      delete window[callbackName];
      balise.remove();
      reject(new Error("Erreur JSONP"));
    };

    balise.src = API_URL + "?" + query;
    document.body.appendChild(balise);
  });
}

function employeSelectionne() {
  return document.getElementById("employeSelect").value;
}

function setMessage(texte) {
  document.getElementById("message").innerText = texte;
}

function boutonsInactifs() {
  document.getElementById("btnArrivee").disabled = true;
  document.getElementById("btnDepart").disabled = true;
}

function appliquerEtatBoutons() {
  const arrivee = document.getElementById("btnArrivee");
  const depart = document.getElementById("btnDepart");

  if (!pinToken) {
    arrivee.disabled = true;
    depart.disabled = true;
    return;
  }

  if (etatDernierAction === "Arrivée") {
    arrivee.disabled = true;
    depart.disabled = false;
  } else {
    arrivee.disabled = false;
    depart.disabled = true;
  }
}

function afficherDernier(data) {
  const dernier = document.getElementById("dernier");

  if (!data || !data.action) {
    dernier.innerText = "Aucun pointage";
    etatDernierAction = "Départ";
    appliquerEtatBoutons();
    return;
  }

  dernier.innerText = `${data.date || ""}\n${data.heure || ""} - ${data.action}`;
  etatDernierAction = data.action;
  appliquerEtatBoutons();
}

async function chargerEmployes() {
  setMessage("Chargement des employés...");
  boutonsInactifs();
  const select = document.getElementById("employeSelect");
  select.innerHTML = "";

  try {
    const employes = await jsonp({ mode: "employes" });

    if (!employes || !employes.length) {
      select.innerHTML = '<option value="">Aucun employé actif</option>';
      setMessage("Aucun employé actif");
      return;
    }

    employes.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = emp.nom;
      select.appendChild(option);
    });

    afficherListeEmployes(employes);
    await chargerEtat();
  } catch (error) {
    select.innerHTML = '<option value="">Erreur de chargement</option>';
    setMessage("Erreur employés");
  }
}

function afficherListeEmployes(employes) {
  const zone = document.getElementById("listeEmployes");
  if (!zone) return;
  zone.innerHTML = employes.map(e => `• ${e.nom}`).join("<br>");
}

function changementEmploye() {
  effacerPin();
  chargerEtat();
}

async function chargerEtat() {
  const employeId = employeSelectionne();
  pinToken = "";
  boutonsInactifs();

  if (!employeId) {
    setMessage("Aucun employé sélectionné");
    return;
  }

  setMessage("Entrez le PIN");

  try {
    const data = await jsonp({ mode: "dernier", employeId: employeId });
    afficherDernier(data);
  } catch (error) {
    document.getElementById("dernier").innerText = "Impossible de charger le dernier pointage";
    setMessage("Erreur de chargement");
  }
}

function ajouterChiffre(chiffre) {
  const input = document.getElementById("pinInput");
  if (input.value.length >= 6) return;
  input.value += chiffre;
  verifierPin();
}

function retourPin() {
  const input = document.getElementById("pinInput");
  input.value = input.value.slice(0, -1);
  verifierPin();
}

function effacerPin() {
  document.getElementById("pinInput").value = "";
  pinToken = "";
  appliquerEtatBoutons();
  setMessage("Entrez le PIN");
}

async function verifierPin() {
  const employeId = employeSelectionne();
  const pin = document.getElementById("pinInput").value;

  pinToken = "";
  appliquerEtatBoutons();

  if (!employeId || pin.length < 4) {
    setMessage("Entrez le PIN");
    return;
  }

  try {
    const result = await jsonp({ mode: "verifierPin", employeId: employeId, pin: pin });
    if (result && result.ok) {
      pinToken = result.token;
      setMessage("PIN correct");
    } else {
      setMessage("PIN incorrect");
    }
  } catch (error) {
    setMessage("Erreur PIN");
  }

  appliquerEtatBoutons();
}

async function pointer(action) {
  const employeId = employeSelectionne();

  if (!pinToken) {
    setMessage("PIN requis");
    return;
  }

  document.querySelectorAll("button").forEach(b => b.disabled = true);
  setMessage("Enregistrement...");

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        type: "pointage",
        employeId: employeId,
        token: pinToken,
        action: action
      })
    });

    const maintenant = new Date();
    const heure = maintenant.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
    const date = maintenant.toLocaleDateString("fr-BE");

    afficherDernier({ action, heure, date });
    setMessage("✔ Pointage envoyé");
    effacerPin();

  } catch (error) {
    setMessage("Erreur d'envoi");
    await chargerEtat();
  }
}

function ouvrirAdmin() {
  document.getElementById("adminModal").classList.remove("hidden");
  document.getElementById("adminPassword").focus();
}

function fermerAdmin() {
  document.getElementById("adminModal").classList.add("hidden");
}

function connexionAdmin() {
  const pwd = document.getElementById("adminPassword").value;
  if (pwd !== ADMIN_PASSWORD) {
    document.getElementById("adminMessage").innerText = "Mot de passe incorrect";
    return;
  }

  document.getElementById("adminLogin").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  document.getElementById("adminMessage").innerText = "";
}

async function ajouterEmploye() {
  const nom = document.getElementById("newNom").value.trim();
  const pin = document.getElementById("newPin").value.trim();
  const actif = document.getElementById("newActif").checked;
  const admin = document.getElementById("newAdmin").checked;
  const msg = document.getElementById("adminMessage");

  if (!nom) {
    msg.innerText = "Nom obligatoire";
    return;
  }

  if (!/^\d{4,6}$/.test(pin)) {
    msg.innerText = "PIN obligatoire : 4 à 6 chiffres";
    return;
  }

  msg.innerText = "Ajout en cours...";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type: "ajouterEmploye", nom, pin, actif, admin })
    });

    msg.innerText = "✔ Employé ajouté";
    document.getElementById("newNom").value = "";
    document.getElementById("newPin").value = "";
    document.getElementById("newActif").checked = true;
    document.getElementById("newAdmin").checked = false;
    setTimeout(chargerEmployes, 1200);
  } catch (error) {
    msg.innerText = "Erreur lors de l'ajout";
  }
}

setInterval(majHorloge, 1000);
majHorloge();
chargerEmployes();
