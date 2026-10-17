import './level';

// Awesome Watch Collection: site runtime.
// Everything is progressive enhancement: pages read fine without it.

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const isHacked = () => root.classList.contains('hacked') || reduced.matches;
const store = {
  get(k: string) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* storage unavailable */ }
  },
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- Theme (lume / day) and hacking seconds ---------- */

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    const next = root.dataset.theme === 'day' ? 'lume' : 'day';
    root.dataset.theme = next;
    store.set('awc-theme', next);
  }),
);

function applyHack(on: boolean) {
  root.classList.toggle('hacked', on);
  document.querySelectorAll<HTMLButtonElement>('[data-hack-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(on)));
  document.querySelectorAll<SVGSVGElement>('svg').forEach((s) => {
    if (typeof s.pauseAnimations === 'function') on ? s.pauseAnimations() : s.unpauseAnimations();
  });
}
applyHack(root.classList.contains('hacked') || reduced.matches);
document.querySelectorAll<HTMLButtonElement>('[data-hack-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    const on = !root.classList.contains('hacked');
    applyHack(on);
    store.set('awc-hacked', on ? '1' : '0');
  }),
);

/* ---------- Header ---------- */

const header = document.querySelector<HTMLElement>('[data-header]');
let lastY = window.scrollY;
function onHeaderScroll() {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  header?.classList.toggle('is-hidden', y > 600 && y > lastY + 4 && !root.classList.contains('menu-open'));
  if (y < lastY - 4 || y < 600) header?.classList.remove('is-hidden');
  lastY = y;
}

const menu = document.getElementById('mobile-menu');
document.querySelector('[data-menu-toggle]')?.addEventListener('click', (e) => {
  const open = !menu?.classList.contains('is-open');
  menu?.classList.toggle('is-open', open);
  root.classList.toggle('menu-open', open);
  (e.currentTarget as HTMLElement).setAttribute('aria-expanded', String(open));
});

/* ---------- Live clock: every [data-hand] on the page ---------- */

const hands = Array.from(document.querySelectorAll<SVGGElement>('[data-hand]'));
const dates = Array.from(document.querySelectorAll<SVGTextElement>('[data-date]'));
const dclock = Array.from(document.querySelectorAll<HTMLElement>('[data-dclock]'));
const readouts = Array.from(document.querySelectorAll<HTMLElement>('[data-readout]'));
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const LDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
let lastTick = -1;
let lastSec = -1;

function tick(now = new Date()) {
  // 28,800 vph = 8 beats per second, so the seconds hand steps every 125 ms.
  const beat = Math.floor(now.getMilliseconds() / 125);
  const key = now.getSeconds() * 8 + beat;
  if (key === lastTick) return;
  lastTick = key;
  const s = now.getSeconds() + beat / 8;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;
  for (const el of hands) {
    const c = el.dataset.cx ?? '200';
    const kind = el.dataset.hand;
    const deg = kind === 'h' ? h * 30 : kind === 'm' ? m * 6 : s * 6;
    el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${c} ${c})`);
  }
  if (now.getSeconds() !== lastSec) {
    lastSec = now.getSeconds();
    for (const d of dates) d.textContent = String(now.getDate());
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    for (const el of dclock) {
      const k = el.dataset.dclock;
      if (k === 'hm') el.textContent = `${hh}:${mm}`;
      else if (k === 's') el.textContent = ss;
      else if (k === 'day') el.textContent = DAYS[now.getDay()];
      else if (k === 'date') el.textContent = `${now.getMonth() + 1}-${String(now.getDate()).padStart(2, '0')}`;
      else if (k === 'long') el.textContent = `${LDAYS[now.getDay()]} ${now.getDate()}`;
    }
    for (const r of readouts) r.textContent = `${hh}:${mm}:${ss}`;
  }
}

/* ---------- Parallax, scroll scenes and horizontal tracks ---------- */

const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
const hscrolls = Array.from(document.querySelectorAll<HTMLElement>('[data-hscroll]'));
const gauges = Array.from(document.querySelectorAll<HTMLElement>('[data-power-reserve]'));
const desktop = window.matchMedia('(min-width: 761px)');

function sceneProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  return total > 0 ? clamp(-r.top / total) : clamp(1 - r.top / window.innerHeight);
}

function onScroll() {
  const vh = window.innerHeight;
  if (!isHacked()) {
    for (const el of parallax) {
      const speed = parseFloat(el.dataset.parallax || '0');
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  }
  for (const el of scenes) {
    const p = sceneProgress(el);
    el.style.setProperty('--p', p.toFixed(4));
    el.dispatchEvent(new CustomEvent('scene', { detail: p }));
  }
  for (const el of hscrolls) {
    const track = el.querySelector<HTMLElement>('[data-track]');
    if (!track) continue;
    if (!desktop.matches) {
      track.style.transform = '';
      continue;
    }
    const p = sceneProgress(el);
    const dist = track.scrollWidth - window.innerWidth;
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px, 0, 0)`;
    el.style.setProperty('--p', p.toFixed(4));
  }
  for (const g of gauges) {
    const target = document.querySelector<HTMLElement>(g.dataset.powerReserve || 'article');
    if (!target) continue;
    const r = target.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    g.style.setProperty('--p', p.toFixed(4));
    const label = g.querySelector('[data-pr-value]');
    if (label) label.textContent = `${Math.round((1 - p) * 100)}%`;
  }
  onHeaderScroll();
}

