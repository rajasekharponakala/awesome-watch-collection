import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { API_COLLECTIONS } from './[name].json';

export const GET: APIRoute = async () => {
  const collections = await Promise.all(
    API_COLLECTIONS.map(async (name) => ({ name, path: `${name}.json`, count: (await getCollection(name)).length })),
  );
  const index = {
    name: 'Awesome Watch Collection API',
    description: 'Static JSON generated from /data and /content. Edit the YAML/Markdown sources, not these files.',
    license: { content: 'CC BY-SA 4.0', code: 'MIT' },
    collections,
  };
  return new Response(JSON.stringify(index, null, 2) + '\n', { headers: { 'Content-Type': 'application/json' } });
};
