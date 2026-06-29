/*****************************************************
 * MC TIME 3.9 LTS - API
 *****************************************************/

function doPost(e) {
  mc_ensureStructure();
  const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  let result;
  if (data.action === "clock") result = clock_handle(data.employeeId, data.token, data.clockAction);
  else if (data.type === "pointage") result = clock_handle(data.employeId, data.token, data.action);
  else if (data.action === "addEmployee" || data.type === "ajouterEmploye") result = emp_add(data);
  else if (data.action === "updateEmployee") result = emp_update(data);
  else result = { ok: false, error: "UNKNOWN_ACTION" };

  return mc_jsonOutput(result);
}

function doGet(e) {
  mc_ensureStructure();
  const p = e ? e.parameter : {};
  const action = p.action || "";
  const mode = p.mode || "";
  const callback = p.callback || "";

  let result;

  if (action === "employees") {
    result = { ok: true, employees: emp_getPublic(p.includeInactive === "true") };
  } else if (mode === "employes") {
    result = emp_getPublic(false);
  } else if (action === "verifyPin") {
    result = emp_verifyPin(p.employeeId, p.pin);
  } else if (mode === "verifierPin") {
    result = emp_verifyPin(p.employeId, p.pin);
  } else if (action === "lastClocking") {
    result = clock_getLast(p.employeeId);
  } else if (mode === "dernier") {
    result = clock_getLast(p.employeId);
  } else if (action === "updateEmployee") {
    result = emp_update({
      adminPassword: p.adminPassword,
      employeeId: p.employeeId,
      name: p.name,
      pin: p.pin,
      color: p.color,
      active: p.active,
      admin: p.admin
    });
  } else if (action === "exportCsv") {
    result = exportCsvObject({
      adminPassword: p.adminPassword,
      month: p.month,
      employeeId: p.employeeId,
      type: p.type || "synthese"
    });
  } else if (action === "recalculate") {
    if (String(p.adminPassword) === ADMIN_PASSWORD) {
      recalculerMC();
      result = { ok: true };
    } else {
      result = { ok: false, error: "ADMIN_AUTH_FAILED" };
    }
  } else if (action === "version") {
    result = { ok: true, version: MC_THEME.VERSION };
  } else {
    result = { ok: false, error: "UNKNOWN_ACTION" };
  }

  return mc_jsonpOrJson(result, callback);
}
