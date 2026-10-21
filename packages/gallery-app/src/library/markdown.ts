// SPDX-License-Identifier: MIT
/**
 * A library README as HTML. The text came from another site, so raw HTML in
 * it is shown as text, only https links become links, and images are links
 * rather than loaded: nothing in a README can run or reach out on its own.
 */
import { Marked, type Tokens } from 'marked';

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`);
}

const safeHref = (href: string) => /^https:\/\//i.test(href);

const marked = new Marked({
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escape(text);
    },
    link({ href, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      if (!safeHref(href)) return text;
      return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image({ href, text }: Tokens.Image) {
      const label = escape(text || 'image');
      return safeHref(href) ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">[${label}]</a>` : `[${label}]`;
    },
  },
});

export function renderReadme(markdown: string): string {
  return marked.parse(markdown, { async: false });
}
