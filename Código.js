/**
 * BACKEND - PROYECTIVA PQR MANAGER
 */

const SHEET_ID = '1_Hi5iunWuSrsT4V2ApWKIka6sdYyz7Mo_atSrz_uxhc';
const SHEET_PQR = SpreadsheetApp.openById(SHEET_ID).getSheetByName('PQRs');
const SHEET_GESTION = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Gestion');
const Leads = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
const correoActivo = Session.getActiveUser().getEmail();




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
  const validarUsuario = SHEET_GESTION.getRange("C2:C").createTextFinder(correoActivo).matchEntireCell(true).ignoreDiacritics(true).findNext();

  if (!validarUsuario) {
    return JSON.stringify({ status: 'error', message: 'Usuario no autorizado para acceder a los PQRs.' });
  }

  const filaUsuario = validarUsuario.getRow();
  const expertise = SHEET_GESTION.getRange(filaUsuario, 4).getDisplayValue();
  const nombreAnalista = SHEET_GESTION.getRange(filaUsuario, 2).getDisplayValue();
  const novedad = SHEET_GESTION.getRange(filaUsuario, 5).getDisplayValue();

  let dataFront = [];

  switch (expertise) {
    case 'pqr':
      dataFront = getPQRsDataForPQR();
      break;
    case 'admin':
      dataFront = getPQRsDataForAdmin();
      break;
    case 'Renovations':
      dataFront = getRenovations();
      break;
    case ('Seguro de Vida' || 'Seguro de Desempleo'):
      dataFront = getSafeLifeProtec();
      break;
    default:
      return JSON.stringify({ status: 'error', message: 'Usuario sin rol definido para acceder a los PQRs.' });
  }
  return dataFront;
}

