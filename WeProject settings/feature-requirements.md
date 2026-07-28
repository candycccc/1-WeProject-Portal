# Portal Settings — Feature Requirements

Reference document for everything the prototype does. Use this as the source of truth when reviewing the design or writing dev specs.

- **Live prototype:** <https://candycccc.github.io/1-WeProject-Portal/WeProject%20settings/portal-settings-demo.html>
- **PRD:** [Confluence](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/45514753)

---

## 1. Information architecture

Lives inside the WeQuote SaaS sidebar under **Customer Portal**:

```
WeQuote sidebar
├── ...existing items
├── Sales
│   ├── Projects                        ← project module (new)
│   └── ...
└── Customer Portal
    ├── Portal Settings                 ← admin config UI
    │   ├── Tab 1 — User Directory & Projects Settings  (default landing)
    │   └── Tab 2 — Access & Permissions Settings
    └── Preview Portal                  ← view-as-customer iframe
```

Two top-level surfaces and one project module:

- **Portal Settings** (2-tab page) — configure what customers can see
- **Preview Portal** — preview-as-a-customer iframe of the live portal
- **Projects** (separate, under Sales) — project list/detail + progress

---

## 2. Customer Portal Settings — Tab 1: Access & Permissions

The baseline permission matrix that drives the whole portal.

### 2.1 The matrix

- **6 roles** (columns): Home Owner · Builder / MC · Electrician · A/C · Quantity Surveyor · Builder PM
- **8 sections** (rows): Quotes £ · Variations £ · Sales Order £ · Invoices £ · Progress · Documents · Warranty · Activity Feed
- **3 permission values** per cell: Full Access · Scope Only · No Access
- £ flag marks financial sections — Scope Only only meaningful on these

### 2.2 Cell dropdown

- Custom dropdown (not native `<select>`) with icon + colour per value
  - Full Access → green check
  - Scope Only → amber eye
  - No Access → grey X
- Only one dropdown open at a time; click outside closes all
- Cells on financial sections at Scope show "Amount hidden" sub-label

### 2.3 Card chrome

- Title: "Generic Baseline Role Permissions"
- Subtitle: "Safe defaults — every project inherits these. Override per-project below if needed."
- Legend showing each value's icon
- "Reset All" button restores defaults
- Amber explanatory banner: "Scope Only on financial sections (marked £): the section is visible but monetary amounts are hidden from the customer."
- Hint strip above table: "Click any cell to change the permission for that role…"

### 2.4 Save / Cancel

- "Save Changes" button in page header — disabled until any cell changes
- "Cancel" reverts the matrix to the last saved snapshot
- Save flashes the button green ("SAVED") for 1.4s then re-renders

---

## 3. Customer Portal Settings — Tab 2: User Directory & Projects

The list of customers granted portal access + the projects they're on.

### 3.1 Customers Portal User Directory card

Header: title + "Add and manage users in the Customer Portal. Once added, assign them to projects below." + red **+ ADD USER** button.

**Table columns**

| Column | Notes |
|---|---|
| Customer | Avatar + name |
| Email | Muted grey |
| Assigned To | Live count derived from PREVIEW_STAKES (e.g. "3 projects" link) |
| Last Seen | Right-aligned, muted |
| Action | "View →" link + trash icon |

- **Trash icon** opens confirm dialog quoting how many project assignments will also be removed
- **View →** opens the customer detail panel (see §5)
- **3 projects** link also opens the panel
- "No projects" muted text if the customer hasn't been assigned anywhere

### 3.2 Select Customer modal (triggered by + ADD USER)

Pulls from the WeQuote master customer list.

**Layout**

- Title: "Select Customer" + X close
- Search bar (icon + placeholder "Search")
- Table: Customer Name · Account No. · Phone Number · Email Address · Primary Contact · Assigned to
- Each row clickable to add the customer (unless already in portal)
- Already-in-portal rows: greyed, with "ALREADY IN PORTAL" pill, non-clickable
- Footer: **+ NEW CUSTOMER** (green) and **CANCEL** (dark grey)

**Search behaviour**

- Filters by name / email / account / phone — case-insensitive substring match
- Empty result state: "No customers match \"<query>\"."

### 3.3 Projects card (below directory)

Header: "Projects" + "Click Edit on a project to manage per-stakeholder access overrides."

**Table columns**

| Column | Notes |
|---|---|
| No. | e.g. #24501, muted |
| Description | Bold, project name |
| Customer | Project owner |
| Status | Pill — Active (blue) / Cancelled (purple) |
| Stakeholder(s) | Count as underlined link → project detail |
| Last Changed | By + date |
| Action | "Edit ✎" → project detail |

### 3.4 Save / Cancel

Shared with Tab 1 — same "Save Changes" button in page header reflects unsaved state from either tab.

---