function sizeHScroll() {
  for (const el of hscrolls) {
    const track = el.querySelector<HTMLElement>('[data-track]');
    if (!track) continue;
    if (desktop.matches) el.style.height = `${track.scrollWidth - window.innerWidth + window.innerHeight}px`;
    else el.style.height = '';
  }
}

/* ---------- Exploded watch scene ---------- */

document.querySelectorAll<HTMLElement>('[data-explode]').forEach((scene) => {
  const stage = scene.querySelector<HTMLElement>('[data-stage]');
  const items = Array.from(scene.querySelectorAll<HTMLElement>('[data-part]'));
  scene.addEventListener('scene', (e) => {
    const p = (e as CustomEvent<number>).detail;
    const e1 = easeInOut(clamp((p - 0.05) / 0.4));
    stage?.style.setProperty('--e', e1.toFixed(4));
    const idx = p < 0.45 ? -1 : Math.min(items.length - 1, Math.floor(((p - 0.45) / 0.5) * items.length));
    items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
    if (stage) stage.dataset.active = idx >= 0 ? items[idx].dataset.part : '';
  });
});

/* ---------- Reveal on scroll ---------- */

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      const count = e.target.querySelectorAll<HTMLElement>('[data-count]');
      count.forEach(runCounter);
      if ((e.target as HTMLElement).dataset.count) runCounter(e.target as HTMLElement);
    }
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
);
document.querySelectorAll('[data-reveal], .split-line, [data-count]').forEach((el) => io.observe(el));

function runCounter(el: HTMLElement) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = parseFloat(el.dataset.count || '0');
  if (isHacked()) {
    el.textContent = end.toLocaleString('en-US');
    return;
  }
  const t0 = performance.now();
  const dur = 1800;
  const step = (t: number) => {
    const k = clamp((t - t0) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))).toLocaleString('en-US');
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Pointer effects: glow, tilt, magnetic ---------- */

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursor = document.querySelector<HTMLElement>('[data-cursor]');

