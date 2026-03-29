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
    const record = {
      id: payload.id || "",
      createdAt: payload.createdAt || "",
      source: payload.source || "",
      deviceType: payload.deviceType || "",
      projectStage: payload.projectStage || "",
      peakCurrent: payload.peakCurrent || "",
      temperatureRange: payload.temperatureRange || "",
      serviceCycle: payload.serviceCycle || "",
      contact: payload.contact || "",
      projectBrief: payload.projectBrief || "",
      summary: payload.summary || "",
      meta: {
        ip: meta.ip || "",
        userAgent: meta.userAgent || "",
        referer: meta.referer || ""
      }
    };

    sheet.appendRow([
      record.id,
      record.createdAt,
      record.source,
      record.deviceType,
      record.projectStage,
      record.peakCurrent,
      record.temperatureRange,
      record.serviceCycle,
      record.contact,
      record.projectBrief,
      record.summary,
      record.meta.ip,
      record.meta.userAgent,
      record.meta.referer
    ]);

    const mailWarnings = sendSubmissionEmails(record);

    return jsonResponse({
      ok: true,
      message: "Saved to Google Sheets",
      mailWarnings: mailWarnings
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
        warnings.push(`internal:${error.message || "send failed"}`);
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
        warnings.push(`auto-reply:${error.message || "send failed"}`);
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
