const body = document.body;
const topbar = document.querySelector(".topbar");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle-text");
const searchOverlay = document.getElementById("searchOverlay");
const searchCard = document.querySelector(".search-card");
const searchToggle = document.querySelector(".search-toggle");
const searchClose = document.querySelector(".search-close");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("siteSearch");
const searchFeedback = document.getElementById("searchFeedback");
const queryButtons = document.querySelectorAll("[data-query]");
const menuToggle = document.querySelector(".mobile-menu-entry");
const mobilePanel = document.getElementById("mobilePanel");
const mobileDrawer = document.querySelector(".mobile-drawer");
const mobileBackdrop = document.querySelector(".mobile-backdrop");
const mobileClose = document.querySelector(".mobile-close");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const sections = document.querySelectorAll("[data-search]");
const navigationLinks = document.querySelectorAll(".desktop-nav a[href^='#'], .mobile-nav a[href^='#'], .footer-links a[href^='#'], .section-rail-nav a[href^='#']");
const revealTargets = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const yearTarget = document.getElementById("year");
const sectionRail = document.querySelector(".section-rail");
const hero = document.querySelector(".hero");
const heroStage = document.querySelector(".hero-stage");
const heroParallaxTargets = document.querySelectorAll(".hero [data-parallax-speed]");
const magneticButtons = document.querySelectorAll(".nav-cta, .primary-button, .secondary-button, .solid-link, .search-submit");
const breatheTargets = document.querySelectorAll(".metric-card, .technology-panel");
const projectForm = document.getElementById("projectForm");
const projectFormFeedback = document.getElementById("projectFormFeedback");
const projectFormStatus = document.getElementById("projectFormStatus");
const projectCopyButton = document.querySelector(".project-copy-button");
const projectDraftClearButton = document.querySelector(".project-draft-clear");
const customSelects = document.querySelectorAll("[data-custom-select]");
const projectPreviewTitle = document.getElementById("projectPreviewTitle");
const projectPreviewFocusLabel = document.getElementById("projectPreviewFocusLabel");
const projectPreviewFocusText = document.getElementById("projectPreviewFocusText");
const projectPreviewActionLabel = document.getElementById("projectPreviewActionLabel");
const projectPreviewActionText = document.getElementById("projectPreviewActionText");
const projectPreviewPoints = document.getElementById("projectPreviewPoints");
const projectReadinessValue = document.getElementById("projectReadinessValue");
const projectReadinessBar = document.getElementById("projectReadinessBar");
const backToTopButton = document.querySelector(".back-to-top");
const ambientVideos = document.querySelectorAll(".hero-stage video, .scenario-visual video");
const scrollRails = document.querySelectorAll("[data-scroll-rail]");
const spotlightTargets = document.querySelectorAll(".section-surface, .hero-stage, .technology-visual, .process-visual, .scenario-card-featured .scenario-visual");
const depthTargets = document.querySelectorAll(".hero-aura, .hero-stage, .technology-visual, .process-visual, .scenario-card-featured .scenario-visual");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const motionLite = prefersReducedMotion.matches
    || Boolean(connection?.saveData)
    || (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4);
const projectDraftKey = "titan-project-draft";
let searchReturnFocusTarget = null;
let mobileReturnFocusTarget = null;
let projectStatusTimer = null;
let searchFlashTimer = 0;

body.classList.toggle("motion-lite", motionLite);

if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear().toString();
}

const storedTheme = window.localStorage.getItem("titan-theme");
const initialTheme = storedTheme || "dark";

applyTheme(initialTheme);

function applyTheme(theme) {
    body.dataset.theme = theme;
    if (themeColorMeta) {
        themeColorMeta.setAttribute("content", theme === "dark" ? "#0f1724" : "#f3efe7");
    }
    if (themeToggleText) {
        themeToggleText.textContent = theme === "dark" ? "昼" : "夜";
    }
}

themeToggle?.addEventListener("click", () => {
    const nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("titan-theme", nextTheme);
    applyTheme(nextTheme);
});

function syncTopbar() {
    if (!topbar) {
        return;
    }

    topbar.classList.toggle("scrolled", window.scrollY > 12);
}

syncTopbar();
window.addEventListener("scroll", syncTopbar, { passive: true });

function setBodyLock(locked) {
    body.classList.toggle("no-scroll", locked);
}

function openSearch(query = "") {
    if (!searchOverlay) {
        return;
    }

    searchReturnFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : searchToggle;
    searchOverlay.hidden = false;
    setBodyLock(true);
    if (searchInput) {
        searchInput.value = query;
        window.setTimeout(() => searchInput.focus(), 30);
    }
}

