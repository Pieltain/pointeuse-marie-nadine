/*****************************************************
 * MC TIME 3.9 LTS - EMPLOYÉS / PIN
 *****************************************************/

function emp_getSheet() {
  return mc_getOrCreateSheet(MC_SHEETS.EMPLOYES);
}

function emp_getAll() {
  const data = emp_getSheet().getDataRange().getValues();
  const result = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][2]) continue;
    result.push({
      row: i + 1,
      id: data[i][0],
      active: data[i][1] === true,
      name: String(data[i][2] || "").trim(),
      pin: String(data[i][3] || "").trim(),
      admin: data[i][4] === true,
      color: String(data[i][5] || MC_THEME.PRIMARY).trim()
    });
  }
  return result;
}

function emp_getPublic(includeInactive) {
  return emp_getAll()
    .filter(e => includeInactive || e.active)
    .map(e => ({
      id: e.id,
      name: e.name,
      nom: e.name,
      active: e.active,
      admin: e.admin,
      color: e.color,
      couleur: e.color
    }));
}

function emp_findById(id) {
  return emp_getAll().find(e => String(e.id) === String(id));
}

function emp_add(data) {
  if (String(data.adminPassword || ADMIN_PASSWORD) !== ADMIN_PASSWORD) return { ok: false, error: "ADMIN_AUTH_FAILED" };

  const name = String(data.name || data.nom || "").trim();
  const pin = String(data.pin || "").trim();
  const color = String(data.color || MC_THEME.PRIMARY).trim();

  if (!name) return { ok: false, error: "NAME_REQUIRED" };
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, error: "INVALID_PIN" };

  const employees = emp_getAll();
  if (employees.some(e => e.name.toLowerCase() === name.toLowerCase())) return { ok: false, error: "DUPLICATE_NAME" };

  const maxId = employees.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);
  emp_getSheet().appendRow([
    maxId + 1,
    data.active !== false && data.active !== "false" && data.actif !== false,
    name,
    pin,
    data.admin === true || data.admin === "true",
    color
  ]);

  mc_logEvent("ADD_EMPLOYEE", name);
  recalculerMC();
  return { ok: true };
}

function emp_update(data) {
  if (String(data.adminPassword) !== ADMIN_PASSWORD) return { ok: false, error: "ADMIN_AUTH_FAILED" };

  const emp = emp_findById(data.employeeId);
  if (!emp) return { ok: false, error: "EMPLOYEE_NOT_FOUND" };

  const name = String(data.name || "").trim();
  const pin = String(data.pin || "").trim();
  const color = String(data.color || MC_THEME.PRIMARY).trim();

  if (!name) return { ok: false, error: "NAME_REQUIRED" };
  if (pin && !/^\d{4,6}$/.test(pin)) return { ok: false, error: "INVALID_PIN" };

  const employees = emp_getAll();
  if (employees.some(e => String(e.id) !== String(emp.id) && e.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "DUPLICATE_NAME" };
  }

  const sheet = emp_getSheet();
  sheet.getRange(emp.row, 2).setValue(data.active === true || data.active === "true");
  sheet.getRange(emp.row, 3).setValue(name);
  if (pin) sheet.getRange(emp.row, 4).setValue(pin);
  sheet.getRange(emp.row, 5).setValue(data.admin === true || data.admin === "true");
  sheet.getRange(emp.row, 6).setValue(color);

  mc_logEvent("UPDATE_EMPLOYEE", emp.name + " -> " + name);
  recalculerMC();
  return { ok: true };
}

function emp_verifyPin(employeeId, pin) {
  const emp = emp_findById(employeeId);
  if (!emp || !emp.active) return { ok: false };
  if (String(emp.pin).trim() !== String(pin).trim()) return { ok: false };

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put("auth_" + token, String(emp.id), 120);
  return { ok: true, token };
}

function emp_validateToken(employeeId, token) {
  if (!token) return null;
  const stored = CacheService.getScriptCache().get("auth_" + token);
  if (!stored || String(stored) !== String(employeeId)) return null;

  const emp = emp_findById(employeeId);
  if (!emp || !emp.active) return null;

  CacheService.getScriptCache().remove("auth_" + token);
  return emp;
}

// Compatibilité avec anciens noms.
function getEmployees() { return emp_getAll(); }
function getPublicEmployees(includeInactive) { return emp_getPublic(includeInactive); }
function findEmployeeById(id) { return emp_findById(id); }
function verifyPin(employeeId, pin) { return emp_verifyPin(employeeId, pin); }
function updateEmployeeObject(data) { return emp_update(data); }
