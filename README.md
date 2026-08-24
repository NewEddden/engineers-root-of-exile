# The Engineer's Root of Exile, site

Static multi-page site for the web serial. Plain HTML, one shared stylesheet, a little JavaScript. No build step, no framework. Hosted on GitHub Pages.

## Pages

Each page is its own HTML file at the project root:

- `index.html`, home / landing (this was `Home.html`, see "Deploying" for why the rename matters)
- `chapters.html`, the reader: chapter text, search, jump-to dropdown, prev/next
- `characters.html`, `magic.html`, `world.html`, `glossary.html`, `about.html`, lore and info pages

Shared assets live under `assets/`:

```
index.html
chapters.html
characters.html
magic.html
world.html
glossary.html
about.html
assets/
  css/
    style.css        all styling; colors and fonts live in the :root block at the top
  js/
    home.js          fills the "Latest chapter" card on the home page
    (reader script)  loads and paginates chapters on chapters.html
  Images/
    Cover-Photo.jpg  cover shown on the home page
```

Heads up: the chapter data file and the `chapters.html` reader script were not among the files I had when writing this, so the two lines marked (confirm) below are inferred from the CSS and the site's behavior. Check them against your real files before trusting them.

## Adding a chapter

Chapter body files are HTML fragments. Based on the CSS, each one is shaped like this:

```html
<h2 class="chapter-name">Chapter 51: Your Title</h2>
<p>First paragraph.</p>
<p>Second paragraph.</p>
```

Wrap every paragraph in its own `<p>`. The first paragraph gets a drop cap automatically.

(confirm) A manifest file feeds the chapter list, the dropdown, prev/next order, and the "Latest chapter" card. In the earlier version of this project that manifest was `chapters.json`, one entry per chapter with `id`, `title`, and `file`. Open your current manifest and match whatever format it actually uses. The routine is: drop the fragment file in its folder, add one entry to the manifest, done. Order in the manifest is the reading order.

## Testing locally

Double-clicking the HTML will not work. The scripts pull chapter data with `fetch()`, and browsers block that over `file://`. Run a local server from the project folder instead:

```
python -m http.server 8000
```

Then open `http://localhost:8000`. VS Code's Live Server extension also works. This restriction disappears once the site is live on Pages, since that is served over https.

## Deploying to GitHub Pages

1. Push the whole folder to a GitHub repo, keeping `assets/` and any chapter folders intact.
2. In the repo, go to Settings > Pages.
3. Under "Build and deployment," set Source to "Deploy from a branch," choose your branch (usually `main`) and folder `/ (root)`.
4. Save. Your URL is usually `https://yourusername.github.io/repo-name/`, live within a minute or two.

Three deploy gotchas, in order of how badly they bite:

1. Home page filename. Pages serves `index.html` by default at a directory. If your home page is named `Home.html`, the bare site URL returns a 404. That is why the home file here is `index.html`. If any of the other pages still link to `Home.html`, those links break, so replace `href="Home.html"` with `href="index.html"` in every file.
2. Leading-slash paths. If your URL has a repo name in it (`.../repo-name/`), any asset path that starts with `/` resolves to the domain root, not your repo folder, and 404s. Keep asset paths relative. For this reason the cover path in `style.css` was changed from `/assets/Images/...` to `../Images/...`.
3. Case sensitivity. Pages runs on Linux, which is case-sensitive. `Images/Cover-Photo.jpg` has to match the real folder and file names exactly, capitals included. This never trips you locally on Windows or macOS, only after deploy.

Any time you push a new chapter fragment plus its manifest entry, the live site updates on its own.

## Customizing

- Site title: the `<h1 class="site-title">` line in each page.
- Colors and fonts: the `:root` block at the top of `assets/css/style.css`.
- Cover image: replace `assets/Images/Cover-Photo.jpg`, or change the path in the `.cover-placeholder` rule in `style.css`.
