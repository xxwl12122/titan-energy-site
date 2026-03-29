const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const defaultSubmissionStatus = "新提交";
const allowedSubmissionStatuses = ["新提交", "已联系", "跟进中", "已完成", "无效线索"];
const fieldDefinitions = [
    ["deviceType", "设备类型"],
    ["projectStage", "项目阶段"],
    ["peakCurrent", "峰值电流"],
    ["temperatureRange", "工作温区"],
    ["serviceCycle", "目标续航 / 维护周期"],
    ["contact", "联系邮箱或电话"],
    ["projectBrief", "项目补充说明"]
];

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function getConfiguredWebhookUrl(options = {}) {
    return normalizeString(options.webhookUrl || process.env.CONTACT_WEBHOOK_URL);
}

function normalizeSubmissionStatus(status) {
    const normalized = normalizeString(status);
    return allowedSubmissionStatuses.includes(normalized) ? normalized : "";
}

function normalizeLimit(value, fallback = 50) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return Math.min(parsed, 200);
}

function normalizePayload(payload = {}) {
    const source = payload && typeof payload === "object" ? payload : {};

    return fieldDefinitions.reduce((result, [name]) => {
        result[name] = normalizeString(source[name]);
        return result;
    }, {});
}

function normalizeSubmissionRecord(record = {}) {
    const normalized = normalizePayload(record);
    const createdAt = normalizeString(record.createdAt);
    const updatedAt = normalizeString(record.updatedAt) || createdAt;
    const status = normalizeSubmissionStatus(record.status) || defaultSubmissionStatus;

    return {
        id: normalizeString(record.id),
        createdAt,
        updatedAt,
        source: normalizeString(record.source) || "website",
        status,
        summary: normalizeString(record.summary),
        ...normalized,
        meta: sanitizeRequestMeta(record.meta)
    };
}

function buildProjectSummary(payload) {
    const lines = fieldDefinitions
        .map(([name, label]) => [label, payload[name]])
        .filter(([, value]) => value)
        .map(([label, value]) => `${label}: ${value}`);

    return `泰坦供能项目咨询\n\n${lines.join("\n")}\n`;
}

function createValidationError(details) {
    const error = new Error("请先补全设备类型、项目阶段和联系方式。");
    error.code = "VALIDATION_ERROR";
    error.details = details;
    return error;
}

function createStorageError(message, cause) {
    const error = new Error(message);
    error.code = "CONTACT_STORAGE_UNAVAILABLE";
    if (cause) {
        error.cause = cause;
    }
    return error;
}

function createSubmissionStatusError(message) {
    const error = new Error(message);
    error.code = "SUBMISSION_STATUS_INVALID";
    return error;
}

function createSubmissionNotFoundError(id) {
    const error = new Error(`没有找到提交记录：${id}`);
    error.code = "SUBMISSION_NOT_FOUND";
    return error;
}

function validatePayload(payload) {
    const missingFields = [];

    if (!payload.deviceType) {
        missingFields.push("deviceType");
    }
    if (!payload.projectStage) {
        missingFields.push("projectStage");
    }
    if (!payload.contact) {
        missingFields.push("contact");
    }

    return {
        valid: missingFields.length === 0,
        missingFields
    };
}

function sanitizeRequestMeta(requestMeta = {}) {
    return {
        ip: normalizeString(requestMeta.ip),
        userAgent: normalizeString(requestMeta.userAgent),
        referer: normalizeString(requestMeta.referer)
    };
}

function buildWebhookUrl(webhookUrl, params = {}) {
    const url = new URL(webhookUrl);

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        url.searchParams.set(key, String(value));
    });

    return url;
}

