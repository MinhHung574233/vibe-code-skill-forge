import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { headersForPath, parseHeadersFile } from './headersFile';

describe('parseHeadersFile', () => {
  it('reads path rules with indented headers, ignoring comments and blank lines', () => {
    const rules = parseHeadersFile(`# comment

/*
  X-One: 1
  Y-Two: a: b

/assets/*
  Cache-Control: immutable
`);
    expect(rules).toEqual([
      { pattern: '/*', headers: { 'X-One': '1', 'Y-Two': 'a: b' } },
      { pattern: '/assets/*', headers: { 'Cache-Control': 'immutable' } },
    ]);
  });

  it('rejects malformed files loudly instead of silently dropping headers', () => {
    expect(() => parseHeadersFile('  Orphan: header')).toThrow(/before any path/);
    expect(() => parseHeadersFile('/*\n  no colon here')).toThrow(/Name: value/);
  });
});

describe('headersForPath', () => {
  const rules = parseHeadersFile(`/*
  A: all
  Cache-Control: default

/assets/*
  Cache-Control: immutable

/sw.js
  Cache-Control: no-cache
`);

  it('applies the catch-all to every path and lets specific rules override', () => {
    expect(headersForPath(rules, '/')).toEqual({ A: 'all', 'Cache-Control': 'default' });
    expect(headersForPath(rules, '/assets/index-abc.js')).toEqual({
      A: 'all',
      'Cache-Control': 'immutable',
    });
    expect(headersForPath(rules, '/sw.js?v=1')).toEqual({ A: 'all', 'Cache-Control': 'no-cache' });
  });
});

describe('the real public/_headers', () => {
  const rules = parseHeadersFile(readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8'));
  const root = headersForPath(rules, '/');
  const csp = root['Content-Security-Policy'] ?? '';

  it('sets the security headers on every response', () => {
    expect(root['X-Content-Type-Options']).toBe('nosniff');
    expect(root['Referrer-Policy']).toBe('no-referrer');
    expect(root['Strict-Transport-Security']).toMatch(/max-age=\d+/);
    expect(root['Permissions-Policy']).toMatch(/camera=\(\)/);
  });

  it('has a CSP that forbids inline scripts, remote origins, plugins and framing', () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/https?:\/\//); // no remote origin is allowed anywhere
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('caches hashed assets forever but never the files that decide what is current', () => {
    expect(headersForPath(rules, '/assets/index-HRGC9v6_.js')['Cache-Control']).toMatch(
      /immutable/,
    );
    for (const path of ['/sw.js', '/index.html', '/manifest.webmanifest']) {
      expect(headersForPath(rules, path)['Cache-Control']).toBe('no-cache');
    }
  });
});
