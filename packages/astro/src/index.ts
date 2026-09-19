// Node-side entry: this is what an astro.config imports. The client island is
// reachable at `@3d-gallery/astro/client` and is deliberately NOT re-exported
// here — it imports `virtual:3d-gallery`, which only resolves inside Vite.
export { default } from './integration.ts';
export { default as gallery } from './integration.ts';
export type { GalleryOptions } from './options.ts';
