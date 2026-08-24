const CHAPTERS_JSON = "chapters.json";
const MODE_KEY = "reader-mode";

let chapters = [];
let currentIndex = 0;
let mode = "separate"; // "separate" | "all"

const titleEl = document.getElementById("chapter-title");
const contentEl = document.getElementById("chapter-content");
const prevBtns = document.querySelectorAll(".prev-btn");
const nextBtns = document.querySelectorAll(".next-btn");
const selects = document.querySelectorAll(".chapter-select");
const navs = document.querySelectorAll(".chapter-nav");
const modeBtns = document.querySelectorAll(".mode-btn");

async function init() {
  try {
    const res = await fetch(CHAPTERS_JSON, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    chapters = await res.json();
  } catch (err) {
    setTitle("Could not load chapters.json");
    console.error(err);
    return;
  }

  // chapters.json currently lists some ids more than once; drop the repeats
  // so "All chapters" mode doesn't read the same chapter twice.
  chapters = dedupeById(chapters);

  if (!chapters.length) {
    setTitle("No chapters yet");
    return;
  }

  populateDropdowns();
  updateLatestCard();
  setupHomeLinks();

  // Restore last-used mode (persists across reloads).
  mode = window.localStorage.getItem(MODE_KEY) === "all" ? "all" : "separate";

  // Starting chapter from URL hash, e.g. #ch-05
  const startId = window.location.hash.replace("#", "");
  const startIndex = chapters.findIndex((chapter) => chapter.id === startId);
  currentIndex = startIndex !== -1 ? startIndex : 0;

  prevBtns.forEach((btn) => btn.addEventListener("click", goPrev));
  nextBtns.forEach((btn) => btn.addEventListener("click", goNext));
  selects.forEach((select) =>
    select.addEventListener("change", onSelectChange),
  );
  modeBtns.forEach((btn) =>
    btn.addEventListener("click", () => setMode(btn.dataset.mode)),
  );
  window.addEventListener("hashchange", onHashChange);

  applyMode();

  // Arrived via a shared chapter link (#ch-05): land on the reader, not the top.
  if (startIndex !== -1) {
    scrollToSection("chapters");
  }
}

function dedupeById(list) {
  const seen = new Set();
  return list.filter((chapter) => {
    if (seen.has(chapter.id)) return false;
    seen.add(chapter.id);
    return true;
  });
}

function populateDropdowns() {
  const optionsHtml = chapters
    .map(
      (chapter, index) =>
        `<option value="${index}">Chapter ${chapter.number}: ${chapter.title}</option>`,
    )
    .join("");

  selects.forEach((select) => {
    select.innerHTML = optionsHtml;
  });
}

/* ---- home landing: latest-chapter card ---- */

function updateLatestCard() {
  const numberEl = document.getElementById("latest-number");
  const nameEl = document.getElementById("latest-name");
  const dateEl = document.getElementById("latest-date");

  // These only exist on the fused home page; bail quietly elsewhere.
  if (!numberEl || !nameEl) return;

  const latest = chapters[chapters.length - 1];

  numberEl.textContent = `Chapter ${latest.number}`;
  nameEl.textContent = latest.title;

  if (dateEl && latest.date) {
    const parsed = new Date(`${latest.date}T00:00:00`);
    dateEl.textContent = Number.isNaN(parsed.getTime())
      ? latest.date
      : parsed.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  }
}

/* ---- home landing: same-page scroll for nav + CTAs ---- */
// Links carry data-scroll="top" | "chapters". On this page we scroll to the
// section; from a future separate page the plain href (index.html#...) just
// navigates back here. "Start reading" / the latest card also open a chapter.

function setupHomeLinks() {
  const links = document.querySelectorAll("[data-scroll]");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = link.dataset.scroll;
      const section = document.getElementById(target);
      if (!section) return; // not on this page, let the link navigate

      event.preventDefault();

      // Opening the reader from a call-to-action loads a chapter first.
      if (link.id === "start-reading") {
        jumpToChapter(0);
      } else if (link.id === "latest-card") {
        jumpToChapter(chapters.length - 1);
      }

      scrollToSection(target);
    });
  });
}

