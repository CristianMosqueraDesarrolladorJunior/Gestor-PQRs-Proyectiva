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

/**
 * Datos consolidados para SuperAdmin
 * @returns {Object}
 */
function getDataForSuperAdmin() {
  return {
    adminVD: getVDData(true, null, null),
    adminPQR: getPQRsData(true, null),
    adminRenovations: getRenovationsData(true, null)
  };
}