function closeSearch() {
    if (!searchOverlay || searchOverlay.hidden) {
        return;
    }

    searchOverlay.hidden = true;
    setBodyLock(Boolean(mobilePanel && !mobilePanel.hidden));
    if (searchFeedback) {
        searchFeedback.textContent = "";
    }
    if (searchReturnFocusTarget instanceof HTMLElement) {
        searchReturnFocusTarget.focus();
    }
}

function openMobilePanel() {
    if (!mobilePanel || !menuToggle) {
        return;
    }

    mobileReturnFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : menuToggle;
    mobilePanel.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    setBodyLock(true);
}

function closeMobilePanel() {
    if (!mobilePanel || !menuToggle || mobilePanel.hidden) {
        return;
    }

    mobilePanel.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    setBodyLock(Boolean(searchOverlay && !searchOverlay.hidden));
    if (mobileReturnFocusTarget instanceof HTMLElement) {
        mobileReturnFocusTarget.focus();
    }
}

function closeCustomSelects(except = null) {
    customSelects.forEach((selectRoot) => {
        if (selectRoot === except) {
            return;
        }

        selectRoot.classList.remove("is-open");
        selectRoot.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "false");
    });
}

function syncCustomSelect(selectRoot) {
    const nativeSelect = selectRoot.querySelector(".custom-select-native");
    const valueElement = selectRoot.querySelector(".custom-select-value");
    const options = selectRoot.querySelectorAll(".custom-select-option");

    if (!nativeSelect || !valueElement) {
        return;
    }

    const selectedOption = nativeSelect.options[nativeSelect.selectedIndex];
    const selectedValue = nativeSelect.value;
    valueElement.textContent = selectedOption?.textContent?.trim() || "";
    selectRoot.classList.toggle("is-placeholder", !selectedValue);

    options.forEach((option) => {
        option.classList.toggle("is-selected", option.dataset.value === selectedValue);
        option.setAttribute("aria-selected", option.dataset.value === selectedValue ? "true" : "false");
    });
}

function setFieldInvalidState(field, invalid) {
    if (!field) {
        return;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.classList.toggle("is-invalid", invalid);
        return;
    }

    const customSelect = field.closest(".custom-select");
    customSelect?.classList.toggle("is-invalid", invalid);
}

function focusProjectField(field) {
    if (!field) {
        return;
    }

    const customSelect = field.closest(".custom-select");

    if (customSelect) {
        closeCustomSelects(customSelect);
        customSelect.classList.add("is-open");
        customSelect.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "true");
        customSelect.querySelector(".custom-select-trigger")?.focus();
        return;
    }

    field.focus();
}

function getFocusableElements(container) {
    if (!container) {
        return [];
    }

    return Array.from(
        container.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((element) => element instanceof HTMLElement && !element.hidden);
}

function trapFocus(event, container) {
    const focusableElements = getFocusableElements(container);
    if (!focusableElements.length) {
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

function moveCustomSelectSelection(selectRoot, direction = 1) {
    const nativeSelect = selectRoot.querySelector(".custom-select-native");
    if (!nativeSelect) {
        return;
    }

    const nextIndex = clamp(nativeSelect.selectedIndex + direction, 0, nativeSelect.options.length - 1);
    nativeSelect.selectedIndex = nextIndex;
    syncCustomSelect(selectRoot);
    nativeSelect.dispatchEvent(new Event("input", { bubbles: true }));
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function validateProjectForm() {
    if (!projectForm) {
        return { valid: true, firstInvalidField: null };
    }

    const requiredFields = [
        projectForm.querySelector('[name="deviceType"]'),
        projectForm.querySelector('[name="projectStage"]'),
        projectForm.querySelector('[name="contact"]')
    ];

    let firstInvalidField = null;

    requiredFields.forEach((field) => {
        const value = typeof field?.value === "string" ? field.value.trim() : "";
        const invalid = !value;
        setFieldInvalidState(field, invalid);

        if (invalid && !firstInvalidField) {
            firstInvalidField = field;
        }
    });

    return {
        valid: !firstInvalidField,
        firstInvalidField
    };
}

customSelects.forEach((selectRoot) => {
    const trigger = selectRoot.querySelector(".custom-select-trigger");
    const nativeSelect = selectRoot.querySelector(".custom-select-native");
    const optionButtons = selectRoot.querySelectorAll(".custom-select-option");
    const menu = selectRoot.querySelector(".custom-select-menu");

    if (!trigger || !nativeSelect || !menu) {
        return;
    }

    const menuId = nativeSelect.name ? `${nativeSelect.name}-menu` : `custom-select-menu-${Math.random().toString(36).slice(2, 8)}`;
    menu.id = menuId;
    trigger.setAttribute("aria-controls", menuId);
    optionButtons.forEach((optionButton) => {
        optionButton.setAttribute("role", "option");
    });

    syncCustomSelect(selectRoot);

    trigger.addEventListener("click", () => {
        const willOpen = !selectRoot.classList.contains("is-open");
        closeCustomSelects(willOpen ? selectRoot : null);
        selectRoot.classList.toggle("is-open", willOpen);
        trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!selectRoot.classList.contains("is-open")) {
                closeCustomSelects(selectRoot);
                selectRoot.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
            }
            moveCustomSelectSelection(selectRoot, event.key === "ArrowDown" ? 1 : -1);
        }

        if ((event.key === "Enter" || event.key === " ") && !selectRoot.classList.contains("is-open")) {
            event.preventDefault();
            closeCustomSelects(selectRoot);
            selectRoot.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
        }
    });

    optionButtons.forEach((optionButton) => {
        optionButton.addEventListener("click", () => {
            nativeSelect.value = optionButton.dataset.value || "";
            setFieldInvalidState(nativeSelect, false);
            syncCustomSelect(selectRoot);
            closeCustomSelects();
            nativeSelect.dispatchEvent(new Event("input", { bubbles: true }));
            nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
            trigger.focus();
        });
    });

    menu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCustomSelects();
            trigger.focus();
        }
    });
});

