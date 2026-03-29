const submissionStatuses = ["新提交", "已联系", "跟进中", "已完成", "无效线索"];
const defaultSubmissionStatus = submissionStatuses[0];

const state = {
    items: [],
    filteredItems: [],
    selectedId: "",
    token: window.localStorage.getItem("titan-admin-token") || "",
    lastErrorCode: "",
    storageMode: "file",
    storageAvailable: false,
    pendingStatusId: "",
    detailNotice: {
        id: "",
        message: "",
        tone: ""
    }
};

const refreshButton = document.getElementById("refreshButton");
const saveTokenButton = document.getElementById("saveTokenButton");
const clearTokenButton = document.getElementById("clearTokenButton");
const tokenInput = document.getElementById("tokenInput");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const exportButton = document.getElementById("exportButton");
const submissionList = document.getElementById("submissionList");
const detailCard = document.getElementById("detailCard");
const copyButton = document.getElementById("copyButton");
const statusValue = document.getElementById("statusValue");
const statusHint = document.getElementById("statusHint");
const countValue = document.getElementById("countValue");
const latestValue = document.getElementById("latestValue");
const storageHint = document.getElementById("storageHint");

if (tokenInput) {
    tokenInput.value = state.token;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
}

function formatDate(value) {
    if (!value) {
        return "暂无";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("zh-CN", {
        hour12: false
    });
}

function normalizeSubmissionStatus(status) {
    return submissionStatuses.includes(status) ? status : defaultSubmissionStatus;
}

function normalizeItem(item = {}) {
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};

    return {
        ...item,
        status: normalizeSubmissionStatus(item.status),
        updatedAt: item.updatedAt || item.createdAt || "",
        meta: {
            ip: meta.ip || "",
            userAgent: meta.userAgent || "",
            referer: meta.referer || ""
        }
    };
}

function statusClass(code) {
    if (code === "ok") {
        return "status-ok";
    }

    if (code === "error") {
        return "status-error";
    }

    return "status-warn";
}

function getStatusTone(status) {
    if (status === "已联系") {
        return "contacted";
    }

    if (status === "跟进中") {
        return "progress";
    }

    if (status === "已完成") {
        return "done";
    }

    if (status === "无效线索") {
        return "invalid";
    }

    return "new";
}

function renderStatusPill(status) {
    const normalized = normalizeSubmissionStatus(status);
    const tone = getStatusTone(normalized);
    return `<span class="status-pill status-pill--${tone}">${escapeHtml(normalized)}</span>`;
}

function setStatus(title, hint, tone = "warn") {
    statusValue.textContent = title;
    statusValue.className = statusClass(tone);
    statusHint.textContent = hint;
}

function setDetailNotice(id, message = "", tone = "") {
    state.detailNotice = {
        id,
        message,
        tone
    };
}

function clearDetailNotice(id = "") {
    if (!state.detailNotice.message) {
        return;
    }

    if (!id || state.detailNotice.id === id) {
        setDetailNotice("", "", "");
    }
}

function buildSearchText(item) {
    return [
        item.status,
        item.deviceType,
        item.projectStage,
        item.contact,
        item.projectBrief,
        item.peakCurrent,
        item.temperatureRange,
        item.serviceCycle,
        item.summary
    ].join(" ").toLowerCase();
}

function buildStatusOptions(selectedStatus) {
    const currentStatus = normalizeSubmissionStatus(selectedStatus);
    return submissionStatuses.map((status) => (
        `<option value="${escapeHtml(status)}"${status === currentStatus ? " selected" : ""}>${escapeHtml(status)}</option>`
    )).join("");
}

function renderList() {
    if (!state.filteredItems.length) {
        submissionList.innerHTML = '<div class="empty-state">当前没有匹配的提交记录。</div>';
        renderDetail(null);
        return;
    }

    submissionList.innerHTML = state.filteredItems.map((item) => {
        const excerpt = item.projectBrief || item.summary || "未填写补充说明";
        return `
            <article class="submission-item ${item.id === state.selectedId ? "is-active" : ""}" data-id="${escapeHtml(item.id)}">
                <div class="submission-item-head">
                    <strong>${escapeHtml(item.contact || "未填写联系人")}</strong>
                    ${renderStatusPill(item.status)}
                </div>
                <p>${escapeHtml(`${item.deviceType || "未填写设备类型"} / ${item.projectStage || "未填写项目阶段"}`)}</p>
                <p>${escapeHtml(excerpt.length > 62 ? `${excerpt.slice(0, 62)}...` : excerpt)}</p>
                <time>${escapeHtml(formatDate(item.createdAt))}</time>
            </article>
        `;
    }).join("");

    submissionList.querySelectorAll(".submission-item").forEach((element) => {
        element.addEventListener("click", () => {
            const nextId = element.dataset.id || "";
            if (nextId !== state.selectedId) {
                clearDetailNotice(state.selectedId);
            }
            state.selectedId = nextId;
            renderList();
        });
    });

    const activeItem = state.filteredItems.find((item) => item.id === state.selectedId) || state.filteredItems[0];
    if (activeItem && activeItem.id !== state.selectedId) {
        state.selectedId = activeItem.id;
        renderList();
        return;
    }

    renderDetail(activeItem);
}

