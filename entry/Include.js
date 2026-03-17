/**
 * Función para incluir archivos HTML en plantillas GAS
 * @module entry/Include
 */

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
