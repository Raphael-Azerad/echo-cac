const app = document.querySelector("#app");
const DB_NAME = "echo-local";
const DB_VERSION = 1;
const STORE = "echoes";
const onboardingKey = "echo:onboarding-complete";
const revealKey = "echo:allow-early-opening";
const archiveKeyPhrase = "I understand this breaks the seal";
const themeKey = "echo:theme";
const profileNameKey = "echo:profile-name";
const writingToneKey = "echo:writing-tone";
const draftKey = "echo:create-draft";
const contextApiBaseKey = "echo:context-api-base";
const activePromptKey = "echo:active-prompt";
const openedEchoesKey = "echo:opened-returned";
const newlyOpenedEchoKey = "echo:newly-opened-returned";
const sealedReceiptKey = "echo:sealed-receipt";
const returnRemindersKey = "echo:return-reminders";
const notifiedReturnsKey = "echo:notified-returns";
const maxAttachmentBytes = 8 * 1024 * 1024;
const maxAttachmentTotalBytes = 24 * 1024 * 1024;
const defaultContextApiBase = "http://localhost:8787";
const defaultDescription = "Echo preserves a human, a place, and a time in a private local-first time capsule.";

const iconPaths = {
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 5l7 7-7 7",
  back: "M19 12H5m6-7-7 7 7 7",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  unlock: "M8 11V8a4 4 0 0 1 7.6-1.7M6 11h12v9H6z",
  calendar: "M7 3v4M17 3v4M4 9h16M5 5h14v15H5z",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  stop: "M7 7h10v10H7z",
  image: "M5 5h14v14H5zM8 15l3-3 2 2 2-3 3 4M8.5 8.5h.01",
  trash: "M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13",
  map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3zM9 3v15M15 6v15",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.6 9h16.8M3.6 15h16.8M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9M12 3c-2.4 2.5-3.5 5.5-3.5 9s1.1 6.5 3.5 9",
  save: "M5 4h12l2 2v14H5zM8 4v6h8M8 20v-6h8v6",
  shield: "M12 3l7 3v5c0 4.7-2.9 8.4-7 10-4.1-1.6-7-5.3-7-10V6zM9 12l2 2 4-5",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  archive: "M4 7h16M6 7v13h12V7M9 11h6",
  pen: "M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM13.5 6.5l3 3",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  video: "M4 6h11v12H4zM15 10l5-3v10l-5-3z",
  paperclip: "M7 12.5l6.8-6.8a3 3 0 0 1 4.2 4.2l-8.2 8.2a5 5 0 0 1-7.1-7.1l8-8",
};

const moods = ["Peaceful", "Hopeful", "Uncertain", "Grateful", "Tired", "Restless"];
const versions = ["My future self", "Me after graduation", "Me after the challenge", "Me one year from now"];
const prompts = [
  { axis: "Human", text: "Who matters most to you right now?" },
  { axis: "Human", text: "What would your voice sound like if I heard you today?" },
  { axis: "Place", text: "What would I see if I stood in this room with you?" },
  { axis: "Place", text: "What song, place, or photograph belongs with today?" },
  { axis: "Time", text: "What do you hope I remember about this season?" },
  { axis: "Time", text: "What does this moment know that the future may not?" },
  { axis: "Future self", text: "What are you afraid I might forget?" },
  { axis: "Future self", text: "What advice would you give me before I open this?" },
];
const promptAxes = ["Human", "Place", "Time", "Future self"];
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStream;
let recordingMode = "audio";
let discardRecording = false;
let recognition;
let isDictating = false;
let currentEchoes = [];
let routeToken = 0;
let pendingSealEcho = null;
let pendingDeleteEchoId = null;
let pendingExportEchoes = null;
let settingsStatusMessage = "";
let archiveKeySessionEnabled = false;

const themeProvider = {
  get() {
    return localStorage.getItem(themeKey) || "light";
  },
  set(theme) {
    localStorage.setItem(themeKey, theme);
    this.apply(theme);
    window.dispatchEvent(new CustomEvent("echo:themechange", { detail: { theme } }));
  },
  apply(theme = this.get()) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "dark" ? "dark" : theme === "light" ? "light" : "light dark";
  },
};

themeProvider.apply();

const systemThemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const handleSystemThemeChange = () => {
  if (themeProvider.get() === "system") themeProvider.apply("system");
};
if (systemThemeQuery?.addEventListener) {
  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
} else {
  systemThemeQuery?.addListener?.(handleSystemThemeChange);
}
window.addEventListener("storage", (event) => {
  if (event.key === themeKey) themeProvider.apply(event.newValue || "system");
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-route]");
  if (!target) return;
  event.preventDefault();
  location.hash = target.dataset.route;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
});

function readOpenedReturnedEchoIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(openedEchoesKey) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function hasOpenedReturnedEcho(id) {
  return readOpenedReturnedEchoIds().includes(id);
}

function markReturnedEchoOpened(id) {
  if (!id) return;
  const ids = new Set(readOpenedReturnedEchoIds());
  ids.add(id);
  localStorage.setItem(openedEchoesKey, JSON.stringify([...ids]));
}

function forgetReturnedEchoOpened(id) {
  if (!id) return;
  const ids = readOpenedReturnedEchoIds().filter((storedId) => storedId !== id);
  localStorage.setItem(openedEchoesKey, JSON.stringify(ids));
}

function markNewlyOpenedEcho(id) {
  if (!id) return;
  sessionStorage.setItem(newlyOpenedEchoKey, id);
}

function consumeNewlyOpenedEcho(id) {
  const storedId = sessionStorage.getItem(newlyOpenedEchoKey);
  if (storedId !== id) return false;
  sessionStorage.removeItem(newlyOpenedEchoKey);
  return true;
}

function archiveKeyEnabled() {
  return archiveKeySessionEnabled;
}

function setArchiveKeyEnabled(enabled) {
  archiveKeySessionEnabled = Boolean(enabled);
  localStorage.setItem(revealKey, "false");
}

function echoLogo() {
  return `
    <span class="brand-mark" aria-hidden="true">
      <span></span>
    </span>
  `;
}

function returnRemindersEnabled() {
  return localStorage.getItem(returnRemindersKey) === "true";
}

function readNotifiedReturnedEchoIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(notifiedReturnsKey) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberReturnedNotification(id) {
  if (!id) return;
  const ids = new Set(readNotifiedReturnedEchoIds());
  ids.add(id);
  localStorage.setItem(notifiedReturnsKey, JSON.stringify([...ids]));
}

const db = {
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) {
          const store = database.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("unlockAt", "unlockAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async all() {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  async put(echo) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(echo);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  async get(id) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async delete(id) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"></path></svg>`;
}

function route() {
  const token = ++routeToken;
  const onboarded = localStorage.getItem(onboardingKey) === "true";
  if (!onboarded) {
    renderOnboarding();
    return;
  }

  const [view, id] = location.hash.replace("#", "").split("/");
  const render = () => {
    if (view === "create") return renderCreate();
    if (view === "sealed" && id) return renderSealedReceipt(id, token);
    if (view === "sealed") return renderNotFound("This receipt could not be found.");
    if (view === "echo" && id) return renderDetail(id, token);
    if (view === "echo") return renderNotFound("This Echo could not be found.");
    if (view === "archive") return renderArchive(token);
    if (view === "settings") return renderSettings(token);
    if (view === "trust") return renderTrust();
    if (view === "demo") return renderDemo(token);
    if (view === "privacy") return renderPrivacy();
    if (view && view !== "home") return renderNotFound();
    return renderHome(token);
  };
  transitionView(render);
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

function setPageMeta(title = "Echo", description = defaultDescription) {
  document.title = title === "Echo" ? "Echo" : `${title} · Echo`;
  const descriptionMeta = document.querySelector("meta[name='description']");
  if (descriptionMeta) descriptionMeta.setAttribute("content", description);
}

function isCurrentRoute(token) {
  return token === routeToken;
}

function transitionView(render) {
  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(() => render());
    return;
  }
  render();
  requestAnimationFrame(() => {
    document.querySelectorAll(".motion-in").forEach((element, index) => {
      element.animate(
        [
          { opacity: 0, transform: "translateY(10px) scale(.992)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        {
          duration: 360,
          delay: index * 38,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "both",
        },
      );
    });
  });
}

function prefersReducedMotion() {
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return Boolean(motionQuery?.matches);
}

function topbar({ back = false, action = "", title = "Echo" } = {}) {
  return `
    <header class="topbar">
      <button class="brand" type="button" data-route="home" aria-label="Echo home">
        ${echoLogo()}
        <span>${title}</span>
      </button>
      <div class="actions">
        ${back ? `<button class="secondary-button" data-action="back">${icon("back")}Back</button>` : ""}
        ${action}
      </div>
    </header>
    `;
}

function bottomNav(active = "home") {
  return `
    <nav class="bottom-nav" aria-label="Primary">
      <button class="${active === "home" ? "is-active" : ""}" type="button" data-route="home">${icon("home")}Home</button>
      <button class="${active === "create" ? "is-active" : ""}" type="button" data-route="create">${icon("pen")}Write</button>
      <button class="${active === "archive" ? "is-active" : ""}" type="button" data-route="archive">${icon("archive")}Archive</button>
      <button class="${active === "settings" ? "is-active" : ""}" type="button" data-route="settings">${icon("settings")}Settings</button>
    </nav>
  `;
}

function renderPromptButtons(axis) {
  return prompts
    .filter((prompt) => prompt.axis === axis)
    .map(
      (prompt) => `
        <button type="button" data-action="prompt" data-axis="${escapeHtml(prompt.axis)}" data-prompt="${escapeHtml(prompt.text)}" aria-label="${escapeHtml(prompt.text)}">
          <span>${escapeHtml(prompt.axis === "Future self" ? "Future" : prompt.axis)}</span>
          ${escapeHtml(prompt.text)}
        </button>
      `,
    )
    .join("");
}

function renderOnboarding() {
  setPageMeta("Welcome", "Echo is a private time capsule for preserving versions of yourself.");
  const slides = [
    {
      eyebrow: "Echo",
      title: "The people we become slowly forget the people we were.",
      body: "Echo preserves a version of you before it disappears into the ordinary blur of time.",
    },
    {
      eyebrow: "Time capsules",
      title: "Moments deserve more than memory.",
      body: "Write a letter. Add photographs, voice, music, goals, mood, place, and weather. Then let it wait.",
    },
    {
      eyebrow: "One day",
      title: "You will hear from yourself again.",
      body: "An Echo opens in the future, not as a notification, but as a quiet conversation across time.",
    },
  ];
  let index = 0;

  function paint() {
    const slide = slides[index];
    app.innerHTML = `
      <section class="onboarding">
        <a class="brand" href="#" aria-label="Echo">
          <span class="brand-mark"></span>
          <span>Echo</span>
        </a>
        <div class="onboarding-stage">
          <div class="onboarding-copy">
            <p class="eyebrow">${slide.eyebrow}</p>
            <h1>${slide.title}</h1>
            <p>${slide.body}</p>
          </div>
          <div class="time-object" aria-hidden="true">
            <span class="time-hand"></span>
            <span class="time-glow"></span>
          </div>
        </div>
        <footer class="onboarding-footer">
          <div class="dots" aria-label="Onboarding progress">
            ${slides.map((_, i) => `<button class="dot ${i === index ? "is-active" : ""}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}
          </div>
          <div class="actions">
            <button class="quiet-button" data-action="skip">Skip</button>
            <button class="primary-button" data-action="next">${index === slides.length - 1 ? "Create your first Echo" : "Continue"}${icon("arrow")}</button>
          </div>
        </footer>
      </section>
    `;
  }

  app.onclick = (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.slide) {
      index = Number(target.dataset.slide);
      paint();
    }
    if (target.dataset.action === "skip") finishOnboarding();
    if (target.dataset.action === "next") {
      if (index < slides.length - 1) {
        index += 1;
        paint();
      } else finishOnboarding();
    }
  };

  paint();
}

function finishOnboarding() {
  localStorage.setItem(onboardingKey, "true");
  location.hash = "create";
  route();
}

async function renderHome(token = routeToken) {
  setPageMeta("Home");
  currentEchoes = await db.all();
  if (!isCurrentRoute(token)) return;
  currentEchoes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const now = Date.now();
  const unlocked = currentEchoes
    .filter((echo) => new Date(echo.unlockAt).getTime() <= now)
    .sort((a, b) => new Date(b.unlockAt) - new Date(a.unlockAt));
  const unopenedReturned = unlocked.filter((echo) => !hasOpenedReturnedEcho(echo.id));
  const openedReturned = unlocked.filter((echo) => hasOpenedReturnedEcho(echo.id));
  const sealed = currentEchoes
    .filter((echo) => new Date(echo.unlockAt).getTime() > now)
    .sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt));

  app.onclick = homeActions;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({
          action: `<button class="icon-button" data-action="settings" aria-label="Settings" title="Settings">${icon("settings")}</button>`,
        })}
        <section class="home-hero">
          <div>
            <p class="date-line">${formatLongDate(new Date())}</p>
            <h1 class="hero-title">Preserve who you are before time changes you.</h1>
            <p class="hero-copy">A private room for writing, and a quiet archive for the versions of you that have returned.</p>
          </div>
        </section>

        <button class="create-card" data-action="create">
          <span>${icon("plus")}</span>
          <strong>Create New Echo</strong>
          <small>Write freely or begin with prompts.</small>
        </button>

        ${unopenedReturned.length ? renderArrivalQueue(unopenedReturned) : ""}

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Returned Echoes</h2>
            <span class="muted">${openedReturned.length || "None yet"}</span>
          </div>
          ${openedReturned.length ? `<div class="echo-list">${openedReturned.slice(0, 4).map(echoRow).join("")}</div>` : unlockedEmpty(currentEchoes.length, unopenedReturned.length)}
        </section>

        <section class="sealed-summary" aria-label="Sealed Echoes">
          <div>
            <p class="eyebrow">Sealed away</p>
            <h2>${sealed.length ? `${sealed.length} Echo${sealed.length === 1 ? "" : "es"} waiting` : "No sealed Echoes yet"}</h2>
            <p>${sealed.length ? `The next one returns ${formatRelativeDate(sealed[0].unlockAt)}. The titles stay hidden until the future.` : "Create one for a date, a milestone, or a version of yourself you have not met yet."}</p>
          </div>
          <span class="echo-orb">${icon("lock")}</span>
        </section>
        ${sealed.length ? `
          <section class="sealed-vault" aria-label="Waiting Echoes">
            ${sealed.slice(0, 3).map((echo, index) => sealedObjectRow(echo, index)).join("")}
          </section>
        ` : ""}
      </div>
      ${bottomNav("home")}
    </section>
  `;
  maybeNotifyReturnedArrivals(unopenedReturned);
}

function renderArrivalQueue(echoes) {
  return `
    <section class="arrival-section" aria-label="Returned arrivals">
      <div>
        <p class="eyebrow">Arrival</p>
        <h2>${echoes.length === 1 ? "An Echo has returned." : `${echoes.length} Echoes have returned.`}</h2>
        <p>Open when you are ready. The first view will pause before the full archive comes back.</p>
      </div>
      <div class="arrival-list">
        ${echoes.slice(0, 3).map((echo, index) => returnedArrivalCard(echo, index)).join("")}
      </div>
    </section>
  `;
}

function returnedArrivalCard(echo, index) {
  const futureSelf = echo.futureSelf || "A future version of you";
  const media = describeAttachmentMix(echo.attachments || []);
  return `
    <button class="arrival-card" data-action="open" data-id="${echo.id}">
      <span class="arrival-index">Arrival ${String(index + 1).padStart(2, "0")}</span>
      <span class="arrival-body">
        <span class="echo-title">${escapeHtml(echo.title || "Untitled Echo")}</span>
        <span class="echo-meta">${arrivalReturnLabel(echo.unlockAt)} · Written ${formatShortDate(echo.createdAt)}</span>
      </span>
      <span class="arrival-facts" aria-label="Arrival facts">
        <span>${icon("unlock")}${escapeHtml(futureSelf)}</span>
        <span>${icon("paperclip")}${escapeHtml(media)}</span>
      </span>
    </button>
  `;
}

function arrivalReturnLabel(unlockAt) {
  const date = new Date(unlockAt);
  if (isSameLocalDate(date, new Date())) return "Returned today";
  return `Returned ${formatRelativeDate(unlockAt)}`;
}

function isSameLocalDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function unlockedEmpty(hasEchoes, hasUnopenedReturns = false) {
  if (hasUnopenedReturns) {
    return `
      <div class="empty-state compact-state">
        <p class="eyebrow">Awaiting first open</p>
        <h2>The archive is holding at the door.</h2>
        <p>Open a returned Echo above, and it will join this collection after the first reveal.</p>
      </div>
    `;
  }

  if (hasEchoes) {
    return `
      <div class="empty-state">
        <p class="eyebrow">Still sealed</p>
        <h2>Nothing has opened yet.</h2>
        <p>Your Echoes are waiting quietly. When the first one unlocks, it will appear here as something ready to be read, heard, and remembered.</p>
      </div>
    `;
  }

  return `
    <div class="empty-state">
      <p class="eyebrow">First launch</p>
      <h2>The first Echo becomes the start of your timeline.</h2>
      <p>No dashboards, streaks, or noise. Just a place to preserve the version of yourself that exists today.</p>
      <button class="primary-button" data-action="create">${icon("plus")}Create your first Echo</button>
    </div>
  `;
}

function echoRow(echo) {
  const locked = new Date(echo.unlockAt).getTime() > Date.now();
  const title = escapeHtml(echo.title || "Untitled Echo");
  const attachmentCount = echo.attachments?.length || 0;
  return `
    <button class="echo-row" data-action="open" data-id="${echo.id}">
      <span class="echo-orb">${icon(locked ? "lock" : "unlock")}</span>
      <span>
        <span class="echo-title">${title}</span>
        <span class="echo-meta">${locked ? "Opens" : "Opened"} ${formatRelativeDate(echo.unlockAt)} · ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}</span>
      </span>
      <span class="pill">${locked ? "Sealed" : "Unlocked"}</span>
    </button>
  `;
}

function returnedArtifactCard(echo, index) {
  const title = escapeHtml(echo.title || "Untitled Echo");
  const place = echo.context?.place?.label || echo.location || "Unplaced moment";
  const media = describeAttachmentMix(echo.attachments || []);
  const futureSelf = echo.futureSelf || "Future self";
  const artifactLabel = echo.demo ? "Demo artifact" : `Artifact ${String(index + 1).padStart(2, "0")}`;
  return `
    <button class="artifact-row" data-action="open" data-id="${echo.id}">
      <span class="artifact-index">${artifactLabel}</span>
      <span class="artifact-row-body">
        <span class="echo-title">${title}</span>
        <span class="echo-meta">Returned ${formatRelativeDate(echo.unlockAt)} · Written ${formatShortDate(echo.createdAt)}</span>
      </span>
      <span class="artifact-row-facts" aria-label="Artifact facts">
        <span>${icon("unlock")}${escapeHtml(futureSelf)}</span>
        <span>${icon("map")}${escapeHtml(place)}</span>
        <span>${icon("paperclip")}${escapeHtml(media)}</span>
      </span>
    </button>
  `;
}

function sealedObjectRow(echo, index) {
  const label = echo.demo ? `Demo sealed Echo ${index + 1}` : `Sealed Echo ${index + 1}`;
  return `
    <article class="sealed-object">
      <span class="echo-orb">${icon("lock")}</span>
      <span>
        <span class="echo-title">${label}</span>
        <span class="echo-meta">Returns ${formatRelativeDate(echo.unlockAt)} · Contents hidden</span>
      </span>
    </article>
  `;
}

function timeline(echoes) {
  return `
    <div class="timeline">
      ${echoes
        .slice(0, 8)
        .map(
          (echo) => `
            <button class="timeline-item" data-action="open" data-id="${echo.id}">
              <span class="timeline-title">${escapeHtml(echo.title || "Untitled Echo")}</span>
              <span class="echo-meta">${formatShortDate(echo.createdAt)} → ${formatShortDate(echo.unlockAt)}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function homeActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "create") location.hash = "create";
  if (target.dataset.action === "open") location.hash = `echo/${target.dataset.id}`;
  if (target.dataset.action === "settings") location.hash = "settings";
  if (target.dataset.action === "back") history.back();
}

async function renderArchive(token = routeToken) {
  setPageMeta("Archive", "The museum-like collection for Echoes that have returned.");
  const echoes = await db.all();
  if (!isCurrentRoute(token)) return;
  const now = Date.now();
  const unlocked = echoes
    .filter((echo) => new Date(echo.unlockAt).getTime() <= now)
    .sort((a, b) => new Date(b.unlockAt) - new Date(a.unlockAt));
  const sealed = echoes
    .filter((echo) => new Date(echo.unlockAt).getTime() > now)
    .sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt));
  const allowEarlyOpening = archiveKeyEnabled();

  app.onclick = archiveActions;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({
          title: "Archive",
          action: `<button class="icon-button" data-action="settings" aria-label="Settings" title="Settings">${icon("settings")}</button>`,
        })}
        <section class="archive-intro">
          <p class="eyebrow">Museum of returned selves</p>
          <h1 class="hero-title">Only what has come back belongs here.</h1>
          <p class="hero-copy">The archive should feel earned. Sealed Echoes stay out of sight until their date arrives.</p>
        </section>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Unlocked Collection</h2>
            <span class="muted">${unlocked.length || "Empty"}</span>
          </div>
          ${unlocked.length ? `<div class="artifact-catalog">${unlocked.map(returnedArtifactCard).join("")}</div>` : `
            <div class="empty-state compact-state">
              <p class="eyebrow">Nothing returned</p>
              <h2>The museum is still waiting for its first artifact.</h2>
              <p>When an Echo opens, its letter, voice, media, goals, mood, weather, and place will live here together.</p>
            </div>
          `}
        </section>

        <section class="sealed-summary">
          <div>
            <p class="eyebrow">Hidden collection</p>
            <h2>${sealed.length ? `${sealed.length} sealed` : "Nothing sealed"}</h2>
            <p>${allowEarlyOpening ? "The archive key is active. This is intentionally tucked away, not part of the daily experience." : "Titles and contents are hidden. Use the archive key only if you truly need early access."}</p>
          </div>
          <button class="secondary-button" data-action="settings">${icon("settings")}Settings</button>
        </section>

        ${allowEarlyOpening && sealed.length ? `
          <section class="section early-section">
            <div class="section-header">
              <h2 class="section-title">Early Access</h2>
              <span class="muted">Use carefully</span>
            </div>
            <div class="echo-list">${sealed.map(echoRow).join("")}</div>
          </section>
        ` : ""}
      </div>
      ${bottomNav("archive")}
    </section>
  `;
}

function archiveActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "open") location.hash = `echo/${target.dataset.id}`;
  if (target.dataset.action === "settings") location.hash = "settings";
}