function jumpToChapter(index) {
  currentIndex = index;

  // Reading a single chapter only makes sense in "separate" mode.
  if (mode !== "separate") {
    setMode("separate"); // applyMode() loads currentIndex
  } else {
    loadChapter(index);
  }
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  section.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

/* ---- mode handling ---- */

function setMode(newMode) {
  if (newMode !== "separate" && newMode !== "all") return;
  if (newMode === mode) return;

  mode = newMode;
  window.localStorage.setItem(MODE_KEY, mode);
  applyMode();
}

function applyMode() {
  const separate = mode === "separate";

  modeBtns.forEach((btn) => {
    const on = btn.dataset.mode === mode;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // Per-chapter nav (prev/next/dropdown) is only useful one chapter at a time.
  navs.forEach((nav) => {
    nav.style.display = separate ? "" : "none";
  });

  if (separate) {
    loadChapter(currentIndex);
  } else {
    loadAllChapters();
  }
}

/* ---- separate mode ---- */

async function loadChapter(index) {
  const chapter = chapters[index];

  if (!chapter) return;

  currentIndex = index;

  contentEl.classList.remove("loaded");
  setTitle("Loading...");

  try {
    const res = await fetch(chapter.file);

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const html = await res.text();

    contentEl.innerHTML = html;

    // If the chapter HTML contains its own <h2>, hide the page title.
    if (hasOwnTitle()) {
      setTitle(null);
    } else {
      setTitle(chapter.title);
    }
  } catch (err) {
    setTitle(chapter.title);

    contentEl.innerHTML = `
      <p>
        Could not load this chapter.
        Check that the file path in chapters.json is correct.
      </p>
    `;

    console.error(err);
  }

  requestAnimationFrame(() => {
    contentEl.classList.add("loaded");
  });

  syncControls();

  // Update URL without creating a history entry
  if (window.location.hash !== `#${chapter.id}`) {
    window.history.replaceState(null, "", `#${chapter.id}`);
  }
}

function hasOwnTitle() {
  if (contentEl.querySelector("h2.chapter-name")) {
    return true;
  }

  const first = contentEl.firstElementChild;

  return first && first.tagName === "H2";
}

/* ---- all-chapters mode ---- */

async function loadAllChapters() {
  setTitle(null);
  contentEl.classList.remove("loaded");
  contentEl.innerHTML = "<p>Loading all chapters...</p>";

  // Fetch in parallel, then assemble in reading order.
  const htmls = await Promise.all(
    chapters.map(async (chapter) => {
      try {
        const res = await fetch(chapter.file);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return await res.text();
      } catch (err) {
        console.error("Failed to load", chapter.file, err);
        return null;
      }
    }),
  );

  contentEl.innerHTML = chapters
    .map((chapter, i) => buildChapterSection(chapter, htmls[i]))
    .join("");

  requestAnimationFrame(() => {
    contentEl.classList.add("loaded");
  });

  syncControls();

  // If we arrived with a chapter hash, jump to that section; else top.
  const id = window.location.hash.replace("#", "");
  if (id && document.getElementById(`all-${id}`)) {
    document
      .getElementById(`all-${id}`)
      .scrollIntoView({ behavior: "auto", block: "start" });
  }
}

function buildChapterSection(chapter, html) {
  const anchorId = `all-${chapter.id}`;

  if (html === null) {
    return (
      `<section class="all-chapter" id="${anchorId}">` +
      `<h2 class="chapter-name">Chapter ${chapter.number}: ${chapter.title}</h2>` +
      `<p>Could not load this chapter.</p>` +
      `</section>`
    );
  }

  // Only add a heading if the chapter file doesn't already carry its own.
  const hasHeading = /<h2[\s>]/i.test(html);
  const heading = hasHeading
    ? ""
    : `<h2 class="chapter-name">Chapter ${chapter.number}: ${chapter.title}</h2>`;

  return `<section class="all-chapter" id="${anchorId}">${heading}${html}</section>`;
}

/* ---- shared ---- */

function setTitle(text) {
  if (text === null) {
    titleEl.textContent = "";
    titleEl.style.display = "none";
  } else {
    titleEl.textContent = text;
    titleEl.style.display = "";
  }
}

function syncControls() {
  selects.forEach((select) => {
    select.value = String(currentIndex);
  });

  prevBtns.forEach((btn) => {
    btn.disabled = currentIndex === 0;
  });

  nextBtns.forEach((btn) => {
    btn.disabled = currentIndex === chapters.length - 1;
  });
}

function goPrev() {
  if (currentIndex > 0) {
    loadChapter(currentIndex - 1);
    scrollToSection("chapters");
  }
}

function goNext() {
  if (currentIndex < chapters.length - 1) {
    loadChapter(currentIndex + 1);
    scrollToSection("chapters");
  }
}

function onSelectChange(event) {
  const index = Number(event.target.value);

  if (!Number.isNaN(index)) {
    loadChapter(index);
    scrollToSection("chapters");
  }
}

function onHashChange() {
  // Hash navigation only drives the single-chapter view.
  if (mode !== "separate") return;

  const id = window.location.hash.replace("#", "");

  // #top / #chapters are page anchors, not chapters; ignore them here.
  if (id === "top" || id === "chapters") return;

  const index = chapters.findIndex((chapter) => chapter.id === id);

  if (index !== -1 && index !== currentIndex) {
    loadChapter(index);
  }
}

init();
