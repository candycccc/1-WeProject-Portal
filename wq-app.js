/* ── Restore last screen on page refresh ──
   On load, if localStorage has a saved screen we navigate straight to it
   (skipping the skeleton so the restore feels instant). ── */
document.addEventListener('DOMContentLoaded', function() {
  try {
    const saved = localStorage.getItem('wq_screen');
    const known = ['login','forgot-password','dash','detail','quotes','variations',
                   'invoices','documents','warranty','progress','purchase-order'];
    if (saved && known.includes(saved) && document.getElementById('s-' + saved)) {
      // Navigate without skeleton delay for a snappy restore
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
      document.getElementById('s-' + saved).classList.add('on');
      if (saved === 'progress') initPPBars();
      const spEl = document.getElementById('sp-' + saved);
      if (spEl) { document.querySelectorAll('.sp-item').forEach(e => e.classList.remove('active')); spEl.classList.add('active'); }
      const viewEl = document.getElementById('pt-viewing-name');
      if (viewEl) viewEl.textContent = screenFriendly[saved] || saved;
    }
  } catch(e) {}
});

const screenLabels  = {
  login: '① Login', 'forgot-password': '② Forgot Password', dash: '③ Project List', detail: '④ Project Detail',
  quotes: '⑤ Quotes', invoices: '⑥ Invoices',
  variations: '⑦ Variations', 'purchase-order': '⑧ Sales Order',
  documents: '⑨ Documents', warranty: '⑩ Warranty', progress: '⑪ Progress'
};
const screenFriendly = {
  login: 'Login Page', 'forgot-password': 'Forgot Password', dash: 'Project List', detail: 'Project Detail',
  quotes: 'Quotes', invoices: 'Invoices',
  variations: 'Variations', 'purchase-order': 'Sales Order',
  documents: 'Documents', warranty: 'Warranty', progress: 'Progress'
};

/* ── Progress page state switcher ── */
// needle = today's position on the timeline (bars); filled = actual work done bars
// On track: needle ≈ filled. Delayed: needle slightly > filled. Behind: needle >> filled.
const PP_STATES = [
  { filled: 23, needle: 23, color: '#009113', text: 'Progressing as planned', pct: '70% Done',
    sub: 'Project is progressing well and on schedule.' },
  { filled: 13, needle: 16, color: '#ff9500', text: 'Delayed', pct: '32% Done',
    sub: 'Some items need attention, delays possible if not resolved.' },
  { filled: 14, needle: 20, color: '#cf3400', text: 'Behind Schedule', pct: '32% Done',
    sub: 'Project is behind schedule.' },
];
const PP_TOTAL = 29, PP_BAR_W = 14, PP_GAP = 5;

function initPPBars() {
  const container = document.getElementById('pp-bars');
  if (!container || container.children.length > 0) return;
  for (let i = 0; i < PP_TOTAL; i++) {
    const bar = document.createElement('div');
    bar.className = 'pp-bar';
    bar.style.background = i < 23 ? '#009113' : '#f3f4f8';
    container.appendChild(bar);
  }
  // Initial pointer position — use state 0's needle
  setPPPointer(PP_STATES[0].needle);
}

let currentPPStateN = 0;

// needle = today's position on the timeline (0..PP_TOTAL).
// Needle is centered on the gap between bar[needle-1] and bar[needle] —
// i.e. the boundary between filled (done) and unfilled (upcoming) bars.
function setPPPointer(needle) {
  const wrap = document.getElementById('pp-pointer-wrap');
  if (!wrap) return;
  const barsEl = document.getElementById('pp-bars');
  if (!barsEl) return;
  const containerW = barsEl.offsetWidth;
  if (!containerW) {
    requestAnimationFrame(() => setPPPointer(needle));
    return;
  }
  const gap = parseFloat(getComputedStyle(barsEl).gap) || PP_GAP;
  const barW = (containerW - (PP_TOTAL - 1) * gap) / PP_TOTAL;
  const needleW = wrap.offsetWidth || 12;
  const boundaryX = needle * (barW + gap) - gap / 2;
  const px = boundaryX - needleW / 2;
  wrap.style.left = Math.max(0, Math.min(containerW - needleW, px)) + 'px';
}

function setPPState(btn, n) {
  currentPPStateN = n;
  const s = PP_STATES[n];
  // Update toggle buttons
  document.querySelectorAll('.pp-state-btn').forEach(b => b.classList.remove('pp-active'));
  btn.classList.add('pp-active');
  // Update heading/subtitle/pct
  document.getElementById('pp-status-text').textContent = s.text;
  document.getElementById('pp-status-text').style.color = s.color;
  document.getElementById('pp-pct-done').textContent = s.pct;
  document.getElementById('pp-subtitle').textContent = s.sub;
  // Update bars
  const bars = document.querySelectorAll('#pp-bars .pp-bar');
  bars.forEach((bar, i) => {
    bar.style.background = i < s.filled ? s.color : '#f3f4f8';
  });
  // Update pointer (needle = today's timeline position, independent of fill)
  setPPPointer(s.needle);
}
function showSkeletonLayout(name) {
  // Deactivate all sk-body layouts
  document.querySelectorAll('.sk-body').forEach(el => el.classList.remove('sk-active'));
  // Activate the matching one (fallback to dash if no match)
  const target = document.getElementById('sk-layout-' + name) ||
                 document.getElementById('sk-layout-dash');
  if (target) target.classList.add('sk-active');
}

const loadedScreens = new Set();

/* ── Forgot Password helpers ── */
function showFPSuccess() {
  const emailInput = document.getElementById('fp-email');
  if (!emailInput || !emailInput.value.trim()) {
    emailInput && emailInput.focus();
    return;
  }
  const successEl = document.getElementById('fp-success');
  if (successEl) successEl.style.display = 'flex';
  // Hide the Send button and email field after success
  const btn = document.querySelector('#s-forgot-password .login-btn');
  const fg  = document.querySelector('#s-forgot-password .form-group');
  if (btn) btn.style.display = 'none';
  if (fg)  fg.style.display  = 'none';
}
function fpGoBack() {
  // Reset success state when going back
  const successEl = document.getElementById('fp-success');
  const btn = document.querySelector('#s-forgot-password .login-btn');
  const fg  = document.querySelector('#s-forgot-password .form-group');
  if (successEl) successEl.style.display = 'none';
  if (btn) btn.style.display = 'block';
  if (fg)  fg.style.display  = 'flex';
  const emailInput = document.getElementById('fp-email');
  if (emailInput) emailInput.value = '';
  go('login');
}