async function appendRecordToFile(record, storageDir) {
    const storagePath = path.join(storageDir, "contact-submissions.ndjson");

    try {
        await fs.mkdir(storageDir, { recursive: true });
        await fs.appendFile(storagePath, `${JSON.stringify(record)}\n`, "utf8");
        return {
            storageType: "file",
            storageTarget: storagePath
        };
    } catch (error) {
        if (["EROFS", "EACCES", "EPERM"].includes(error?.code)) {
            throw createStorageError("当前环境无法写入本地表单存储，请配置 CONTACT_WEBHOOK_URL 或改用本地服务运行。", error);
        }

        throw error;
    }
}

async function forwardRecordToWebhook(record, webhookUrl) {
    let response;

    try {
        response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(record)
        });
    } catch (error) {
        const networkError = new Error("表单转发失败，请检查 CONTACT_WEBHOOK_URL 是否可访问。");
        networkError.code = "CONTACT_WEBHOOK_FAILED";
        networkError.cause = error;
        throw networkError;
    }

    if (!response.ok) {
        const webhookError = new Error(`表单转发失败，目标返回 HTTP ${response.status}。`);
        webhookError.code = "CONTACT_WEBHOOK_FAILED";
        throw webhookError;
    }

    return {
        storageType: "webhook",
        storageTarget: webhookUrl
    };
}

async function postWebhookAction(webhookUrl, action, payload) {
    const requestUrl = buildWebhookUrl(webhookUrl, { action });
    let response;

    try {
        response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        const networkError = new Error("操作 webhook 失败，请检查 Google Apps Script 是否已经重新部署。");
        networkError.code = "SUBMISSIONS_WEBHOOK_FAILED";
        networkError.cause = error;
        throw networkError;
    }

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        result = null;
    }

    if (!response.ok || result?.ok === false) {
        const webhookError = new Error(result?.message || `操作 webhook 失败，目标返回 HTTP ${response.status}。`);
        webhookError.code = "SUBMISSIONS_WEBHOOK_FAILED";
        throw webhookError;
    }

    return result;
}

async function persistRecord(record, options = {}) {
    const webhookUrl = getConfiguredWebhookUrl(options);
    const runningOnVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    if (webhookUrl) {
        return forwardRecordToWebhook(record, webhookUrl);
    }

    if (runningOnVercel) {
        throw createStorageError("当前 Vercel 线上环境还没有配置 CONTACT_WEBHOOK_URL，所以表单会自动回退到邮件草稿。");
    }

    const storageDir = options.storageDir;
    if (!storageDir) {
        throw createStorageError("当前环境没有可用的表单存储目标。");
    }

    return appendRecordToFile(record, storageDir);
}

async function fetchSubmissionsFromWebhook(webhookUrl, limit) {
    let response;
    const url = buildWebhookUrl(webhookUrl, {
        action: "list",
        limit
    });

    try {
        response = await fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json"
            }
        });
    } catch (error) {
        const networkError = new Error("读取 webhook 记录失败，请检查 Google Apps Script 是否已经重新部署。");
        networkError.code = "SUBMISSIONS_WEBHOOK_FAILED";
        networkError.cause = error;
        throw networkError;
    }

    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.message || `读取 webhook 记录失败，目标返回 HTTP ${response.status}。`;
        const webhookError = new Error(message);
        webhookError.code = "SUBMISSIONS_WEBHOOK_FAILED";
        throw webhookError;
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];

    return {
        items: items.map((item) => normalizeSubmissionRecord(item)),
        storageMode: "webhook",
        storageAvailable: true
    };
}

