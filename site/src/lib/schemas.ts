// Zod schemas for every content collection: the single definition of what valid data looks like.
// Imported by content.config.ts (site build) and by scripts/duck_bridge.js (data tooling),
// so both enforce exactly the same rules. Keep this file free of Astro-only imports.
import { z } from 'astro/zod';

export const LEVELS = ['first-wind', 'automatic', 'complication', 'grande-complication'] as const;
export const TYPES = ['mechanical', 'quartz', 'digital', 'smart', 'hybrid', 'exotic'] as const;
export const TIERS = ['entry', 'affordable', 'mid-range', 'luxury', 'haute-horlogerie'] as const;

export const guidesSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(LEVELS),
  order: z.number(),
  tags: z.array(z.string()).default([]),
  last_reviewed: z.coerce.date(),
});

export const typesSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  order: z.number(),
  glyph: z.enum(TYPES),
  subcategories: z.array(z.object({ name: z.string(), text: z.string() })),
  facts: z.array(z.object({ k: z.string(), v: z.coerce.string() })),
  last_reviewed: z.coerce.date(),
});

export const brandsSchema = z.object({
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
});

export const calibersSchema = z.object({
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
});

export const referencesSchema = z.object({
  brand: z.string(),
  name: z.string(),
  reference: z.string().optional(),
  /** Id of a file in data/lineages/ when the watch belongs to a model line (e.g. "rolex-submariner"). */
  lineage: z.string().optional(),
  /** One line on what this reference changed in its lineage, e.g. "First Submariner with crown guards". */
  milestone: z.string().optional(),
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
  years: z
    .object({
      introduced: z.number().optional(),
      discontinued: z.number().optional(),
      /** True only when the reference is known to be in production today. A missing end year does not imply this. */
      current: z.boolean().optional(),
    })
    .default({}),
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
});

export const glossarySchema = z.object({
  term: z.string(),
  short: z.string(),
  level: z.enum(LEVELS),
  related: z.array(z.string()).default([]),
});

export const timelineSchema = z.object({
  year: z.number(),
  month: z.number().optional(),
  day: z.number().optional(),
  era: z.string(),
  title: z.string(),
  text: z.string(),
});

export const resourcesSchema = z.object({
  name: z.string(),
  kind: z.enum(['book', 'video', 'forum', 'museum', 'school', 'tool', 'magazine', 'event']),
  url: z.string().url().optional(),
  level: z.enum(LEVELS),
  text: z.string(),
});

export const lineagesSchema = z.object({
  name: z.string(),
  brand: z.string(),
  tagline: z.string(),
  intro: z.string(),
  order: z.number().default(100),
  sources: z.array(z.string().url()).default([]),
  last_reviewed: z.coerce.date(),
});
