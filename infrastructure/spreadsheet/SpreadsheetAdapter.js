/**
 * Adapter principal para Google Sheets
 * @module infrastructure/spreadsheet/SpreadsheetAdapter
 */

/**
 * Obtiene una hoja por nombre
 * @param {string} sheetName - Nombre de la hoja
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(sheetName) {
  return SpreadsheetApp.openById(AppConfig.SPREADSHEET_ID).getSheetByName(sheetName);
}
