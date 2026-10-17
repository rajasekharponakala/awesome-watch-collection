// Reader level: asked once (gently) and used to personalise the site.
// Stored only in this browser. Elements opt in with data attributes:
//   [data-level-open]          opens the picker (e.g. the header badge)
//   [data-level-badge]         shows the reader's jewels, or "Set level"
//   [data-level-cta]           becomes "Continue: <level>" linking to that level
//   [data-level-card="<id>"]   gets .is-mine when it matches the reader's level

type Level = { id: string; name: string; jewels: number; stage: string; blurb: string; href: string };

const KEY = 'awc-level';
const DISMISSED = 'awc-level-dismissed';
const store = {
  get: (k: string) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set: (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch { /* storage unavailable */ }
  },
};

const sheet = document.querySelector<HTMLElement>('[data-level-sheet]');
const levels: Level[] = JSON.parse(document.getElementById('lp-levels')?.textContent || '[]');
const byId = (id: string | null) => levels.find((l) => l.id === id);
let lastFocus: Element | null = null;
let score = 0;

const jewelsHtml = (n: number) => [1, 2, 3, 4].map((j) => `<i class="${j > n ? 'off' : ''}"></i>`).join('');

function show(step: string, focus = true) {
  sheet?.querySelectorAll<HTMLElement>('[data-lp-step]').forEach((s) => (s.hidden = s.dataset.lpStep !== step));
  if (focus) sheet?.querySelector<HTMLElement>(`[data-lp-step="${step}"] button, [data-lp-step="${step}"] a`)?.focus({ preventScroll: true });
}

/** focus=false for the automatic first-visit prompt, so it never pulls focus from what the reader is doing. */
export function openPicker(step = 'pick', focus = true) {
  if (!sheet) return;
  lastFocus = document.activeElement;
  score = 0;
  sheet.hidden = false;
  const current = store.get(KEY);
  sheet.querySelectorAll('[data-level-choose]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-level-choose') === current)));
  show(step, focus);
}

function closePicker(dismissed: boolean) {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  if (dismissed && !store.get(KEY)) store.set(DISMISSED, '1');
  (lastFocus as HTMLElement | null)?.focus?.({ preventScroll: true });
}

function setLevel(id: string) {
  store.set(KEY, id);
  apply();
}

/** Reflect the saved level everywhere on the page. */
export function apply() {
  const lvl = byId(store.get(KEY));
  document.documentElement.dataset.level = lvl?.id ?? '';
  document.querySelectorAll<HTMLElement>('[data-level-badge]').forEach((el) => {
    el.innerHTML = lvl ? `<span class="jewels">${jewelsHtml(lvl.jewels)}</span><span>${lvl.name}</span>` : '<span>Set your level</span>';
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-level-cta]').forEach((a) => {
    if (!a.dataset.defaultLabel) a.dataset.defaultLabel = a.querySelector('[data-label]')?.textContent ?? '';
    const label = a.querySelector('[data-label]');
    if (lvl) {
      a.href = lvl.href;
      if (label) label.textContent = `Continue: ${lvl.name}`;
    } else if (label) {
      label.textContent = a.dataset.defaultLabel ?? '';
    }
  });
  document.querySelectorAll<HTMLElement>('[data-level-card]').forEach((el) => el.classList.toggle('is-mine', el.dataset.levelCard === lvl?.id));
}

function showResult() {
  const id = score <= 1 ? 'first-wind' : score === 2 ? 'automatic' : score === 3 ? 'complication' : 'grande-complication';
  const lvl = byId(id)!;
  setLevel(id);
  const q = (s: string) => sheet?.querySelector<HTMLElement>(s);
  q('[data-lp-result-name]')!.innerHTML = `${lvl.name} <em>(${score} of 4)</em>`;
  q('[data-lp-result-jewels]')!.innerHTML = jewelsHtml(lvl.jewels);
  q('[data-lp-result-blurb]')!.textContent = lvl.blurb;
  const link = q('[data-lp-result-link]') as HTMLAnchorElement;
  link.href = lvl.href;
  link.textContent = `Start ${lvl.name}`;
  show('result');
}

if (sheet) {
  sheet.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('button, a');
    if (!t) return;
    if (t.dataset.levelChoose) {
      setLevel(t.dataset.levelChoose);
      const lvl = byId(t.dataset.levelChoose)!;
      closePicker(false);
      // Take them straight to their path unless they are already reading something.
      if (document.body.dataset.page === 'home') window.location.href = lvl.href;
    } else if (t.dataset.lpGo) {
      score = 0;
      show(t.dataset.lpGo);
    } else if (t.dataset.lpAnswer != null) {
      if (t.dataset.lpCorrect === 'true') score++;
      const next = Number(t.dataset.lpAnswer) + 1;
      if (sheet.querySelector(`[data-lp-step="quiz-${next}"]`)) show(`quiz-${next}`);
      else showResult();
    } else if (t.hasAttribute('data-level-dismiss')) {
      closePicker(true);
    } else if (t.hasAttribute('data-level-close')) {
      closePicker(false);
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closePicker(true);
  });
}

document.querySelectorAll('[data-level-open]').forEach((b) =>
  b.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.remove('is-open');
    document.documentElement.classList.remove('menu-open');
    openPicker();
  }),
);

apply();

// Ask once, gently: only on the home page, only if never answered or dismissed.
if (document.body.dataset.page === 'home' && !store.get(KEY) && !store.get(DISMISSED)) {
  window.setTimeout(() => openPicker('pick', false), 2200);
}
