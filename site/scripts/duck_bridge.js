#!/usr/bin/env node
// DuckDB bridge: a SQL utility layer over the library's YAML source of truth.
//
// The YAML in /data stays the single source of truth. This script only:
//   1. Ingests  /data into an in-memory DuckDB so the library can be checked and queried with SQL.
//   2. Exports  rows from DuckDB (e.g. a harvested batch) back out as one YAML file per reference
//               in /data/references, validated against the same Zod schema the site build uses.
//
// CLI (run from site/):
//   node scripts/duck_bridge.js check                      Ingest + SQL integrity checks (exit 1 on errors)
//   node scripts/duck_bridge.js query "<SQL>"              Ingest + run any SQL (tables: brands, calibers, refs, timeline)
//   node scripts/duck_bridge.js export <batch> [options]   Load a batch file (.json/.ndjson/.csv/.parquet) as table
//                                                          `harvest` and export it to data/references/*.yaml
//     --sql "<SQL>"    export the result of this query instead of the whole `harvest` table
//     --overwrite      replace existing YAML files (default: skip them)
//     --dry-run        validate and report without writing anything
//
// Programmatic:
//   import { openLibrary, exportReferences } from './duck_bridge.js';
//   const { conn } = await openLibrary();
//   await exportReferences(conn, 'SELECT * FROM my_table', { overwrite: false });

import { DuckDBInstance } from '@duckdb/node-api';
import { parse as parseYaml } from 'yaml';
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync, rmSync, renameSync } from 'node:fs';
import { join, extname, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { brandsSchema, calibersSchema, referencesSchema, timelineSchema } from '../src/lib/schemas.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DATA = join(ROOT, 'data');
const REFS_DIR = join(DATA, 'references');

/** Collections ingested into DuckDB. `dir` = one YAML file per entry (id = filename); `file` = YAML list with ids. */
const SOURCES = [
  { table: 'brands', dir: 'brands', schema: brandsSchema },
  { table: 'calibers', dir: 'calibers', schema: calibersSchema },
  { table: 'refs', dir: 'references', schema: referencesSchema },
  { table: 'timeline', file: 'timeline.yaml', schema: timelineSchema },
];

// ---------------------------------------------------------------------------
// Zod introspection: lets everything below follow the schema instead of hard-coding fields.
// ---------------------------------------------------------------------------

/** Strip ZodOptional / ZodDefault / ZodNullable wrappers. */
function unwrap(s) {
  while (s?._def?.innerType) s = s._def.innerType;
  return s;
}

const isObjectSchema = (s) => unwrap(s)?._def?.typeName === 'ZodObject';
const shapeOf = (s) => unwrap(s).shape;

/** Every key the schema knows, with nested objects expanded and missing values set to null.
 *  Gives DuckDB a stable column set even when no file uses an optional field. */
function fillShape(schema, value) {
  const out = {};
  for (const [key, field] of Object.entries(shapeOf(schema))) {
    const v = value?.[key];
    out[key] = isObjectSchema(field) ? fillShape(field, v ?? {}) : (v ?? null);
  }
  return out;
}

const toJsonSafe = (v) =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? Number(x) : x)), (_k, x) =>
    typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(x) ? x.slice(0, 10) : x,
  );

const formatIssues = (error) => error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');

// ---------------------------------------------------------------------------
// 1. Ingest to DuckDB
// ---------------------------------------------------------------------------

/** Read one collection from YAML. Rows hold the data exactly as written (no schema defaults filled in),
 *  so an export round-trips byte for byte; schema validation results are returned separately. */
function readCollection(src) {
  const raw = [];
  if (src.dir) {
    const dir = join(DATA, src.dir);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
      raw.push({ id: basename(f, '.yaml'), file: `data/${src.dir}/${f}`, data: parseYaml(readFileSync(join(dir, f), 'utf8')) });
    }
  } else {
    const list = parseYaml(readFileSync(join(DATA, src.file), 'utf8')) ?? [];
    for (const { id, ...data } of list) raw.push({ id, file: `data/${src.file}`, data });
  }
  const rows = [];
  const issues = [];
  for (const r of raw) {
    const res = src.schema.safeParse(r.data);
    if (!res.success) issues.push({ collection: src.table, id: r.id, file: r.file, problem: formatIssues(res.error) });
    rows.push({ id: r.id, ...fillShape(src.schema, r.data) });
  }
  return { rows, issues };
}

