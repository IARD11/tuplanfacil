// =============================================================
// TuPlanFácil — Google Apps Script para captura de leads y testimonios
// =============================================================
//
// INSTRUCCIONES DE INSTALACIÓN:
//
// 1. Crea un nuevo Google Sheet. El script creara/actualizara las hojas "Leads" y "Testimonios".
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
const LEADS_SHEET_NAME = "Leads";
const TESTIMONIALS_SHEET_NAME = "Testimonios";

function outputJson(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function publicTestimonials(ss) {
  const sheet = ss.getSheetByName(TESTIMONIALS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return rows
    .reverse()
    .filter((row) => String(row[5]).toLowerCase() === "si" && String(row[6]).toLowerCase() === "publicado")
    .map((row) => ({
      id: String(row[0].getTime ? row[0].getTime() : row[0]),
      name: row[1] || "Cliente TuPlanFácil",
      context: row[2] || "Cliente TuPlanFácil",
      rating: row[3] || 5,
      comment: row[4] || "",
    }))
    .filter((item) => item.comment)
    .slice(0, 24);
}

// Función de prueba y lectura publica de testimonios
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const p = e && e.parameter ? e.parameter : {};

    if (p.tipo === "testimonios") {
      return outputJson({ status: "ok", testimonials: publicTestimonials(ss) }, p.callback);
    }

    const sheet = getOrCreateSheet(ss, LEADS_SHEET_NAME);
    return outputJson({ status: "ok", sheet: sheet.getName(), rows: sheet.getLastRow() }, p.callback);
  } catch (err) {
    return outputJson({ status: "error", message: err.message }, e && e.parameter ? e.parameter.callback : "");
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const p = e.parameter;

    if (p.tipo === "testimonio") {
      const sheet = getOrCreateSheet(ss, TESTIMONIALS_SHEET_NAME);
      sheet.appendRow([
        new Date(),
        p.nombre || "",
        p.contexto || "",
        p.calificacion || "",
        p.comentario || "",
        p.consentimiento || "",
        p.estado || "Publicado",
      ]);

      return outputJson({ status: "ok", type: "testimonio" });
    }

    const sheet = getOrCreateSheet(ss, LEADS_SHEET_NAME);
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

    return outputJson({ status: "ok", type: "lead" });

  } catch (err) {
    return outputJson({ status: "error", message: err.message });
  }
}

// Ejecuta esta función UNA VEZ para crear los encabezados.
function setupHeaders() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(ss, LEADS_SHEET_NAME);

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

  const testimonials = getOrCreateSheet(ss, TESTIMONIALS_SHEET_NAME);
  testimonials.getRange(1, 1, 1, 7).setValues([[
    "Fecha",
    "Nombre Público",
    "Contexto",
    "Calificación",
    "Comentario",
    "Consentimiento",
    "Estado",
  ]]);

  testimonials.getRange(1, 1, 1, 7).setFontWeight("bold");
  testimonials.setFrozenRows(1);
}
