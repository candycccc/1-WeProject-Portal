# Portal Settings — Jira ticket descriptions

Source of truth for WD-93 / WD-94 / WD-95 / WD-96 + the 3 remaining slices to create.
Each ticket points at the live prototype rather than re-spec'ing what's already designed.

- **PRD:** <https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/45514753>
- **Live prototype:** <https://candycccc.github.io/1-WeProject-Portal/WeProject%20settings/portal-settings-demo.html>
- **Label for all tickets:** `SaaSPlatform`

---

## WD-93 · Design parent

**Type:** Design · **Status:** Sparring

```
Design phase parent for the Portal Settings admin UI on the WeQuote SaaS platform.

📋 PRD: [PRD · WeQuote Platform — Customer Portal Settings (Admin UI)]
🔗 Live prototype: https://candycccc.github.io/1-WeProject-Portal/WeProject%20settings/portal-settings-demo.html
🛠 Build epic (will block this once design signs off): TBD

## Scope
All design slices for this feature ladder up here. Each slice is broken into 
a child ticket so the team can track sparring per slice. See sub-epic WD-94 
for the structured breakdown.

## Exit criteria
- Prototype reflects the final agreed-upon flow
- PRD §8 open questions all resolved
- Dev review walkthrough complete
- PM / customer-success walkthrough complete
- Handoff doc updated with any deviations from prototype
```

---

## WD-94 · Design Epic — slice breakdown

**Type:** Epic · **Status:** Backlog · **Parent of:** WD-95, WD-96 (+ 3 to create) · **Blocked by:** WD-93

```
Structured breakdown of the design work tracked at parent WD-93.

📋 PRD: [link]
🔗 Prototype: [link]
🎨 Design parent: WD-93

The prototype IS the spec. This Epic breaks the prototype into review-able 
slices so we can sign off + handoff piece by piece.

| Child | Slice in prototype |
|---|---|
| WD-95 | Click "Portal Settings" → "Access & Permissions Settings" tab |
| WD-96 | Default landing → "User Directory & Projects Settings" tab |
| TBD-A | Click "View →" on a customer → drawer + drill into role/overrides |
| TBD-B | Sidebar "Preview Portal" → customer-first dropdown + iframe |
| TBD-C | Sidebar "Projects" → "+ NEW PROJECT" + project detail (image, dates, Progress) |

## Definition of Done (per slice)
- [ ] Prototype walkthrough done with 1 dev + 1 PM
- [ ] Open questions in PRD §8 answered for this slice
- [ ] Spec gaps documented (anything NOT in the prototype that dev needs)
- [ ] Approved → spawn engineering Story under a new Build Epic

## What's NOT in this Epic
- Engineering build (separate Build Epic once design signs off)
- Customer-portal-side changes (covered by Customer Portal PRD v2.1)
```

---

## WD-95 · Slice: Permissions Matrix (Tab 1)

**Type:** Story · **Status:** Backlog · **Parent:** WD-94

```
Slice: Access & Permissions Settings (Tab 1)

📋 PRD §6.1 · 🎨 Parent: WD-94
🔗 Walk through: [prototype URL] → top-right "Access & Permissions Settings" tab

## What the prototype already shows
- 6×8 matrix with Full / Scope / No Access dropdown per cell
- £ flag on financial sections + amber scope banner
- "Amount hidden" sub-label appears on Scope cells
- Save Changes button enables on edit; Cancel reverts to snapshot
- Reset All button restores defaults

## What's NOT in the prototype (needs decisions)
- Persistence: where does BL live in the data model? New table per integrator-tenant, 
  or column on existing customers table?
- API contract: GET/PUT shape?
- Audit: do we record who changed which cell when? (Not in v1 per PRD §3)
- Multi-cell bulk edit — defer to v1.1 confirmed?
- Scope Only on non-financial section — visual treatment? 
  (Currently treated as Full silently — confirm intended)

## Done when
- Above decisions captured as a comment on this ticket
- Engineering Story spawned with these decisions in scope
```

---

## WD-96 · Slice: User Directory + Add User picker

**Type:** Story · **Status:** Backlog · **Parent:** WD-94

```
Slice: User Directory + Add User picker

📋 PRD §6.2 · 🎨 Parent: WD-94
🔗 Walk through: [prototype URL] → default tab "User Directory & Projects Settings"

## What the prototype already shows
- Table of all portal users: avatar, name, email, # projects, last seen, View →, trash
- "+ ADD USER" → Select Customer modal (with search, "Already in Portal" pill)
- "+ NEW CUSTOMER" fallback CTA (currently placeholder)
- Trash icon → confirm dialog ("N project assignments will also be removed")
- Live # projects count derived from PREVIEW_STAKES
- "View →" opens customer detail panel (covered in next slice)

## What's NOT in the prototype (needs decisions)
- Source of master customer list — Customers table from WeQuote core? 
  Filter criteria? Pagination if > 100?
- "+ NEW CUSTOMER" — open the master-customer create form, 
  or a lightweight inline modal?
- Resend invitation — covered by Homeowner Access PRD (PRD §9 link), confirm scope split?
- Bulk remove / bulk invite — defer to v1.1?
- "Last Seen" data source — portal session log? Or last clicked email link?

## Done when
- Above decisions captured as a comment
- Engineering Story spawned
```

---

## TBD-A · Slice: Customer detail panel + Stakeholder/Override drawer

**Type:** Story · **Status:** to be created under WD-94

