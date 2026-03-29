const CONFIG = {
  spreadsheetId: "PASTE_YOUR_SPREADSHEET_ID_HERE",
  sheetName: "submissions",
  token: "CHANGE_ME_TO_A_SECRET_TOKEN",
  senderName: "泰坦供能",
  replyTo: "sales@titanenergy.cn",
  notificationRecipients: ["sales@titanenergy.cn"],
  sendInternalNotification: true,
  sendAutoReply: true
};

const DEFAULT_STATUS = "新提交";
const ALLOWED_STATUSES = ["新提交", "已联系", "跟进中", "已完成", "无效线索"];
const HEADERS = [
  "id",
  "createdAt",
  "updatedAt",
  "status",
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
];

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
    const headerMap = ensureSheetHeaders(sheet);
    const rows = getDataRows(sheet);
    const items = rows
      .filter(function(row) {
        return row.some(function(cell) {
          return String(cell || "").trim() !== "";
        });
      })
      .map(function(row) {
        return buildRecordFromRow(row, headerMap);
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

    const action = getAction(e);
    if (action === "updateStatus") {
      return handleStatusUpdate(e);
    }

    const payload = parsePayload(e);
    const sheet = getSheet();
    const headerMap = ensureSheetHeaders(sheet);
    const record = buildSubmissionRecord(payload);

    appendRecord(sheet, record, headerMap);

    const mailWarnings = sendSubmissionEmails(record);

    return jsonResponse({
      ok: true,
      message: "Saved to Google Sheets",
      item: record,
      mailWarnings: mailWarnings
    }, 200);
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error && error.message ? error.message : "Unknown error"
    }, 500);
  }
}

function handleStatusUpdate(e) {
  const payload = parsePayload(e);
  const id = normalizeString(payload.id);
  const status = normalizeStatus(payload.status);

  if (!id) {
    return jsonResponse({
      ok: false,
      message: "Missing submission id"
    }, 400);
  }

  if (!status) {
    return jsonResponse({
      ok: false,
      message: "Invalid submission status"
    }, 400);
  }

  const sheet = getSheet();
  const headerMap = ensureSheetHeaders(sheet);
  const rowIndex = findRowIndexById(sheet, headerMap, id);

  if (!rowIndex) {
    return jsonResponse({
      ok: false,
      message: "Submission not found"
    }, 404);
  }

  const updatedAt = new Date().toISOString();
  const rowValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  rowValues[headerMap.status] = status;
  rowValues[headerMap.updatedAt] = updatedAt;

  sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

  return jsonResponse({
    ok: true,
    message: "Submission status updated",
    item: buildRecordFromRow(rowValues, headerMap)
  }, 200);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
  }

  return sheet;
}

function ensureSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return buildHeaderMap(HEADERS);
  }

  const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const normalizedHeaders = headerRow.map(function(cell) {
    return normalizeString(cell);
  });
  const missingHeaders = HEADERS.filter(function(header) {
    return normalizedHeaders.indexOf(header) === -1;
  });

  if (missingHeaders.length) {
    sheet.getRange(1, normalizedHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    return buildHeaderMap(normalizedHeaders.concat(missingHeaders));
  }

  return buildHeaderMap(normalizedHeaders);
}

function buildHeaderMap(headers) {
  return headers.reduce(function(result, header, index) {
    result[header] = index;
    return result;
  }, {});
}

