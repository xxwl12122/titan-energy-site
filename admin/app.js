const state = {
    items: [],
    filteredItems: [],
    selectedId: "",
    token: window.localStorage.getItem("titan-admin-token") || "",
    lastErrorCode: "",
    storageMode: "file",
    storageAvailable: false
};

const refreshButton = document.getElementById("refreshButton");
const saveTokenButton = document.getElementById("saveTokenButton");
const clearTokenButton = document.getElementById("clearTokenButton");
const tokenInput = document.getElementById("tokenInput");
const searchInput = document.getElementById("searchInput");
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
    div.textContent = text;
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

function statusClass(code) {
    if (code === "ok") {
        return "status-ok";
    }

    if (code === "error") {
        return "status-error";
    }

    return "status-warn";
}

function setStatus(title, hint, tone = "warn") {
    statusValue.textContent = title;
    statusValue.className = statusClass(tone);
    statusHint.textContent = hint;
}

function buildSearchText(item) {
    return [
        item.deviceType,
        item.projectStage,
        item.contact,
        item.projectBrief,
        item.peakCurrent,
        item.temperatureRange,
        item.serviceCycle
    ].join(" ").toLowerCase();
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
                <strong>${escapeHtml(item.contact || "未填写联系人")}</strong>
                <p>${escapeHtml(`${item.deviceType || "未填写设备类型"} / ${item.projectStage || "未填写项目阶段"}`)}</p>
                <p>${escapeHtml(excerpt.length > 62 ? `${excerpt.slice(0, 62)}...` : excerpt)}</p>
                <time>${escapeHtml(formatDate(item.createdAt))}</time>
            </article>
        `;
    }).join("");

    submissionList.querySelectorAll(".submission-item").forEach((element) => {
        element.addEventListener("click", () => {
            state.selectedId = element.dataset.id || "";
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

    detailCard.innerHTML = `
        <h2>${escapeHtml(item.contact || "未填写联系人")}</h2>
        <p>${escapeHtml(formatDate(item.createdAt))}</p>

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
}

function updateSummary() {
    countValue.textContent = String(state.filteredItems.length);
    latestValue.textContent = state.items.length ? formatDate(state.items[0].createdAt) : "暂无";

    if (state.storageMode === "webhook") {
        storageHint.textContent = state.storageAvailable
            ? "当前正在通过 webhook 读取 Google Sheets 里的提交记录。"
            : "当前环境启用了 webhook，但暂时还没有可读取的数据。";
    } else {
        storageHint.textContent = state.storageAvailable
            ? "当前正在读取本地 contact-submissions.ndjson。"
            : "本地数据文件还不存在，先提交一条表单就会生成。";
    }
}

function applyFilter() {
    const query = (searchInput.value || "").trim().toLowerCase();

    state.filteredItems = state.items.filter((item) => !query || buildSearchText(item).includes(query));

    if (!state.filteredItems.some((item) => item.id === state.selectedId)) {
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
        // Ignore JSON parsing failure and use generic fallback below.
    }

    if (!response.ok) {
        const requestError = new Error(result.message || "读取记录失败。");
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
        state.items = Array.isArray(result.items) ? result.items : [];
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

async function copySelectedDetail() {
    const item = state.items.find((entry) => entry.id === state.selectedId);
    if (!item) {
        return;
    }

    const text = item.summary || JSON.stringify(item, null, 2);
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "已复制";
    window.setTimeout(() => {
        copyButton.textContent = "复制详情";
    }, 1600);
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
copyButton.addEventListener("click", () => {
    copySelectedDetail().catch(() => {
        copyButton.textContent = "复制失败";
        window.setTimeout(() => {
            copyButton.textContent = "复制详情";
        }, 1600);
    });
});

loadSubmissions();
