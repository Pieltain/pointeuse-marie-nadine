const FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfcZ_t28SEDbHu2_Rm-pj0hdZ1GDYWpbs2jhf1Itijtqs8prw/formResponse";
const FIELD_NOM = "entry.891225690";
const FIELD_ACTION = "entry.189412361";
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

function pointer(action) {
  const boutons = document.querySelectorAll("button");
  const message = document.getElementById("message");
  const dernier = document.getElementById("dernier");

  boutons.forEach(b => b.disabled = true);
  message.innerText = "Enregistrement...";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = FORM_ACTION_URL;
  form.target = "hiddenFrame";

  const champNom = document.createElement("input");
  champNom.type = "hidden";
  champNom.name = FIELD_NOM;
  champNom.value = NOM_EMPLOYEE;

  const champAction = document.createElement("input");
  champAction.type = "hidden";
  champAction.name = FIELD_ACTION;
  champAction.value = action;

  form.appendChild(champNom);
  form.appendChild(champAction);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  const heure = new Date().toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit"
  });

  message.innerText = "✔ Pointage enregistré";
  dernier.innerText = `${heure} - ${action}`;

  setTimeout(() => {
    boutons.forEach(b => b.disabled = false);
    message.innerText = "Prêt";
  }, 4000);
}

afficherDate();
