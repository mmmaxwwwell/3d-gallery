// Embed a "source URL" (a permalink back to the gallery page for this
// model) into a rendered STL or 3MF file, in-place. Node-side mirror
// of src/lib/embed-source-url.ts — used by build-models.mjs to tag
// every pre-built artifact so a printed part can be traced back to
// the model page that produced it.
//
// Idempotent for ASCII STL (replaces the first `solid <name>` line)
// and 3MF (replaces any existing SourceURL metadata). Binary STL
// injection is NOT idempotent — but the CLI OpenSCAD build path only
// ever emits ASCII STL, so that path isn't exercised at build time.

import { readFileSync, writeFileSync } from "node:fs";
import { unzipSync, zipSync } from "fflate";

export function embedUrlInFile(path, format, url) {
    const buf = readFileSync(path);
    const out = embedUrl(buf, format, url);
    writeFileSync(path, out);
}

export function embedUrl(buf, format, url) {
    if (format === "stl") return embedInStl(buf, url);
    if (format === "3mf") return embedIn3mf(buf, url);
    return buf;
}

// ── STL ────────────────────────────────────────────────────────────

function embedInStl(buf, url) {
    return isAsciiStl(buf) ? embedInAsciiStl(buf, url) : embedInBinaryStl(buf, url);
}

function isAsciiStl(buf) {
    if (buf.length < 6) return false;
    if (buf[0] !== 0x73 || buf[1] !== 0x6f || buf[2] !== 0x6c || buf[3] !== 0x69 || buf[4] !== 0x64) {
        return false;
    }
    const next = buf[5];
    return next === 0x20 || next === 0x09 || next === 0x0a || next === 0x0d;
}

function embedInAsciiStl(buf, url) {
    const text = buf.toString("utf8");
    const nl = text.indexOf("\n");
    if (nl === -1) return buf;
    const firstLine = `solid OpenSCAD_Model source=${url}`;
    return Buffer.from(firstLine + text.slice(nl), "utf8");
}

function embedInBinaryStl(buf, url) {
    const tag = Buffer.from(`\n# source=${url}\n`, "utf8");
    return Buffer.concat([buf, tag]);
}

// ── 3MF ────────────────────────────────────────────────────────────

const MODEL_PATH = "3D/3dmodel.model";
const SOURCE_URL_METADATA_RE = /\s*<metadata\s+name="SourceURL"[^>]*>[\s\S]*?<\/metadata>/;

function embedIn3mf(buf, url) {
    const files = unzipSync(new Uint8Array(buf));
    const modelBytes = files[MODEL_PATH];
    if (!modelBytes) return buf;
    const modelXml = Buffer.from(modelBytes).toString("utf8");
    const patched = addSourceUrlMetadata(modelXml, url);
    files[MODEL_PATH] = new TextEncoder().encode(patched);
    return Buffer.from(zipSync(files));
}

function addSourceUrlMetadata(xml, url) {
    const escaped = url
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const metadata = `<metadata name="SourceURL">${escaped}</metadata>`;
    const stripped = xml.replace(SOURCE_URL_METADATA_RE, "");
    const openTag = stripped.match(/<model\b[^>]*>/);
    if (!openTag || openTag.index === undefined) return xml;
    const insertAt = openTag.index + openTag[0].length;
    return stripped.slice(0, insertAt) + metadata + stripped.slice(insertAt);
}
