/**
 * Punto de entrada: Servir aplicación web
 * @module entry/doGet
 */

/**
 * Sirve la aplicación HTML principal
 * @param {Object} e - Parámetros de la petición GET
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('interface/html/index')
    .evaluate()
    .setTitle('Proyectiva — Gestión General de Leads')
    .setFaviconUrl('https://img.icons8.com/color/48/000000/shield.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
