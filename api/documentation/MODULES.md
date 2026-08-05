# Adding a New Module

This guide explains how to add a new documentation module to the JusKel Technology docs site.

## Steps

### 1. Copy the template

```bash
cp -r modules/_template modules/your-module-name
```

Use **kebab-case** for the folder name (e.g. `onboarding`, `funding-match`).

### 2. Replace placeholders

In every HTML file under your new module folder, replace:

| Placeholder | Example |
|-------------|---------|
| `{{MODULE_TITLE}}` | `Onboarding` |
| `{{MODULE_SLUG}}` | `onboarding` |
| `{{MODULE_DESCRIPTION}}` | `SME onboarding and profile setup flows.` |

### 3. Remove unused pages

Delete any optional page files you do not need:

- `schematics.html`
- `flow.html`
- `ideations.html`
- `implementation.html`

Then remove the corresponding links from the `module-subnav` on every remaining page in that module.

### 4. Register the module

Add a card to:

- [`index.html`](index.html) — home page module grid
- [`modules/index.html`](modules/index.html) — modules table

Follow the existing Sign-in module as a reference.

### 5. Update status pills

Use one of these status classes on module pages:

- `status-pill--planned`
- `status-pill--in-progress`
- `status-pill--implemented`

## Diagram components

Schematics use the shared diagram library in [`assets/js/diagrams.js`](assets/js/diagrams.js) and [`assets/css/diagrams.css`](assets/css/diagrams.css).

**HTML flow** — declare nodes as JSON on `data-jk-flow`:

```html
<div class="diagram-flow" data-jk-flow='[
  {"type":"circle","role":"client","label":"User","sub":"Actor"},
  {"type":"rect","role":"api","label":"Service"}
]'></div>
```

**Legend** — `data-jk-legend` with role keys matching the palette.

**Persona tree** — `data-jk-persona-tree` with a root node and `children` array.

**SVG presets** — `data-jk-svg="platform-architecture"` | `mvp-data-flow` | `signin-component-tree`, or call `JKDiagram.renderFlow()` / `JKDiagram.renderGroupGrid()` from a script block.

**Semantic roles (colour-coded):** `client`, `frontend`, `api`, `data`, `decision`, `storage`, `ai`, `external`, `platform`, `module`, `later`.

**Shape types:** `rect`, `square`, `circle`, `diamond`, `cylinder`.

## Page types

| File | Required | Purpose |
|------|----------|---------|
| `index.html` | Yes | Module overview and navigation |
| `schematics.html` | No | Architecture diagrams |
| `flow.html` | No | Process and request flows |
| `ideations.html` | No | Ideas, decisions, open questions |
| `implementation.html` | No | Endpoints, DTOs, build status |

## Asset paths

All module pages use relative paths to shared assets:

```html
<link rel="stylesheet" href="../../assets/css/main.css">
<script src="../../assets/js/main.js" defer></script>
```

## Body attributes

Set these on `<body>` for navigation highlighting:

```html
<body data-module="your-module-name" data-page="overview" data-site-section="modules">
```

Valid `data-page` values: `overview`, `schematics`, `flow`, `ideations`, `implementation`.