async function updateSubmissionStatusInFile(id, status, storageDir) {
    const storagePath = path.join(storageDir, "contact-submissions.ndjson");
    let rawContent = "";

    try {
        rawContent = await fs.readFile(storagePath, "utf8");
    } catch (error) {
        if (error?.code === "ENOENT") {
            throw createSubmissionNotFoundError(id);
        }

        throw error;
    }

    const records = rawContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                return null;
            }
        })
        .filter(Boolean);

    const targetRecord = records.find((record) => normalizeString(record.id) === id);
    if (!targetRecord) {
        throw createSubmissionNotFoundError(id);
    }

    targetRecord.status = status;
    targetRecord.updatedAt = new Date().toISOString();

    await fs.writeFile(
        storagePath,
        `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
        "utf8"
    );

    return normalizeSubmissionRecord(targetRecord);
}

async function updateSubmissionStatusInWebhook(id, status, webhookUrl) {
    const result = await postWebhookAction(webhookUrl, "updateStatus", {
        id,
        status
    });

    const item = result?.item && typeof result.item === "object"
        ? normalizeSubmissionRecord(result.item)
        : null;

    if (!item || item.id !== id || item.status !== status) {
        const webhookError = new Error("Google Apps Script 还没有更新到支持状态回写的版本，请重新粘贴最新版 Code.gs 并重新部署 Web App。");
        webhookError.code = "SUBMISSIONS_WEBHOOK_FAILED";
        throw webhookError;
    }

    return item;
}

async function listContactSubmissions(options = {}) {
    const storageDir = options.storageDir;
    const storagePath = storageDir ? path.join(storageDir, "contact-submissions.ndjson") : "";
    const limit = normalizeLimit(options.limit);
    const webhookUrl = getConfiguredWebhookUrl(options);
    const storageMode = webhookUrl ? "webhook" : "file";

    if (webhookUrl) {
        return fetchSubmissionsFromWebhook(webhookUrl, limit);
    }

    if (!storagePath) {
        return {
            items: [],
            storageMode,
            storageAvailable: false
        };
    }

    let rawContent = "";

    try {
        rawContent = await fs.readFile(storagePath, "utf8");
    } catch (error) {
        if (error?.code === "ENOENT") {
            return {
                items: [],
                storageMode,
                storageAvailable: false
            };
        }

        throw error;
    }

    const items = rawContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                return null;
            }
        })
        .filter(Boolean)
        .map((record) => normalizeSubmissionRecord(record))
        .sort((left, right) => {
            const leftTime = Date.parse(left.createdAt || "");
            const rightTime = Date.parse(right.createdAt || "");
            return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
        })
        .slice(0, limit);

    return {
        items,
        storageMode,
        storageAvailable: true
    };
}

async function updateContactSubmissionStatus(id, status, options = {}) {
    const normalizedId = normalizeString(id);
    const normalizedStatus = normalizeSubmissionStatus(status);
    const webhookUrl = getConfiguredWebhookUrl(options);

    if (!normalizedId) {
        throw createSubmissionStatusError("缺少提交 ID，无法更新状态。");
    }

    if (!normalizedStatus) {
        throw createSubmissionStatusError(`状态无效，请使用：${allowedSubmissionStatuses.join(" / ")}`);
    }

    if (webhookUrl) {
        return updateSubmissionStatusInWebhook(normalizedId, normalizedStatus, webhookUrl);
    }

    const storageDir = options.storageDir;
    if (!storageDir) {
        throw createStorageError("当前环境没有可用的表单存储目标。");
    }

    return updateSubmissionStatusInFile(normalizedId, normalizedStatus, storageDir);
}

async function submitContact(payload, options = {}) {
    const normalizedPayload = normalizePayload(payload);
    const validation = validatePayload(normalizedPayload);

    if (!validation.valid) {
        throw createValidationError(validation.missingFields);
    }

    const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: normalizeString(options.source) || "website",
        status: defaultSubmissionStatus,
        summary: buildProjectSummary(normalizedPayload),
        ...normalizedPayload,
        meta: sanitizeRequestMeta(options.requestMeta)
    };

    const persisted = await persistRecord(record, options);

    return {
        record,
        persisted
    };
}

module.exports = {
    allowedSubmissionStatuses,
    buildProjectSummary,
    defaultSubmissionStatus,
    getConfiguredWebhookUrl,
    listContactSubmissions,
    normalizePayload,
    submitContact,
    updateContactSubmissionStatus
};