async function renderSettings(token = routeToken) {
  setPageMeta("Settings", "Configure Echo's local profile, privacy, integrations, and prototype tools.");
  const echoes = await db.all();
  if (!isCurrentRoute(token)) return;
  const sealed = echoes.filter((echo) => new Date(echo.unlockAt).getTime() > Date.now());
  const allowEarlyOpening = archiveKeyEnabled();
  const theme = themeProvider.get();
  const profileName = localStorage.getItem(profileNameKey) || "";
  const writingTone = localStorage.getItem(writingToneKey) || "preserve";
  const contextApiBase = localStorage.getItem(contextApiBaseKey) || defaultContextApiBase;
  const returnReminderEnabled = returnRemindersEnabled();
  const returnReminderStatus = getReturnReminderStatus();
  const demoCount = echoes.filter((echo) => echo.demo === true).length;
  const exportSize = estimateExportSize(echoes);

  app.onclick = settingsActions;
  app.oninput = settingsInput;
  app.onchange = settingsInput;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ title: "Settings" })}
        <section class="settings-hero">
          <p class="eyebrow">Configuration</p>
          <h1 class="detail-title">Keep Echo quiet, private, and yours.</h1>
        </section>

        <section class="settings-group" aria-labelledby="profile-title">
          <div class="settings-heading">
            <h2 id="profile-title">Profile</h2>
            <span>Local only</span>
          </div>
          <label class="field-shell">
            <span>Name for prompts</span>
            <input data-setting="profileName" value="${escapeHtml(profileName)}" placeholder="Your name" autocomplete="off" />
          </label>
        </section>

        <section class="settings-group" aria-labelledby="preferences-title">
          <div class="settings-heading">
            <h2 id="preferences-title">Preferences</h2>
            <span>Instant</span>
          </div>
          <div class="preference-row">
            <div>
              <strong>Theme</strong>
              <small>Applies across every screen.</small>
            </div>
            <div class="theme-control" role="group" aria-label="Theme">
              ${["system", "light", "dark"].map((option) => `
                <button class="${theme === option ? "is-active" : ""}" type="button" data-action="theme" data-theme="${option}">
                  ${option[0].toUpperCase() + option.slice(1)}
                </button>
              `).join("")}
            </div>
          </div>
          <div class="preference-row">
            <div>
              <strong>Writing polish</strong>
              <small>Applies only to highlighted text.</small>
            </div>
            <div class="tone-control" role="group" aria-label="Writing polish">
              <button class="${writingTone === "preserve" ? "is-active" : ""}" type="button" data-action="writingTone" data-tone="preserve">Preserve my voice</button>
              <button class="${writingTone === "clean" ? "is-active" : ""}" type="button" data-action="writingTone" data-tone="clean">Clean grammar only</button>
            </div>
          </div>
          <div class="preference-row">
            <div>
              <strong>Return reminders</strong>
              <small>Browser alerts for arrivals, with no title or letter text.</small>
            </div>
            <div class="settings-inline-action">
              <span class="status-pill ${returnReminderStatus.className}">${returnReminderStatus.label}</span>
              <button class="secondary-button compact-button" type="button" data-action="toggleReturnReminders">
                ${returnReminderEnabled ? "Turn off" : "Enable"}
              </button>
            </div>
          </div>
        </section>

        <section class="settings-group" aria-labelledby="integrations-title">
          <div class="settings-heading">
            <h2 id="integrations-title">Integrations</h2>
            <span>Quiet</span>
          </div>
          <div class="preference-row">
            <div>
              <strong>On-device dictation</strong>
              <small>Uses the browser speech engine when available.</small>
            </div>
            <span class="status-pill">${speechRecognitionAvailable() ? "Available" : "Unavailable"}</span>
          </div>
          <details class="technical-proof">
            <summary>Technical proof</summary>
            <div class="technical-proof-body">
              <p>The moment context API exists for the judges and for future sync-ready architecture. It turns date and coordinates into place, weather, and daylight. Echo never sends the letter, title, mood, goals, or media.</p>
              <div class="preference-row">
                <div>
                  <strong>Moment context API</strong>
                  <small>Receives date and coordinates only.</small>
                </div>
                <button class="secondary-button compact-button" type="button" data-action="checkContextApi">Check API</button>
              </div>
              <label class="field-shell">
                <span>Context API endpoint</span>
                <input data-setting="contextApiBase" value="${escapeHtml(contextApiBase)}" placeholder="${defaultContextApiBase}" autocomplete="off" />
              </label>
              <div class="preference-row">
                <div>
                  <strong>Cloud transcription hook</strong>
                  <small>Future server route only. No browser key, no connected provider.</small>
                </div>
                <span class="status-pill muted-pill">Not connected</span>
              </div>
            </div>
          </details>
        </section>

        <section class="settings-group" aria-labelledby="trust-title">
          <div class="settings-heading">
            <h2 id="trust-title">Trust</h2>
            <span>Judge ready</span>
          </div>
          <div class="settings-panel">
            <span class="echo-orb">${icon("shield")}</span>
            <p class="eyebrow">Privacy architecture</p>
            <h3>Show what Echo protects.</h3>
            <p>A compact explanation of local storage, sealed-content rules, Docker APIs, and the no-chatbot AI boundary.</p>
            <div class="button-row">
              <button class="secondary-button" data-action="openTrust">${icon("shield")}Open trust layer</button>
              <button class="secondary-button" data-action="openPrivacy">${icon("paperclip")}Privacy page</button>
            </div>
          </div>
        </section>

        <section class="settings-group" aria-labelledby="keys-title">
          <div class="settings-heading">
            <h2 id="keys-title">API Keys</h2>
            <span>None stored</span>
          </div>
          <div class="empty-state compact-state">
            <p class="eyebrow">Privacy first</p>
            <h2>No API keys live in this prototype.</h2>
            <p>Future cloud transcription or AI polish should use a server-side route, never a visible browser key.</p>
          </div>
        </section>

        <section class="settings-group" aria-labelledby="archive-key-title">
          <div class="settings-heading">
            <h2 id="archive-key-title">Archive Key</h2>
            <span>${sealed.length} sealed</span>
          </div>
          <div class="settings-panel">
            <span class="echo-orb">${icon("lock")}</span>
            <p class="eyebrow">Not the normal path</p>
            <h3>Keep sealed Echoes hidden.</h3>
            <p>Echo is designed so you do not casually browse future letters. This key exists for editing, exporting, emergencies, or demos.</p>
            <button class="${allowEarlyOpening ? "danger-button" : "secondary-button"}" data-action="toggleReveal" data-sealed-count="${sealed.length}">
              ${allowEarlyOpening ? "Hide sealed Echoes again" : "Allow early opening"}
            </button>
          </div>
        </section>

        <section class="settings-group" aria-labelledby="data-title">
          <div class="settings-heading">
            <h2 id="data-title">Data</h2>
            <span>${echoes.length} saved</span>
          </div>
          <div class="settings-panel">
            <p class="eyebrow">Local-first</p>
            <h3>Keep your archive portable.</h3>
            <p>Export or import a local JSON backup of your Echoes, including returned and sealed letters. Nothing is sent anywhere.</p>
            <div class="button-row">
              <button class="secondary-button" data-action="exportData">${icon("save")}Export backup</button>
              <button class="secondary-button" data-action="exportCalendar">${icon("calendar")}Export return calendar</button>
              <button class="secondary-button" data-action="chooseImport">${icon("paperclip")}Import backup</button>
              <input id="backupInput" class="sr-only" type="file" accept="application/json,.json" aria-label="Import Echo backup" />
              <button class="danger-button" data-action="clearDemo"${demoCount ? "" : " disabled"}>${icon("trash")}Clear demo Echoes</button>
            </div>
            ${settingsStatusMessage ? `<p class="settings-status" role="status">${escapeHtml(settingsStatusMessage)}</p>` : ""}
            <span class="settings-note">${formatBytes(exportSize)} estimated · ${demoCount} demo</span>
          </div>
        </section>

        <section class="settings-group" aria-labelledby="prototype-title">
          <div class="settings-heading">
            <h2 id="prototype-title">Prototype</h2>
            <span>Demo only</span>
          </div>
          <div class="settings-panel">
            <p class="eyebrow">CAC walkthrough</p>
            <h3>Load a labeled demo Echo.</h3>
            <p>The default demo adds one returned Echo so the archive can be shown without surprise future locks.</p>
            <div class="button-row">
              <button class="secondary-button" data-action="seedDemo">${icon("archive")}Load demo Echo</button>
              <button class="secondary-button" data-action="seedFullDemo">${icon("lock")}Load full demo set</button>
              <button class="primary-button" data-action="openDemo">${icon("arrow")}Open walkthrough</button>
            </div>
          </div>
        </section>
      </div>
      ${bottomNav("settings")}
    </section>
  `;
}

function getReturnReminderStatus() {
  if (!("Notification" in window)) return { label: "Unavailable", className: "muted-pill" };
  if (returnRemindersEnabled() && Notification.permission === "granted") return { label: "On", className: "" };
  if (Notification.permission === "denied") return { label: "Blocked", className: "muted-pill" };
  return { label: "Off", className: "muted-pill" };
}

async function settingsActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") location.hash = "home";
  if (target.dataset.action === "theme") {
    themeProvider.set(target.dataset.theme);
    renderSettings();
  }
  if (target.dataset.action === "writingTone") {
    localStorage.setItem(writingToneKey, target.dataset.tone);
    renderSettings();
  }
  if (target.dataset.action === "toggleReveal") {
    const enabled = archiveKeyEnabled();
    if (!enabled) {
      showArchiveKeyReview(Number(target.dataset.sealedCount || 0));
      return;
    }
    setArchiveKeyEnabled(false);
    toast("Sealed Echoes hidden again.");
    renderSettings();
  }
  if (target.dataset.action === "cancelArchiveKey") {
    setArchiveKeyEnabled(false);
    closeArchiveKeyReview();
  }
  if (target.dataset.action === "confirmArchiveKey") {
    const typed = document.querySelector("#archiveKeyPhrase")?.value || "";
    if (typed !== archiveKeyPhrase) {
      toast("Type the full phrase to use the Archive Key.");
      document.querySelector("#archiveKeyPhrase")?.focus();
      return;
    }
    setArchiveKeyEnabled(true);
    closeArchiveKeyReview();
    toast("Archive Key enabled for this session.");
    renderSettings();
  }
  if (target.dataset.action === "seedDemo") {
    await seedDemoEchoes();
  }
  if (target.dataset.action === "seedFullDemo") {
    await seedDemoEchoes({ includeFuture: true });
  }
  if (target.dataset.action === "exportData") {
    await prepareEchoExport();
  }
  if (target.dataset.action === "exportCalendar") {
    await exportReturnCalendar();
  }
  if (target.dataset.action === "checkContextApi") {
    await checkContextApi(target);
  }
  if (target.dataset.action === "toggleReturnReminders") {
    await toggleReturnReminders();
  }
  if (target.dataset.action === "openTrust") {
    location.hash = "trust";
  }
  if (target.dataset.action === "openPrivacy") {
    location.hash = "privacy";
  }
  if (target.dataset.action === "openDemo") {
    location.hash = "demo";
  }
  if (target.dataset.action === "cancelExport") closeExportReview();
  if (target.dataset.action === "confirmExport") await commitPendingExport(target);
  if (target.dataset.action === "chooseImport") {
    document.querySelector("#backupInput")?.click();
  }
  if (target.dataset.action === "clearDemo") {
    await clearDemoEchoes();
  }
}

function showArchiveKeyReview(sealedCount) {
  document.querySelector("#archiveKeyDialog")?.remove();
  app.querySelector(".app-view")?.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="archiveKeyDialog" class="seal-dialog archive-key-dialog" aria-labelledby="archiveKeyDialogTitle" aria-describedby="archiveKeyDialogBody">
        <div class="seal-object" aria-hidden="true">
          <span class="echo-orb">${icon("lock")}</span>
        </div>
        <p class="eyebrow">Archive Key</p>
        <h2 id="archiveKeyDialogTitle">Open sealed Echoes early?</h2>
        <p id="archiveKeyDialogBody">This is for recovery, export, editing, or demos. It only stays open for this browser session. The normal archive should keep future letters out of reach until they return.</p>
        <dl class="seal-summary-list">
          <div><dt>Hidden now</dt><dd>${sealedCount} sealed Echo${sealedCount === 1 ? "" : "es"}</dd></div>
          <div><dt>Will reveal</dt><dd>Titles, letters, media, mood, place, goals, and context</dd></div>
          <div><dt>Resets</dt><dd>Refresh or leave the session to lock again</dd></div>
        </dl>
        <label class="field-shell archive-key-phrase">
          <span>Type this exact phrase</span>
          <code>${archiveKeyPhrase}</code>
          <input id="archiveKeyPhrase" autocomplete="off" />
        </label>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-action="cancelArchiveKey">Keep sealed</button>
          <button class="danger-button" type="button" data-action="confirmArchiveKey">${icon("unlock")}Unlock sealed Echoes</button>
        </div>
      </dialog>
    `,
  );
  const dialog = document.querySelector("#archiveKeyDialog");
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    setArchiveKeyEnabled(false);
    closeArchiveKeyReview();
  });
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
  dialog?.querySelector("[data-action='cancelArchiveKey']")?.focus();
}