function go(name) {
  const overlay = document.getElementById('skeleton-overlay');
  // Close nav dropdowns only — screen panel stays open across navigation
  document.querySelectorAll('.qp-nav-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.qp-user-dropdown').forEach(d => d.classList.remove('open'));
  document.getElementById('qp-notif-overlay')?.classList.remove('open');
  document.getElementById('qp-profile-overlay')?.classList.remove('open');

  const alreadyLoaded = loadedScreens.has(name);
  loadedScreens.add(name);

  const activate = () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    const screenEl = document.getElementById('s-' + name);
    screenEl.classList.add('on');
    if (name === 'progress') initPPBars();
    document.querySelectorAll('.sp-item').forEach(el => el.classList.remove('active'));
    const spEl = document.getElementById('sp-' + name);
    if (spEl) spEl.classList.add('active');
    const viewEl = document.getElementById('pt-viewing-name');
    if (viewEl) viewEl.textContent = screenFriendly[name] || name;

    // Scroll to top — reset both window and any inner scroll container
    window.scrollTo(0, 0);
    screenEl.scrollTop = 0;
    const inner = screenEl.querySelector('.quotes-page, .invoices-page, .documents-page, .pp-page, .screen-scroll');
    if (inner) inner.scrollTop = 0;

    // Persist current screen so refresh restores same view
    // (clear on login so next open always starts at login)
    try {
      if (name === 'login') localStorage.removeItem('wq_screen');
      else localStorage.setItem('wq_screen', name);
    } catch(e) {}
  };

  const isMobile = document.body.classList.contains('mobile-view');
  if (alreadyLoaded && !isMobile) {
    // Desktop only: switch instantly for already-visited screens
    activate();
    return;
  }

  // Mobile always shows skeleton; desktop shows it only on first visit
  showSkeletonLayout(name);
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  overlay.classList.add('show');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('visible'));
  });

  setTimeout(() => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.classList.remove('show');
      activate();
    }, 200);
  }, 500);
}
function applyMobileSize(w, h) {
  const root = document.documentElement;
  root.style.setProperty('--mobile-w', w + 'px');
  root.style.setProperty('--mobile-h', h + 'px');
}

function updateDesktopSizeDisplay() {
  const content = document.getElementById('app-content');
  const r = content.getBoundingClientRect();
  document.getElementById('pt-size-w').value = Math.round(r.width);
  document.getElementById('pt-size-h').value = Math.round(window.innerHeight - 42); // subtract toolbar
}

function setViewport(mode) {
  const isMobile = mode === 'mobile';
  document.body.classList.toggle('mobile-view', isMobile);
  document.getElementById('pt-vp-desktop').classList.toggle('active', !isMobile);
  document.getElementById('pt-vp-mobile').classList.toggle('active', isMobile);
  // Recalculate progress bar pointer when switching modes (bar widths change)
  requestAnimationFrame(() => {
    if (document.getElementById('s-progress')?.classList.contains('on')) {
      const s = PP_STATES[currentPPStateN];
      if (s) setPPPointer(s.needle);
    }
  });
  const sizeCtrl = document.getElementById('pt-size-control');
  if (isMobile) {
    sizeCtrl.classList.remove('readonly');
    const w = parseInt(document.getElementById('pt-size-w').value) || 390;
    const h = parseInt(document.getElementById('pt-size-h').value) || 844;
    // Restore sensible mobile defaults if coming from desktop
    const safeW = (w > 600) ? 390 : w;
    const safeH = (h > 900) ? 844 : h;
    document.getElementById('pt-size-w').value = safeW;
    document.getElementById('pt-size-h').value = safeH;
    applyMobileSize(safeW, safeH);
  } else {
    sizeCtrl.classList.add('readonly');
    document.documentElement.style.removeProperty('--mobile-w');
    document.documentElement.style.removeProperty('--mobile-h');
    // Show current desktop viewport size after layout settles
    requestAnimationFrame(updateDesktopSizeDisplay);
  }
}

// Keep desktop size display in sync with window resize
window.addEventListener('resize', () => {
  if (!document.body.classList.contains('mobile-view')) {
    updateDesktopSizeDisplay();
  }
  // Re-calc progress bar pointer when viewport changes (flex bars change width)
  if (document.getElementById('s-progress')?.classList.contains('on')) {
    const s = PP_STATES[currentPPStateN];
    if (s) setPPPointer(s.needle);
  }
});

// Live update when user types into W or H inputs
(function() {
  function onSizeInput() {
    if (!document.body.classList.contains('mobile-view')) return;
    const w = Math.min(2400, Math.max(200, parseInt(document.getElementById('pt-size-w').value) || 390));
    const h = Math.min(1600, Math.max(300, parseInt(document.getElementById('pt-size-h').value) || 844));
    applyMobileSize(w, h);
  }
  // Use 'change' (on blur/Enter) for a snappy feel; 'input' for live
  document.getElementById('pt-size-w')?.addEventListener('input', onSizeInput);
  document.getElementById('pt-size-h')?.addEventListener('input', onSizeInput);
  // Also allow Enter key to confirm
  [document.getElementById('pt-size-w'), document.getElementById('pt-size-h')].forEach(el => {
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') { el.blur(); onSizeInput(); } });
  });
})();

function isWideViewport() { return window.innerWidth >= 1440; }

function toggleScreenPanel(e) {
  e.stopPropagation();
  const panel = document.getElementById('screen-panel');
  const btn   = document.getElementById('screen-picker-btn');
  const isOpen = panel.classList.toggle('open');
  btn.classList.toggle('panel-open', isOpen);
  document.body.classList.toggle('screen-open', isOpen);
  // Only close brand panel when narrow — at ≥1400px both can coexist
  if (isOpen && !isWideViewport()) {
    const brandPanel = document.getElementById('brand-panel');
    brandPanel.classList.remove('open');
    document.body.classList.remove('brand-open');
  }
}
function pickScreen(name, label, el) {
  // Keep the screen panel open — don't hide it on navigate
  go(name);
}
document.getElementById('screen-panel')?.addEventListener('click', e => e.stopPropagation());
document.getElementById('proto-toolbar')?.addEventListener('click', e => e.stopPropagation());
// Close the screen panel only when the user clicks the bare wrapper area
// (outside both the panel and app content). Clicks INSIDE the content
// are page-navigation actions — the panel should stay open through those.
document.addEventListener('click', (e) => {
  if (!isWideViewport()) {
    const inContent = e.target.closest('#app-content');
    const inPanel   = e.target.closest('#screen-panel');
    const inToolbar = e.target.closest('#proto-toolbar');
    // At <1400px: only dismiss screen panel on outside-click when brand panel is also open
    // (the two panels conflict at narrow widths; when brand is closed there's no reason to dismiss)
    const brandOpen = document.getElementById('brand-panel')?.classList.contains('open');
    if (!inContent && !inPanel && !inToolbar && brandOpen) {
      document.getElementById('screen-panel').classList.remove('open');
      document.getElementById('screen-picker-btn').classList.remove('panel-open');
      document.body.classList.remove('screen-open');
    }
  }
});

function switchTab(t) {
  const isActive = t === 'active';
  const ta = document.getElementById('tab-active');
  const tb = document.getElementById('tab-archived');
  ta.classList.toggle('active', isActive);
  tb.classList.toggle('active', !isActive);
  document.getElementById('cards-active').style.display   = isActive ? 'grid' : 'none';
  document.getElementById('cards-archived').style.display = !isActive ? 'grid' : 'none';
}

