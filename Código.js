/**
 * BACKEND - PROYECTIVA PQR MANAGER
 * Copia este código en el archivo Code.gs de tu proyecto de Apps Script
 */

const SHEET_ID = 'TU_ID_DE_LA_HOJA_DE_CALCULO'; // Reemplaza con el ID de tu Sheet
const SHEET_NAME = 'PQRs';

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
    pqrData.historial.unshift(nuevaAccion); // Insertar al inicio
    
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

// 4. Obtener Lista de Asesores (Para el modal de asignación)
function getAsesores() {
  // En un entorno real, esto podría venir de otra hoja de configuración
  const asesores = [
    "maria.gaitan@proyectivaseguros.com",
    "carlos.zamora@proyectivaseguros.com",
    "diana.marcela.rojas@proyectivaseguros.com",
    "luisa.herrera@segurosbolivar.com"
  ];
  return JSON.stringify(asesores);
}