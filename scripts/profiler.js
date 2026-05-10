/* Profiler — local-only page diagnostics.
   No network calls. All metrics from in-page performance APIs and a tiny
   localStorage rolling sample.

   Sections in order:
     1. Aside chrome    — reveal, expand/collapse, tabs, outside-close, Esc
     2. Load metrics    — performance.getEntriesByType('navigation')
     3. Runtime metrics — rAF FPS / dropped, long-animation-frame, scroll
                          hitch, CLS. Loop pauses when the runtime tab
                          isn't visible.
     4. Sparkline       — canvas frame-time render
*/

const LOAD_KEY = 'jarn-prof-loads';
const VISIT_KEY = 'jarn-prof-visits';
const MAX_SAMPLES = 100;
const FRAME_BUDGET_MS = 1000 / 60;
const HITCH_THRESHOLD_MS = FRAME_BUDGET_MS * 2;
const SPARK_FRAMES = 80;
const DESKTOP_QUERY = '(min-width: 768px)';

const aside = document.getElementById('profiler');
const summary = document.getElementById('profiler-toggle');
const body = document.getElementById('profiler-body');
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

/* No profiler in the DOM — nothing to do. */
if (aside && summary && body) {
  /* Load metrics and runtime observers register listeners eagerly so
     they don't miss the window.load event or early performance entries.
     The DOM nodes they update sit inside the still-hidden aside, so any
     textContent updates are silent until the stylesheet arrives and the
     aside is revealed. */
  initLoadMetrics();
  initRuntimeMetrics();
  loadProfilerStyles().then((loaded) => {
    if (!loaded) return;
    aside.hidden = false;
    initChrome();
  });
}

function loadProfilerStyles() {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/profiler.css';
    link.addEventListener('load', () => resolve(true), { once: true });
    /* On a stylesheet load failure (404, network, blocked), keep the
       aside hidden rather than rendering it without styles. The rest
       of the page is unaffected. */
    link.addEventListener('error', () => resolve(false), { once: true });
    document.head.appendChild(link);
  });
}

/* ──────────────────────────────────────────────
   1. Chrome
────────────────────────────────────────────── */

function initChrome() {
  /* Default expanded state: visible on desktop, collapsed on mobile.
     The runtime breakpoint is the same one the stylesheet uses. */
  setExpanded(matchMedia(DESKTOP_QUERY).matches);

  summary.addEventListener('click', () => {
    /* Desktop: aside is full-height and persistent — the summary is a
       static header, not a toggle. Mobile: tap to expand/collapse the
       bottom sheet. */
    if (matchMedia(DESKTOP_QUERY).matches) return;
    setExpanded(summary.getAttribute('aria-expanded') !== 'true');
  });

  /* Tabs — WAI-ARIA tab pattern with roving tabindex. */
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let next = i;
      if (event.key === 'ArrowRight') next = i === last ? 0 : i + 1;
      else if (event.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else return;
      event.preventDefault();
      activateTab(next);
      tabs[next].focus();
    });
  });

  /* Mobile-only: outside-tap and Esc collapse the sheet. */
  document.addEventListener('pointerdown', (event) => {
    if (matchMedia(DESKTOP_QUERY).matches) return;
    if (summary.getAttribute('aria-expanded') !== 'true') return;
    if (aside.contains(event.target)) return;
    setExpanded(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (matchMedia(DESKTOP_QUERY).matches) return;
    if (summary.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      summary.focus();
    }
  });
}

function setExpanded(expanded) {
  summary.setAttribute('aria-expanded', String(expanded));
  body.hidden = !expanded;
}

function activateTab(index) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.setAttribute('tabindex', selected ? '0' : '-1');
  });
  panels.forEach((panel, i) => {
    panel.hidden = i !== index;
  });
  /* Switching to runtime triggers an immediate redraw of the sparkline so
     the panel doesn't show a stale state. */
  if (tabs[index] && tabs[index].id === 'prof-tab-runtime') {
    drawSparkline();
  }
}

function isRuntimeVisible() {
  if (summary.getAttribute('aria-expanded') !== 'true') return false;
  const runtimeTab = document.getElementById('prof-tab-runtime');
  return Boolean(runtimeTab && runtimeTab.getAttribute('aria-selected') === 'true');
}

