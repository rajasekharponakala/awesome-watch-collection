import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { u, LEVEL_META, TYPE_META, typeOf } from '../lib/meta';

// Static search index for the Crown (⌘K) search.
export const GET: APIRoute = async () => {
  const [guides, types, brands, calibers, refs, glossary, timeline] = await Promise.all([
    getCollection('guides'),
    getCollection('types'),
    getCollection('brands'),
    getCollection('calibers'),
    getCollection('references'),
    getCollection('glossary'),
    getCollection('timeline'),
  ]);
  const brandName = (id: string) => brands.find((b) => b.id === id)?.data.name ?? id;
  const entries = [
    ...guides
      .sort((a, b) => a.data.order - b.data.order)
      .map((g) => ({ t: g.data.title, u: u(`learn/${g.id}/`), k: 'Guide', d: `${LEVEL_META[g.data.level].name} · ${g.data.description}` })),
    ...types.map((t) => ({ t: t.data.title, u: u(`types/${t.id}/`), k: 'Type', d: t.data.tagline })),
    ...refs.map((r) => ({
      t: `${brandName(r.data.brand)} ${r.data.name}`,
      u: u(`catalogue/${r.id}/`),
      k: 'Reference',
      d: `${TYPE_META[typeOf(r.data.type)].name} · ${r.data.styles.join(', ')} · ${r.data.reference ?? ''}`,
    })),
    ...calibers.map((c) => ({ t: c.data.name, u: u(`calibers/#${c.id}`), k: 'Caliber', d: `${c.data.maker} · ${c.data.kind}` })),
    ...brands.map((b) => ({ t: b.data.name, u: u(`brands/${b.id}/`), k: 'Brand', d: `${b.data.country} · est. ${b.data.founded} · ${b.data.group}` })),
    ...glossary.map((g) => ({ t: g.data.term, u: u(`glossary/#${g.id}`), k: 'Term', d: g.data.short })),
    ...timeline.map((t) => ({ t: `${t.data.year}: ${t.data.title}`, u: u(`history/#${t.id}`), k: 'History', d: t.data.text })),
  ];
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json' } });
};
