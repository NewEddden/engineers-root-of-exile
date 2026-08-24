const CHAPTERS_JSON = "assets/json/chapters.json";

let chapters = [];
let currentIndex = 0;

const searchEl = document.getElementById("chapter-search");
const selectEl = document.getElementById("chapter-select");
const statusEl = document.getElementById("finder-status");
const titleEl = document.getElementById("chapter-title");
const contentEl = document.getElementById("chapter-content");
const prevBtns = document.querySelectorAll(".prev-btn");
const nextBtns = document.querySelectorAll(".next-btn");

async function init() {
  try {
    const res = await fetch(CHAPTERS_JSON, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    chapters = dedupeById(await res.json());
  } catch (err) {
    setTitle("Could not load chapters.json");
    console.error(err);
    return;
  }

  if (!chapters.length) {
    setTitle("No chapters yet");
    return;
  }

  renderOptions(allItems());

  // Start on the chapter named in the URL hash (e.g. #ch-05), else chapter 1.
  const startId = window.location.hash.replace("#", "");
  const startIndex = chapters.findIndex((c) => c.id === startId);
  currentIndex = startIndex !== -1 ? startIndex : 0;

  searchEl.addEventListener("input", onSearch);
  searchEl.addEventListener("keydown", onSearchKey);
  selectEl.addEventListener("change", onSelect);
  prevBtns.forEach((btn) => btn.addEventListener("click", goPrev));
  nextBtns.forEach((btn) => btn.addEventListener("click", goNext));
  window.addEventListener("hashchange", onHashChange);

  loadChapter(currentIndex);
}

// chapters.json may list an id more than once; keep the first of each.
function dedupeById(list) {
  const seen = new Set();
  return list.filter((chapter) => {
    if (seen.has(chapter.id)) return false;
    seen.add(chapter.id);
    return true;
  });
}

/* ---- finder: search + dropdown ---- */

// Every option keeps its index in the full `chapters` array as its value,
// so filtering the list never breaks prev/next or the current selection.
function allItems() {
  return chapters.map((c, i) => ({ c, i }));
}

function renderOptions(items) {
  selectEl.innerHTML = items
    .map(
      ({ c, i }) =>
        `<option value="${i}">Chapter ${c.number}: ${escapeHtml(c.title)}</option>`,
    )
    .join("");
}

function matchItems(query) {
  const q = query.trim().toLowerCase();
  if (q === "") return allItems();

  return allItems().filter(
    ({ c }) =>
      String(c.number).includes(q) || c.title.toLowerCase().includes(q),
  );
}

function onSearch() {
  const items = matchItems(searchEl.value);
  renderOptions(items);

  if (searchEl.value.trim() === "") {
    statusEl.textContent = "";
  } else if (items.length === 0) {
    statusEl.textContent = "No chapters match that.";
  } else {
    statusEl.textContent = `${items.length} match${items.length === 1 ? "" : "es"}`;
  }

  // Keep the current chapter highlighted if it's still in the list.
  if (items.some(({ i }) => i === currentIndex)) {
    selectEl.value = String(currentIndex);
  }
}

function onSearchKey(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const first = selectEl.options[0];
  if (first) loadChapter(Number(first.value));
}

function onSelect() {
  loadChapter(Number(selectEl.value));
}

/* ---- reader ---- */

async function loadChapter(index) {
  const chapter = chapters[index];
  if (!chapter) return;

  currentIndex = index;

  contentEl.classList.remove("loaded");
  setTitle("Loading...");

  try {
    const res = await fetch(chapter.file);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    contentEl.innerHTML = await res.text();

    // If the chapter file carries its own <h2>, don't show the page title too.
    setTitle(hasOwnTitle() ? null : chapter.title);
  } catch (err) {
    setTitle(chapter.title);
    contentEl.innerHTML =
      "<p>Could not load this chapter. Check that the file path in chapters.json is correct.</p>";
    console.error(err);
  }

  requestAnimationFrame(() => contentEl.classList.add("loaded"));

  // Reset the finder to the full list with this chapter selected.
  searchEl.value = "";
  statusEl.textContent = "";
  renderOptions(allItems());
  syncControls();

  if (window.location.hash !== `#${chapter.id}`) {
    window.history.replaceState(null, "", `#${chapter.id}`);
  }

  scrollToChapters();
}

function hasOwnTitle() {
  if (contentEl.querySelector("h2.chapter-name")) return true;
  const first = contentEl.firstElementChild;
  return first && first.tagName === "H2";
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
  selectEl.value = String(currentIndex);
  prevBtns.forEach((btn) => (btn.disabled = currentIndex === 0));
  nextBtns.forEach(
    (btn) => (btn.disabled = currentIndex === chapters.length - 1),
  );
}

function goPrev() {
  if (currentIndex > 0) loadChapter(currentIndex - 1);
}

function goNext() {
  if (currentIndex < chapters.length - 1) loadChapter(currentIndex + 1);
}

function onHashChange() {
  const id = window.location.hash.replace("#", "");
  const index = chapters.findIndex((c) => c.id === id);
  if (index !== -1 && index !== currentIndex) loadChapter(index);
}

function scrollToChapters() {
  const section = document.getElementById("chapters");
  if (!section) return;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  section.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
