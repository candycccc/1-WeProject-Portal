const screenLabels  = {
  login: '① Login', 'forgot-password': '② Forgot Password', dash: '③ Project List', detail: '④ Project Detail',
  quotes: '⑤ Quotes', invoices: '⑥ Invoices',
  variations: '⑦ Variations', 'purchase-order': '⑧ Sales Order',
  documents: '⑨ Documents', warranty: '⑩ Warranty', progress: '⑪ Progress'
};
const screenFriendly = {
  login: 'Login Page', 'forgot-password': 'Forgot Password', dash: 'Project List', detail: 'Project Detail',
  quotes: 'Quotes', invoices: 'Invoices',
  variations: 'Variations', 'change-order': 'Change Orders', 'purchase-order': 'Sales Order',
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
  // Leaving the variations page closes the Ready to accept panel
  if (name !== 'variations' && typeof closeDvPanel === 'function') closeDvPanel();
  // Close nav dropdowns only — screen panel stays open across navigation
  document.querySelectorAll('.qp-nav-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.qp-user-dropdown').forEach(d => d.classList.remove('open'));
  document.getElementById('qp-notif-overlay')?.classList.remove('open');
  document.getElementById('qp-profile-overlay')?.classList.remove('open');

  const alreadyLoaded = loadedScreens.has(name);
  loadedScreens.add(name);

  const activate = () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    document.getElementById('s-' + name).classList.add('on');
    if (name === 'progress') initPPBars();
    if (name === 'detail') showNya(); else closeNya();
    document.querySelectorAll('.sp-item').forEach(el => el.classList.remove('active'));
    const spEl = document.getElementById('sp-' + name);
    if (spEl) spEl.classList.add('active');
    const viewEl = document.getElementById('pt-viewing-name');
    if (viewEl) viewEl.textContent = screenFriendly[name] || name;
    window.scrollTo(0, 0);

    // Persist current screen so refresh restores the same view
    // (clear on login so an explicit sign-out still lands on login next open)
    try {
      if (name === 'login') localStorage.removeItem('wq_screen_desktop');
      else localStorage.setItem('wq_screen_desktop', name);
    } catch(e) {}
  };

  if (alreadyLoaded) {
    // Screen already visited — switch instantly, no skeleton
    activate();
    return;
  }

  // First visit — show skeleton load
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
  // Re-home the Ready-to-accept panel: in mobile-view it lives INSIDE the phone
  // frame (#app-content) so it's positioned/clipped relative to the frame; on
  // desktop it's a body-level fixed right drawer.
  const dvp = document.getElementById('dvp');
  if (dvp) {
    const appContent = document.getElementById('app-content');
    if (isMobile && appContent && dvp.parentElement !== appContent) {
      appContent.appendChild(dvp);
    } else if (!isMobile && dvp.parentElement !== document.body) {
      document.body.appendChild(dvp);
    }
  }
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
  document.getElementById('pt-size-w').addEventListener('input', onSizeInput);
  document.getElementById('pt-size-h').addEventListener('input', onSizeInput);
  // Also allow Enter key to confirm
  [document.getElementById('pt-size-w'), document.getElementById('pt-size-h')].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { el.blur(); onSizeInput(); } });
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

