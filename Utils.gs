/*****************************************************
 * MC TIME 3.9 LTS - UTILITAIRES
 *****************************************************/

function mc_jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function mc_jsonpOrJson(obj, callback) {
  const text = callback ? callback + "(" + JSON.stringify(obj) + ");" : JSON.stringify(obj);
  return ContentService
    .createTextOutput(text)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function mc_toDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d;
  }

  const text = String(value || "").trim();
  if (!text) return null;

  let m = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
    if (!isNaN(d.getTime())) return d;
  }

  m = text.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(text);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function mc_startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mc_startOfWeekMonday(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = mc_startOfDay(date);
  start.setDate(start.getDate() + diff);
  return start;
}

function mc_sameDay(a, b) {
  return a && b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function mc_diffMinutes(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function minutesEnTexte(minutes) {
  minutes = Number(minutes);
  if (isNaN(minutes) || minutes <= 0) return "0h00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + "h" + String(m).padStart(2, "0");
}

function texteEnMinutes(text) {
  if (text === null || text === undefined || text === "") return 0;
  if (typeof text === "number") return Math.round(text);
  const s = String(text).trim();
  let m = s.match(/^(\d+)h(\d{1,2})$/i);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d+):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return 0;
}

function mc_unique(items) {
  return [...new Set(items)];
}

function mc_getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function mc_getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function mc_writeTable(sheet, rows) {
  sheet.clear();
  if (!rows || !rows.length) return;
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight("bold");
  sheet.autoResizeColumns(1, rows[0].length);
}

function mc_csvEscape(value) {
  const text = String(value === null || value === undefined ? "" : value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function mc_sanitizeFilename(text) {
  return String(text || "").replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function mc_logEvent(type, message) {
  const sheet = mc_getOrCreateSheet(MC_SHEETS.HISTORIQUE);
  if (sheet.getLastRow() === 0) sheet.appendRow(["Horodateur", "Type", "Message"]);
  sheet.appendRow([new Date(), type, message]);
}

// Compatibilité avec d'anciens appels éventuels.
function toDate(value) { return mc_toDate(value); }
function debutJour(date) { return mc_startOfDay(date); }
function memeJour(a, b) { return mc_sameDay(a, b); }
function differenceMinutes(debut, fin) { return mc_diffMinutes(debut, fin); }
