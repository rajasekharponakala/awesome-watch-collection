import { defineConfig } from 'astro/config';

// Deployed to GitHub Pages as a project site:
// https://rajasekharponakala.github.io/awesome-watch-collection/
export default defineConfig({
  site: 'https://rajasekharponakala.github.io',
  base: '/awesome-watch-collection',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
