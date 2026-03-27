const body = document.body;
const topbar = document.querySelector(".topbar");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle-text");
const searchOverlay = document.getElementById("searchOverlay");
const searchToggle = document.querySelector(".search-toggle");
const searchClose = document.querySelector(".search-close");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("siteSearch");
const searchFeedback = document.getElementById("searchFeedback");
const tagButtons = document.querySelectorAll(".tag-button");
const menuToggle = document.querySelector(".mobile-menu-entry");
const mobilePanel = document.getElementById("mobilePanel");
const mobileBackdrop = document.querySelector(".mobile-backdrop");
const mobileClose = document.querySelector(".mobile-close");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const sections = document.querySelectorAll("[data-search]");
const revealTargets = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const yearTarget = document.getElementById("year");
const heroStage = document.querySelector(".hero-stage");

if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear().toString();
}

const storedTheme = window.localStorage.getItem("titan-theme");
const initialTheme = storedTheme || "dark";

applyTheme(initialTheme);

function applyTheme(theme) {
    body.dataset.theme = theme;
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

    searchOverlay.hidden = false;
    setBodyLock(true);
    if (searchInput) {
        searchInput.value = query;
        window.setTimeout(() => searchInput.focus(), 30);
    }
}

function closeSearch() {
    if (!searchOverlay) {
        return;
    }

    searchOverlay.hidden = true;
    setBodyLock(Boolean(mobilePanel && !mobilePanel.hidden));
    if (searchFeedback) {
        searchFeedback.textContent = "";
    }
}

function openMobilePanel() {
    if (!mobilePanel || !menuToggle) {
        return;
    }

    mobilePanel.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    setBodyLock(true);
}

function closeMobilePanel() {
    if (!mobilePanel || !menuToggle) {
        return;
    }

    mobilePanel.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    setBodyLock(Boolean(searchOverlay && !searchOverlay.hidden));
}

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
    if (event.key === "Escape") {
        closeSearch();
        closeMobilePanel();
    }
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

function searchSection(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        if (searchFeedback) {
            searchFeedback.textContent = "试试输入“产品”、“技术”或“联系”。";
        }
        return;
    }

    const match = Array.from(sections).find((section) => {
        const keywords = (section.getAttribute("data-search") || "").toLowerCase();
        return keywords.includes(normalized);
    });

    if (match) {
        match.scrollIntoView({ behavior: "smooth", block: "start" });
        if (searchFeedback) {
            const title = match.querySelector("h2")?.textContent || "目标区块";
            searchFeedback.textContent = `已为你定位到“${title}”。`;
        }
        window.setTimeout(closeSearch, 380);
        return;
    }

    if (searchFeedback) {
        searchFeedback.textContent = "没有直接匹配到结果，试试“产品”、“技术”、“行业”、“交付”或“联系”。";
    }
}

searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchSection(searchInput?.value || "");
});

tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const query = button.getAttribute("data-query") || "";
        if (searchInput) {
            searchInput.value = query;
        }
        searchSection(query);
    });
});

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.14 }
);

revealTargets.forEach((target) => revealObserver.observe(target));

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

if (heroStage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
