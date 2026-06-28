const API_URL = "https://script.google.com/macros/s/AKfycbxxYGK_Xx-jkMD2vZjtDAQ6itiMuUPQXyAOR8u5Csa0Y1oPrxC02EvIoSYRvjgw9aiCCA/exec";
const NOM_EMPLOYEE = "Marie-Nadine Payet";

function afficherDate() {
  const maintenant = new Date();
  document.getElementById("dateJour").innerText =
    maintenant.toLocaleDateString("fr-BE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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

async function chargerEtat() {
  setMessage("Chargement...");

  try {
    const response = await fetch(`${API_URL}?nom=${encodeURIComponent(NOM_EMPLOYEE)}`);
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
  const boutons = document.querySelectorAll("button");
  boutons.forEach(b => b.disabled = true);
  setMessage("Enregistrement...");

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        nom: NOM_EMPLOYEE,
        action: action
      })
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

afficherDate();
chargerEtat();
