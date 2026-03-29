const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

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
    const url = new URL(webhookUrl);
    url.searchParams.set("action", "list");
    url.searchParams.set("limit", String(limit));

    let response;

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
        items,
        storageMode: "webhook",
        storageAvailable: true
    };
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

async function submitContact(payload, options = {}) {
    const normalizedPayload = normalizePayload(payload);
    const validation = validatePayload(normalizedPayload);

    if (!validation.valid) {
        throw createValidationError(validation.missingFields);
    }

    const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        source: normalizeString(options.source) || "website",
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
    buildProjectSummary,
    getConfiguredWebhookUrl,
    listContactSubmissions,
    normalizePayload,
    submitContact
};
