/**
 * Caso de uso: Guardar gestión de Renovación
 * @module application/leads/SaveLeadGestionRenovacion
 */

/**
 * Guarda la gestión de una renovación
 * @param {string} payloadStr - JSON con { lead, estadoGestion, observacion }
 * @returns {string} JSON con status y message
 */
function guardarGestionRenovacion(payloadStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(AppConfig.LOCK_TIMEOUT_MS || 10000);
  try {
    var payload = JSON.parse(payloadStr);
    var lead = payload.lead;
    var estadoGestion = payload.estadoGestion || '';
    var observacion = payload.observacion || '';
    if (!lead || !lead.rowNumber) {
      return JSON.stringify({ status: 'error', message: 'Lead inválido.' });
    }
    if (!observacion.trim()) {
      return JSON.stringify({ status: 'error', message: 'Ingrese la observación.' });
    }

    var sheet = getSheet(SheetConfig.RENOVACIONES);
    var historialGestiones = Array.isArray(lead.historialGestiones) ? lead.historialGestiones.slice() : [];
    historialGestiones.push({
      fecha: new Date().toISOString(),
      observacion: observacion,
      estadoGestion: estadoGestion
    });

    var row = lead.rowNumber;
    sheet.getRange(row, 5).setValue(estadoGestion);
    sheet.getRange(row, 7).setValue(JSON.stringify(historialGestiones));

    return JSON.stringify({ status: 'success', message: 'Gestión guardada correctamente.' });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}
