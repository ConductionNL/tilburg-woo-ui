import {
  resolveRouterBasename,
  basenameMatchesPath,
  DEFAULT_PORTAL_BASENAME,
  DEFAULT_STANDALONE_BASENAME,
} from './router-basename';

describe('resolveRouterBasename', () => {
  it('defaults the standalone site to the web root', () => {
    // Regression guard: this was hardcoded to the Portaliq WOO mount, so the
    // standalone deployment served at `/` rendered an empty page.
    expect(resolveRouterBasename(undefined, false)).toBe(
      DEFAULT_STANDALONE_BASENAME
    );
    expect(resolveRouterBasename({}, false)).toBe('/');
  });

  it('defaults portal mode to the portal mount', () => {
    expect(resolveRouterBasename({}, true)).toBe(DEFAULT_PORTAL_BASENAME);
  });

  it('prefers the camelCase key written by portal-postbuild', () => {
    expect(
      resolveRouterBasename({ routerBasename: '/index.php/apps/portaliq/woo' }, false)
    ).toBe('/index.php/apps/portaliq/woo');
  });

  it('accepts the UPPER_SNAKE key written by generate-runtime-config', () => {
    expect(resolveRouterBasename({ ROUTER_BASENAME: '/sub/path' }, false)).toBe(
      '/sub/path'
    );
  });

  it('prefers camelCase over UPPER_SNAKE when both are present', () => {
    expect(
      resolveRouterBasename(
        { routerBasename: '/from-camel', ROUTER_BASENAME: '/from-snake' },
        false
      )
    ).toBe('/from-camel');
  });

  it('falls back to the default for empty or blank values', () => {
    // An empty string looks configured but silently breaks routing.
    expect(resolveRouterBasename({ ROUTER_BASENAME: '' }, false)).toBe('/');
    expect(resolveRouterBasename({ routerBasename: '   ' }, true)).toBe(
      DEFAULT_PORTAL_BASENAME
    );
  });
});

describe('basenameMatchesPath', () => {
  it('treats the web root as matching everything', () => {
    expect(basenameMatchesPath('/', '/')).toBe(true);
    expect(basenameMatchesPath('/', '/zoeken')).toBe(true);
  });

  it('matches a sub-path mount and its descendants', () => {
    const base = '/index.php/apps/portaliq/woo';
    expect(basenameMatchesPath(base, base)).toBe(true);
    expect(basenameMatchesPath(base, `${base}/zoeken`)).toBe(true);
  });

  it('rejects a path outside the mount', () => {
    // This is exactly the production failure: basename set to the Portaliq
    // mount while the app was served at the web root.
    expect(basenameMatchesPath('/index.php/apps/portaliq/woo', '/')).toBe(false);
    expect(basenameMatchesPath('/index.php/apps/portaliq/woo', '/zoeken')).toBe(
      false
    );
  });

  it('is not fooled by a shared prefix on a different segment', () => {
    expect(basenameMatchesPath('/woo', '/woonplaats')).toBe(false);
  });

  it('tolerates a trailing slash on the basename', () => {
    expect(basenameMatchesPath('/portal/', '/portal/zoeken')).toBe(true);
  });
});
