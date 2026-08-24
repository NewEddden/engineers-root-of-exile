/* reader.js — read.html
   Modes:
     read.html?ch=N   -> one chapter, with dropdown + Prev/Next  ("Chapters separate")
     read.html?view=all -> every chapter stacked on one page      ("All chapters", for TTS)

   Chapter text is pulled from chapters/<slug>.html via fetch, so the chapters/
   folder never has to change. We extract the main content from each file
   (article > main > body) so both full-page and fragment chapter files work.

   NOTE: fetch() only works over http(s). Opening read.html straight off disk
   (file://) will fail with a CORS error, use a local server for testing. */

(function () {
  const params = new URLSearchParams(location.search);
  const isAll = params.get("view") === "all";

  const elSep = document.getElementById("btn-separate");
  const elAll = document.getElementById("btn-all");
  const elBar = document.getElementById("reader-bar");
  const elPrev = document.getElementById("btn-prev");
  const elNext = document.getElementById("btn-next");
  const elSelect = document.getElementById("chapter-select");
  const elContent = document.getElementById("reader-content");

  async function extractContent(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status + " fetching " + url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const node =
      doc.querySelector("#chapter-content") ||
      doc.querySelector("article") ||
      doc.querySelector("main") ||
      doc.body;
    return node ? node.innerHTML : html;
  }

  function setToggle() {
    elAll.classList.toggle("solid", isAll);
    elSep.classList.toggle("solid", !isAll);
    // "Chapters separate" returns to the chapter you were on (default 1)
    const back = params.get("ch") || 1;
    elSep.href = "read.html?ch=" + encodeURIComponent(back);
    elAll.href = "read.html?view=all";
  }

  // ---- SEPARATE MODE -------------------------------------------------------
  async function renderSingle(chapters) {
    let n = parseInt(params.get("ch") || "", 10);
    let idx = chapters.findIndex((c) => c.n === n);
    if (idx === -1) idx = 0; // default to first chapter
    const ch = chapters[idx];

    // dropdown
    elSelect.innerHTML = "";
    chapters.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.n;
      opt.textContent = "Chapter " + c.n + ": " + c.title;
      if (c.n === ch.n) opt.selected = true;
      elSelect.appendChild(opt);
    });
    elSelect.onchange = () => {
      location.href = "read.html?ch=" + elSelect.value;
    };

    // prev / next by position, so gaps in numbering don't break navigation
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];
    wireNav(elPrev, prev, "\u2190 Prev");
    wireNav(elNext, next, "Next \u2192");

    document.title =
      "Ch " + ch.n + ": " + ch.title + " \u2014 The Engineer's Root of Exile";

    elContent.innerHTML = '<div class="loading">Loading chapter\u2026</div>';
    try {
      const body = await extractContent(EROE.fileHref(ch.slug));
      elContent.innerHTML = body;
      window.scrollTo({ top: 0 });
    } catch (e) {
      showError(e);
    }
  }

  function wireNav(btn, target, label) {
    btn.textContent = label;
    if (target) {
      btn.removeAttribute("aria-disabled");
      btn.onclick = () => {
        location.href = "read.html?ch=" + target.n;
      };
    } else {
      btn.setAttribute("aria-disabled", "true");
      btn.onclick = null;
    }
  }

  // ---- ALL MODE (TTS) ------------------------------------------------------
  async function renderAll(chapters) {
    elBar.style.display = "none"; // no dropdown / prev / next in all-mode
    document.title = "All chapters \u2014 The Engineer's Root of Exile";
    elContent.innerHTML =
      '<div class="loading">Loading all ' +
      chapters.length +
      " chapters\u2026</div>";

    try {
      const parts = await Promise.all(
        chapters.map((c) =>
          extractContent(EROE.fileHref(c.slug))
            .then((body) => ({ c, body }))
            .catch(() => ({
              c,
              body: '<p class="error">Could not load this chapter.</p>',
            })),
        ),
      );
      elContent.innerHTML = parts
        .map(
          ({ c, body }, i) =>
            (i > 0 ? '<hr class="all-sep">' : "") +
            "<section>" +
            body +
            "</section>",
        )
        .join("");
    } catch (e) {
      showError(e);
    }
  }

  function showError(e) {
    elContent.innerHTML =
      '<div class="error">Could not load chapter text.<br>' +
      (e && e.message ? e.message : "") +
      "<br><br>If you opened this page directly from your files, use a local server " +
      "(fetch is blocked on the file:// protocol).</div>";
  }

  // ---- boot ----------------------------------------------------------------
  setToggle();
  EROE.load()
    .then(({ chapters }) => {
      if (!chapters.length) {
        showError(new Error("chapters.json is empty."));
        return;
      }
      if (isAll) renderAll(chapters);
      else renderSingle(chapters);
    })
    .catch(showError);
})();