```
Slice: Customer detail panel (View →) + per-stakeholder Role & Override drawer

📋 PRD §6.2 (Customer detail) + §6.2 (Override drawer) · 🎨 Parent: WD-94
🔗 Walk through: [prototype URL] → directory → click "View →" on any customer 
   → then "Edit role & overrides" on a project row

## What the prototype already shows
- Customer detail side drawer with Last Seen, Portal Access, Assigned Projects
- Each project row: # · status pill · name · role · override count · "Go to project →"
- "+ ASSIGN TO PROJECT" inline form (project dropdown + role dropdown)
- "Edit role & overrides" drills deeper into the role/permission drawer
- Per-section permission rows: Full/Scope/None dropdown, Role Default label, 
  "Overridden" tag, "Amount hidden" hint, per-row Reset, Reset All
- "View role template" link → read-only baseline matrix for that role
- Back nav from drawer returns to customer panel

## What's NOT in the prototype (needs decisions)
- Role change wipes existing overrides — confirmation dialog needed?
- "View role template" — read-only matrix vs scoped to single column?
- Override storage shape: per-stakeholder JSON blob, or per-cell rows?
- Mobile: drawer takes full width? Same drill-down or different pattern?
- Project assignment from this drawer vs from a project page — keep both entry 
  points or consolidate?

## Done when
- Above captured
- Engineering Story spawned
```

---

## TBD-B · Slice: Preview Portal

**Type:** Story · **Status:** to be created under WD-94

```
Slice: Preview Portal — customer-first selector + iframe with permission filtering

📋 PRD §6.3 · 🎨 Parent: WD-94
🔗 Walk through: [prototype URL] → sidebar "Preview Portal"

## What the prototype already shows
- Top-of-page selectors: "Viewing as Customer" (every portal user) + 
  "On Project" (only their assigned projects)
- Empty state when customer has no assigned projects ("Go to Directory" CTA)
- Iframe loads the actual customer portal HTML
- Section permission = None → tile hidden entirely
- Section permission = Scope → amber banner + grey placeholder bars replacing money + 
  payment summary blocks hidden + Accept/Reject/TBC/Add-to-Accept buttons removed
- Switching customer or project reloads iframe automatically
- Progress: actual bars + expected calendar marker + auto-derived status sync 
  to the portal's Progress page

## What's NOT in the prototype (needs decisions)
- Iframe vs same-window route in production?
- How do we render the customer portal in real production 
  (separate domain? same domain, different path? embedded React widget?)
- Scope Only money-hiding strategy in production — server-side strip vs 
  client-side DOM walk like the prototype?
- Are there sections in production NOT in the prototype that also need filtering 
  (e.g. Tasks, Drawings)?
- Mobile preview: do we render an actual mobile-sized iframe? Default iframe 
  state — Desktop or Mobile?

## Done when
- Above captured
- Engineering Story spawned
```

---

## TBD-C · Slice: Project module updates

**Type:** Story · **Status:** to be created under WD-94

```
Slice: Project module — image upload + start/end dates + Progress widget

📋 PRD §6.4 + §6.5 · 🎨 Parent: WD-94
🔗 Walk through: [prototype URL] → sidebar "Projects" → "+ NEW PROJECT" 
   (creation) → click any project row (detail dashboard)

## What the prototype already shows
- Projects list page: table with image thumb · description · customer · 
  status · Progress % · last changed · Open → · stats tabs
- Add/Edit Project modal — NEW FIELDS:
  - Project Image (upload / replace / remove, preview thumbnail)
  - Start Date · End Date · Duration (auto-calculated days/weeks/months)
- Project Detail dashboard:
  - Hero with image + breadcrumb + EDIT/SET NOTIFICATIONS/NEW QUOTE buttons
  - Top row: Progress widget | Project Overview (stacked bars)
  - 5 mini "Actual vs Quoted" cards
  - Phasewise chart
  - Right column: Time donut + Project Time stats
- Progress widget:
  - Filled bars = ACTUAL (admin slides)
  - Triangle marker = EXPECTED (calendar position from start/end)
  - Auto-derived status (Planned/Delayed/Behind Schedule) — display only
  - CLEAR button resets actual to 0%
- Image + Progress sync into the customer portal hero + Progress page

## What's NOT in the prototype (needs decisions)
- Image upload: max size, accepted aspect ratio, storage (S3 bucket/policy), 
  CDN, how it's referenced in customer portal HTML
- Existing Add/Edit Project modal — confirm which fields stay vs get removed 
  (PRD currently says all existing fields stay)
- Progress data model — store actual+status per project, or compute status server-side?
- Date format / timezone handling for Start/End dates
- "Today" reference for expected position — server time vs client time?
- If start/end dates are missing entirely, what should the widget show 
  (currently shows 0% with no marker)?

## Done when
- Above captured
- Engineering Stories spawned (probably 2: project create/edit + dashboard with 
  Progress, since they're roughly independent)
```

---

## Suggested next actions (PM checklist)

- [ ] Push these descriptions onto WD-93 / WD-94 / WD-95 / WD-96
- [ ] Create TBD-A · TBD-B · TBD-C as new Stories under WD-94 with same shape
- [ ] Add label `SaaSPlatform` to all (already done on 94/95/96 — confirm 93 has it)
- [ ] Schedule design walkthrough with Lee + Robert + 1 dev per slice (5 × 30min)
- [ ] Resolve PRD §8 open questions during walkthrough — capture answers as comments on each slice ticket
- [ ] Once a slice's "Done when" checklist passes → spawn engineering Story under a NEW Build Epic (separate from WD-94)
- [ ] Add Fix Version (e.g. `v2.x — Q3 2026`) once roadmap is confirmed
