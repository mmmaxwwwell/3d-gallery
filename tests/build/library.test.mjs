// The library (library/<slug>/) is published as it stands, so every item must
// pass the checks the build applies, and the importer's description cleanup
// must leave nothing that loads or runs.

import { test } from "node:test";
import { equal, ok, throws } from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildIndex, listSlugs, readItem, servedFiles, sha256, LIBRARY_DIR } from "../../scripts/library.mjs";
import { htmlToMarkdown } from "../../scripts/import-library.mjs";

test("every library item passes its checks", () => {
  for (const slug of listSlugs()) readItem(LIBRARY_DIR, slug);
  const index = buildIndex();
  ok(index.items.length > 0);
  for (const item of index.items) ok(item.readme.length > 0, `${item.slug} has a README`);
});

test("the served files are exactly the versions' files", () => {
  const index = buildIndex();
  const expected = index.items.flatMap((i) => i.versions.flatMap((v) => v.files.map((f) => `${i.slug}/${v.id}/${f.file}`)));
  equal(servedFiles().map((f) => f.path).sort().join("\n"), expected.sort().join("\n"));
});

function fixture(item, files) {
  const dir = mkdtempSync(join(tmpdir(), "library-"));
  mkdirSync(join(dir, item.slug, "v1"), { recursive: true });
  for (const [name, bytes] of Object.entries(files)) writeFileSync(join(dir, item.slug, "v1", name), bytes);
  writeFileSync(join(dir, item.slug, "item.json"), JSON.stringify(item));
  return dir;
}

const base = (files) => ({
  slug: "thing",
  title: "Thing",
  summary: "A thing",
  source: { site: "Printables", url: "https://www.printables.com/model/1-thing" },
  license: { name: "CC-BY", id: "CC-BY" },
  versions: [{ id: "v1", imported: "2026-10-21", files }],
});

test("a file that doesn't match its sha256 is refused", () => {
  const dir = fixture(base([{ file: "a.stl", sha256: sha256(Buffer.from("other")), size: 1 }]), { "a.stl": "solid" });
  throws(() => readItem(dir, "thing"), /doesn't match its sha256/);
});

test("a file name that leaves its version directory is refused", () => {
  const dir = fixture(base([{ file: "../a.stl", sha256: "x", size: 1 }]), {});
  throws(() => readItem(dir, "thing"), /bad file name/);
});

test("description HTML becomes text-only Markdown", () => {
  const md = htmlToMarkdown(
    '<p>Hi <strong>there</strong>&nbsp;&amp; <a href="https://x.test/a">link</a></p>' +
      '<p><img src="https://evil.test/x.png" onerror="alert(1)"><script>alert(2)</script>' +
      '<a href="javascript:alert(3)">js</a></p><ul><li>one</li><li>two</li></ul>',
  );
  equal(md, "Hi **there** & [link](https://x.test/a)\n\njs\n\n- one\n- two");
});
