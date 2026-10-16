# Harvest batches

Raw, relational input batches collected from research (one row per watch, flat columns such as
`case_diameter_mm` or `years_introduced`). They are **not** a source of truth and the site never reads them.

They are turned into the real source files in `data/references/` with the DuckDB bridge, which validates
every row against the site's Zod schema and refuses to overwrite existing entries:

```bash
cd site
node scripts/duck_bridge.js export ../harvest/rolex-submariner.ndjson --dry-run   # validate only
node scripts/duck_bridge.js export ../harvest/rolex-submariner.ndjson             # write YAML files
node scripts/duck_bridge.js check                                                 # SQL integrity checks
```

Once a reference has been exported, edit its YAML file, not the batch.

| Batch | Rows | Notes |
|---|---|---|
| `rolex-submariner.ndjson` | 23 | Steel Submariner lineage, 1953 to today. Gold and two-tone variants are not included yet. Where sources disagree, the most-supported value is used and the disagreement is noted in `summary`; values that could not be settled are omitted. |
| `casio-g-shock-origin.csv` | 11 | G-Shock Origin square line (5000/5600), 1983 to today. CSV with `;`-separated lists. Unconfirmed values (DW-5000C depth rating, GW-M5610 launch year, original GW-5000 module) are omitted and noted in `summary`. |
