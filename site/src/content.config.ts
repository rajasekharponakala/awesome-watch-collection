// Every collection here is validated at build time, so a malformed entry fails CI
// before it can reach the live site. Content lives outside `site/` in /content and /data.
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';

import {
  guidesSchema,
  typesSchema,
  brandsSchema,
  calibersSchema,
  referencesSchema,
  glossarySchema,
  timelineSchema,
  resourcesSchema,
  lineagesSchema,
} from './lib/schemas';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../content/guides' }),
  schema: guidesSchema,
});

const types = defineCollection({
  loader: glob({ pattern: '*.md', base: '../content/types' }),
  schema: typesSchema,
});

const brands = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/brands' }),
  schema: brandsSchema,
});

const calibers = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/calibers' }),
  schema: calibersSchema,
});

const references = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/references' }),
  schema: referencesSchema,
});

const lineages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: '../data/lineages' }),
  schema: lineagesSchema,
});

const glossary = defineCollection({
  loader: file('../data/glossary.yaml'),
  schema: glossarySchema,
});

const timeline = defineCollection({
  loader: file('../data/timeline.yaml'),
  schema: timelineSchema,
});

const resources = defineCollection({
  loader: file('../data/resources.yaml'),
  schema: resourcesSchema,
});

export const collections = { guides, types, brands, calibers, references, lineages, glossary, timeline, resources };
