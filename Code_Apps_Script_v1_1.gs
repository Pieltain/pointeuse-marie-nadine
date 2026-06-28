function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];

  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.nom,
    data.action
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const nom = e.parameter.nom || "";

  const values = sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 0; i--) {
    const row = values[i];
    const horodatage = row[0];
    const nomLigne = row[1];
    const action = row[2];

    if (nomLigne === nom && action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          action: action,
          date: Utilities.formatDate(new Date(horodatage), Session.getScriptTimeZone(), "dd/MM/yyyy"),
          heure: Utilities.formatDate(new Date(horodatage), Session.getScriptTimeZone(), "HH:mm")
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ action: "" }))
    .setMimeType(ContentService.MimeType.JSON);
}
