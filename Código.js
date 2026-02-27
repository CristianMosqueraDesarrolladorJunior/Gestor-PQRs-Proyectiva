/**
 * PROYECTIVA OS - BACKEND UNIFICADO Y ENRUTAMIENTO RBAC
 * Solo Backend. Optimizado para lectura/escritura de módulos específicos.
 */

const CONFIG = {
  SPREADSHEET_ID: '1HKJdbNqOesORaQuPpbYQhpOkrLX5_kXNhhILuC256iM',
  SHEETS: {
    GESTION: 'Gestion',
    PQR: 'PQRs',
    LEADS: 'Leads',
    RENOVACIONES: 'DataRenovaciones'  // Cambiar a 'JSON' o nombre real de la hoja
  }
};

function getSheet(sheetName) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
}

function safeJSONParse(str, defaultVal) {
  if (defaultVal === undefined) defaultVal = {};
  try {
    if (!str || String(str).trim() === '') return defaultVal;
    var cleanStr = String(str).trim();
    if (cleanStr.indexOf(")]}',") === 0) cleanStr = cleanStr.substring(5);
    return JSON.parse(cleanStr);
  } catch (e) {
    return defaultVal;
  }
}

// =========================================================================
// 1. ENRUTADOR PRINCIPAL
// =========================================================================
function getDataUser() {
  try {
    var correoActivo = Session.getActiveUser().getEmail() || '';
    var sheetGestion = getSheet(CONFIG.SHEETS.GESTION);
    var dataGestion = sheetGestion.getDataRange().getDisplayValues();

    var filaUsuario = -1;
    var expertise, nombreAnalista, novedad;

    for (var i = 1; i < dataGestion.length; i++) {
      var correoCell = (dataGestion[i][2] || '').toString().trim().toLowerCase();
      if (correoCell === correoActivo.trim().toLowerCase()) {
        filaUsuario = i;
        nombreAnalista = (dataGestion[i][1] || '').toString().trim();
        expertise = (dataGestion[i][3] || '').toString().trim();
        novedad = (dataGestion[i][4] || '').toString().trim();
        break;
      }
    }

    if (filaUsuario === -1) {
      return JSON.stringify({ status: 'error', message: 'Usuario no autorizado en matriz de Gestión.' });
    }

    var dataFront = [];
    var listUsuarios = [];

    switch (expertise) {
      case 'superAdmin':
        listUsuarios = getUsuariosGestion(expertise);
        dataFront = getDataForSuperAdmin();
        break;
      case 'adminRenovations':
        listUsuarios = getUsuariosGestion(expertise);
        dataFront = getRenovationsData(true, null);
        break;
      case 'adminPQR':
        listUsuarios = getUsuariosGestion(expertise);
        dataFront = getPQRsData(true, null);
        break;
      case 'adminVidaDesempleo':
      case 'Coordinadora':
        listUsuarios = getUsuariosGestion('adminVidaDesempleo');
        dataFront = getVDData(true, null, null);
        break;
      case 'pqr':
        listUsuarios = getUsuariosGestion('pqr');
        dataFront = getPQRsData(false, correoActivo);
        break;
      case 'Renovations':
        dataFront = getRenovationsData(false, correoActivo);
        break;
      case 'Seguro de Desempleo':
        dataFront = getVDData(false, correoActivo, 'Seguro de Desempleo');
        break;
      case 'Seguro de Vida':
        dataFront = getVDData(false, correoActivo, 'Seguro de Vida');
        break;
      default:
        return JSON.stringify({ status: 'error', message: 'Rol (' + expertise + ') no tiene módulo asignado.' });
    }

    return JSON.stringify({
      status: 'success',
      userInfo: { role: expertise, nombre: nombreAnalista, correo: correoActivo, novedad: novedad },
      data: dataFront,
      listUsuarios: listUsuarios
    });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  }
}

// =========================================================================
// 2. CONSTRUCTOR SUPERADMIN
// =========================================================================
function getDataForSuperAdmin() {
  return {
    adminVD: getVDData(true, null, null),
    adminPQR: getPQRsData(true, null),
    adminRenovations: getRenovationsData(true, null)
  };
}

