/**
 * Caso de uso: Autenticar usuario y obtener datos según rol
 * @module application/auth/Authenticate
 */

/**
 * Obtiene datos del usuario activo y datos según su rol (RBAC)
 * @returns {string} JSON con status, userInfo, data, listUsuarios
 */
function getDataUser() {
  try {
    var correoActivo = Session.getActiveUser().getEmail() || '';
    var sheetGestion = getSheet(SheetConfig.GESTION);
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

    var response = {
      status: 'success',
      userInfo: { role: expertise, nombre: nombreAnalista, correo: correoActivo, novedad: novedad },
      data: dataFront,
      listUsuarios: listUsuarios
    };
    if (expertise !== 'superAdmin' && Array.isArray(dataFront)) {
      response = enrichResponseWithMetrics(response, dataFront, expertise);
    } else if (expertise === 'superAdmin' && dataFront && dataFront.metrics) {
      response.metrics = dataFront.metrics;
    }
    return JSON.stringify(response);
  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  }
}

/**
 * Datos consolidados para SuperAdmin
 * @returns {Object}
 */
function getDataForSuperAdmin() {
  var adminPQR = getPQRsData(true, null);
  var adminVD = getVDData(true, null, null);
  var adminRenovations = getRenovationsData(true, null);
  return {
    adminPQR: adminPQR,
    adminVD: adminVD,
    adminRenovations: adminRenovations,
    metrics: computeMetricsForSuperAdmin(adminPQR, adminVD, adminRenovations)
  };
}

/**
 * Calcula métricas agregadas para SuperAdmin (todos los módulos)
 * @param {Array} pqrs - Datos PQR
 * @param {Array} vd - Datos Vida/Desempleo
 * @param {Array} reno - Datos Renovaciones
 * @returns {Object}
 */
function computeMetricsForSuperAdmin(pqrs, vd, reno) {
  var pqrMetrics = computePQRMetrics(pqrs || []);
  var vdMetrics = computeVDMetrics(vd || []);
  var renoMetrics = computeRenovacionesMetrics(reno || []);
  return {
    pqr: pqrMetrics,
    vd: vdMetrics,
    renovaciones: renoMetrics,
    global: {
      totalPQRs: pqrMetrics.total,
      totalLeadsVD: vdMetrics.total,
      totalRenovaciones: renoMetrics.total
    }
  };
}

/**
 * Métricas de PQR
 */
function computePQRMetrics(data) {
  var total = data.length;
  var proceso = 0, resueltas = 0, vencidas = 0;
  var slaMs = 3 * 24 * 60 * 60 * 1000;
  for (var i = 0; i < data.length; i++) {
    var p = data[i];
    var estado = (p.estado || '').toString();
    if (estado === 'En Proceso') proceso++;
    if (estado === 'Resuelto' || estado === 'Cerrado') resueltas++;
    if (estado !== 'Resuelto' && estado !== 'Cerrado') {
      var fecha = p.fechaCreacion ? new Date(p.fechaCreacion).getTime() : 0;
      if (fecha && (Date.now() - fecha) > slaMs) vencidas++;
    }
  }
  var porTipo = { QUEJA: 0, PETICION: 0, RECLAMO: 0, OTRO: 0 };
  for (var j = 0; j < data.length; j++) {
    var t = (data[j].informacion && data[j].informacion.tramite && data[j].informacion.tramite.tipoSolicitud) || 'OTRO';
    porTipo[t] = (porTipo[t] || 0) + 1;
  }
  return { total: total, proceso: proceso, resueltas: resueltas, vencidas: vencidas, porTipo: porTipo };
}

/**
 * Métricas de Vida/Desempleo
 */
function computeVDMetrics(data) {
  var total = data.length;
  var enGestion = 0, ventas = 0, desistidos = 0;
  for (var i = 0; i < data.length; i++) {
    var e = (data[i].estadoGestion || data[i].estado || '').toString().toLowerCase();
    if (e.indexOf('gestión') >= 0 || e === 'en gestion') enGestion++;
    if (e.indexOf('venta') >= 0) ventas++;
    if (e.indexOf('desist') >= 0) desistidos++;
  }
  if (enGestion === 0 && total > 0) enGestion = total;
  var porProducto = {};
  for (var j = 0; j < data.length; j++) {
    var prod = (data[j].productoAsignado || data[j].producto || 'N/A').toString();
    porProducto[prod] = (porProducto[prod] || 0) + 1;
  }
  return { total: total, enGestion: enGestion, ventas: ventas, desistidos: desistidos, porProducto: porProducto };
}

/**
 * Métricas de Renovaciones
 */
function computeRenovacionesMetrics(data) {
  var total = data.length;
  var porVencer = 0, renovadas = 0, vencidas = 0;
  for (var i = 0; i < data.length; i++) {
    var e = (data[i].estadoGestion || data[i].estado || '').toString();
    if (e === 'Pendiente Renovacion') porVencer++;
    if (e === 'Poliza Renovada') renovadas++;
    if (e === 'VENCIDO') vencidas++;
  }
  return { total: total, porVencer: porVencer, renovadas: renovadas, vencidas: vencidas };
}

/**
 * Añade métricas al response según el rol
 */
function enrichResponseWithMetrics(response, data, role) {
  if (!response.metrics) response.metrics = {};
  if (Array.isArray(data)) {
    if (role === 'adminRenovations' || role === 'Renovations') {
      response.metrics.renovaciones = computeRenovacionesMetrics(data);
    } else if (role === 'adminVidaDesempleo' || role === 'Coordinadora' || role === 'Seguro de Vida' || role === 'Seguro de Desempleo') {
      response.metrics.vd = computeVDMetrics(data);
    } else {
      response.metrics.pqr = computePQRMetrics(data);
    }
  }
  return response;
}
