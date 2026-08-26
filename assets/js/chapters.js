/* chapters.js — table of contents: list + pagination + search.
   Search matches chapter title (substring, case-insensitive) OR chapter number
   ("50", "ch 50", "chapter 50"). Search filters the FULL list, then paginates
   the filtered result. */

(function () {
  const PER_PAGE = 10;

  const listEl = document.getElementById("toc-list");
  const pagerEl = document.getElementById("pager");
  const countEl = document.getElementById("toc-count");
  const inputEl = document.getElementById("search-input");
  const clearEl = document.getElementById("search-clear");

  let ALL = [];
  let filtered = [];
  let page = 1;
  let query = "";

  function readUrl() {
    const p = new URLSearchParams(location.search);
    query = (p.get("q") || "").trim();
    page = Math.max(1, parseInt(p.get("page") || "1", 10) || 1);
  }

  function writeUrl(replace) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (page > 1) p.set("page", page);
    const qs = p.toString();
    const url = location.pathname + (qs ? "?" + qs : "");
    history[replace ? "replaceState" : "pushState"]({ page, query }, "", url);
  }

  function matches(ch, q) {
    if (!q) return true;
    const needle = q.toLowerCase();
    if (ch.title.toLowerCase().includes(needle)) return true;
    // number match: pull digits out of the query and compare to n
    const digits = needle.replace(/[^0-9]/g, "");
    if (digits && String(ch.n) === digits) return true;
    // also allow partial number match so "5" surfaces 5, 15, 50...
    if (digits && String(ch.n).includes(digits)) return true;
    return false;
  }

  function applyFilter() {
    filtered = ALL.filter((ch) => matches(ch, query));
    const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (page > maxPage) page = maxPage;
  }

  function render() {
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const rows = filtered.slice(start, start + PER_PAGE);

    // count line
    if (query) {
      countEl.textContent =
        total +
        (total === 1 ? " chapter" : " chapters") +
        ' match "' +
        query +
        '".';
    } else {
      countEl.textContent =
        ALL.length + " chapters posted. Page " + page + " of " + maxPage + ".";
    }

    // list
    listEl.innerHTML = "";
    if (rows.length === 0) {
      const li = document.createElement("li");
      li.innerHTML =
        '<div class="toc-empty">No chapters match that search.</div>';
      listEl.appendChild(li);
    } else {
      for (const ch of rows) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = EROE.readHref(ch.n);
        a.innerHTML =
          '<span class="num">Chapter ' +
          ch.n +
          "</span>" +
          '<span class="ttl">' +
          escapeHtml(ch.title) +
          "</span>" +
          '<span class="meta">' +
          EROE.fmtDate(ch.date) +
          (ch.minutes ? " &middot; " + ch.minutes + " min read" : "") +
          "</span>";
        li.appendChild(a);
        listEl.appendChild(li);
      }
    }

    renderPager(maxPage);
    clearEl.classList.toggle("show", !!query);
  }

  function renderPager(maxPage) {
    pagerEl.innerHTML = "";
    if (maxPage <= 1) return;

    const newer = document.createElement("button");
    newer.textContent = "\u2190 Newer";
    newer.disabled = page <= 1;
    newer.onclick = () => go(page - 1);
    pagerEl.appendChild(newer);

    for (let i = 1; i <= maxPage; i++) {
      const b = document.createElement("button");
      b.className = "page-num" + (i === page ? " active" : "");
      b.textContent = i;
      b.onclick = () => go(i);
      pagerEl.appendChild(b);
    }

    const older = document.createElement("button");
    older.textContent = "Older \u2192";
    older.disabled = page >= maxPage;
    older.onclick = () => go(page + 1);
    pagerEl.appendChild(older);
  }

  function go(p) {
    page = p;
    writeUrl(false);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSearch(v) {
    query = v.trim();
    page = 1;
    applyFilter();
    writeUrl(true);
    render();
  }

  function escapeHtml(s) {
    return s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // wire up
  let t;
  inputEl.addEventListener("input", (e) => {
    clearTimeout(t);
    const v = e.target.value;
    t = setTimeout(() => onSearch(v), 120);
  });
  clearEl.addEventListener("click", () => {
    inputEl.value = "";
    onSearch("");
    inputEl.focus();
  });
  window.addEventListener("popstate", () => {
    readUrl();
    inputEl.value = query;
    applyFilter();
    render();
  });

  EROE.load()
    .then(({ chapters }) => {
      ALL = chapters;
      readUrl();
      inputEl.value = query;
      applyFilter();
      render();
    })
    .catch((err) => {
      countEl.textContent = "";
      listEl.innerHTML =
        '<li><div class="toc-empty">' +
        err.message +
        "<br>If you opened this file directly, run it over a local server " +
        "(chapters load via fetch, which the file:// protocol blocks).</div></li>";
    });
})();