if (fine) {
  window.addEventListener(
    'pointermove',
    (e) => {
      cursor?.style.setProperty('--mx', `${e.clientX}px`);
      cursor?.style.setProperty('--my', `${e.clientY}px`);
    },
    { passive: true },
  );

  document.querySelectorAll<HTMLElement>('.card').forEach((c) =>
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--cx', `${e.clientX - r.left}px`);
      c.style.setProperty('--cy', `${e.clientY - r.top}px`);
    }),
  );

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt || '8');
    el.addEventListener('pointermove', (e) => {
      if (isHacked()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(x * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(-y * max).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (isHacked()) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--bx', `${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px`);
      el.style.setProperty('--by', `${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--bx', '0px');
      el.style.setProperty('--by', '0px');
    });
  });

  // Hero watch follows the pointer in 3D
  document.querySelectorAll<HTMLElement>('[data-follow]').forEach((el) => {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (isHacked()) return;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty('--fx', `${(x * 18).toFixed(2)}deg`);
        el.style.setProperty('--fy', `${(-y * 14).toFixed(2)}deg`);
      },
      { passive: true },
    );
  });
}

/* ---------- The Dial navigation (home) ---------- */

document.querySelectorAll<HTMLElement>('[data-dialnav]').forEach((nav) => {
  const hand = nav.querySelector<HTMLElement>('[data-dialnav-hand]');
  const info = nav.querySelector<HTMLElement>('[data-dialnav-info]');
  nav.querySelectorAll<HTMLAnchorElement>('[data-hour]').forEach((a) => {
    const show = () => {
      const hr = parseInt(a.dataset.hour || '0', 10);
      hand?.style.setProperty('--a', `${hr * 30}deg`);
      if (info) {
        info.querySelector('[data-t]')!.textContent = a.dataset.title || '';
        info.querySelector('[data-d]')!.textContent = a.dataset.desc || '';
      }
    };
    a.addEventListener('pointerenter', show);
    a.addEventListener('focus', show);
  });
});

/* ---------- Crown search (⌘K) ---------- */

type Entry = { t: string; u: string; k: string; d: string };
const crown = document.querySelector<HTMLElement>('[data-crown]');
const input = document.querySelector<HTMLInputElement>('[data-crown-input]');
const results = document.querySelector<HTMLUListElement>('[data-crown-results]');
const countEl = document.querySelector<HTMLElement>('[data-crown-count]');
const base = document.querySelector<HTMLMetaElement>('meta[name="awc-base"]')?.content || '/';
let index: Entry[] | null = null;
let selected = 0;
let lastFocus: Element | null = null;

async function loadIndex() {
  if (index) return index;
  try {
    const res = await fetch(`${base}search.json`);
    index = (await res.json()) as Entry[];
  } catch {
    index = [];
  }
  return index;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

async function render(q: string) {
  const data = await loadIndex();
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const hits = terms.length
    ? data
        .map((e) => {
          const hay = `${e.t} ${e.d} ${e.k}`.toLowerCase();
          if (!terms.every((t) => hay.includes(t))) return null;
          const score = terms.reduce((s, t) => s + (e.t.toLowerCase().includes(t) ? 10 : 1) + (e.t.toLowerCase().startsWith(t) ? 5 : 0), 0);
          return { e, score };
        })
        .filter((x): x is { e: Entry; score: number } => !!x)
        .sort((a, b) => b.score - a.score)
        .slice(0, 40)
        .map((x) => x.e)
    : data.filter((e) => e.k === 'Guide').slice(0, 8);
  selected = 0;
  if (!results) return;
  results.innerHTML = hits.length
    ? hits
        .map(
          (e, i) =>
            `<li><a href="${escapeHtml(e.u)}" role="option" aria-selected="${i === 0}"><span class="kind">${escapeHtml(e.k)}</span><span><span class="t">${escapeHtml(e.t)}</span><span class="d">${escapeHtml(e.d)}</span></span></a></li>`,
        )
        .join('')
    : `<li class="crown-search__empty">Nothing found. Try “diver”, “tourbillon” or “Seiko”.</li>`;
  if (countEl) countEl.textContent = terms.length ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : 'Start here';
}

function openCrown() {
  if (!crown) return;
  lastFocus = document.activeElement;
  crown.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  render(input?.value || '');
  setTimeout(() => input?.focus(), 50);
}
function closeCrown() {
  crown?.classList.remove('is-open');
  document.body.style.overflow = '';
  (lastFocus as HTMLElement | null)?.focus?.();
}

document.querySelectorAll('[data-crown-open]').forEach((b) => b.addEventListener('click', openCrown));
crown?.addEventListener('click', (e) => {
  if (e.target === crown) closeCrown();
});
input?.addEventListener('input', () => render(input.value));
window.addEventListener('keydown', (e) => {
  const open = crown?.classList.contains('is-open');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    open ? closeCrown() : openCrown();
  } else if (!open && e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
    e.preventDefault();
    openCrown();
  } else if (open && e.key === 'Escape') {
    closeCrown();
  } else if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    const links = Array.from(results?.querySelectorAll('a') || []);
    if (!links.length) return;
    selected = (selected + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links.forEach((l, i) => l.setAttribute('aria-selected', String(i === selected)));
    links[selected].scrollIntoView({ block: 'nearest' });
  } else if (open && e.key === 'Enter') {
    const a = results?.querySelectorAll('a')[selected];
    if (a) {
      e.preventDefault();
      window.location.href = a.href;
    }
  }
});

/* ---------- Main loop ---------- */

let ticking = false;
function requestScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    onScroll();
    ticking = false;
  });
}
window.addEventListener('scroll', requestScroll, { passive: true });
window.addEventListener('resize', () => {
  sizeHScroll();
  requestScroll();
});
document.fonts?.ready.then(() => {
  sizeHScroll();
  onScroll();
});
sizeHScroll();
onScroll();

tick();
function loop() {
  if (!isHacked()) tick();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Expose for page-level scripts
(window as unknown as { awc: object }).awc = { store, clamp };