searchToggle?.addEventListener("click", () => openSearch());
searchClose?.addEventListener("click", closeSearch);
searchOverlay?.addEventListener("click", (event) => {
    if (event.target === searchOverlay) {
        closeSearch();
    }
});

menuToggle?.addEventListener("click", openMobilePanel);
mobileBackdrop?.addEventListener("click", closeMobilePanel);
mobileClose?.addEventListener("click", closeMobilePanel);
mobileLinks.forEach((link) => link.addEventListener("click", closeMobilePanel));

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch(searchInput?.value || "");
    }

    if (
        event.key === "/"
        && !(event.target instanceof HTMLInputElement)
        && !(event.target instanceof HTMLTextAreaElement)
        && !(event.target instanceof HTMLSelectElement)
    ) {
        event.preventDefault();
        openSearch(searchInput?.value || "");
    }

    if (event.key === "Escape") {
        closeSearch();
        closeMobilePanel();
        closeCustomSelects();
    }

    if (event.key === "Tab" && searchOverlay && !searchOverlay.hidden) {
        trapFocus(event, searchCard);
    }

    if (event.key === "Tab" && mobilePanel && !mobilePanel.hidden) {
        trapFocus(event, mobileDrawer);
    }
});

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("[data-custom-select]")) {
        return;
    }

    closeCustomSelects();
});

function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) {
        return false;
    }

    const topbarHeight = topbar?.offsetHeight || 0;
    const topOffset = target.getBoundingClientRect().top + window.scrollY - topbarHeight - 18;
    window.scrollTo({ top: Math.max(topOffset, 0), behavior: "smooth" });
    return true;
}

scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selector = button.getAttribute("data-scroll");
        if (selector) {
            scrollToTarget(selector);
        }
    });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const selector = link.getAttribute("href");
        if (!selector || selector === "#") {
            return;
        }

        const found = scrollToTarget(selector);
        if (found) {
            event.preventDefault();
        }
    });
});

let activeSectionId = sections[0]?.id || "hero";
let pageSignalTicking = false;
const searchIntentMap = {
    hero: ["首页", "首屏", "能源", "工业级", "品牌"],
    trust: ["信任", "合作", "验证", "方法", "保障", "保密"],
    products: ["产品", "系列", "模组", "电池", "锂电", "classic", "prime", "pulse"],
    parameters: ["参数", "规格", "容量", "温度", "电流", "寿命", "封装", "对比"],
    technology: ["技术", "研发", "输出", "架构", "稳定", "寿命", "环境适配"],
    scenarios: ["场景", "行业", "医疗", "工业自动化", "物联网", "户外", "iot"],
    process: ["交付", "流程", "打样", "量产", "评估", "验证", "推进"],
    proof: ["案例", "结果", "成效", "项目结果", "案例封面"],
    "case-detail": ["案例拆解", "拆解", "详情", "难点", "判断逻辑"],
    contact: ["联系", "咨询", "方案", "电话", "邮箱", "表单", "邮件", "销售"]
};

