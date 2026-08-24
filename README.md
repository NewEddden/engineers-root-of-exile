# Randillia reader

A single-page site for reading your novel chapter by chapter, with previous/next buttons and a dropdown to jump straight to any chapter. The chapter list lives in `chapters.json`, actual chapter text lives in separate files in `chapters/`.

## File structure

```
index.html          the page itself, don't need to edit this to add chapters
style.css            styling
script.js            loads chapters.json, handles prev/next/dropdown
chapters.json        ordered list of chapters (id, title, file path)
chapters/
  chapter-01.html
  chapter-02.html
  chapter-03.html
```

## Adding a new chapter

1. Create a new file in `chapters/`, e.g. `chapter-04.html`. Wrap each paragraph in its own `<p>` tag.
2. Add an entry to `chapters.json`:
```json
{
  "id": "chapter-04",
  "title": "Chapter 4: Your Title",
  "file": "chapters/chapter-04.html"
}
```
3. That's it, the dropdown and prev/next order both come from the order of this array.

## Testing locally

Opening `index.html` directly by double-clicking it will not work. The page fetches `chapters.json` and the chapter files with `fetch()`, and browsers block that over the `file://` protocol. You need a local server. From the project folder, if you have Python installed:

```
python -m http.server 8000
```

then visit `http://localhost:8000`. VS Code's Live Server extension works too. Once it's on GitHub Pages this stops being an issue, since it's served over https.

## Deploying to GitHub Pages

1. Create a new repository on GitHub and push these files to it (the whole folder, keeping the `chapters/` subfolder intact).
2. In the repo, go to Settings > Pages.
3. Under "Build and deployment," set Source to "Deploy from a branch," pick your default branch (usually `main`) and `/root`.
4. Save. GitHub gives you a URL, usually `https://yourusername.github.io/repo-name/`, live within a minute or two.

Any time you push a new chapter file plus its `chapters.json` entry, the live site updates automatically.

## Customizing

- Site title: edit the `<h1 class="site-title">` line in `index.html`.
- Colors and fonts: all in the `:root` block at the top of `style.css`.
- The two nav bars (top and bottom of each chapter) are separate elements in `index.html` sharing the same classes, so JS updates both together. Delete either one if you only want a single nav row.
