{
  description = "3D model gallery — OpenSCAD sources + GitHub Pages viewer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          # openscad-unstable ships the manifold engine (`--enable=manifold`),
          # which is 3-10x faster than CGAL on the boolean-heavy operations
          # this repo runs. Stable openscad (2021.01) doesn't have it.
          packages = with pkgs; [ openscad-unstable nodejs_22 playwright-driver.browsers ];

          # Playwright ships its own chromium binary but its ELF interpreter
          # and shared libs can't be resolved on NixOS. Point Playwright at
          # the Nix-wrapped browsers and skip its host-requirements check.
          PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
          PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
        };
      });
}