function renderDetail(item) {
    copyButton.disabled = !item;

    if (!item) {
        detailCard.innerHTML = '<div class="empty-state">选择左侧一条提交后，这里会显示完整信息。</div>';
        return;
    }

    const meta = item.meta || {};
    const summary = item.summary || "暂无摘要";
    const currentStatus = normalizeSubmissionStatus(item.status);
    const notice = state.detailNotice.id === item.id ? state.detailNotice : null;
    const saveButtonDisabled = state.pendingStatusId === item.id ? " disabled" : "";

    detailCard.innerHTML = `
        <div class="detail-header">
            <div>
                <h2>${escapeHtml(item.contact || "未填写联系人")}</h2>
                <p>${escapeHtml(formatDate(item.createdAt))}</p>
            </div>
            ${renderStatusPill(currentStatus)}
        </div>

        <section class="detail-section">
            <div class="detail-section-head">
                <h3>跟进状态</h3>
            </div>
            <div class="status-editor">
                <select id="statusEditor" aria-label="编辑提交状态">
                    ${buildStatusOptions(currentStatus)}
                </select>
                <button id="saveStatusButton" class="secondary-button" type="button"${saveButtonDisabled}>
                    ${state.pendingStatusId === item.id ? "保存中..." : "保存状态"}
                </button>
            </div>
            <p class="status-meta">最后更新：${escapeHtml(formatDate(item.updatedAt || item.createdAt))}</p>
            <p class="status-feedback"${notice?.tone ? ` data-tone="${escapeHtml(notice.tone)}"` : ""}>${escapeHtml(notice?.message || "修改状态后会同步写回后台和 Google Sheets。")}</p>
        </section>

        <div class="detail-grid">
            <article class="meta-card">
                <span>设备类型</span>
                <strong>${escapeHtml(item.deviceType || "未填写")}</strong>
            </article>
            <article class="meta-card">
                <span>项目阶段</span>
                <strong>${escapeHtml(item.projectStage || "未填写")}</strong>
            </article>
            <article class="meta-card">
                <span>峰值电流</span>
                <strong>${escapeHtml(item.peakCurrent || "未填写")}</strong>
            </article>
            <article class="meta-card">
                <span>工作温区</span>
                <strong>${escapeHtml(item.temperatureRange || "未填写")}</strong>
            </article>
            <article class="meta-card">
                <span>维护周期</span>
                <strong>${escapeHtml(item.serviceCycle || "未填写")}</strong>
            </article>
            <article class="meta-card">
                <span>来源</span>
                <strong>${escapeHtml(item.source || "website")}</strong>
            </article>
        </div>

        <section class="detail-section">
            <h3>项目补充说明</h3>
            <pre>${escapeHtml(item.projectBrief || "未填写项目补充说明")}</pre>
        </section>

        <section class="detail-section">
            <h3>自动摘要</h3>
            <pre>${escapeHtml(summary)}</pre>
        </section>

        <section class="detail-section">
            <h3>请求元信息</h3>
            <ul>
                <li>提交 ID：${escapeHtml(item.id || "未知")}</li>
                <li>来源 IP：${escapeHtml(meta.ip || "未知")}</li>
                <li>User-Agent：${escapeHtml(meta.userAgent || "未知")}</li>
                <li>Referer：${escapeHtml(meta.referer || "未知")}</li>
            </ul>
        </section>
    `;

    const statusEditor = document.getElementById("statusEditor");
    const saveStatusButton = document.getElementById("saveStatusButton");

    if (saveStatusButton && statusEditor) {
        saveStatusButton.addEventListener("click", () => {
            updateSelectedStatus(statusEditor.value).catch(() => {
                // Errors are handled inside updateSelectedStatus.
            });
        });
    }
}

function updateSummary() {
    countValue.textContent = `${state.filteredItems.length} / ${state.items.length}`;
    latestValue.textContent = state.items.length ? formatDate(state.items[0].createdAt) : "暂无";

    if (state.storageMode === "webhook") {
        storageHint.textContent = state.storageAvailable
            ? "当前正在通过 webhook 读取 Google Sheets 里的提交记录，状态修改也会同步回表格。"
            : "当前环境启用了 webhook，但暂时还没有可读取的数据。";
    } else {
        storageHint.textContent = state.storageAvailable
            ? "当前正在读取本地 contact-submissions.ndjson，状态修改会直接回写文件。"
            : "本地数据文件还不存在，先提交一条表单就会生成。";
    }
}

