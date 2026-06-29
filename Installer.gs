/*****************************************************
 * MC TIME 3.9 LTS - INSTALLATION / STRUCTURE
 *****************************************************/

function mc_ensureStructure() {
  const employes = mc_getOrCreateSheet(MC_SHEETS.EMPLOYES);
  mc_ensureHeaders(employes, ["ID", "Actif", "Nom", "PIN", "Administrateur", "Couleur"]);

  const pointages = mc_getOrCreateSheet(MC_SHEETS.POINTAGES);
  mc_ensureHeaders(pointages, ["Horodateur", "Nom", "Action"]);

  mc_getOrCreateSheet(MC_SHEETS.CALCUL);
  mc_getOrCreateSheet(MC_SHEETS.SYNTHESE);
  mc_getOrCreateSheet(MC_SHEETS.DASHBOARD);

  const historique = mc_getOrCreateSheet(MC_SHEETS.HISTORIQUE);
  mc_ensureHeaders(historique, ["Horodateur", "Type", "Message"]);
}

function mc_ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }
  for (let c = 0; c < headers.length; c++) {
    if (!sheet.getRange(1, c + 1).getValue()) sheet.getRange(1, c + 1).setValue(headers[c]);
  }
}

function installerMCTime() {
  mc_ensureStructure();
  recalculerMC();
  mc_logEvent("INSTALL", "MC Time installé / vérifié");
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("MC Time")
    .addItem("Recalculer", "recalculerMC")
    .addItem("Tester le moteur", "testerMoteurMC")
    .addSeparator()
    .addItem("Installer / vérifier", "installerMCTime")
    .addToUi();
}