function setCurrentSection(sectionId) {
    navigationLinks.forEach((link) => {
        const hash = (link.getAttribute("href") || "").replace(/^#/, "");
        const isCurrent = hash === sectionId;

        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function updateDepthMotion() {
    if (motionLite) {
        return;
    }

    const viewportHeight = window.innerHeight || 1;

    depthTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - viewportHeight / 2) / viewportHeight;
        const depthShift = clamp(offset * -18, -16, 16);

        target.style.setProperty("--depth-shift", `${depthShift.toFixed(2)}px`);
    });
}

function updateHeroParallax() {
    if (!hero || motionLite) {
        return;
    }

    const rect = hero.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const centerOffset = ((rect.top + rect.height / 2) - viewportHeight / 2) / viewportHeight;

    heroParallaxTargets.forEach((target) => {
        const speed = Number.parseFloat(target.dataset.parallaxSpeed || "0");
        const shift = clamp(centerOffset * speed * -120, -28, 28);

        target.style.setProperty("--parallax-shift", `${shift.toFixed(2)}px`);
    });

    if (heroStage) {
        const mediaShift = clamp(centerOffset * -22, -14, 14);
        heroStage.style.setProperty("--hero-media-shift", `${mediaShift.toFixed(2)}px`);
    }
}

function updatePageSignals() {
    const documentHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = clamp(window.scrollY / documentHeight, 0, 1);
    const topOffset = window.scrollY + (topbar?.offsetHeight || 0) + Math.min(window.innerHeight * 0.28, 220);
    let nextSectionId = activeSectionId;

    sections.forEach((section) => {
        if (topOffset >= section.offsetTop) {
            nextSectionId = section.id;
        }
    });

    if (sectionRail) {
        sectionRail.style.setProperty("--rail-progress", progress.toFixed(3));
    }

    if (backToTopButton) {
        backToTopButton.classList.toggle("is-visible", window.scrollY > 560);
        backToTopButton.style.setProperty("--top-progress", progress.toFixed(3));
    }

    if (nextSectionId !== activeSectionId) {
        activeSectionId = nextSectionId;
        setCurrentSection(activeSectionId);
    }
}

function flashSection(target) {
    if (!(target instanceof HTMLElement)) {
        return;
    }

    if (searchFlashTimer) {
        window.clearTimeout(searchFlashTimer);
    }

    target.classList.add("is-search-hit");
    searchFlashTimer = window.setTimeout(() => {
        target.classList.remove("is-search-hit");
    }, 1600);
}

function syncAmbientVideoPlayback(video) {
    if (!(video instanceof HTMLVideoElement)) {
        return;
    }

    const inViewport = video.dataset.inViewport === "true";
    const shouldPlay = inViewport && !motionLite && !prefersReducedMotion.matches && document.visibilityState === "visible";

    if (shouldPlay) {
        video.play().catch(() => {
            // Ignore autoplay failures and keep the page usable.
        });
    } else {
        video.pause();
    }
}

function syncScrollRail(rail) {
    if (!(rail instanceof HTMLElement)) {
        return;
    }

    const overflowWidth = rail.scrollWidth - rail.clientWidth;
    const scrollable = overflowWidth > 18;
    rail.classList.toggle("is-scrollable", scrollable);

    if (!scrollable) {
        rail.style.setProperty("--rail-progress", "1");
        rail.classList.remove("is-scrolled");
        return;
    }

    const progress = clamp(rail.scrollLeft / overflowWidth, 0, 1);
    rail.style.setProperty("--rail-progress", progress.toFixed(3));
    rail.classList.toggle("is-scrolled", rail.scrollLeft > 8);
}

function syncAllScrollRails() {
    scrollRails.forEach((rail) => syncScrollRail(rail));
}

function handleScrollRailScroll(event) {
    syncScrollRail(event.currentTarget);
}

function schedulePageSignals() {
    if (pageSignalTicking) {
        return;
    }

    pageSignalTicking = true;
    requestAnimationFrame(() => {
        updatePageSignals();
        updateDepthMotion();
        updateHeroParallax();
        pageSignalTicking = false;
    });
}

setCurrentSection(activeSectionId);
updatePageSignals();
updateDepthMotion();
updateHeroParallax();
syncAllScrollRails();
window.addEventListener("scroll", schedulePageSignals, { passive: true });
window.addEventListener("resize", schedulePageSignals);
window.addEventListener("resize", syncAllScrollRails);
window.addEventListener("load", () => {
    requestAnimationFrame(syncAllScrollRails);
});
window.addEventListener("scroll", () => closeCustomSelects(), { passive: true });
window.addEventListener("resize", () => closeCustomSelects());

const scrollRailResizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            syncScrollRail(entry.target);
        });
    })
    : null;

scrollRails.forEach((rail) => {
    rail.addEventListener("scroll", handleScrollRailScroll, { passive: true });
    scrollRailResizeObserver?.observe(rail);
});

