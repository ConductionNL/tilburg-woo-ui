import {
  toStackiqUrl,
  toStackiqParams,
  toStackiqBody,
  fromStackiqResponse,
  isStackiqUrl,
  installStackiqVocabulary,
} from './stackiq-vocabulary';

describe('stackiq vocabulary: requests', () => {
  it('moves the register and the schema slug', () => {
    expect(
      toStackiqUrl('/openregister/api/objects/voorzieningen/organisatie/abc')
    ).toBe('/openregister/api/objects/stackiq/organization/abc');
    expect(
      toStackiqUrl('/openregister/api/objects/voorzieningen/moduleversie')
    ).toBe('/openregister/api/objects/stackiq/moduleVersion');
    expect(toStackiqUrl('/openregister/api/registers/voorzieningen')).toBe(
      '/openregister/api/registers/stackiq'
    );
    expect(toStackiqUrl('/openregister/api/schemas/gebruik')).toBe(
      '/openregister/api/schemas/usage'
    );
    expect(toStackiqUrl('/openregister/api/schemas/dienst')).toBe(
      '/openregister/api/schemas/catalogService'
    );
  });

  it('moves the app path', () => {
    expect(toStackiqUrl('/softwarecatalog/api/aanbod')).toBe('/stackiq/api/aanbod');
  });

  it('translates property names in query keys and extend values', () => {
    const url = toStackiqUrl(
      '/openregister/api/objects/voorzieningen/module?_order%5Bnaam%5D=asc&aanbieder=x&_extend=moduleVersies,contactpersoon'
    );
    expect(decodeURIComponent(url)).toBe(
      '/openregister/api/objects/stackiq/module?_order[name]=asc&provider=x&_extend=moduleVersions,contactPerson'
    );
  });

  it('translates schema values in filters', () => {
    expect(toStackiqParams({ '@self[schema]': 'organisatie', _limit: 10 })).toEqual({
      '@self[schema]': 'organization',
      _limit: 10,
    });
  });

  it('leaves unrelated URLs alone', () => {
    expect(isStackiqUrl('/opencatalogi/api/publications')).toBe(false);
    expect(toStackiqUrl('/openregister/api/objects/publication/page/home')).toBe(
      '/openregister/api/objects/publication/page/home'
    );
  });

  it('translates a body, preferring the alias the user edited', () => {
    expect(
      toStackiqBody(
        {
          naam: 'Gemeente Tilburg',
          beschrijving: 'oud',
          beschrijvingLang: 'nieuw',
          description: 'oud',
          oin: '1',
        },
        'organization'
      )
    ).toEqual({ name: 'Gemeente Tilburg', description: 'nieuw', oin: '1' });
  });
});

describe('stackiq vocabulary: responses', () => {
  it('renames object properties and the schema slug', () => {
    const data = {
      results: [
        {
          name: 'Zaaksysteem',
          shortDescription: 'kort',
          provider: 'org-1',
          '@self': {
            schema: {
              slug: 'module',
              title: 'Application',
              properties: { name: {} },
            },
          },
        },
      ],
    };
    fromStackiqResponse(data);
    const row = data.results[0];
    expect(row.naam).toBe('Zaaksysteem');
    expect(row.beschrijvingKort).toBe('kort');
    expect(row.aanbieder).toBe('org-1');
    expect(row.name).toBeUndefined();
  });

  it('uses the requested schema when @self.schema is only an id', () => {
    const data = {
      results: [{ name: 'Gemeente Tilburg', '@self': { schema: '951' } }],
    };
    fromStackiqResponse(data, 'organization');
    expect(data.results[0].naam).toBe('Gemeente Tilburg');
  });

  it('translates a schema definition', () => {
    const schema = {
      title: 'Organization',
      slug: 'organization',
      properties: { name: { type: 'string' }, oin: {} },
      required: ['name'],
    };
    fromStackiqResponse(schema);
    expect(schema.slug).toBe('organisatie');
    expect(schema.stackiqSlug).toBe('organization');
    expect(Object.keys(schema.properties)).toEqual(['naam', 'oin']);
    expect(schema.required).toEqual(['naam']);
  });

  it('translates enum values both ways', () => {
    const data = {
      results: [
        {
          name: 'Centric',
          type: 'Supplier',
          status: 'Active',
          '@self': { schema: '951' },
        },
      ],
    };
    fromStackiqResponse(data, 'organization');
    expect(data.results[0].type).toBe('Leverancier');
    expect(data.results[0].status).toBe('Actief');
    expect(toStackiqBody({ naam: 'X', type: 'Gemeente' }, 'organization')).toEqual({
      name: 'X',
      type: 'Municipality',
    });
    expect(
      decodeURIComponent(
        toStackiqUrl(
          '/openregister/api/objects/voorzieningen/gebruik?status=In%20productie'
        )
      )
    ).toBe('/openregister/api/objects/stackiq/usage?status=In production');
  });

  it('presents the stackiq register under its legacy slug', () => {
    const register = {
      id: 26,
      title: 'Software Catalog Register',
      slug: 'stackiq',
      schemas: [951],
    };
    fromStackiqResponse(register);
    expect(register.slug).toBe('voorzieningen');
  });

  it('round-trips through an axios-like instance', async () => {
    const handlers = { req: [], res: [] };
    const instance = {
      interceptors: {
        request: { use: (f) => handlers.req.push(f) },
        response: { use: (f) => handlers.res.push(f) },
      },
    };
    installStackiqVocabulary(instance);
    installStackiqVocabulary(instance);
    expect(handlers.req).toHaveLength(1);
    const config = handlers.req[0]({
      url: '/openregister/api/objects/voorzieningen/organisatie',
      data: { naam: 'X' },
    });
    expect(config.url).toBe('/openregister/api/objects/stackiq/organization');
    expect(config.data).toEqual({ name: 'X' });
  });
});
