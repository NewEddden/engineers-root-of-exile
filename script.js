const CHAPTERS_JSON = "chapters.json";

let chapters = [];
let currentIndex = 0;

const titleEl = document.getElementById("chapter-title");
const contentEl = document.getElementById("chapter-content");
const prevBtns = document.querySelectorAll(".prev-btn");
const nextBtns = document.querySelectorAll(".next-btn");
const selects = document.querySelectorAll(".chapter-select");

async function init() {
  try {
    const res = await fetch(CHAPTERS_JSON);
    chapters = await res.json();
  } catch (err) {
    setTitle("Could not load chapters.json");
    console.error(err);
    return;
  }

  if (!chapters.length) {
    setTitle("No chapters yet");
    return;
  }

  populateDropdowns();

  const startId = window.location.hash.replace("#", "");
  const startIndex = chapters.findIndex((c) => c.id === startId);
  loadChapter(startIndex !== -1 ? startIndex : 0);

  prevBtns.forEach((btn) => btn.addEventListener("click", goPrev));
  nextBtns.forEach((btn) => btn.addEventListener("click", goNext));
  selects.forEach((select) =>
    select.addEventListener("change", onSelectChange),
  );
  window.addEventListener("hashchange", onHashChange);
}

function populateDropdowns() {
  const optionsHtml = chapters
    .map((c, i) => `<option value="${i}">${c.title}</option>`)
    .join("");
  selects.forEach((select) => {
    select.innerHTML = optionsHtml;
  });
}

async function loadChapter(index) {
  const chapter = chapters[index];
  if (!chapter) return;

  contentEl.classList.remove("loaded");
  setTitle("Loading...");

  try {
    const res = await fetch(chapter.file);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const html = await res.text();
    contentEl.innerHTML = html;
    setTitle(hasOwnTitle() ? null : chapter.title);
  } catch (err) {
    contentEl.innerHTML =
      "<p>Could not load this chapter. Check that the file path in chapters.json is correct.</p>";
    setTitle(chapter.title);
    console.error(err);
  }

  requestAnimationFrame(() => contentEl.classList.add("loaded"));

  currentIndex = index;
  syncControls();
  window.location.hash = chapter.id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hasOwnTitle() {
  if (contentEl.querySelector("h2.chapter-name")) return true;
  const first = contentEl.firstElementChild;
  return !!first && first.tagName === "H2";
}

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
  if (currentIndex > 0) loadChapter(currentIndex - 1);
}

function goNext() {
  if (currentIndex < chapters.length - 1) loadChapter(currentIndex + 1);
}

function onSelectChange(e) {
  loadChapter(Number(e.target.value));
}

function onHashChange() {
  const id = window.location.hash.replace("#", "");
  const index = chapters.findIndex((c) => c.id === id);
  if (index !== -1 && index !== currentIndex) loadChapter(index);
}

init();