// ── Need Your Attention popup (shows once per load on the project detail page) ──
let _nyaShown = false;
function showNya() {
  if (_nyaShown) return;
  _nyaShown = true;
  const o = document.getElementById('nya-overlay');
  if (o) o.classList.add('open');
}
function closeNya() {
  const o = document.getElementById('nya-overlay');
  if (o) o.classList.remove('open');
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
    screen.querySelectorAll('.qr, .inv-row, .co-row, .dv-row, .co-card').forEach(r => r.style.display = '');
    return;
  }

  // Change Order / Variation rows — filter by data-status (labels incl. "TBC")
  if (screen.querySelector('.co-row') || screen.querySelector('.dv-row')) {
    const CO_MAP = {
      'pending your review': 'pending your review',
      'tbc': 'tbc',
      'to be confirmed': 'tbc',
      'accepted': 'accepted',
      'declined': 'declined',
    };
    const st = CO_MAP[label];
    if (st) {
      screen.querySelectorAll('.co-row, .dv-row, .co-card').forEach(r => {
        r.style.display = ((r.dataset.status || '').toLowerCase() === st) ? '' : 'none';
      });
      return;
    }
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


function searchQuotes(input) {
  const term = (typeof input === 'string' ? input : input.value).trim().toLowerCase();
  // Scope search to the screen that contains this input
  const el = typeof input === 'string' ? null : input;
  const screen = el ? el.closest('.screen') : document.querySelector('.screen.on');
  if (!screen) return;
  const rows = screen.querySelectorAll('.qr, .inv-row, .co-row, .dv-row');
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
    if (typeof closeDvPanel === 'function') closeDvPanel();
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
// Returns '#000000' or '#ffffff' — whichever gives more contrast against bg.
// 0.179 is the WCAG crossover point where black and white give equal contrast.
function contrastColor(hex) {
  return hexLuminance(hex) > 0.179 ? '#000000' : '#ffffff';
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
    brand.classList.remove('open');
    document.body.classList.remove('brand-open');
    resetNotifPanel();
    // Set category filter pill based on current active screen
    const screenId = document.querySelector('.screen.on')?.id?.replace('s-', '') || 'dash';
    const screenToCat = { quotes: 'quote', variations: 'quote', detail: 'quote', invoices: 'invoice', po: 'invoice' };
    const cat = screenToCat[screenId];
    if (cat) {
      const pill = document.querySelector(`.qp-notif-cat-pill[data-cat="${cat}"]`);
      if (pill) setNotifCatPill(cat, pill);
    }
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

  let startY = 0, currentDelta = 0, dragging = false;

  panel.addEventListener('touchstart', e => {
    // Only activate swipe when in mobile bottom-sheet mode
    if (!document.body.classList.contains('mobile-view')) return;
    startY = e.touches[0].clientY;
    currentDelta = 0;
    dragging = true;
    panel.classList.add('notif-dragging');
  }, { passive: true });

  panel.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      currentDelta = dy;
      panel.style.transform = `translateY(${dy}px)`;
    }
  }, { passive: true });

  panel.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('notif-dragging');
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
  // Filter pills + toggles only relevant for Notifications tab
  const pillsEl    = document.getElementById('notif-cat-pills');
  const toggleEl   = document.querySelector('.qp-notif-toggles');
  const mobileFootEl = document.querySelector('.qp-notif-mobile-footer');
  if (pillsEl)      pillsEl.style.display      = tab === 'notif' ? '' : 'none';
  if (toggleEl)     toggleEl.style.display     = tab === 'notif' ? '' : 'none';
  if (mobileFootEl) mobileFootEl.style.display = tab === 'notif' ? '' : 'none';
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
  accent: '#b69977',
  font: 'Figtree',
  projectName: 'Ocean Palm Residences',
  pmName: 'Tyler Holmes',
  pmRole: 'Project Manager',
  logoUrl: 'images/lcr-logo.png',
  loginPhoto: 'images/lcr-login.png',
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
let _currentInvRef = 'Invoice #002';
function openPayNowModal(invRef, amount, desc) {
  _currentInvRef = invRef || 'Invoice #002';
  document.getElementById('paynow-amount').textContent = amount || '$21,250.00';
  document.getElementById('paynow-desc').textContent = invRef + ' · ' + (desc || 'Additional speaker installation');
  document.getElementById('paynow-ref').textContent = 'INV-' + (invRef || '#002').replace('Invoice ','');
  document.getElementById('paynow-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePayNowModal() {
  document.getElementById('paynow-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function markAsPaid() {
  closePayNowModal();
  document.getElementById('payment-noted-inv').textContent = _currentInvRef;
  document.getElementById('payment-noted-overlay').classList.add('open');
}
function closePaymentNoted() {
  document.getElementById('payment-noted-overlay').classList.remove('open');
  document.body.style.overflow = '';
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


/* ── Refresh restore: never bounce back to login ── */
(function applyDefaultBrandingOnLoad() {
  // Apply the default accent (and its derived tokens) immediately so the brand
  // colour is live on first paint — no need to open the panel and click a swatch.
  try { applyAccent(DEFAULTS.accent); } catch(e) {}
})();

(function restoreScreenOnLoad() {
  try {
    const saved = localStorage.getItem('wq_screen_desktop');
    const known = ['dash','detail','quotes','variations','change-order','invoices',
                   'documents','warranty','progress','purchase-order'];
    const target = (saved && known.includes(saved) && document.getElementById('s-' + saved))
      ? saved : 'dash';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    document.getElementById('s-' + target).classList.add('on');
    if (target === 'progress') initPPBars();
    const spEl = document.getElementById('sp-' + target);
    if (spEl) { document.querySelectorAll('.sp-item').forEach(e => e.classList.remove('active')); spEl.classList.add('active'); }
    const viewEl = document.getElementById('pt-viewing-name');
    if (viewEl) viewEl.textContent = (typeof screenFriendly !== 'undefined' && screenFriendly[target]) || target;
  } catch(e) {}
})();


/* ── Card action flows (ported from mobile) ── */
function flipBadge(el, newClass, newText) {
  if (!el) return;
  el.style.transition = 'transform 0.4s ease-in';
  el.style.transform = 'perspective(300px) rotateX(90deg)';
  setTimeout(function() {
    el.className = newClass;
    if (newText != null) el.textContent = newText;
    el.style.transition = 'none';
    el.style.transform = 'perspective(300px) rotateX(-90deg)';
    requestAnimationFrame(function() { requestAnimationFrame(function() {
      el.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1)';
      el.style.transform = 'perspective(300px) rotateX(0deg)';
      setTimeout(function() { el.style.transition = ''; el.style.transform = ''; }, 600);
    }); });
  }, 400);
}

function cardRef(card) {
  const num   = card.querySelector('.qr-number')?.textContent.trim()  || '';
  const title = card.querySelector('.qr-title')?.textContent.trim()   || '';
  return title ? `${num} – ${title}` : num;
}

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

function resortCardList(listEl) {
  const cards = Array.from(listEl.querySelectorAll(':scope > .qr, :scope > .co-row, :scope > .dv-row'));
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
    // ── Phase 3: badge + date flip to Accepted ──
    flipBadge(card.querySelector('.qr-badge'), 'qr-badge qr-badge-accepted', 'Accepted');
    setTimeout(() => {
      flipBadge(card.querySelector('.qr-date'), 'qr-date qr-date-accepted', 'Accepted on ' + dateStr);
    }, 150);

    // Log to Portal Activity
    logActivity('You approved', cardRef(card));

    // Pause — let the flipped status register before the card changes shape
    setTimeout(() => {

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
    }, 900);

    }, 1700); // end pause-after-flip

  }, 250);
}