/** Load newline-delimited JSON rows into a DuckDB table, letting DuckDB infer the (nested) column types. */
async function loadRows(conn, table, rows, scratch) {
  const path = join(scratch, `${table}.ndjson`);
  writeFileSync(path, rows.map((r) => JSON.stringify(toJsonSafe(r))).join('\n') + '\n');
  await conn.run(
    `CREATE OR REPLACE TABLE ${table} AS SELECT * FROM read_json_auto('${path.replaceAll("'", "''")}', format = 'newline_delimited', sample_size = -1)`,
  );
}

/** Open an in-memory DuckDB and ingest the whole library. Validation problems land in table `_issues`. */
export async function openLibrary() {
  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();
  const scratch = mkdtempSync(join(tmpdir(), 'duck-bridge-'));
  const allIssues = [];
  const counts = {};
  try {
    for (const src of SOURCES) {
      const { rows, issues } = readCollection(src);
      allIssues.push(...issues);
      counts[src.table] = rows.length;
      if (rows.length) await loadRows(conn, src.table, rows, scratch);
    }
    await conn.run('CREATE TABLE _issues (collection VARCHAR, id VARCHAR, file VARCHAR, problem VARCHAR)');
    if (allIssues.length) await loadRows(conn, '_issues', allIssues, scratch);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return { instance, conn, counts };
}

async function rowsOf(conn, sql) {
  const reader = await conn.runAndReadAll(sql);
  return reader.getRowObjectsJS().map((r) => toJsonSafe(r));
}

// ---------------------------------------------------------------------------
// SQL integrity checks
// ---------------------------------------------------------------------------

export const CHECKS = [
  { level: 'error', name: 'Schema violations', sql: `SELECT collection, id, problem FROM _issues ORDER BY 1, 2` },
  {
    level: 'error',
    name: 'Reference points to an unknown brand',
    sql: `SELECT r.id, r.brand FROM refs r ANTI JOIN brands b ON b.id = r.brand ORDER BY 1`,
  },
  {
    level: 'error',
    name: 'Reference points to an unknown caliber_id',
    sql: `SELECT r.id, r.caliber_id FROM refs r WHERE r.caliber_id IS NOT NULL
          AND r.caliber_id NOT IN (SELECT id FROM calibers) ORDER BY 1`,
  },
  {
    level: 'error',
    name: 'Duplicate brand + reference number',
    sql: `SELECT brand, reference, list(id ORDER BY id) AS ids FROM refs WHERE reference IS NOT NULL
          GROUP BY ALL HAVING count(*) > 1 ORDER BY 1, 2`,
  },
  {
    level: 'error',
    name: 'Discontinued before introduced',
    sql: `SELECT id, years.introduced, years.discontinued FROM refs
          WHERE years.discontinued < years.introduced ORDER BY 1`,
  },
  {
    level: 'warning',
    name: 'Introduced before the brand was founded',
    sql: `SELECT r.id, r.years.introduced, b.founded FROM refs r JOIN brands b ON b.id = r.brand
          WHERE r.years.introduced < b.founded ORDER BY 1`,
  },
  { level: 'warning', name: 'Reference without sources', sql: `SELECT id FROM refs WHERE coalesce(len(sources), 0) = 0 ORDER BY 1` },
  {
    level: 'warning',
    name: 'Duplicate timeline event (same year and title)',
    sql: `SELECT year, title, count(*) AS n FROM timeline GROUP BY ALL HAVING count(*) > 1 ORDER BY 1`,
  },
];

export async function runChecks(conn) {
  const results = [];
  for (const c of CHECKS) results.push({ ...c, rows: await rowsOf(conn, c.sql) });
  return results;
}

// ---------------------------------------------------------------------------
// 2. Export to YAML
// ---------------------------------------------------------------------------

const slug = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Lists may arrive as real arrays, JSON text or "a; b" strings (e.g. from CSV). */
function toList(v) {
  if (v == null || v === '') return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('[')) return JSON.parse(t);
    return t.split(/\s*[;|]\s*/).filter(Boolean);
  }
  return [v];
}

