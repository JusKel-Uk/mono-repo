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

Static site — **no build step**. Publish directory is this folder (`api/documentation`).

### Netlify CLI (recommended)

**One-time setup** (requires browser login):

```bash
brew install netlify-cli
# or: npm install -g netlify-cli

cd api/documentation
netlify login
netlify link          # select existing site: juskel
```

**Deploy:**

```bash
cd api/documentation
./deploy.sh           # preview URL
./deploy.sh --prod    # production
```

Or directly:

```bash
netlify deploy --dir .
netlify deploy --prod --dir .
```

### Netlify UI (Git-connected)

1. [Netlify dashboard](https://app.netlify.com) → site **juskel** → Project configuration
2. **Build & deploy** → set **Base directory** to `api/documentation`
3. **Build command:** *(empty)*
4. **Publish directory:** `.`
5. Connect GitHub for auto-deploy on push (optional)

### Drag and drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire `api/documentation/` folder onto the page
3. Your site is live immediately

The folder must contain `index.html` at its root.

`netlify.toml` in this folder configures headers and publish settings.

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
