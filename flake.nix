{
  description = "3D model gallery — OpenSCAD sources + GitHub Pages viewer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    # OpenSCAD library-space deps. Not Nix packages, so pulled in as
    # flake inputs and symlinked into an OPENSCADPATH directory in the
    # devshell's shellHook. Bump with:
    #   nix flake lock --update-input bosl2
    #   nix flake lock --update-input qr-scad
    bosl2 = {
      url = "github:BelfrySCAD/BOSL2";
      flake = false;
    };
    qr-scad = {
      url = "github:xypwn/scadqr";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, bosl2, qr-scad }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          # openscad-unstable ships the Manifold engine
          # (`--backend Manifold`), which is 3-10x faster than CGAL on
          # the boolean-heavy operations this repo runs. Stable
          # openscad (2021.01) doesn't have it.
          packages = with pkgs; [ openscad-unstable nodejs_22 playwright-driver.browsers ];

          # Playwright ships its own chromium binary but its ELF
          # interpreter and shared libs can't be resolved on NixOS.
          # Point Playwright at the Nix-wrapped browsers and skip its
          # host-requirements check.
          PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
          PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";

          # Assemble an OpenSCAD library directory containing BOSL2 +
          # qr.scad and put it on OPENSCADPATH, so every include<BOSL2/…>
          # and include<qr.scad> resolves without a per-machine install.
          # The directory lives under .cache/openscad-libs and is
          # gitignored; symlinks point into the Nix store paths pinned
          # by flake.lock, so `nix develop` produces a byte-identical
          # library set on any machine.
          shellHook = ''
            export OPENSCAD_LIB_DIR="$PWD/.cache/openscad-libs"
            mkdir -p "$OPENSCAD_LIB_DIR"
            ln -sfn ${bosl2} "$OPENSCAD_LIB_DIR/BOSL2"
            ln -sfn ${qr-scad}/qr.scad "$OPENSCAD_LIB_DIR/qr.scad"
            export OPENSCADPATH="$OPENSCAD_LIB_DIR"
          '';
        };
      });
}