// Map filter tab label text → badge CSS class suffix
const QUOTE_FILTER_MAP = {
  'pending your review': 'qr-badge-pending',
  'to be confirmed':     'qr-badge-tbc',
  'accepted':            'qr-badge-accepted',
  'declined':            'qr-badge-declined',
};
const INV_FILTER_MAP = {
  'unpaid':   'inv-badge-unpaid',
  'paid':     'inv-badge-paid',
  'upcoming': 'inv-badge-upcoming',
};

function filterTab(btn) {
  // 1. Scope active state to only the tabs inside this screen
  const tabsContainer = btn.closest('.qp-filter-tabs');
  tabsContainer.querySelectorAll('.qp-filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // 2. Get the filter label (strip the numeric count)
  const label = btn.textContent.replace(/\d+/g, '').trim().toLowerCase();

  // 3. Find the screen this tab belongs to
  const screen = btn.closest('.screen');
  if (!screen) return;

  // 4. Show all on "all"
  if (label === 'all') {
    screen.querySelectorAll('.qr, .inv-row').forEach(r => r.style.display = '');
    return;
  }

  // 5. Quote / Variation rows (use .qr-badge-* classes)
  if (QUOTE_FILTER_MAP[label]) {
    const badgeClass = QUOTE_FILTER_MAP[label];
    screen.querySelectorAll('.qr').forEach(r => {
      r.style.display = r.querySelector('.' + badgeClass) ? '' : 'none';
    });
    return;
  }

  // 6. Invoice rows (use .inv-badge-* classes)
  if (INV_FILTER_MAP[label]) {
    const badgeClass = INV_FILTER_MAP[label];
    screen.querySelectorAll('.inv-row').forEach(r => {
      r.style.display = r.querySelector('.' + badgeClass) ? '' : 'none';
    });
  }
}

// Legacy alias kept for any existing onclick="filterQuotes(this)" references
const filterQuotes = filterTab;

/* ── Accept card interaction ──
   Click Accept → card transitions to Accepted state with animation.
   Works for both Quotes (#s-quotes) and Variations (#s-variations). ── */
function acceptCard(btn) {
  const card = btn.closest('.qr');
  if (!card) return;

  // Prevent double-fire
  if (card.classList.contains('qr-accepting')) return;

  // Determine label suffix (Quote vs Variation)
  const isVariation = !!card.closest('#s-variations');
  const viewLabel   = isVariation ? 'View Variation' : 'View Quote';

  // Format today as "14 April 2026"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Pull the total from the existing orig column
  const origValEl = card.querySelector('.qr-orig-val');
  const total = origValEl ? origValEl.textContent.trim() : '$0.00';

  // ── Phase 1: green border flash ──
  card.classList.add('qr-accepting');

  // ── Phase 2: fade-out action buttons (200ms) ──
  const actionsEl = card.querySelector('.qr-actions');
  if (actionsEl) {
    actionsEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease, max-height 0.25s ease';
    actionsEl.style.opacity    = '0';
    actionsEl.style.transform  = 'translateY(6px)';
    actionsEl.style.overflow   = 'hidden';
    actionsEl.style.maxHeight  = actionsEl.scrollHeight + 'px';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      actionsEl.style.maxHeight = '0';
    }));
  }

  setTimeout(() => {
    // ── Phase 3: swap badge + date ──
    const badge = card.querySelector('.qr-badge');
    if (badge) {
      badge.className   = 'qr-badge qr-badge-accepted';
      badge.textContent = 'Accepted';
    }
    const dateEl = card.querySelector('.qr-date');
    if (dateEl) {
      dateEl.className   = 'qr-date qr-date-accepted';
      dateEl.textContent = 'Accepted on ' + dateStr;
    }

    // Log to Portal Activity
    logActivity('You approved', cardRef(card));

    // ── Phase 4: replace actions with payment progress ──
    const paymentHTML = `
      <div class="qr-payment qr-payment-enter">
        <div class="qr-payment-label">Payment Progress</div>
        <div class="qr-payment-amount-row">
          <span class="qr-payment-big">$0.00</span>
          <span class="qr-payment-of">of ${total} Paid so far</span>
        </div>
        <div class="qr-payment-bar">
          <div class="qr-payment-bar-seg seg-paid" style="width:0%;"></div>
          <div class="qr-payment-bar-seg seg-due"  style="width:0%;"></div>
        </div>
        <div class="qr-payment-legend">
          <div class="qr-legend-item">
            <div class="qr-legend-dot-row"><div class="qr-legend-dot" style="background:#009113;"></div>Paid so far <span>0%</span></div>
            <div class="qr-legend-val">$0.00</div>
          </div>
          <div class="qr-legend-item">
            <div class="qr-legend-dot-row"><div class="qr-legend-dot" style="background:#cf3400;"></div>To pay now <span>0%</span></div>
            <div class="qr-legend-val">$0.00</div>
          </div>
          <div class="qr-legend-item">
            <div class="qr-legend-dot-row"><div class="qr-legend-dot" style="background:#eaeaea;"></div>Upcoming <span>100%</span></div>
            <div class="qr-legend-val">${total}</div>
          </div>
        </div>
      </div>`;
    if (actionsEl) actionsEl.outerHTML = paymentHTML;

    // ── Phase 5: fade-in payment section ──
    const payEl = card.querySelector('.qr-payment');
    if (payEl) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        payEl.classList.remove('qr-payment-enter');
        payEl.classList.add('qr-payment-entered');
      }));
    }

    // ── Phase 6: settle — remove flash class, add subtle accepted glow ──
    setTimeout(() => {
      card.classList.remove('qr-accepting');
      card.classList.add('qr-accepted-done');
      setTimeout(() => card.classList.remove('qr-accepted-done'), 800);

      // ── Phase 7: re-sort list so Pending cards bubble to the top ──
      const listEl = card.closest('.qp-list');
      if (listEl) resortCardList(listEl);
    }, 350);

  }, 250);
}

/* ── Re-sort card list after a state change ──
   Priority order: Pending → TBC → Accepted → Declined
   Uses FLIP animation so cards visually slide to new positions. ── */
function resortCardList(listEl) {
  const cards = Array.from(listEl.querySelectorAll(':scope > .qr'));
  if (cards.length < 2) return;

  function priority(card) {
    if (card.querySelector('.qr-badge-pending'))  return 0;
    if (card.querySelector('.qr-badge-tbc'))       return 1;
    if (card.querySelector('.qr-badge-accepted'))  return 2;
    if (card.querySelector('.qr-badge-declined'))  return 3;
    return 4;
  }

  // Check if already sorted — skip animation if nothing to move
  const priorities = cards.map(priority);
  const alreadySorted = priorities.every((p, i) => i === 0 || priorities[i - 1] <= p);
  if (alreadySorted) return;

  // FLIP — record First positions
  const firstRects = cards.map(c => c.getBoundingClientRect());

  // Re-append in sorted order (stable sort preserves relative order within group)
  const sorted = cards
    .map((c, i) => ({ c, i, p: priority(c) }))
    .sort((a, b) => a.p !== b.p ? a.p - b.p : a.i - b.i)
    .map(x => x.c);
  sorted.forEach(c => listEl.appendChild(c));

  // FLIP — record Last positions, apply Inverted transforms instantly
  sorted.forEach((card, newIdx) => {
    const oldIdx  = cards.indexOf(card);
    const dy = firstRects[oldIdx].top - card.getBoundingClientRect().top;
    if (dy === 0) return;
    card.style.transition = 'none';
    card.style.transform  = `translateY(${dy}px)`;
  });

  // FLIP — Play: animate to natural position
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sorted.forEach(card => {
      card.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';
      card.style.transform  = '';
    });
    setTimeout(() => sorted.forEach(c => { c.style.transition = ''; c.style.transform = ''; }), 480);
  }));
}

