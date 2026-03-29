const { listContactSubmissions, submitContact, updateContactSubmissionStatus } = require("./contact-service");

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
    if (Buffer.isBuffer(req.body)) {
        return parseJson(req.body.toString("utf8"));
    }

    if (req.body && typeof req.body === "object") {
        return req.body;
    }

    if (typeof req.body === "string") {
        return parseJson(req.body);
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    if (!chunks.length) {
        return {};
    }

    return parseJson(Buffer.concat(chunks).toString("utf8"));
}

function parseJson(rawBody) {
    const trimmedBody = typeof rawBody === "string" ? rawBody.trim() : "";

    if (!trimmedBody) {
        return {};
    }

    try {
        return JSON.parse(trimmedBody);
    } catch (error) {
        const invalidJsonError = new Error("请求体不是合法 JSON。");
        invalidJsonError.code = "INVALID_JSON";
        invalidJsonError.cause = error;
        throw invalidJsonError;
    }
}

function getRequestMeta(req) {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === "string"
            ? forwardedFor.split(",")[0]
            : req.socket?.remoteAddress || "";

    return {
        ip,
        userAgent: req.headers["user-agent"] || "",
        referer: req.headers.referer || req.headers.referrer || ""
    };
}

function isLoopbackIp(ip = "") {
    return ip === "::1"
        || ip === "127.0.0.1"
        || ip === "::ffff:127.0.0.1"
        || ip.startsWith("::ffff:127.0.0.");
}

function readAdminToken(req) {
    const authHeader = req.headers.authorization || "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        return authHeader.slice("Bearer ".length).trim();
    }

    const headerToken = req.headers["x-admin-token"];
    if (typeof headerToken === "string") {
        return headerToken.trim();
    }

    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const queryToken = requestUrl.searchParams.get("token");
    return typeof queryToken === "string" ? queryToken.trim() : "";
}

function ensureAdminAccess(req) {
    const expectedToken = (process.env.ADMIN_TOKEN || "").trim();
    const { ip } = getRequestMeta(req);

    if (!expectedToken) {
        if (isLoopbackIp(ip)) {
            return {
                accessMode: "local"
            };
        }

        const error = new Error("当前管理接口只允许本机访问；如果要在线上访问，请先配置 ADMIN_TOKEN。");
        error.code = "ADMIN_LOCAL_ONLY";
        throw error;
    }

    const providedToken = readAdminToken(req);
    if (providedToken && providedToken === expectedToken) {
        return {
            accessMode: "token"
        };
    }

    const error = new Error("管理口令不正确，请重新输入。");
    error.code = "ADMIN_UNAUTHORIZED";
    throw error;
}

function mapError(error) {
    if (error?.code === "VALIDATION_ERROR") {
        return {
            statusCode: 400,
            payload: {
                ok: false,
                message: error.message,
                missingFields: error.details || []
            }
        };
    }

    if (error?.code === "INVALID_JSON") {
        return {
            statusCode: 400,
            payload: {
                ok: false,
                message: "请求格式不正确，请刷新页面后重试。"
            }
        };
    }

    if (error?.code === "CONTACT_WEBHOOK_FAILED") {
        return {
            statusCode: 502,
            payload: {
                ok: false,
                message: "表单已到达站点，但转发到目标服务失败，请稍后重试。"
            }
        };
    }

    if (error?.code === "SUBMISSIONS_WEBHOOK_FAILED") {
        return {
            statusCode: 502,
            payload: {
                ok: false,
                message: error.message
            }
        };
    }

    if (error?.code === "SUBMISSION_STATUS_INVALID") {
        return {
            statusCode: 400,
            payload: {
                ok: false,
                message: error.message
            }
        };
    }

    if (error?.code === "SUBMISSION_NOT_FOUND") {
        return {
            statusCode: 404,
            payload: {
                ok: false,
                message: error.message
            }
        };
    }

    if (error?.code === "CONTACT_STORAGE_UNAVAILABLE") {
        return {
            statusCode: 503,
            payload: {
                ok: false,
                message: error.message
            }
        };
    }

    if (error?.code === "ADMIN_UNAUTHORIZED") {
        return {
            statusCode: 401,
            payload: {
                ok: false,
                code: error.code,
                message: error.message
            }
        };
    }

    if (error?.code === "ADMIN_LOCAL_ONLY") {
        return {
            statusCode: 403,
            payload: {
                ok: false,
                code: error.code,
                message: error.message
            }
        };
    }

    return {
        statusCode: 500,
        payload: {
            ok: false,
            message: "服务器暂时不可用，请稍后重试。"
        }
    };
}

async function handleContactRequest(req, res, options = {}) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return sendJson(res, 405, {
            ok: false,
            message: "只支持 POST 提交。"
        });
    }

    try {
        const payload = await readJsonBody(req);
        const result = await submitContact(payload, {
            ...options,
            requestMeta: getRequestMeta(req)
        });

        return sendJson(res, 200, {
            ok: true,
            message: "项目需求已提交，我们会尽快联系你。",
            submissionId: result.record.id,
            storage: result.persisted.storageType
        });
    } catch (error) {
        const mappedError = mapError(error);
        return sendJson(res, mappedError.statusCode, mappedError.payload);
    }
}

async function handleSubmissionsRequest(req, res, options = {}) {
    if (req.method !== "GET" && req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return sendJson(res, 405, {
            ok: false,
            message: "只支持 GET 读取和 POST 更新。"
        });
    }

    try {
        const access = ensureAdminAccess(req);
        if (req.method === "GET") {
            const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
            const limit = requestUrl.searchParams.get("limit");
            const result = await listContactSubmissions({
                ...options,
                limit
            });

            return sendJson(res, 200, {
                ok: true,
                items: result.items,
                count: result.items.length,
                storageMode: result.storageMode,
                storageAvailable: result.storageAvailable,
                accessMode: access.accessMode
            });
        }

        const payload = await readJsonBody(req);
        const updatedItem = await updateContactSubmissionStatus(payload.id, payload.status, options);

        return sendJson(res, 200, {
            ok: true,
            message: "提交状态已更新。",
            item: updatedItem,
            accessMode: access.accessMode
        });
    } catch (error) {
        const mappedError = mapError(error);
        return sendJson(res, mappedError.statusCode, mappedError.payload);
    }
}

module.exports = {
    handleSubmissionsRequest,
    handleContactRequest,
    sendJson
};
