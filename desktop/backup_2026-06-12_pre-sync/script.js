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
    document.getElementById('s-' + name).classList.add('on');
    if (name === 'progress') initPPBars();
    document.querySelectorAll('.sp-item').forEach(el => el.classList.remove('active'));
    const spEl = document.getElementById('sp-' + name);
    if (spEl) spEl.classList.add('active');
    const viewEl = document.getElementById('pt-viewing-name');
    if (viewEl) viewEl.textContent = screenFriendly[name] || name;
    window.scrollTo(0, 0);
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
  accent: '#405995',
  font: 'Figtree',
  projectName: 'Amos-Yeo Foxglove - AVOIP',
  pmName: 'Tyler Holmes',
  pmRole: 'Project Manager',
  logoUrl: 'data:image/png;base64,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',
  loginPhoto: 'images/img_01.png',
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
  document.getElementById('paynow-amount').textContent = amount || '£21,250.00';
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