/* ── TBC card interaction ──
   Badge → "To be confirmed", date class → tbc, keep action buttons
   (card is still actionable — user can still Accept or Reject). ── */
function tbcCard(btn) {
  const card = btn.closest('.qr');
  if (!card) return;
  if (card.classList.contains('qr-tbc-ing')) return;

  // ── Phase 1: grey border flash ──
  card.classList.add('qr-tbc-ing');

  setTimeout(() => {
    // ── Phase 2: swap badge + date ──
    const badge = card.querySelector('.qr-badge');
    if (badge) {
      badge.className   = 'qr-badge qr-badge-tbc';
      badge.textContent = 'To be confirmed';
    }
    const dateEl = card.querySelector('.qr-date');
    if (dateEl) {
      // Keep existing date text — just update the colour class
      dateEl.className = 'qr-date qr-date-tbc';
    }

    // Log to Portal Activity
    logActivity('You marked as TBC', cardRef(card));

    // ── Phase 3: settle ──
    card.classList.remove('qr-tbc-ing');
    card.classList.add('qr-tbc-done');
    setTimeout(() => card.classList.remove('qr-tbc-done'), 700);
  }, 180);
}

/* ── Reject card interaction ──
   Badge → "Declined", date → "Declined on [today]",
   action buttons collapse out, card becomes view-only. ── */
function rejectCard(btn) {
  const card = btn.closest('.qr');
  if (!card) return;
  if (card.classList.contains('qr-rejecting')) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Phase 1: red border flash ──
  card.classList.add('qr-rejecting');

  // ── Phase 2: collapse action buttons ──
  const actionsEl = card.querySelector('.qr-actions');
  if (actionsEl) {
    actionsEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease, max-height 0.25s ease';
    actionsEl.style.opacity    = '0';
    actionsEl.style.transform  = 'translateY(6px)';
    actionsEl.style.overflow   = 'hidden';
    actionsEl.style.maxHeight  = actionsEl.scrollHeight + 'px';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      actionsEl.style.maxHeight = '0';
    }));
  }

  setTimeout(() => {
    // ── Phase 3: swap badge + date ──
    const badge = card.querySelector('.qr-badge');
    if (badge) {
      badge.className   = 'qr-badge qr-badge-declined';
      badge.textContent = 'Declined';
    }
    const dateEl = card.querySelector('.qr-date');
    if (dateEl) {
      dateEl.className   = 'qr-date qr-date-declined';
      dateEl.textContent = 'Declined on ' + dateStr;
    }

    // Log to Portal Activity
    logActivity('You rejected', cardRef(card));

    // ── Phase 4: remove actions entirely → empty slot ──
    if (actionsEl) actionsEl.outerHTML = '<div></div>';

    // ── Phase 5: settle + re-sort so Declined drops to bottom ──
    card.classList.remove('qr-rejecting');
    card.classList.add('qr-rejected-done');
    setTimeout(() => card.classList.remove('qr-rejected-done'), 800);

    const listEl = card.closest('.qp-list');
    if (listEl) resortCardList(listEl);
  }, 250);
}


