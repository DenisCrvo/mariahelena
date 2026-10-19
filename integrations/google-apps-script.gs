const SHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA";
const SHEET_NAME = "Confirmacoes";
const MAX_ATTENDEES = 8;

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};
  const nonce = typeof params.nonce === "string" ? params.nonce : "";

  try {
    const name = typeof params.name === "string" ? params.name.trim() : "";
    const attendees = Number(params.attendees);

    if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
      return response_(nonce, false, "O nome informado é inválido.");
    }
    if (!Number.isInteger(attendees) || attendees < 1 || attendees > MAX_ATTENDEES) {
      return response_(nonce, false, "A quantidade de pessoas informada é inválida.");
    }
    if (SHEET_ID === "COLE_AQUI_O_ID_DA_PLANILHA") {
      throw new Error("Configure o ID da planilha no código do Apps Script.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Recebido em", "Nome", "Quantidade de pessoas"]);
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([new Date(), safeCell_(name), attendees]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return response_(nonce, true, "");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return response_(nonce, false, "O serviço não conseguiu registrar sua confirmação. Tente novamente.");
  }
}

function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function response_(nonce, ok, message) {
  const payload = JSON.stringify({
    type: "maria-helena-rsvp",
    nonce: nonce,
    ok: ok,
    message: message
  }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>parent.postMessage(' +
    payload +
    ', "*");</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