function tbcCard(btn) {
  const card = btn.closest('.qr');
  if (!card) return;
  if (card.classList.contains('qr-tbc-ing')) return;

  // ── Phase 1: grey border flash ──
  card.classList.add('qr-tbc-ing');

  setTimeout(() => {
    // ── Phase 2: badge + date flip to TBC ──
    flipBadge(card.querySelector('.qr-badge'), 'qr-badge qr-badge-tbc', 'To be confirmed');
    setTimeout(() => {
      // Keep existing date text — just flip to the tbc colour class
      flipBadge(card.querySelector('.qr-date'), 'qr-date qr-date-tbc', null);
    }, 150);

    // Log to Portal Activity
    logActivity('You marked as TBC', cardRef(card));

    // ── Phase 3: settle after the flips finish ──
    setTimeout(() => {
      card.classList.remove('qr-tbc-ing');
      card.classList.add('qr-tbc-done');
      setTimeout(() => card.classList.remove('qr-tbc-done'), 700);
    }, 1200);
  }, 180);
}

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
    // ── Phase 3: badge + date flip to Declined ──
    flipBadge(card.querySelector('.qr-badge'), 'qr-badge qr-badge-declined', 'Declined');
    setTimeout(() => {
      flipBadge(card.querySelector('.qr-date'), 'qr-date qr-date-declined', 'Declined on ' + dateStr);
    }, 150);

    // Log to Portal Activity
    logActivity('You rejected', cardRef(card));

    // ── Phase 4: remove actions entirely → empty slot ──
    if (actionsEl) actionsEl.outerHTML = '<div></div>';

    // Re-sort right after the badge flips finish (~1350ms incl. date stagger)
    setTimeout(() => {
      // ── Phase 5: settle + re-sort so Declined drops to bottom ──
      card.classList.remove('qr-rejecting');
      card.classList.add('qr-rejected-done');
      setTimeout(() => card.classList.remove('qr-rejected-done'), 800);

      const listEl = card.closest('.qp-list');
      if (listEl) resortCardList(listEl);
    }, 1450);
  }, 250);
}


