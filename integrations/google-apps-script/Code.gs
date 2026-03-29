const CONFIG = {
  spreadsheetId: "PASTE_YOUR_SPREADSHEET_ID_HERE",
  sheetName: "submissions",
  token: "CHANGE_ME_TO_A_SECRET_TOKEN"
};

function doPost(e) {
  try {
    const requestToken = getRequestToken(e);
    if (requestToken !== CONFIG.token) {
      return jsonResponse({
        ok: false,
        message: "Unauthorized"
      }, 401);
    }

    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sheet = getSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "id",
        "createdAt",
        "source",
        "deviceType",
        "projectStage",
        "peakCurrent",
        "temperatureRange",
        "serviceCycle",
        "contact",
        "projectBrief",
        "summary",
        "ip",
        "userAgent",
        "referer"
      ]);
    }

    const meta = payload.meta || {};

    sheet.appendRow([
      payload.id || "",
      payload.createdAt || "",
      payload.source || "",
      payload.deviceType || "",
      payload.projectStage || "",
      payload.peakCurrent || "",
      payload.temperatureRange || "",
      payload.serviceCycle || "",
      payload.contact || "",
      payload.projectBrief || "",
      payload.summary || "",
      meta.ip || "",
      meta.userAgent || "",
      meta.referer || ""
    ]);

    return jsonResponse({
      ok: true,
      message: "Saved to Google Sheets"
    }, 200);
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error && error.message ? error.message : "Unknown error"
    }, 500);
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
  }

  return sheet;
}

function getRequestToken(e) {
  if (e && e.parameter && typeof e.parameter.token === "string") {
    return e.parameter.token.trim();
  }

  return "";
}

function jsonResponse(payload, status) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);

  if (typeof output.setHeader === "function") {
    output.setHeader("X-App-Status", String(status));
  }

  return output;
}
