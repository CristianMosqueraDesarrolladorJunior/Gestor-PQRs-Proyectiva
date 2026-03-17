/**
 * Caso de uso: Actualizar PQR
 * @module application/pqr/UpdatePQR
 */

/**
 * Actualiza una PQR en el spreadsheet
 * @param {string} pqrDataStr - JSON con datos de la PQR a actualizar
 * @returns {string} JSON con status y message
 */
function updatePQR(pqrDataStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(AppConfig.LOCK_TIMEOUT_MS || 10000);
  try {
    var pqrData = JSON.parse(pqrDataStr);
    var sheet = getSheet(SheetConfig.PQR);

    var nuevaAccion = {
      fecha: new Date().toISOString(),
      usuario: Session.getActiveUser().getEmail() || 'Usuario Actual',
      accion: pqrData.nuevaAccionTexto,
      estadoAnterior: pqrData.estadoAnterior,
      estadoNuevo: pqrData.estado
    };

    var historial = Array.isArray(pqrData.historial) ? pqrData.historial : [];
    historial.unshift(nuevaAccion);

    sheet.getRange(pqrData.rowNumber, 5).setValue(pqrData.estado);
    sheet.getRange(pqrData.rowNumber, 6).setValue(pqrData.prioridad);

    if (pqrData.asesor && pqrData.asesor !== 'Sin Asignar') {
      sheet.getRange(pqrData.rowNumber, 7).setValue(pqrData.asesor);
      if (!pqrData.fechaAsignacion) {
        sheet.getRange(pqrData.rowNumber, 8).setValue(new Date().toISOString());
      }
    }

    if (pqrData.estado === 'Cerrado' || pqrData.estado === 'Resuelto') {
      sheet.getRange(pqrData.rowNumber, 9).setValue(new Date().toISOString());
    }

    sheet.getRange(pqrData.rowNumber, 10).setValue(JSON.stringify(historial));

    return JSON.stringify({ status: 'success', message: 'PQR actualizada exitosamente.' });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}
