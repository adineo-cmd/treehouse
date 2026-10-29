/* Treehouse shell — a doorway, not a data merge.
 *
 * This file is injected into every page of both sub-apps. It knows nothing
 * about either dataset. It only draws a clear "Switch map" button and links
 * back to the two isolated worlds.
 */
(() => {
  const HOST_ID = "treehouse-shell";
  if (document.getElementById(HOST_ID)) return;

  const path = location.pathname;
  const world = path.startsWith("/library") ? "library" : path.startsWith("/compass") ? "careers" : null;
  if (!world) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.className = `world-${world}`;

  const shadow = host.attachShadow({ mode: "open" });

  // Both apps declare data-theme, so the shell can follow the page exactly.
  // The control writes the same shared preference the apps use.
  const THEME_KEY = "treehouse-theme";
  const themeIsLight = () => document.documentElement.getAttribute("data-theme") === "light";

  const syncTheme = () => {
    const light = themeIsLight();
    host.classList.toggle("light", light);
    const button = shadow.querySelector(".theme");
    if (button) {
      const label = light ? "Switch to dark theme" : "Switch to light theme";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }
  };
  syncTheme();

  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const isLibrary = world === "library";

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        right: max(16px, env(safe-area-inset-right, 16px));
        bottom: max(16px, env(safe-area-inset-bottom, 16px));
        z-index: 80;
        pointer-events: none;
        --shell-bg: rgba(12, 17, 14, 0.96);
        --shell-bg-solid: #0c110e;
        --shell-ink: #f2ecdf;
        --shell-muted: #a6aea3;
        --shell-faint: #7e887f;
        --shell-line: rgba(242, 236, 223, 0.16);
        --shell-line-strong: rgba(242, 236, 223, 0.32);
        --shell-copper: #c69068;
        --shell-library: #9ccfb0;
        --shell-career: #f5c518;
        --current: ${isLibrary ? "var(--shell-library)" : "var(--shell-career)"};
        --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        --serif: "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-family: var(--sans);
        color-scheme: dark;
      }

      :host(.light) {
        --shell-bg: rgba(243, 238, 226, 0.97);
        --shell-bg-solid: #f3eee2;
        --shell-ink: #1c2620;
        --shell-muted: #59655d;
        --shell-faint: #6f7a71;
        --shell-line: rgba(28, 38, 32, 0.14);
        --shell-line-strong: rgba(28, 38, 32, 0.3);
        color-scheme: light;
      }

      * { box-sizing: border-box; }

      .dock,
      .panel { pointer-events: auto; }

      .dock {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .theme {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        flex: none;
        padding: 0;
        border: 1px solid var(--shell-line-strong);
        border-radius: 50%;
        background: var(--shell-bg);
        color: var(--shell-muted);
        cursor: pointer;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
      }

      .theme:hover,
      .theme:focus-visible {
        border-color: var(--shell-copper);
        background: color-mix(in srgb, var(--shell-copper) 14%, var(--shell-bg));
        color: var(--shell-ink);
        transform: translateY(-1px);
        outline: none;
      }

      .theme:focus-visible {
        box-shadow: 0 0 0 2px var(--shell-bg-solid), 0 0 0 4px var(--shell-copper);
      }

      .theme svg {
        display: block;
        width: 19px;
        height: 19px;
      }

      .theme .theme__moon { display: none; }

      :host(.light) .theme .theme__sun { display: none; }
      :host(.light) .theme .theme__moon { display: block; }

      .tab {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 48px;
        padding: 0 16px 0 13px;
        border: 1px solid var(--shell-line-strong);
        border-radius: 999px;
        background: var(--shell-bg);
        background: linear-gradient(180deg, color-mix(in srgb, var(--current) 12%, var(--shell-bg)), var(--shell-bg));
        color: var(--shell-ink);
        cursor: pointer;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
      }

      .tab:hover,
      .tab:focus-visible {
        border-color: var(--current);
        background: color-mix(in srgb, var(--current) 16%, var(--shell-bg));
        transform: translateY(-1px);
        outline: none;
      }

      .tab:focus-visible {
        box-shadow: 0 0 0 2px var(--shell-bg-solid), 0 0 0 4px var(--current);
      }

      .tab__mark {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        flex: none;
        color: var(--current);
      }

      .tab__mark svg { width: 100%; height: 100%; display: block; }

      .tab__label {
        font-family: var(--sans);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: -0.005em;
        line-height: 1;
        white-space: nowrap;
      }

      .tab__dot {
        width: 6px;
        height: 6px;
        flex: none;
        border-radius: 50%;
        background: var(--current);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--current) 18%, transparent);
      }

      .panel {
        position: absolute;
        right: 0;
        bottom: calc(100% + 10px);
        width: 348px;
        max-width: calc(100vw - 32px);
        max-height: min(74vh, 560px);
        overflow: auto;
        padding: 20px 20px 16px;
        border: 1px solid var(--shell-line-strong);
        border-radius: 14px;
        background: linear-gradient(165deg, color-mix(in srgb, var(--current) 8%, var(--shell-bg-solid)), var(--shell-bg-solid) 58%);
        color: var(--shell-ink);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.48);
        opacity: 0;
        transform: translateY(8px);
        transform-origin: bottom right;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      .panel.open {
        opacity: 1;
        transform: translateY(0);
      }

      .panel__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--shell-line);
      }

      .panel__eyebrow {
        display: block;
        margin-bottom: 3px;
        color: var(--current);
        font-family: var(--mono);
        font-size: 9px;
        letter-spacing: 0.12em;
        line-height: 1.4;
        text-transform: uppercase;
      }

      .panel__title {
        margin: 0;
        color: var(--shell-ink);
        font-family: var(--serif);
        font-size: 29px;
        font-weight: 500;
        letter-spacing: -0.01em;
        line-height: 1;
      }

      .panel__close {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        flex: none;
        padding: 0;
        border: 1px solid var(--shell-line);
        border-radius: 50%;
        background: transparent;
        color: var(--shell-muted);
        font: 15px/1 var(--sans);
        cursor: pointer;
      }

      .panel__close:hover,
      .panel__close:focus-visible {
        border-color: var(--shell-line-strong);
        color: var(--shell-ink);
        outline: none;
      }

      .panel__lede {
        margin: 13px 0 14px;
        color: var(--shell-muted);
        font-size: 13px;
        line-height: 1.5;
      }

      .worlds {
        display: grid;
        gap: 9px;
      }

      .world {
        position: relative;
        display: grid;
        grid-template-columns: 10px 1fr auto;
        align-items: center;
        column-gap: 11px;
        padding: 13px;
        border: 1px solid var(--shell-line);
        border-radius: 10px;
        background: color-mix(in srgb, var(--shell-ink) 2%, transparent);
        color: var(--shell-ink);
        text-decoration: none;
        transition: border-color 0.18s ease, background 0.18s ease;
      }

      .world:hover,
      .world:focus-visible {
        border-color: var(--shell-line-strong);
        background: color-mix(in srgb, var(--shell-ink) 6%, transparent);
        outline: none;
      }

      .world:focus-visible { box-shadow: inset 0 0 0 1px var(--shell-ink); }

      .world__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent);
      }

      .world--library { --accent: var(--shell-library); }
      .world--careers { --accent: var(--shell-career); }

      .world__name {
        display: block;
        color: var(--shell-ink);
        font-size: 14px;
        font-weight: 650;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }

      .world__desc {
        display: block;
        margin-top: 2px;
        color: var(--shell-faint);
        font-size: 11.5px;
        line-height: 1.35;
      }

      .world__badge {
        color: var(--accent);
        font-family: var(--mono);
        font-size: 8.5px;
        letter-spacing: 0.06em;
        line-height: 1.2;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .world[aria-current="page"] {
        border-color: color-mix(in srgb, var(--accent) 54%, var(--shell-line));
        background: color-mix(in srgb, var(--accent) 8%, transparent);
      }

      .panel__links {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px 16px;
        margin-top: 14px;
      }

      .panel__links a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--shell-muted);
        font-size: 12px;
        text-decoration: none;
      }

      .panel__links a:hover,
      .panel__links a:focus-visible {
        color: var(--shell-ink);
        text-decoration: underline;
        text-underline-offset: 3px;
        outline: none;
      }

      .panel__foot {
        margin: 15px 0 0;
        padding-top: 12px;
        border-top: 1px solid var(--shell-line);
        color: var(--shell-faint);
        font-family: var(--mono);
        font-size: 9.5px;
        letter-spacing: 0.01em;
        line-height: 1.5;
      }

      @media (max-width: 640px) {
        :host {
          right: max(10px, env(safe-area-inset-right, 10px));
          bottom: max(10px, env(safe-area-inset-bottom, 10px));
        }

        .tab {
          min-height: 44px;
          padding: 0 13px 0 11px;
          gap: 8px;
        }

        .theme {
          width: 44px;
          height: 44px;
        }

        .tab__label { font-size: 11.5px; }

        .panel {
          width: min(340px, calc(100vw - 20px));
          max-width: calc(100vw - 20px);
          padding: 17px 16px 14px;
        }

        .panel__title { font-size: 25px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .tab,
        .panel,
        .world { transition: none !important; }
      }

      @media print {
        :host { display: none !important; }
      }
    </style>

    <div class="dock">
      <button class="theme" type="button" aria-label="Switch to light theme" title="Switch to light theme">
        <svg class="theme__sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/>
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <svg class="theme__moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.3 8.3 0 1 0 10.2 10.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>
      </button>

      <button class="tab" type="button" aria-expanded="false" aria-controls="treehouse-panel" aria-label="Switch map" title="Switch maps">
        <span class="tab__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.6" stroke="currentColor" stroke-width="1.2" opacity=".85"/>
            <ellipse cx="12" cy="12" rx="3.7" ry="8.6" stroke="currentColor" stroke-width=".9" opacity=".55"/>
            <path d="M12 1.6v20.8M3.4 12h17.2" stroke="currentColor" stroke-width=".9" opacity=".55"/>
            <path d="m15.5 8.5-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2Z" fill="currentColor" opacity=".9"/>
          </svg>
        </span>
        <span class="tab__label">Switch map</span>
        <span class="tab__dot" aria-hidden="true"></span>
      </button>
    </div>

    <section class="panel" id="treehouse-panel" hidden aria-label="Switch maps">
      <div class="panel__head">
        <div>
          <span class="panel__eyebrow">Treehouse</span>
          <h2 class="panel__title">Switch maps</h2>
        </div>
        <button class="panel__close" type="button" aria-label="Close the map switcher">&#10005;</button>
      </div>

      <p class="panel__lede">You are in the ${isLibrary ? "Knowledge map" : "Career map"}. Pick another map below.</p>

      <nav class="worlds" aria-label="Maps">
        <a class="world world--library" href="/library/" data-world="library"${isLibrary ? ' aria-current="page"' : ""}>
          <span class="world__dot" aria-hidden="true"></span>
          <span>
            <span class="world__name">Knowledge map</span>
            <span class="world__desc">Science, history, art and more</span>
          </span>
          ${isLibrary ? '<span class="world__badge">You are here</span>' : ""}
        </a>
        <a class="world world--careers" href="/compass/" data-world="careers"${!isLibrary ? ' aria-current="page"' : ""}>
          <span class="world__dot" aria-hidden="true"></span>
          <span>
            <span class="world__name">Career map</span>
            <span class="world__desc">Jobs, skills and next steps</span>
          </span>
          ${!isLibrary ? '<span class="world__badge">You are here</span>' : ""}
        </a>
      </nav>

      <div class="panel__links">
        <a href="/">&larr; Back to the start</a>
        <a href="/#how">How it works</a>
      </div>
      <p class="panel__foot">Your progress stays separate in each map.</p>
    </section>
  `;

  const tab = shadow.querySelector(".tab");
  const panel = shadow.querySelector(".panel");
  const closeButton = shadow.querySelector(".panel__close");
  const themeButton = shadow.querySelector(".theme");
  let open = false;

  const applyTheme = (theme, persist = true) => {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* private mode — the theme still applies for this visit */
      }
    }
    syncTheme();
  };

  themeButton.addEventListener("click", () => {
    applyTheme(themeIsLight() ? "dark" : "light");
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_KEY) return;
    if (event.newValue === "light" || event.newValue === "dark") {
      applyTheme(event.newValue, false);
    }
  });

  syncTheme();

  const setOpen = (next, moveFocus = false) => {
    if (next === open) return;
    open = next;
    tab.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add("open"));
      if (moveFocus) requestAnimationFrame(() => panel.querySelector("a, button")?.focus());
    } else {
      panel.classList.remove("open");
      window.setTimeout(() => {
        if (!open) panel.hidden = true;
      }, 190);
    }
  };

  tab.addEventListener("click", () => setOpen(!open, !open));
  closeButton.addEventListener("click", () => {
    setOpen(false);
    tab.focus();
  });

  shadow.querySelectorAll(".world").forEach((link) => {
    link.addEventListener("click", () => {
      try {
        localStorage.setItem("treehouse-last-world", link.dataset.world || "");
      } catch {
        /* private mode — the link still works */
      }
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!open) return;
    if (event.composedPath().includes(host)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      tab.focus();
    }
  });

  (document.body || document.documentElement).appendChild(host);
})();