function applyFilter() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const selectedStatus = (statusFilter?.value || "").trim();

    state.filteredItems = state.items.filter((item) => {
        if (selectedStatus && normalizeSubmissionStatus(item.status) !== selectedStatus) {
            return false;
        }

        return !query || buildSearchText(item).includes(query);
    });

    if (!state.filteredItems.some((item) => item.id === state.selectedId)) {
        clearDetailNotice(state.selectedId);
        state.selectedId = state.filteredItems[0]?.id || "";
    }

    updateSummary();
    renderList();
}

async function fetchSubmissions() {
    const headers = {};
    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch("/api/submissions?limit=100", {
        headers
    });

    let result = {};
    try {
        result = await response.json();
    } catch (error) {
        result = {};
    }

    if (!response.ok) {
        const requestError = new Error(result.message || "读取记录失败。");
        requestError.status = response.status;
        requestError.code = result.code || "";
        throw requestError;
    }

    return result;
}

async function requestStatusUpdate(id, status) {
    const headers = {
        "content-type": "application/json"
    };

    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch("/api/submissions", {
        method: "POST",
        headers,
        body: JSON.stringify({
            id,
            status
        })
    });

    let result = {};
    try {
        result = await response.json();
    } catch (error) {
        result = {};
    }

    if (!response.ok) {
        const requestError = new Error(result.message || "更新状态失败。");
        requestError.status = response.status;
        requestError.code = result.code || "";
        throw requestError;
    }

    return result;
}

async function loadSubmissions() {
    setStatus("连接中...", "正在读取后台记录。");

    try {
        const result = await fetchSubmissions();
        state.items = Array.isArray(result.items) ? result.items.map((item) => normalizeItem(item)) : [];
        state.storageMode = result.storageMode || "file";
        state.storageAvailable = Boolean(result.storageAvailable);
        state.lastErrorCode = "";

        if (!state.items.length) {
            setStatus("后台已连接", "目前还没有提交记录，可以先去官网提交一条测试表单。", "ok");
        } else {
            setStatus("后台已连接", `最近成功读取 ${state.items.length} 条提交记录。`, "ok");
        }

        applyFilter();
    } catch (error) {
        state.items = [];
        state.filteredItems = [];
        state.selectedId = "";
        state.lastErrorCode = error.code || "";
        updateSummary();
        renderList();

        if (error.code === "ADMIN_UNAUTHORIZED") {
            setStatus("需要管理口令", error.message, "warn");
            detailCard.innerHTML = '<div class="empty-state">请输入正确的 ADMIN_TOKEN 后再刷新列表。</div>';
            return;
        }

        if (error.code === "ADMIN_LOCAL_ONLY") {
            setStatus("仅限本机访问", error.message, "warn");
            detailCard.innerHTML = '<div class="empty-state">如果你想在线上查看，请在部署平台配置 ADMIN_TOKEN。</div>';
            return;
        }

        if (error.message && error.message.includes("Google Apps Script")) {
            setStatus("需要更新表格脚本", error.message, "warn");
            detailCard.innerHTML = '<div class="empty-state">表单已经能写入 Google Sheets，但读取接口还没启用。请把最新 Apps Script 代码重新粘贴并重新部署一次。</div>';
            return;
        }

        setStatus("读取失败", error.message || "后台暂时不可用，请稍后重试。", "error");
        detailCard.innerHTML = '<div class="empty-state">暂时无法读取提交记录，请检查后端服务是否正在运行。</div>';
    }
}

async function updateSelectedStatus(nextStatus) {
    const item = state.items.find((entry) => entry.id === state.selectedId);
    if (!item) {
        return;
    }

    const normalizedStatus = normalizeSubmissionStatus(nextStatus);
    if (item.status === normalizedStatus) {
        setDetailNotice(item.id, "状态没有变化，不需要保存。");
        renderDetail(item);
        return;
    }

    state.pendingStatusId = item.id;
    setDetailNotice(item.id, "正在保存状态...");
    renderDetail(item);

    try {
        const result = await requestStatusUpdate(item.id, normalizedStatus);
        const updatedItem = normalizeItem(result.item || {
            ...item,
            status: normalizedStatus,
            updatedAt: new Date().toISOString()
        });

        state.items = state.items.map((entry) => (
            entry.id === item.id ? updatedItem : entry
        ));
        state.pendingStatusId = "";
        setDetailNotice(item.id, `状态已更新为“${updatedItem.status}”。`, "success");
        setStatus("后台已连接", "提交状态已成功保存。", "ok");
        applyFilter();
    } catch (error) {
        state.pendingStatusId = "";
        setDetailNotice(item.id, error.message || "状态更新失败，请稍后重试。", "error");

        if (error.code === "ADMIN_UNAUTHORIZED") {
            setStatus("需要管理口令", error.message, "warn");
        } else {
            setStatus("更新失败", error.message || "状态更新失败，请稍后重试。", "error");
        }

        renderDetail(item);
    }
}

