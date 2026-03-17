/**
 * Caso de uso: Autorización y CRUD de usuarios
 * @module application/auth/Authorize
 */

/**
 * Crea un nuevo usuario en la matriz de Gestión
 * @param {Object|string} userData - Datos del usuario { nombre, correo, seguro, novedad }
 * @returns {string} JSON con status y message
 */
function createUsuario(userData) {
  try {
    if (typeof userData === 'string') userData = JSON.parse(userData);
    var sheet = getSheet(SheetConfig.GESTION);
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

/**
 * Actualiza la novedad de un usuario
 * @param {string} correo - Correo del usuario
 * @param {string} novedad - Texto de novedad
 * @returns {string} JSON con status y message
 */
function updateUsuarioNovedad(correo, novedad) {
  try {
    var sheet = getSheet(SheetConfig.GESTION);
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

/**
 * Obtiene lista de asesores PQR
 * @returns {string} JSON con status y data (array de { nombre, email })
 */
function getAsesores() {
  try {
    var usuarios = getUsuariosGestion('pqr');
    var asesores = (usuarios || []).map(function(u) { return { nombre: u.nombre, email: u.correo }; });
    return JSON.stringify({ status: 'success', data: asesores });
  } catch (e) {
    return JSON.stringify({ status: 'success', data: [] });
  }
}
