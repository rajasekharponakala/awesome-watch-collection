// Shared vocabulary for the whole site: levels, types, tiers and the URL helper.

export const LEVELS = ['first-wind', 'automatic', 'complication', 'grande-complication'] as const;
export const TYPES = ['mechanical', 'quartz', 'digital', 'smart', 'hybrid', 'exotic'] as const;
export const TIERS = ['entry', 'affordable', 'mid-range', 'luxury', 'haute-horlogerie'] as const;

export type Level = (typeof LEVELS)[number];
export type WatchType = (typeof TYPES)[number];
export type Tier = (typeof TIERS)[number];

export const LEVEL_META: Record<Level, { name: string; jewels: number; stage: string; blurb: string }> = {
  'first-wind': {
    name: 'First Wind',
    jewels: 1,
    stage: 'Beginner',
    blurb: 'Anatomy, the main types, reading a spec sheet and choosing your first watch with confidence.',
  },
  automatic: {
    name: 'Automatic',
    jewels: 2,
    stage: 'Intermediate',
    blurb: 'How a movement works, accuracy, materials, where to buy and how to build a coherent collection.',
  },
  complication: {
    name: 'Complication',
    jewels: 3,
    stage: 'Advanced',
    blurb: 'Complications, hand-finishing, chronometer standards and the art of vintage collecting.',
  },
  'grande-complication': {
    name: 'Grande Complication',
    jewels: 4,
    stage: 'Pro',
    blurb: 'Escapement theory, tourbillons, chiming works and watchmaking at the bench.',
  },
};

export const TYPE_META: Record<WatchType, { name: string; short: string }> = {
  mechanical: { name: 'Mechanical', short: 'Springs, gears and a beating heart.' },
  quartz: { name: 'Quartz Analog', short: 'A crystal vibrating 32,768 times a second.' },
  digital: { name: 'Digital', short: 'Time as numbers, from LED to LCD.' },
  smart: { name: 'Smartwatch', short: 'A computer that also tells time.' },
  hybrid: { name: 'Hybrid', short: 'Where mechanics meet electronics.' },
  exotic: { name: 'Exotic', short: 'Tuning forks, jump hours and the beautifully strange.' },
};

export const TIER_META: Record<Tier, { name: string; range: string }> = {
  entry: { name: 'Entry', range: '< $200' },
  affordable: { name: 'Affordable', range: '$200 – $1,000' },
  'mid-range': { name: 'Mid-range', range: '$1,000 – $5,000' },
  luxury: { name: 'Luxury', range: '$5,000 – $50,000' },
  'haute-horlogerie': { name: 'Haute Horlogerie', range: '$50,000+' },
};

/** Build a site-relative URL that respects the GitHub Pages base path. */
export function u(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}

export const typeOf = (t: string) => t.split('/')[0] as WatchType;
export const subtypeOf = (t: string) => t.split('/')[1]?.replace(/-/g, ' ') ?? '';