// =========================================================================
// 3. EXTRACTORES POR MÓDULO
// =========================================================================
function getPQRsData(isAdmin, correoAsesor) {
  var sheet = getSheet(CONFIG.SHEETS.PQR);
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

function getVDData(isAdmin, correoAsesor, tipoProducto) {
  var sheet = getSheet(CONFIG.SHEETS.LEADS);
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

function getRenovationsData(isAdmin, correoAsesor) {
  var sheet = getSheet(CONFIG.SHEETS.RENOVACIONES);
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

// =========================================================================
// 4. GET USUARIOS (Corregido: rolesPermitidos + iteración sobre data)
// =========================================================================
function getUsuariosGestion(adminType) {
  var rolesPermitidos = [];
  switch (adminType) {
    case 'superAdmin':
      rolesPermitidos = ['Autos', 'Seguro de Contenidos', 'Coordinadora', 'Seguro de Desempleo', 'CorreccionesBI', 'Renovations', 'Seguro de Vida', 'pqr', 'Admin VD', 'Admin PQR', 'Admin Renovations', 'Admin General'];
      break;
    case 'adminRenovations':
      rolesPermitidos = ['CorreccionesBI', 'Renovations', 'Admin Renovations'];
      break;
    case 'adminPQR':
      rolesPermitidos = ['pqr', 'Admin PQR'];
      break;
    case 'adminVidaDesempleo':
      rolesPermitidos = ['Coordinadora', 'Seguro de Desempleo', 'Seguro de Vida', 'Admin VD'];
      break;
    case 'pqr':
      rolesPermitidos = ['pqr'];
      break;
    default:
      return [];
  }

  var sheet = getSheet(CONFIG.SHEETS.GESTION);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var usuarios = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rol = (row[3] || '').toString().trim();
    var correo = (row[2] || '').toString().trim();

    if (!correo) continue;
    if (rolesPermitidos.indexOf(rol) === -1) continue;

    usuarios.push({
      rowNumber: i + 1,
      no: row[0],
      nombre: (row[1] || '').toString().trim(),
      correo: correo,
      seguro: rol,
      novedad: (row[4] || '').toString().trim()
    });
  }
  return usuarios;
}

// =========================================================================
// 5. SERVIR APLICACIÓN
// =========================================================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Proyectiva - Gestión de PQRs')
    .setFaviconUrl('https://img.icons8.com/color/48/000000/shield.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =========================================================================
// 6. ACTUALIZACIÓN PQR
// =========================================================================
function updatePQR(pqrDataStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var pqrData = JSON.parse(pqrDataStr);
    var sheet = getSheet(CONFIG.SHEETS.PQR);

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

// =========================================================================
// 7. CRUD USUARIOS
// =========================================================================
function createUsuario(userData) {
  try {
    if (typeof userData === 'string') userData = JSON.parse(userData);
    var sheet = getSheet(CONFIG.SHEETS.GESTION);
    if (!sheet) return JSON.stringify({ status: 'error', message: 'No existe la hoja Gestion.' });
    var data = sheet.getDataRange().getValues();
    var email = (userData.correo || '').toString().trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][2] || '').toString().trim().toLowerCase() === email) {
        return JSON.stringify({ status: 'error', message: 'El correo ya está registrado.' });
      }
    }
    var lastRow = sheet.getLastRow();
    sheet.appendRow([
      lastRow,
      (userData.nombre || '').toString().trim(),
      (userData.correo || '').toString().trim(),
      (userData.seguro || 'pqr').toString().trim(),
      (userData.novedad || '').toString().trim()
    ]);
    return JSON.stringify({ status: 'success', message: 'Usuario creado correctamente.' });
  } catch (e) {
    return JSON.stringify({ status: 'error', message: e.toString() });
  }
}

function updateUsuarioNovedad(correo, novedad) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.GESTION);
    if (!sheet) return JSON.stringify({ status: 'error', message: 'No existe la hoja Gestion.' });
    var data = sheet.getDataRange().getValues();
    var email = (correo || '').toString().trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][2] || '').toString().trim().toLowerCase() === email) {
        sheet.getRange(i + 1, 5).setValue((novedad || '').toString().trim());
        return JSON.stringify({ status: 'success', message: 'Novedad actualizada.' });
      }
    }
    return JSON.stringify({ status: 'error', message: 'Usuario no encontrado.' });
  } catch (e) {
    return JSON.stringify({ status: 'error', message: e.toString() });
  }
}

function getAsesores() {
  try {
    var usuarios = getUsuariosGestion('pqr');
    var asesores = (usuarios || []).map(function(u) { return { nombre: u.nombre, email: u.correo }; });
    return JSON.stringify({ status: 'success', data: asesores });
  } catch (e) {
    return JSON.stringify({ status: 'success', data: [] });
  }
}
