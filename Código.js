/**
 * BACKEND - PROYECTIVA PQR MANAGER
 */

const SHEET_ID = '1_Hi5iunWuSrsT4V2ApWKIka6sdYyz7Mo_atSrz_uxhc';
const SHEET_NAME = 'PQRs';
const SHEET_GESTION = 'Gestion';

// 1. Servir la aplicación Web
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Proyectiva - Gestión de PQRs')
    .setFaviconUrl('https://img.icons8.com/color/48/000000/shield.png') // Icono de escudo/seguro
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 2. Obtener todas las PQRs (Read)
function getPQRs() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remover cabeceras
    
    let pqrs = data.map((row, index) => {
      let infoJSON = {};
      let historialJSON = [];
      
      try { infoJSON = JSON.parse(row[3] || '{}'); } catch(e) {}
      try { historialJSON = JSON.parse(row[9] || '[]'); } catch(e) {}
      
      return {
        rowNumber: index + 2, // Para actualizar la fila exacta luego
        id: row[0],
        tipo: row[1],
        fechaCreacion: row[2],
        informacion: infoJSON,
        estado: row[4] || 'Pendiente',
        prioridad: row[5] || 'Media',
        asesor: row[6] || 'Sin Asignar',
        fechaAsignacion: row[7] || '',
        fechaCierre: row[8] || '',
        historial: historialJSON,
        sla: row[10] || ''
      };
    });
    
    // Ordenar por fecha (más recientes primero)
    pqrs.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    return JSON.stringify({ status: 'success', data: pqrs });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  }
}

// 3. Actualizar una PQR (Update / Gestión)
function updatePQR(pqrDataStr) {
  try {
    const pqrData = JSON.parse(pqrDataStr);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Preparar el nuevo registro para el historial
    const nuevaAccion = {
      fecha: new Date().toISOString(),
      usuario: Session.getActiveUser().getEmail() || 'Usuario Actual',
      accion: pqrData.nuevaAccionTexto,
      estadoAnterior: pqrData.estadoAnterior,
      estadoNuevo: pqrData.estado
    };
    
    // Agregar al historial existente
    const historial = Array.isArray(pqrData.historial) ? pqrData.historial : [];
    historial.unshift(nuevaAccion);
    pqrData.historial = historial;
    
    // Actualizar la hoja (columnas 5 a 10 según el modelo)
    // Estado (E), Prioridad (F), Asesor (G), Fecha Asignación (H), Fecha Cierre (I), Historial (J)
    sheet.getRange(pqrData.rowNumber, 5).setValue(pqrData.estado);
    sheet.getRange(pqrData.rowNumber, 6).setValue(pqrData.prioridad);
    
    // Si se asignó un asesor y antes no tenía
    if (pqrData.asesor !== 'Sin Asignar') {
      sheet.getRange(pqrData.rowNumber, 7).setValue(pqrData.asesor);
      if(!pqrData.fechaAsignacion) {
        sheet.getRange(pqrData.rowNumber, 8).setValue(new Date().toISOString());
      }
    }
    
    // Si se cerró la PQR
    if (pqrData.estado === 'Cerrado' || pqrData.estado === 'Resuelto') {
      sheet.getRange(pqrData.rowNumber, 9).setValue(new Date().toISOString());
    }
    
    // Guardar historial en JSON
    sheet.getRange(pqrData.rowNumber, 10).setValue(JSON.stringify(pqrData.historial));
    
    return JSON.stringify({ status: 'success', message: 'PQR actualizada exitosamente.' });
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  }
}

// 4. Obtener usuarios de la hoja Gestion (para asignación y admin)
function getUsuariosGestion() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GESTION);
    if (!sheet) return JSON.stringify({ status: 'success', data: [] });
    const data = sheet.getDataRange().getValues();
    const usuarios = [];
    for (let i = 1; i < data.length; i++) {
      const correo = (data[i][2] || '').toString().trim();
      if (!correo) continue;
      usuarios.push({
        rowNumber: i + 1,
        no: data[i][0],
        nombre: (data[i][1] || '').toString().trim(),
        correo: correo,
        seguro: (data[i][3] || '').toString().trim(),
        novedad: (data[i][4] || '').toString().trim()
      });
    }
    return JSON.stringify({ status: 'success', data: usuarios });
  } catch (e) {
    return JSON.stringify({ status: 'error', message: e.toString() });
  }
}

// 5. Crear nuevo usuario en Gestion
function createUsuario(userData) {
  try {
    if (typeof userData === 'string') userData = JSON.parse(userData);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_GESTION);
    if (!sheet) return JSON.stringify({ status: 'error', message: 'No existe la hoja Gestion.' });
    const data = sheet.getDataRange().getValues();
    const email = (userData.correo || '').toString().trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      if ((data[i][2] || '').toString().trim().toLowerCase() === email) {
        return JSON.stringify({ status: 'error', message: 'El correo ya está registrado.' });
      }
    }
    const lastRow = sheet.getLastRow();
    const no = lastRow;
    sheet.appendRow([
      no,
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

// 6. Actualizar novedad de un usuario
function updateUsuarioNovedad(correo, novedad) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_GESTION);
    if (!sheet) return JSON.stringify({ status: 'error', message: 'No existe la hoja Gestion.' });
    const data = sheet.getDataRange().getValues();
    const email = (correo || '').toString().trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
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

// 7. Obtener asesores para dropdown (nombre + correo)
function getAsesores() {
  try {
    const res = JSON.parse(getUsuariosGestion());
    if (res.status !== 'success') return JSON.stringify({ status: 'success', data: [] });
    const asesores = (res.data || []).map(u => ({ nombre: u.nombre, email: u.correo }));
    return JSON.stringify({ status: 'success', data: asesores });
  } catch (e) {
    return JSON.stringify({ status: 'success', data: [] });
  }
}