/*****************************************************
 * MC TIME 3.9 LTS - EXPORT CSV
 *****************************************************/

function exportCsvObject(data) {
  if (String(data.adminPassword) !== ADMIN_PASSWORD) return { ok: false, error: "ADMIN_AUTH_FAILED" };

  const month = String(data.month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: "INVALID_MONTH" };

  const employeeId = String(data.employeeId || "").trim();
  let employeeName = "";
  if (employeeId) {
    const emp = emp_findById(employeeId);
    if (!emp) return { ok: false, error: "EMPLOYEE_NOT_FOUND" };
    employeeName = emp.name;
  }

  recalculerMC();

  const type = String(data.type || "synthese").trim();
  return type === "detail"
    ? export_detailCsv(month, employeeName)
    : export_syntheseCsv(month, employeeName);
}

function export_syntheseCsv(month, employeeName) {
  const values = mc_getOrCreateSheet(MC_SHEETS.SYNTHESE).getDataRange().getValues();
  const lines = [["Date", "Employé", "Minutes", "Temps presté", "Première arrivée", "Dernier départ", "Statut"]];

  for (let i = 1; i < values.length; i++) {
    const date = mc_toDate(values[i][0]);
    const name = values[i][1];
    if (!date || !name) continue;
    if (Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM") !== month) continue;
    if (employeeName && name !== employeeName) continue;

    const first = mc_toDate(values[i][4]);
    const last = mc_toDate(values[i][5]);
    lines.push([
      Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy"),
      name,
      values[i][2] || 0,
      values[i][3] || "0h00",
      first ? Utilities.formatDate(first, Session.getScriptTimeZone(), "HH:mm") : "",
      last ? Utilities.formatDate(last, Session.getScriptTimeZone(), "HH:mm") : "",
      values[i][6] || ""
    ]);
  }
  return export_csvResult(lines, "Synthese", month, employeeName);
}

function export_detailCsv(month, employeeName) {
  const values = mc_getOrCreateSheet(MC_SHEETS.CALCUL).getDataRange().getValues();
  const lines = [["Date", "Employé", "Arrivée", "Départ", "Durée", "Minutes", "Statut"]];

  for (let i = 1; i < values.length; i++) {
    const date = mc_toDate(values[i][0]);
    const name = values[i][1];
    if (!date || !name) continue;
    if (Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM") !== month) continue;
    if (employeeName && name !== employeeName) continue;

    const arrival = mc_toDate(values[i][2]);
    const departure = mc_toDate(values[i][3]);
    lines.push([
      Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy"),
      name,
      arrival ? Utilities.formatDate(arrival, Session.getScriptTimeZone(), "HH:mm") : "",
      departure ? Utilities.formatDate(departure, Session.getScriptTimeZone(), "HH:mm") : "",
      values[i][4] || "",
      values[i][5] || "",
      values[i][6] || ""
    ]);
  }
  return export_csvResult(lines, "Detail", month, employeeName);
}

function export_csvResult(lines, type, month, employeeName) {
  const csv = lines.map(row => row.map(mc_csvEscape).join(";")).join("\n");
  const filename = "MC_Time_" + type + "_" + month + (employeeName ? "_" + mc_sanitizeFilename(employeeName) : "_Tous") + ".csv";
  return { ok: true, filename, rows: Math.max(0, lines.length - 1), csv };
}
