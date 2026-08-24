/* data.js — shared helpers. Loaded before page scripts.
   Every page lives at the repo root, so these relative paths resolve the same
   way on a user page (user.github.io) and a project page
   (user.github.io/repo/). Do NOT switch these to leading-slash paths. */

window.EROE = (function () {
  const DATA_URL = "assets/data/chapters.json";
  const CH_DIR = "chapters/";

  let _cache = null;

  async function load() {
    if (_cache) return _cache;
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok)
      throw new Error("Could not load " + DATA_URL + " (" + res.status + ")");
    const json = await res.json();
    // Normalise: sort by n ascending, keep only well-formed rows.
    const chapters = (json.chapters || [])
      .filter((c) => c && c.n != null && c.slug && c.title)
      .sort((a, b) => a.n - b.n);
    _cache = { meta: json, chapters };
    return _cache;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Link to the reader shell for a given chapter number.
  function readHref(n) {
    return "read.html?ch=" + encodeURIComponent(n);
  }
  // Direct path to the raw chapter file.
  function fileHref(slug) {
    return CH_DIR + slug + ".html";
  }

  return { load, fmtDate, readHref, fileHref, DATA_URL, CH_DIR };
})();