function searchSection(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        if (searchFeedback) {
            searchFeedback.textContent = "试试输入“产品”、“参数”、“技术”、“案例”或“表单”。";
        }
        return;
    }

    const tokens = normalized.split(/[\s/、,，]+/).filter(Boolean);
    let bestMatch = null;
    let bestScore = 0;

    sections.forEach((section) => {
        const sectionId = section.id;
        const sourceText = [
            section.getAttribute("data-search") || "",
            searchIntentMap[sectionId]?.join(" ") || "",
            section.querySelector("h2")?.textContent || ""
        ].join(" ").toLowerCase();

        let score = 0;

        if (sourceText.includes(normalized)) {
            score += 5;
        }

        tokens.forEach((token) => {
            if (sourceText.includes(token)) {
                score += token.length >= 3 ? 2 : 1;
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestMatch = section;
        }
    });

    if (bestMatch && bestScore > 0) {
        scrollToTarget(`#${bestMatch.id}`);
        flashSection(bestMatch);
        if (searchFeedback) {
            const title = bestMatch.querySelector("h2")?.textContent || "目标区块";
            searchFeedback.textContent = `已为你定位到“${title}”。`;
        }
        window.setTimeout(closeSearch, 380);
        return;
    }

    if (searchFeedback) {
        searchFeedback.textContent = "没有直接匹配到结果，试试“产品”、“参数”、“技术”、“案例”、“交付”或“表单”。";
    }
}

searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchSection(searchInput?.value || "");
});

queryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const query = button.getAttribute("data-query") || "";
        if (searchInput) {
            searchInput.value = query;
        }
        searchSection(query);
    });
});

function setProjectFeedback(message) {
    if (projectFormFeedback) {
        projectFormFeedback.textContent = message;
    }
}

function setProjectStatus(message, timeoutMs = 2200) {
    if (!projectFormStatus) {
        return;
    }

    projectFormStatus.textContent = message;

    if (projectStatusTimer) {
        window.clearTimeout(projectStatusTimer);
        projectStatusTimer = null;
    }

    if (timeoutMs > 0 && message) {
        projectStatusTimer = window.setTimeout(() => {
            if (projectFormStatus.textContent === message) {
                projectFormStatus.textContent = "";
            }
        }, timeoutMs);
    }
}

function buildProjectDraft(form) {
    const formData = new FormData(form);
    return {
        deviceType: getFormValue(formData, "deviceType"),
        projectStage: getFormValue(formData, "projectStage"),
        peakCurrent: getFormValue(formData, "peakCurrent"),
        temperatureRange: getFormValue(formData, "temperatureRange"),
        serviceCycle: getFormValue(formData, "serviceCycle"),
        contact: getFormValue(formData, "contact"),
        projectBrief: getFormValue(formData, "projectBrief")
    };
}

function saveProjectDraft() {
    if (!projectForm) {
        return;
    }

    const draft = buildProjectDraft(projectForm);
    const hasContent = Object.values(draft).some(Boolean);

    try {
        if (hasContent) {
            window.localStorage.setItem(projectDraftKey, JSON.stringify(draft));
            setProjectStatus("草稿已自动保存到当前浏览器。", 1400);
        } else {
            window.localStorage.removeItem(projectDraftKey);
            setProjectStatus("", 0);
        }
    } catch (error) {
        // Ignore storage errors and keep the form usable.
    }
}

function restoreProjectDraft() {
    if (!projectForm) {
        return;
    }

    try {
        const rawDraft = window.localStorage.getItem(projectDraftKey);
        if (!rawDraft) {
            return;
        }

        const draft = JSON.parse(rawDraft);
        let restored = false;

        Object.entries(draft).forEach(([name, value]) => {
            const field = projectForm.querySelector(`[name="${name}"]`);
            if (!field || typeof value !== "string" || !value) {
                return;
            }

            field.value = value;
            restored = true;
        });

        if (restored) {
            customSelects.forEach((selectRoot) => syncCustomSelect(selectRoot));
            updateProjectPreview();
            setProjectFeedback("已恢复你上次未发送的项目草稿。");
            setProjectStatus("已恢复上次未发送的草稿。", 2600);
        }
    } catch (error) {
        window.localStorage.removeItem(projectDraftKey);
    }
}

function clearProjectDraft(shouldResetForm = false) {
    try {
        window.localStorage.removeItem(projectDraftKey);
    } catch (error) {
        // Ignore storage errors and keep the form usable.
    }

    if (!projectForm || !shouldResetForm) {
        return;
    }

    projectForm.reset();
    customSelects.forEach((selectRoot) => {
        setFieldInvalidState(selectRoot.querySelector(".custom-select-native"), false);
        syncCustomSelect(selectRoot);
    });
    projectForm.querySelectorAll("input, textarea").forEach((field) => {
        field.classList.remove("is-invalid");
    });
    updateProjectPreview();
    setProjectStatus("", 0);
}

function getFormValue(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
}

