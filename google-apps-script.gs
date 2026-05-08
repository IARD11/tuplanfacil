// =============================================================
// TuPlanFácil — Google Apps Script para captura de leads
// =============================================================
//
// INSTRUCCIONES DE INSTALACIÓN:
//
// 1. Crea un nuevo Google Sheet y renombra la hoja a "Leads".
// 2. En el menú: Extensiones → Apps Script.
// 3. Borra el código por defecto y pega TODO este archivo.
// 4. Guarda (Ctrl+S) con el nombre "TuPlanFacil-Leads".
// 5. Ejecuta la función "setupHeaders" una vez (menú Ejecutar →
//    setupHeaders) para crear los encabezados de columna.
// 6. Despliega como aplicación web:
//    Implementar → Nueva implementación → Tipo: Aplicación web
//    - Ejecutar como: Yo (tu cuenta)
//    - Quién tiene acceso: Cualquier usuario
//    Haz clic en "Implementar" y copia la URL que aparece.
// 7. Pega esa URL en script.js → SITE_CONFIG.sheetsEndpoint
//
// NOTA: Cada vez que modifiques este script debes crear una
// nueva implementación para que los cambios tomen efecto.
// =============================================================

// ID del Google Sheet "TuPlanFácil - Leads" creado en tu Drive
const SHEET_ID = "1kqYCuJf5AW7sDoRqN8tTl944s4MuRidCNjM85GCvsPg";

// Función de prueba — abre esta URL en el navegador para verificar acceso a la hoja
function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", sheet: sheet.getName(), rows: sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();
    const p = e.parameter;

    sheet.appendRow([
      new Date(),
      p.nombre       || "",
      p.telefono     || "",
      p.email        || "",
      p.edad         || "",
      p.region       || "",
      p.sistema      || "",
      p.isapreActual || "",
      p.renta        || "",
      p.cargas       || "",
      p.afp          || "",
      p.comentario   || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Ejecuta esta función UNA VEZ para crear los encabezados.
function setupHeaders() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();

  sheet.getRange(1, 1, 1, 12).setValues([[
    "Fecha",
    "Nombre",
    "Teléfono",
    "Email",
    "Edad",
    "Región",
    "Sistema",
    "Isapre Actual",
    "Renta",
    "Cargas",
    "Asesoría AFP",
    "Comentario",
  ]]);

  sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
  sheet.setFrozenRows(1);
}
