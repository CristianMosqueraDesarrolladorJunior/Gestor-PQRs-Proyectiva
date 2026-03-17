/**
 * Repositorio de Usuarios - Acceso a datos de Gestión
 * @module domain/users/UserRepository
 */

/** Mapeo de roles a permisos */
var ROLES_PERMITIDOS = {
  superAdmin: ['Autos', 'Seguro de Contenidos', 'Coordinadora', 'Seguro de Desempleo', 'CorreccionesBI', 'Renovations', 'Seguro de Vida', 'pqr', 'Admin VD', 'Admin PQR', 'Admin Renovations', 'Admin General'],
  adminRenovations: ['CorreccionesBI', 'Renovations', 'Admin Renovations'],
  adminPQR: ['pqr', 'Admin PQR'],
  adminVidaDesempleo: ['Coordinadora', 'Seguro de Desempleo', 'Seguro de Vida', 'Admin VD'],
  pqr: ['pqr']
};

/**
 * Obtiene usuarios según tipo de administrador
 * @param {string} adminType - Tipo de admin (superAdmin, adminPQR, etc.)
 * @returns {Array}
 */
function getUsuariosGestion(adminType) {
  var rolesPermitidos = ROLES_PERMITIDOS[adminType] || [];
  if (rolesPermitidos.length === 0) return [];

  var sheet = getSheet(SheetConfig.GESTION);
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
