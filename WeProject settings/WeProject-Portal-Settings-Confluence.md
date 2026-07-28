# PRD · WeQuote Platform — Customer Portal Settings (Admin Level)

**Status:** Draft v0.1 — for team review · **Author:** Candy Chiu · **Last updated:** 2026-06-18

---

## TL;DR

The Customer Portal already exists. What's been missing is a place inside the **WeQuote SaaS platform** where integrators configure _what their customers see_ — section-level permissions, per-stakeholder overrides, project assignments, branding preview, and project setup. This PRD defines that admin UI.

This is the _integrator-facing_ counterpart to the existing customer-facing PRDs. Both ship together but have different audiences and acceptance criteria.

---

## 1. Why this is separate from the Customer Portal PRDs

| Aspect | Customer Portal PRDs | This PRD |
|---|---|---|
| Audience | Homeowner / end customer | Integrator (paying WeQuote user) |
| Lives in | portal.lcr-integrated.com (white-label) | WeQuote SaaS platform → Customer Portal section |
| Reviewers | Marketing, Customer Success | Product, Integrator success, Engineering |
| Acceptance focus | Customer trust, brand, comprehension | Admin speed, safe defaults, override clarity |

---

## 2. Problem

Without a configuration UI, integrators have no way to control per-customer visibility. Either everyone sees everything (over-sharing prices and documents with subcontractors), or the portal can't be safely shared at all. A third pain point: integrators have no way to _preview_ what a specific customer would see before they share the link.

---

## 3. Goals & Non-goals

### Goals

- Let an integrator set safe defaults per role in < 2 minutes
- Allow per-stakeholder overrides without breaking the baseline
- Show admin _exactly_ what each customer sees ("View As" preview)
- Keep section permissions and project assignment in one place
- Surface project schedule progress and let admin slide actual % independent of calendar position

### Non-goals (this release)

- Per-line-item permissions inside a section (handled at section level only)
- Custom roles beyond the 6 built-in (Home Owner / Builder MC / Electrician / A/C / Quantity Surveyor / Builder PM)
- Audit log / change history of permission edits
- Bulk import of stakeholders from CSV

---

## 4. Information Architecture

Lives inside the WeQuote sidebar under **Customer Portal**:

```
WeQuote sidebar
├── Sales
│   ├── Projects                        ← existing, no change
│   └── ...
└── Customer Portal                     ← existing section
    ├── Portal Settings                 ← NEW
    │   ├── Tab 1 — User Directory & Projects Settings  (default landing)
    │   └── Tab 2 — Access & Permissions Settings
    └── Preview Portal                  ← NEW
```

**Only two new menu items are added in this release:** Portal Settings and Preview Portal, both under the existing Customer Portal section. Sales → Projects already exists and is not being added or renamed.

---

## 5. Permission Model

Two-level resolution: Baseline Role Matrix (BL) → per-stakeholder overrides → effective permission shown to customer.

Three levels per section:

| Level | Meaning |
|---|---|
| **Full Access** | Section visible, all data shown |
| **Scope Only** | Financial sections only — section visible, monetary amounts hidden |
| **No Access** | Section hidden entirely from customer dashboard |

8 sections × 6 roles = 48 baseline cells. Overrides only stored if they differ from the baseline. Changing a stakeholder's role wipes their old overrides (obsolete against new baseline).

### Default Baseline (from Customer Portal PRD v2.1)

This is the factory default loaded into the matrix. Integrators can change any cell; this is just the safe starting point.

| Section | Home Owner | Builder / MC | Electrician | A/C | QS | Builder PM |
|---|---|---|---|---|---|---|
| Quotes £ | Full | Scope Only | Scope Only | Scope Only | Full | Scope Only |
| Variations £ | Full | No Access | No Access | No Access | Full | Full |
| Sales Order £ | Full | Scope Only | Scope Only | Scope Only | Full | Scope Only |
| Invoices £ | Full | Full | No Access | No Access | Full | No Access |
| Progress | Full | Full | Full | Full | Full | Full |
| Documents | Full | Full | Full | Full | Full | Full |
| Warranty | Full | Full | No Access | No Access | Full | Full |
| Activity Feed | Full | Full | Full | Full | Full | Full |

> Source: [WeQuote Customer Portal PRD v2.1](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/19398658) §3 Permission Matrix. "Documents" maps to "Drawings" in v2.1 — same section, renamed for consistency.

---

## 6. Feature Scope

### 6.1 Portal Settings — Tab 1: User Directory & Projects Settings

#### Customers Portal User Directory