function closeArchiveKeyReview() {
  const dialog = document.querySelector("#archiveKeyDialog");
  if (dialog?.close) dialog.close();
  dialog?.remove();
}

async function toggleReturnReminders() {
  if (returnRemindersEnabled()) {
    localStorage.setItem(returnRemindersKey, "false");
    toast("Return reminders turned off.");
    renderSettings();
    return;
  }

  if (!("Notification" in window)) {
    localStorage.setItem(returnRemindersKey, "false");
    toast("Return reminders are not available in this browser.");
    renderSettings();
    return;
  }

  if (Notification.permission === "granted") {
    localStorage.setItem(returnRemindersKey, "true");
    toast("Return reminders enabled.");
    renderSettings();
    return;
  }

  if (Notification.permission === "denied") {
    localStorage.setItem(returnRemindersKey, "false");
    toast("Return reminders are blocked in this browser.");
    renderSettings();
    return;
  }

  const permission = await Notification.requestPermission();
  const enabled = permission === "granted";
  localStorage.setItem(returnRemindersKey, enabled ? "true" : "false");
  toast(enabled ? "Return reminders enabled." : "Return reminders were not enabled.");
  renderSettings();
}

function maybeNotifyReturnedArrivals(echoes) {
  if (!returnRemindersEnabled() || !("Notification" in window) || Notification.permission !== "granted") return;
  const notified = new Set(readNotifiedReturnedEchoIds());
  echoes
    .filter((echo) => echo?.id && !notified.has(echo.id))
    .forEach((echo) => {
      new Notification("An Echo has returned.", {
        body: "Open Echo when you are ready.",
        tag: `echo-returned-${echo.id}`,
        silent: true,
      });
      rememberReturnedNotification(echo.id);
      notified.add(echo.id);
    });
}

async function settingsInput(event) {
  const target = event.target;
  if (target.id === "backupInput") {
    await importEchoData(target.files?.[0]);
    target.value = "";
    return;
  }
  if (target.dataset.setting === "profileName") {
    localStorage.setItem(profileNameKey, target.value);
  }
  if (target.dataset.setting === "writingTone") {
    localStorage.setItem(writingToneKey, target.value);
  }
  if (target.dataset.setting === "contextApiBase") {
    localStorage.setItem(contextApiBaseKey, target.value.trim() || defaultContextApiBase);
  }
}

function renderTrust() {
  setPageMeta("Trust", "Echo's privacy architecture keeps letters local and sealed by default.");
  app.onclick = trustActions;
  app.oninput = null;
  app.onchange = null;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ back: true, title: "Trust" })}
        <section class="settings-hero trust-hero">
          <p class="eyebrow">Privacy architecture</p>
          <h1 class="detail-title">Built to preserve a human, not extract one.</h1>
          <p class="hero-copy">Echo can capture voice, media, place, weather, and time while keeping the private letter sealed on the device.</p>
        </section>

        <section class="trust-grid" aria-label="Echo trust boundaries">
          ${trustCard("Local-first storage", "Letters, titles, media, moods, and goals are stored in browser IndexedDB. Export and import are user-controlled portability features.")}
          ${trustCard("Sealed by default", "Future Echoes hide title, letter, media, mood, and emotional details until their return date or the deliberately enabled Archive Key.")}
          ${trustCard("Seal fingerprint", "New Echoes receive a local SHA-256 fingerprint at sealing time, so the archive can show integrity without exposing the letter.")}
          ${trustCard("Context API boundary", "The Docker-ready API receives only date and coordinates. It enriches the moment with place, weather, and daylight, never the letter.")}
          ${trustCard("No AI wrapper", "Echo has no chatbot and does not generate emotional copy. The small polish affordance works only on selected text.")}
        </section>

        <section class="settings-panel trust-proof" aria-labelledby="trust-proof-title">
          <span class="echo-orb">${icon("shield")}</span>
          <p class="eyebrow">Technical proof</p>
          <h2 id="trust-proof-title">The product promise is tested.</h2>
          <dl class="context-list">
            <div><dt>Privacy</dt><dd>Playwright checks prove sealed Echoes do not reveal content in Home, Archive, delete, import, or export flows.</dd></div>
            <div><dt>Integrity</dt><dd>New sealed Echoes store a local SHA-256 fingerprint of the sealed payload for later archive verification.</dd></div>
            <div><dt>API</dt><dd>Node tests verify /api/context/moment returns structured context and rejects invalid coordinates before external calls.</dd></div>
            <div><dt>Quality</dt><dd>The suite covers accessibility, mobile overflow, local drafts, media limits, dictation fallback, and the Promptfoo AI policy gate.</dd></div>
            <div><dt>Docker</dt><dd>docker compose up --build runs the static app and the context API as separate services.</dd></div>
          </dl>
          <div class="button-row">
            <button class="secondary-button" type="button" data-action="checkContextApi">${icon("globe")}Check context API</button>
            <button class="secondary-button" type="button" data-action="privacy">${icon("paperclip")}Privacy page</button>
            <button class="primary-button" type="button" data-action="write">${icon("pen")}Write an Echo</button>
          </div>
        </section>
      </div>
      ${bottomNav("settings")}
    </section>
  `;
}

function trustCard(title, body) {
  return `
    <article class="trust-card">
      <span class="echo-orb">${icon("shield")}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

async function trustActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") location.hash = "settings";
  if (target.dataset.action === "privacy") location.hash = "privacy";
  if (target.dataset.action === "write") location.hash = "create";
  if (target.dataset.action === "checkContextApi") await checkContextApi(target);
}

function renderPrivacy() {
  setPageMeta("Privacy", "Echo's concise privacy page for local-first sealed letters, media, and context APIs.");
  app.onclick = privacyActions;
  app.oninput = null;
  app.onchange = null;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ back: true, title: "Privacy" })}
        <section class="privacy-page" aria-labelledby="privacy-title">
          <p class="eyebrow">Privacy page</p>
          <h1 id="privacy-title" class="detail-title">Your letter should not become someone else's data.</h1>
          <p class="hero-copy">Echo is built as a local-first prototype. The private letter, title, media, mood, goals, and sealed details stay in this browser unless you export them yourself.</p>
        </section>

        <section class="privacy-clauses" aria-label="Echo privacy commitments">
          ${privacyClause("What Echo stores", "Letters, returned and sealed Echoes, draft text, media attachments, mood, goals, theme preference, Archive Key state, and optional moment context are stored locally in browser storage.")}
          ${privacyClause("What Echo does not send", "Echo does not send letter text, titles, media, moods, goals, or emotional details to the context API. The API boundary accepts only date and coordinates for place, weather, and daylight enrichment.")}
          ${privacyClause("AI boundary", "Echo has no chatbot or assistant surface. The small writing polish control runs on explicitly highlighted text only and is covered by the Promptfoo policy gate before any AI provider is allowed.")}
          ${privacyClause("Backups", "Exports are local JSON files that may include sealed content. Import and export are user actions, and the app warns before creating a backup that contains locked letters.")}
          ${privacyClause("Prototype limits", "This version does not include accounts, cloud sync, server-side storage, or remote transcription. Future sync should preserve the same sealed-content rule and keep secrets on a server route, not in the browser.")}
        </section>

        <section class="settings-panel privacy-proof" aria-labelledby="privacy-proof-title">
          <span class="echo-orb">${icon("shield")}</span>
          <p class="eyebrow">Plain promise</p>
          <h2 id="privacy-proof-title">The future gets the first full look.</h2>
          <p>Sealed Echoes may be counted as waiting, but the everyday app hides their titles, letters, media names, mood, location, weather, and goals until the unlock date. The Archive Key exists for recovery and demos, not casual browsing.</p>
          <div class="button-row">
            <button class="secondary-button" type="button" data-action="trust">${icon("shield")}Trust layer</button>
            <a class="secondary-button" href="./privacy.html">${icon("paperclip")}Standalone page</a>
          </div>
        </section>
      </div>
      ${bottomNav("settings")}
    </section>
  `;
}

function privacyClause(title, body) {
  return `
    <article class="privacy-clause">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function privacyActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") location.hash = "settings";
  if (target.dataset.action === "trust") location.hash = "trust";
}

function renderNotFound(message = "This room does not exist yet.") {
  setPageMeta("Not Found", "This Echo route does not exist.");
  app.onclick = notFoundActions;
  app.oninput = null;
  app.onchange = null;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ back: true, title: "Echo" })}
        <section class="detail-panel not-found-state">
          <span class="echo-orb">${icon("lock")}</span>
          <p class="eyebrow">Uncatalogued</p>
          <h1 class="detail-title">${escapeHtml(message)}</h1>
          <p class="hero-copy">Nothing private is shown here. Return to the room, or write a new Echo for a version of yourself that has not arrived yet.</p>
          <div class="button-row">
            <button class="secondary-button" type="button" data-action="home">${icon("home")}Home</button>
            <button class="primary-button" type="button" data-action="write">${icon("pen")}Write</button>
          </div>
        </section>
      </div>
      ${bottomNav("home")}
    </section>
  `;
}

function notFoundActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back" || target.dataset.action === "home") location.hash = "home";
  if (target.dataset.action === "write") location.hash = "create";
}

async function renderDemo(token = routeToken) {
  setPageMeta("Walkthrough", "A judge-ready walkthrough of Echo's story, privacy rules, and technical proof.");
  const echoes = await db.all();
  if (!isCurrentRoute(token)) return;
  const now = Date.now();
  const returned = echoes.filter((echo) => new Date(echo.unlockAt).getTime() <= now).length;
  const sealed = echoes.filter((echo) => new Date(echo.unlockAt).getTime() > now).length;
  const demoCount = echoes.filter((echo) => echo.demo === true).length;
  const returnedDemoEcho = echoes
    .filter((echo) => echo.demo === true && new Date(echo.unlockAt).getTime() <= now)
    .sort((a, b) => new Date(b.unlockAt) - new Date(a.unlockAt))[0];

  app.onclick = demoActions;
  app.oninput = null;
  app.onchange = null;
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ back: true, title: "Walkthrough" })}
        <section class="settings-hero demo-hero">
          <p class="eyebrow">Judge walkthrough</p>
          <h1 class="detail-title">Capture a human, a place, and a time.</h1>
          <p class="hero-copy">Echo is a private time capsule for identity across time: a letter-writing room for the present self, and an archive for returned versions of a person.</p>
          <button class="primary-button demo-start" type="button" data-action="startDemo">
            ${icon("arrow")}Start live walkthrough
          </button>
        </section>

        <section class="demo-cue-sheet" aria-labelledby="demo-cue-title">
          <div>
            <p class="eyebrow">Recording cue sheet</p>
            <h2 id="demo-cue-title">A clean two-minute path for the video.</h2>
          </div>
          <div class="demo-cues">
            ${demoCue("00:00", "Problem", "Files survive. The feeling of being there usually does not.", "goHome", "Start frame")}
            ${demoCue("00:20", "Capture", "Write, speak, record, attach media, and save the surrounding moment.", "goCreate", "Writing room")}
            ${demoCue("00:55", "Boundary", "Local-first storage, tested sealed-content privacy, no chatbot.", "goTrust", "Trust layer")}
            ${demoCue("01:25", "Reveal", "Open a returned Echo as an artifact from a real person in time.", "startDemo", "Artifact reveal")}
          </div>
        </section>

        <section class="demo-status" aria-label="Demo collection status">
          <div aria-label="${echoes.length} total Echoes"><span>${echoes.length}</span><small>Total Echoes</small></div>
          <div aria-label="${returned} returned Echoes"><span>${returned}</span><small>Returned</small></div>
          <div aria-label="${sealed} sealed Echoes"><span>${sealed}</span><small>Sealed</small></div>
          <div aria-label="${demoCount} demo Echoes"><span>${demoCount}</span><small>Demo</small></div>
        </section>

        <section class="demo-path" aria-labelledby="demo-path-title">
          <p class="eyebrow" id="demo-path-title">Two minute story</p>
          ${demoStep("01", "The real problem", "People preserve photos and files, but lose the interior context: what they feared, hoped, sounded like, and where life actually was when the moment happened.")}
          ${demoStep("02", "The product move", "Echo lets someone write, speak, record, and attach media to a future self, then locks the artifact until a chosen date or version of life.")}
          ${demoStep("03", "The technical proof", "The app is local-first, tested for sealed-content privacy, includes voice and media capture, and has a Docker-ready context API for place, weather, and daylight.")}
          ${demoStep("04", "The boundary", "Echo uses AI tools in development and policy evaluation, but the product itself is not an AI wrapper. The letter stays private unless the user explicitly chooses otherwise later.")}
        </section>

        <section class="settings-panel demo-script" aria-labelledby="demo-script-title">
          <span class="echo-orb">${icon("archive")}</span>
          <p class="eyebrow">Live path</p>
          <h2 id="demo-script-title">Run the demo without breaking the promise.</h2>
          <dl class="context-list">
            <div><dt>Start</dt><dd>Seed one labeled returned demo Echo, then show Home: returned arrivals are ready while future content remains hidden unless explicitly loaded.</dd></div>
            <div><dt>Build</dt><dd>Open Write to show freewriting, voice, video, selected-text polish, and moment context capture.</dd></div>
            <div><dt>Trust</dt><dd>Open the Trust layer to show tests, API boundaries, Docker services, and the no-chatbot product decision.</dd></div>
            <div><dt>Finish</dt><dd>Open Archive and tap the returned Echo. The first view is an artifact reveal before the letter appears.</dd></div>
          </dl>
          <div class="button-row">
            <button class="secondary-button" type="button" data-action="prepareDemo">${icon("save")}Prepare demo Echo</button>
            <button class="secondary-button" type="button" data-action="goHome">${icon("home")}Home</button>
            <button class="secondary-button" type="button" data-action="goCreate">${icon("pen")}Write</button>
            <button class="secondary-button" type="button" data-action="goTrust">${icon("shield")}Trust</button>
            <button class="secondary-button" type="button" data-action="openReturnedDemo"${returnedDemoEcho ? ` data-id="${returnedDemoEcho.id}"` : " disabled"}>${icon("unlock")}Returned demo</button>
            <button class="primary-button" type="button" data-action="goArchive">${icon("archive")}Archive</button>
          </div>
        </section>
      </div>
      ${bottomNav("settings")}
    </section>
  `;
}

