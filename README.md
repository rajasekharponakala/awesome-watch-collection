# ⌚ Awesome Watch Collection

> An open, community-built encyclopaedia of watches: mechanical, automatic, quartz, digital, smart and hybrid,
> organised from **First Wind** (beginner) to **Grande Complication** (pro).

**🌐 Website:** https://rajasekharponakala.github.io/awesome-watch-collection/
(a watch-themed site with a live 3D exploded watch, crown search, bezel filters and lume mode)

📐 [Master Plan](PLAN.md) · 🛠 [Contributing](CONTRIBUTING.md)

---

## Learning paths

| Level | Name | For | Guides |
|---|---|---|---|
| 💎 | **First Wind** | Beginners | [Anatomy of a watch](content/guides/first-wind/anatomy-of-a-watch.md) · [Watch types explained](content/guides/first-wind/watch-types-explained.md) · [Reading the spec sheet](content/guides/first-wind/reading-the-spec-sheet.md) · [Choosing your first watch](content/guides/first-wind/choosing-your-first-watch.md) · [Straps and bracelets](content/guides/first-wind/straps-and-bracelets.md) · [Care basics](content/guides/first-wind/care-basics.md) |
| 💎💎 | **Automatic** | Intermediate | [How a mechanical movement works](content/guides/automatic/how-a-mechanical-movement-works.md) · [Accuracy and regulation](content/guides/automatic/accuracy-and-regulation.md) · [Materials, crystals and lume](content/guides/automatic/materials-crystals-and-lume.md) · [Buying new, grey and pre-owned](content/guides/automatic/buying-new-grey-preowned.md) · [Servicing](content/guides/automatic/servicing.md) |
| 💎💎💎 | **Complication** | Advanced | [Complications explained](content/guides/complication/complications-explained.md) · [Finishing and decoration](content/guides/complication/finishing-and-decoration.md) · [Certifications and standards](content/guides/complication/certifications-and-standards.md) · [Vintage collecting](content/guides/complication/vintage-collecting.md) |
| 💎💎💎💎 | **Grande Complication** | Pro | [Escapements, a deep dive](content/guides/grande-complication/escapements-deep-dive.md) · [Tourbillons and regulation showpieces](content/guides/grande-complication/tourbillons-and-regulation-showpieces.md) · [Watchmaking at home](content/guides/grande-complication/watchmaking-at-home.md) |

## Watch families

- [**Mechanical**](content/types/mechanical.md): manual-wind, automatic, micro-rotor, peripheral rotor
- [**Quartz Analog**](content/types/quartz.md): standard, HAQ, solar, kinetic, radio and GPS
- [**Digital**](content/types/digital.md): LCD, LED, ana-digi, rugged
- [**Smartwatch**](content/types/smart.md): full OS, fitness, outdoor multisport
- [**Hybrid**](content/types/hybrid.md): Spring Drive, hybrid-smart, mecaquartz
- [**Exotic**](content/types/exotic.md): tuning fork, jump hour, wandering hour, concept pieces

## The library

| Collection | Where | Entries |
|---|---|---|
| Watch references | [`data/references/`](data/references) | 49 (incl. the steel Rolex Submariner lineage and the G-Shock Origin square line, 1953 to today) |
| Lineages | [`data/lineages/`](data/lineages) | 2 (Rolex Submariner, G-Shock Origin), each a scroll-through timeline on the site |
| Calibers (movements) | [`data/calibers/`](data/calibers) | 14 |
| Brands | [`data/brands/`](data/brands) | 25 |
| Glossary | [`data/glossary.yaml`](data/glossary.yaml) | 88 terms |
| Timeline | [`data/timeline.yaml`](data/timeline.yaml) | 34 events |
| Resources | [`data/resources.yaml`](data/resources.yaml) | Books, channels, forums, museums, schools |

## Data and the JSON API

The library has one source of truth: human-friendly **YAML** in [`data/`](data) and **Markdown** in [`content/`](content).
Contributors only ever edit those files.

```
data/*.yaml, content/*.md  ──build──▶  schema validation  ──▶  website pages
                                                         └──▶  JSON API  ──▶  /api/*.json (site + repo)
```

- **Validated:** every build checks each entry against the schemas in [`site/src/content.config.ts`](site/src/content.config.ts). Bad data fails CI.
- **SQL checks with DuckDB:** [`site/scripts/duck_bridge.js`](site/scripts/duck_bridge.js) loads the YAML into an in-memory DuckDB and runs integrity checks that a per-file schema can't do (unknown brands or calibers, duplicate references, impossible dates). It can also run any SQL over the library and export relational batches, such as [`harvest/`](harvest), into validated YAML files.
- **JSON in the repo:** [`api/`](api) holds a generated JSON copy of every collection (`brands`, `calibers`, `references`, `glossary`, `timeline`, `resources`, `types`, `guides`), plus [`api/index.json`](api/index.json). The [pipeline](.github/workflows/deploy.yml) regenerates and commits it on every change to `main`. **Don't edit these files by hand.**
- **JSON on the web:** the same files are served at `https://rajasekharponakala.github.io/awesome-watch-collection/api/<collection>.json`, so other projects can use the data directly.
- **Locally (from `site/`):**
  - `npm run data:check`: SQL integrity checks (CI fails on errors)
  - `npm run data:query -- "SELECT reference, years.introduced FROM refs WHERE brand = 'rolex' ORDER BY 2"`: query the library
  - `npm run data:export -- ../harvest/<batch>.ndjson`: turn a harvested batch into `data/references/*.yaml` (add `--dry-run` to validate only)
  - `npm run export`: rebuild the site and refresh `/api`

On every push to `main`, [`deploy.yml`](.github/workflows/deploy.yml) runs one ordered pipeline: install → `data:check` → build and regenerate `/api` → auto-commit `/api` (`chore: sync API dataset [skip ci]`) → deploy to GitHub Pages. Pull requests get the same validation and build, without committing or deploying.

## The site speaks watch

| Watch | Site |
|---|---|
| **Dial** | Home page, with 12 hour markers leading to 12 sections |
| **Crown** | Search: press `⌘K` or `/` |
| **Bezel** | The catalogue's filters: a rotating family bezel plus brand, lineage, decade, case size, depth rating, features, crystal, material and more, with live counts and shareable URLs |
| **Lume** | Night theme (the day dial is the light theme) |
| **Power reserve** | Reading progress on guides |
| **Jewels** | Difficulty level, and the reader's own level (asked once, gently, on a first visit) |
| **Lineages** | A model line traced reference by reference, with what each one changed |
| **Hacking seconds** | Pause all motion |
| **Caseback** | About page |
| **Out of beat** | 404 page |

Built with [Astro](https://astro.build), deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```bash
cd site && npm install && npm run dev
```

## License

Content (`/content`, `/data`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · Code: [MIT](LICENSE)