function buildCopyText(item) {
    const meta = item.meta || {};

    return [
        `状态: ${item.status || defaultSubmissionStatus}`,
        `联系人: ${item.contact || "未填写"}`,
        `提交时间: ${formatDate(item.createdAt)}`,
        `最后更新: ${formatDate(item.updatedAt || item.createdAt)}`,
        `设备类型: ${item.deviceType || "未填写"}`,
        `项目阶段: ${item.projectStage || "未填写"}`,
        `峰值电流: ${item.peakCurrent || "未填写"}`,
        `工作温区: ${item.temperatureRange || "未填写"}`,
        `维护周期: ${item.serviceCycle || "未填写"}`,
        `来源: ${item.source || "website"}`,
        "",
        "项目补充说明:",
        item.projectBrief || "未填写项目补充说明",
        "",
        "自动摘要:",
        item.summary || "暂无摘要",
        "",
        `提交 ID: ${item.id || "未知"}`,
        `来源 IP: ${meta.ip || "未知"}`,
        `User-Agent: ${meta.userAgent || "未知"}`,
        `Referer: ${meta.referer || "未知"}`
    ].join("\n");
}

async function copySelectedDetail() {
    const item = state.items.find((entry) => entry.id === state.selectedId);
    if (!item) {
        return;
    }

    await navigator.clipboard.writeText(buildCopyText(item));
    copyButton.textContent = "已复制";
    window.setTimeout(() => {
        copyButton.textContent = "复制详情";
    }, 1600);
}

function csvEscape(value) {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, "\"\"")}"`;
}

function exportFilteredItems() {
    if (!state.filteredItems.length) {
        setStatus("没有可导出的记录", "先调整筛选条件或等待新的表单提交。");
        return;
    }

    const headerRow = [
        "提交ID",
        "提交时间",
        "最后更新",
        "状态",
        "联系人",
        "设备类型",
        "项目阶段",
        "峰值电流",
        "工作温区",
        "维护周期",
        "项目补充说明",
        "自动摘要",
        "来源",
        "来源IP",
        "User-Agent",
        "Referer"
    ];

    const rows = state.filteredItems.map((item) => {
        const meta = item.meta || {};
        return [
            item.id || "",
            item.createdAt || "",
            item.updatedAt || "",
            item.status || defaultSubmissionStatus,
            item.contact || "",
            item.deviceType || "",
            item.projectStage || "",
            item.peakCurrent || "",
            item.temperatureRange || "",
            item.serviceCycle || "",
            item.projectBrief || "",
            item.summary || "",
            item.source || "",
            meta.ip || "",
            meta.userAgent || "",
            meta.referer || ""
        ];
    });

    const csvContent = [headerRow, ...rows]
        .map((row) => row.map((cell) => csvEscape(cell)).join(","))
        .join("\r\n");

    const blob = new Blob([`\ufeff${csvContent}`], {
        type: "text/csv;charset=utf-8"
    });
    const exportUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = exportUrl;
    link.download = `titan-submissions-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(exportUrl);

    setStatus("导出完成", `已导出 ${state.filteredItems.length} 条提交记录。`, "ok");
}

refreshButton.addEventListener("click", loadSubmissions);
saveTokenButton.addEventListener("click", () => {
    state.token = (tokenInput.value || "").trim();
    if (state.token) {
        window.localStorage.setItem("titan-admin-token", state.token);
    } else {
        window.localStorage.removeItem("titan-admin-token");
    }
    loadSubmissions();
});

clearTokenButton.addEventListener("click", () => {
    state.token = "";
    tokenInput.value = "";
    window.localStorage.removeItem("titan-admin-token");
    loadSubmissions();
});

searchInput.addEventListener("input", applyFilter);
statusFilter?.addEventListener("change", applyFilter);
exportButton?.addEventListener("click", exportFilteredItems);
copyButton.addEventListener("click", () => {
    copySelectedDetail().catch(() => {
        copyButton.textContent = "复制失败";
        window.setTimeout(() => {
            copyButton.textContent = "复制详情";
        }, 1600);
    });
});

loadSubmissions();
