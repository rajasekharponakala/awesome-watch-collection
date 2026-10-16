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
| Watch references | [`data/references/`](data/references) | 16 |
| Calibers (movements) | [`data/calibers/`](data/calibers) | 14 |
| Brands | [`data/brands/`](data/brands) | 25 |
| Glossary | [`data/glossary.yaml`](data/glossary.yaml) | 88 terms |
| Timeline | [`data/timeline.yaml`](data/timeline.yaml) | 34 events |
| Resources | [`data/resources.yaml`](data/resources.yaml) | Books, channels, forums, museums, schools |

## The site speaks watch

| Watch | Site |
|---|---|
| **Dial** | Home page, with 12 hour markers leading to 12 sections |
| **Crown** | Search: press `⌘K` or `/` |
| **Bezel** | Rotating catalogue filter |
| **Lume** | Night theme (the day dial is the light theme) |
| **Power reserve** | Reading progress on guides |
| **Jewels** | Difficulty level |
| **Hacking seconds** | Pause all motion |
| **Caseback** | About page |
| **Out of beat** | 404 page |

Built with [Astro](https://astro.build), deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```bash
cd site && npm install && npm run dev
```

## License

Content (`/content`, `/data`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · Code: [MIT](LICENSE)
