import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionKey } from 'astro:content';

// Public JSON API generated from the YAML/Markdown sources at build time.
// Served at /api/<name>.json and mirrored into the repo's /api folder by CI.
// Output is deterministic (sorted, no timestamps) so the committed copy only changes when the data does.

export const API_COLLECTIONS = ['brands', 'calibers', 'references', 'glossary', 'timeline', 'resources', 'types', 'guides'] as const;

export const getStaticPaths = (() => API_COLLECTIONS.map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const name = params.name as CollectionKey;
  const entries = await getCollection(name);
  const items = entries
    .map((e) => {
      const data = { ...(e.data as Record<string, unknown>) };
      for (const [k, v] of Object.entries(data)) if (v instanceof Date) data[k] = v.toISOString().slice(0, 10);
      const body = 'body' in e && e.body ? { body: e.body.trim() } : {};
      return { id: e.id, ...data, ...body };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  return new Response(JSON.stringify({ collection: name, count: items.length, items }, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json' },
  });
};
