/*****************************************************
 * MC TIME 3.9 LTS - TESTS
 *****************************************************/

function testerMoteurMC() {
  const sheet = mc_getOrCreateSheet(MC_SHEETS.TESTS);
  const lignes = [["Test", "Attendu", "Obtenu", "Résultat"]];

  tests_ajouter(lignes, "Journée simple", 540, "9h00");
  tests_ajouter(lignes, "Pause midi", 480, "8h00");
  tests_ajouter(lignes, "Minutes réelles", 481, "8h01");
  tests_ajouter(lignes, "Petite période", 36, "0h36");
  tests_ajouter(lignes, "Zéro minute", 0, "0h00");

  mc_writeTable(sheet, lignes);
}

function tests_ajouter(lignes, nom, minutes, attendu) {
  const obtenu = minutesEnTexte(minutes);
  lignes.push([nom, attendu, obtenu, obtenu === attendu ? "✅ OK" : "❌ ERREUR"]);
}
