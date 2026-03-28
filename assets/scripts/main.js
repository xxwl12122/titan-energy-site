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
const spotlightTargets = document.querySelectorAll(".section-surface, .hero-stage, .technology-visual, .process-visual, .scenario-card-featured .scenario-visual");
const depthTargets = document.querySelectorAll(".hero-aura, .hero-stage, .technology-visual, .process-visual, .scenario-card-featured .scenario-visual");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

let activeSectionId = sections[0]?.id || "hero";
let pageSignalTicking = false;

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
    if (prefersReducedMotion.matches) {
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
    if (!hero || prefersReducedMotion.matches) {
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

    if (nextSectionId !== activeSectionId) {
        activeSectionId = nextSectionId;
        setCurrentSection(activeSectionId);
    }
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
window.addEventListener("scroll", schedulePageSignals, { passive: true });
window.addEventListener("resize", schedulePageSignals);

function searchSection(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        if (searchFeedback) {
            searchFeedback.textContent = "试试输入“产品”、“参数”、“技术”或“联系”。";
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
        searchFeedback.textContent = "没有直接匹配到结果，试试“产品”、“参数”、“技术”、“行业”、“交付”或“联系”。";
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

if (!prefersReducedMotion.matches) {
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

if (heroStage && !prefersReducedMotion.matches) {
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
