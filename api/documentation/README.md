# JusKel Technology Documentation Site

Static, modular technology documentation for the JusKel platform. Pure HTML, CSS, and JavaScript — no build step required.

## Local preview

Open `index.html` in a browser, or serve locally:

```bash
cd api/documentation
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Netlify deployment

### Drag and drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire `api/documentation/` folder onto the page
3. Your site is live immediately

The folder must contain `index.html` at its root.

### Repo-connected

If connecting this repository to Netlify, set the publish directory to `api/documentation`.

The included `netlify.toml` is configured for deploying this folder directly.

## Structure

```
documentation/
├── index.html              # Site hub
├── modules/
│   ├── index.html          # Module directory
│   ├── signin/             # Example module
│   └── _template/          # Copy to create new modules
├── assets/
│   ├── css/main.css
│   └── js/main.js
└── MODULES.md              # Guide for adding modules
```

See [MODULES.md](MODULES.md) for instructions on adding new modules.
