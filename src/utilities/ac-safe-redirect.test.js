import { AcSafeRedirect } from './ac-safe-redirect';

const FALLBACK = '/beheer';

describe('AcSafeRedirect', () => {
  describe('keeps legitimate in-app destinations', () => {
    it.each([
      ['a plain path', '/beheer/diensten'],
      ['the site root', '/'],
      ['a path with a query string', '/zoeken?q=test'],
      ['a path with a fragment', '/publicatie/123#details'],
      ['a path with an encoded segment', '/publicatie/a%2Fb'],
    ])('allows %s', (_label, target) => {
      expect(AcSafeRedirect(target, FALLBACK)).toBe(target);
    });
  });

  describe('refuses to send the user off-site', () => {
    // Each of these, if followed, would take a freshly authenticated user to
    // another origin — the point of an open redirect.
    it.each([
      ['an absolute https URL', 'https://evil.example'],
      ['an absolute http URL', 'http://evil.example/path'],
      ['a protocol-relative URL', '//evil.example'],
      ['a backslash protocol-relative URL', '/\\evil.example'],
      ['both slashes as backslashes', '\\\\evil.example'],
      ['a javascript: scheme', 'javascript:alert(1)'],
      ['a data: scheme', 'data:text/html,<script>alert(1)</script>'],
      ['a bare hostname', 'evil.example'],
      ['a scheme-relative path with credentials', '//user:pass@evil.example'],
    ])('rejects %s', (_label, target) => {
      expect(AcSafeRedirect(target, FALLBACK)).toBe(FALLBACK);
    });

    // Browsers drop control characters when resolving a URL, so a target that
    // looks inert can become active once the browser has cleaned it up.
    it('rejects a scheme hidden by an embedded tab', () => {
      expect(AcSafeRedirect('java\tscript:alert(1)', FALLBACK)).toBe(FALLBACK);
    });

    it('rejects a scheme hidden by an embedded newline', () => {
      expect(AcSafeRedirect('java\nscript:alert(1)', FALLBACK)).toBe(FALLBACK);
    });

    it('rejects a protocol-relative URL padded with leading whitespace', () => {
      expect(AcSafeRedirect('  //evil.example', FALLBACK)).toBe(FALLBACK);
    });
  });

  describe('falls back when there is nothing usable', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an empty string', ''],
      ['only whitespace', '   '],
      ['a number', 42],
      ['an object', {}],
    ])('returns the fallback for %s', (_label, target) => {
      expect(AcSafeRedirect(target, FALLBACK)).toBe(FALLBACK);
    });

    it('defaults to the site root when no fallback is given', () => {
      expect(AcSafeRedirect('https://evil.example')).toBe('/');
    });
  });
});
