// Lineage helpers: order a model line chronologically and describe what changed between steps.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Ref = CollectionEntry<'references'>;

/** Members of a lineage, oldest first; references without a known year go last. */
export async function lineageMembers(lineageId: string): Promise<Ref[]> {
  const refs = await getCollection('references', (r) => r.data.lineage === lineageId);
  return refs.sort((a, b) => {
    const ya = a.data.years.introduced ?? Infinity;
    const yb = b.data.years.introduced ?? Infinity;
    return ya - yb || (a.data.reference ?? a.id).localeCompare(b.data.reference ?? b.id);
  });
}

/** Features worth calling out when they appear or disappear between two references. */
const NOTABLE = ['date', 'backlight', 'Tough Solar', 'Multi-Band 6 radio sync', 'Bluetooth sync', 'chronograph'];

const shortCaliber = (c: string) => c.replace(/^(Rolex|Casio|Omega|Seiko|Tudor|Grand Seiko)\s+/i, '').replace(/^module\s+/i, 'module ');

const MATERIALS = ['resin', 'steel', '904l', 'titanium', 'gold', 'ceramic', 'carbon', 'bronze'];
const materials = (s: string) =>
  MATERIALS.filter((m) => s.toLowerCase().replace('oystersteel', 'steel 904l').includes(m)).join('+');

/** Short "what changed" chips comparing a reference with the one before it in the lineage. */
export function changesFrom(prev: Ref | undefined, cur: Ref): string[] {
  if (!prev) return ['The beginning'];
  const a = prev.data;
  const b = cur.data;
  const out: string[] = [];
  const num = (x?: number, y?: number, unit = '') => (x != null && y != null && x !== y ? `${x} → ${y}${unit}` : null);

  const dia = num(a.case.diameter_mm, b.case.diameter_mm, ' mm');
  if (dia) out.push(dia);
  const wr = num(a.water_resistance_m, b.water_resistance_m, ' m water resistance');
  if (wr) out.push(wr);
  if (a.crystal && b.crystal && a.crystal.split(' ')[0].toLowerCase() !== b.crystal.split(' ')[0].toLowerCase()) {
    out.push(`${a.crystal.split(' ')[0]} → ${b.crystal}`);
  }
  // Compare what the case is made of, not how the material is worded.
  if (a.case.material && b.case.material && materials(a.case.material) !== materials(b.case.material)) out.push(`Case: ${b.case.material}`);
  if (a.caliber && b.caliber && a.caliber !== b.caliber) out.push(`Movement: ${shortCaliber(b.caliber)}`);
  for (const f of NOTABLE) {
    const had = a.complications.includes(f);
    const has = b.complications.includes(f);
    if (has && !had) out.push(`+ ${f}`);
    if (had && !has) out.push(`− ${f}`);
  }
  return out;
}

/** Nicknames that name a genuine sub-family (kept), as opposed to colourways like "Hulk" (dropped). */
const BRANCH_NICKNAMES = ['big crown'];

/** Model name without colour nickname or series note: 'Submariner Date "Hulk"' -> 'submariner date'. */
const baseName = (n: string) =>
  n
    .replace(/"([^"]*)"/g, (_m, nick: string) => (BRANCH_NICKNAMES.includes(nick.toLowerCase()) ? nick : ''))
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * The reference each member evolved from: the latest earlier member with the same base model
 * (so date and no-date branches are compared within their own branch), else the previous one in time.
 */
export function predecessors(members: Ref[]): (Ref | undefined)[] {
  return members.map((m, i) => {
    const earlier = members.slice(0, i);
    const same = earlier.filter((e) => baseName(e.data.name) === baseName(m.data.name));
    return same.at(-1) ?? earlier.at(-1);
  });
}

/** "1953 – today" style span for a set of members. */
export function lineageSpan(members: Ref[]): { from?: number; to: string } {
  const years = members.map((m) => m.data.years.introduced).filter((y): y is number => y != null);
  const from = years.length ? Math.min(...years) : undefined;
  const current = members.some((m) => m.data.years.current);
  const lastEnd = Math.max(...members.map((m) => m.data.years.discontinued ?? 0));
  return { from, to: current ? 'today' : String(lastEnd || '') };
}