function demoStep(number, title, body) {
  return `
    <article class="demo-step">
      <span class="demo-number">${number}</span>
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
      </div>
    </article>
  `;
}

function demoCue(time, title, body, action, label) {
  return `
    <article class="demo-cue">
      <span>${escapeHtml(time)}</span>
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
      <button class="secondary-button compact-button" type="button" data-action="${escapeHtml(action)}">${escapeHtml(label)}</button>
    </article>
  `;
}

async function demoActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") location.hash = "settings";
  if (target.dataset.action === "startDemo") {
    const returnedDemoEcho = await prepareDemoWalkthrough();
    if (returnedDemoEcho) location.hash = `echo/${returnedDemoEcho.id}`;
  }
  if (target.dataset.action === "prepareDemo") {
    await seedDemoEchoes();
    renderDemo();
  }
  if (target.dataset.action === "goHome") location.hash = "home";
  if (target.dataset.action === "goCreate") location.hash = "create";
  if (target.dataset.action === "goTrust") location.hash = "trust";
  if (target.dataset.action === "openReturnedDemo" && target.dataset.id) location.hash = `echo/${target.dataset.id}`;
  if (target.dataset.action === "goArchive") location.hash = "archive";
}

async function checkContextApi(button) {
  const apiBase = (localStorage.getItem(contextApiBaseKey) || defaultContextApiBase).replace(/\/$/, "");
  button.disabled = true;
  try {
    const response = await fetch(`${apiBase}/api/health`, { headers: { Accept: "application/json" } });
    const payload = response.ok ? await response.json() : null;
    if (payload?.ok === true && payload.privacy === "letters-never-required") {
      toast("Context API healthy. Letters stay local.");
      return;
    }
    toast("Context API responded without Echo's privacy contract.");
  } catch {
    toast("Context API is not reachable yet.");
  } finally {
    button.disabled = false;
  }
}

