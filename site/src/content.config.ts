// Every collection here is validated at build time, so a malformed entry fails CI
// before it can reach the live site. Content lives outside `site/` in /content and /data.
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

import { LEVELS, TYPES, TIERS } from './lib/meta';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    level: z.enum(LEVELS),
    order: z.number(),
    tags: z.array(z.string()).default([]),
    last_reviewed: z.coerce.date(),
  }),
});

const types = defineCollection({
  loader: glob({ pattern: '*.md', base: '../content/types' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    glyph: z.enum(TYPES),
    subcategories: z.array(z.object({ name: z.string(), text: z.string() })),
    facts: z.array(z.object({ k: z.string(), v: z.coerce.string() })),
    last_reviewed: z.coerce.date(),
  }),
});

const brands = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/brands' }),
  schema: z.object({
    name: z.string(),
    country: z.string(),
    city: z.string().optional(),
    founded: z.number(),
    founders: z.array(z.string()).default([]),
    group: z.string(),
    tier: z.enum(TIERS),
    types: z.array(z.enum(TYPES)),
    summary: z.string(),
    notable: z.array(z.string()).default([]),
    website: z.string().url().optional(),
    last_reviewed: z.coerce.date(),
  }),
});

const calibers = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/calibers' }),
  schema: z.object({
    name: z.string(),
    maker: z.string(),
    kind: z.enum(['automatic', 'manual', 'quartz', 'spring-drive']),
    frequency_vph: z.number().optional(),
    quartz_hz: z.number().optional(),
    jewels: z.number().optional(),
    power_reserve_h: z.number().optional(),
    accuracy: z.string().optional(),
    hacking: z.boolean().optional(),
    hand_winding: z.boolean().optional(),
    functions: z.array(z.string()).default([]),
    introduced: z.number().optional(),
    summary: z.string(),
    last_reviewed: z.coerce.date(),
  }),
});

const references = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/references' }),
  schema: z.object({
    brand: z.string(),
    name: z.string(),
    reference: z.string().optional(),
    type: z.string().regex(/^(mechanical|quartz|digital|smart|hybrid|exotic)\/[a-z-]+$/),
    styles: z.array(z.string()).default([]),
    complications: z.array(z.string()).default([]),
    caliber: z.string().optional(),
    caliber_id: z.string().optional(),
    case: z
      .object({
        material: z.string().optional(),
        diameter_mm: z.number().optional(),
        lug_to_lug_mm: z.number().optional(),
        thickness_mm: z.number().optional(),
        lug_width_mm: z.number().optional(),
      })
      .default({}),
    water_resistance_m: z.number().optional(),
    crystal: z.string().optional(),
    years: z.object({ introduced: z.number().optional(), discontinued: z.number().optional() }).default({}),
    price_tier: z.enum(TIERS),
    levels: z.array(z.enum(LEVELS)).default([]),
    region: z.string(),
    summary: z.string(),
    look: z
      .object({
        dial: z.string().default('#15181d'),
        accent: z.string().default('#e9e4d8'),
        metal: z.enum(['steel', 'gold', 'titanium', 'black', 'resin']).default('steel'),
        bezel: z.enum(['none', 'dive', 'tachy', 'octagon']).default('none'),
      })
      .default({}),
    sources: z.array(z.string().url()).default([]),
    last_reviewed: z.coerce.date(),
  }),
});

const glossary = defineCollection({
  loader: file('../data/glossary.yaml'),
  schema: z.object({
    term: z.string(),
    short: z.string(),
    level: z.enum(LEVELS),
    related: z.array(z.string()).default([]),
  }),
});

const timeline = defineCollection({
  loader: file('../data/timeline.yaml'),
  schema: z.object({
    year: z.number(),
    month: z.number().optional(),
    day: z.number().optional(),
    era: z.string(),
    title: z.string(),
    text: z.string(),
  }),
});

const resources = defineCollection({
  loader: file('../data/resources.yaml'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['book', 'video', 'forum', 'museum', 'school', 'tool', 'magazine', 'event']),
    url: z.string().url().optional(),
    level: z.enum(LEVELS),
    text: z.string(),
  }),
});

export const collections = { guides, types, brands, calibers, references, glossary, timeline, resources };
