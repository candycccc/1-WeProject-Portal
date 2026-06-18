# WeProject — Customer Portal Settings
## Implementation Spec

**Product:** WeQuote (admin platform) → Customer Portal → Portal Settings  
**Prototype file:** `portal-settings-demo.html`  
**Preview portal file:** `portal-preview.html`  
**Last updated:** June 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Tokens](#2-design-tokens)
3. [Layout Structure](#3-layout-structure)
4. [Data Model](#4-data-model)
5. [Permission Logic](#5-permission-logic)
6. [Tab 1 — Access & Permissions (Baseline Matrix)](#6-tab-1--access--permissions-baseline-matrix)
7. [Tab 2 — User Directory & Projects](#7-tab-2--user-directory--projects)
8. [Project Detail View](#8-project-detail-view)
9. [Edit Panel (Side Drawer)](#9-edit-panel-side-drawer)
10. [Preview Portal](#10-preview-portal)
11. [Navigation & Routing](#11-navigation--routing)
12. [Component Reference](#12-component-reference)

---

## 1. Overview

Portal Settings controls what customers can see inside the WeProject customer portal. It lives inside the WeQuote admin platform under **Customer Portal → Portal Settings**.

There are two tabs:

- **Access & Permissions Settings** — Generic Baseline Role Permissions matrix. Sets global defaults for all projects.
- **User Directory & Projects Settings** — Manage portal users and per-project permission overrides.

The product uses a two-level permission architecture:

```
Baseline Role Matrix (BL)
  └─ per-stakeholder overrides (ov)
       └─ effective permission shown to customer
```

---

## 2. Design Tokens

```css
:root {
  --brand:        #FF4655;
  --brand-hover:  #E63B49;
  --brand-tint:   #FFE7E9;
  --ink:          #1F2F3E;   /* topbar, active nav bg */
  --steel:        #A8B6C9;   /* nav icons, muted */
  --grey-100:     #F9F9F9;
  --grey-200:     #F3F4F6;
  --grey-300:     #EDF0F3;   /* page background */
  --grey-400:     #E5E5E5;   /* borders */
  --grey-600:     #D0D0D0;   /* input borders */
  --grey-800:     #777;
  --grey-900:     #595959;
  --fg-1:         #1F2F3E;   /* primary text */
  --fg-3:         #777;      /* secondary text */
  --fg-4:         #B2B2B2;   /* placeholder */
  --success:      #58AE94;
  --success-2:    #1EB395;   /* full access icon colour */
  --info:         #2783B3;   /* info blue, links */
  --warn:         #E8A33D;   /* scope only / amber */
  --shadow-card:  0 1px 2px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04);
  --shadow-pop:   0 4px 12px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
  --font:         'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  --header-h:     72px;
  --sidebar-w:    243px;
  --row-h:        44px;
  --radius-sm:    4px;
  --radius-md:    5px;
  --transition:   150ms ease-out;
}
```

**Font:** Mulish (weights 400 500 600 700 800) via Google Fonts  
**Icons:** Bootstrap Icons v1.11.3 via CDN

**Permission icon colours:**

| Permission | Icon | Colour |
|-----------|------|--------|
| `full` | `bi-check-circle-fill` | `#1EB395` |
| `scope` | `bi-eye-fill` | `#E8A33D` |
| `none` | `bi-x-circle-fill` | `#7B828C` |

**Status pill colours:**

| Status | Background | Text |
|--------|-----------|------|
| `active` | `#2783B3` | `#fff` |
| `cancelled` | `#8F4399` | `#fff` |

---

## 3. Layout Structure

```
.app (display:flex, height:100vh)
├── .sidebar (width:243px, white, overflow-y:auto)
└── .main (flex:1, flex-direction:column)
    ├── .topbar (height:72px, background:var(--ink))
    └── .content-area (flex:1, overflow-y:auto)
          renders one of:
          ├── renderSettings()   → VIEW='settings'
          ├── renderProject()    → VIEW='project'
          └── renderPreview()    → VIEW='preview'

Fixed overlays (outside .app):
├── .overlay (dim backdrop, z-index:99)
└── .panel (side drawer 500px, z-index:100)
```

### Topbar

Dark (`var(--ink)`) header bar. Left: brand logo box + company wordmark. Right: help, notifications (with red dot badge), settings icons, greeting, avatar.

### Sidebar

White left panel, `243px`. Groups of nav items with section labels. Two items under **CUSTOMER PORTAL**:
- **Portal Settings** (`bi-shield-lock`) — navigates to settings view
- **Preview Portal** (`bi-eye`) — navigates to preview view

Active nav item: `background: var(--ink); color: #fff`.

---

## 4. Data Model

### Roles

Six roles, index order is fixed (used as array index into BL):

```js
const ROLES = [
  'Home Owner',       // index 0
  'Builder / MC',     // index 1
  'Electrician',      // index 2
  'A/C',              // index 3
  'Quantity Surveyor',// index 4
  'Builder PM',       // index 5
];
```

### Sections

Eight sections in display order:

```js
const SECTIONS = [
  { id: 'quotes',      name: 'Quotes',       desc: 'Line items, totals, and revision history.',                amt: true  },
  { id: 'variations',  name: 'Variations',   desc: 'Extra work created from an accepted quote.',              amt: true  },
  { id: 'sales_order', name: 'Sales Order',  desc: 'Add-on orders for minor items.',                          amt: true  },
  { id: 'invoices',    name: 'Invoices',     desc: 'Issued invoices, outstanding payments, payment history.', amt: true  },
  { id: 'progress',    name: 'Progress',     desc: 'Plans, schematics, and room-level drawings.',             amt: false },
  { id: 'documents',   name: 'Documents',    desc: 'Plans, schematics, and room-level drawings.',             amt: false },
  { id: 'warranty',    name: 'Warranty',     desc: 'Warranty terms, certificates, and claims.',               amt: false },
  { id: 'activity',    name: 'Activity Feed',desc: 'Updates — who uploaded, approved, or commented.',         amt: false },
];
```

`amt: true` = financial section. On these, `scope` permission hides monetary amounts from the customer (section still visible).

### Baseline Matrix (BL)

```js
// BL[sectionId][roleIndex] → 'full' | 'scope' | 'none'
const BL = {
  quotes:      ['full', 'scope', 'scope', 'scope', 'full', 'full'],
  variations:  ['full', 'full',  'full',  'full',  'full', 'full'],
  sales_order: ['full', 'full',  'full',  'full',  'full', 'full'],
  invoices:    ['full', 'full',  'none',  'none',  'full', 'none'],
  progress:    ['full', 'full',  'full',  'full',  'full', 'full'],
  documents:   ['full', 'none',  'full',  'none',  'none', 'full'],
  warranty:    ['full', 'full',  'full',  'full',  'full', 'full'],
  activity:    ['full', 'full',  'full',  'full',  'full', 'full'],
};
const BL_ORIG = JSON.parse(JSON.stringify(BL)); // deep copy for reset
```

Global setting, shared across all projects. **Manual save** — changes only persist when the user clicks Save Changes.

### Stakeholder

One entry per customer per project:

```ts
type Stakeholder = {
  name:    string                           // display name
  email:   string
  role:    string                           // one of the 6 role names
  ov:      Record<string, PermLevel> | null // per-section overrides; null = using role defaults
  changed: string                           // display string e.g. "3 min ago"
  by:      string                           // last changed by (user name)
  active:  string                           // last active display string
}
```

### Customers

User directory entries (separate from stakeholders):

```ts
type Customer = {
  name:     string
  email:    string
  projects: number   // count of projects assigned to
  seen:     string   // last seen display string
}
```

### Projects

```ts
type Project = {
  num:      string   // e.g. '#24507'
  name:     string
  customer: string
  status:   'active' | 'cancelled'
  n:        number   // stakeholder count
  by:       string   // last changed by
  date:     string   // last changed date
}
```

---

## 5. Permission Logic

### Permission Levels

| Value | Label | Meaning |
|-------|-------|---------|
| `full` | Full Access | Section fully visible including amounts |
| `scope` | Scope Only | Section visible but monetary amounts hidden (financial sections only) |
| `none` | No Access | Section hidden entirely |

`scope` only has practical effect on `amt: true` sections. On non-financial sections, treat `scope` as equivalent to `full`.

### Effective Permission

```ts
function effectivePerm(s: Stakeholder, sectionId: string): PermLevel {
  if (s.ov && s.ov[sectionId] !== undefined) return s.ov[sectionId];
  const r = ROLES.indexOf(s.role);
  return r >= 0 ? BL[sectionId][r] : 'full';
}
```

### Override Count

Only counts overrides that **differ** from the current baseline. If a role changes and the baseline now matches a stored `ov` value, it no longer counts as an override.

```ts
function ovCount(s: Stakeholder): number {
  if (!s.ov) return 0;
  const r = ROLES.indexOf(s.role);
  return Object.keys(s.ov).filter(sid => {
    const baseline = r >= 0 ? BL[sid][r] : 'full';
    return s.ov![sid] !== baseline;
  }).length;
}
```

### Role Access Summary

```ts
function summary(s: Stakeholder): { full: number; scope: number; none: number } {
  const c = { full: 0, scope: 0, none: 0 };
  SECTIONS.forEach(sec => c[effectivePerm(s, sec.id)]++);
  return c;
}
```

Summary label logic:

```
c.full === 8           → "Full Access to 8 Sections"
c.none === 8           → "No Access"
c.scope === 8          → "Scope Access Only"
c.full >= 6            → "Mostly Full Access"
c.scope >= 6           → "Mostly Scope Access"
default                → "Mixed Access"
```

Summary chips below label (e.g. `5 Full Access · 2 Scope Only · 1 No Access`):
- Omit any count that is 0
- Separated by grey dot dividers (`.sum-dot`: 6px circle, `#d9d9d9`)

---

## 6. Tab 1 — Access & Permissions (Baseline Matrix)

### Card Structure

```
.card
  .matrix-meta
    ├── title: "Generic Baseline Role Permissions"
    ├── desc: "Safe defaults — every project inherits these."
    └── .matrix-legend (Full access · Scope only · No access · Reset All btn)
  .matrix-hint  (hint text, grey-100 bg)
  .scope-banner (amber banner explaining scope = amounts hidden)
  <table class="mtable">
    <thead>  Section | Home Owner | Builder/MC | Electrician | A/C | Qty Surveyor | Builder PM
    <tbody>  one row per section
  .matrix-footer
```

### Matrix Table Rows

Each row: section name + description in left column, one custom dropdown per role column.

Financial sections (`.amt-flag £`): show `£` flag next to section name.  
When a cell is `scope` on a financial section: show `Amount hidden` note below dropdown.

### Permission Dropdown (Matrix) — `.pdd-*`

Custom button + floating menu pattern (NOT a native `<select>`).

```html
<div class="perm-dd">
  <button class="pdd-trigger pdd-{perm}" onclick="togglePermDD(event, sid, roleIndex)">
    <i class="bi {icon} pdd-icon-{perm}"></i>
    <span class="pdd-label">{label}</span>
    <i class="bi bi-chevron-down pdd-chevron"></i>
  </button>
  <div class="pdd-menu" id="ddm-{sid}-{roleIndex}">
    <!-- three .pdd-opt items -->
  </div>
</div>
```

States: `.pdd-full` / `.pdd-scope` / `.pdd-none` on the trigger.  
Open state: `.pdd-menu.open` (display:block).  
Only one dropdown open at a time — clicking anywhere closes all.

### Save Behaviour

**Manual save.** Save Changes button is `disabled` (opacity 0.45) when `unsaved=false`. Enabled the moment any cell changes (`unsaved=true`).

Cancel → `resetBL()` (restore BL from BL_ORIG, set `unsaved=false`).  
Save → flash button green ("SAVED"), then re-render after 1.4s.

---

## 7. Tab 2 — User Directory & Projects

### Customers Portal User Directory Card

Header: title + "ADD USER" button (brand red, `bi-plus-lg`).

Table columns:

| Column | Width | Notes |
|--------|-------|-------|
| Customer | 280px | Avatar (32px) + name (14px 700) |
| Email | — | `var(--fg-3)`, 13px 500 |
| Assigned To | 180px, right-align | count + "project(s)", 13px 700 |
| Last Seen | 160px, right-align | 13px, `var(--fg-3)`, 500 |

### Projects Card

Header: title + description.

Table columns:

| Column | Width | Notes |
|--------|-------|-------|
| No. | 60px | `var(--fg-3)`, 14px 700 |
| Description | 200px | `var(--fg-1)`, 14px 700 |
| Customer | 150px | `var(--fg-1)`, 14px 700 |
| Status | 100px | `.pill` — see pill spec below |
| Stakeholder(s) | 160px, center | count as underlined link → `gotoProject()` |
| Last Changed | 160px | by name (14px 700) + date (12px 600 `var(--fg-3)`) |
| Action | — | "Edit" + `bi-pencil` → `gotoProject()` |

**Status pills** (`.pill`):

```css
.pill {
  display: inline-flex; align-items: center; justify-content: center;
  width: 75px; padding: 3px 8px; border-radius: var(--radius-sm);
  font-weight: 700; font-size: 11px; line-height: 1; white-space: nowrap;
}
.pill-active    { background: #2783B3; color: #fff; }
.pill-cancelled { background: #8F4399; color: #fff; }
```

**Table rows** (`.proj-list-tbl`): height 64px, `vertical-align: middle`.

---

## 8. Project Detail View

Navigated to via `gotoProject()`. Shows stakeholders for a single project (`VIEW='project'`).

### Header

Back breadcrumb: `← Portal Settings > Seacon Tower, 97`  
Right side: "Last Changed 3 min ago / By Lee Roche" + Cancel + Save Changes buttons.

### Stakeholder Table (`.proj-tbl`)

Table headers: not uppercase, `font-size:12px`, `color: var(--fg-3)`, no background.  
Table cells: `padding: 18px 10px 20px`, `height: auto`, `vertical-align: top`.

Columns:

| Column | Notes |
|--------|-------|
| Customer | Avatar (28px) + name (14px 700) + email (12px `var(--fg-3)`) |
| Role Template | Custom overlay dropdown (see below) |
| Role Access Summary | Summary label + chips |
| Permission overrides? | Override count or "Using role defaults" |
| Last Changed | "Last Changed {time}" + "By {name}" |
| Last Active | Time string |
| Action | "Edit" + `bi-pencil` → `openPanel(idx)` |

### Role Template Dropdown

Overlaid custom-styled select. Shows current role with chevron. The native `<select>` sits absolutely positioned over a visual div (opacity:0), so the visual matches the design while using a native select for functionality.

```html
<div class="role-tpl-wrap">
  <div class="role-tpl-vis">
    <span>{role}</span>
    <i class="bi bi-chevron-down"></i>
  </div>
  <select class="role-tpl-sel" onchange="changeRole(idx, this.value)">
    {options}
  </select>
</div>
```

CSS:
```css
.role-tpl-wrap { position: relative; display: inline-block; width: 138px; }
.role-tpl-vis  { pointer-events: none; /* visual only */ }
.role-tpl-sel  { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
```

### Permission Overrides Column

```
has overrides:
  bi-check-circle-fill (#1eb395) + "{n} custom override(s)" (underlined, opens panel)

no overrides:
  bi-x-circle-fill (#7b828c) + "Using role defaults" (no underline, not clickable)
```

---

## 9. Edit Panel (Side Drawer)

500px wide panel, slides in from the right. Fixed position, `z-index:100`. Overlay backdrop at `z-index:99`.

### Panel State

```js
let panelIdx     = null;   // index into STAKE[] currently open; null = closed
let panelOv      = {};     // working copy of overrides (not yet saved)
let panelOrigRole = null;  // role at time of panel open (for Cancel restore)
```

### Opening (`openPanel(idx)`)

```js
function openPanel(idx) {
  panelIdx = idx;
  panelOrigRole = STAKE[idx].role;             // snapshot for cancel
  panelOv = STAKE[idx].ov ? { ...STAKE[idx].ov } : {};  // working copy
  document.getElementById('panel-inner').innerHTML = renderPanel(idx);
  document.getElementById('panel').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}
```

### Panel Header

Avatar (34px) + name (14px 700) + email (11px `var(--fg-3)`) on the left.  
Plain `×` close button on the right — NOT circular. `background:none; border:none; font-size:22px`.

### Role & Template Section (two-column grid)

Left column — **Current Role**:
- Label: "Current Role" (11px 800 uppercase)
- Native `<select class="role-sel">` with all 6 roles
- `onchange` → `changeRole(idx, value)`

Right column — **Using Role Template**:
- Label: "Using Role Template"
- Current role name displayed as text (14px 700)
- Underlined link: "View role template" → *(see View Role Template below)*

### `changeRole(idx, val)`

```js
function changeRole(idx, val) {
  STAKE[idx].role = val;
  if (panelIdx === idx) panelOv = {};  // wipe old overrides: they were relative to the old baseline
  render();
  if (panelIdx === idx) document.getElementById('panel-inner').innerHTML = renderPanel(idx);
}
```

**Critical:** old overrides must be cleared when role changes inside the panel. The old `ov` entries are meaningless against a different role's baseline.

### Section Permission Rows

For each section:

```
[Section Name  £?]

[bordered dropdown ▾]                    [Reset]
Role Default: Full Access        Overridden  ← only shown when overridden
```

**Computing the displayed permission:**

```js
const base = BL[sec.id][ROLES.indexOf(s.role)];

// Only use saved overrides (s.ov) if the role hasn't changed since panel opened.
// If role changed, old ov[] was relative to the old baseline — ignore it.
const cur =
  panelOv[sec.id] !== undefined
    ? panelOv[sec.id]
    : (s.role === panelOrigRole && s.ov && s.ov[sec.id] !== undefined
        ? s.ov[sec.id]
        : base);

const isOverridden = cur !== base;
```

`isOverridden` controls display of "Overridden" tag (brand red `#FF4655`, 11px 700) and the "Role Default: …" text below.

**`scope` on financial section:** show `"Amount hidden from customer"` (10px 600 `#D97706`) below the row.

### Panel Permission Dropdown (`.ppdd-*`)

Bordered variant of the permission dropdown — used only inside the panel.

```html
<div class="ppdd-wrap">
  <button class="ppdd-trigger" onclick="togglePanelDD(event, sid)">
    <div class="ppdd-left">
      <i class="bi {icon} pdd-icon-{perm}"></i>
      <span>{label}</span>
    </div>
    <i class="bi bi-chevron-down ppdd-chevron"></i>
  </button>
  <div class="ppdd-menu" id="ppdd-{sid}">
    <!-- three .ppdd-opt items -->
  </div>
</div>
```

```css
.ppdd-trigger {
  height: 34px; min-width: 148px;
  border: 1px solid var(--grey-600); background: #fff;
  border-radius: 4px; font-size: 13px; font-weight: 600;
}
.ppdd-trigger:hover { border-color: var(--grey-800); }
```

### Per-Row Reset

```js
function resetOne(sid, base) {
  delete panelOv[sid];
  document.getElementById('panel-inner').innerHTML = renderPanel(panelIdx);
}
```

### Panel Footer

```
[Reset All (brand red, bi-arrow-counterclockwise)]   [Cancel]  [SAVE CHANGES]
```

Reset All: `panelOv = {}`, re-render panel.  
Cancel and Save Changes: 12px 18px padding.

### Cancel (`closePanel(saved=false)`)

```js
function closePanel(saved = false) {
  if (!saved && panelIdx !== null && panelOrigRole !== null) {
    STAKE[panelIdx].role = panelOrigRole;  // restore role changed during panel session
  }
  document.getElementById('panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  panelIdx = null; panelOv = {}; panelOrigRole = null;
  render(); // reflect role restore in the main table
}
```

### Save (`savePanel(idx)`)

```js
function savePanel(idx) {
  const s = STAKE[idx];
  const r = ROLES.indexOf(s.role);
  const newOv = {};
  // Only persist overrides that differ from the new role's baseline
  for (const sid in panelOv) {
    const baseline = r >= 0 ? BL[sid][r] : 'full';
    if (panelOv[sid] !== baseline) newOv[sid] = panelOv[sid];
  }
  s.ov = Object.keys(newOv).length ? newOv : null;
  s.changed = 'just now';
  s.by = currentUser;
  closePanel(true); // saved=true: keep new role, don't restore
}
```

### View Role Template

*(Spec'd — not yet implemented in prototype)*

Triggered by "View role template" link in the Role & Template section.

Shows the Generic Baseline Role Permissions matrix as a **read-only modal or fly-out**:
- All cells replaced with static permission badges (icon + label, no chevron, no click)
- The column for the current stakeholder's role is highlighted, OR the view is scoped to just that role's column
- No save/cancel controls
- Close button dismisses and returns to the panel

---

## 10. Preview Portal

### Entering Preview

```js
function gotoPreview() {
  const roleIdx = ROLES.indexOf(previewRole); // default: 'Home Owner'
  const perms = {};
  SECTIONS.forEach(sec => { perms[sec.id] = BL[sec.id][roleIdx]; });
  localStorage.setItem('wqPortalPreview', JSON.stringify(perms));
  VIEW = 'preview';
  render();
}
```

Writes current Home Owner baseline permissions to `localStorage` key `wqPortalPreview`, then switches to preview view.

### Preview Bar

Dark bar (`var(--ink)`) with `border-bottom: 3px solid var(--brand)`:

```
PREVIEW PORTAL  [HOME OWNER]  [Quotes: Full] [Variations: Full] ... [EXIT PREVIEW ×]
```

Permission chips: green/amber/grey tinted backgrounds per permission level.  
Exit Preview button: bordered ghost style, `text-transform:uppercase`.

### Preview iframe

```html
<iframe class="preview-iframe" src="portal-preview.html" id="preview-iframe"></iframe>
```

`portal-preview.html` is a full self-contained copy of the WeProject customer portal with:
- All font paths rewritten to absolute `file:///` paths
- All image paths rewritten to absolute `file:///` paths
- `script.js` inlined (not linked)
- HTML body split at the original `<script src="script.js">` tag and reassembled

The reason for this split-and-reassemble is that critical overlay elements (`brand-panel`, `dvp`, `screen-panel`) exist **after** the original script tag in `WeProject_Desktop.html`. Inlining script and preserving post-script HTML ensures all overlays are present.

### Permission Filter (injected at end of `portal-preview.html`)

```js
(function applyPortalPreviewPerms() {
  const raw = localStorage.getItem('wqPortalPreview');
  if (!raw) return;
  const perms = JSON.parse(raw);

  // SCREEN_MAP: maps section IDs to portal screen names
  const SCREEN_MAP = {
    quotes:      ['s-quotes'],
    variations:  ['s-variations'],
    sales_order: ['s-purchase-order'],
    invoices:    ['s-invoices'],
    progress:    ['s-progress'],
    documents:   ['s-documents'],
    warranty:    ['s-warranty'],
    activity:    [],
  };

  const hiddenScreens = new Set();
  const scopeScreens  = new Set();

  for (const [sid, perm] of Object.entries(perms)) {
    const screens = SCREEN_MAP[sid] || [];
    if (perm === 'none')  screens.forEach(s => hiddenScreens.add(s));
    if (perm === 'scope') screens.forEach(s => scopeScreens.add(s));
  }

  function applyOnce() {
    // Hide nav cards and nav items for 'none' screens
    // Add amber banner to 'scope' screens (amounts hidden)
    // Patch window.go to block navigation to hidden screens
  }

  applyOnce();
  // Proto-toolbar is NOT hidden — Brand panel must remain functional
})();
```

**Important:** The proto-toolbar (which contains the Brand panel button) must NOT be hidden in preview mode. The Brand panel (accent colour, font, dark/light mode) is a live feature of the portal and must remain accessible.

### localStorage Keys

| Key | Written by | Read by | Purpose |
|-----|-----------|---------|---------|
| `wqPortalPreview` | admin demo (`gotoPreview`) | portal filter script | Pass permissions to preview iframe |
| `wq_screen_desktop` | portal `script.js` | portal `script.js` | Persist current screen within portal |

---

## 11. Navigation & Routing

State variable: `let VIEW = 'settings'`  
Sub-state: `let TAB = 'access'`

| Function | Effect |
|---------|--------|
| `gotoSettings(tab)` | `VIEW='settings'`, `TAB=tab`, close panel, `render()` |
| `gotoProject()` | `VIEW='project'`, `render()` |
| `switchTab(t)` | `TAB=t`, `render()` |
| `gotoPreview()` | Write perms to localStorage, `VIEW='preview'`, `render()` |

`render()` top-level function:

```js
function render() {
  document.getElementById('sidebar').innerHTML = renderSidebar();
  const body = VIEW === 'settings' ? renderSettings()
             : VIEW === 'project'  ? renderProject()
             : renderPreview();
  document.getElementById('content-area').innerHTML = body;

  const ca = document.getElementById('content-area');
  if (VIEW === 'preview') {
    // iframe must fill remaining height — no scroll
    ca.style.overflow = 'hidden';
    ca.style.display = 'flex';
    ca.style.flexDirection = 'column';
  } else {
    ca.style.overflow = '';
    ca.style.display = '';
    ca.style.flexDirection = '';
  }
}
```

---

## 12. Component Reference

### Helper Functions

```js
// Label for permission value
const PLbl = p => p === 'full' ? 'Full Access' : p === 'scope' ? 'Scope Only' : 'No Access';

// Bootstrap icon class for permission value
const PIcn = p => p === 'full' ? 'bi-check-circle-fill' : p === 'scope' ? 'bi-eye-fill' : 'bi-x-circle-fill';

// Role index
const ri = role => ROLES.indexOf(role);

// Avatar div
function av(name, sz = 28) {
  const c = AV_COLORS[name] || '#1F2F3E';
  const ini = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<div class="av" style="width:${sz}px;height:${sz}px;background:${c};font-size:${Math.round(sz * .36)}px">${ini}</div>`;
}
```

### Dropdown Close Behaviour

All permission dropdowns (both matrix `.pdd-menu` and panel `.ppdd-menu`) are closed by:

```js
function closeAllPermDDs() {
  document.querySelectorAll('.pdd-menu.open, .ppdd-menu.open').forEach(m => m.classList.remove('open'));
}
document.addEventListener('click', closeAllPermDDs); // global click closes all
```

Individual dropdowns call `e.stopPropagation()` on their trigger to prevent the global handler firing immediately.

### CSS Class Naming Conventions

| Prefix | Context |
|--------|---------|
| `.pdd-*` | Permission dropdown in the Baseline Matrix |
| `.ppdd-*` | Permission dropdown in the Edit Panel (bordered variant) |
| `.proj-tbl` | Project detail stakeholder table |
| `.proj-list-tbl` | Projects card in Directory tab |
| `.dir-tbl` | Customer directory table |
| `.mtable` | Baseline matrix table |
| `.wq-table` | Shared general table styles |

---

## Notes

- No emoji anywhere in the product.
- Product naming: **WeProject** (customer portal) · **WeQuote** (admin platform / company name).
- `scope` on a non-financial section is treated as `full` in the customer portal — only amount display is affected on financial sections.
- Never edit files in the Desktop portal folder (`WeProject_Desktop.html`, `style.css`, `script.js`). These are the source of truth read-only files.
- The prototype runs entirely in-browser with no backend. All data is in-memory JS arrays.
