/*****************************************************
 * MC TIME 3.9 LTS - DASHBOARD
 *****************************************************/

function dash_reconstruire() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const employes = mc_getOrCreateSheet(MC_SHEETS.EMPLOYES);
  const synthese = mc_getOrCreateSheet(MC_SHEETS.SYNTHESE);
  const dashboard = mc_getOrCreateSheet(MC_SHEETS.DASHBOARD);

  const dataEmployes = employes.getDataRange().getValues();
  const dataSynthese = synthese.getDataRange().getValues();

  const maintenant = new Date();
  const aujourdHui = mc_startOfDay(maintenant);
  const debutSemaine = mc_startOfWeekMonday(maintenant);
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  let actifs = 0;
  let presents = 0;
  let absents = 0;
  let alertesTotal = 0;
  let minutesJourTotal = 0;
  const lignesEmployes = [];

  for (let i = 1; i < dataEmployes.length; i++) {
    const actif = dataEmployes[i][1] === true;
    const nom = String(dataEmployes[i][2] || "").trim();
    const couleur = String(dataEmployes[i][5] || MC_THEME.PRIMARY).trim();
    if (!actif || !nom) continue;

    actifs++;
    const dernier = clock_getLastByName(nom);
    const etat = dernier && dernier.action === "Arrivée" ? "🟢 Présent" : "⚪ Absent";
    if (etat.indexOf("Présent") !== -1) presents++; else absents++;

    let totalJour = 0;
    let totalSemaine = 0;
    let totalMois = 0;
    let alertes = 0;

    for (let j = 1; j < dataSynthese.length; j++) {
      const date = mc_toDate(dataSynthese[j][0]);
      const employe = String(dataSynthese[j][1] || "").trim();
      const minutes = Number(dataSynthese[j][2]) || 0;
      const statut = String(dataSynthese[j][6] || "").trim();
      if (!date || employe !== nom) continue;

      const jour = mc_startOfDay(date);
      if (mc_sameDay(jour, aujourdHui)) totalJour += minutes;
      if (jour >= debutSemaine && jour <= maintenant) totalSemaine += minutes;
      if (jour >= debutMois && jour <= maintenant) totalMois += minutes;
      if (statut && statut !== "OK") alertes++;
    }

    minutesJourTotal += totalJour;
    alertesTotal += alertes;

    const dernierTexte = dernier
      ? Utilities.formatDate(dernier.date, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") + " - " + dernier.action
      : "Aucun";

    lignesEmployes.push([
      nom,
      etat,
      minutesEnTexte(totalJour),
      minutesEnTexte(totalSemaine),
      minutesEnTexte(totalMois),
      dernierTexte,
      alertes > 0 ? "⚠ " + alertes : "✓",
      couleur
    ]);
  }

  dash_render(dashboard, {
    actifs,
    presents,
    absents,
    alertesTotal,
    minutesJourTotal,
    lignesEmployes
  });
}

function dash_render(sheet, data) {
  sheet.clear();
  sheet.setHiddenGridlines(true);

  sheet.setColumnWidth(1, 230);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 230);
  sheet.setColumnWidth(7, 100);
  sheet.setRowHeight(1, 70);
  sheet.setRowHeight(2, 35);

  sheet.getRange("A1:G1").merge().setValue("MC TIME");
  sheet.getRange("A1")
    .setFontSize(MC_THEME.TITLE_SIZE)
    .setFontWeight("bold")
    .setFontColor(MC_THEME.WHITE)
    .setBackground(MC_THEME.PRIMARY)
    .setHorizontalAlignment("center");

  sheet.getRange("A2:G2").merge().setValue("Mutualité Chrétienne — " + MC_THEME.VERSION);
  sheet.getRange("A2")
    .setFontSize(MC_THEME.SUBTITLE_SIZE)
    .setFontColor(MC_THEME.WHITE)
    .setBackground(MC_THEME.PRIMARY)
    .setHorizontalAlignment("center");

  const cartes = [
    ["👥 Employés actifs", data.actifs],
    ["🟢 Présents", data.presents],
    ["⚪ Absents", data.absents],
    ["⚠ Alertes", data.alertesTotal],
    ["⏱ Aujourd'hui", minutesEnTexte(data.minutesJourTotal)]
  ];
  sheet.getRange(4, 1, cartes.length, 2).setValues(cartes);
  sheet.getRange("A4:B8")
    .setFontSize(12)
    .setFontWeight("bold")
    .setBackground(MC_THEME.PRIMARY_LIGHT);
  sheet.getRange("B4:B8").setHorizontalAlignment("center").setNumberFormat("@");

  const header = [["Employé", "État", "Aujourd'hui", "Semaine", "Mois", "Dernier pointage", "Alertes"]];
  sheet.getRange(10, 1, 1, 7).setValues(header);
  sheet.getRange("A10:G10")
    .setFontWeight("bold")
    .setFontColor(MC_THEME.WHITE)
    .setBackground(MC_THEME.PRIMARY);

  if (data.lignesEmployes.length) {
    const values = data.lignesEmployes.map(r => r.slice(0, 7));
    sheet.getRange(11, 1, values.length, 7).setValues(values);

    for (let i = 0; i < data.lignesEmployes.length; i++) {
      const row = 11 + i;
      sheet.getRange(row, 1, 1, 7).setBackground(i % 2 === 0 ? MC_THEME.WHITE : MC_THEME.LIGHT_GRAY);
      sheet.getRange(row, 1).setFontColor(data.lignesEmployes[i][7]).setFontWeight("bold");
    }
  }

  sheet.getRange("C:E").setHorizontalAlignment("right");
  sheet.getRange("A:G").setVerticalAlignment("middle");
  sheet.autoResizeRows(1, Math.max(12, data.lignesEmployes.length + 12));
}

// Compatibilité avec l'ancien nom.
function reconstruireDashboardMC() { dash_reconstruire(); }
