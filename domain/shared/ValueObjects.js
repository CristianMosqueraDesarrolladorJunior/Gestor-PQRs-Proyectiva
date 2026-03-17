/**
 * Objetos de valor y utilidades compartidas del dominio
 * @module domain/shared/ValueObjects
 */

/**
 * Parsea JSON de forma segura
 * @param {string} str - Cadena JSON
 * @param {*} defaultVal - Valor por defecto si falla el parseo
 * @returns {*}
 */
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
