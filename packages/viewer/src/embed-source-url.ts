import { zipSync, unzipSync } from "fflate";

// Inject a "source URL" (the customizer permalink) into a freshly
// rendered STL or 3MF ArrayBuffer, so someone who ends up with just
// the printed file can trace it back to the exact params that
// generated it.
//
// STL: ASCII → stuff the URL into the `solid <name>` line. Binary →
// append `# source=<url>\n` as trailing bytes (all mainstream slicers
// stop parsing after the last triangle and tolerate trailing data).
// 3MF: add a <metadata name="SourceURL">…</metadata> to 3D/3dmodel.model.

export function embedSourceUrl(
    buffer: ArrayBuffer,
    format: "stl" | "3mf",
    url: string,
): ArrayBuffer {
    if (format === "stl") return embedInStl(buffer, url);
    return embedIn3mf(buffer, url);
}

// ── STL ────────────────────────────────────────────────────────────

function embedInStl(buffer: ArrayBuffer, url: string): ArrayBuffer {
    const bytes = new Uint8Array(buffer);
    const out = (isAsciiStl(bytes) ? embedInAsciiStl : embedInBinaryStl)(bytes, url);
    return toArrayBuffer(out);
}

function isAsciiStl(bytes: Uint8Array): boolean {
    if (bytes.length < 6) return false;
    // "solid" followed by whitespace or newline
    if (bytes[0] !== 0x73 || bytes[1] !== 0x6f || bytes[2] !== 0x6c || bytes[3] !== 0x69 || bytes[4] !== 0x64) {
        return false;
    }
    const next = bytes[5];
    return next === 0x20 || next === 0x09 || next === 0x0a || next === 0x0d;
}

function embedInAsciiStl(bytes: Uint8Array, url: string): Uint8Array {
    // Replace the first "solid <name>" line with one whose name field
    // carries the URL. ASCII STL parsers read until the newline for
    // the name, so any text is valid there.
    const text = new TextDecoder().decode(bytes);
    const newlineIdx = text.indexOf("\n");
    if (newlineIdx === -1) return bytes;
    const rest = text.slice(newlineIdx);
    const firstLine = `solid OpenSCAD_Model source=${url}`;
    return new TextEncoder().encode(firstLine + rest);
}

function embedInBinaryStl(bytes: Uint8Array, url: string): Uint8Array {
    // Binary STL: 80-byte header + uint32 tri count + triangles.
    // Parsers stop after the last triangle, so we append the URL as
    // trailing bytes. Prefixing with "\n# " keeps it visually a
    // comment if the tail ever gets treated as text.
    const tag = new TextEncoder().encode(`\n# source=${url}\n`);
    const out = new Uint8Array(bytes.length + tag.length);
    out.set(bytes, 0);
    out.set(tag, bytes.length);
    return out;
}

// ── 3MF ────────────────────────────────────────────────────────────

const MODEL_PATH = "3D/3dmodel.model";
const SOURCE_URL_METADATA_RE =
    /\s*<metadata\s+name="SourceURL"[^>]*>[\s\S]*?<\/metadata>/;

function embedIn3mf(buffer: ArrayBuffer, url: string): ArrayBuffer {
    const files = unzipSync(new Uint8Array(buffer));
    const modelBytes = files[MODEL_PATH];
    if (!modelBytes) return buffer;
    const modelXml = new TextDecoder().decode(modelBytes);
    const patched = addSourceUrlMetadata(modelXml, url);
    files[MODEL_PATH] = new TextEncoder().encode(patched);
    return toArrayBuffer(zipSync(files));
}

// zipSync/TextEncoder produce Uint8Arrays whose .buffer is typed as
// ArrayBufferLike (could be SharedArrayBuffer). We allocate them
// ourselves, so it's always a real ArrayBuffer — copy through .slice()
// to hand back a value TS accepts as ArrayBuffer.
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function addSourceUrlMetadata(xml: string, url: string): string {
    const escaped = url
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const metadata = `<metadata name="SourceURL">${escaped}</metadata>`;
    // Drop any pre-existing SourceURL entry, then insert ours right
    // after the opening <model …> tag.
    const stripped = xml.replace(SOURCE_URL_METADATA_RE, "");
    const openTag = stripped.match(/<model\b[^>]*>/);
    if (!openTag || openTag.index === undefined) return xml;
    const insertAt = openTag.index + openTag[0].length;
    return stripped.slice(0, insertAt) + metadata + stripped.slice(insertAt);
}
