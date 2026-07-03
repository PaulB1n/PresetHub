PresetHub is now structured as a small static documentation site.

## Content architecture

- `content/manifest.json` is the content entry point used by the website.
- `content/navigation.json` controls the documentation sidebar and search index.
- `content/sources.json` stores external source metadata.
- `content/site.json` stores shared documentation UI copy.
- `content/home.json` stores landing-page content.
- `content/guides/*.json` stores one guide, FAQ, or reference page per file.
- `content/presets/*.json` stores one shooting preset per file.
- `content/presets/defaults.json` stores shared preset defaults.

JavaScript files now contain application logic only:

- `docs.js` loads guide/preset JSON and renders `docs.html`.
- `assets/js/main.js` loads homepage JSON and renders `PresetHub.html`.

## Local development

Because the site dynamically loads JSON with `fetch`, open it through a local web server instead of double-clicking the HTML file.

Example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/PresetHub.html`.

## Adding content

To add a preset:

1. Create `content/presets/my-preset.json`.
2. Add its slug and path to `content/manifest.json`.
3. Add it to `content/navigation.json` if it should appear in the docs sidebar.

To add a guide:

1. Create `content/guides/my-guide.json`.
2. Add its slug and path to `content/manifest.json`.
3. Add it to `content/navigation.json`.
