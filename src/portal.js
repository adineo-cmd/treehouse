/* Portal-only behaviour.
 *
 * The two progress notebooks are read independently. This file never joins
 * them, never sums them, and never sends one map's keys to the other map.
 */
(() => {
  const ATLAS_PREFIX = "arbor-roadmap-";
  const THEME_KEY = "treehouse-theme";
  const root = document.documentElement;

  /* Empty at a domain root, "/treehouse" on a project Pages site. */
  const SITE_BASE = window.__TREEHOUSE_BASE__ || "";

  /* One theme control, one shared preference. Library, Compass and the shell
     read the same key, so switching here carries across the whole site. */
  const themeButton = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const paintThemeControl = () => {
    const light = root.getAttribute("data-theme") === "light";
    if (themeButton) {
      const label = light ? "Switch to dark theme" : "Switch to light theme";
      themeButton.setAttribute("aria-label", label);
      themeButton.setAttribute("title", label);
    }
    if (themeMeta) themeMeta.setAttribute("content", light ? "#f3eee2" : "#0c110e");
  };

  const applyTheme = (theme, persist = true) => {
    const next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* private mode — the theme still applies for this visit */
      }
    }
    paintThemeControl();
  };

  themeButton?.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_KEY) return;
    if (event.newValue === "light" || event.newValue === "dark") {
      applyTheme(event.newValue, false);
    }
  });

  paintThemeControl();
  const CAREER_PREFIX = "cm_done_";

  const smallWords = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "the", "to"]);
  const humanise = (slug) =>
    slug
      .split(/[-_]+/)
      .filter(Boolean)
      .map((word, index) =>
        index > 0 && smallWords.has(word)
          ? word
          : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ");

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  const scan = (prefix) => {
    const started = [];
    let ticked = 0;

    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;

        let value;
        try {
          value = JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
          continue;
        }

        if (!Array.isArray(value) || value.length === 0) continue;
        started.push({ slug: key.slice(prefix.length), count: value.length });
        ticked += value.length;
      }
    } catch {
      // Storage can be blocked in private browsing. The page still works.
      return { started: [], ticked: 0, available: false };
    }

    return { started, ticked, available: true };
  };

  const renderTrail = ({ prefix, progressId, linkId, trailSelector, singleHref, indexHref, emptyLabel, resumeLabel }) => {
    const progress = document.getElementById(progressId);
    const link = document.getElementById(linkId);
    const trail = document.querySelector(trailSelector);
    if (!progress || !link || !trail) return;

    const result = scan(prefix);

    if (!result.available) {
      progress.textContent = "Progress storage is unavailable in this browser.";
      return;
    }

    if (result.started.length === 0) {
      progress.textContent = "Nothing started yet.";
      link.textContent = emptyLabel;
      link.href = indexHref;
      return;
    }

    const one = result.started.length === 1;
    progress.textContent = one
      ? `${humanise(result.started[0].slug)} — ${plural(result.ticked, "step")} done.`
      : `${plural(result.started.length, "path")} started, ${plural(result.ticked, "step")} done.`;

    link.textContent = resumeLabel;
    link.href = one ? singleHref(result.started[0].slug) : indexHref;
    trail.classList.add("has-progress");
  };

  renderTrail({
    prefix: ATLAS_PREFIX,
    progressId: "library-progress",
    linkId: "library-resume",
    trailSelector: '.progress-card[data-trail="library"]',
    singleHref: (slug) => `${SITE_BASE}/library/roadmap/${encodeURIComponent(slug)}`,
    indexHref: `${SITE_BASE}/library/roadmap`,
    emptyLabel: "Start learning",
    resumeLabel: "Continue learning",
  });

  renderTrail({
    prefix: CAREER_PREFIX,
    progressId: "careers-progress",
    linkId: "careers-resume",
    trailSelector: '.progress-card[data-trail="careers"]',
    singleHref: (slug) => `${SITE_BASE}/compass/#/roadmap/${encodeURIComponent(slug)}`,
    indexHref: `${SITE_BASE}/compass/#/`,
    emptyLabel: "Explore careers",
    resumeLabel: "Continue career path",
  });
})();
