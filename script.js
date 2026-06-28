const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";
const ADMIN_PASSWORD = "6690";

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
    const script = document.createElement("script");
    params.callback = callbackName;
    const query = new URLSearchParams(params).toString();

    window[callbackName] = function(data) {
      delete window[callbackName];
      script.remove();
      resolve(data);
    };

    script.onerror = function() {
      delete window[callbackName];
      script.remove();
      reject(new Error("Erreur JSONP"));
    };

    script.src = API_URL + "?" + query;
    document.body.appendChild(script);
  });
}

function employeSelectionne() {
  return document.getElementById("employeSelect").value;
}

function setMessage(texte) {
  document.getElementById("message").innerText = texte;
}

function reglerBoutons(dernierAction) {
  const arrivee = document.getElementById("btnArrivee");
  const depart = document.getElementById("btnDepart");

  if (dernierAction === "Arrivée") {
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
    reglerBoutons("Départ");
    return;
  }

  dernier.innerText = `${data.date || ""}\n${data.heure || ""} - ${data.action}`;
  reglerBoutons(data.action);
}

async function chargerEmployes() {
  setMessage("Chargement des employés...");
  const select = document.getElementById("employeSelect");
  select.innerHTML = "";

  try {
    const employes = await jsonp({ mode: "employes" });

    if (!employes || employes.length === 0) {
      select.innerHTML = '<option value="">Aucun employé actif</option>';
      setMessage("Aucun employé actif");
      document.getElementById("btnArrivee").disabled = true;
      document.getElementById("btnDepart").disabled = true;
      return;
    }

    employes.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.nom;
      option.textContent = emp.nom;
      select.appendChild(option);
    });

    await chargerEtat();
    afficherListeEmployes(employes);
  } catch (error) {
    select.innerHTML = '<option value="">Erreur de chargement</option>';
    setMessage("Erreur employés");
    document.getElementById("btnArrivee").disabled = true;
    document.getElementById("btnDepart").disabled = true;
  }
}

function afficherListeEmployes(employes) {
  const zone = document.getElementById("listeEmployes");
  if (!zone) return;
  zone.innerHTML = employes.map(e => `• ${e.nom}`).join("<br>");
}

async function chargerEtat() {
  const nom = employeSelectionne();
  if (!nom) {
    setMessage("Aucun employé sélectionné");
    return;
  }

  setMessage("Chargement...");
  document.getElementById("btnArrivee").disabled = true;
  document.getElementById("btnDepart").disabled = true;

  try {
    const data = await jsonp({ nom: nom });
    afficherDernier(data);
    setMessage("Prêt");
  } catch (error) {
    document.getElementById("dernier").innerText = "Impossible de charger le dernier pointage";
    document.getElementById("btnArrivee").disabled = false;
    document.getElementById("btnDepart").disabled = false;
    setMessage("Mode secours");
  }
}

async function pointer(action) {
  const nom = employeSelectionne();
  if (!nom) {
    setMessage("Choisis un employé");
    return;
  }

  document.querySelectorAll("button").forEach(b => b.disabled = true);
  setMessage("Enregistrement...");

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ nom: nom, action: action })
    });

    const maintenant = new Date();
    const heure = maintenant.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
    const date = maintenant.toLocaleDateString("fr-BE");

    afficherDernier({ action, heure, date });
    setMessage("✔ Pointage envoyé");
    setTimeout(() => setMessage("Prêt"), 3000);
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

  if (!pin) {
    msg.innerText = "PIN obligatoire";
    return;
  }

  msg.innerText = "Ajout en cours...";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        type: "ajouterEmploye",
        nom: nom,
        pin: pin,
        actif: actif,
        admin: admin
      })
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