function getDataRows(sheet) {
  if (sheet.getLastRow() <= 1) {
    return [];
  }

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function buildSubmissionRecord(payload) {
  const meta = payload.meta || {};
  const createdAt = normalizeString(payload.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(payload.updatedAt) || createdAt;

  return {
    id: normalizeString(payload.id),
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: normalizeStatus(payload.status) || DEFAULT_STATUS,
    source: normalizeString(payload.source) || "website",
    deviceType: normalizeString(payload.deviceType),
    projectStage: normalizeString(payload.projectStage),
    peakCurrent: normalizeString(payload.peakCurrent),
    temperatureRange: normalizeString(payload.temperatureRange),
    serviceCycle: normalizeString(payload.serviceCycle),
    contact: normalizeString(payload.contact),
    projectBrief: normalizeString(payload.projectBrief),
    summary: normalizeString(payload.summary),
    meta: {
      ip: normalizeString(meta.ip),
      userAgent: normalizeString(meta.userAgent),
      referer: normalizeString(meta.referer)
    }
  };
}

function buildRecordFromRow(row, headerMap) {
  return {
    id: readRowValue(row, headerMap.id),
    createdAt: readRowValue(row, headerMap.createdAt),
    updatedAt: readRowValue(row, headerMap.updatedAt) || readRowValue(row, headerMap.createdAt),
    status: normalizeStatus(readRowValue(row, headerMap.status)) || DEFAULT_STATUS,
    source: readRowValue(row, headerMap.source) || "website",
    deviceType: readRowValue(row, headerMap.deviceType),
    projectStage: readRowValue(row, headerMap.projectStage),
    peakCurrent: readRowValue(row, headerMap.peakCurrent),
    temperatureRange: readRowValue(row, headerMap.temperatureRange),
    serviceCycle: readRowValue(row, headerMap.serviceCycle),
    contact: readRowValue(row, headerMap.contact),
    projectBrief: readRowValue(row, headerMap.projectBrief),
    summary: readRowValue(row, headerMap.summary),
    meta: {
      ip: readRowValue(row, headerMap.ip),
      userAgent: readRowValue(row, headerMap.userAgent),
      referer: readRowValue(row, headerMap.referer)
    }
  };
}

function appendRecord(sheet, record, headerMap) {
  const row = HEADERS.map(function(header) {
    if (header === "ip") {
      return record.meta.ip;
    }
    if (header === "userAgent") {
      return record.meta.userAgent;
    }
    if (header === "referer") {
      return record.meta.referer;
    }
    return record[header] || "";
  });

  const orderedRow = [];

  Object.keys(headerMap).forEach(function(header) {
    orderedRow[headerMap[header]] = row[HEADERS.indexOf(header)] || "";
  });

  sheet.appendRow(orderedRow);
}

function findRowIndexById(sheet, headerMap, id) {
  const dataRows = getDataRows(sheet);

  for (let index = 0; index < dataRows.length; index += 1) {
    if (readRowValue(dataRows[index], headerMap.id) === id) {
      return index + 2;
    }
  }

  return 0;
}

function readRowValue(row, index) {
  if (typeof index !== "number" || index < 0) {
    return "";
  }

  return normalizeString(row[index]);
}

function parsePayload(e) {
  return JSON.parse((e && e.postData && e.postData.contents) || "{}");
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

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeStatus(status) {
  const normalized = normalizeString(status);
  return ALLOWED_STATUSES.indexOf(normalized) >= 0 ? normalized : "";
}

function authorizeMailApp() {
  return MailApp.getRemainingDailyQuota();
}

function sendSubmissionEmails(record) {
  const warnings = [];
  let remainingQuota = MailApp.getRemainingDailyQuota();
  const internalRecipients = getNotificationRecipients();
  const canSendInternal = CONFIG.sendInternalNotification && internalRecipients.length > 0;
  const contactEmail = isEmailAddress(record.contact) ? record.contact.trim() : "";
  const canSendAutoReply = CONFIG.sendAutoReply && Boolean(contactEmail);

  if (canSendInternal) {
    if (remainingQuota >= internalRecipients.length) {
      try {
        MailApp.sendEmail({
          to: internalRecipients.join(","),
          subject: buildInternalSubject(record),
          body: buildInternalBody(record),
          htmlBody: buildInternalHtml(record),
          name: CONFIG.senderName || "Website Intake",
          replyTo: CONFIG.replyTo || ""
        });
        remainingQuota -= internalRecipients.length;
      } catch (error) {
        warnings.push("internal:" + (error.message || "send failed"));
      }
    } else {
      warnings.push("internal:quota-exceeded");
    }
  }

  if (canSendAutoReply) {
    if (remainingQuota >= 1) {
      try {
        MailApp.sendEmail({
          to: contactEmail,
          subject: buildAutoReplySubject(record),
          body: buildAutoReplyBody(record),
          htmlBody: buildAutoReplyHtml(record),
          name: CONFIG.senderName || "Website Intake",
          replyTo: CONFIG.replyTo || ""
        });
        remainingQuota -= 1;
      } catch (error) {
        warnings.push("auto-reply:" + (error.message || "send failed"));
      }
    } else {
      warnings.push("auto-reply:quota-exceeded");
    }
  }

  return warnings;
}

function getNotificationRecipients() {
  const recipients = Array.isArray(CONFIG.notificationRecipients) ? CONFIG.notificationRecipients : [];
  return recipients
    .map(function(recipient) {
      return String(recipient || "").trim();
    })
    .filter(function(recipient) {
      return isEmailAddress(recipient);
    });
}

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function buildInternalSubject(record) {
  return "[网站咨询] " + (record.deviceType || "新项目咨询");
}

function buildInternalBody(record) {
  return [
    "收到一条新的官网项目咨询。",
    "",
    "当前状态: " + (record.status || DEFAULT_STATUS),
    "",
    record.summary || "暂无摘要",
    "",
    "提交时间: " + (record.createdAt || "未知"),
    "联系人: " + (record.contact || "未填写"),
    "来源: " + (record.source || "website")
  ].join("\n");
}

function buildInternalHtml(record) {
  return [
    "<p>收到一条新的官网项目咨询。</p>",
    "<p><strong>当前状态：</strong>" + escapeHtml(record.status || DEFAULT_STATUS) + "</p>",
    "<pre style=\"white-space:pre-wrap;font-family:monospace\">" + escapeHtml(record.summary || "暂无摘要") + "</pre>",
    "<p><strong>提交时间：</strong>" + escapeHtml(record.createdAt || "未知") + "</p>",
    "<p><strong>联系人：</strong>" + escapeHtml(record.contact || "未填写") + "</p>",
    "<p><strong>来源：</strong>" + escapeHtml(record.source || "website") + "</p>"
  ].join("");
}

function buildAutoReplySubject(record) {
  return "已收到你的项目咨询";
}

function buildAutoReplyBody(record) {
  return [
    "你好，",
    "",
    "我们已经收到你提交的项目咨询，会尽快查看并与你联系。",
    "",
    "你当前的登记状态：",
    record.status || DEFAULT_STATUS,
    "",
    "你刚刚提交的信息摘要：",
    "",
    record.summary || "暂无摘要",
    "",
    "如果你还有补充信息，可以直接回复这封邮件。",
    "",
    "泰坦供能"
  ].join("\n");
}

function buildAutoReplyHtml(record) {
  return [
    "<p>你好，</p>",
    "<p>我们已经收到你提交的项目咨询，会尽快查看并与你联系。</p>",
    "<p><strong>你当前的登记状态：</strong>" + escapeHtml(record.status || DEFAULT_STATUS) + "</p>",
    "<p>你刚刚提交的信息摘要：</p>",
    "<pre style=\"white-space:pre-wrap;font-family:monospace\">" + escapeHtml(record.summary || "暂无摘要") + "</pre>",
    "<p>如果你还有补充信息，可以直接回复这封邮件。</p>",
    "<p>泰坦供能</p>"
  ].join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
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