/** Turn one relational row into the nested shape the schema expects.
 *  Accepts nested struct columns (`case`, `years`, `look`) or flat ones (`case_diameter_mm`, `years.introduced`). */
export function rowToReference(row, schema = referencesSchema) {
  const shape = shapeOf(schema);
  const out = {};
  for (const [key, field] of Object.entries(shape)) {
    const inner = unwrap(field);
    if (isObjectSchema(field)) {
      const nested = { ...(typeof row[key] === 'object' && row[key] !== null ? row[key] : {}) };
      for (const sub of Object.keys(shapeOf(field))) {
        for (const flat of [`${key}_${sub}`, `${key}.${sub}`]) if (row[flat] != null && row[flat] !== '') nested[sub] = row[flat];
      }
      const cleaned = Object.fromEntries(Object.entries(nested).filter(([, v]) => v != null && v !== ''));
      if (Object.keys(cleaned).length) out[key] = cleaned;
      continue;
    }
    let v = row[key];
    if (inner?._def?.typeName === 'ZodArray') v = toList(v);
    if (v == null || v === '') continue;
    out[key] = v;
  }
  // Numbers from CSV arrive as text; coerce wherever the schema wants a number.
  coerceNumbers(out, schema);
  if (!out.last_reviewed) out.last_reviewed = new Date().toISOString().slice(0, 10);
  return out;
}

function coerceNumbers(obj, schema) {
  for (const [key, field] of Object.entries(shapeOf(schema))) {
    if (obj[key] == null) continue;
    if (isObjectSchema(field)) coerceNumbers(obj[key], field);
    else if (unwrap(field)?._def?.typeName === 'ZodNumber' && typeof obj[key] === 'string' && obj[key].trim() !== '') {
      const n = Number(obj[key]);
      if (!Number.isNaN(n)) obj[key] = n;
    }
  }
}

/** YAML emitter matching the house style of data/: schema key order, double-quoted strings,
 *  two-space indentation, block lists, empty values omitted (the schema supplies defaults). */
export function toYaml(value, schema, indent = 0) {
  const pad = '  '.repeat(indent);
  const lines = [];
  for (const [key, field] of Object.entries(shapeOf(schema))) {
    let v = value[key];
    if (v == null) continue;
    if (v instanceof Date) v = v.toISOString().slice(0, 10);
    if (isObjectSchema(field)) {
      const body = toYaml(v, field, indent + 1);
      if (body) lines.push(`${pad}${key}:`, body);
    } else if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(`${pad}${key}:`, ...v.map((x) => `${pad}  - ${scalar(x)}`));
    } else {
      lines.push(`${pad}${key}: ${scalar(v)}`);
    }
  }
  return lines.join('\n');
}

