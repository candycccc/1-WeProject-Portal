# Variation — Customer Portal Flow

How a customer reviews and accepts **Variations** (changes/additions to an existing Quote) in the WeProject Customer Portal prototype.

---

## 1. What is a Variation?

A **Variation** is a single proposed change to an already-issued Quote — added scope, swapped product, removed item, price adjustment, etc. Each Variation:

- Originates from a specific source Quote (e.g. `Variation 02 from Quote #23944`)
- Has its own photo / title / price / "valid until" date
- Is reviewed by the customer **one card at a time**

### Variation vs Change Order

This is the key distinction in the system:

| | **Variation** | **Change Order (CO)** |
|---|---|---|
| Scope | One change | Bundle of accepted changes |
| Lives under | Variations page | Change Orders page |
| **Price** | **Estimate** — indicative figure to help the customer decide | **Final, contracted price** — locked once signed |
| State the customer sees | `Pending your review` → `Accepted` / `Rejected` / `TBC` | `Pending your review` → `Accepted` (whole bundle signed off) |
| Number format | `Variation N from Quote #X` | `Change Order N.x` on Quote #X |
| Contractual weight | A *proposal* — not yet binding | A *signed delta* on the Quote — moves the project total |

> The Variations selection footer says **"Estimated total value $X"** on purpose — these are budgetary figures. The PM may refine the numbers when bundling accepted Variations into a Change Order (final material costs, labour, tax). The customer sees the locked-in price when they sign the CO, not when they accept the Variation.

**Pipeline:**
```
Variation A (est. $12,500) ─┐
Variation B (est.  $8,500) ─┼─► customer accepts batch ─► PM finalises numbers
Variation C (est. $25,000) ─┘                                       │
                                                                    ▼
                                                       Change Order N.x (final price)
                                                                    │
                                                                  sign
                                                                    │
                                                                    ▼
                                                         Project total updates

One Change Order can bundle several accepted Variations — they ride together for a single sign-off rather than the customer signing each Variation individually. A Variation never reaches the project total on its own; only the CO that contains it does.

---

## 2. Where it lives

| Surface | Section | Notes |
|---|---|---|
| Project detail | Tile + alert badge ("N pending your review") | Entry point |
| Variations page | `#s-variations` screen | Card list, multi-select |
| Change Orders page | `#s-change-order` screen | Accepted variations bundled into CO N.x |
| Welcome modal | "N Variations pending your review" row | Quick jump on login |

---

## 3. The flow

```
Enter Variations page
        │
        ▼
Review each card  ───┐
        │            │
        ├─ Reject ──────────────► Card marked Rejected · PM notified
        │
        ├─ TBC / comment ──────► Comment dialog opens · PM follows up
        │
        └─ Add to Accept ──────► Card added to selection
                                 Footer bar shows
                                 "N Variations · est. $X"
                                          │
                                          ▼
                                 Tap "Review & Accept"
                                          │
                                          ▼
                                 Bundle summary modal
                                 (each variation, subtotal,
                                  tax, grand total)
                                          │
                                  ┌───────┴────────┐
                                  │                │
                                Cancel          Confirm
                                  │                │
                                  ▼                ▼
                              Back to list   Sign / consent step
                              (selection      (type name + agree)
                               preserved)            │
                                                     ▼
                                          Submit acceptance to platform
                                                     │
                                          ┌──────────┴──────────┐
                                          ▼                     ▼
                                  Change Order            Project total +
                                  generated under         summary cards
                                  Change Orders           update across pages
```

---

## 4. Card states & UI

| `data-status` | Badge | Date label | Actions visible |
|---|---|---|---|
| `pending your review` | "Pending your review" (amber) | `Valid until <date>` | Comment · TBC · Reject · **Add to Accept** |
| `tbc` | "To be confirmed" | `Valid until <date>` | (read-only · PM action) |
| `accepted` | "Accepted" (green) | `Accepted on <date>` | View only |
| `rejected` | "Rejected" (red) | `Rejected on <date>` | View only |
| `overdue` | "To be confirmed" | `Overdue <date>` (red) | View only |

---

## 5. Multi-select mechanics

- Each Pending card has an **"Add to Accept"** button (toggles `qr-action-btn.selected`).
- A sticky footer `#var-select-footer` appears once `≥1` card is selected:
  - **Title**: `N Variation(s) to accept`
  - **Sub**: `Estimated total value $X` (sum of `data-price` on selected cards)
  - **CTA**: `Review & Accept`
- Cancelling from the summary modal **preserves** the selection so the customer can adjust.

---

## 6. Outcomes after Accept

The customer's "Accept" on the Variations page does **two** things:

1. **Each selected Variation** is marked Accepted (badge flips, it disappears from "pending" count).
2. **A new Change Order** is created (or appended to a Pending one) on the parent Quote, with the variation bundle as its delta.
   - CO numbering follows `{base_revision}.{change_order}` — e.g. `Change Order 1.2` = base revision 1, second CO on that revision.
   - The CO row's value table shows the breakdown:
     - **Change Order N.x** line = CO's own delta (PM-side scope changes in this CO)
     - **Variation Value** line = sum of all Variations bundled into this CO
     - **New Project Total** = Previous + CO delta + Variation Value

The CO itself still needs the sign / consent step. Only once the CO is signed does the **Project Total** summary card update everywhere (Quotes / Invoices / Sales Order / Change Orders).

- Demo: Pending CO 1.2 of **+$5,000.00** moves project total from `$257,486.97` → `$262,486.97`.

---

## 7. File map

| File | Where in file |
|---|---|
| `desktop/WeProject_Desktop.html` | `<div id="s-variations">` — variation cards |
| `mobile/WeProject_mobile.html` | `<div id="s-variations">` — same card markup |
| `desktop/script.js` / inline JS | `toggleVarSelect()`, `reviewAcceptVars()`, `openVarProposal()` |
| `desktop/style.css` | `.var-card`, `.var-select-footer`, `.var-add-btn` |

---

## 8. Notes for demo

- Variations always link back to a **source Quote** — show the `from Quote #` reference prominently.
- The customer never sees draft / internal variations — only those with `status = pending your review` (or later states).
- After Accept, the **Change Orders** alert badge on detail page should increment ("1 Change to Review" becomes "2", etc.).
- Don't confuse **Variation** (single proposal awaiting customer review) with **Change Order** (the bundle of accepted variations that, once signed, hits the project total). A Variation never reaches the project total alone — only via the Change Order that contains it.
