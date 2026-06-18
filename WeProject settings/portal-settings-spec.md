# Customer Portal Settings — Implementation Spec

## Overview

Portal Settings lives at **WeQuote (admin) → Customer Portal → Portal Settings**.  
It controls what customers can see in WeProject (the customer-facing portal).

Two tabs:
- **Access & Permissions Settings** — Generic Baseline Role Permissions matrix
- **User Directory & Projects Settings** — customer list + project list with per-project overrides

---

## Concepts

### Permission Levels

| Value | Label | Meaning |
|-------|-------|---------|
| `full` | Full Access | Section fully visible including amounts |
| `scope` | Scope Only | Section visible but **monetary amounts hidden** (financial sections only) |
| `none` | No Access | Section hidden entirely |

The `scope` level only has practical effect on financial sections (Quotes, Variations, Sales Order, Invoices). On non-financial sections, `scope` is equivalent to `full`.

### Sections

```ts
type Section = {
  id: string
  name: string
  desc: string
  amt: boolean   // true = financial section (amounts can be hidden)
}
```

Eight sections (in display order):

| id | name | amt |
|----|------|-----|
| `quotes` | Quotes | ✓ |
| `variations` | Variations | ✓ |
| `sales_order` | Sales Order | ✓ |
| `invoices` | Invoices | ✓ |
| `progress` | Progress | — |
| `documents` | Documents | — |
| `warranty` | Warranty | — |
| `activity` | Activity Feed | — |

### Roles

Six roles (column order matters — it is the array index used in BL):

```
0  Home Owner
1  Builder / MC
2  Electrician
3  A/C
4  Quantity Surveyor
5  Builder PM
```

---

## Data Model

### Generic Baseline Role Permissions (BL)

```ts
// BL[sectionId][roleIndex] → 'full' | 'scope' | 'none'
type BaselineMatrix = Record<string, PermLevel[]>  // length 6 per section
```

This is a global setting, shared across all projects. Saved per-company.

**Default values** (all roles, all sections start at `full` unless specified):

```
quotes:      ['full','scope','scope','scope','full','full']
variations:  ['full','full', 'full', 'full', 'full','full']
sales_order: ['full','full', 'full', 'full', 'full','full']
invoices:    ['full','full', 'none', 'none', 'full','none']
progress:    ['full','full', 'full', 'full', 'full','full']
documents:   ['full','none', 'full', 'none', 'none','full']
warranty:    ['full','full', 'full', 'full', 'full','full']
activity:    ['full','full', 'full', 'full', 'full','full']
```

### Stakeholder (per-project customer entry)

```ts
type Stakeholder = {
  name: string
  email: string
  role: string           // one of the 6 role names
  ov: Record<string, PermLevel> | null   // per-section overrides, null = using role defaults
  changed: string        // display string e.g. "3 min ago"
  by: string             // last changed by (user name)
  active: string         // last active display string
}
```

---

## Permission Resolution

### Effective Permission

```ts
function effectivePerm(stakeholder: Stakeholder, sectionId: string): PermLevel {
  // 1. Per-stakeholder override wins
  if (stakeholder.ov && stakeholder.ov[sectionId] !== undefined) {
    return stakeholder.ov[sectionId]
  }
  // 2. Fall back to baseline role
  const roleIndex = ROLES.indexOf(stakeholder.role)
  return roleIndex >= 0 ? BL[sectionId][roleIndex] : 'full'
}
```

### Override Count (for "X custom overrides" badge)

An override is only counted when the stored `ov` value **differs** from what the current baseline would give. If role changes and the baseline now matches the stored `ov` value, it is no longer an override.

```ts
function ovCount(stakeholder: Stakeholder): number {
  if (!stakeholder.ov) return 0
  const roleIndex = ROLES.indexOf(stakeholder.role)
  return Object.keys(stakeholder.ov).filter(sid => {
    const baseline = roleIndex >= 0 ? BL[sid][roleIndex] : 'full'
    return stakeholder.ov![sid] !== baseline
  }).length
}
```

### Role Access Summary

```ts
function summary(stakeholder: Stakeholder): { full: number; scope: number; none: number } {
  const c = { full: 0, scope: 0, none: 0 }
  SECTIONS.forEach(sec => c[effectivePerm(stakeholder, sec.id)]++)
  return c
}
```

Summary label logic (shown as bold heading above chips):

```
c.full === 8           → "Full Access to 8 Sections"
c.none === 8           → "No Access"
c.scope === 8          → "Scope Access Only"
c.full >= 6            → "Mostly Full Access"
c.scope >= 6           → "Mostly Scope Access"
default                → "Mixed Access"
```

Chips below label (e.g. `3 Full Access · 2 Scope Only · 1 No Access`) — omit any count that is 0. Separated by grey dot dividers.

---

## Tab 1 — Baseline Matrix

### Save Behaviour

**Manual save** — the Save Changes button is **disabled** (`.btn-primary[disabled]`) when there are no unsaved changes. It enables the moment any cell is changed. Cancel reverts all unsaved changes.

### Dropdown Cells

Each cell is a custom dropdown (not a `<select>`). Three options: Full Access, Scope Only, No Access.

On financial sections (`amt: true`), show a secondary note under any `scope` cell: `"Amount hidden"`.

---

## Tab 2 — User Directory & Projects

### User Directory Card

Columns: Customer (avatar + name) | Email | Assigned To (count) | Last Seen

### Projects Card

Columns: No. | Description | Customer | Status | Stakeholder(s) | Last Changed | Action (Edit)

