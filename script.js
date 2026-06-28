const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";

function majHorloge() {
  const maintenant = new Date();
  document.getElementById("horloge").innerText =
    maintenant.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
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
    const response = await fetch(`${API_URL}?mode=employes`);
    const employes = await response.json();

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
  } catch (error) {
    select.innerHTML = '<option value="">Erreur de chargement</option>';
    setMessage("Erreur employés");
    document.getElementById("btnArrivee").disabled = true;
    document.getElementById("btnDepart").disabled = true;
  }
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
    const response = await fetch(`${API_URL}?nom=${encodeURIComponent(nom)}`);
    const data = await response.json();
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

setInterval(majHorloge, 1000);
majHorloge();
chargerEmployes();
