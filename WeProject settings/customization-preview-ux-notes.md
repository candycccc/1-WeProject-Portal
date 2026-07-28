# UX Decision Notes — Customer Portal Customization Page (Preview Project)

**Context:** WeProject / WeQuote platform. Reviewing the Customization page UI (Customer Portal → Customization).

---

## Page Overview

The Customization page lets integrators style their customer portal:
- **Left sidebar:** Site Management / Role Permissions / Manage Users / Project Access / Customization
- **Main area:** Live preview iframe of the portal (currently shows "You are viewing: Login Page" dropdown)
- **Right panel:** Portal Styles — Palette, Add Brand Colors, Font Family, Appearance (Light/Dark), Login Page Cover Image

---

## Decision 1: Should this page have a "View As Role" + "On Project" selector?

**Decision: No.**

Rationale:
- Customization is purely about **visual styling** (colours, fonts, appearance, cover image)
- These settings are identical for all roles and all projects
- Adding role/project selector would mislead users into thinking different roles see different styles
- The "View As Role + On Project" selector already belongs in **Preview Portal** (separate page, WD-105), which is about permission/content visibility — not styling

If the preview tiles (Quotes, Variations, etc.) are hard-coded to full access for styling purposes, add a small note: _"Previewing with full access."_

---

## Decision 2: Which project should the Customization preview display?

**Context:** Cannot use a demo/placeholder project — integrators need to see their own real branding and project data to meaningfully evaluate styling changes.

### Options considered:

| Option | Pro | Con |
|---|---|---|
| Most recently updated project | Simple, no UI needed | Might not be the richest project visually |
| Last viewed project | Matches admin's current focus | Requires tracking view history |
| Most complete project (most tiles filled) | Best visual preview, zero UI | Logic is opaque to user |
| Admin-pinned preview project | Full control, set once | Extra setup step, adds settings complexity |
| Lightweight project selector on this page | Transparent, user in control | Adds UI; must not be confused with Preview Portal's role+project selector |

### Recommendation: Option 3 (Most Complete) or Option 5 (Lightweight selector)

- **Most Complete** = zero extra UI, always shows the richest preview
- **Lightweight project selector** = best control, acceptable since it's purely aesthetic (no role/permission logic involved — conceptually distinct from Preview Portal selector)

### Key question to resolve:
> How many active projects does a typical integrator have?
- If 1–2 projects → auto-select is fine, no selector needed
- If many projects → lightweight selector is worth adding

---

## Edge Case

**New account with no projects yet:** Show an onboarding placeholder with message:  
_"Add your first project to see a live preview."_

---

## Related

- Preview Portal feature: WD-105 (role + project selector lives here)
- Portal Settings PRD: https://we-quote.atlassian.net/wiki/spaces/WeQuote/pages/45514753
- Prototype: https://candycccc.github.io/1-WeProject-Portal/WeProject%20settings/portal-settings-demo.html
