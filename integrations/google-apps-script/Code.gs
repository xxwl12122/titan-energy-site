const CONFIG = {
  spreadsheetId: "PASTE_YOUR_SPREADSHEET_ID_HERE",
  sheetName: "submissions",
  token: "CHANGE_ME_TO_A_SECRET_TOKEN"
};

function doGet(e) {
  try {
    const requestToken = getRequestToken(e);
    if (requestToken !== CONFIG.token) {
      return jsonResponse({
        ok: false,
        message: "Unauthorized"
      }, 401);
    }

    const action = getAction(e);
    if (action !== "list") {
      return jsonResponse({
        ok: false,
        message: "Unsupported action"
      }, 400);
    }

    const limit = getLimit(e);
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();

    if (!rows.length) {
      return jsonResponse({
        ok: true,
        items: []
      }, 200);
    }

    const [headers, ...dataRows] = rows;
    const items = dataRows
      .filter(function(row) {
        return row.some(function(cell) {
          return String(cell || "").trim() !== "";
        });
      })
      .map(function(row) {
        const item = {};

        headers.forEach(function(header, index) {
          item[String(header || "").trim()] = row[index] || "";
        });

        item.meta = {
          ip: item.ip || "",
          userAgent: item.userAgent || "",
          referer: item.referer || ""
        };

        delete item.ip;
        delete item.userAgent;
        delete item.referer;

        return item;
      })
      .reverse()
      .slice(0, limit);

    return jsonResponse({
      ok: true,
      items: items
    }, 200);
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error && error.message ? error.message : "Unknown error"
    }, 500);
  }
}

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

function getAction(e) {
  if (e && e.parameter && typeof e.parameter.action === "string") {
    return e.parameter.action.trim();
  }

  return "";
}

function getLimit(e) {
  const rawValue = e && e.parameter ? e.parameter.limit : "";
  const parsed = parseInt(rawValue, 10);

  if (!isFinite(parsed) || parsed <= 0) {
    return 100;
  }

  return Math.min(parsed, 200);
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
