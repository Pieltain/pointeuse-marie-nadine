/*****************************************************
 * MC TIME 3.9 LTS - MOTEUR DE CALCUL
 *****************************************************/

function recalculerMC() {
  mc_ensureStructure();

  const data = mc_getOrCreateSheet(MC_SHEETS.POINTAGES).getDataRange().getValues();
  const groupes = {};

  for (let i = 1; i < data.length; i++) {
    const horodateur = mc_toDate(data[i][0]);
    const nom = String(data[i][1] || "").trim();
    const action = String(data[i][2] || "").trim();

    if (!horodateur || !nom || !action) continue;
    if (action !== "Arrivée" && action !== "Départ") continue;

    const jour = mc_startOfDay(horodateur);
    const dateKey = Utilities.formatDate(jour, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const cle = dateKey + "|" + nom;

    if (!groupes[cle]) groupes[cle] = { date: jour, nom, pointages: [] };
    groupes[cle].pointages.push({ heure: horodateur, action });
  }

  const lignesCalcul = [["Date", "Employé", "Arrivée", "Départ", "Durée", "Minutes", "Statut"]];
  const lignesSynthese = [["Date", "Employé", "Minutes", "Temps presté", "Première arrivée", "Dernier départ", "Statut"]];

  Object.values(groupes)
    .sort((a, b) => a.date - b.date || a.nom.localeCompare(b.nom))
    .forEach(jour => calc_calculerJour(jour, lignesCalcul, lignesSynthese));

  calc_ecrireCalculJournalier(mc_getOrCreateSheet(MC_SHEETS.CALCUL), lignesCalcul);
  calc_ecrireSynthese(mc_getOrCreateSheet(MC_SHEETS.SYNTHESE), lignesSynthese);
  dash_reconstruire();
}

function calc_calculerJour(jour, lignesCalcul, lignesSynthese) {
  jour.pointages.sort((a, b) => a.heure - b.heure);

  let arriveeOuverte = null;
  let premiereArrivee = "";
  let dernierDepart = "";
  let totalMinutes = 0;
  const anomalies = [];

  jour.pointages.forEach(p => {
    if (p.action === "Arrivée") {
      if (arriveeOuverte) {
        anomalies.push("Arrivée doublon à " + Utilities.formatDate(p.heure, Session.getScriptTimeZone(), "HH:mm"));
      } else {
        arriveeOuverte = p.heure;
        if (!premiereArrivee) premiereArrivee = p.heure;
      }
      return;
    }

    if (p.action === "Départ") {
      if (!arriveeOuverte) {
        anomalies.push("Départ sans arrivée à " + Utilities.formatDate(p.heure, Session.getScriptTimeZone(), "HH:mm"));
        dernierDepart = p.heure;
        return;
      }

      const minutes = mc_diffMinutes(arriveeOuverte, p.heure);
      if (minutes >= 0) {
        totalMinutes += minutes;
        lignesCalcul.push([jour.date, jour.nom, arriveeOuverte, p.heure, minutesEnTexte(minutes), minutes, "OK"]);
      } else {
        anomalies.push("Durée négative");
      }

      dernierDepart = p.heure;
      arriveeOuverte = null;
    }
  });

  if (arriveeOuverte) {
    anomalies.push("Départ manquant après " + Utilities.formatDate(arriveeOuverte, Session.getScriptTimeZone(), "HH:mm"));
  }

  const statut = anomalies.length ? mc_unique(anomalies).join(" / ") : "OK";

  if (anomalies.length) {
    lignesCalcul.push([jour.date, jour.nom, "", "", "", "", "⚠ " + statut]);
  }

  lignesSynthese.push([
    jour.date,
    jour.nom,
    totalMinutes,
    minutesEnTexte(totalMinutes),
    premiereArrivee,
    dernierDepart,
    statut
  ]);
}

function calc_ecrireCalculJournalier(sheet, lignes) {
  mc_writeTable(sheet, lignes);
  sheet.getRange("A:A").setNumberFormat("dd/MM/yyyy");
  sheet.getRange("C:D").setNumberFormat("HH:mm");
  sheet.getRange("E:E").setNumberFormat("@");
  sheet.getRange("F:F").setNumberFormat("0");
}

function calc_ecrireSynthese(sheet, lignes) {
  mc_writeTable(sheet, lignes);
  sheet.getRange("A:A").setNumberFormat("dd/MM/yyyy");
  sheet.getRange("C:C").setNumberFormat("0");
  sheet.getRange("D:D").setNumberFormat("@");
  sheet.getRange("E:F").setNumberFormat("HH:mm");
}

// Compatibilité avec ancien nom utilisé dans Code.gs.
function recalculateHours() { recalculerMC(); }
function recalculateAll() { recalculerMC(); }
function recalculerManuellement() { recalculerMC(); }
