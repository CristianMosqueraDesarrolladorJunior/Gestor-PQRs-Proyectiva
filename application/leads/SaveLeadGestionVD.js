/**
 * Caso de uso: Guardar gestión de Lead Vida/Desempleo
 * @module application/leads/SaveLeadGestionVD
 */

/**
 * Guarda la gestión de un lead de Vida o Desempleo
 * @param {string} payloadStr - JSON con { lead, producto, etapas }
 * @returns {string} JSON con status y message
 */
function guardarGestionVD(payloadStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(AppConfig.LOCK_TIMEOUT_MS || 10000);
  try {
    var payload = JSON.parse(payloadStr);
    var lead = payload.lead;
    var producto = payload.producto || '';
    var etapas = payload.etapas || {};
    if (!lead || !lead.rowNumber) {
      return JSON.stringify({ status: 'error', message: 'Lead inválido.' });
    }

    var sheet = getSheet(SheetConfig.LEADS);
    var historiaGestiones = Array.isArray(lead.historiaGestiones) ? lead.historiaGestiones.slice() : [];
    var obsDetalle = 'Gestión completada (' + producto + ').';
    if (etapas.descuento && etapas.descuento.valorPrima) obsDetalle += ' Canon: $' + etapas.descuento.valorPrima + '.';
    if (etapas.final && etapas.final.numPoliza) obsDetalle += ' Póliza: ' + etapas.final.numPoliza + '.';

    historiaGestiones.push({
      fecha: new Date().toISOString(),
      observacion: obsDetalle,
      etapas: etapas
    });

    var row = lead.rowNumber;
    sheet.getRange(row, 8).setValue(JSON.stringify(historiaGestiones));

    var datosVida = lead.datosVida || {};
    var datosDesempleo = lead.datosDesempleo || {};
    if (producto === 'Seguro de Vida' && etapas) {
      if (etapas.guion) Object.assign(datosVida, etapas.guion);
      if (etapas.descuento) Object.assign(datosVida, etapas.descuento);
      if (etapas.final) Object.assign(datosVida, etapas.final);
      sheet.getRange(row, 10).setValue(JSON.stringify(datosVida));
    } else if (producto === 'Seguro de Desempleo' && etapas) {
      if (etapas.guion) Object.assign(datosDesempleo, etapas.guion);
      if (etapas.descuento) Object.assign(datosDesempleo, etapas.descuento);
      if (etapas.final) Object.assign(datosDesempleo, etapas.final);
      sheet.getRange(row, 11).setValue(JSON.stringify(datosDesempleo));
    }

    return JSON.stringify({ status: 'success', message: 'Gestión guardada correctamente.' });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}
