/**
 * Repositorio de PQRs - Acceso a datos
 * @module domain/pqr/PQRRepository
 */

/**
 * Obtiene PQRs según permisos
 * @param {boolean} isAdmin - Si es administrador
 * @param {string|null} correoAsesor - Correo del asesor
 * @returns {Array}
 */
function getPQRsData(isAdmin, correoAsesor) {
  var sheet = getSheet(SheetConfig.PQR);
  var data = sheet.getDataRange().getValues();
  data.shift();

  var pqrs = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var asesor = (row[6] || '').toString().trim();
    if (!isAdmin && asesor.toLowerCase() !== (correoAsesor || '').toLowerCase()) continue;

    pqrs.push({
      rowNumber: i + 2,
      id: row[0],
      tipo: row[1],
      fechaCreacion: row[2],
      informacion: safeJSONParse(row[3], {}),
      estado: row[4] || 'Pendiente',
      prioridad: row[5] || 'Media',
      asesor: asesor || 'Sin Asignar',
      fechaAsignacion: row[7] || '',
      fechaCierre: row[8] || '',
      historial: safeJSONParse(row[9], []),
      sla: row[10] || ''
    });
  }
  pqrs.sort(function(a, b) { return new Date(b.fechaCreacion) - new Date(a.fechaCreacion); });
  return pqrs;
}