/* ──────────────────────────────────────────────
   2. Load metrics
────────────────────────────────────────────── */

function initLoadMetrics() {
  window.addEventListener('load', () => {
    /* setTimeout 0 lets the navigation entry's loadEventEnd settle. */
    setTimeout(populateLoadMetrics, 120);
  });
}

function populateLoadMetrics() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return;

  const dns = diff(nav.domainLookupEnd, nav.domainLookupStart);
  const tcp = diff(nav.connectEnd, nav.connectStart);
  const tls = nav.secureConnectionStart > 0 ? diff(nav.connectEnd, nav.secureConnectionStart) : null;
  const ttfb = diff(nav.responseStart, nav.requestStart);
  const dl = diff(nav.responseEnd, nav.responseStart);
  const dom = diff(nav.domInteractive, nav.responseEnd);
  const load = diff(nav.loadEventEnd, nav.startTime);

  const samples = readSamples();
  if (load != null && load > 0 && load < 30000) {
    samples.push(load);
    if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
    writeSamples(samples);
  }

  const visits = bumpVisits();

  /* Summary strip */
  const loadEl = document.getElementById('profiler-load-time');
  if (loadEl) {
    loadEl.textContent = load != null ? load + 'ms' : '…';
    if (load != null) loadEl.dataset.state = latencyState(load);
  }
  const dot = aside.querySelector('.profiler-dot');
  if (dot && load != null) dot.dataset.state = latencyState(load);

  /* Stat tiles */
  setStat('prof-stat-load', load, 'ms');
  setStat('prof-stat-ttfb', ttfb, 'ms');
  const visitsEl = document.getElementById('prof-stat-visits');
  if (visitsEl) visitsEl.textContent = String(visits);

  /* Waterfall */
  const spans = [
    { label: 'DNS lookup', ms: dns },
    { label: 'TCP connect', ms: tcp },
    ...(tls != null ? [{ label: 'TLS handshake', ms: tls }] : []),
    { label: 'TTFB', ms: ttfb },
    { label: 'Download', ms: dl },
    { label: 'DOM parse', ms: dom },
  ].filter((span) => span.ms != null && span.ms >= 0);

  const wf = document.getElementById('prof-waterfall');
  if (wf) {
    wf.replaceChildren();
    spans.forEach(({ label, ms }) => {
      const pct = load > 0 ? Math.min(100, (ms / load) * 100) : 0;
      const state = latencyState(ms);
      wf.appendChild(buildWfRow(label, ms, pct, state));
    });
  }

  /* Percentiles */
  renderPercentiles(samples);

  /* SLO */
  renderSlo(samples);
}