function getPQRsDataForPQR() {
  try {
    const data = SHEET_PQR.getDataRange().getValues();
    let dataFiltrada = data.filter(row => row[6] && row[6].toString().trim().toLowerCase() === correoActivo.trim().toLowerCase());
    const headers = data.shift(); // Remover cabeceras

    let pqrs = dataFiltrada.map((row, index) => {
      let infoJSON = {};
      let historialJSON = [];

      try { infoJSON = JSON.parse(row[3] || '{}'); } catch (e) { }
      try { historialJSON = JSON.parse(row[9] || '[]'); } catch (e) { }

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

function getPQRsDataForAdmin() {
  try {
    const data = SHEET_PQR.getDataRange().getValues();
    const headers = data.shift(); // Remover cabeceras

    let pqrs = data.map((row, index) => {
      let infoJSON = {};
      let historialJSON = [];

      try { infoJSON = JSON.parse(row[3] || '{}'); } catch (e) { }
      try { historialJSON = JSON.parse(row[9] || '[]'); } catch (e) { }

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

function getSafeLifeProtec() {
  let dataSetPlano = Leads.getRange("A1:O" + Leads.getLastRow()).getDisplayValues();
  let leadsDelAsesor = dataSetPlano.filter(row => row[3] && row[3].toString().trim().toLowerCase() === correoActivo.trim().toLowerCase());

  dataFront = leadsDelAsesor.filter(row => row[5] !== "VENTA" && row[5] !== "DESISTIDO");
  dataGestionada = leadsDelAsesor.filter(row => row[5] === "VENTA" || row[5] === "DESISTIDO");
  let ventas = dataGestionada.filter(row => row[5] === "VENTA")
  kpiventas = ventas.length

  dataFront = dataFront.map(row => {

    const infoTexto = row[2];
    const historiaGestiones = row[7];
    const gestionSeguroVida = row[9];
    const gestionSeguroDesempleo = row[10];
    const leadData = JSON.parse(infoTexto);

    let gestiones = [];
    if (historiaGestiones && String(historiaGestiones).trim() !== "") {
      let cleanHistoryString = String(historiaGestiones).trim();
      if (cleanHistoryString.startsWith(")]}',")) {
        cleanHistoryString = cleanHistoryString.substring(5);
      }
      try {
        gestiones = JSON.parse(cleanHistoryString);
        gestiones = Array.isArray(gestiones) ? gestiones : [gestiones]; // Asegurar que sea un array
      } catch (e) {
        Logger.log("Error parseando historial de gestiones: " + e.message + " Contenido: " + cleanHistoryString);
        gestiones = [];
      }
    }

    const datosVida = JSON.parse(gestionSeguroVida || "{}");
    const datosDesempleo = JSON.parse(gestionSeguroDesempleo || "{}");

    return {
      fechaIngreso: row[0],
      poliza: leadData.poliza || "",
      numeroSolicitud: row[1],
      nombre: leadData.nombre || "",
      id: leadData.id || "",
      telefono: leadData.telefono || "",
      correo: leadData.correo || "",
      ciudad: leadData.ciudad || "",
      direccion: leadData.direccion || "",
      tipoInmueble: leadData.tipoInmueble || "",
      canon: leadData.canon || "",
      fechaRadicacion: leadData.fechaRadicacion || "",
      fechaAprobacion: leadData.fechaAprobacion || "",
      estado: leadData.estado || "",
      asesorAsignado: row[3],
      etapaFunel: row[4],
      estadoGestion: row[5],
      productoAsignado: row[6],
      historiaGestiones: gestiones,
      datosVida: datosVida,
      datosDesempleo: datosDesempleo,
      tipoDocumento: leadData.tipoDocumento,
      cuota: leadData.cuota,
      nombreInmobiliaria: leadData.nombreInmobiliaria
    };
  });

  dataGestionada = dataGestionada.map(row => {
    const infoTexto = row[2];
    const historiaGestiones = row[7];
    const gestionSeguroVida = row[9];
    const gestionSeguroDesempleo = row[10];

    let leadDataGralString = (infoTexto && String(infoTexto).trim() !== "") ? String(infoTexto).trim() : "{}";
    if (leadDataGralString.startsWith(")]}',")) {
      leadDataGralString = leadDataGralString.substring(5);
    }
    let leadData = JSON.parse(leadDataGralString);

    let gestiones = [];
    if (historiaGestiones && String(historiaGestiones).trim() !== "") {
      let cleanHistoryString = String(historiaGestiones).trim();
      if (cleanHistoryString.startsWith(")]}',")) {
        cleanHistoryString = cleanHistoryString.substring(5);
      }
      try {
        gestiones = JSON.parse(cleanHistoryString);
        gestiones = Array.isArray(gestiones) ? gestiones : [gestiones]; // Asegurar que sea un array
      } catch (e) {
        Logger.log("Error parseando historial de gestiones: " + e.message + " Contenido: " + cleanHistoryString);
        gestiones = [];
      }
    }

    const datosVida = JSON.parse(gestionSeguroVida || "{}");
    const datosDesempleo = JSON.parse(gestionSeguroDesempleo || "{}");

    return {
      fechaIngreso: row[0],
      poliza: leadData.poliza || "",
      numeroSolicitud: row[1],
      nombre: leadData.nombre || "",
      id: leadData.id || "",
      telefono: leadData.telefono || "",
      correo: leadData.correo || "",
      ciudad: leadData.ciudad || "",
      direccion: leadData.direccion || "",
      tipoInmueble: leadData.tipoInmueble || "",
      canon: leadData.canon || "",
      fechaRadicacion: leadData.fechaRadicacion || "",
      fechaAprobacion: leadData.fechaAprobacion || "",
      estado: leadData.estado || "",
      asesorAsignado: row[3],
      etapaFunel: row[4],
      estadoGestion: row[5],
      productoAsignado: row[6],
      historiaGestiones: gestiones,
      datosVida: datosVida,
      datosDesempleo: datosDesempleo,
      tipoDocumento: leadData.tipoDocumento,
      cuota: leadData.cuota,
      nombreInmobiliaria: leadData.nombreInmobiliaria
    };
  });
  totalSolicitudes = dataFront.length + dataGestionada.length
}

function getRenovations() {
  const dataSetPlano = DataRenovations.getRange("A1:H" + DataRenovations.getLastRow()).getDisplayValues();

  dataFront = dataSetPlano.filter(row => row[2] && row[2].toString().trim().toLowerCase() === correoActivo.trim().toLowerCase() && (row[3] === "SIN SEGMENTO" || row[3] === "PROPIETARIO" || row[4] === "CORRECCION" || row[4] === "recuperado") && row[4] !== "VENCIDO" && row[4] !== "Caso Especial" && row[4] !== "Enviar a Expedicion" && row[4] !== "Poliza Renovada").map(row => {
    const registro = row[1];
    const historiaGestiones = row[6];
    let datosInquilino = {};
    try {
      let inquilinoRaw = row[7]; // Columna H
      if (inquilinoRaw && inquilinoRaw.trim() !== "") {
        datosInquilino = JSON.parse(inquilinoRaw);
      }
    } catch (e) {
      datosInquilino = { nombre: "Error Datos", identificacion: "" };
    }

    let gestiones = [];
    if (historiaGestiones && String(historiaGestiones).trim() !== "") {
      let cleanHistoryString = String(historiaGestiones).trim();
      if (cleanHistoryString.startsWith(")]}',")) {
        cleanHistoryString = cleanHistoryString.substring(5);
      }
      try {
        gestiones = JSON.parse(cleanHistoryString);
        gestiones = Array.isArray(gestiones) ? gestiones : [gestiones]; // Asegurar que sea un array
      } catch (e) {
        Logger.log("Error parseando historial de gestiones: " + e.message + " Contenido: " + cleanHistoryString);
        gestiones = [];
      }
    }

    let historialGestion = [];
    leadData = parseLeadData(registro)

    if (historiaGestiones !== "") {
      historialGestion = gestiones || [];
    }
    return {
      fechaIngreso: row[0],
      leadData: leadData,
      nombreAgente: row[2],
      etapaFunel: row[3],
      estadoGestion: row[4],
      historialGestiones: historialGestion,
      datosInquilino: datosInquilino
    };
  });

  dataRecuperacion = dataSetPlano.filter(row => row[2] && row[2].toString().trim().toLowerCase() === correoActivo.trim().toLowerCase() && (row[4].toString().trim().toLowerCase() === "vencido" || row[4].toString().trim().toLowerCase() === "No renueva" || row[4].toString().trim().toLowerCase() === "Desistido")
  ).map(row => {
    let leadData = parseLeadData(row[1]);
    return {
      fechaIngreso: row[0],
      leadData: leadData,
      nombreAgente: row[2],
      etapaFunel: row[3],
      estadoGestion: row[4],
    };
  });
};
// 3. Actualizar una PQR (Update / Gestión)
function updatePQR(pqrDataStr) {
  try {
    const pqrData = JSON.parse(pqrDataStr);
    const sheet = SHEET_PQR

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
      if (!pqrData.fechaAsignacion) {
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
    const sheet = SHEET_GESTION
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
    const sheet = SHEET_GESTION;
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
    const sheet = SHEET_GESTION
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