- Table columns: Avatar + name · Email · # projects assigned (live count link) · Last Seen · View → · Trash icon
- **+ ADD USER** opens "Select Customer" modal — pulls from WeQuote master customer list, marks already-added customers as "Already in Portal", search box, + NEW CUSTOMER fallback
- Trash icon: confirm dialog warns how many project assignments will also be removed
- **View →** opens Customer Detail panel (slide-in drawer): all assigned projects with role + override count chip, "Go to project →" link, and "+ ASSIGN TO PROJECT" inline form

#### Projects Card

- Lists each project: No. · Description · Customer · Status pill · Stakeholder count · Last Changed · Action
- Click "Edit ✎" → Project Detail view (Portal Settings context)

#### Project Detail (Portal Settings context)

- Stakeholder table: Customer · Role Template · Role Access Summary · Overrides? · Last Changed · Last Active · Edit ✎
- **+ ADD STAKEHOLDER** (header button + empty-state CTA) opens modal: pick existing portal user + role, or "+ Add a new portal user" to hop into the ADD USER picker
- **Edit ✎** on a stakeholder row → side drawer to manage role + per-section overrides
- Inside the drawer: **View role template** opens a read-only dialog showing the baseline matrix for that specific role

---

### 6.2 Portal Settings — Tab 2: Access & Permissions Settings

The generic baseline permission matrix that all projects inherit by default.

**Matrix:** 6 role columns × 8 section rows

- **Roles:** Home Owner · Builder/MC · Electrician · A/C · Quantity Surveyor · Builder PM
- **Sections:** Quotes £ · Variations £ · Sales Order £ · Invoices £ · Progress · Documents · Warranty · Activity Feed
- £ flag marks financial sections — Scope Only only meaningful on these

**Cell behaviour:**
- Custom dropdown per cell (not native `<select>`) — Full / Scope / No Access with icon + colour
- Only one dropdown open at a time; click outside closes all
- £ sections at Scope show "Amount hidden" sub-label
- Amber banner explains Scope Only semantics

**Save / Cancel:**
- Save Changes button disabled until any cell changes
- Cancel reverts to last saved baseline snapshot
- Save flashes green ("SAVED") for 1.4 s then re-renders

---

### 6.3 Preview Portal

- **Customer-first selector:** dropdown lists every customer in the directory (with "· N projects" or "(no projects)" suffix); selecting one auto-loads only the projects they're a stakeholder on; right chip shows avatar + name + role
- If selected customer has no projects: empty state with "Go to Directory" CTA → Tab 1
- Iframe loads the real customer portal HTML and applies resolved permissions live
- Switching customer or project reloads the iframe automatically

**Permission effects inside the iframe:**

| Permission | Customer portal effect |
|---|---|
| Full Access | Section visible, all data shown |
| Scope Only (£ sections) | Amber "Scope Only" banner · monetary amounts replaced by grey placeholder bars · payment summary panels hidden · Accept/Reject/TBC action buttons hidden |
| No Access | Section tile hidden entirely from dashboard (not just blocked on click) |

Hide-money behaviour catches dynamically-opened modals (e.g. Change Order detail) via MutationObserver.

---

### 6.4 Project Module (Sales → Projects)

#### Projects Page

- Header: Breadcrumb "Projects > `<company>`" · Title "Projects" · NEW CUSTOMER ghost · + NEW PROJECT red
- Stats tabs: ALL · ACTIVE · CANCELLED (each with count; active tab has red underline)
- Table: No. · Description (with 48×36 thumbnail) · Customer · Status · Progress % · Last Changed · Action ("Open →")
- Row click or "Open →" → Project Detail dashboard

#### Add / Edit Project Modal

Same modal for both Create and Edit modes.

**New fields in this release:**

| Field | Behaviour |
|---|---|
| Project Image | Upload JPG/PNG/SVG (recommended ≥ 1200×800). 120×80 preview + REPLACE IMAGE + REMOVE. Same image appears in Projects table, Project Detail hero, and Customer Portal hero. |
| Start Date | Date picker — drives Progress widget calendar position + portal Progress page Start Date |
| End Date | Date picker — drives Est. Completion + elapsed-vs-total calculation |
| Duration | Read-only, auto-calculated (days / weeks / months / years); updates live as dates change |

**Existing fields (unchanged):** Customer (search + add new) · Description (required) · Assignee · Warehouse · Currency · Label · Project Location fields · Calendar Colour · Include Travel toggle

Footer: CANCEL (dark grey) · CREATE PROJECT / SAVE CHANGES (red)

#### Project Detail Dashboard