function scalar(v) {
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/**
 * Export rows from DuckDB to data/references/<id>.yaml.
 * @param conn    DuckDB connection (from openLibrary(), so brands/calibers are available for integrity checks)
 * @param source  a table name or a full SELECT statement
 * @param opts    { overwrite = false, dryRun = false, outDir = data/references }
 * Every file is validated with the site's Zod schema before writing and re-parsed afterwards
 * to prove the YAML round-trips to exactly the same data.
 */
export async function exportReferences(conn, source, { overwrite = false, dryRun = false, outDir = REFS_DIR } = {}) {
  const sql = /^\s*(select|with|from)\b/i.test(source) ? source : `SELECT * FROM ${source}`;
  const rows = await rowsOf(conn, sql);
  const brands = new Set((await rowsOf(conn, 'SELECT id FROM brands')).map((r) => r.id));
  const calibers = new Set((await rowsOf(conn, 'SELECT id FROM calibers')).map((r) => r.id));
  const report = { written: [], skipped: [], invalid: [] };
  const seen = new Set();

  for (const row of rows) {
    const ref = rowToReference(row);
    const id = slug(row.id ?? `${ref.brand}-${ref.name}-${ref.reference ?? ''}`);
    const fail = (problem) => report.invalid.push({ id, problem });

    if (!id) { fail('could not derive an id'); continue; }
    if (seen.has(id)) { fail('duplicate id within this batch'); continue; }
    seen.add(id);

    const parsed = referencesSchema.safeParse(ref);
    if (!parsed.success) { fail(formatIssues(parsed.error)); continue; }
    if (!brands.has(ref.brand)) { fail(`unknown brand "${ref.brand}" (add data/brands/${ref.brand}.yaml first)`); continue; }
    if (ref.caliber_id && !calibers.has(ref.caliber_id)) { fail(`unknown caliber_id "${ref.caliber_id}"`); continue; }

    const yaml = toYaml(ref, referencesSchema) + '\n';
    const reparsed = referencesSchema.safeParse(parseYaml(yaml));
    if (!reparsed.success || !isDeepStrictEqual(toJsonSafe(reparsed.data), toJsonSafe(parsed.data))) {
      fail('YAML did not round-trip to identical data');
      continue;
    }

    const path = join(outDir, `${id}.yaml`);
    if (existsSync(path) && !overwrite) { report.skipped.push({ id, problem: 'file exists (use --overwrite)' }); continue; }
    if (!dryRun) {
      writeFileSync(`${path}.tmp`, yaml);
      renameSync(`${path}.tmp`, path);
    }
    report.written.push({ id, file: `data/references/${id}.yaml` });
  }
  return report;
}

/** Load a batch file into table `harvest`, picking the DuckDB reader from the extension. */
export async function loadBatch(conn, file, table = 'harvest') {
  const path = resolve(file).replaceAll("'", "''");
  const readers = {
    '.json': `read_json_auto('${path}', sample_size = -1)`,
    '.ndjson': `read_json_auto('${path}', format = 'newline_delimited', sample_size = -1)`,
    '.csv': `read_csv_auto('${path}', header = true, all_varchar = true)`,
    '.parquet': `read_parquet('${path}')`,
  };
  const reader = readers[extname(file).toLowerCase()];
  if (!reader) throw new Error(`Unsupported batch format: ${extname(file)} (use .json, .ndjson, .csv or .parquet)`);
  await conn.run(`CREATE OR REPLACE TABLE ${table} AS SELECT * FROM ${reader}`);
  const [{ n }] = await rowsOf(conn, `SELECT count(*) AS n FROM ${table}`);
  return n;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printTable(rows) {
  if (!rows.length) return console.log('  (no rows)');
  console.table(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v) : v]))));
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (name) => rest.includes(name);
  const option = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);

  if (!cmd || !['check', 'query', 'export'].includes(cmd)) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).join('\n').replace(/^\/\/ ?/gm, ''));
    process.exit(cmd ? 1 : 0);
  }

  const { conn, counts } = await openLibrary();
  console.log(`Ingested into DuckDB: ${Object.entries(counts).map(([t, n]) => `${t}=${n}`).join(', ')}`);

  if (cmd === 'query') {
    printTable(await rowsOf(conn, rest[0]));
    return;
  }

  if (cmd === 'check') {
    let errors = 0;
    for (const r of await runChecks(conn)) {
      const mark = r.rows.length === 0 ? '✓' : r.level === 'error' ? '✗' : '!';
      console.log(`${mark} [${r.level}] ${r.name}: ${r.rows.length}`);
      if (r.rows.length && (r.level === 'error' || flag('--verbose'))) printTable(r.rows);
      if (r.level === 'error') errors += r.rows.length;
    }
    if (errors) {
      console.error(`\n${errors} error(s) found.`);
      process.exit(1);
    }
    console.log('\nLibrary integrity OK.');
    return;
  }

  // export
  const batch = rest.find((a, i) => !a.startsWith('--') && rest[i - 1] !== '--sql');
  if (!batch && !option('--sql')) throw new Error('export needs a batch file or --sql "<SELECT ...>"');
  if (batch) console.log(`Loaded ${await loadBatch(conn, batch)} rows from ${batch} into table harvest`);
  const report = await exportReferences(conn, option('--sql') ?? 'harvest', { overwrite: flag('--overwrite'), dryRun: flag('--dry-run') });
  const verb = flag('--dry-run') ? 'Would write' : 'Wrote';
  console.log(`${verb} ${report.written.length} file(s), skipped ${report.skipped.length}, invalid ${report.invalid.length}`);
  for (const w of report.written) console.log(`  + ${w.file}`);
  for (const s of report.skipped) console.log(`  = ${s.id}: ${s.problem}`);
  for (const e of report.invalid) console.log(`  ✗ ${e.id}: ${e.problem}`);
  if (report.invalid.length) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