function buildWfRow(label, ms, pct, state) {
  const row = document.createElement('div');
  row.className = 'prof-wf-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'prof-wf-label';
  labelEl.textContent = label;

  const track = document.createElement('div');
  track.className = 'prof-wf-track';
  const bar = document.createElement('div');
  bar.className = 'prof-wf-bar';
  bar.dataset.state = state;
  /* requestAnimationFrame defer lets the browser paint the 0% width first
     so the transition to the final width animates. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.setProperty('--bar-pct', pct.toFixed(1) + '%');
    });
  });
  track.appendChild(bar);

  const val = document.createElement('span');
  val.className = `prof-wf-val prof-${state}`;
  val.textContent = String(ms);
  const unit = document.createElement('span');
  unit.className = 'prof-wf-val-unit';
  unit.textContent = 'ms';
  val.appendChild(unit);

  row.append(labelEl, track, val);
  return row;
}

function renderPercentiles(samples) {
  const percsEl = document.getElementById('prof-percs');
  const noteEl = document.getElementById('prof-perc-note');
  if (!percsEl || !noteEl) return;

  percsEl.replaceChildren();

  if (samples.length < 2) {
    noteEl.textContent = `${samples.length} visit recorded — percentiles available after 2+`;
    return;
  }

  const max = Math.max(...samples);
  const targets = [['p50', 50], ['p95', 95], ['p99', 99]];
  targets.forEach(([label, p]) => {
    const value = percentile(samples, p);
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'prof-perc-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'prof-perc-label';
    labelEl.textContent = label;

    const track = document.createElement('div');
    track.className = 'prof-perc-track';
    const fill = document.createElement('div');
    fill.className = 'prof-perc-fill';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.setProperty('--bar-pct', pct.toFixed(1) + '%');
      });
    });
    track.appendChild(fill);

    const valEl = document.createElement('span');
    valEl.className = 'prof-perc-val';
    valEl.textContent = Math.round(value) + 'ms';

    row.append(labelEl, track, valEl);
    percsEl.appendChild(row);
  });
  noteEl.textContent = `n=${samples.length} visits`;
}

function renderSlo(samples) {
  const SLO_MS = 1000;
  const labelEl = document.getElementById('prof-slo-label');
  const barEl = document.getElementById('prof-slo-bar');
  const pctEl = document.getElementById('prof-slo-pct');
  if (!labelEl || !barEl || !pctEl) return;

  if (samples.length < 2) {
    labelEl.textContent = 'need 2+ visits';
    barEl.style.setProperty('--bar-pct', '0%');
    pctEl.textContent = '—';
    return;
  }

  const passing = samples.filter((ms) => ms < SLO_MS).length;
  const ratio = passing / samples.length;
  const state = ratio >= 0.99 ? 'good' : ratio >= 0.95 ? 'warn' : 'bad';

  labelEl.textContent = `${passing}/${samples.length} requests < ${SLO_MS}ms`;
  pctEl.textContent = (ratio * 100).toFixed(1) + '%';
  pctEl.dataset.state = state;
  barEl.dataset.state = state;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barEl.style.setProperty('--bar-pct', (ratio * 100).toFixed(1) + '%');
    });
  });
}

function setStat(id, value, unit) {
  const el = document.getElementById(id);
  if (!el || value == null) return;
  el.replaceChildren();
  const num = document.createElement('span');
  num.className = `prof-${latencyState(value)}`;
  num.textContent = String(value);
  const unitEl = document.createElement('span');
  unitEl.className = 'prof-stat-unit';
  unitEl.textContent = unit;
  el.append(num, unitEl);
}

function latencyState(ms) {
  return ms < 50 ? 'good' : ms < 250 ? 'warn' : 'bad';
}

function diff(a, b) {
  const v = a - b;
  return v >= 0 ? Math.round(v) : null;
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

function readSamples() {
  try {
    return JSON.parse(localStorage.getItem(LOAD_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeSamples(samples) {
  try {
    localStorage.setItem(LOAD_KEY, JSON.stringify(samples));
  } catch {
    /* Storage unavailable — samples don't persist across visits. */
  }
}

function bumpVisits() {
  try {
    const next = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

/* ──────────────────────────────────────────────
   3. Runtime metrics
────────────────────────────────────────────── */

let frameTimes = [];
let droppedFrames = 0;
let lastRafTs = null;

let lafCount = 0;
let lafWorstBlock = 0;

let hitchCount = 0;
let scrollPending = false;
let lastScrollTs = null;

let clsScore = 0;

let lastUIUpdate = 0;

function initRuntimeMetrics() {
  requestAnimationFrame(rafLoop);

  /* Long Animation Frames (Chrome 123+). */
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          lafCount += 1;
          const blocking = entry.blockingDuration || entry.duration;
          if (blocking > lafWorstBlock) lafWorstBlock = blocking;
        });
      }).observe({ entryTypes: ['long-animation-frame'] });
    } catch {
      /* Browser doesn't support long-animation-frame — count stays 0. */
    }

    /* CLS via layout-shift entries. */
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) clsScore += entry.value;
        });
      }).observe({ entryTypes: ['layout-shift'] });
    } catch {
      /* layout-shift not supported — CLS stays 0. */
    }
  }

  /* Scroll hitch detection. The listener is always installed because
     scrolling can hitch regardless of which tab is showing; the UI only
     updates when runtime is visible. */
  window.addEventListener('scroll', onScroll, { passive: true });
}

function rafLoop(ts) {
  if (lastRafTs !== null) {
    const delta = ts - lastRafTs;
    frameTimes.push(delta);
    if (frameTimes.length > SPARK_FRAMES) frameTimes.shift();
    if (delta > FRAME_BUDGET_MS * 1.5) droppedFrames += 1;
  }
  lastRafTs = ts;

  if (isRuntimeVisible()) updateRuntimeUI();

  requestAnimationFrame(rafLoop);
}

