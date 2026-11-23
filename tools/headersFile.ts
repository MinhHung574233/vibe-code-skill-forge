/**
 * Parser for the Cloudflare/Netlify `_headers` file format, used so that `vite preview` (and
 * therefore the e2e tests) serves exactly the headers production will serve, including the
 * Content-Security-Policy. A rule is an unindented path pattern followed by indented
 * `Name: value` lines. `*` matches any characters (including slashes).
 */
export interface HeaderRule {
  pattern: string;
  headers: Record<string, string>;
}

export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let current: HeaderRule | null = null;

  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: {} };
      rules.push(current);
      continue;
    }
    if (!current) throw new Error(`_headers: header line before any path: "${raw.trim()}"`);
    const colon = raw.indexOf(':');
    if (colon === -1) throw new Error(`_headers: expected "Name: value", got "${raw.trim()}"`);
    current.headers[raw.slice(0, colon).trim()] = raw.slice(colon + 1).trim();
  }
  return rules;
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/** All headers that apply to a URL path; later rules override earlier ones for the same name. */
export function headersForPath(rules: readonly HeaderRule[], path: string): Record<string, string> {
  const pathname = path.split('?')[0] ?? path;
  const result: Record<string, string> = {};
  for (const rule of rules) {
    if (patternToRegExp(rule.pattern).test(pathname)) Object.assign(result, rule.headers);
  }
  return result;
}