async function renderCreate() {
  setPageMeta("Write", "Write, speak, record, and seal a private Echo for a future version of yourself.");
  app.onclick = createActions;
  app.oninput = createInput;
  app.onchange = createChanges;
  const draft = readCreateDraft();
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ title: "Write" })}
        <h1 class="sr-only">Create a new Echo</h1>
        <form id="echo-form" class="capture-layout">
          <section class="capture-panel">
            <section class="artifact-rail" aria-label="Media and voice">
              <button class="artifact-card voice-card" type="button" data-action="openStudio" data-mode="audio">
                <span class="artifact-icon">${icon("mic")}</span>
                <span>
                  <strong>Voice note</strong>
                  <small id="recordingState">Open the room</small>
                </span>
              </button>
              <button class="artifact-card video-card" type="button" data-action="openStudio" data-mode="video">
                <span class="artifact-icon">${icon("video")}</span>
                <span>
                  <strong>Video note</strong>
                  <small>Record the room</small>
                </span>
              </button>
              <button class="artifact-card dictation-card" type="button" data-action="dictate">
                <span class="artifact-icon">${icon("pen")}</span>
                <span>
                  <strong>Dictate</strong>
                  <small>Speak into the letter field</small>
                </span>
              </button>
              <label class="artifact-card upload-card" for="mediaInput">
                <span class="artifact-icon">${icon("image")}</span>
                <span>
                  <strong>Photos + files</strong>
                  <small>Add media, music, or files</small>
                </span>
                <input id="mediaInput" class="sr-only" type="file" multiple accept="image/*,video/*,audio/*" aria-label="Add media files" />
              </label>
              <button class="artifact-card context-card" type="button" data-action="captureContext">
                <span class="artifact-icon">${icon("globe")}</span>
                <span>
                  <strong>Moment</strong>
                  <small id="contextState">Capture place and time</small>
                </span>
              </button>
              <div id="attachmentList" class="attachment-list artifact-list"></div>
            </section>

            <div class="mode-switch" role="group" aria-label="Writing mode">
              <button class="is-active" type="button" data-action="mode" data-mode="free">Freewrite</button>
              <button type="button" data-action="mode" data-mode="prompts">Prompts</button>
            </div>
            <div id="promptShelf" class="prompt-shelf hidden">
              <div class="prompt-tabs" role="tablist" aria-label="Prompt categories">
                ${promptAxes.map((axis, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" role="tab" aria-selected="${index === 0 ? "true" : "false"}" data-action="promptAxis" data-axis="${escapeHtml(axis)}">${escapeHtml(axis === "Future self" ? "Future" : axis)}</button>`).join("")}
              </div>
              <div id="promptList" class="prompt-list">
                ${renderPromptButtons(promptAxes[0])}
              </div>
            </div>
            <section id="activePromptCue" class="active-prompt-cue hidden" aria-live="polite"></section>
            <textarea class="composer-title" id="title" name="title" rows="1" autocomplete="off" placeholder="A letter to later"></textarea>
            <div class="writing-polish" aria-label="Writing polish">
              <button class="quiet-button" type="button" data-action="polishSelection">${icon("pen")}Polish selected text</button>
              <span>Only highlighted words. Never the full letter.</span>
            </div>
            <div class="draft-status">
              <span id="draftState" aria-live="polite">${draft ? "Draft restored locally." : "Draft saved on this device."}</span>
              <button class="quiet-button" type="button" data-action="clearDraft"${draft ? "" : " disabled"}>Clear draft</button>
            </div>
            <textarea class="letter-field" id="letter" name="letter" placeholder="Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time."></textarea>
          </section>

          <aside class="capture-panel">
            <section class="field-section" aria-labelledby="presentMomentTitle">
              <h2 id="presentMomentTitle">Present moment</h2>
              <p>Capture enough of now that the future can feel the room again.</p>
            </section>
            <div class="field-group">
              <label>Mood right now</label>
              <div class="mood-grid">
                ${moods.map((mood) => `<button class="mood-button" type="button" data-action="mood" data-mood="${mood}">${mood}</button>`).join("")}
              </div>
              <input id="mood" name="mood" type="hidden" />
            </div>

            <div class="field-group">
              <label for="weather">Weather</label>
              <input id="weather" name="weather" placeholder="Warm, raining, clear sky..." />
            </div>

            <div class="field-group">
              <label for="location">Location</label>
              <div class="recording">
                <input id="location" name="location" placeholder="Where are you?" />
                <button class="icon-button" type="button" data-action="locate" aria-label="Use current location" title="Use current location">${icon("map")}</button>
              </div>
            </div>

            <section class="field-section" aria-labelledby="futureHopeTitle">
              <h2 id="futureHopeTitle">Future hope</h2>
              <p>Name who should receive this, and what you hope will be true when it opens.</p>
            </section>
            <div class="field-group">
              <label for="futureSelf">Who are you writing to?</label>
              <input id="futureSelf" name="futureSelf" placeholder="Me after senior year" />
              <div class="chip-row">
                ${versions.map((version) => `<button class="chip" type="button" data-action="version" data-version="${version}">${version}</button>`).join("")}
              </div>
            </div>

            <div class="field-group">
              <label for="unlockAt">Open this Echo on</label>
              <input id="unlockAt" name="unlockAt" type="date" aria-label="Open this Echo on" required />
            </div>

            <div class="field-group">
              <label for="goals">What I’m trying to become</label>
              <textarea id="goals" name="goals" placeholder="What are you trying to become?"></textarea>
            </div>

            <div class="field-group">
              <label for="futureHope">When this opens, I hope...</label>
              <textarea id="futureHope" name="futureHope" placeholder="What do you hope future-you can say is true?"></textarea>
            </div>

            <input id="contextPayload" name="contextPayload" type="hidden" />
            <section id="momentContextPanel" class="moment-context-panel hidden" aria-live="polite"></section>

            <section id="artifactSummary" class="artifact-summary" aria-live="polite"></section>

            <div class="actions">
              <button class="primary-button" type="submit">${icon("save")}Seal Echo</button>
            </div>
          </aside>
        </form>
      </div>
      ${bottomNav("create")}
    </section>
  `;

  const unlockAt = document.querySelector("#unlockAt");
  unlockAt.value = defaultUnlockDate();
  if (draft) restoreCreateDraft(draft);
  resizeTitleField();
  updateArtifactSummary();

  document.querySelector("#echo-form").addEventListener("submit", saveEcho);
}

async function createActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") {
    event.preventDefault();
    location.hash = "home";
  }
  if (target.dataset.action === "mood") {
    event.preventDefault();
    document.querySelectorAll(".mood-button").forEach((button) => button.classList.remove("is-active"));
    target.classList.add("is-active");
    document.querySelector("#mood").value = target.dataset.mood;
    saveCreateDraft();
  }
  if (target.dataset.action === "mode") {
    event.preventDefault();
    document.querySelectorAll(".mode-switch button").forEach((button) => button.classList.remove("is-active"));
    target.classList.add("is-active");
    const promptMode = target.dataset.mode === "prompts";
    document.querySelector("#promptShelf").classList.toggle("hidden", !promptMode);
    if (!promptMode) clearActivePromptCue();
  }
  if (target.dataset.action === "promptAxis") {
    event.preventDefault();
    document.querySelectorAll(".prompt-tabs button").forEach((button) => {
      const active = button === target;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelector("#promptList").innerHTML = renderPromptButtons(target.dataset.axis);
  }
  if (target.dataset.action === "prompt") {
    event.preventDefault();
    setActivePromptCue(target.dataset.axis, target.dataset.prompt);
    document.querySelector("#letter")?.focus();
    saveCreateDraft();
  }
  if (target.dataset.action === "version") {
    event.preventDefault();
    document.querySelector("#futureSelf").value = target.dataset.version;
    saveCreateDraft();
  }
  if (target.dataset.action === "locate") {
    event.preventDefault();
    useLocation();
  }
  if (target.dataset.action === "captureContext") {
    event.preventDefault();
    await captureMomentContext(target);
  }
  if (target.dataset.action === "openStudio") {
    event.preventDefault();
    showCaptureStudio(target.dataset.mode || "audio");
  }
  if (target.dataset.action === "switchStudioMode") {
    event.preventDefault();
    showCaptureStudio(target.dataset.mode || "audio");
  }
  if (target.dataset.action === "startStudio") {
    event.preventDefault();
    await startStudioRecording(target.dataset.mode || "audio");
  }
  if (target.dataset.action === "stopStudio") {
    event.preventDefault();
    stopStudioRecording();
  }
  if (target.dataset.action === "closeStudio") {
    event.preventDefault();
    closeCaptureStudio();
  }
  if (target.dataset.action === "polishSelection") {
    event.preventDefault();
    polishSelectedText();
    saveCreateDraft();
  }
  if (target.dataset.action === "dictate") {
    event.preventDefault();
    toggleDictation(target);
  }
  if (target.dataset.action === "removeAttachment") {
    event.preventDefault();
    removeAttachment(target.dataset.id);
  }
  if (target.dataset.action === "clearDraft") {
    event.preventDefault();
    clearCreateDraft();
  }
  if (target.dataset.action === "cancelSeal") {
    event.preventDefault();
    closeSealReview();
  }
  if (target.dataset.action === "confirmSeal") {
    event.preventDefault();
    await commitPendingSeal(target);
  }
}

function setActivePromptCue(axis, text) {
  const cue = document.querySelector("#activePromptCue");
  if (!cue) return;
  cue.classList.remove("hidden");
  cue.dataset.prompt = text || "";
  sessionStorage.setItem(activePromptKey, JSON.stringify({ axis, text }));
  cue.innerHTML = `
    <p class="eyebrow">${escapeHtml(axis === "Future self" ? "Future" : axis)}</p>
    <strong>${escapeHtml(text)}</strong>
  `;
}

function clearActivePromptCue() {
  const cue = document.querySelector("#activePromptCue");
  if (!cue) return;
  cue.classList.add("hidden");
  cue.dataset.prompt = "";
  cue.innerHTML = "";
  sessionStorage.removeItem(activePromptKey);
}

function createInput(event) {
  if (event.target.closest("#echo-form")) {
    if (event.target.id === "title") resizeTitleField(event.target);
    saveCreateDraft();
    updateArtifactSummary();
  }
}

async function createChanges(event) {
  if (event.target.id !== "mediaInput") {
    if (event.target.closest("#echo-form")) {
      saveCreateDraft();
      updateArtifactSummary();
    }
    return;
  }
  const files = [...event.target.files];
  const list = document.querySelector("#attachmentList");
  const current = JSON.parse(list.dataset.attachments || "[]");
  const accepted = [];
  const rejected = [];
  let totalBytes = current.reduce((sum, file) => sum + (file.size || 0), 0);
  for (const file of files) {
    if (file.size > maxAttachmentBytes) {
      rejected.push(file.name);
      continue;
    }
    if (totalBytes + file.size > maxAttachmentTotalBytes) {
      rejected.push(file.name);
      continue;
    }
    accepted.push(file);
    totalBytes += file.size;
  }
  if (rejected.length) {
    toast(`${rejected.length} file${rejected.length === 1 ? "" : "s"} skipped. Keep attachments under ${formatBytes(maxAttachmentBytes)} each.`);
  }
  const attachments = [...current, ...(await Promise.all(accepted.map(fileToAttachment)))];
  list.dataset.attachments = JSON.stringify(attachments);
  renderAttachmentList(list, attachments);
  updateArtifactSummary();
  event.target.value = "";
}

function removeAttachment(id) {
  const list = document.querySelector("#attachmentList");
  if (!list) return;
  const attachments = JSON.parse(list.dataset.attachments || "[]").filter((file) => file.id !== id);
  list.dataset.attachments = JSON.stringify(attachments);
  renderAttachmentList(list, attachments);
  updateArtifactSummary();
  toast("Attachment removed.");
}

function currentAttachments() {
  const list = document.querySelector("#attachmentList");
  if (!list) return [];
  try {
    const attachments = JSON.parse(list.dataset.attachments || "[]");
    return Array.isArray(attachments) ? attachments : [];
  } catch {
    return [];
  }
}

function attachmentMix(attachments = []) {
  return attachments.reduce(
    (mix, file) => {
      const name = file.name || "";
      const type = file.type || "";
      if (type.startsWith("image/")) mix.photos += 1;
      else if (type.startsWith("video/")) mix.videos += 1;
      else if (type.startsWith("audio/") && name.startsWith("Voice note")) mix.voice += 1;
      else if (type.startsWith("audio/")) mix.audio += 1;
      else mix.files += 1;
      mix.bytes += file.size || 0;
      return mix;
    },
    { photos: 0, videos: 0, voice: 0, audio: 0, files: 0, bytes: 0 },
  );
}

function plural(count, singular, pluralName = `${singular}s`) {
  if (!count) return "";
  return `${count} ${count === 1 ? singular : pluralName}`;
}

function describeAttachmentMix(attachments = []) {
  const mix = attachmentMix(attachments);
  const parts = [
    plural(mix.voice, "voice note"),
    plural(mix.videos, "video"),
    plural(mix.photos, "photo", "photos"),
    plural(mix.audio, "audio note"),
    plural(mix.files, "file"),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "No media yet";
}

function capsuleSignals({ letter = "", futureSelf = "", location = "", weather = "", unlockAt = "", attachments = [], context = null } = {}) {
  const mix = attachmentMix(attachments);
  const hasCapturedPerson = Boolean(
    futureSelf.trim() ||
      countWords(letter) >= 18 ||
      mix.voice ||
      mix.videos ||
      mix.audio,
  );
  const hasCapturedPlace = Boolean(context || location.trim() || weather.trim() || mix.photos || mix.videos);
  const hasCapturedTime = /^\d{4}-\d{2}-\d{2}$/.test(unlockAt) && isFutureDateInput(unlockAt);

  return [
    { label: "Human", ready: hasCapturedPerson },
    { label: "Place", ready: hasCapturedPlace },
    { label: "Time", ready: hasCapturedTime },
  ];
}

function describeCapsuleSignals(signals) {
  const ready = signals.filter((signal) => signal.ready).map((signal) => signal.label.toLowerCase());
  if (ready.length === signals.length) return "Human, place, and time captured";
  if (ready.length) return `${capitalizeSentence(formatSeries(ready))} started`;
  return "Still gathering the moment";
}

function formatSeries(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function capitalizeSentence(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "";
}

function renderCapsuleSignals(signals) {
  return `
    <div class="capsule-signals" aria-label="Human place and time readiness">
      ${signals
        .map(
          (signal) => `
            <span class="${signal.ready ? "is-ready" : ""}">
              ${signal.ready ? icon("unlock") : icon("lock")}${escapeHtml(signal.label)}
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPreservationMeter(signals) {
  const readyCount = signals.filter((signal) => signal.ready).length;
  return `
    <section class="preservation-meter" aria-label="Preservation readiness" role="group">
      <div class="preservation-head">
        <div>
          <p class="eyebrow">Preservation</p>
          <strong>${escapeHtml(describeCapsuleSignals(signals))}</strong>
        </div>
        <span aria-hidden="true">${readyCount}/3</span>
      </div>
      <div class="preservation-track" role="progressbar" aria-label="Preserved threads" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${readyCount}">
        ${signals.map((signal) => `<span class="${signal.ready ? "is-ready" : ""}"></span>`).join("")}
      </div>
      <div class="preservation-threads">
        ${signals
          .map(
            (signal) => `
              <article class="preservation-thread${signal.ready ? " is-ready" : ""}">
                <span>${signal.ready ? icon("unlock") : icon("lock")}</span>
                <div>
                  <strong>${escapeHtml(signal.label)}</strong>
                  <small>${escapeHtml(preservationCue(signal))}</small>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function preservationCue(signal) {
  if (signal.ready) return "Anchored";
  if (signal.label === "Human") return "Voice, letter, or future self";
  if (signal.label === "Place") return "Room, weather, media, or context";
  return "Choose the return date";
}

function updateArtifactSummary() {
  const summary = document.querySelector("#artifactSummary");
  if (!summary) return;
  const letter = document.querySelector("#letter")?.value || "";
  const futureSelf = document.querySelector("#futureSelf")?.value || "";
  const location = document.querySelector("#location")?.value || "";
  const weather = document.querySelector("#weather")?.value || "";
  const unlockAt = document.querySelector("#unlockAt")?.value || "";
  const attachments = currentAttachments();
  const context = readContextPayload(document.querySelector("#contextPayload")?.value || "");
  const wordCount = countWords(letter);
  const mediaText = describeAttachmentMix(attachments);
  const mediaBytes = formatBytes(attachmentMix(attachments).bytes);
  const returnDate = /^\d{4}-\d{2}-\d{2}$/.test(unlockAt)
    ? formatLongDate(new Date(`${unlockAt}T12:00:00`))
    : "Choose a date";
  const signals = capsuleSignals({ letter, futureSelf, location, weather, unlockAt, attachments, context });

  summary.innerHTML = `
    <p class="eyebrow">Artifact so far</p>
    ${renderPreservationMeter(signals)}
    <dl class="artifact-summary-list">
      <div><dt>Letter</dt><dd>${wordCount ? `${wordCount} word${wordCount === 1 ? "" : "s"}` : "Not written yet"}</dd></div>
      <div><dt>Media</dt><dd>${escapeHtml(mediaText)}${attachments.length ? ` · ${mediaBytes}` : ""}</dd></div>
      <div><dt>Moment</dt><dd>${context ? "Place and time captured" : "Manual details only"}</dd></div>
      <div><dt>Return</dt><dd>${escapeHtml(returnDate)}</dd></div>
    </dl>
  `;
}

function readCreateDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
    return draftHasContent(draft) ? draft : null;
  } catch {
    localStorage.removeItem(draftKey);
    return null;
  }
}

function restoreCreateDraft(draft) {
  const fields = ["title", "letter", "futureSelf", "futureHope", "unlockAt", "goals", "weather", "location", "mood", "contextPayload"];
  for (const id of fields) {
    const field = document.querySelector(`#${id}`);
    if (field && typeof draft[id] === "string") field.value = draft[id];
  }
  resizeTitleField();
  renderMomentContext(readContextPayload(draft.contextPayload));
  document.querySelectorAll(".mood-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mood === draft.mood);
  });
  setDraftState("Draft restored locally.", true);
}

function resizeTitleField(field = document.querySelector("#title")) {
  if (!field) return;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
}

function saveCreateDraft() {
  const form = document.querySelector("#echo-form");
  if (!form) return;

  const draft = {
    title: document.querySelector("#title")?.value || "",
    letter: document.querySelector("#letter")?.value || "",
    futureSelf: document.querySelector("#futureSelf")?.value || "",
    futureHope: document.querySelector("#futureHope")?.value || "",
    unlockAt: document.querySelector("#unlockAt")?.value || "",
    goals: document.querySelector("#goals")?.value || "",
    weather: document.querySelector("#weather")?.value || "",
    location: document.querySelector("#location")?.value || "",
    mood: document.querySelector("#mood")?.value || "",
    contextPayload: document.querySelector("#contextPayload")?.value || "",
    updatedAt: new Date().toISOString(),
  };

  if (!draftHasContent(draft)) {
    localStorage.removeItem(draftKey);
    setDraftState("Draft saved on this device.", false);
    return;
  }

  localStorage.setItem(draftKey, JSON.stringify(draft));
  setDraftState("Draft saved locally.", true);
}

function clearCreateDraft() {
  localStorage.removeItem(draftKey);
  clearActivePromptCue();
  document.querySelector("#echo-form")?.reset();
  document.querySelectorAll(".mood-button").forEach((button) => button.classList.remove("is-active"));
  document.querySelector("#unlockAt").value = defaultUnlockDate();
  const attachmentList = document.querySelector("#attachmentList");
  if (attachmentList) {
    attachmentList.dataset.attachments = "[]";
    renderAttachmentList(attachmentList, []);
  }
  renderMomentContext(null);
  updateArtifactSummary();
  setDraftState("Draft cleared.", false);
}

function setDraftState(message, hasDraft) {
  const state = document.querySelector("#draftState");
  const button = document.querySelector("[data-action='clearDraft']");
  if (state) state.textContent = message;
  if (button) button.disabled = !hasDraft;
}

function draftHasContent(draft) {
  if (!draft || typeof draft !== "object") return false;
  const contentFields = ["title", "letter", "futureSelf", "futureHope", "goals", "weather", "location", "mood", "contextPayload"];
  const hasText = contentFields.some((field) => typeof draft[field] === "string" && draft[field].trim());
  const changedDate = typeof draft.unlockAt === "string" && draft.unlockAt && draft.unlockAt !== defaultUnlockDate();
  return hasText || changedDate;
}

function defaultUnlockDate() {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return dateInputValue(nextYear);
}

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value > dateInputValue(new Date());
}

function buildEchoFromForm(formElement) {
  const form = new FormData(formElement);
  const attachmentList = document.querySelector("#attachmentList");
  const attachments = JSON.parse(attachmentList.dataset.attachments || "[]");
  const title = String(form.get("title") || "").trim() || "Untitled Echo";
  const letter = String(form.get("letter") || "").trim();
  return {
    id: crypto.randomUUID(),
    title,
    letter,
    goals: String(form.get("goals") || "").trim(),
    futureSelf: String(form.get("futureSelf") || "").trim(),
    futureHope: String(form.get("futureHope") || "").trim(),
    mood: String(form.get("mood") || "").trim(),
    weather: String(form.get("weather") || "").trim(),
    location: String(form.get("location") || "").trim(),
    attachments,
    createdAt: new Date().toISOString(),
    unlockAt: new Date(`${form.get("unlockAt")}T09:00:00`).toISOString(),
    context: readContextPayload(String(form.get("contextPayload") || "")),
  };
}

async function saveEcho(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const letter = String(form.get("letter") || "").trim();
  if (!letter) {
    toast("Write at least a few words before sealing this Echo.");
    document.querySelector("#letter").focus();
    return;
  }

  if (!isFutureDateInput(String(form.get("unlockAt") || ""))) {
    toast("Choose a future date for this Echo.");
    document.querySelector("#unlockAt").focus();
    return;
  }

  const echo = buildEchoFromForm(event.currentTarget);
  pendingSealEcho = echo;
  showSealReview(echo);
}

function showSealReview(echo) {
  document.querySelector("#sealDialog")?.remove();
  const wordCount = countWords(echo.letter);
  const attachmentCount = echo.attachments?.length || 0;
  const mix = attachmentMix(echo.attachments || []);
  const mediaText = describeAttachmentMix(echo.attachments || []);
  const mediaSize = formatBytes(mix.bytes);
  const futureSelf = echo.futureSelf || "A future version of you";
  const signals = capsuleSignals({
    letter: echo.letter,
    futureSelf: echo.futureSelf,
    location: echo.location,
    weather: echo.weather,
    unlockAt: dateInputValue(new Date(echo.unlockAt)),
    attachments: echo.attachments || [],
    context: echo.context,
  });
  app.querySelector(".app-view")?.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="sealDialog" class="seal-dialog" aria-labelledby="sealDialogTitle" aria-describedby="sealDialogBody">
        <div class="seal-object" aria-hidden="true">
          <span class="echo-orb">${icon("lock")}</span>
        </div>
        <p class="eyebrow">Before it leaves</p>
        <h2 id="sealDialogTitle">Seal this Echo for ${escapeHtml(futureSelf)}?</h2>
        <p id="sealDialogBody">It will return ${formatLongDate(new Date(echo.unlockAt))}. Until then, Echo will hide the title, letter, media, and emotional details everywhere except the Archive Key.</p>
        ${renderCapsuleSignals(signals)}
        <section class="seal-artifact-summary" aria-label="Echo artifact contents">
          <div>${icon("pen")}<span>${wordCount} word${wordCount === 1 ? "" : "s"}</span></div>
          <div>${icon("video")}<span>${escapeHtml(mediaText)}</span></div>
          <div>${icon(echo.context ? "globe" : "map")}<span>${echo.context ? "Moment captured" : "Manual moment"}</span></div>
        </section>
        <dl class="seal-summary-list">
          <div><dt>Title</dt><dd>${escapeHtml(echo.title)}</dd></div>
          <div><dt>Letter</dt><dd>${wordCount} word${wordCount === 1 ? "" : "s"}</dd></div>
          <div><dt>Media</dt><dd>${attachmentCount ? `${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"} · ${mediaSize}` : "No media attached"}</dd></div>
          <div><dt>Mix</dt><dd>${escapeHtml(mediaText)}</dd></div>
          <div><dt>Capsule</dt><dd>${escapeHtml(describeCapsuleSignals(signals))}</dd></div>
          <div><dt>Context</dt><dd>${echo.context ? "Place and time captured" : "Manual details only"}</dd></div>
        </dl>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-action="cancelSeal">Keep writing</button>
          <button class="primary-button" type="button" data-action="confirmSeal">${icon("lock")}Seal until then</button>
        </div>
      </dialog>
    `,
  );
  const dialog = document.querySelector("#sealDialog");
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSealReview();
  });
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
  dialog?.querySelector("[data-action='confirmSeal']")?.focus();
}

function closeSealReview() {
  pendingSealEcho = null;
  const dialog = document.querySelector("#sealDialog");
  if (dialog?.close) dialog.close();
  dialog?.remove();
  document.querySelector("#letter")?.focus();
}

async function commitPendingSeal(button) {
  if (!pendingSealEcho) return;
  button.disabled = true;
  const sealedEcho = {
    ...pendingSealEcho,
    sealedAt: new Date().toISOString(),
  };
  sealedEcho.sealDigest = await computeSealDigest(sealedEcho);
  await db.put(sealedEcho);
  pendingSealEcho = null;
  document.querySelector("#sealDialog")?.remove();
  localStorage.removeItem(draftKey);
  rememberSealedReceipt(sealedEcho.id);
  toast("Echo sealed.");
  location.hash = `sealed/${sealedEcho.id}`;
}

async function computeSealDigest(echo) {
  if (!globalThis.crypto?.subtle || typeof TextEncoder === "undefined") return "";
  const payload = canonicalizeValue({ ...echo, sealDigest: undefined });
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalizeValue(value) {
  if (Array.isArray(value)) return value.map(canonicalizeValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .reduce((next, key) => {
        next[key] = canonicalizeValue(value[key]);
        return next;
      }, {});
  }
  return value;
}

function formatSealFingerprint(digest) {
  if (!digest) return "Not recorded";
  return digest
    .slice(0, 16)
    .toUpperCase()
    .match(/.{1,4}/g)
    .join(" ");
}

function rememberSealedReceipt(id) {
  localStorage.setItem(
    sealedReceiptKey,
    JSON.stringify({
      id,
      sealedAt: new Date().toISOString(),
    }),
  );
}

function canShowSealedReceipt(id) {
  try {
    const receipt = JSON.parse(localStorage.getItem(sealedReceiptKey) || "null");
    if (receipt?.id !== id) return false;
    const sealedAt = new Date(receipt.sealedAt).getTime();
    if (!Number.isFinite(sealedAt)) return false;
    return Date.now() - sealedAt < 10 * 60 * 1000;
  } catch {
    localStorage.removeItem(sealedReceiptKey);
    return false;
  }
}

async function renderSealedReceipt(id, token = routeToken) {
  const echo = await db.get(id);
  if (!isCurrentRoute(token)) return;
  app.onclick = sealedReceiptActions;
  app.oninput = null;
  app.onchange = null;

  if (!echo) {
    renderNotFound("This receipt could not be found.");
    return;
  }

  if (!canShowSealedReceipt(id)) {
    setPageMeta("Sealed", "A sealed Echo whose private contents are hidden until the future.");
    app.innerHTML = `
      <section class="view app-view">
        <div class="view-inner motion-in">
          ${topbar({ back: true, title: "Sealed" })}
          ${lockedDetail()}
        </div>
        ${bottomNav("home")}
      </section>
    `;
    return;
  }

  const signals = capsuleSignals({
    letter: echo.letter,
    futureSelf: echo.futureSelf,
    location: echo.location,
    weather: echo.weather,
    unlockAt: dateInputValue(new Date(echo.unlockAt)),
    attachments: echo.attachments || [],
    context: echo.context,
  });
  const wordCount = countWords(echo.letter);
  const mediaText = describeAttachmentMix(echo.attachments || []);

  setPageMeta("Sealed", "A private Echo has been sealed for the future.");
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({ back: true, title: "Sealed" })}
        <section class="sealed-receipt" aria-labelledby="sealedReceiptTitle">
          <div class="sealed-receipt-object" aria-hidden="true">
            <span class="echo-orb">${icon("lock")}</span>
          </div>
          <p class="eyebrow">Receipt</p>
          <h1 id="sealedReceiptTitle">Your Echo is away.</h1>
          <p class="hero-copy">It will stay sealed until ${formatLongDate(new Date(echo.unlockAt))}. Echo has saved the shape of the moment without leaving the letter open behind you.</p>
          ${renderCapsuleSignals(signals)}
          <dl class="receipt-list" aria-label="Sealed Echo receipt">
            <div><dt>Letter</dt><dd>${wordCount} word${wordCount === 1 ? "" : "s"} sealed</dd></div>
            <div><dt>Media</dt><dd>${escapeHtml(mediaText)}</dd></div>
            <div><dt>Moment</dt><dd>${echo.context ? "Place and time captured" : "Manual details only"}</dd></div>
            <div><dt>Capsule</dt><dd>${escapeHtml(describeCapsuleSignals(signals))}</dd></div>
            <div><dt>Seal</dt><dd><code>${escapeHtml(formatSealFingerprint(echo.sealDigest))}</code></dd></div>
            <div><dt>Return</dt><dd>${formatShortDate(echo.unlockAt)}</dd></div>
          </dl>
          <div class="receipt-actions">
            <button class="secondary-button" type="button" data-action="writeAnother">${icon("pen")}Write another</button>
            <button class="secondary-button" type="button" data-action="calendar" data-id="${echo.id}">${icon("calendar")}Add return date</button>
            <button class="primary-button" type="button" data-action="home">${icon("home")}Go home</button>
          </div>
        </section>
      </div>
      ${bottomNav("home")}
    </section>
  `;
}

function sealedReceiptActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back" || target.dataset.action === "home") location.hash = "home";
  if (target.dataset.action === "writeAnother") location.hash = "create";
  if (target.dataset.action === "calendar") exportReturnCalendar(target.dataset.id ? [target.dataset.id] : null);
}

async function renderDetail(id, token = routeToken) {
  const echo = await db.get(id);
  if (!isCurrentRoute(token)) return;
  if (!echo) {
    renderNotFound("This Echo could not be found.");
    return;
  }

  app.onclick = detailActions;
  app.oninput = null;
  app.onchange = null;
  const locked = new Date(echo.unlockAt).getTime() > Date.now();
  const allowEarlyOpening = archiveKeyEnabled();
  const shouldStageReturn = !locked && !hasOpenedReturnedEcho(echo.id);
  const newlyOpened = !locked && !shouldStageReturn && consumeNewlyOpenedEcho(echo.id);
  const title = locked && !allowEarlyOpening ? "Sealed Echo" : echo.title || "Untitled Echo";
  setPageMeta(title, locked && !allowEarlyOpening ? "A sealed Echo whose private contents are hidden until the future." : "A returned Echo in the private archive.");
  app.innerHTML = `
    <section class="view app-view">
      <div class="view-inner motion-in">
        ${topbar({
          back: true,
          title: locked && !allowEarlyOpening ? "Sealed" : "Archive",
          action: `<button class="danger-button" data-action="delete" data-id="${echo.id}">${icon("trash")}Delete</button>`,
        })}
        ${
          locked && !allowEarlyOpening
            ? lockedDetail()
            : shouldStageReturn
              ? returnedDetail(echo)
              : `
              <div class="detail-layout">
                <article class="detail-panel archive-object${newlyOpened ? " is-newly-opened" : ""}">
                  <div class="catalog-strip">
                    <span>${locked ? "Opened early" : "Returned artifact"}</span>
                    <span>${formatShortDate(echo.unlockAt)}</span>
                  </div>
                  <p class="eyebrow">${locked ? "Opened early" : `Opened ${formatLongDate(new Date(echo.unlockAt))}`}</p>
                  <h1 class="detail-title">${escapeHtml(echo.title)}</h1>
                  ${renderArtifactPlaque(echo)}
                  ${renderTimeBridge(echo)}
                  ${renderArchiveExhibit(echo)}
                  <div class="letter-paper">
                    <p class="eyebrow">Written record</p>
                    <div class="detail-prose">${escapeHtml(echo.letter)}</div>
                  </div>
                  ${renderArchiveContext(echo.context)}
                </article>
                <aside class="detail-panel">
                  ${metadata(echo)}
                </aside>
              </div>
            `
        }
      </div>
      ${bottomNav("archive")}
    </section>
  `;
}

function returnedDetail(echo) {
  const futureSelf = echo.futureSelf || "A future version of you";
  const attachmentCount = echo.attachments?.length || 0;
  const createdAt = new Date(echo.createdAt);
  const unlockAt = new Date(echo.unlockAt);
  return `
    <section class="detail-panel return-preview">
      <div class="catalog-strip">
        <span>Returned artifact</span>
        <span>${formatShortDate(echo.unlockAt)}</span>
      </div>
      ${renderReturnThresholdObject(echo)}
      <p class="eyebrow">Archive arrival</p>
      <h1 class="detail-title">This Echo has returned.</h1>
      <p class="hero-copy">It was sealed for ${escapeHtml(futureSelf)} and arrived ${formatLongDate(new Date(echo.unlockAt))}. Open it when you are ready to let the room come back.</p>
      <section class="return-threshold" aria-label="Before opening">
        <div>
          <span>Then</span>
          <strong>${formatShortDate(createdAt)}</strong>
          <small>Written and sealed</small>
        </div>
        <div>
          <span>Waiting</span>
          <strong>${escapeHtml(describeDurationBetween(createdAt, unlockAt))}</strong>
          <small>Kept out of view</small>
        </div>
        <div>
          <span>Now</span>
          <strong>${formatShortDate(unlockAt)}</strong>
          <small>Ready to open</small>
        </div>
      </section>
      <dl class="seal-summary-list return-summary">
        <div><dt>Title</dt><dd>${escapeHtml(echo.title)}</dd></div>
        <div><dt>Created</dt><dd>${formatLongDate(new Date(echo.createdAt))}</dd></div>
        <div><dt>Media</dt><dd>${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}</dd></div>
        <div><dt>Context</dt><dd>${echo.context ? "Place and time preserved" : "Manual details only"}</dd></div>
        <div><dt>Seal</dt><dd><code>${escapeHtml(formatSealFingerprint(echo.sealDigest))}</code></dd></div>
        <div><dt>Next</dt><dd>One final tap reveals the archive record</dd></div>
      </dl>
      <button class="primary-button return-button" data-action="openReturned" data-id="${echo.id}">
        ${icon("unlock")}Open returned Echo
      </button>
    </section>
  `;
}

function renderReturnThresholdObject(echo) {
  const mediaLabel = echo.attachments?.length ? describeAttachmentMix(echo.attachments || []) : "Letter only";
  return `
    <div class="return-object" aria-hidden="true">
      <div class="return-object-core">
        <span class="echo-orb">${icon("archive")}</span>
        <span class="return-date">${formatShortDate(echo.unlockAt)}</span>
      </div>
      <div class="return-object-caption">
        <span>${escapeHtml(mediaLabel)}</span>
        <span>Private until opened</span>
      </div>
    </div>
  `;
}

function lockedDetail() {
  return `
    <section class="detail-panel locked-state">
      <div>
        <span class="echo-orb">${icon("lock")}</span>
        <p class="eyebrow">Sealed Echo</p>
        <h1 class="detail-title">This one is still away.</h1>
        <p class="hero-copy">Echo hides sealed letters by default. The future should be the first place they fully return.</p>
      </div>
    </section>
  `;
}

function metadata(echo) {
  const rows = [
    ["Created", formatLongDate(new Date(echo.createdAt))],
    ["Writing to", echo.futureSelf],
    ["Mood right now", echo.mood],
    ["Trying to become", echo.goals],
    ["Future hope", echo.futureHope],
    ["Weather", echo.weather],
    ["Location", echo.location],
    ["Context", echo.context ? "Place and time preserved" : ""],
    ["Attachments", `${echo.attachments?.length || 0}`],
    ["Seal", echo.sealDigest ? formatSealFingerprint(echo.sealDigest) : ""],
  ].filter(([, value]) => value);

  return `
    <dl class="metadata-list">
      ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${label === "Seal" ? `<code>${escapeHtml(value)}</code>` : escapeHtml(value)}</dd></div>`).join("")}
    </dl>
  `;
}

function renderArchiveContext(context) {
  if (!context) return "";
  const rows = [
    ["Place", context.place?.label],
    ["Weather", context.weather?.summary],
    ["Captured", context.date ? formatLongDate(new Date(`${context.date}T12:00:00`)) : ""],
    ["Coordinates", context.coordinates ? `${context.coordinates.latitude}, ${context.coordinates.longitude}` : ""],
  ].filter(([, value]) => value);
  if (!rows.length) return "";

  return `
    <section class="archive-context" aria-labelledby="archive-context-title">
      <p class="eyebrow" id="archive-context-title">Place and time</p>
      <dl class="context-list">
        ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function renderArtifactPlaque(echo) {
  const accession = `ECHO-${String(echo.id || "").slice(0, 8).toUpperCase() || "LOCAL"}`;
  const createdAt = new Date(echo.createdAt);
  const unlockAt = new Date(echo.unlockAt);
  const place = echo.context?.place?.label || echo.location || "Unplaced moment";
  const weather = echo.context?.weather?.summary || echo.weather || "No weather saved";
  const rows = [
    ["Accession", accession],
    ["Seal", echo.sealDigest ? formatSealFingerprint(echo.sealDigest) : "Legacy artifact"],
    ["Preserved for", describeDurationBetween(createdAt, unlockAt)],
    ["Written", formatLongDate(createdAt)],
    ["Returned", formatLongDate(unlockAt)],
    ["For", echo.futureSelf || "A future version of you"],
    ["Future hope", echo.futureHope],
    ["Place", place],
    ["Weather", weather],
  ].filter(([, value]) => value);

  return `
    <section class="artifact-plaque" aria-label="Archive plaque">
      <div class="plaque-header">
        <div>
          <p class="eyebrow">Archive plaque</p>
          <h2>Preserved from one version of you to another.</h2>
        </div>
        <span class="plaque-stamp">${escapeHtml(accession)}</span>
      </div>
      <dl class="plaque-list">
        ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${label === "Seal" && echo.sealDigest ? `<code>${escapeHtml(value)}</code>` : escapeHtml(value)}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function renderTimeBridge(echo) {
  const createdAt = new Date(echo.createdAt);
  const unlockAt = new Date(echo.unlockAt);
  const preservedRecord = echo.attachments?.length ? "Media and notes" : "The written record";
  const place = echo.context?.place?.label || echo.location || "the place this was written";
  return `
    <section class="time-bridge" aria-label="Time capsule bridge">
      <article>
        <span>Then</span>
        <h2>${formatShortDate(createdAt)}</h2>
        <p>${escapeHtml(preservedRecord)} preserved from ${escapeHtml(place)}.</p>
      </article>
      <article>
        <span>Now</span>
        <h2>${formatShortDate(unlockAt)}</h2>
        <p>Returned for ${escapeHtml(echo.futureSelf || "a future version of you")} after ${escapeHtml(describeDurationBetween(createdAt, unlockAt).toLowerCase())}.</p>
      </article>
    </section>
  `;
}

function renderArchiveExhibit(echo) {
  const attachments = echo.attachments || [];
  const exhibitFiles = sortExhibitMedia(attachments);
  const mix = attachmentMix(attachments);
  const facts = [
    ["Created", formatLongDate(new Date(echo.createdAt))],
    ["For", echo.futureSelf],
    ["Mood right now", echo.mood],
    ["Trying to become", echo.goals],
    ["Future hope", echo.futureHope],
    ["Media", describeAttachmentMix(attachments)],
    ["Size", attachments.length ? formatBytes(mix.bytes) : ""],
    ["Place", echo.context?.place?.label || echo.location],
    ["Weather", echo.context?.weather?.summary || echo.weather],
  ].filter(([, value]) => value);

  return `
    <section class="archive-exhibit" aria-label="Returned Echo exhibit">
      ${renderExhibitMedia(exhibitFiles)}
      <dl class="exhibit-facts">
        ${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function exhibitMediaRank(file) {
  const type = file.type || "";
  if (type.startsWith("video/")) return 0;
  if (type.startsWith("image/")) return 1;
  if (type.startsWith("audio/")) return 2;
  return 3;
}

function sortExhibitMedia(files = []) {
  return files
    .map((file, index) => ({ file, index }))
    .sort((a, b) => {
      const rankDelta = exhibitMediaRank(a.file) - exhibitMediaRank(b.file);
      return rankDelta || a.index - b.index;
    })
    .map(({ file }) => file);
}

function renderExhibitMedia(files) {
  if (!files.length) return "";
  return `
    <section class="exhibit-media evidence-tray" aria-label="Captured media">
      <div class="evidence-heading">
        <p class="eyebrow">Captured media</p>
        <span>${files.length} artifact${files.length === 1 ? "" : "s"}</span>
      </div>
      <div class="evidence-grid">
        ${files.map((file) => mediaTile(file, "evidence-media")).join("")}
      </div>
    </section>
  `;
}

function mediaTile(file, className = "") {
  const name = escapeHtml(file.name);
  if (file.demoStatic && file.posterDataUrl) {
    return `<figure class="media-tile static-video-tile ${className}"><img src="${file.posterDataUrl}" alt="${name}" /><figcaption><span>${icon("video")}Video artifact</span>${name}</figcaption></figure>`;
  }
  if (file.type.startsWith("image/")) {
    return `<figure class="media-tile ${className}"><img src="${file.dataUrl}" alt="${name}" /><figcaption>${name}</figcaption></figure>`;
  }
  if (file.type.startsWith("video/")) {
    const poster = file.posterDataUrl ? ` poster="${escapeHtml(file.posterDataUrl)}"` : "";
    return `<figure class="media-tile ${className}"><video src="${file.dataUrl}" controls playsinline${poster}></video><figcaption>${name}</figcaption></figure>`;
  }
  if (file.type.startsWith("audio/")) {
    return `<figure class="media-tile audio-tile ${className}">${icon("mic")}<figcaption>${name}</figcaption><audio src="${file.dataUrl}" controls></audio></figure>`;
  }
  return `<figure class="media-tile file-tile ${className}">${icon("paperclip")}<figcaption>${name}</figcaption></figure>`;
}

function renderMedia(files) {
  if (!files.length) return "";
  return `
    <div class="media-grid">
      ${files.map((file) => mediaTile(file)).join("")}
    </div>
  `;
}

async function detailActions(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action === "back") location.hash = "home";
  if (target.dataset.action === "home") location.hash = "home";
  if (target.dataset.action === "delete") {
    const echo = await db.get(target.dataset.id);
    if (!echo) {
      toast("This Echo could not be found.");
      return;
    }
    showDeleteReview(echo);
  }
  if (target.dataset.action === "cancelDelete") {
    closeDeleteReview();
  }
  if (target.dataset.action === "confirmDelete") {
    await commitPendingDelete(target);
  }
  if (target.dataset.action === "openReturned") {
    markReturnedEchoOpened(target.dataset.id);
    markNewlyOpenedEcho(target.dataset.id);
    route();
  }
}

function showDeleteReview(echo) {
  document.querySelector("#deleteDialog")?.remove();
  const locked = new Date(echo.unlockAt).getTime() > Date.now();
  const allowEarlyOpening = archiveKeyEnabled();
  const canShowTitle = !locked || allowEarlyOpening;
  const title = canShowTitle ? echo.title || "Untitled Echo" : "Sealed Echo";
  pendingDeleteEchoId = echo.id;

  app.querySelector(".app-view")?.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="deleteDialog" class="seal-dialog delete-dialog" aria-labelledby="deleteDialogTitle" aria-describedby="deleteDialogBody">
        <div class="seal-object" aria-hidden="true">
          <span class="echo-orb">${icon("trash")}</span>
        </div>
        <p class="eyebrow">Permanent removal</p>
        <h2 id="deleteDialogTitle">Delete this ${canShowTitle ? "Echo" : "sealed Echo"}?</h2>
        <p id="deleteDialogBody">This removes the local copy from this device. Export a backup first if this Echo still matters.</p>
        <dl class="seal-summary-list">
          <div><dt>Item</dt><dd>${escapeHtml(title)}</dd></div>
          <div><dt>Returns</dt><dd>${formatLongDate(new Date(echo.unlockAt))}</dd></div>
        </dl>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-action="cancelDelete">Keep Echo</button>
          <button class="danger-button" type="button" data-action="confirmDelete">${icon("trash")}Delete forever</button>
        </div>
      </dialog>
    `,
  );
  const dialog = document.querySelector("#deleteDialog");
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeleteReview();
  });
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
  dialog?.querySelector("[data-action='cancelDelete']")?.focus();
}

function closeDeleteReview() {
  pendingDeleteEchoId = null;
  const dialog = document.querySelector("#deleteDialog");
  if (dialog?.close) dialog.close();
  dialog?.remove();
  document.querySelector("[data-action='delete']")?.focus();
}

async function commitPendingDelete(button) {
  if (!pendingDeleteEchoId) return;
  const deletedEchoId = pendingDeleteEchoId;
  button.disabled = true;
  await db.delete(deletedEchoId);
  forgetReturnedEchoOpened(deletedEchoId);
  pendingDeleteEchoId = null;
  document.querySelector("#deleteDialog")?.remove();
  toast("Echo deleted.");
  location.hash = "home";
}

async function captureMomentContext(button) {
  setContextCaptureState(button, true, "Locating");
  let position;
  try {
    position = await getCurrentPosition();
  } catch {
    setContextCaptureState(button, false, "Capture place and time");
    toast("Location permission was not granted.");
    return;
  }

  const { latitude, longitude } = position.coords;
  const date = dateInputValue(new Date());
  const params = new URLSearchParams({
    lat: latitude.toFixed(5),
    lon: longitude.toFixed(5),
    date,
  });

  try {
    setContextCaptureState(button, true, "Reading the moment");
    const apiBase = (localStorage.getItem(contextApiBaseKey) || defaultContextApiBase).replace(/\/$/, "");
    const response = await fetch(`${apiBase}/api/context/moment?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Context API failed");
    const context = normalizeMomentContext(await response.json(), { latitude, longitude, date });
    applyMomentContext(context);
    setContextCaptureState(button, false, "Moment captured");
    toast("Moment context captured.");
  } catch {
    const context = localMomentContext({ latitude, longitude, date });
    applyMomentContext(context);
    setContextCaptureState(button, false, "Saved locally");
    toast("Saved local moment context. Start the API for weather and place.");
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 60000,
    });
  });
}