function searchQuotes(input) {
  const term = (typeof input === 'string' ? input : input.value).trim().toLowerCase();
  // Scope search to the screen that contains this input
  const el = typeof input === 'string' ? null : input;
  const screen = el ? el.closest('.screen') : document.querySelector('.screen.on');
  if (!screen) return;
  const rows = screen.querySelectorAll('.qr, .inv-row');
  rows.forEach(row => {
    if (!term) { row.style.display = ''; return; }
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
}

function toggleNavDropdown(e) {
  e.stopPropagation();
  // Find dropdown relative to the clicked pill's topbar (works for all screens)
  const topbar = e.currentTarget.closest('.qp-topbar');
  const nd = topbar ? topbar.querySelector('.qp-nav-dropdown') : document.getElementById('nav-dropdown');
  // Close all other nav dropdowns and user dropdowns
  document.querySelectorAll('.qp-nav-dropdown').forEach(d => { if (d !== nd) d.classList.remove('open'); });
  document.querySelectorAll('.qp-user-dropdown').forEach(d => d.classList.remove('open'));
  nd.classList.toggle('open');
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  // Find the dropdown inside the clicked avatar (works on any screen)
  const avatar = e.currentTarget;
  const dropdown = avatar.querySelector('.qp-user-dropdown');
  // Close all dropdowns first
  closeDropdowns();
  // Toggle this one
  if (dropdown) dropdown.classList.toggle('open');
}

function closeDropdowns() {
  document.querySelectorAll('.qp-nav-dropdown').forEach(d => d.classList.remove('open'));
  document.getElementById('screen-panel')?.classList.remove('open');
  document.getElementById('screen-picker-btn')?.classList.remove('panel-open');
  document.body.classList.remove('screen-open');
  document.querySelectorAll('.qp-user-dropdown').forEach(d => d.classList.remove('open'));
}

// Close nav/user dropdowns on any outside click (but not screen panel — that has its own triggers)
document.addEventListener('click', function() {
  document.querySelectorAll('.qp-nav-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.qp-user-dropdown').forEach(d => d.classList.remove('open'));
});

// ── Branding snapshot (for Cancel) ──
let _brandSnapshot = null;
function captureBrandSnapshot() {
  _brandSnapshot = {
    accent: getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim(),
    font:   document.getElementById('bp-font')?.value || 'Figtree',
    mode:   document.body.classList.contains('dark-mode') ? 'dark' : 'light',
    photo:  document.querySelector('.bp-photo-opt.selected')?.dataset.photo || '',
    poweredBy: document.getElementById('bp-powered-toggle')?.classList.contains('on') ?? true,
  };
}
function saveBranding(e) {
  e && e.stopPropagation();
  _brandSnapshot = null;
  closeBrandPanel();
}
function cancelBranding(e) {
  e && e.stopPropagation();
  if (_brandSnapshot) {
    applyAccent(_brandSnapshot.accent);
    document.getElementById('bp-color-picker').value = _brandSnapshot.accent;
    updateHex(_brandSnapshot.accent);
    applyFont(_brandSnapshot.font);
    document.getElementById('bp-font').value = _brandSnapshot.font;
    setMode(_brandSnapshot.mode);
    const photoOpts = document.querySelectorAll('.bp-photo-opt');
    photoOpts.forEach(o => {
      o.classList.toggle('selected', o.dataset.photo === _brandSnapshot.photo);
    });
    if (!_brandSnapshot.poweredBy) {
      document.getElementById('bp-powered-toggle')?.classList.remove('on');
    } else {
      document.getElementById('bp-powered-toggle')?.classList.add('on');
    }
  }
  closeBrandPanel();
}
function closeBrandPanel() {
  const panel = document.getElementById('brand-panel');
  panel.classList.remove('open');
  document.body.classList.remove('brand-open');
}

// ── Panel toggle ──
function toggleBrandPanel(e) {
  e.stopPropagation();
  const panel = document.getElementById('brand-panel');
  // Never open brand panel if Edit Profile is open
  const profileOpen = document.getElementById('qp-profile-overlay')?.classList.contains('open');
  if (!panel.classList.contains('open') && profileOpen) return;
  const opening = !panel.classList.contains('open');
  if (opening) captureBrandSnapshot();
  panel.classList.toggle('open');
  document.body.classList.toggle('brand-open', panel.classList.contains('open'));
  // Close other panels when opening; at ≥1400px screen panel can stay open alongside
  if (panel.classList.contains('open')) {
    closeProfilePanel();
    closeNotifPanel();
    if (!isWideViewport()) {
      document.getElementById('screen-panel')?.classList.remove('open');
      document.getElementById('screen-picker-btn')?.classList.remove('panel-open');
      document.body.classList.remove('screen-open');
    }
  }
}
document.getElementById('brand-panel')?.addEventListener('click', e => e.stopPropagation());

// ── Luminance / contrast helpers ──
function hexLuminance(hex) {
  // WCAG relative luminance from sRGB
  const ch = (v) => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return 0.2126*ch(r) + 0.7152*ch(g) + 0.0722*ch(b);
}
// Returns '#000000' or '#ffffff' — whichever gives more contrast against bg
function contrastColor(hex) {
  return hexLuminance(hex) > 0.35 ? '#000000' : '#ffffff';
}

// ── HSL helpers ──
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){ case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; }
    h /= 6;
  }
  return [h*360, s*100, l*100];
}
function hslToHex(h,s,l) {
  h/=360; s/=100; l/=100;
  let r,g,b;
  if(s===0){r=g=b=l;}else{
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  const toH=x=>Math.round(Math.max(0,Math.min(255,x*255))).toString(16).padStart(2,'0');
  return '#'+toH(r)+toH(g)+toH(b);
}
function deriveTokens(accent) {
  const [h,s,l] = hexToHsl(accent);
  return {
    dark:   hslToHex(h, s*0.60, l*0.67),
    muted:  hslToHex(h, s*0.33, l*0.79),
    bg:     hslToHex(h, Math.min(s*0.48, 20), 97),
    bgCard: hslToHex(h, Math.min(s*0.36, 16), 94),
  };
}

// ── Light / Dark token appliers ──
function applyLightTokens(hex) {
  const t = deriveTokens(hex);
  const root = document.documentElement;
  root.style.setProperty('--brand-accent',  hex);
  root.style.setProperty('--brand-dark',    t.dark);
  root.style.setProperty('--brand-muted',   t.muted);
  root.style.setProperty('--brand-bg',      t.bg);
  root.style.setProperty('--brand-bg-card', t.bgCard);
  // clear any dark-mode inline overrides on neutral tokens + hero rgb + frosted
  ['--c-surface','--c-surface-2','--c-footer-bg','--c-hover',
   '--c-border-1','--c-border-2','--c-border-3','--c-separator',
   '--c-text-1','--c-text-2','--c-text-muted','--c-shadow','--hero-rgb',
   '--c-frosted-bg'].forEach(v => root.style.removeProperty(v));
  const chip = document.getElementById('bp-bg-chip');
  if (chip) chip.style.background = t.bg;
}

function applyDarkTokens(hex) {
  const [h, s] = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty('--brand-accent',  hex);
  // brand tokens — dark-mode variants
  root.style.setProperty('--brand-bg',      hslToHex(h, Math.min(s*0.25, 12), 10));
  root.style.setProperty('--brand-bg-card', hslToHex(h, Math.min(s*0.20, 10), 13));
  root.style.setProperty('--brand-dark',    hslToHex(h, Math.min(s*0.55, 35), 62));
  root.style.setProperty('--brand-muted',   hslToHex(h, Math.min(s*0.20, 15), 52));
  // neutral tokens — all derived from the accent hue
  root.style.setProperty('--c-surface',    hslToHex(h, Math.min(s*0.30, 14), 12));
  root.style.setProperty('--c-surface-2',  hslToHex(h, Math.min(s*0.25, 12), 15));
  root.style.setProperty('--c-footer-bg',  hslToHex(h, Math.min(s*0.30, 14),  9));
  root.style.setProperty('--c-hover',      hslToHex(h, Math.min(s*0.25, 12), 18));
  root.style.setProperty('--c-border-1',   hslToHex(h, Math.min(s*0.30, 16), 20));
  root.style.setProperty('--c-border-2',   hslToHex(h, Math.min(s*0.25, 14), 23));
  root.style.setProperty('--c-border-3',   hslToHex(h, Math.min(s*0.22, 12), 26));
  root.style.setProperty('--c-separator',  hslToHex(h, Math.min(s*0.25, 12), 16));
  root.style.setProperty('--c-text-1',     hslToHex(h, Math.min(s*0.12,  7), 85));
  root.style.setProperty('--c-text-2',     hslToHex(h, Math.min(s*0.08,  4), 93));
  root.style.setProperty('--c-text-muted', hslToHex(h, Math.min(s*0.18,  9), 42));
  root.style.setProperty('--c-shadow',     'rgba(0,0,0,0.35)');
  // Dark mode frosted buttons use var(--c-surface) via CSS — no JS override needed
  // hero gradient overlay tint — derive dark RGB from accent hue
  const heroHex = hslToHex(h, Math.min(s*0.40, 22), 8);
  const hr = parseInt(heroHex.slice(1,3),16), hg2 = parseInt(heroHex.slice(3,5),16), hb2 = parseInt(heroHex.slice(5,7),16);
  root.style.setProperty('--hero-rgb', `${hr},${hg2},${hb2}`);
  const chip = document.getElementById('bp-bg-chip');
  if (chip) chip.style.background = hslToHex(h, Math.min(s*0.25, 12), 10);
}

// ── Accent colour ──
function applyAccent(hex) {
  if (currentMode === 'dark') {
    applyDarkTokens(hex);
  } else {
    applyLightTokens(hex);
  }
  // Auto-switch on-accent text to black or white based on luminance
  document.documentElement.style.setProperty('--c-on-accent', contrastColor(hex));
  // Also compute --c-on-dark from the derived --brand-dark token
  const darkHex = getComputedStyle(document.documentElement).getPropertyValue('--brand-dark').trim();
  if (darkHex) document.documentElement.style.setProperty('--c-on-dark', contrastColor(darkHex));
}
function updateHex(hex) {
  document.getElementById('bp-color-hex').textContent = hex;
}
function pickSwatch(el) {
  deselectSwatches();
  el.classList.add('selected');
  const hex = el.dataset.color;
  applyAccent(hex);
  updateHex(hex);
  document.getElementById('bp-color-picker').value = hex;
}
function deselectSwatches() {
  document.querySelectorAll('.bp-color-swatch').forEach(s => s.classList.remove('selected'));
}

// ── Dark / Light mode ──
let currentMode = 'light';
function updateOnTokens() {
  // Re-compute --c-on-accent and --c-on-dark after any token change
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim();
  const dark   = getComputedStyle(document.documentElement).getPropertyValue('--brand-dark').trim();
  if (accent) document.documentElement.style.setProperty('--c-on-accent', contrastColor(accent));
  if (dark)   document.documentElement.style.setProperty('--c-on-dark',   contrastColor(dark));
}
function setMode(mode) {
  currentMode = mode;
  // read accent from inline style first (set by applyAccent), fall back to computed
  const accent = (document.documentElement.style.getPropertyValue('--brand-accent').trim() ||
                  getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim());
  if (mode === 'dark') {
    document.body.classList.add('dark-mode');
    applyDarkTokens(accent);
  } else {
    document.body.classList.remove('dark-mode');
    applyLightTokens(accent);
  }
  updateOnTokens();
  document.getElementById('bp-light-btn').classList.toggle('active', mode === 'light');
  document.getElementById('bp-dark-btn').classList.toggle('active',  mode === 'dark');
}

// ── Font ──
const loadedFonts = new Set(['Figtree', 'Mulish']);
function applyFont(font) {
  if (!loadedFonts.has(font)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(font);
  }
  document.documentElement.style.setProperty('--brand-font', `'${font}', sans-serif`);
}

// ── Login photo ──
function pickPhoto(el) {
  document.querySelectorAll('.bp-photo-opt').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  const url = el.dataset.photo;
  const photoEl = document.querySelector('.login-photo');
  if (url) {
    photoEl.style.backgroundImage = "url('" + url + "')";
  } else {
    photoEl.style.backgroundImage = 'linear-gradient(135deg,#2c3e50,#3498db)';
  }
}

// ── Edit Profile panel ──
function openProfilePanel() {
  closeDropdowns();
  // Close all other panels first
  const brand = document.getElementById('brand-panel');
  brand.classList.remove('open');
  document.body.classList.remove('brand-open');
  closeNotifPanel();
  document.getElementById('qp-profile-overlay').classList.add('open');
  // Always scroll body back to top when opening
  const body = document.querySelector('.qp-profile-body');
  if (body) body.scrollTop = 0;
}
function closeProfilePanel() {
  document.getElementById('qp-profile-overlay').classList.remove('open');
}
function togglePwVis(btn) {
  const input = btn.previousElementSibling;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Notifications panel ──
let notifReadFilter = 'all';   // 'all' | 'unread' | 'read'
let notifCatFilter  = 'all';   // 'all' | 'quote' | 'invoice' | 'accepted' | 'declined'

function toggleNotifPanel(e) {
  if (e) e.stopPropagation();
  const overlay = document.getElementById('qp-notif-overlay');
  const opening = !overlay.classList.contains('open');
  overlay.classList.toggle('open');
  if (opening) {
    closeProfilePanel();
    const brand = document.getElementById('brand-panel');
    brand?.classList.remove('open');
    document.body.classList.remove('brand-open');
    resetNotifPanel(); // always opens on "All" tab
  }
}
function resetNotifPanel() {
  switchNotifTab('notif');
  notifReadFilter = 'all';
  notifCatFilter  = 'all';
  // Reset toggles (desktop + mobile)
  document.getElementById('toggle-unread')?.classList.remove('on');
  document.getElementById('toggle-unread-mobile')?.classList.remove('on');
  // Reset category pills
  document.querySelectorAll('.qp-notif-cat-pill').forEach((p,i) => p.classList.toggle('active', i === 0));
  // Show all items
  document.querySelectorAll('#notif-panel-notif .qp-notif-item').forEach(item => item.style.display = '');
}
function closeNotifPanel(e) {
  if (e) e.stopPropagation();
  document.getElementById('qp-notif-overlay').classList.remove('open');
}

// ── iOS-style swipe-down to close notification bottom sheet ──
(function initNotifSwipe() {
  const overlay = document.getElementById('qp-notif-overlay');
  const panel   = overlay?.querySelector('.qp-notif-panel');
  if (!panel) return;

  let startY = 0, startScrollTop = 0, currentDelta = 0, dragging = false;

  panel.addEventListener('touchstart', e => {
    // Only activate swipe when in mobile bottom-sheet mode
    if (!document.body.classList.contains('mobile-view')) return;
    startY = e.touches[0].clientY;
    // Record the scroll position of the panel body at the start of the touch
    const body = panel.querySelector('.qp-notif-body:not([style*="display: none"]):not([style*="display:none"])');
    startScrollTop = body ? body.scrollTop : 0;
    currentDelta = 0;
    dragging = false; // will be set true only when we confirm downward pull gesture
    panel.classList.add('notif-dragging');
  }, { passive: true });

  panel.addEventListener('touchmove', e => {
    if (!document.body.classList.contains('mobile-view')) return;
    const dy = e.touches[0].clientY - startY;
    // Only intercept if swiping DOWN and the panel body is scrolled to the top
    if (dy > 0 && startScrollTop <= 0) {
      dragging = true;
      e.preventDefault(); // block background from scrolling
      currentDelta = dy;
      panel.style.transform = `translateY(${dy}px)`;
    } else {
      // Upward swipe or body has scroll — let it scroll normally
      dragging = false;
      panel.classList.remove('notif-dragging');
    }
  }, { passive: false }); // must be non-passive to call preventDefault

  panel.addEventListener('touchend', () => {
    panel.classList.remove('notif-dragging');
    if (!dragging) { currentDelta = 0; return; }
    dragging = false;
    if (currentDelta > 80) {
      // Dismiss: slide fully off-screen, then close
      panel.style.transform = `translateY(${panel.offsetHeight}px)`;
      setTimeout(() => {
        overlay.classList.remove('open');
        panel.style.transform = '';
      }, 300);
    } else {
      // Snap back
      panel.style.transform = '';
    }
    currentDelta = 0;
  });
})();
function switchNotifTab(tab) {
  const bar = document.getElementById('notif-tab-bar');
  document.getElementById('notif-tab-notif').classList.toggle('active', tab === 'notif');
  document.getElementById('notif-tab-activity').classList.toggle('active', tab === 'activity');
  bar.classList.toggle('right', tab === 'activity');
  document.getElementById('notif-panel-notif').style.display    = tab === 'notif'    ? '' : 'none';
  document.getElementById('notif-panel-activity').style.display = tab === 'activity' ? '' : 'none';
  // Update heading title to match active tab
  const heading = document.querySelector('.qp-notif-heading');
  if (heading) heading.textContent = tab === 'activity' ? 'Portal Activity' : 'Notifications';
  // Filter pills + desktop toggles only relevant for Notifications tab
  // Mobile "Only show unread" pill stays visible on both tabs (per Figma 1059-1230)
  const pillsEl    = document.getElementById('notif-cat-pills');
  const toggleEl   = document.querySelector('.qp-notif-toggles');
  const mobileFootEl = document.querySelector('.qp-notif-mobile-footer');
  if (pillsEl)   pillsEl.style.display  = tab === 'notif' ? '' : 'none';
  if (toggleEl)  toggleEl.style.display = tab === 'notif' ? '' : 'none';
  if (mobileFootEl) mobileFootEl.style.display = '';
}

/// ── Toggle: Only show unread — syncs desktop header toggle + mobile bottom pill ──
function toggleReadFilter(mode) {
  if (notifReadFilter === mode) {
    notifReadFilter = 'all';
    document.getElementById('toggle-' + mode)?.classList.remove('on');
    document.getElementById('toggle-' + mode + '-mobile')?.classList.remove('on');
  } else {
    notifReadFilter = mode;
    document.getElementById('toggle-' + mode)?.classList.add('on');
    document.getElementById('toggle-' + mode + '-mobile')?.classList.add('on');
  }
  applyNotifFilters();
}

// ── Category pills ──
function setNotifCatPill(cat, el) {
  notifCatFilter = cat;
  document.querySelectorAll('.qp-notif-cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  applyNotifFilters();
}

function applyNotifFilters() {
  document.querySelectorAll('#notif-panel-notif .qp-notif-item').forEach(item => {
    const catOk  = (notifCatFilter === 'all' || item.dataset.type === notifCatFilter);
    const readOk = (notifReadFilter === 'all') ||
                   (notifReadFilter === 'unread' && item.dataset.unread === 'true') ||
                   (notifReadFilter === 'read'   && item.dataset.unread === 'false');
    item.style.display = (catOk && readOk) ? '' : 'none';
  });
}

// ── Portal Activity logger ──
// Call this whenever the user performs a notable action.
// action  = e.g. "You approved", "You rejected", "You marked as TBC"
// ref     = e.g. "Quote #23944 – Home Automation"
function logActivity(action, ref) {
  const activityBody = document.getElementById('notif-panel-activity');
  if (!activityBody) return;

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
  const h = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${h % 12 || 12}:${m}${h >= 12 ? 'pm' : 'am'}`;

  const item = document.createElement('div');
  item.className = 'qp-activity-item qp-activity-item-new';
  item.innerHTML =
    `<div class="qp-activity-avatar">MM</div>` +
    `<div class="qp-activity-content">` +
      `<div class="qp-activity-action">${action} – ${ref}</div>` +
      `<div class="qp-activity-time">` +
        `<span>${dateStr}</span>` +
        `<span class="qp-activity-time-dot"></span>` +
        `<span>${timeStr}</span>` +
      `</div>` +
    `</div>`;

  activityBody.insertBefore(item, activityBody.firstChild);
  // Flash highlight
  requestAnimationFrame(() => item.classList.add('qp-activity-item-flash'));
  setTimeout(() => item.classList.remove('qp-activity-item-flash'), 1200);
}

// Helper: extract "Quote #23944 – Home Automation" from a card element
function cardRef(card) {
  const num   = card.querySelector('.qr-number')?.textContent.trim()  || '';
  const title = card.querySelector('.qr-title')?.textContent.trim()   || '';
  return title ? `${num} – ${title}` : num;
}

// ── Comment dialog ──
let commentDialogRef = '';

// ── Visual Viewport: keep comment overlay filling the visible area above keyboard ──
function _vvCommentResize() {
  var o = document.getElementById('qp-comment-overlay');
  if (!o || !o.classList.contains('open')) return;
  var vv = window.visualViewport;
  if (!vv) return;
  o.style.top    = vv.offsetTop  + 'px';
  o.style.left   = vv.offsetLeft + 'px';
  o.style.width  = vv.width      + 'px';
  o.style.height = vv.height     + 'px';
}

function openCommentDialog(ref) {
  commentDialogRef = ref;
  var overlay = document.getElementById('qp-comment-overlay');
  var refEl   = document.getElementById('comment-ref-text');
  var ta      = document.getElementById('comment-textarea');
  if (refEl) refEl.textContent = ref;
  if (ta)    ta.value = '';

  // Switch to position:fixed so keyboard doesn't bury the dialog
  overlay.style.position = 'fixed';
  overlay.style.top      = '0';
  overlay.style.right    = '0';
  overlay.style.bottom   = '0';
  overlay.style.left     = '0';
  overlay.style.width    = '';
  overlay.style.height   = '';

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', _vvCommentResize);
    window.visualViewport.addEventListener('scroll', _vvCommentResize);
  }

  overlay.classList.add('open');
  setTimeout(function() { if (ta) ta.focus(); }, 120);
}

function closeCommentDialog() {
  var overlay = document.getElementById('qp-comment-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  // Restore to CSS-driven absolute positioning
  overlay.style.position = '';
  overlay.style.top = overlay.style.right = overlay.style.bottom = overlay.style.left = '';
  overlay.style.width = overlay.style.height = '';
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', _vvCommentResize);
    window.visualViewport.removeEventListener('scroll', _vvCommentResize);
  }
}

function submitComment() {
  const ta   = document.getElementById('comment-textarea');
  const note = ta?.value?.trim();
  // Close even if empty — user may have changed mind
  closeCommentDialog();
  if (!note) return;

  // Format timestamp
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
  const h       = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
  const ampm    = h >= 12 ? 'pm' : 'am';
  const timeStr = `${h % 12 || 12}:${m}${ampm}`;

  // Build new activity item
  const item = document.createElement('div');
  item.className = 'qp-activity-item';
  item.innerHTML =
    `<div class="qp-activity-avatar">MM</div>` +
    `<div class="qp-activity-content">` +
      `<div class="qp-activity-action">You left a note – ${commentDialogRef}</div>` +
      `<div class="qp-activity-time">` +
        `<span>${dateStr}</span>` +
        `<span class="qp-activity-time-dot"></span>` +
        `<span>${timeStr}</span>` +
      `</div>` +
    `</div>`;

  // Prepend to activity list (newest first)
  const activityBody = document.getElementById('notif-panel-activity');
  if (activityBody) {
    activityBody.insertBefore(item, activityBody.firstChild);
  }

  // Switch to Portal Activity tab
  switchNotifTab('activity');
}

// ── Logo ──
function applyLogo(url) {
  ['brand-logo', 'brand-logo-fp'].forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    if (url) { img.src = url; img.style.display = ''; }
    else { img.style.display = 'none'; }
  });
}

// ── Generic text updater ──
function applyText(cls, value) {
  document.querySelectorAll('.' + cls).forEach(el => el.textContent = value);
}

// ── Powered by toggle ──
function togglePoweredBy(btn) {
  btn.classList.toggle('on');
  const show = btn.classList.contains('on');
  document.querySelectorAll('.brand-powered-by').forEach(el => {
    el.style.visibility = show ? '' : 'hidden';
  });
}

// ── Reset ──
const DEFAULTS = {
  accent: '#405995',
  font: 'Figtree',
  projectName: 'Amos-Yeo Foxglove - AVOIP',
  pmName: 'Tyler Holmes',
  pmRole: 'Project Manager',
  logoUrl: 'assets/images/721f1d92-43b5-4a75-8e68-a9e62bdf23ff.png',
  loginPhoto: 'assets/images/b2fba8d8-b116-4b5c-a6d8-07bdb1bcc0ef.png',
};
function resetBranding() {
  // reset mode
  currentMode = 'light';
  document.body.classList.remove('dark-mode');
  // clear ALL inline token overrides (brand + neutral)
  ['--brand-accent','--brand-dark','--brand-muted','--brand-bg','--brand-bg-card',
   '--c-surface','--c-surface-2','--c-footer-bg','--c-hover',
   '--c-border-1','--c-border-2','--c-border-3','--c-separator',
   '--c-text-1','--c-text-2','--c-text-muted','--c-shadow','--hero-rgb'].forEach(v =>
    document.documentElement.style.removeProperty(v)
  );
  document.getElementById('bp-light-btn').classList.add('active');
  document.getElementById('bp-dark-btn').classList.remove('active');
  applyAccent(DEFAULTS.accent);
  updateHex(DEFAULTS.accent);
  document.getElementById('bp-color-picker').value = DEFAULTS.accent;
  deselectSwatches();
  document.querySelector(`.bp-color-swatch[data-color="${DEFAULTS.accent}"]`)?.classList.add('selected');

  document.getElementById('bp-font').value = DEFAULTS.font;
  applyFont(DEFAULTS.font);

  document.getElementById('bp-project-name').value = DEFAULTS.projectName;
  applyText('brand-project-name', DEFAULTS.projectName);

  document.getElementById('bp-pm-name').value = DEFAULTS.pmName;
  applyText('brand-pm-name', DEFAULTS.pmName);

  document.getElementById('bp-pm-role').value = DEFAULTS.pmRole;
  applyText('brand-pm-role', DEFAULTS.pmRole);

  document.getElementById('bp-logo-url').value = '';
  applyLogo(DEFAULTS.logoUrl);

  // login photo
  document.querySelector('.login-photo').style.backgroundImage = "url('" + DEFAULTS.loginPhoto + "')";
  document.querySelectorAll('.bp-photo-opt').forEach(p => p.classList.remove('selected'));
  document.querySelector('.bp-photo-opt[data-photo="' + DEFAULTS.loginPhoto + '"]')?.classList.add('selected');

  // powered by
  const toggle = document.getElementById('bp-powered-toggle');
  toggle.classList.add('on');
  document.querySelectorAll('.brand-powered-by').forEach(el => el.style.visibility = '');
}

// ── Initialise contrast tokens on first load ──
updateOnTokens();

// ── Pay now modal ──
var _currentInvRef = 'Invoice #002';
function openPayNowModal(invRef, amount, desc) {
  _currentInvRef = invRef || 'Invoice #002';
  document.getElementById('paynow-amount').textContent = amount || '$21,250.00';
  document.getElementById('paynow-desc').innerHTML =
    (invRef || 'Invoice #108') +
    '<span class="paynow-inv-desc-dot"></span>' +
    (desc || 'Additional speaker installation');
  document.getElementById('paynow-ref').textContent = 'INV-' + (invRef || '#002').replace('Invoice ','');
  document.getElementById('paynow-overlay').style.display = 'flex';
}
function closePayNowModal() {
  document.getElementById('paynow-overlay').style.display = 'none';
}
function markAsPaid() {
  closePayNowModal();
  document.getElementById('payment-noted-inv').textContent = _currentInvRef;
  document.getElementById('payment-noted-overlay').style.display = 'flex';
}
function closePaymentNoted() {
  document.getElementById('payment-noted-overlay').style.display = 'none';
}
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Comment dialog — iOS-style drag-to-dismiss (touch + mouse)
   Grab the handle or header zone → drag down → backdrop fades out →
   release past threshold = dismiss; release early = spring back.
───────────────────────────────────────────────────────────────────────── */
(function initCommentDrag() {
  var startY = 0, dy = 0, active = false;
  var THRESHOLD = 80;

  function $o()  { return document.getElementById('qp-comment-overlay'); }
  function $d()  { var o = $o(); return o && o.querySelector('.qp-comment-dialog'); }
  function isOpen() { var o = $o(); return o && o.classList.contains('open'); }
  function inDragZone(el) {
    return !!(el && el.closest('.qp-comment-handle, .qp-comment-header'));
  }

  /* ── start ── */
  function onStart(y) {
    if (!isOpen()) return;
    active = true; startY = y; dy = 0;
    var d = $d(), o = $o();
    if (d) d.style.transition = 'none';
    if (o) o.style.transition = 'none';
  }

  /* ── move ── */
  function onMove(y) {
    if (!active) return;
    dy = Math.max(0, y - startY);
    var d = $d(), o = $o();
    if (d) d.style.transform = 'translateY(' + dy + 'px)';
    if (o) o.style.background = 'rgba(0,0,0,' + Math.max(0, 0.42 * (1 - dy / 220)) + ')';
  }

  /* ── end ── */
  function onEnd() {
    if (!active) return;
    active = false;
    var d = $d(), o = $o();
    if (!d || !o) return;

    if (dy > THRESHOLD) {
      d.style.transition = 'transform 0.22s ease-in';
      o.style.transition = 'background 0.22s ease-in';
      d.style.transform  = 'translateY(110%)';
      o.style.background = 'rgba(0,0,0,0)';
      setTimeout(function() {
        d.style.transform = d.style.transition = '';
        o.style.background = o.style.transition = '';
        closeCommentDialog();
      }, 230);
    } else {
      d.style.transition = 'transform 0.32s cubic-bezier(.4,0,.2,1)';
      o.style.transition = 'background 0.32s ease';
      d.style.transform  = 'translateY(0)';
      o.style.background = 'rgba(0,0,0,0.42)';
      setTimeout(function() {
        d.style.transform = d.style.transition = '';
        o.style.background = o.style.transition = '';
      }, 320);
    }
  }

  /* Touch (mobile) — non-passive so we can preventDefault on move */
  document.addEventListener('touchstart', function(e) {
    if (inDragZone(e.target)) onStart(e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!active) return;
    if (dy > 4) e.preventDefault(); // block page scroll once we're dragging
    onMove(e.touches[0].clientY);
  }, { passive: false });

  document.addEventListener('touchend',    onEnd, { passive: true });
  document.addEventListener('touchcancel', onEnd, { passive: true });

  /* Mouse (desktop preview) */
  document.addEventListener('mousedown', function(e) {
    if (inDragZone(e.target)) { e.preventDefault(); onStart(e.clientY); }
  });
  document.addEventListener('mousemove', function(e) { if (active) onMove(e.clientY); });
  document.addEventListener('mouseup',   onEnd);
})();
