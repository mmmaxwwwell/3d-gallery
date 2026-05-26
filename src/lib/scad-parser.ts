import type { ScadParam, ScadParamType, ScadValue } from './types';

function extractSection(source: string, beginMarker: string, endMarker: string): string | null {
  const beginIdx = source.indexOf(beginMarker);
  if (beginIdx === -1) return null;
  const endIdx = source.indexOf(endMarker, beginIdx);
  if (endIdx === -1) return null;
  return source.slice(beginIdx + beginMarker.length, endIdx);
}

export function parseValue(raw: string): { value: ScadValue; type: ScadParamType } {
  const trimmed = raw.trim();
  if (trimmed === 'true') return { value: true, type: 'boolean' };
  if (trimmed === 'false') return { value: false, type: 'boolean' };
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return { value: trimmed.slice(1, -1), type: 'string' };
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    const nums = inner.split(',').map((s) => Number(s.trim()));
    if (nums.every((n) => !isNaN(n))) {
      return { value: nums, type: 'vector' };
    }
  }
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') {
    return { value: num, type: 'number' };
  }
  return { value: trimmed, type: 'string' };
}

function parseInlineOptions(inlineComment: string): string[] | null {
  const match = inlineComment.match(/\[([^\]]+)\]/);
  if (!match) return null;
  const items = match[1].split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  return items.length > 0 ? items : null;
}

export function parseParams(source: string): ScadParam[] {
  const section = extractSection(source, '// BEGIN_PARAMS', '// END_PARAMS');
  if (!section) return [];

  const blocks = section.split(/\n(?:\s*\n){2,}/);
  const params: ScadParam[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    const assignmentLine = lines[lines.length - 1];
    const assignMatch = assignmentLine.match(
      /^(\w+)\s*=\s*(.+?)\s*;\s*(?:\/\/\s*(.*))?$/
    );
    if (!assignMatch) continue;

    const [, name, rawValue, inlineComment] = assignMatch;
    const { value, type: inferredType } = parseValue(rawValue);

    let type: ScadParamType = inferredType;
    let options: string[] | undefined;
    if (inlineComment) {
      const opts = parseInlineOptions(inlineComment);
      if (opts) {
        type = 'enum';
        options = opts;
      }
    }

    const helpLines: string[] = [];
    let isMultiline = false;
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (line.startsWith('//')) {
        let commentText = line.replace(/^\/\/\s?/, '');
        if (commentText.includes('// multiline')) {
          isMultiline = true;
          commentText = commentText.replace(/\s*\/\/\s*multiline\s*/, '').trim();
        }
        if (commentText) helpLines.push(commentText);
      }
    }
    const help = helpLines.join(' ');

    if (isMultiline && (type === 'string')) {
      type = 'text';
    }

    params.push({ name, type, default: value, help, ...(options ? { options } : {}) });
  }

  return params;
}
