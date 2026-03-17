/**
 * Repositorio de Leads - Acceso a datos Vida/Desempleo y Renovaciones
 * @module domain/leads/LeadRepository
 */

/**
 * Obtiene leads de Vida/Desempleo
 * @param {boolean} isAdmin - Si es administrador
 * @param {string|null} correoAsesor - Correo del asesor
 * @param {string|null} tipoProducto - Tipo de producto (Seguro de Vida, Seguro de Desempleo)
 * @returns {Array}
 */
function getVDData(isAdmin, correoAsesor, tipoProducto) {
  var sheet = getSheet(SheetConfig.LEADS);
  var data = sheet.getDataRange().getDisplayValues();
  data.shift();

  var leads = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var asesor = (row[3] || '').toString().trim();
    var producto = (row[6] || '').toString().trim();

    if (!isAdmin && asesor.toLowerCase() !== (correoAsesor || '').toLowerCase()) continue;
    if (tipoProducto && producto !== tipoProducto) continue;

    var leadData = safeJSONParse(row[2], {});
    var gestiones = safeJSONParse(row[7], []);
    if (!Array.isArray(gestiones)) gestiones = [gestiones];

    leads.push({
      rowNumber: i + 2,
      fechaIngreso: row[0],
      numeroSolicitud: row[1],
      poliza: leadData.poliza || '',
      nombre: leadData.nombre || '',
      id: leadData.id || '',
      telefono: leadData.telefono || '',
      correo: leadData.correo || '',
      ciudad: leadData.ciudad || '',
      direccion: leadData.direccion || '',
      tipoInmueble: leadData.tipoInmueble || '',
      canon: leadData.canon || '',
      fechaRadicacion: leadData.fechaRadicacion || '',
      fechaAprobacion: leadData.fechaAprobacion || '',
      estado: leadData.estado || '',
      asesorAsignado: asesor,
      etapaFunel: row[4],
      estadoGestion: row[5],
      productoAsignado: producto,
      historiaGestiones: gestiones,
      datosVida: safeJSONParse(row[9], {}),
      datosDesempleo: safeJSONParse(row[10], {}),
      tipoDocumento: leadData.tipoDocumento || '',
      cuota: leadData.cuota || '',
      nombreInmobiliaria: leadData.nombreInmobiliaria || '',
      isActive: (row[5] !== 'VENTA' && row[5] !== 'DESISTIDO')
    });
  }
  leads.sort(function(a, b) { return new Date(b.fechaIngreso) - new Date(a.fechaIngreso); });
  return leads;
}

/**
 * Obtiene datos de renovaciones
 * @param {boolean} isAdmin - Si es administrador
 * @param {string|null} correoAsesor - Correo del asesor
 * @returns {Array}
 */
function getRenovationsData(isAdmin, correoAsesor) {
  var sheet = getSheet(SheetConfig.RENOVACIONES);
  if (!sheet) return [];
  var data = sheet.getDataRange().getDisplayValues();
  data.shift();

  var renovaciones = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var asesor = (row[2] || '').toString().trim();
    var segmento = (row[3] || '').toString().trim();
    var estadoGestion = (row[4] || '').toString().trim();

    if (!isAdmin && asesor.toLowerCase() !== (correoAsesor || '').toLowerCase()) continue;
    if (!isAdmin && segmento !== 'SIN SEGMENTO' && segmento !== 'PROPIETARIO' && estadoGestion !== 'CORRECCION' && estadoGestion !== 'recuperado') continue;
    if (!isAdmin && (estadoGestion === 'VENCIDO' || estadoGestion === 'Caso Especial' || estadoGestion === 'Enviar a Expedicion' || estadoGestion === 'Poliza Renovada')) continue;

    renovaciones.push({
      rowNumber: i + 2,
      fechaIngreso: row[0],
      leadData: safeJSONParse(row[1], {}),
      nombreAgente: asesor,
      etapaFunel: segmento,
      estadoGestion: estadoGestion,
      historialGestiones: safeJSONParse(row[6], []),
      datosInquilino: safeJSONParse(row[7], { nombre: 'Sin Datos', identificacion: '' })
    });
  }
  return renovaciones;
}