/* ── Change Order row actions (desktop) ── */
function refreshCoRowCounts() {
  const rows = document.querySelectorAll('#s-change-order .co-row');
  const counts = { 'all': rows.length, 'pending your review': 0, 'tbc': 0, 'accepted': 0, 'declined': 0 };
  rows.forEach(r => {
    const s = (r.dataset.status || '').toLowerCase();
    if (counts[s] != null) counts[s]++;
  });
  document.querySelectorAll('#s-change-order .qp-filter-tab').forEach(tab => {
    const cnt = tab.querySelector('.qp-filter-count');
    if (!cnt) return;
    let label = tab.textContent.replace(/[0-9]/g, '').trim().toLowerCase();
    if (label === 'tbc') label = 'tbc';
    const n = counts[label];
    if (n != null) cnt.textContent = (n < 10 ? '0' : '') + n;
  });
}
function _coRowDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function tbcCoRow(btn) {
  const row = btn.closest('.co-row');
  if (!row) return;
  row.dataset.status = 'tbc';
  flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-tbc', 'To be confirmed');
  setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-tbc', null), 150);
  setTimeout(() => { refreshCoRowCounts(); resortCardList(row.parentElement); }, 1100);
}
function rejectCoRow(btn) {
  const row = btn.closest('.co-row');
  if (!row) return;
  row.dataset.status = 'declined';
  flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-declined', 'Declined');
  setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-declined', 'Declined on ' + _coRowDate()), 150);
  const actions = row.querySelector('.co-row-actions');
  if (actions) {
    actions.style.transition = 'opacity 0.4s ease';
    actions.style.opacity = '0';
    setTimeout(() => actions.remove(), 450);
  }
  setTimeout(() => { refreshCoRowCounts(); resortCardList(row.parentElement); }, 1100);
}
function acceptCoRow(btn) {
  const row = btn.closest('.co-row');
  if (!row) return;
  openCoDocument(row);
}

function _playCoAccept(row) {
  if (!row) return;
  row.classList.add('qr-accepting');
  setTimeout(() => {
    row.dataset.status = 'accepted';
    flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-accepted', 'Accepted');
    setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-accepted', 'Accepted on ' + _coRowDate()), 150);
    const actions = row.querySelector('.co-row-actions');
    if (actions) {
      actions.style.transition = 'opacity 0.4s ease';
      actions.style.opacity = '0';
      setTimeout(() => actions.remove(), 450);
    }
  }, 350);
  setTimeout(() => {
    row.classList.remove('qr-accepting');
    row.classList.add('qr-accepted-done');
    setTimeout(() => row.classList.remove('qr-accepted-done'), 800);
    refreshCoRowCounts();
    resortCardList(row.parentElement);
  }, 1700);
}


/* ═══ Change Order detail modal (Figma 1160-39738) ═══ */
let _codmRow = null;

function openCoDetailModal(btn) {
  openCoDetailModalRow(btn.closest('.co-row'));
}