function shortLabel(value, fallback, prefix = "") {
    if (!value) {
        return fallback;
    }

    const compactValue = value.length > 18 ? `${value.slice(0, 18)}...` : value;
    return prefix ? `${prefix} ${compactValue}` : compactValue;
}

function updateProjectPreview() {
    if (!projectForm) {
        return;
    }

    const formData = new FormData(projectForm);
    const deviceType = getFormValue(formData, "deviceType");
    const projectStage = getFormValue(formData, "projectStage");
    const peakCurrent = getFormValue(formData, "peakCurrent");
    const temperatureRange = getFormValue(formData, "temperatureRange");
    const serviceCycle = getFormValue(formData, "serviceCycle");
    const contact = getFormValue(formData, "contact");
    const projectBrief = getFormValue(formData, "projectBrief");

    const deviceProfiles = {
        "工业自动化": {
            focusLabel: "先压停线与误报成本",
            focusText: "重点会落在峰值唤醒、线束限制和维护窗口，优先把现场稳定性守住。"
        },
        "医疗检测设备": {
            focusLabel: "先守住关键时刻不断电",
            focusText: "更看重长期一致性、瞬态响应和关键流程里的可靠供能。"
        },
        "物联网终端": {
            focusLabel: "先把功耗模型算透",
            focusText: "会优先回看待机、唤醒频率和通信瞬态，避免续航预估偏差太大。"
        },
        "户外巡检设备": {
            focusLabel: "先校核低温与补能频次",
            focusText: "环境温差、离线时长和维护节奏会一起影响容量与峰值余量判断。"
        },
        "其他设备": {
            focusLabel: "先建立供能边界",
            focusText: "我们会先拆使用周期、结构限制和环境约束，再反推方案组合。"
        }
    };

    const stageProfiles = {
        "样机评估中": {
            actionLabel: "先建立选型边界",
            actionText: "适合先锁定容量、峰值余量和结构限制，尽快缩小候选范围。"
        },
        "样品验证中": {
            actionLabel: "先收拢验证清单",
            actionText: "更适合同步回看温区、脉冲负载和异常恢复，把测试重点压实。"
        },
        "量产切换中": {
            actionLabel: "先冻结量产规格",
            actionText: "要优先确认接口、封装、防护与追溯要求，减少导入阶段反复。"
        },
        "已有方案待优化": {
            actionLabel: "先找出现有短板",
            actionText: "建议先把续航不足、低温掉电或峰值响应问题定位清楚，再做替换。"
        }
    };

    const deviceProfile = deviceProfiles[deviceType] || {
        focusLabel: "等待识别设备方向",
        focusText: "先补设备方向后，我们会更快锁定场景重点和第一轮判断逻辑。"
    };

    const stageProfile = stageProfiles[projectStage] || {
        actionLabel: "等待识别项目阶段",
        actionText: "补上当前阶段后，我们才能判断是先做选型、验证还是量产切换准备。"
    };

    let title = "补齐基本项后，这里会自动生成建议重点";
    if (deviceType && projectStage) {
        title = `${deviceType} / ${projectStage} 的项目沟通，会先沿这条线推进`;
    } else if (deviceType) {
        title = `已识别为${deviceType}方向，再补项目阶段后会更快定位建议`;
    } else if (projectStage) {
        title = `当前处于${projectStage}，再补设备方向后会更快锁定判断重点`;
    }

    const contextNotes = [];
    if (peakCurrent) {
        contextNotes.push(`峰值按 ${peakCurrent} 校核`);
    }
    if (temperatureRange) {
        contextNotes.push(`温区按 ${temperatureRange} 回看`);
    }
    if (serviceCycle) {
        contextNotes.push(`维护周期按 ${serviceCycle} 评估`);
    }

    const contextPrefix = contextNotes.length ? `已记录${contextNotes.join("，")}。` : "";
    let focusText = `${contextPrefix}${deviceProfile.focusText}`;
    if (projectBrief) {
        focusText = `${focusText} 项目补充说明也已填写，可直接带进首轮判断。`;
    }

    const filledFields = [
        deviceType,
        projectStage,
        peakCurrent,
        temperatureRange,
        serviceCycle,
        contact,
        projectBrief
    ].filter(Boolean).length;
    const readinessPercent = Math.round((filledFields / 7) * 100);

    let actionLabel = stageProfile.actionLabel;
    let actionText = stageProfile.actionText;

    if (filledFields >= 6) {
        actionLabel = "信息已接近完整";
        actionText = "这份输入已经足够整理成首轮建议，适合直接生成邮件草稿发起沟通。";
    } else if (deviceType && projectStage && contact) {
        actionText = `${stageProfile.actionText} 联系方式已补齐，可以直接进入方案沟通。`;
    }

    const tags = [
        shortLabel(deviceType, "设备方向"),
        shortLabel(projectStage, "项目阶段"),
        peakCurrent
            ? shortLabel(peakCurrent, "环境约束", "峰值")
            : temperatureRange
                ? shortLabel(temperatureRange, "环境约束", "温区")
                : serviceCycle
                    ? shortLabel(serviceCycle, "环境约束", "周期")
                    : "环境约束"
    ];

    if (projectPreviewTitle) {
        projectPreviewTitle.textContent = title;
    }
    if (projectPreviewFocusLabel) {
        projectPreviewFocusLabel.textContent = deviceProfile.focusLabel;
    }
    if (projectPreviewFocusText) {
        projectPreviewFocusText.textContent = focusText;
    }
    if (projectPreviewActionLabel) {
        projectPreviewActionLabel.textContent = actionLabel;
    }
    if (projectPreviewActionText) {
        projectPreviewActionText.textContent = actionText;
    }
    if (projectReadinessValue) {
        projectReadinessValue.textContent = `${readinessPercent}%`;
    }
    if (projectReadinessBar) {
        projectReadinessBar.style.width = `${readinessPercent}%`;
    }
    if (projectPreviewPoints) {
        Array.from(projectPreviewPoints.querySelectorAll("span")).forEach((element, index) => {
            element.textContent = tags[index] || "";
        });
    }
}