**Status pills:**
- `active` → `#2783B3` (info blue), white text, 75px wide, centred
- `cancelled` → `#8F4399` (vivid violet), white text, 75px wide, centred

Clicking Edit or the stakeholder count → navigates to Project Detail view.

---

## Project Detail View

Shows stakeholders for a single project.

Table columns: Customer | Role Template | Role Access Summary | Permission overrides? | Last Changed | Last Active | Action

### Permission Overrides Column

- Has overrides: green check icon (`#1EB395`) + underlined link `"X custom override(s)"` → opens Edit Panel
- No overrides: grey × icon (`#7b828c`) + `"Using role defaults"` (no underline)

### Action Column

Underlined `"Edit"` + pencil icon → opens Edit Panel for that row.

---

## Edit Panel (Side Drawer)

Width 500px, slides in from right. Overlay backdrop.

### Panel State

```ts
panelIdx: number | null         // index into STAKE[] currently open
panelOv: Record<string, PermLevel>  // working copy of overrides (not yet saved)
panelOrigRole: string | null    // role when panel was opened (for cancel restore)
```

### Opening

```ts
openPanel(idx):
  panelIdx = idx
  panelOrigRole = STAKE[idx].role       // snapshot for cancel
  panelOv = { ...STAKE[idx].ov } or {} // deep copy working state
```

### Header

Avatar + name + email. Plain `×` close button (not circular).

### Role & Template Section (two-column grid)

**Left — Current Role**  
Native `<select>` with all 6 roles.

On change → `changeRole(idx, newRole)`:
1. `STAKE[idx].role = newRole`
2. `panelOv = {}` — **old overrides are relative to the old role's baseline; wipe them**
3. Re-render panel

**Right — Using Role Template**  
Shows the role name (text, not editable).  
Underlined link: **"View role template"** → opens the Baseline Matrix as a **read-only modal** filtered to show only that role's column (or all columns, read-only). See [View Role Template](#view-role-template).

### Section Permission Rows

For each section:

```
[Section Name £?]
[bordered dropdown ▾]                    [Reset]
Role Default: Full Access       Overridden   ← space-between, only shown when overridden
```

**Computing displayed permission:**

```ts
const baseline = BL[section.id][ROLES.indexOf(stakeholder.role)]

// Only use saved overrides if the role hasn't changed since panel opened.
// If role changed, old ov[] was relative to old baseline — ignore it.
const cur =
  panelOv[section.id] !== undefined
    ? panelOv[section.id]
    : stakeholder.role === panelOrigRole && stakeholder.ov?.[section.id] !== undefined
      ? stakeholder.ov[section.id]
      : baseline
```

**`isOverridden`** = `cur !== baseline`

**Reset (per row):**  
Removes `panelOv[section.id]`. If role unchanged, value falls back to `stakeholder.ov` (if any), then baseline. If role changed, falls back to baseline.

### Footer

Left: **Reset All** (brand red `#FF4655`, rotate-left icon) → `panelOv = {}`

Right: **Cancel** (bordered) | **Save Changes** (brand red fill, padding 12px 18px)

### Cancel Behaviour

```ts
closePanel(saved = false):
  if (!saved) STAKE[panelIdx].role = panelOrigRole  // restore role
  panelIdx = null; panelOv = {}; panelOrigRole = null
  render()  // reflect role restore in table
```

### Save Behaviour

```ts
savePanel(idx):
  const roleIndex = ROLES.indexOf(STAKE[idx].role)
  // Only persist overrides that differ from the new role's baseline
  const newOv = {}
  for (const sid in panelOv) {
    const baseline = roleIndex >= 0 ? BL[sid][roleIndex] : 'full'
    if (panelOv[sid] !== baseline) newOv[sid] = panelOv[sid]
  }
  STAKE[idx].ov = Object.keys(newOv).length ? newOv : null
  STAKE[idx].changed = 'just now'
  STAKE[idx].by = currentUser
  closePanel(true)  // saved=true: keep new role, don't restore
```

---

## View Role Template

Triggered by the "View role template" link in the panel's Role & Template section.

Shows the **Generic Baseline Role Permissions** matrix as a **read-only view** — same layout as the admin matrix table, but:

- All dropdowns replaced with static permission badges (icon + label, no chevron, no click)
- The column for the **current stakeholder's role is highlighted** (or the view is scoped to just that role column)
- No save/cancel controls
- Displayed as a modal or a fly-out — close button to dismiss and return to the panel

This gives the editor a quick reference to understand what the role's baseline looks like before deciding whether to override.

---

## Design Tokens (Admin Side — WeQuote)

```css
--brand:       #FF4655
--brand-hover: #E63B49
--ink:         #1F2F3E
--steel:       #A8B6C9
--success-2:   #1EB395   /* full access icon colour */
--warn:        #E8A33D   /* scope only icon colour */
--info:        #2783B3
--grey-100:    #F9F9F9
--grey-200:    #F3F4F6
--grey-300:    #EDF0F3   /* page bg */
--grey-400:    #E5E5E5
--grey-600:    #D0D0D0
--grey-800:    #777
```

Font: **Mulish** (weights 400 500 600 700 800)

Permission icon colours:
- `full` → `#1EB395` (green)
- `scope` → `#E8A33D` (amber)
- `none` → `#7B828C` (grey)

---

## Notes

- No emoji anywhere in the product.
- Product naming: **WeProject** (customer portal) · **WeQuote** (admin platform / company).
- `scope` on a non-financial section is treated the same as `full` in the customer portal — only the amount display is affected on financial sections.