function openCoDetailModalRow(row) {
  _codmRow = row;
  if (row) {
    const badge = row.querySelector('.qr-badge');
    const date = row.querySelector('.qr-date');
    [['codm-badge', badge], ['codm-tl-badge', badge]].forEach(([id, src]) => {
      const el = document.getElementById(id);
      if (el && src) { el.className = src.className; el.textContent = src.textContent; }
    });
    [['codm-date', date], ['codm-tl-date', date]].forEach(([id, src]) => {
      const el = document.getElementById(id);
      if (el && src) { el.className = src.className; el.textContent = src.textContent; }
    });
    // action bar only while the row is still actionable
    const footer = document.getElementById('codm-footer');
    if (footer) footer.style.display = row.querySelector('.co-row-actions') ? '' : 'none';
  }
  document.getElementById('codm-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCoDetailModal() {
  document.getElementById('codm-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function codmAction(kind) {
  const row = _codmRow;
  closeCoDetailModal();
  if (!row) return;
  const actions = row.querySelector('.co-row-actions');
  if (!actions) return;
  const btns = actions.querySelectorAll('.qr-action-btn');
  if (kind === 'tbc') tbcCoRow(btns[1]);
  else if (kind === 'reject') rejectCoRow(btns[2]);
  else if (kind === 'accept') acceptCoRow(btns[3]);
}

/* ═══ Desktop Variations redesign (Figma 1160-38812) ═══ */
function toggleDvSelect(btn) {
  const row = btn.closest('.dv-row');
  if (!row) return;
  const sel = row.classList.toggle('dv-selected');
  btn.classList.toggle('dv-added', sel);
  btn.innerHTML = sel
    ? '<i class="fa-sharp-solid fa-trash-alt"></i>Remove from Accept'
    : '<i class="fa-sharp-solid fa-circle-plus"></i>Add to Accept';
  updateDvBar();
  if (sel) {
    // Mobile-view follows the mobile app: adding just shows the footer bar;
    // the sheet only opens via Review & Accept. Desktop opens the panel directly.
    if (document.body.classList.contains('mobile-view')) rebuildDvPanel();
    else openDvPanel();
  } else {
    rebuildDvPanel();
    if (!document.querySelectorAll('#s-variations .dv-row.dv-selected').length) closeDvPanel();
  }
}

function updateDvBar() {
  const bar = document.getElementById('dv-accept-bar');
  if (!bar) return;
  const sel = document.querySelectorAll('#s-variations .dv-row.dv-selected');
  const panel = document.getElementById('dvp');
  if (!sel.length || (panel && panel.classList.contains('open'))) { bar.classList.remove('show'); return; }
  let total = 0;
  sel.forEach(r => total += parseFloat(r.dataset.value || '0'));
  bar.querySelector('.dv-accept-count').textContent =
    sel.length + (sel.length === 1 ? ' Variation' : ' Variations') + ' to accept';
  bar.querySelector('.dv-accept-total').textContent =
    'Estimated total value $' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  bar.classList.add('show');
}

function reviewAcceptDv() {
  openDvPanel();
}

function acceptDvRow(row) {
  row.classList.remove('dv-selected');
  row.dataset.status = 'accepted';
  flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-accepted', 'Accepted');
  setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-accepted', 'Accepted on ' + _coRowDate()), 150);
  const add = row.querySelector('.dv-add-btn');
  if (add) {
    add.style.transition = 'opacity 0.4s ease';
    add.style.opacity = '0';
    setTimeout(() => add.remove(), 450);
  }
  row.classList.add('qr-accepted-done');
  setTimeout(() => row.classList.remove('qr-accepted-done'), 800);
  setTimeout(() => { refreshDvCounts(); resortCardList(row.parentElement); }, 1100);
}

function refreshDvCounts() {
  const rows = document.querySelectorAll('#s-variations .dv-row');
  const counts = { 'all': rows.length, 'pending your review': 0, 'tbc': 0, 'accepted': 0, 'declined': 0 };
  rows.forEach(r => {
    const s = (r.dataset.status || '').toLowerCase();
    if (counts[s] != null) counts[s]++;
  });
  document.querySelectorAll('#s-variations .qp-filter-tab').forEach(tab => {
    const cnt = tab.querySelector('.qp-filter-count');
    if (!cnt) return;
    let label = tab.textContent.replace(/[0-9]/g, '').trim().toLowerCase();
    if (label === 'to be confirmed') label = 'tbc';
    const n = counts[label];
    if (n != null) cnt.textContent = (n < 10 ? '0' : '') + n;
  });
}


/* ═══ Ready to accept panel (Figma 1160-39975) ═══ */
function openDvPanel() {
  if (typeof closeBrandPanel === 'function') closeBrandPanel();
  rebuildDvPanel();
  document.getElementById('dvp').classList.add('open');
  document.body.classList.add('dvp-open');
  document.getElementById('dv-accept-bar').classList.remove('show');
}

function closeDvPanel() {
  document.getElementById('dvp').classList.remove('open');
  document.body.classList.remove('dvp-open');
  updateDvBar(); // selections survive close — bar offers the way back in
}

function rebuildDvPanel() {
  const list = document.getElementById('dvp-list');
  if (!list) return;
  const sel = document.querySelectorAll('#s-variations .dv-row.dv-selected');
  list.innerHTML = '';
  let total = 0;
  sel.forEach(row => {
    total += parseFloat(row.dataset.value || '0');
    const img = row.querySelector('.dv-thumb img');
    const title = (row.querySelector('.dv-title') || {}).textContent || '';
    const meta = (row.querySelector('.dv-meta') || {}).textContent || '';
    const val = (row.querySelector('.dv-value-num') || {}).textContent || '';
    const item = document.createElement('div');
    item.className = 'dvp-item';
    item.innerHTML =
      '<div class="dvp-item-thumb">' + (img ? '<img src="' + img.getAttribute('src') + '" alt="">' : '') + '</div>' +
      '<div class="dvp-item-info">' +
        '<div class="dvp-item-top"><div class="dvp-item-title"></div><div class="dvp-item-val"></div></div>' +
        '<div class="dvp-item-bottom"><div class="dvp-item-meta"></div><button class="dvp-remove-btn">Remove</button></div>' +
      '</div>';
    item.querySelector('.dvp-item-title').textContent = title;
    item.querySelector('.dvp-item-val').textContent = val;
    item.querySelector('.dvp-item-meta').textContent = meta;
    item.querySelector('.dvp-remove-btn').onclick = () => dvPanelRemove(row);
    list.appendChild(item);
  });
  const totalEl = document.getElementById('dvp-total');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dvPanelRemove(row) {
  const btn = row.querySelector('.dv-add-btn');
  if (btn && row.classList.contains('dv-selected')) toggleDvSelect(btn); // handles rebuild + close-on-empty
}

function dvPanelAccept() {
  const sel = document.querySelectorAll('#s-variations .dv-row.dv-selected');
  document.getElementById('dvp').classList.remove('open');
  document.body.classList.remove('dvp-open');
  document.getElementById('dv-accept-bar').classList.remove('show');
  sel.forEach((row, i) => setTimeout(() => acceptDvRow(row), i * 200));
}


/* ═══ CO sign document overlay — same flow as mobile: Accept opens the
   Change Order document; signing arms the accept; it plays on close. ═══ */
let _coDocSourceRow = null;
let _coDocSigned = false;
let _coSignedPending = false;

function openCoDocument(row) {
  const overlay = document.getElementById('co-doc-overlay');
  if (!overlay) return;
  _coDocSourceRow = row || document.querySelector('#s-change-order .co-row[data-status="pending your review"]');
  const frame = document.getElementById('co-doc-iframe');
  if (frame && !frame.src) frame.src = '../mobile/ChangeOrder_Sign_demo.html';
  else if (frame && _coDocSigned) {
    try { frame.contentWindow.location.reload(); } catch (e) {}
    _coDocSigned = false;
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCoDocument() {
  const overlay = document.getElementById('co-doc-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  if (!_coSignedPending) return;
  _coSignedPending = false;
  const row = _coDocSourceRow;
  _coDocSourceRow = null;
  setTimeout(() => _playCoAccept(row), 400);
}

window.addEventListener('message', (e) => {
  if (e.data !== 'co-signed') return;
  _coDocSigned = true;
  _coSignedPending = true;
});


/* ═══ Variation proposal overlay — same flow as mobile: View Variation opens
   the proposal demo; Accept/Reject/TBC inside arm the action; it plays on close. ═══ */
let _varDocRow = null;
let _varDocPending = null; // 'accept' | 'reject' | 'tbc'

function dvRowClick(e) {
  // mobile-view: tapping the card opens the proposal (View button is hidden)
  if (!document.body.classList.contains('mobile-view')) return;
  if (e.target.closest('button')) return;
  const row = e.target.closest('.dv-row');
  if (row) openDvProposalForRow(row);
}

function openDvProposal(btn) {
  openDvProposalForRow(btn.closest('.dv-row'));
}

function openDvProposalForRow(row) {
  if (!row) return;
  _varDocRow = row;
  _varDocPending = null;
  const img = row.querySelector('.dv-thumb img');
  const meta = (row.querySelector('.dv-meta') || {}).textContent || 'Variation';
  const params = new URLSearchParams({
    title: (row.querySelector('.dv-title') || {}).textContent || '',
    price: row.dataset.value || '0',
    ref: (meta.split('from')[0] || 'Variation').trim(),
    valid: ((row.querySelector('.qr-date') || {}).textContent || '').trim(),
    status: (row.dataset.status || '').toLowerCase() === 'accepted' ? 'accepted' : 'pending'
  });
  if (img && img.src) params.set('img', img.src);
  const frame = document.getElementById('var-doc-iframe');
  // Hash survives the dev server's cleanUrls redirect (query strings get dropped)
  frame.src = '../mobile/Variation_Proposal_demo.html#' + params.toString();
  document.getElementById('var-doc-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVarDoc() {
  document.getElementById('var-doc-overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (!_varDocPending || !_varDocRow) { _varDocRow = null; _varDocPending = null; return; }
  const row = _varDocRow, action = _varDocPending;
  _varDocRow = null; _varDocPending = null;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => performSingleDvAction(row, action), 450);
}

window.addEventListener('message', (e) => {
  if (e.data === 'var-accept' || e.data === 'var-reject' || e.data === 'var-tbc') {
    _varDocPending = e.data.replace('var-', '');
  }
});

function performSingleDvAction(row, action) {
  if (action === 'accept') { acceptDvRow(row); updateDvBar(); rebuildDvPanel(); return; }
  // Leaving the selection if it was added
  if (row.classList.contains('dv-selected')) {
    const addBtn = row.querySelector('.dv-add-btn');
    if (addBtn) toggleDvSelect(addBtn);
  }
  if (action === 'reject') {
    row.dataset.status = 'declined';
    flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-declined', 'Declined');
    setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-declined', 'Declined on ' + _coRowDate()), 150);
    const add = row.querySelector('.dv-add-btn');
    if (add) {
      add.style.transition = 'opacity 0.4s ease';
      add.style.opacity = '0';
      setTimeout(() => add.remove(), 450);
    }
  } else if (action === 'tbc') {
    row.dataset.status = 'tbc';
    flipBadge(row.querySelector('.qr-badge'), 'qr-badge qr-badge-tbc', 'To be confirmed');
    setTimeout(() => flipBadge(row.querySelector('.qr-date'), 'qr-date qr-date-tbc', 'Valid until 14 Apr 2026'), 150);
  }
  setTimeout(() => { refreshDvCounts(); resortCardList(row.parentElement); }, 1100);
}


/* ═══ Mobile-view Change Order cards (ported from the mobile app, Figma 1160-22392) ═══ */
function _mvCoRowFor(card) {
  const cards = Array.from(document.querySelectorAll('#s-change-order .co-card'));
  const rows = document.querySelectorAll('#s-change-order .co-row');
  return rows[cards.indexOf(card)] || null;
}

function mvViewCo(btn) {
  const card = btn.closest('.co-card');
  if (document.body.classList.contains('mobile-view') && document.getElementById('co-detail-overlay')) {
    openCoDetails(card);
  } else {
    openCoDetailModalRow(_mvCoRowFor(card));
  }
}

function mvCoAction(btn, kind) {
  const card = btn.closest('.co-card');
  if (!card) return;
  const row = _mvCoRowFor(card);
  if (kind === 'accept') { openCoDocument(row); return; } // sign flow mirrors back on close
  const dateStr = _coRowDate();
  const badge = card.querySelector('.co-header-row .qr-badge');
  const date = card.querySelector('.co-header-row .qr-date');
  const tlBadge = card.querySelector('.co-tl-status-row .qr-badge');
  const tlDate = card.querySelector('.co-tl-status-row .qr-date');
  if (kind === 'tbc') {
    card.dataset.status = 'tbc';
    flipBadge(badge, 'qr-badge qr-badge-tbc', 'To be confirmed');
    if (tlBadge) setTimeout(() => flipBadge(tlBadge, 'qr-badge qr-badge-tbc', 'To be confirmed'), 100);
  } else if (kind === 'reject') {
    card.dataset.status = 'declined';
    flipBadge(badge, 'qr-badge qr-badge-declined', 'Declined');
    setTimeout(() => flipBadge(date, 'qr-date qr-date-declined', 'Declined on ' + dateStr), 150);
    if (tlBadge) setTimeout(() => flipBadge(tlBadge, 'qr-badge qr-badge-declined', 'Declined'), 100);
    if (tlDate) setTimeout(() => flipBadge(tlDate, 'qr-date qr-date-declined', 'Declined on ' + dateStr), 250);
    const actions = card.querySelector('.co-card-actions .qr-action-group');
    if (actions) {
      actions.style.transition = 'opacity 0.4s ease';
      actions.style.opacity = '0';
      setTimeout(() => actions.remove(), 450);
    }
  }
  _mvSyncRow(row, kind, dateStr);
}

function _mvSyncRow(row, kind, dateStr) {
  // quiet sync — the desktop row is hidden while in mobile-view
  if (!row) return;
  const b = row.querySelector('.qr-badge');
  const d = row.querySelector('.qr-date');
  if (kind === 'tbc') {
    row.dataset.status = 'tbc';
    if (b) { b.className = 'qr-badge qr-badge-tbc'; b.textContent = 'To be confirmed'; }
    if (d) { d.className = 'qr-date qr-date-tbc'; }
  } else if (kind === 'reject') {
    row.dataset.status = 'declined';
    if (b) { b.className = 'qr-badge qr-badge-declined'; b.textContent = 'Declined'; }
    if (d) { d.className = 'qr-date qr-date-declined'; d.textContent = 'Declined on ' + dateStr; }
    const a = row.querySelector('.co-row-actions');
    if (a) a.remove();
  }
  refreshCoRowCounts();
}

/* Accept (sign flow) also mirrors onto the mobile-view card */
const _playCoAcceptBase = _playCoAccept;
_playCoAccept = function(row) {
  _playCoAcceptBase(row);
  const rows = Array.from(document.querySelectorAll('#s-change-order .co-row'));
  const card = document.querySelectorAll('#s-change-order .co-card')[rows.indexOf(row)];
  if (!card) return;
  card.dataset.status = 'accepted';
  const dateStr = _coRowDate();
  flipBadge(card.querySelector('.co-header-row .qr-badge'), 'qr-badge qr-badge-accepted', 'Accepted');
  setTimeout(() => flipBadge(card.querySelector('.co-header-row .qr-date'), 'qr-date qr-date-accepted', 'Accepted on ' + dateStr), 150);
  const tlB = card.querySelector('.co-tl-status-row .qr-badge');
  if (tlB) setTimeout(() => flipBadge(tlB, 'qr-badge qr-badge-accepted', 'Accepted'), 100);
  const tlD = card.querySelector('.co-tl-status-row .qr-date');
  if (tlD) setTimeout(() => flipBadge(tlD, 'qr-date qr-date-accepted', 'Accepted on ' + dateStr), 250);
  const actions = card.querySelector('.co-card-actions .qr-action-group');
  if (actions) {
    actions.style.transition = 'opacity 0.4s ease';
    actions.style.opacity = '0';
    setTimeout(() => actions.remove(), 450);
  }
};


/* ═══ Mobile-view CO detail sheet (ported from the mobile app, Figma 1160-22734) ═══ */
let _coSheetCard = null;

function openCoDetails(card) {
  _coSheetCard = card || document.querySelector('#s-change-order .co-card');
  // sync the sheet header + active timeline step from the source card
  const b = _coSheetCard && _coSheetCard.querySelector('.co-header-row .qr-badge');
  const d = _coSheetCard && _coSheetCard.querySelector('.co-header-row .qr-date');
  const pairs = [
    [document.getElementById('co-detail-badge'), b],
    [document.querySelector('#co-detail-overlay .co-tl-status-row .qr-badge'), b],
  ];
  const datePairs = [
    [document.getElementById('co-detail-date'), d],
    [document.querySelector('#co-detail-overlay .co-tl-status-row .qr-date'), d],
  ];
  pairs.forEach(([el, src]) => { if (el && src) { el.className = src.className; el.textContent = src.textContent; } });
  datePairs.forEach(([el, src]) => { if (el && src) { el.className = src.className; el.textContent = src.textContent; } });
  // footer actions only while the card is still actionable
  const footer = document.querySelector('#co-detail-overlay .co-detail-footer');
  if (footer && _coSheetCard) {
    footer.style.display = _coSheetCard.querySelector('.co-card-actions .qr-action-group') ? '' : 'none';
  }
  document.getElementById('co-detail-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCoDetails() {
  document.getElementById('co-detail-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function coSheetAction(kind) {
  const card = _coSheetCard;
  closeCoDetails();
  if (!card) return;
  setTimeout(() => mvCoAction(card, kind), 350); // card.closest('.co-card') === card
}

function coSheetAccept() {
  const card = _coSheetCard;
  closeCoDetails();
  const row = card ? _mvCoRowFor(card) : null;
  setTimeout(() => openCoDocument(row), 250);
}