function buildProjectSummary(form) {
    const formData = new FormData(form);
    const fields = [
        ["设备类型", formData.get("deviceType")],
        ["项目阶段", formData.get("projectStage")],
        ["峰值电流", formData.get("peakCurrent")],
        ["工作温区", formData.get("temperatureRange")],
        ["目标续航 / 维护周期", formData.get("serviceCycle")],
        ["联系邮箱或电话", formData.get("contact")],
        ["项目补充说明", formData.get("projectBrief")]
    ];

    const summary = fields
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([label, value]) => `${label}: ${String(value).trim()}`)
        .join("\n");

    return `泰坦能量项目咨询\n\n${summary}\n`;
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
}

projectForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const validation = validateProjectForm();

    if (!validation.valid) {
        setProjectFeedback("请先补全设备类型、项目阶段和联系方式。");
        focusProjectField(validation.firstInvalidField);
        return;
    }

    const summary = buildProjectSummary(projectForm);
    const subjectBase = projectForm.querySelector('[name="deviceType"]')?.value || "工业供能方案";
    const subject = encodeURIComponent(`[项目咨询] ${subjectBase}`);
    const bodyText = encodeURIComponent(summary);

    clearProjectDraft(false);
    setProjectFeedback("已为你生成邮件草稿；如果没有自动打开邮件客户端，也可以先复制摘要。");
    setProjectStatus("草稿已转为邮件内容。", 2200);
    window.location.href = `mailto:sales@titanenergy.cn?subject=${subject}&body=${bodyText}`;
});

projectCopyButton?.addEventListener("click", async () => {
    if (!projectForm) {
        return;
    }

    const summary = buildProjectSummary(projectForm);

    try {
        const copied = await copyText(summary);
        setProjectFeedback(copied ? "项目摘要已复制，你可以直接发给团队或粘贴进邮件。" : "复制没有成功，可以直接提交生成邮件草稿。");
    } catch (error) {
        setProjectFeedback("复制没有成功，可以直接提交生成邮件草稿。");
    }
});

projectDraftClearButton?.addEventListener("click", () => {
    clearProjectDraft(true);
    setProjectFeedback("当前浏览器里的项目草稿已清空。");
    setProjectStatus("草稿已清空。", 2200);
});

projectForm?.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        setFieldInvalidState(target, false);
    }
    saveProjectDraft();
    updateProjectPreview();
});

projectForm?.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        setFieldInvalidState(target, false);
    }
    saveProjectDraft();
    updateProjectPreview();
});

restoreProjectDraft();
updateProjectPreview();