## 4. Customer detail panel (slide-in drawer)

Opens from the directory "View →" link.

### 4.1 Header

- Avatar + name + email
- × close button (top-right, no border)

### 4.2 Meta strip

Two-column: **Last Seen** value · **Portal Access** "Active"

### 4.3 Assigned Projects list

Heading: "ASSIGNED PROJECTS (N)"

**Per project row**

- Project number (#24501) + status pill (Active / Cancelled)
- Project name (bold)
- "Role: <role>" + override count chip ("3 overrides" red, if any)
- Two actions: **"Edit role & overrides"** button (opens drill-down) and **"Go to project →"** (navigates to project detail)

If the customer has no projects: "Not assigned to any project yet." empty state.

### 4.4 + ASSIGN TO PROJECT button

Bottom of panel — dashed-outline red button. Click opens inline form:

- Pink panel appears below
- Project dropdown (only projects not already assigned)
- Role dropdown (6 roles, default Home Owner)
- Info hint: "The customer will inherit the role's baseline permissions. You can override per-section after they're added."
- CANCEL + SAVE ASSIGNMENT buttons

Save adds the stakeholder, closes the form, re-renders the panel.

If the customer is already on every project: "<Name> is on every project." note instead of the button.

---

## 5. Per-stakeholder Role & Override drawer (drill-down)

Opens from "Edit role & overrides" on the customer panel OR from the project's stakeholder table.

### 5.1 Back navigation

If entered from the customer panel: thin breadcrumb strip at top — "← Back to <customer>" + project number + name.
Clicking back returns to the customer detail panel.

### 5.2 Header

Avatar + name + email + × close button.

### 5.3 Role section (top of drawer)

Two-column grid:

- **Left** — "Current Role" label + native `<select>` of all 6 roles
- **Right** — "Using Role Template" label + current role name in bold + **"View role template"** underlined link

Changing the role wipes the working override copy (old overrides were against the old baseline — meaningless after a role change).

### 5.4 Per-section permission rows

For each of the 8 sections:

- Section name (with £ flag if financial)
- Bordered permission dropdown (Full / Scope / None)
- Per-row **Reset** button — clears that section's override back to role default
- "Role Default: <value>" muted label below
- "Overridden" red tag if the current value differs from the role baseline
- "Amount hidden from customer" amber hint when Scope on a financial section

### 5.5 Footer

Three buttons:

- **Reset All** (red link, left) — clears every override in this drawer
- **Cancel** — closes drawer, discards any unsaved changes, restores role if changed
- **SAVE CHANGES** (red button) — persists overrides, sets unsaved=true, closes drawer

### 5.6 View Role Template dialog

Opens above the drawer (z-index higher) when "View role template" is clicked.

- Read-only matrix showing only this role's column
- All 8 sections with permission badges (icon + label, no dropdown)
- Footer: link "Edit baseline in Access & Permissions Settings →" and a CLOSE button

---

## 6. Project Detail (Portal Settings context)

Reached by clicking a project row in the Projects card.

### 6.1 Header

Breadcrumb: "← Portal Settings > #24507 · Seacon Tower, 97"
Right side: "Last Changed <date> / By <name>" · **+ ADD STAKEHOLDER** (red) · Cancel · SAVE CHANGES buttons.

### 6.2 Stakeholder table

Columns: Customer · Role Template · Role Access Summary · Permission overrides? · Last Changed · Last Active · Action

- **Customer:** avatar + name + email
- **Role Template:** overlay-style dropdown (visual div with chevron + transparent native `<select>` over it)
- **Role Access Summary:** label (Full / Mostly Full / Mixed / etc.) + chip breakdown ("5 Full Access · 2 Scope Only · 1 No Access" with dot separators)
- **Permission overrides?:**
  - Has overrides → green check + "N custom override(s)" underlined link
  - None → grey X + "Using role defaults"
- **Action:** "Edit ✎" → opens the per-stakeholder drawer (§5)

### 6.3 + ADD STAKEHOLDER modal

Opens from header button or empty-state CTA.

- Title: "Add Stakeholder" + subtitle showing project number + name
- Customer dropdown — only customers not already on this project
- Below dropdown: red link **"+ Add a new portal user"** — opens the Select Customer modal (§3.2) and returns here on save
- Role dropdown (6 roles)
- Info hint: "The customer will inherit the role's baseline permissions. You can override per-section after they're added."
- CANCEL + ADD STAKEHOLDER buttons

If every portal user is already a stakeholder: empty state with link to "+ Add a new portal user" first.

### 6.4 Empty state

When no stakeholders yet: "No stakeholders yet" + description + centered ADD STAKEHOLDER CTA inside the table.

---

## 7. Preview Portal

Embedded iframe of the customer portal, with admin selecting whose view to preview.

### 7.1 Top selector

Single card with two dropdowns and a "viewing as" chip:

- **VIEWING AS CUSTOMER** — every customer in the directory (including newly-added ones); shows suffix "· 3 projects" or "(no projects)"
- **ON PROJECT** — only the projects the selected customer is assigned to; shows project number + name + role
- Right side: avatar + name + role chip

Changing CUSTOMER auto-resets ON PROJECT to the first of that customer's projects.

### 7.2 Empty state

If selected customer has no assigned projects:

- Eye-slash icon
- "<Name> isn't on any project yet"
- Subtitle: "Assign them to a project from the directory below to preview their portal view."
- "Go to Directory" ghost button → navigates to Tab 1

### 7.3 Iframe

- Loads `portal-preview.html` (the actual customer portal HTML)
- Width / height fills remaining viewport
- Auto-navigates to the selected project on load (via `wqPortalCurrentProject` in localStorage)
- Auto-applies the resolved permissions for the selected customer (via `wqPortalPreview` in localStorage)
- Auto-syncs Progress (actual + expected + status via `wqPortalProgress`)

### 7.4 Permission behaviour inside the iframe

| Permission | Effect on the customer portal |
|---|---|
| **Full Access** | Section visible, all data shown |
| **Scope Only** *(financial sections)* | Section visible BUT: amber "Scope Only" banner at top · monetary amounts replaced by grey placeholder bars · whole payment summary panels hidden · Accept/Reject/TBC/Add-to-Accept buttons hidden |
| **No Access** | Section tile hidden entirely from the dashboard (not just blocked on click) |

Hide-money behaviour also catches dynamically-opened modals (Change Order detail, etc.) via a MutationObserver.

---

## 8. Projects page (Sales → Projects)

The top-level Projects management page.

### 8.1 Header

- Breadcrumb: "Projects > LCR Integrated Systems"
- Title: "Projects"
- Right side: **NEW CUSTOMER** ghost button + **+ NEW PROJECT** red button

### 8.2 Stats tabs

Across the top of the table card:

| Tab | Count |
|---|---|
| ALL | total |
| ACTIVE | count where status=active |
| CANCELLED | count where status=cancelled |

Active tab gets a red underline.

### 8.3 Table

Columns: No. · Description · Customer · Status · Progress % · Last Changed · Action

- **Description** column shows a 48×36 image thumbnail next to the project name
- **Progress %** displays the admin-set actual percentage
- Row click → Project Detail dashboard
- "Open →" link in Action column

---

## 9. Add / Edit Project modal

Same modal serves both Create and Edit; mode determines pre-fill + button label.

### 9.1 Header

- Title: "Add Project" or "Edit Project"
- × close

### 9.2 Fields (new in this release)

| Field | Behaviour |
|---|---|
| **Project Image** | Upload (JPG/PNG/SVG, recommended ≥ 1200×800). 120×80 preview, **REPLACE IMAGE** + **REMOVE** buttons. Same image surfaces in Projects table thumb, Project Detail hero, and Customer Portal hero |
| **Start Date** | Date picker — drives the calendar position of the Progress marker + customer portal Progress page Start Date |
| **End Date** | Date picker — drives Est. Completion + the elapsed-vs-total maths |
| **Duration** | Auto-calculated readout: days / weeks / months / years (live as dates change). Read-only |

### 9.3 Existing fields (kept as-is, not re-specced)

Customer (search + add new) · Description (required) · Assignee · Warehouse · Currency · Label · Project Location (Address / Building / Floor / Town/City / County/State / Postcode/ZIP / Country) · Calendar Colour · Include Travel toggle

### 9.4 Footer

- **CANCEL** (dark grey)
- **CREATE PROJECT** (red, in create mode) or **SAVE CHANGES** (in edit mode)

Description is the only required field. Save validates + flashes if invalid.

---

## 10. Project Detail dashboard

The dashboard shown when clicking a project from the Projects page.

### 10.1 Header strip

Project image thumbnail (48×48 rounded) + breadcrumb + title + EDIT PROJECT ghost + SET NOTIFICATIONS ghost + **+ NEW QUOTE** red.

### 10.2 Top row (two columns)

- **Left** — Project Progress widget (see §11)
- **Right** — Project Overview card:
  - 3 stacked horizontal bars: Quoted / Actual / Invoiced
  - Each bar segmented by Products / Labour / Margin / Unpaid Products / Unpaid Labour / Left
  - Inline £ amount on each segment if wide enough
  - Right side: "Total Sell" + "Margin" totals
  - Legend below

### 10.3 Mini "Actual vs Quoted" cards

5-card horizontal grid:

- Product Cost · Labour Cost · Total Cost · Hours · Margin
- Each card: caption "📦 Actual vs Quoted" + title + Y-axis labels + 2 vertical bars (purple Actual, green Quoted) with horizontal grid lines

### 10.4 Phasewise Overview

Title: "Phasewise Overview — Actual vs Assigned Task Hours"

- Y-axis 0–500 with grid lines
- One pair of bars per phase (Unassigned · 2-First Fix Install · 4-2nd Fix Install · 1-Design Stage · 5-Commissioning · 6-Hand Over · 3-Off Site Build)
- Each pair: Actual (purple) + Quoted (green)

### 10.5 Right column (vertical stack)

| Card | Content |
|---|---|
| **Time** | SVG donut — orange ring showing Hours Used (e.g. 515.63/515.63) + 3 small coloured engineer dots on the ring + center text "Hours Used" + amber "Travel Time" |
| **Project Time** | 4 stat numbers (Hours Booked / Billable / Over / Total Quoted) + progress bar showing booked/quoted ratio + 3 visit counts (Contract / Sales / Service) |

(The earlier Engineers list has been removed per request.)

---

## 11. Project Progress widget

Lives in the top-left of the Project Detail dashboard. Drives both the admin view and the customer portal Progress page.

### 11.1 Two independent values

- **Filled bars** = ACTUAL progress (admin slides this)
- **Triangle marker** = EXPECTED position from the calendar (today vs Start/End dates)

The gap between them tells the schedule story.

### 11.2 Auto-derived status

| Status | Condition | Colour |
|---|---|---|
| Progressing as planned | `actual ≥ expected − 5%` | Green |
| Delayed | gap between 5% and 15% behind | Amber |
| Behind Schedule | gap ≥ 15% behind | Red |

Status is display-only (no manual toggle — the calendar-vs-actual maths is the source of truth).

### 11.3 Visual layout

- "PROGRESS" caption (left) + "X% Done" big number (right)
- Big coloured status label + subtitle ("Project is progressing well and on schedule." / "Some items need attention…" / "Project is behind schedule.")
- 25-segment bar strip — filled with status colour up to actual %, grey beyond
- Triangle marker positioned absolutely at the expected % above the bar strip
- Start Date label (left) + Est. Completion label (right) below the bars
- **CLEAR** button (top-right corner) — resets actual to 0%, does not hide the widget

### 11.4 Interaction

- Click any bar → sets actual to that bar's percentage
- Mouse-drag across bars → smooth slide
- Each click/drag updates the live widget without full re-render

### 11.5 Customer Portal sync

The admin's actual + expected + status are written to localStorage (`wqPortalProgress`) and the customer portal's Progress page mirrors:

- Filled bars match actual
- Needle at expected
- Headline status matches
- Subtitle matches

### 11.6 Edge case

If a project has no Start Date or End Date set, the calendar maths can't run. The triangle marker is hidden and status defaults to "Progressing as planned". Bars and CLEAR still work.

---

## 12. Save / Cancel snapshot logic

A single Save Changes button serves the whole Portal Settings page (both tabs) + the Project Detail page.

- On page load: snapshot of BL, CUSTOMERS (and project state where relevant)
- Any mutation (cell edit, add user, remove user, add stakeholder, change role, add override, slide progress, etc.) sets `unsaved = true`
- Save Changes is disabled when `unsaved === false`
- Save commits the current state as the new snapshot
- Cancel reverts BL and CUSTOMERS to the snapshot, re-renders

Known limitation: PREVIEW_STAKES changes (adding a stakeholder to a project) currently do not revert on Cancel. PRD §8 has this as an open question.

---

## 13. Cross-cutting behaviours

| | |
|---|---|
| **Topbar** | Spans the full width across sidebar + main. WeQuote SVG cube logo + "LCR INTEGRATED SYSTEMS" wordmark + help/notification/settings + "Hi, Candy" + avatar |
| **Topbar logo** | Uses `wequote-logo.svg` (3D cube). Sized 42×42 |
| **Sidebar** | White, 243px wide, with section labels and a count badge per nav item where relevant |
| **Save button** | Brand red, ALL CAPS, lives in page header consistently |
| **Side drawer** | 500px wide, slides from right with 200ms transition, overlay backdrop dimming the page at 20% opacity |
| **Modal pattern** | Centered card with dimming backdrop. Header bar with title + × close. Body scrolls if needed. Footer with secondary (grey) + primary (red) buttons |
| **Date format** | "12 Jan 2026" style (en-GB) |
| **No emoji in product UI** | Status icons use Bootstrap Icons only |

---

## 14. Out of scope (not in this release)

- Per-line-item permissions inside a section
- Custom roles beyond the 6 built-in
- Audit log / change history of permission edits
- Bulk import / bulk remove of stakeholders
- Multi-cell bulk edit on the matrix
- Resend invitation (covered by separate Homeowner Access PRD)
- Custom role templates (use the 6 built-in only)
- Mobile-specific designs (some screens degrade gracefully, others noted as desktop-only)
