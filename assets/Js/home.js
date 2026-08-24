const CHAPTERS_JSON = "assets/json/chapters.json";

async function init() {
  let chapters = [];

  try {
    const res = await fetch(CHAPTERS_JSON, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    chapters = dedupeById(await res.json());
  } catch (err) {
    console.error(err);
    return;
  }

  if (!chapters.length) return;

  const first = chapters[0];
  const latest = chapters[chapters.length - 1];

  const numberEl = document.getElementById("latest-number");
  const nameEl = document.getElementById("latest-name");
  const dateEl = document.getElementById("latest-date");
  const cardEl = document.getElementById("latest-card");
  const startEl = document.getElementById("start-reading");

  if (numberEl) numberEl.textContent = `Chapter ${latest.number}`;
  if (nameEl) nameEl.textContent = latest.title;

  if (dateEl && latest.date) {
    const parsed = new Date(`${latest.date}T00:00:00`);
    dateEl.textContent = Number.isNaN(parsed.getTime())
      ? `Posted ${latest.date}`
      : `Posted ${parsed.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`;
  }

  // Point the CTAs at the chapters page, deep-linked to a specific chapter.
  if (cardEl) cardEl.setAttribute("href", `chapters.html#${latest.id}`);
  if (startEl) startEl.setAttribute("href", `chapters.html#${first.id}`);
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

init();
