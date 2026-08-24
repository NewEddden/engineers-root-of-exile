# The Engineer's Root of Exile

Static site for the serial. No build step. Hosts on GitHub Pages as-is.

## Structure

```
engineers-root-of-exile-main/
├── index.html          Home
├── chapters.html       Table of contents (paginated + search)
├── read.html           Reader (single chapter, or all-on-one-page for TTS)
├── characters.html     stub
├── magic.html          stub
├── world.html          stub
├── glossary.html       stub
├── about.html          stub
├── chapters/           YOUR chapter files, unchanged: chapter-01.html ...
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── data.js      shared loader/helpers
    │   ├── chapters.js  TOC page
    │   └── reader.js    reader page
    ├── data/chapters.json   <-- the list every page reads from
    └── images/
```

## Merging this into your existing repo

1. Copy everything EXCEPT `chapters/` into your repo root, overwriting the old
   `index.html`, `style.css`, `script.js`, `chapters.json`. Your `chapters/`
   folder stays as it is.
2. Delete the old root-level `style.css`, `script.js`, and `chapters.json` if
   they're still there. The new versions live under `assets/`.
3. Open `assets/data/chapters.json` and list every chapter. `slug` is the file
   name in `chapters/` without `.html`. Home shows the LAST entry as "latest".

You do NOT need to edit the 41 chapter files. The reader fetches each one and
pulls out its main content (it looks for `#chapter-content`, then `<article>`,
then `<main>`, then falls back to `<body>`), so both full-page and fragment
chapter files work. If you want a chapter file to look styled when opened
directly, point its own `<link>` at `../assets/css/style.css`.

## Things that will bite you (read this)

- **Relative paths only.** Every path in these files is relative (`assets/...`,
  `chapters/...`, no leading `/`). If this is a project page
  (`you.github.io/engineers-root-of-exile/`), leading-slash paths break. Keep
  them relative.
- **Test over a server, not by double-clicking.** Chapters load via `fetch()`,
  which the `file://` protocol blocks. Run `python -m http.server 8000` in the
  repo folder, then open `http://localhost:8000`. On GitHub Pages it's HTTP, so
  it just works.
- **All-chapters mode + your TTS:** `read.html?view=all` fetches every chapter
  and injects it into one page. Your TTS must read the *rendered* page (the DOM
  after JavaScript runs), which browser-based readers do. If your TTS reads raw
  HTML source instead, it won't see the injected text and you'll need a
  pre-built combined file instead. Confirm this before relying on it.
- **Your numbers don't currently match.** The home mock said "Chapter 50", the
  TOC said "22 chapters", the folder has 41 files. Whatever is in
  `chapters.json` is what renders. Keep it in sync with `chapters/`.

## Pagination labels

The TOC lists chapters ascending (1, 2, 3 ...), 10 per page. "← Newer" goes to a
lower page number, "Older →" to a higher one, matching your mock. If you'd
rather list newest-first, flip the sort in `chapters.js` (`applyFilter`) or say
so and I'll change it.

## Search

On `chapters.html`: type a title fragment or a number. "50", "ch 50", and
"chapter 50" all work; partial numbers ("5" surfaces 5, 15, 50). It filters the
full list and re-paginates, and syncs to the URL (`?q=...&page=...`).
