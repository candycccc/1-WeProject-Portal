/**
 * wq-components.js — Shared component definitions for WeQuote Customer Portal
 *
 * To change nav order / hide an item: edit WQ_NAV_ITEMS → applies to all screens.
 * To update brand/contact data: edit WQ_BRAND → applies to all footers.
 */

/* ─────────────────────────────────────────────────────
   BRAND DATA — change once, updates everywhere
─────────────────────────────────────────────────────── */
const WQ_BRAND = {
  projectName: 'Amos-Yeo Foxglove - AVOIP',
  pmName:      'Tyler Holmes',
  pmRole:      'Project Manager',
  email:       'demo@example.com',
  phone:       '+1 (555) 123-4567',
  logoSrc:     'assets/images/9b2d4b7f-de0a-4f47-8ffd-6c09fd13404f.png',
};

/* ─────────────────────────────────────────────────────
   NAV ITEMS — order here = order in every dropdown
   hidden: true  → item is invisible in the menu
   badge: true   → shows "2 Actions Required" chip
─────────────────────────────────────────────────────── */
const WQ_NAV_ITEMS = [
  { screen: 'quotes',         label: 'Quotes',      badge: true },
  { screen: 'variations',     label: 'Variations' },
  { screen: 'invoices',       label: 'Invoices' },
  { screen: 'documents',      label: 'Documents' },
  { screen: 'purchase-order', label: 'Sales Order' },
  { screen: 'progress',       label: 'Progress' },
  { screen: 'warranty',       label: 'Warranty',    hidden: true },
];

/* ─────────────────────────────────────────────────────
   NAV ICONS (SVG strings keyed by screen name)
─────────────────────────────────────────────────────── */
const WQ_NAV_ICONS = {
  'quotes':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  'variations':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  'invoices':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  'documents':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
  'warranty':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  'progress':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  'purchase-order':
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
};

const WQ_QUOTES_BADGE =
  '<span class="qp-nav-alert">' +
  '<svg width="9" height="9" viewBox="0 0 16 16" fill="#cf3400">' +
  '<path d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9-3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25 1.75a.75.75 0 0 0-1.5 0V11a.75.75 0 0 0 1.5 0z"/>' +
  '</svg>2 Actions Required</span>';

/* ─────────────────────────────────────────────────────
   COMPONENT: Nav Dropdown
   Renders the full list of nav items into a container div.
   activeScreen = the screen the user is currently on.
─────────────────────────────────────────────────────── */
function wqRenderNavDropdown(containerId, activeScreen) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = WQ_NAV_ITEMS.map(function (item) {
    var isActive = item.screen === activeScreen;
    /* Quotes screen intentionally has no active highlight on itself */
    var cls = 'qp-nav-item' + (isActive && activeScreen !== 'quotes' ? ' qp-nav-item-active' : '');
    var onclick = isActive
      ? 'closeDropdowns()'
      : "go('" + item.screen + "');closeDropdowns()";
    var style = item.hidden ? ' style="display:none;"' : '';
    var badge = item.badge ? '\n        ' + WQ_QUOTES_BADGE : '';
    return (
      '      <div class="' + cls + '" onclick="' + onclick + '"' + style + '>' +
      WQ_NAV_ICONS[item.screen] +
      '\n        ' + item.label + badge +
      '\n      </div>'
    );
  }).join('\n');
}

/* ─────────────────────────────────────────────────────
   COMPONENT: Footer
   Replaces innerHTML of every .qp-footer element.
─────────────────────────────────────────────────────── */
function wqFooterHTML() {
  return (
    '\n    <div class="qp-footer-left">' +
    '\n      <div class="qp-footer-logo">' +
    '\n        <img src="' + WQ_BRAND.logoSrc + '" alt="BH"' +
    ' onerror="this.parentElement.style.background=\'var(--brand-dark)\';this.style.display=\'none\'"/>' +
    '\n      </div>' +
    '\n      <div class="qp-footer-project"><span class="brand-project-name">' + WQ_BRAND.projectName + '</span></div>' +
    '\n    </div>' +
    '\n    <div class="qp-footer-right">' +
    '\n      <div class="qp-footer-pm">' +
    '\n        <div class="qp-footer-pm-name"><span class="brand-pm-name">' + WQ_BRAND.pmName + '</span></div>' +
    '\n        <div class="qp-footer-pm-role"><span class="brand-pm-role">' + WQ_BRAND.pmRole + '</span></div>' +
    '\n      </div>' +
    '\n      <div class="qp-footer-contact">' +
    '\n        <div class="qp-footer-contact-item">' +
    '\n          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' +
    '\n          <a href="mailto:' + WQ_BRAND.email + '">' + WQ_BRAND.email + '</a>' +
    '\n        </div>' +
    '\n        <div class="qp-footer-contact-item">' +
    '\n          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.33 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-1.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
    '\n          <a href="tel:' + WQ_BRAND.phone.replace(/\s/g, '') + '">' + WQ_BRAND.phone + '</a>' +
    '\n        </div>' +
    '\n      </div>' +
    '\n    </div>\n  '
  );
}

/* ─────────────────────────────────────────────────────
   INIT
─────────────────────────────────────────────────────── */
function wqInitComponents() {
  /* Nav dropdowns — one per screen */
  wqRenderNavDropdown('nav-dropdown',          'quotes');
  wqRenderNavDropdown('nav-dropdown-inv',      'invoices');
  wqRenderNavDropdown('nav-dropdown-var',      'variations');
  wqRenderNavDropdown('nav-dropdown-po',       'purchase-order');
  wqRenderNavDropdown('nav-dropdown-progress', 'progress');
  wqRenderNavDropdown('nav-dropdown-doc',      'documents');
  wqRenderNavDropdown('nav-dropdown-warranty', 'warranty');

  /* Footers — replaces all .qp-footer instances */
  document.querySelectorAll('.qp-footer').forEach(function (el) {
    el.innerHTML = wqFooterHTML();
  });
}
// Fire immediately if DOM is ready (dynamic load), else wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wqInitComponents);
} else {
  wqInitComponents();
}