function onScroll() {
  const hint = document.getElementById('prof-rt-scroll-hint');
  if (hint) hint.hidden = true;
  lastScrollTs = performance.now();
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame((rafTs) => {
    const lag = rafTs - lastScrollTs;
    if (lag > HITCH_THRESHOLD_MS) hitchCount += 1;
    scrollPending = false;
  });
}

function updateRuntimeUI() {
  const now = performance.now();
  if (now - lastUIUpdate < 250) return;
  lastUIUpdate = now;

  if (frameTimes.length > 1) {
    const recent = frameTimes.slice(-10);
    const avgDelta = recent.reduce((a, b) => a + b, 0) / recent.length;
    const fps = Math.round(1000 / avgDelta);
    const minFps = Math.round(1000 / Math.max(...frameTimes));
    setRtStat('prof-rt-fps-cur', fps, fpsState(fps));
    setRtStat('prof-rt-fps-min', minFps, fpsState(minFps));
  }

  setRtStat('prof-rt-dropped', droppedFrames, droppedFrames === 0 ? 'good' : droppedFrames < 5 ? 'warn' : 'bad');

  const lafCntEl = document.getElementById('prof-rt-laf-count');
  if (lafCntEl) {
    lafCntEl.textContent = String(lafCount);
    lafCntEl.dataset.state = lafCount === 0 ? 'good' : lafCount < 3 ? 'warn' : 'bad';
  }

  const lafWorstEl = document.getElementById('prof-rt-laf-worst');
  if (lafWorstEl) {
    if (lafWorstBlock > 0) {
      lafWorstEl.replaceChildren();
      const span = document.createElement('span');
      span.dataset.state = lafWorstBlock < 100 ? 'warn' : 'bad';
      span.textContent = String(Math.round(lafWorstBlock));
      const unit = document.createElement('span');
      unit.className = 'prof-rt-metric-val-unit';
      unit.textContent = 'ms';
      span.appendChild(unit);
      lafWorstEl.appendChild(span);
    }
  }

  const hitchEl = document.getElementById('prof-rt-hitches');
  if (hitchEl) {
    hitchEl.textContent = String(hitchCount);
    hitchEl.dataset.state = hitchCount === 0 ? 'good' : hitchCount < 3 ? 'warn' : 'bad';
  }

  const clsEl = document.getElementById('prof-rt-cls');
  const clsBadge = document.getElementById('prof-rt-cls-badge');
  if (clsEl) clsEl.textContent = clsScore.toFixed(3);
  if (clsBadge) {
    const state = clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'warn' : 'bad';
    clsBadge.dataset.state = state;
    clsBadge.textContent = state === 'good' ? 'good' : state === 'warn' ? 'needs improvement' : 'poor';
  }

  drawSparkline();
}

function setRtStat(id, value, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value);
  el.dataset.state = state;
}

function fpsState(fps) {
  return fps >= 55 ? 'good' : fps >= 30 ? 'warn' : 'bad';
}

/* ──────────────────────────────────────────────
   4. Sparkline
────────────────────────────────────────────── */

function drawSparkline() {
  const canvas = document.getElementById('prof-fps-canvas');
  if (!canvas || !frameTimes.length) return;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.offsetWidth;
  const cssH = canvas.offsetHeight;
  if (cssW === 0) return;

  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const MAX_MS = 50;
  const barW = cssW / SPARK_FRAMES;

  /* 60fps budget reference line */
  const budgetY = cssH - (FRAME_BUDGET_MS / MAX_MS) * cssH;
  ctx.strokeStyle = 'rgba(196, 160, 106, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, budgetY);
  ctx.lineTo(cssW, budgetY);
  ctx.stroke();
  ctx.setLineDash([]);

  const frames = frameTimes.slice(-SPARK_FRAMES);
  const startX = cssW - frames.length * barW;
  frames.forEach((dt, i) => {
    const barH = Math.min(cssH, (dt / MAX_MS) * cssH);
    const x = startX + i * barW;
    const color =
      dt <= FRAME_BUDGET_MS * 1.1 ? '#4caf78' :
      dt <= FRAME_BUDGET_MS * 2 ? '#e6a83a' :
      '#e05c5c';
    ctx.fillStyle = color + 'cc';
    ctx.fillRect(x + 1, cssH - barH, Math.max(1, barW - 1.5), barH);
  });
}