function setContextCaptureState(button, active, message) {
  button.disabled = active;
  button.classList.toggle("is-capturing", active);
  const state = button.querySelector("small");
  if (state) state.textContent = message;
}

function applyMomentContext(context) {
  const payload = JSON.stringify(context);
  const field = document.querySelector("#contextPayload");
  if (field) field.value = payload;
  if (context.weather?.summary) {
    document.querySelector("#weather").value = context.weather.summary;
  }
  if (context.place?.label) {
    document.querySelector("#location").value = context.place.label;
  }
  renderMomentContext(context);
  updateArtifactSummary();
  saveCreateDraft();
}

function localMomentContext({ latitude, longitude, date }) {
  return {
    capturedAt: new Date().toISOString(),
    source: "local-fallback",
    date,
    coordinates: {
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
    },
    place: {
      label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    },
    weather: null,
    daylight: null,
  };
}

function normalizeMomentContext(payload, fallback) {
  const local = localMomentContext(fallback);
  return {
    capturedAt: normalizeDate(payload?.capturedAt) || local.capturedAt,
    source: cleanString(payload?.source) || "echo-context-api",
    date: cleanString(payload?.date) || local.date,
    coordinates: {
      latitude: Number.isFinite(payload?.coordinates?.latitude)
        ? payload.coordinates.latitude
        : local.coordinates.latitude,
      longitude: Number.isFinite(payload?.coordinates?.longitude)
        ? payload.coordinates.longitude
        : local.coordinates.longitude,
    },
    place: {
      label: cleanString(payload?.place?.label) || local.place.label,
      city: cleanString(payload?.place?.city),
      region: cleanString(payload?.place?.region),
      country: cleanString(payload?.place?.country),
    },
    weather: payload?.weather
      ? {
          summary: cleanString(payload.weather.summary),
          temperature: Number.isFinite(payload.weather.temperature) ? payload.weather.temperature : null,
          unit: cleanString(payload.weather.unit) || "C",
        }
      : null,
    daylight: payload?.daylight
      ? {
          sunrise: cleanString(payload.daylight.sunrise),
          sunset: cleanString(payload.daylight.sunset),
        }
      : null,
  };
}

