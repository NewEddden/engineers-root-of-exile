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

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

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

  // Load chapter from URL hash, e.g. #ch-05
  const startId = window.location.hash.replace("#", "");
  const startIndex = chapters.findIndex((chapter) => chapter.id === startId);

  loadChapter(startIndex !== -1 ? startIndex : 0);

  prevBtns.forEach((btn) => {
    btn.addEventListener("click", goPrev);
  });

  nextBtns.forEach((btn) => {
    btn.addEventListener("click", goNext);
  });

  selects.forEach((select) => {
    select.addEventListener("change", onSelectChange);
  });

  window.addEventListener("hashchange", onHashChange);
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

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function hasOwnTitle() {
  if (contentEl.querySelector("h2.chapter-name")) {
    return true;
  }

  const first = contentEl.firstElementChild;

  return first && first.tagName === "H2";
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
  // Update every chapter dropdown
  selects.forEach((select) => {
    select.value = String(currentIndex);
  });

  // Disable Previous on first chapter
  prevBtns.forEach((btn) => {
    btn.disabled = currentIndex === 0;
  });

  // Disable Next on last chapter
  nextBtns.forEach((btn) => {
    btn.disabled = currentIndex === chapters.length - 1;
  });
}

function goPrev() {
  if (currentIndex > 0) {
    loadChapter(currentIndex - 1);
  }
}

function goNext() {
  if (currentIndex < chapters.length - 1) {
    loadChapter(currentIndex + 1);
  }
}

function onSelectChange(event) {
  const index = Number(event.target.value);

  if (!Number.isNaN(index)) {
    loadChapter(index);
  }
}

function onHashChange() {
  const id = window.location.hash.replace("#", "");

  const index = chapters.findIndex((chapter) => chapter.id === id);

  if (index !== -1 && index !== currentIndex) {
    loadChapter(index);
  }
}

init();