- **Header:** 48×48 rounded project image + breadcrumb + title + EDIT PROJECT · SET NOTIFICATIONS · + NEW QUOTE (red)
- **Top row:** Progress widget (left) | Project Overview stacked bars — Quoted / Actual / Invoiced, segmented by Products / Labour / Margin / Unpaid Products / Unpaid Labour / Left (right)
- **5 mini "Actual vs Quoted" cards:** Product Cost · Labour Cost · Total Cost · Hours · Margin — each with 2 vertical bars (purple Actual, green Quoted)
- **Phasewise Overview:** bar chart — Actual vs Assigned task hours per phase
- **Right column:** Time donut (Hours Used + engineer dots + "Travel Time" amber) · Project Time card (Hours Booked / Billable / Over / Total Quoted + visit breakdown)

---

### 6.5 Progress Widget

Two independently controlled values; status auto-derived from their gap.

- **Filled bars** = ACTUAL progress — admin clicks or drags to set (0–100%)
- **Triangle marker** = EXPECTED position — auto-calculated from `(today − startDate) / (endDate − startDate) × 100`

**Auto-derived status (display-only, no manual toggle):**

| Status | Condition | Colour |
|---|---|---|
| Progressing as planned | actual ≥ expected − 5% | Green |
| Delayed | gap 5–15% behind | Amber |
| Behind Schedule | gap ≥ 15% behind | Red |

**Visual layout:**
- "PROGRESS" caption (left) + "X% Done" big number (right)
- Coloured status label + contextual subtitle
- 25-segment bar strip — filled to actual %, grey beyond
- Triangle marker at expected % above bars
- Start Date label (left) + Est. Completion label (right) below bars
- **CLEAR** button (top-right) — resets actual to 0%

**Interaction:** Click any bar → sets actual to that bar's %. Mouse-drag → smooth slide. No full re-render on each update.

**Customer portal sync:** On any change, writes to localStorage:
- `wqPortalProgress`: `{ actual, expected, status, subtitle }`
- Portal Progress page mirrors: bars, needle, headline status, subtitle

**Edge case:** No Start Date or End Date → triangle marker hidden, status defaults to "Progressing as planned"; bars and CLEAR still work.

---

## 7. Save / Cancel Behaviour

Single Save Changes button per top-level area. Any state change enables the button. Save commits the current state as the new snapshot. Cancel reverts BL + CUSTOMERS to the last-saved snapshot and re-renders.

Per-stakeholder drawer has its own Save/Cancel — Save closes the drawer and marks the page as unsaved; Cancel discards drawer-level changes and restores role if it was changed.

**Known limitation:** PREVIEW_STAKES changes (adding a stakeholder to a project) do not currently revert on Cancel. See Open Questions §8.5.

---

## 8. Open Questions

- [ ] Should "Scope Only" hide the Payment Details block (routing/account number), or just monetary amounts? Currently the entire summary panel is hidden — confirm.
- [ ] When a stakeholder's role is changed mid-edit, all old overrides are wiped. Show a confirmation dialog first?
- [ ] Auto-derived status pills: should integrators ever be able to override the calendar-based status manually?
- [ ] When admin sets a section to "No Access" for a role, should already-stored per-stakeholder overrides for that section be cleared?
- [ ] PREVIEW_STAKES snapshot on Cancel — currently CUSTOMERS reverts but stakeholder assignment changes do not. Strict revert across all data, or accept "Save once you've added a stakeholder"?

---

## 9. Related

- [Customer Portal PRD (customer-facing counterpart)](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/19398658)
- [Onboarding & Password Recovery](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/34734104)
- [Related PRD](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/34766862)
- [Related PRD](https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/14385177)

---

## 10. Working Prototype

Live prototype: [portal-settings-demo.html](https://candycccc.github.io/1-WeProject-Portal/WeProject%20settings/portal-settings-demo.html)

Local files live in the repo at `1-WeProject Portal/WeProject settings/` — `portal-settings-demo.html` + `portal-preview.html`.

---

## 11. Cross-cutting Design Specs

| Element | Spec |
|---|---|
| Topbar | Full-width; WeQuote logo (42×42 SVG cube) + company wordmark + help/notifications/settings + user greeting |
| Sidebar | White, 243 px wide; section labels + count badges |
| Save button | Brand red, ALL CAPS, in page header |
| Side drawer | 500 px wide, slides from right, 200 ms transition, 20% opacity overlay backdrop |
| Modal pattern | Centered card with dimming backdrop; header with title + × close; scrollable body; footer with grey secondary + red primary |
| Date format | en-GB: "12 Jan 2026" |
| Status icons | Bootstrap Icons only (no emoji in product UI) |
