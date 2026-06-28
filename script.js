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

async function pointer(action) {
  const boutons = document.querySelectorAll("button");
  const message = document.getElementById("message");
  const dernier = document.getElementById("dernier");

  boutons.forEach(b => b.disabled = true);
  message.innerText = "Enregistrement...";

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

    const heure = new Date().toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit"
    });

    message.innerText = "✔ Pointage envoyé";
    dernier.innerText = `${heure} - ${action}`;

  } catch (error) {
    message.innerText = "Erreur d'envoi";
  }

  setTimeout(() => {
    boutons.forEach(b => b.disabled = false);
    message.innerText = "Prêt";
  }, 4000);
}

afficherDate();