function readContextPayload(value) {
  if (!value) return null;
  try {
    return normalizeMomentContext(JSON.parse(value), { latitude: 0, longitude: 0, date: dateInputValue(new Date()) });
  } catch {
    return null;
  }
}

function renderMomentContext(context) {
  const panel = document.querySelector("#momentContextPanel");
  if (!panel) return;
  if (!context) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const weather = context.weather?.summary || "Weather unavailable";
  const place = context.place?.label || "Place captured";
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <p class="eyebrow">Moment context</p>
    <dl class="context-list">
      <div><dt>Place</dt><dd>${escapeHtml(place)}</dd></div>
      <div><dt>Weather</dt><dd>${escapeHtml(weather)}</dd></div>
      <div><dt>Date</dt><dd>${escapeHtml(formatLongDate(new Date(`${context.date}T12:00:00`)))}</dd></div>
    </dl>
    <small>Only date and coordinates were sent to the context API.</small>
  `;
}

function useLocation() {
  const field = document.querySelector("#location");
  if (!navigator.geolocation) {
    toast("Location is not available in this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      field.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      saveCreateDraft();
      updateArtifactSummary();
    },
    () => toast("Location permission was not granted."),
    { enableHighAccuracy: false, timeout: 7000 },
  );
}

function speechRecognitionAvailable() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function toggleDictation(button) {
  const letter = document.querySelector("#letter");
  if (!speechRecognitionAvailable()) {
    toast("Dictation is not available in this browser.");
    return;
  }

  if (isDictating && recognition) {
    recognition.stop();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";

  let committed = "";
  const activeRecognition = recognition;
  const startTimer = window.setTimeout(() => {
    if (recognition !== activeRecognition) return;
    try {
      activeRecognition.abort?.();
      activeRecognition.stop?.();
    } catch {
      // The browser may throw if the speech service never fully started.
    }
    isDictating = false;
    setDictationButtonState(button, false);
    toast("Dictation could not start in this browser.");
  }, 2500);

  isDictating = true;
  setDictationButtonState(button, true);
  toast("Dictation starting.");

  recognition.onstart = () => {
    window.clearTimeout(startTimer);
    isDictating = true;
    setDictationButtonState(button, true);
    toast("Dictation started.");
  };
  recognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript;
      if (event.results[index].isFinal) committed += transcript;
      else interim += transcript;
    }
    if (committed.trim()) {
      appendToLetter(letter, committed.trim());
      committed = "";
      saveCreateDraft();
    }
    letter.dataset.interimTranscript = interim.trim();
  };
  recognition.onerror = (event) => {
    window.clearTimeout(startTimer);
    const message =
      event.error === "not-allowed"
        ? "Microphone permission was not granted."
        : "Dictation stopped. Browser speech recognition was not available.";
    toast(message);
  };
  recognition.onend = () => {
    window.clearTimeout(startTimer);
    isDictating = false;
    setDictationButtonState(button, false);
    delete letter.dataset.interimTranscript;
  };
  try {
    recognition.start();
  } catch {
    window.clearTimeout(startTimer);
    isDictating = false;
    setDictationButtonState(button, false);
    toast("Dictation could not start in this browser.");
  }
}

function setDictationButtonState(button, active) {
  button.classList.toggle("is-listening", active);
  const iconSlot = button.querySelector(".artifact-icon");
  const title = button.querySelector("strong");
  const detail = button.querySelector("small");

  if (iconSlot && title && detail) {
    iconSlot.innerHTML = icon(active ? "stop" : "pen");
    title.textContent = active ? "Listening" : "Dictate";
    detail.textContent = active ? "Tap to stop" : "Speak into the letter field";
    return;
  }

  button.innerHTML = active ? `${icon("stop")}Stop dictation` : `${icon("mic")}Dictate`;
}

function appendToLetter(letter, text) {
  const separator = letter.value.trim() ? " " : "";
  letter.value = `${letter.value}${separator}${text}`;
  letter.focus();
  letter.selectionStart = letter.value.length;
  letter.selectionEnd = letter.value.length;
}

async function prepareDemoWalkthrough() {
  await seedDemoEchoes({ silentExisting: true });
  const echoes = await db.all();
  const returnedDemoEcho = echoes
    .filter((echo) => echo.demo === true && new Date(echo.unlockAt).getTime() <= Date.now())
    .sort((a, b) => new Date(b.unlockAt) - new Date(a.unlockAt))[0];
  if (!returnedDemoEcho) {
    toast("Demo Echoes could not be prepared.");
    return null;
  }
  forgetReturnedEchoOpened(returnedDemoEcho.id);
  toast("Walkthrough ready.");
  return returnedDemoEcho;
}

function demoImageDataUrl(title, subtitle) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600">
      <rect width="960" height="600" fill="#f5efe4"/>
      <rect x="82" y="78" width="796" height="444" rx="26" fill="#fffaf2" stroke="#d8c5a7"/>
      <rect x="144" y="340" width="672" height="68" rx="8" fill="#3b332b" opacity=".88"/>
      <rect x="300" y="178" width="360" height="210" rx="18" fill="#2f2a25"/>
      <rect x="326" y="204" width="308" height="148" rx="10" fill="#d7b56d"/>
      <circle cx="212" cy="238" r="46" fill="#7b8a72" opacity=".62"/>
      <circle cx="746" cy="246" r="52" fill="#b87955" opacity=".5"/>
      <path d="M170 454h620" stroke="#c9ad7a" stroke-width="3" opacity=".7"/>
      <text x="480" y="466" text-anchor="middle" font-family="Georgia, serif" font-size="38" fill="#2c251f">${escapeHtml(title)}</text>
      <text x="480" y="506" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#76675a">${escapeHtml(subtitle)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function demoSilentWavDataUrl() {
  return "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
}

async function seedDemoEchoes({ silentExisting = false, includeFuture = false } = {}) {
  const existing = await db.all();
  const existingDemo = existing.filter((echo) => echo.demo === true);
  const hasReturnedDemo = existingDemo.some((echo) => echo.demoRole === "returned");
  const hasFullDemoSet = existingDemo.some((echo) => echo.demoRole === "future");
  if (!includeFuture && hasReturnedDemo) {
    if (!silentExisting) toast("Demo Echo is already loaded.");
    return;
  }
  if (includeFuture && hasReturnedDemo && hasFullDemoSet) {
    if (!silentExisting) toast("Full demo set is already loaded.");
    return;
  }

  const now = new Date();
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const samples = [
    {
      title: "Demo: Before the first prototype",
      demoRole: "returned",
      letter:
        "I am building this because I wish I could sit across from someone while they were still becoming. Not the famous version, not the polished story, but the person in the room before anyone knew whether it would work. If this Echo comes back later, remember the nervous energy, the small desk, the warm screen light, and the feeling that a real human life can be preserved without turning it into content.",
      futureSelf: "Me after the first public demo",
      futureHope: "I hope the future version can tell whether the work still feels honest.",
      mood: "Hopeful",
      goals: "Make something sincere enough that a stranger understands why a preserved moment can matter.",
      weather: "Warm evening",
      location: "A small build room",
      context: {
        capturedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 20).toISOString(),
        source: "demo",
        date: dateInputValue(lastMonth),
        coordinates: { latitude: 37.33182, longitude: -122.03118 },
        place: { label: "A small build room near Cupertino" },
        weather: { summary: "Warm evening, quiet air", temperature: 21, unit: "C" },
        daylight: null,
      },
      createdAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 20).toISOString(),
      unlockAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9).toISOString(),
      attachments: [
        {
          id: "demo-build-room-voice",
          name: "Voice note from the build room.wav",
          type: "audio/wav",
          kind: "audio",
          size: 44,
          dataUrl: demoSilentWavDataUrl(),
        },
        {
          id: "demo-build-room-video",
          name: "Thirty seconds before the demo.mp4",
          type: "video/mp4",
          kind: "video",
          size: 4,
          dataUrl: "",
          demoStatic: true,
          posterDataUrl: demoImageDataUrl("Thirty seconds before the demo", "The room before anyone knew."),
        },
        {
          id: "demo-build-room-photo",
          name: "Desk light before launch.svg",
          type: "image/svg+xml",
          kind: "image",
          size: 1200,
          dataUrl: demoImageDataUrl("Desk light before launch", "A human, a place, and a time."),
        },
      ],
    },
    {
      title: "After judging day",
      demoRole: "future",
      letter:
        "If you are reading this, the rush is over. I hope you can tell whether the work still feels honest after the pressure lifted.",
      futureSelf: "Me after CAC",
      futureHope: "I hope the pressure has turned into proof that the core idea mattered.",
      mood: "Uncertain",
      goals: "Present clearly. Protect the core idea.",
      weather: "Unknown",
      location: "",
      context: null,
      createdAt: now.toISOString(),
      unlockAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9).toISOString(),
      attachments: [],
    },
    {
      title: "One year from here",
      demoRole: "future",
      letter:
        "I hope you still recognize the person writing this. I hope enough changed to matter and enough stayed true to count.",
      futureSelf: "One year from now",
      futureHope: "I hope this opens into a life that still makes room for careful work.",
      mood: "Grateful",
      goals: "Keep building carefully.",
      weather: "",
      location: "",
      context: null,
      createdAt: now.toISOString(),
      unlockAt: new Date(nextYear.getFullYear(), nextYear.getMonth(), nextYear.getDate(), 9).toISOString(),
      attachments: [],
    },
  ];

  const samplesToCreate = samples.filter((sample) => {
    if (sample.demoRole === "returned") return !hasReturnedDemo;
    return includeFuture && !hasFullDemoSet;
  });

  await Promise.all(
    samplesToCreate.map((sample) =>
      db.put({
        ...sample,
        id: crypto.randomUUID(),
        attachments: sample.attachments || [],
        demo: true,
      }),
    ),
  );
  toast(includeFuture ? "Full demo set loaded." : "Demo Echo loaded.");
  if (location.hash.replace("#", "").split("/")[0] === "settings") {
    renderSettings();
  }
}

async function clearDemoEchoes() {
  const echoes = await db.all();
  const demoEchoes = echoes.filter((echo) => echo.demo === true);
  if (!demoEchoes.length) {
    toast("No demo Echoes to clear.");
    return;
  }

  await Promise.all(demoEchoes.map((echo) => db.delete(echo.id)));
  demoEchoes.forEach((echo) => forgetReturnedEchoOpened(echo.id));
  toast("Demo Echoes cleared.");
  if (location.hash.replace("#", "").split("/")[0] === "settings") {
    renderSettings();
  }
}

async function prepareEchoExport() {
  const echoes = await db.all();
  const sealedCount = echoes.filter((echo) => new Date(echo.unlockAt).getTime() > Date.now()).length;
  if (sealedCount) {
    showExportReview(echoes, sealedCount);
    return;
  }

  downloadEchoBackup(echoes);
}

async function exportReturnCalendar(ids = null) {
  const echoes = await db.all();
  const selectedIds = Array.isArray(ids) ? new Set(ids) : null;
  const upcoming = echoes
    .filter((echo) => (!selectedIds || selectedIds.has(echo.id)) && new Date(echo.unlockAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt));

  if (!upcoming.length) {
    settingsStatusMessage = "No future returns to export.";
    toast(settingsStatusMessage);
    if (location.hash.replace("#", "").split("/")[0] === "settings") renderSettings();
    return;
  }

  const calendar = buildReturnCalendar(upcoming);
  downloadTextFile(calendar, "text/calendar;charset=utf-8", `echo-returns-${new Date().toISOString().slice(0, 10)}.ics`);
  settingsStatusMessage = upcoming.length === 1 ? "Return date exported." : "Return calendar exported.";
  toast(settingsStatusMessage);
  if (location.hash.replace("#", "").split("/")[0] === "settings") renderSettings();
}

function showExportReview(echoes, sealedCount) {
  document.querySelector("#exportDialog")?.remove();
  pendingExportEchoes = echoes;

  app.querySelector(".app-view")?.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="exportDialog" class="seal-dialog export-dialog" aria-labelledby="exportDialogTitle" aria-describedby="exportDialogBody">
        <div class="seal-object" aria-hidden="true">
          <span class="echo-orb">${icon("save")}</span>
        </div>
        <p class="eyebrow">Private backup</p>
        <h2 id="exportDialogTitle">Export backup with sealed Echoes?</h2>
        <p id="exportDialogBody">The file will include sealed letters, media, and emotional details so your archive can be restored later. Keep it somewhere private.</p>
        <dl class="seal-summary-list">
          <div><dt>Saved</dt><dd>${echoes.length} Echo${echoes.length === 1 ? "" : "es"}</dd></div>
          <div><dt>Sealed</dt><dd>${sealedCount} hidden Echo${sealedCount === 1 ? "" : "es"}</dd></div>
          <div><dt>Size</dt><dd>${formatBytes(estimateExportSize(echoes))} estimated</dd></div>
        </dl>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-action="cancelExport">Cancel</button>
          <button class="primary-button" type="button" data-action="confirmExport">${icon("save")}Export local backup</button>
        </div>
      </dialog>
    `,
  );
  const dialog = document.querySelector("#exportDialog");
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeExportReview();
  });
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
  dialog?.querySelector("[data-action='confirmExport']")?.focus();
}

