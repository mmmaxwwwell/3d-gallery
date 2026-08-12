// Shared openscad CLI flags. Kept in one place so every invocation
// across the build pipeline uses the same engine + feature set.
//
// --backend Manifold
//   Uses the Manifold boolean engine instead of CGAL. Typically 3-10x
//   faster on the boolean-heavy CSG this repo runs. Requires
//   openscad-unstable (2026.xx+) — stable 2021.01 doesn't have it.
//   The flake.nix devshell already pins openscad-unstable; if CI ever
//   installs plain openscad, remove Manifold before shipping.
//
// The backend is chosen via env var so a smoke test can flip it off
// with OPENSCAD_BACKEND=CGAL to compare outputs.
const backend = process.env.OPENSCAD_BACKEND ?? "Manifold";

export const OPENSCAD_ARGS = ["--backend", backend];
