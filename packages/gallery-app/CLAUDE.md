# @3d-gallery/gallery-app

The web UI package. Vite + Preact + Three.js + Playwright. Deployed to GitHub Pages at `/3d-gallery/`.

Start with the repo-root `CLAUDE.md` for the model / manifest / build-pipeline conventions — this file only covers the gallery-app-specific quirks that changed when the app moved into a workspace.

## Package-specific quirks

- **Preact via `react` alias.** `vite.config.ts` aliases `react → preact/compat`, `react-dom → preact/compat`, `react/jsx-runtime → preact/jsx-runtime`. Any component that imports from `react` is really Preact at runtime. Don't add a real React dependency; don't add `@types/react` (Preact's types resolve through the alias). Any new print UI wired up under `src/print/` is Preact too.
- **Vite base path is `/3d-gallery/`.** Local dev serves under the same prefix as production so relative URLs behave identically. Assets loaded via `import.meta.env.BASE_URL` still resolve correctly.
- **`models/manifest.json` is served from the repo root via middleware.** `liveManifestPlugin` in `vite.config.ts` intercepts `GET /3d-gallery/models/manifest.json` in dev and streams `../../models/manifest.json` off disk, so edits show up on refresh without `npm run build:models`. In production, `scripts/build-models.mjs` (repo root) mirrors it to `public/models/manifest.json` — the middleware doesn't run there.
- **`publicDir` points at the repo-root `public/`.** `scripts/build-models.mjs` (root) writes STL/3MF into `../../public/models/`; PWA icons and WASM live there too. Don't duplicate `public/` inside this package.
- **`scadWatcherPlugin` watches `../../models/**/*.scad` in dev** and rebuilds the affected slug via `buildModel(model)` from the root `scripts/build-models.mjs`. This is why the build pipeline stays at the repo root: both this dev-server plugin and CI invoke it directly.
- **Playwright config lives here.** `webServer` runs `npm run dev -- --host 127.0.0.1 --port 5173`, which the workspace resolves to `vite`. `playwright-report/` and `test-results/` land in this package, not the repo root — CI uploads them from `packages/gallery-app/{playwright-report,test-results}/`.
- **Delegated scripts.** Root `npm run dev`, `build`, `preview`, and `test:e2e*` all wrap `-w @3d-gallery/gallery-app`. Prefer running from the repo root so the wrappers stay honest; if you invoke `npx vite …` directly, do it from inside this package (the config's `resolve(__dirname, '..', '..', …)` paths assume that CWD).

## Where the toolkit fits

`@3d-gallery/print-toolkit` (in `packages/print-toolkit/`) is framework-free — this package is the only consumer wiring it into a Preact UI. When adding print-related features, keep pure logic in the toolkit and put Preact glue under `src/print/`.