function closeExportReview() {
  pendingExportEchoes = null;
  const dialog = document.querySelector("#exportDialog");
  if (dialog?.close) dialog.close();
  dialog?.remove();
  document.querySelector("[data-action='exportData']")?.focus();
}

async function commitPendingExport(button) {
  button.disabled = true;
  const echoes = pendingExportEchoes || (await db.all());
  pendingExportEchoes = null;
  document.querySelector("#exportDialog")?.remove();
  downloadEchoBackup(echoes);
}

function downloadEchoBackup(echoes) {
  const payload = {
    product: "Echo",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    echoes,
  };
  downloadTextFile(JSON.stringify(payload, null, 2), "application/json", `echo-backup-${new Date().toISOString().slice(0, 10)}.json`);
  const message = echoes.length ? "Backup exported." : "Empty backup exported.";
  settingsStatusMessage = message;
  toast(message);
}

function downloadTextFile(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildReturnCalendar(echoes) {
  const stamp = formatIcsDateTime(new Date());
  const events = echoes.map((echo, index) => {
    const start = new Date(echo.unlockAt);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const uidPart = String(echo.id || `${index}-${start.getTime()}`).replace(/[^a-zA-Z0-9-]/g, "");
    return [
      "BEGIN:VEVENT",
      `UID:echo-return-${uidPart}@echo.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatIcsDateTime(start)}`,
      `DTEND:${formatIcsDateTime(end)}`,
      "SUMMARY:Echo returns",
      `DESCRIPTION:${escapeIcsText("A private Echo is ready to open. No title, letter, media, place, mood, or goals are included in this calendar file.")}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Echo//Private Return Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Echo Returns",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function formatIcsDateTime(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
    "Z",
  ].join("");
}

function escapeIcsText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

async function importEchoData(file) {
  if (!file) return;
  if (file.size > maxAttachmentTotalBytes) {
    settingsStatusMessage = "Backup is too large to import here.";
    toast(settingsStatusMessage);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    settingsStatusMessage = "That backup could not be read.";
    toast(settingsStatusMessage);
    return;
  }

  if (payload?.product !== "Echo" || payload.schemaVersion !== 1 || !Array.isArray(payload.echoes)) {
    settingsStatusMessage = "That backup does not look like an Echo export.";
    toast(settingsStatusMessage);
    return;
  }

  const existing = await db.all();
  const existingIds = new Set(existing.map((echo) => echo.id));
  const imported = [];
  for (const echo of payload.echoes) {
    const normalized = normalizeImportedEcho(echo);
    if (!normalized || existingIds.has(normalized.id)) continue;
    existingIds.add(normalized.id);
    imported.push(normalized);
  }

  if (!imported.length) {
    settingsStatusMessage = "No new Echoes were imported.";
    toast(settingsStatusMessage);
    if (location.hash.replace("#", "").split("/")[0] === "settings") {
      renderSettings();
    }
    return;
  }

  await Promise.all(imported.map((echo) => db.put(echo)));
  settingsStatusMessage = `Imported ${imported.length} Echo${imported.length === 1 ? "" : "es"}.`;
  toast(settingsStatusMessage);
  if (location.hash.replace("#", "").split("/")[0] === "settings") {
    renderSettings();
  }
}

function normalizeImportedEcho(echo) {
  if (!echo || typeof echo !== "object") return null;
  const title = cleanString(echo.title);
  const letter = cleanString(echo.letter);
  const createdAt = normalizeDate(echo.createdAt);
  const unlockAt = normalizeDate(echo.unlockAt);
  if (!title || !letter || !createdAt || !unlockAt) return null;

  return {
    id: cleanId(echo.id) || crypto.randomUUID(),
    title,
    letter,
    futureSelf: cleanString(echo.futureSelf),
    futureHope: cleanString(echo.futureHope),
    mood: cleanString(echo.mood),
    goals: cleanString(echo.goals),
    weather: cleanString(echo.weather),
    location: cleanString(echo.location),
    createdAt,
    unlockAt,
    attachments: normalizeImportedAttachments(echo.attachments),
    context: normalizeImportedContext(echo.context),
    demo: echo.demo === true,
    demoRole: cleanString(echo.demoRole),
  };
}

function normalizeImportedContext(context) {
  if (!context || typeof context !== "object") return null;
  const date = cleanString(context.date);
  const latitude = Number(context.coordinates?.latitude);
  const longitude = Number(context.coordinates?.longitude);
  const fallback = {
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateInputValue(new Date()),
  };
  return normalizeMomentContext(context, fallback);
}

function cleanId(value) {
  return typeof value === "string" && /^[A-Za-z0-9:_-]{1,120}$/.test(value) ? value : "";
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function normalizeImportedAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  let totalBytes = 0;
  const safeAttachments = [];
  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== "object") continue;
    const dataUrl = typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
    const type = cleanString(attachment.type) || "application/octet-stream";
    const size = Number.isFinite(attachment.size) ? attachment.size : 0;
    if (!dataUrl.startsWith("data:") || size > maxAttachmentBytes || totalBytes + size > maxAttachmentTotalBytes) continue;
    totalBytes += size;
    safeAttachments.push({
      id: cleanId(attachment.id) || crypto.randomUUID(),
      name: cleanString(attachment.name) || "Imported attachment",
      type,
      kind: cleanString(attachment.kind) || type.split("/")[0] || "file",
      size,
      dataUrl,
      posterDataUrl:
        typeof attachment.posterDataUrl === "string" && attachment.posterDataUrl.startsWith("data:image/")
          ? attachment.posterDataUrl
          : "",
      demoStatic: attachment.demoStatic === true,
    });
  }
  return safeAttachments;
}

function showCaptureStudio(mode = "audio") {
  recordingMode = mode === "video" ? "video" : "audio";
  document.querySelector("#captureStudio")?.remove();
  app.querySelector(".app-view")?.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="captureStudio" class="seal-dialog capture-studio" aria-labelledby="captureStudioTitle" aria-describedby="captureStudioBody">
        <div class="studio-mode" role="group" aria-label="Capture mode">
          <button class="${recordingMode === "audio" ? "is-active" : ""}" type="button" data-action="switchStudioMode" data-mode="audio" ${isRecording ? "disabled" : ""}>Voice</button>
          <button class="${recordingMode === "video" ? "is-active" : ""}" type="button" data-action="switchStudioMode" data-mode="video" ${isRecording ? "disabled" : ""}>Video</button>
        </div>
        <div class="studio-stage ${recordingMode === "video" ? "video-stage" : ""}">
          ${
            recordingMode === "video"
              ? `<video id="studioPreview" muted playsinline autoplay></video>`
              : `<span class="echo-orb">${icon("mic")}</span>`
          }
        </div>
        <p class="eyebrow">Capture room</p>
        <h2 id="captureStudioTitle">${recordingMode === "video" ? "Record a video note." : "Record a voice note."}</h2>
        <p id="captureStudioBody">${recordingMode === "video" ? "Save the room, your face, or the object that belongs with this Echo." : "Save the sound of this moment without sending it anywhere."}</p>
        <p id="studioState" class="studio-state" aria-live="polite">Ready on this device.</p>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-action="closeStudio">Close</button>
          <button class="secondary-button" type="button" data-action="stopStudio" disabled>${icon("stop")}Stop and attach</button>
          <button class="primary-button" type="button" data-action="startStudio" data-mode="${recordingMode}">${icon(recordingMode === "video" ? "video" : "mic")}Start ${recordingMode === "video" ? "video" : "voice"}</button>
        </div>
      </dialog>
    `,
  );
  const dialog = document.querySelector("#captureStudio");
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCaptureStudio();
  });
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
  dialog?.querySelector("[data-action='startStudio']")?.focus();
}

async function startStudioRecording(mode = recordingMode) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    toast(mode === "video" ? "Video recording is not available in this browser." : "Voice recording is not available in this browser.");
    return;
  }

  const constraints = mode === "video" ? { audio: true, video: true } : { audio: true };
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch {
    toast(mode === "video" ? "Camera or microphone permission was not granted." : "Microphone permission was not granted.");
    return;
  }

  recordedChunks = [];
  discardRecording = false;
  try {
    mediaRecorder = new MediaRecorder(recordingStream);
  } catch {
    stopRecordingStream();
    toast(mode === "video" ? "Video recording could not start in this browser." : "Voice recording could not start in this browser.");
    return;
  }

  const preview = document.querySelector("#studioPreview");
  if (preview) {
    try {
      preview.srcObject = recordingStream;
    } catch {
      preview.removeAttribute("src");
    }
  }
  isRecording = true;
  setStudioRecordingState(true, mode);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data?.size) recordedChunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
    const shouldDiscard = discardRecording;
    isRecording = false;
    setStudioRecordingState(false, mode);
    stopRecordingStream();
    if (shouldDiscard) return;
    await attachStudioRecording(mode);
  };
  mediaRecorder.start();
}

function stopStudioRecording() {
  if (!isRecording || !mediaRecorder) return;
  discardRecording = false;
  mediaRecorder.stop();
}

function closeCaptureStudio() {
  if (isRecording && mediaRecorder) {
    discardRecording = true;
    mediaRecorder.stop();
  } else {
    stopRecordingStream();
  }
  const dialog = document.querySelector("#captureStudio");
  if (dialog?.close) dialog.close();
  dialog?.remove();
  document.querySelector(`[data-action='openStudio'][data-mode='${recordingMode}']`)?.focus();
}

function stopRecordingStream() {
  recordingStream?.getTracks?.().forEach((track) => track.stop());
  recordingStream = null;
  const preview = document.querySelector("#studioPreview");
  if (preview) preview.srcObject = null;
}

function setStudioRecordingState(active, mode) {
  const state = document.querySelector("#studioState");
  const start = document.querySelector("[data-action='startStudio']");
  const stop = document.querySelector("[data-action='stopStudio']");
  document.querySelector("#captureStudio")?.classList.toggle("is-recording", active);
  if (state) state.innerHTML = active ? `<span class="record-dot"></span>Recording ${mode}.` : "Recording saved locally.";
  if (start) start.disabled = active;
  if (stop) stop.disabled = !active;
}

async function attachStudioRecording(mode) {
  const type = mode === "video" ? "video/webm" : "audio/webm";
  const label = mode === "video" ? "Video note" : "Voice note";
  const blob = new Blob(recordedChunks, { type });
  const attachment = await fileToAttachment(new File([blob], `${label} ${new Date().toLocaleTimeString()}.webm`, { type }));
  const list = document.querySelector("#attachmentList");
  if (!list) return;
  const attachments = JSON.parse(list.dataset.attachments || "[]");
  attachments.push(attachment);
  list.dataset.attachments = JSON.stringify(attachments);
  renderAttachmentList(list, attachments);
  updateArtifactSummary();
  const state = document.querySelector("#recordingState");
  if (state) state.textContent = `${label} added`;
  toast(`${label} added.`);
}

function renderAttachmentList(list, attachments) {
  list.innerHTML = attachments
    .map((file) => {
      const name = escapeHtml(file.name);
      const removeButton = `<button class="attachment-remove" type="button" data-action="removeAttachment" data-id="${escapeHtml(file.id)}" aria-label="Remove ${name}" title="Remove ${name}">${icon("trash")}</button>`;
      if (file.type.startsWith("image/")) {
        return `<figure class="attachment-preview"><img src="${file.dataUrl}" alt="${name}" /><figcaption>${name}</figcaption>${removeButton}</figure>`;
      }
      if (file.type.startsWith("video/")) {
        const poster = file.posterDataUrl ? ` poster="${escapeHtml(file.posterDataUrl)}"` : "";
        return `<figure class="attachment-preview"><video src="${file.dataUrl}" muted playsinline${poster}></video><figcaption>${name}</figcaption>${removeButton}</figure>`;
      }
      if (file.type.startsWith("audio/")) {
        return `<div class="attachment-preview audio-preview">${icon("mic")}<span>${name}</span>${removeButton}</div>`;
      }
      return `<div class="attachment-preview file-preview">${icon("paperclip")}<span>${name}</span>${removeButton}</div>`;
    })
    .join("");
}

function polishSelectedText() {
  const letter = document.querySelector("#letter");
  const start = letter.selectionStart;
  const end = letter.selectionEnd;
  const selected = letter.value.slice(start, end);

  if (!selected.trim()) {
    toast("Highlight a sentence first.");
    letter.focus();
    return;
  }

  const polished = lightlyPolishText(selected);
  letter.setRangeText(polished, start, end, "select");
  toast("Selected text polished locally.");
  letter.focus();
}

function lightlyPolishText(text) {
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  let core = text.trim();
  core = core
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])(?=\S)/g, "$1 ")
    .replace(/\.{2,}/g, ".")
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?");
  core = core.charAt(0).toUpperCase() + core.slice(1);
  return `${leading}${core}${trailing}`;
}

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "application/octet-stream",
        kind: file.type.split("/")[0] || "file",
        size: file.size,
        dataUrl: reader.result,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function estimateExportSize(echoes) {
  return new Blob([JSON.stringify({ echoes })]).size;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const display = Number.isInteger(value) || value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1);
  return `${display} ${units[index]}`;
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  window.setTimeout(() => node.remove(), 2800);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  const date = new Date(value);
  const today = new Date();
  const dayMs = 1000 * 60 * 60 * 24;
  const diff = Math.round((date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / dayMs);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return formatShortDate(value);
}

function describeDurationBetween(start, end) {
  const dayMs = 1000 * 60 * 60 * 24;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const days = Math.max(0, Math.round((endDay - startDay) / dayMs));
  if (days === 0) return "Less than a day";
  if (days === 1) return "1 day";
  if (days < 60) return `${days} days`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Echo still works normally when installability is unavailable.
    });
  });
}

window.addEventListener("hashchange", route);
registerServiceWorker();
route();
