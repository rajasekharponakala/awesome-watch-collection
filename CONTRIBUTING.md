# The Escapement: contributing

An escapement moves a watch forward one small impulse at a time. This library grows the same way. Every
correction, reference or guide is a beat. Thank you for adding yours.

## Ways to contribute

| You want to… | Edit |
|---|---|
| Add a watch to the catalogue | `data/references/<brand>-<model>.yaml` |
| Add a movement | `data/calibers/<maker>-<calibre>.yaml` |
| Add a brand | `data/brands/<brand>.yaml` |
| Add a lineage (a model line) | `data/lineages/<id>.yaml`, then tag members with `lineage` |
| Add a glossary term | `data/glossary.yaml` (keep it alphabetical) |
| Add a history event | `data/timeline.yaml` |
| Add a book, channel, museum… | `data/resources.yaml` |
| Write or improve a guide | `content/guides/<level>/<slug>.md` |
| Improve a type hub | `content/types/<type>.md` |
| Improve the website | `site/src/` |

Never edit `/api/*.json` directly. It is generated from these sources and kept in sync automatically.

Copy an existing file as a template. The fields are validated by the schemas in
[`site/src/content.config.ts`](site/src/content.config.ts), so the build will tell you exactly what is wrong.

### Levels

Every guide, term and reference is tagged with one or more levels:

| Level | id | Audience |
|---|---|---|
| 💎 First Wind | `first-wind` | Beginners |
| 💎💎 Automatic | `automatic` | Intermediate |
| 💎💎💎 Complication | `complication` | Advanced |
| 💎💎💎💎 Grande Complication | `grande-complication` | Pro |

### Watch types

A reference's `type` is `<family>/<subtype>`, where the family is one of
`mechanical`, `quartz`, `digital`, `smart`, `hybrid` or `exotic`. Examples: `mechanical/automatic`,
`quartz/solar`, `digital/lcd`, `smart/full-os`, `hybrid/spring-drive`.

### Lineages

A lineage is a model line followed through time, such as the Rolex Submariner. Create `data/lineages/<id>.yaml`
(name, brand, tagline, intro, sources), then on each member reference set:

```yaml
lineage: "rolex-submariner"
milestone: "First with crown guards, a 40 mm case and chronometer certification"   # one line: what this reference changed
years:
  introduced: 1959
  discontinued: 1978
  current: true     # only if it is known to be in production today; a missing end year does NOT mean "current"
```

The lineage page orders members by year and works out the "what changed" chips (size, depth rating, crystal,
case material, movement, added or removed features) by comparing each reference with its own predecessor.

### The `look` block

References render as a live watch on the site. `look` controls the drawing:

```yaml
look:
  dial: "#1f3d6b"      # dial colour (or LCD screen colour for digital)
  accent: "#eef0f3"    # text and marker colour
  metal: steel         # steel | gold | titanium | black | resin
  bezel: dive          # none | dive | tachy | octagon
```

## Quality rules

1. **Cite sources** for specifications, dates and prices. Prefer the manufacturer.
2. **Set `last_reviewed`** to the date you checked the facts. The site shows it as "Serviced".
3. **Stay neutral.** No affiliate links, no marketing copy.
4. **Use your own words.** Do not paste text or images from other sites.
5. **Keep it beginner-friendly.** Explain jargon or link to the glossary.

## Running the site locally

```bash
cd site
npm install
npm run dev      # http://localhost:4321/awesome-watch-collection/
npm run build    # validates all content and builds to site/dist
npm run export   # build + refresh the JSON copy in /api
npm run data:check                                   # SQL integrity checks via DuckDB
npm run data:export -- ../harvest/<batch>.ndjson     # bulk-add references from a harvested batch
```

## Licensing

By contributing you agree that content (`/content`, `/data`) is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and code under the [MIT License](LICENSE).