if (motionLite || prefersReducedMotion.matches) {
    ambientVideos.forEach((video) => {
        video.pause();
        video.removeAttribute("autoplay");
    });
} else {
    const ambientVideoObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (!(video instanceof HTMLVideoElement)) {
                    return;
                }

                video.dataset.inViewport = entry.isIntersecting ? "true" : "false";
                syncAmbientVideoPlayback(video);
            });
        },
        { threshold: 0.35 }
    );

    ambientVideos.forEach((video) => {
        video.dataset.inViewport = "false";
        ambientVideoObserver.observe(video);
    });

    document.addEventListener("visibilitychange", () => {
        ambientVideos.forEach((video) => syncAmbientVideoPlayback(video));
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

let revealTicking = false;

function updateRevealProgress() {
    if (prefersReducedMotion.matches) {
        return;
    }

    const viewportHeight = window.innerHeight || 1;

    revealTargets.forEach((target) => {
        if (target.classList.contains("is-visible")) {
            target.style.setProperty("--reveal-progress", "1");
            return;
        }

        const rect = target.getBoundingClientRect();
        const enterStart = viewportHeight * 0.96;
        const enterEnd = viewportHeight * 0.24;
        const raw = (enterStart - rect.top) / (enterStart - enterEnd);
        const progress = clamp(raw, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 2.2);
        target.style.setProperty("--reveal-progress", eased.toFixed(3));
    });
}

function scheduleRevealProgress() {
    if (revealTicking || prefersReducedMotion.matches) {
        return;
    }

    revealTicking = true;
    requestAnimationFrame(() => {
        updateRevealProgress();
        revealTicking = false;
    });
}

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.setProperty("--reveal-progress", "1");
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
);

revealTargets.forEach((target) => revealObserver.observe(target));

if (!prefersReducedMotion.matches) {
    updateRevealProgress();
    window.addEventListener("scroll", scheduleRevealProgress, { passive: true });
    window.addEventListener("resize", scheduleRevealProgress);
}

function animateCounter(element) {
    const targetValue = Number.parseFloat(element.dataset.count || "0");
    const decimals = Number.parseInt(element.dataset.decimals || "0", 10);
    const suffix = element.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();

    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = targetValue * eased;
        const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
        element.textContent = `${formatted}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            const finalValue = decimals > 0 ? targetValue.toFixed(decimals) : Math.round(targetValue).toString();
            element.textContent = `${finalValue}${suffix}`;
        }
    }

    requestAnimationFrame(frame);
}

const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

counters.forEach((counter) => counterObserver.observe(counter));

function resetSpotlight(target) {
    target.style.setProperty("--spotlight-x", "50%");
    target.style.setProperty("--spotlight-y", "50%");
    target.style.setProperty("--drift-x", "0px");
    target.style.setProperty("--drift-y", "0px");
    target.classList.remove("is-spotlight-active");
}

function resetMagnetic(button) {
    button.style.setProperty("--magnetic-x", "0px");
    button.style.setProperty("--magnetic-y", "0px");
    button.classList.remove("is-magnetic-active");
}

if (!motionLite) {
    spotlightTargets.forEach((target) => {
        resetSpotlight(target);

        target.addEventListener("pointermove", (event) => {
            const rect = target.getBoundingClientRect();
            const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
            const driftX = (x - 0.5) * 10;
            const driftY = (y - 0.5) * 8;

            target.style.setProperty("--spotlight-x", `${(x * 100).toFixed(1)}%`);
            target.style.setProperty("--spotlight-y", `${(y * 100).toFixed(1)}%`);
            target.style.setProperty("--drift-x", `${driftX.toFixed(2)}px`);
            target.style.setProperty("--drift-y", `${driftY.toFixed(2)}px`);
            target.classList.add("is-spotlight-active");
        });

        target.addEventListener("pointerleave", () => resetSpotlight(target));
        target.addEventListener("pointercancel", () => resetSpotlight(target));
    });

    magneticButtons.forEach((button) => {
        resetMagnetic(button);

        button.addEventListener("pointermove", (event) => {
            const rect = button.getBoundingClientRect();
            const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
            const translateX = (x - 0.5) * 14;
            const translateY = (y - 0.5) * 10;

            button.style.setProperty("--magnetic-x", `${translateX.toFixed(2)}px`);
            button.style.setProperty("--magnetic-y", `${translateY.toFixed(2)}px`);
            button.classList.add("is-magnetic-active");
        });

        button.addEventListener("pointerleave", () => resetMagnetic(button));
        button.addEventListener("blur", () => resetMagnetic(button));
    });

    breatheTargets.forEach((target, index) => {
        target.style.setProperty("--breathe-delay", `${(index % 4) * 180}ms`);
    });

    const breatheObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-breathing", entry.isIntersecting);
            });
        },
        { threshold: 0.35 }
    );

    breatheTargets.forEach((target) => breatheObserver.observe(target));
}

if (heroStage && !motionLite) {
    const resetHeroStage = () => {
        heroStage.style.setProperty("--tilt-x", "0deg");
        heroStage.style.setProperty("--tilt-y", "0deg");
        heroStage.style.setProperty("--pointer-x", "52%");
        heroStage.style.setProperty("--pointer-y", "38%");
    };

    resetHeroStage();

    heroStage.addEventListener("pointermove", (event) => {
        const rect = heroStage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const tiltY = (x - 0.5) * 10;
        const tiltX = (0.5 - y) * 8;

        heroStage.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        heroStage.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        heroStage.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
        heroStage.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
    });

    heroStage.addEventListener("pointerleave", resetHeroStage);
}
