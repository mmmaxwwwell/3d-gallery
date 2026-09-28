// SPDX-License-Identifier: MIT
/**
 * Turns `docs/user-guide.md` into Home's HTML. The guide is the one place the
 * app is described; Home renders it rather than keeping a second copy.
 */
import { Marked, type Tokens } from 'marked';

/** GitHub's anchor rule, so the guide's `#section` links work in both places. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const marked = new Marked({
  renderer: {
    heading({ tokens, depth, text }: Tokens.Heading) {
      return `<h${depth} id="${headingId(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
  },
});

export function renderGuide(markdown: string): string {
  return marked.parse(markdown, { async: false });
}

/**
 * The first paragraph under a `### <title>` section, as inline HTML — the
 * guide's own one-line account of a view, for its card on Home.
 */
export function sectionLead(markdown: string, title: string): string | null {
  const tokens = marked.lexer(markdown);
  const start = tokens.findIndex((t) => t.type === 'heading' && t.depth === 3 && t.text === title);
  if (start < 0) return null;
  for (const token of tokens.slice(start + 1)) {
    if (token.type === 'heading') return null;
    if (token.type === 'paragraph') return marked.parseInline(token.text, { async: false });
  }
  return null;
}
