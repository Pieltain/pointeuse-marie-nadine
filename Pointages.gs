/*****************************************************
 * MC TIME 3.9 LTS - POINTAGES
 *****************************************************/

function clock_handle(employeeId, token, clockAction) {
  const emp = emp_validateToken(employeeId, token);
  if (!emp) return { ok: false, error: "AUTH_FAILED" };

  const action = String(clockAction || "").trim();
  if (action !== "Arrivée" && action !== "Départ") return { ok: false, error: "INVALID_CLOCK_ACTION" };

  mc_getOrCreateSheet(MC_SHEETS.POINTAGES).appendRow([new Date(), emp.name, action]);
  mc_logEvent("CLOCK", emp.name + " - " + action);
  recalculerMC();
  return { ok: true };
}

function clock_getLast(employeeId) {
  const emp = emp_findById(employeeId);
  if (!emp) return { ok: false, action: "" };

  const last = clock_getLastByName(emp.name);
  if (!last) return { ok: true, action: "" };

  return {
    ok: true,
    action: last.action,
    date: Utilities.formatDate(last.date, Session.getScriptTimeZone(), "dd/MM/yyyy"),
    time: Utilities.formatDate(last.date, Session.getScriptTimeZone(), "HH:mm"),
    heure: Utilities.formatDate(last.date, Session.getScriptTimeZone(), "HH:mm")
  };
}

function clock_getLastByName(name) {
  const data = mc_getOrCreateSheet(MC_SHEETS.POINTAGES).getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const date = mc_toDate(data[i][0]);
    const rowName = String(data[i][1] || "").trim();
    const action = String(data[i][2] || "").trim();
    if (date && rowName === name && action) return { date, action };
  }
  return null;
}

// Compatibilité avec anciens noms.
function handleClock(employeeId, token, clockAction) { return mc_jsonOutput(clock_handle(employeeId, token, clockAction)); }
function getLastClocking(employeeId) { return clock_getLast(employeeId); }
function getLastClockingByName(name) { return clock_getLastByName(name); }
