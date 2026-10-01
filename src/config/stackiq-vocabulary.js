/**
 * Stackiq vocabulary: the bridge between this UI's Dutch softwarecatalogus
 * names and the English names the stackiq app now stores.
 *
 * The softwarecatalog app became `stackiq` and moved its data from the
 * `voorzieningen` register with Dutch schema slugs and property names
 * (`organisatie.naam`, `module.beschrijvingKort`, ...) to the `stackiq`
 * register with English ones (`organization.name`,
 * `module.shortDescription`, ...). The authoritative rename tables are
 * stackiq's own repair steps, lib/Repair/RenameDutchSchemaSlugs.php and
 * lib/Repair/RenameDutchCatalogColumns.php; the tables below are derived
 * from them and from lib/Settings/softwarecatalogus_register.json.
 *
 * The UI reads and writes Dutch names in roughly 2,000 places, so instead of
 * renaming every one of them this module translates at the HTTP boundary,
 * the same way object.store.js already reshapes requests for Portaliq portal
 * mode:
 *
 *  - requests: register `voorzieningen` -> `stackiq`, Dutch schema slugs ->
 *    stackiq slugs, Dutch property names in query keys and JSON bodies ->
 *    stackiq property names;
 *  - responses: stackiq objects and schemas get their properties renamed to
 *    the Dutch names the views read, and their schema slug to the Dutch slug.
 *
 * Retiring it later means renaming the UI literals to the English names and
 * deleting this file; the tables are the checklist for that.
 */

export const LEGACY_REGISTER = 'voorzieningen';
export const STACKIQ_REGISTER = 'stackiq';

// Dutch (UI) schema slug -> stackiq schema slug.
// Several legacy UI slugs ('voorziening', 'voorzieningmodule', ...) predate
// even the Dutch register and have no stackiq counterpart; they are left alone.
export const SCHEMA_TO_STACKIQ = {
  organisatie: 'organization',
  module: 'module',
  moduleversie: 'moduleVersion',
  moduleVersie: 'moduleVersion',
  gebruik: 'usage',
  koppeling: 'connection',
  dienst: 'catalogService',
  contactpersoon: 'contactPerson',
  suite: 'suite',
  compliancy: 'compliancy',
  contract: 'catalogContract',
  kwetsbaarheid: 'vulnerability',
  beoordeling: 'software-review',
  beoordeeling: 'software-review',
  sector: 'sector',
  bioMaatregel: 'bioMeasure',
  biomaatregel: 'bioMeasure',
  // Beheer route types end up in schema URLs too (/schemas/organisaties/related).
  organisaties: 'organization',
  applicaties: 'module',
  applicatieversie: 'moduleVersion',
  applicatiesversie: 'moduleVersion',
  gebruiken: 'usage',
  koppelingen: 'connection',
  diensten: 'catalogService',
  contactpersonen: 'contactPerson',
  contracten: 'catalogContract',
  overeenkomst: 'catalogContract',
  overeenkomsten: 'catalogContract',
  kwetsbaarheden: 'vulnerability',
};

// stackiq schema slug -> the Dutch slug the UI compares against.
export const SCHEMA_FROM_STACKIQ = {
  organization: 'organisatie',
  module: 'module',
  moduleVersion: 'moduleversie',
  usage: 'gebruik',
  connection: 'koppeling',
  catalogService: 'dienst',
  contactPerson: 'contactpersoon',
  suite: 'suite',
  compliancy: 'compliancy',
  catalogContract: 'contract',
  vulnerability: 'kwetsbaarheid',
  'software-review': 'beoordeling',
  sector: 'sector',
  bioMeasure: 'bioMaatregel',
};

// stackiq schema slug -> the Dutch title the UI shows (page headings, the
// "Type" column). stackiq's own titles are English.
export const SCHEMA_TITLE_FROM_STACKIQ = {
  organization: 'Organisatie',
  module: 'Applicatie',
  moduleVersion: 'Applicatieversie',
  usage: 'Gebruik',
  connection: 'Koppeling',
  catalogService: 'Dienst',
  contactPerson: 'Contactpersoon',
  catalogContract: 'Contract',
  vulnerability: 'Kwetsbaarheid',
  'software-review': 'Beoordeling',
};

// Per stackiq schema: stackiq property -> the Dutch name(s) the UI uses.
// A property not listed keeps its name (stackiq kept several Dutch names,
// e.g. `diensten`, `koppelingen`, `deelnames`, `contactpersonen`).
const DESCRIPTIONS = {
  shortDescription: ['beschrijvingKort'],
  longDescription: ['beschrijvingLang'],
};
export const PROPERTIES_FROM_STACKIQ = {
  organization: {
    name: ['naam'],
    summary: ['beschrijvingKort'],
    description: ['beschrijvingLang', 'beschrijving'],
    image: ['logo'],
    participants: ['deelnemers'],
    registeredBy: ['geregistreerdDoor'],
    registrationStatus: ['registratiestatus'],
  },
  module: {
    name: ['naam'],
    ...DESCRIPTIONS,
    contactPerson: ['contactpersoon'],
    provider: ['aanbieder'],
    licence: ['licentie'],
    hostingJurisdiction: ['hostingJurisdictie'],
    hostingLocation: ['hostingLocatie'],
    referenceComponents: ['referentieComponenten'],
    standards: ['standaarden'],
    standardsGemma: ['standaardenGemma'],
    standardVersions: ['standaardVersies'],
    moduleVersions: ['moduleVersies'],
    usages: ['gebruiken'],
    registeredBy: ['geregistreerdDoor'],
  },
  moduleVersion: {
    version: ['versie'],
    ...DESCRIPTIONS,
    dateInDevelopment: ['datumInOntwikkeling'],
    dateInUse: ['datumInGebruik'],
    dateEndSupport: ['datumEindeOndersteuning'],
    dateWithdrawn: ['datumTeruggetrokken'],
    usages: ['gebruiken'],
    registeredBy: ['geregistreerdDoor'],
  },
  usage: {
    consumer: ['afnemer'],
    provider: ['aanbieder'],
    contactPerson: ['contactpersoon'],
    participants: ['deelnemers'],
    moduleVersion: ['moduleVersie'],
    startDateAcquisition: ['startDatumVerwerving'],
    startDatePlanned: ['startDatumGepland'],
    startDateInProduction: ['startDatumInProductie'],
    startDateOutPhasing: ['startDatumUitTeFaseren'],
    startDateOutPhased: ['startDatumUitGefaseerd'],
    interneAnnotation: ['interneAantekening'],
    usedForReferenceComponents: ['gebruiktVoorReferentiecomponenten'],
    plannedReplacement: ['geplandeVervanging'],
    plannedReplacementDate: ['geplandeVervangingsDatum'],
  },
  connection: {
    name: ['naam'],
    ...DESCRIPTIONS,
    provider: ['aanbieder'],
    dateInDevelopment: ['datumInOntwikkeling'],
    dateInUse: ['datumInGebruik'],
    dateEndSupport: ['datumEindeOndersteuning'],
    dateWithdrawn: ['datumTeruggetrokken'],
    dataExchangeDirection: ['gegevensuitwisselingRichting'],
    nonMunicipalProvision: ['buitengemeentelijkVoorziening'],
    standardVersions: ['standaardVersies'],
    realisedWithIntermediaryModule: ['gerealiseerdMetIntermediairModule'],
    integrationType: ['koppelingType'],
    registeredBy: ['geregistreerdDoor'],
  },
  catalogService: {
    name: ['naam'],
    ...DESCRIPTIONS,
    contactPerson: ['contactpersoon'],
    provider: ['aanbieder'],
  },
  contactPerson: {
    role: ['functie'],
    organization: ['organisatie'],
    notifications: ['notificaties'],
    roles: ['rollen'],
  },
  suite: {
    name: ['naam'],
    ...DESCRIPTIONS,
    contactPerson: ['contactpersoon'],
    applications: ['applicaties'],
  },
  compliancy: {
    standardVersion: ['standaardversie'],
    standardGemma: ['standaardGemma'],
    evidence: ['bewijs'],
    evidenceReference: ['bewijsReferentie'],
  },
  catalogContract: {
    startDate: ['startDatum'],
    endDate: ['eindDatum'],
    contractNumber: ['contractNummer'],
    cost: ['kosten'],
    costPeriod: ['kostenPeriode'],
    contactPersonProvider: ['contactpersoonAanbieder'],
    contactPersonUser: ['contactpersoonGebruiker'],
    documentReference: ['documentReferentie'],
  },
  vulnerability: { name: ['naam'], ...DESCRIPTIONS },
  'software-review': { name: ['naam'], ...DESCRIPTIONS },
  sector: { name: ['naam'], description: ['beschrijving'] },
  bioMeasure: { name: ['naam'] },
};

// Enum VALUES moved to English too (`type: 'Leverancier'` is now
// `type: 'Supplier'`), and the UI compares against the Dutch values in about
// 150 places. stackiq value -> Dutch value, per stackiq property name.
const PARTY = {
  Municipality: 'Gemeente',
  Supplier: 'Leverancier',
  Collaboration: 'Samenwerking',
  Community: 'Community',
};
const LIFECYCLE = {
  'in use': 'in gebruik',
  'in development': 'in ontwikkeling',
  'end of support': 'einde ondersteuning',
  withdrawn: 'teruggetrokken',
};
export const VALUES_FROM_STACKIQ = {
  organization: {
    type: PARTY,
    status: { Active: 'Actief', Draft: 'Concept', Inactive: 'Inactief' },
    registeredBy: { ...PARTY, Application: 'Applicatie' },
  },
  module: {
    type: { Application: 'Applicatie', 'System software': 'Systeemsoftware' },
    registeredBy: { ...PARTY, Application: 'Applicatie' },
  },
  moduleVersion: {
    status: LIFECYCLE,
    registeredBy: { ...PARTY, Application: 'Applicatie' },
  },
  connection: {
    status: LIFECYCLE,
    registeredBy: { ...PARTY, Application: 'Applicatie' },
  },
  usage: {
    status: {
      Acquisition: 'Verwerving',
      Planned: 'Gepland',
      'In production': 'In productie',
      'To be phased out': 'Uit te faseren',
      'Phased out': 'Uitgefaseerd',
    },
  },
};

// Dutch value -> stackiq value, per stackiq property name (any schema).
const VALUES_TO_STACKIQ = Object.values(VALUES_FROM_STACKIQ).reduce((acc, props) => {
  Object.entries(props).forEach(([prop, map]) => {
    acc[prop] = acc[prop] || {};
    Object.entries(map).forEach(([english, dutch]) => {
      acc[prop][dutch] = english;
      acc[prop][dutch.toLowerCase()] = english;
    });
  });
  return acc;
}, {});

function valueToStackiq(prop, value) {
  const map = VALUES_TO_STACKIQ[prop];
  if (!map) return value;
  if (Array.isArray(value)) return value.map((v) => valueToStackiq(prop, v));
  return typeof value === 'string' && map[value] !== undefined ? map[value] : value;
}

function valueFromStackiq(schemaSlug, prop, value) {
  const map = (VALUES_FROM_STACKIQ[schemaSlug] || {})[prop];
  if (!map) return value;
  if (Array.isArray(value))
    return value.map((v) => valueFromStackiq(schemaSlug, prop, v));
  return typeof value === 'string' && map[value] !== undefined ? map[value] : value;
}

// Dutch property -> stackiq property, over all schemas (used for query keys,
// where the schema is not always known). Built from the table above.
export const PROPERTY_TO_STACKIQ = Object.values(PROPERTIES_FROM_STACKIQ).reduce(
  (acc, map) => {
    Object.entries(map).forEach(([english, dutchNames]) => {
      dutchNames.forEach((dutch) => {
        if (!acc[dutch]) acc[dutch] = english;
      });
    });
    return acc;
  },
  {}
);

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------- requests

/** Is this an OpenRegister URL that addresses the softwarecatalogus register? */
export function isStackiqUrl(url) {
  if (!url) return false;
  return (
    /\/openregister\/api\/(objects|registers)\/(voorzieningen|stackiq)(\/|\?|$)/.test(
      url
    ) ||
    /\/openregister\/api\/schemas(\/[^/?]+|\?|$)/.test(url) ||
    /\/(softwarecatalog|stackiq)\/api\//.test(url)
  );
}

function translateQueryKey(key) {
  // _order[naam], @self[schema], naam, naam[]...
  return key.replace(/(^|\[)([A-Za-z][A-Za-z0-9]*)(?=\]|$|\[)/g, (m, pre, name) =>
    PROPERTY_TO_STACKIQ[name] ? `${pre}${PROPERTY_TO_STACKIQ[name]}` : m
  );
}

function translateQueryValue(key, value) {
  if (/(^|\[)_?schema(\]|$)/.test(key) && SCHEMA_TO_STACKIQ[value])
    return SCHEMA_TO_STACKIQ[value];
  const prop = translateQueryKey(key).replace(/\[\]$/, '');
  if (VALUES_TO_STACKIQ[prop]) return valueToStackiq(prop, value);
  if (/(^|\[)_?register(\]|$)/.test(key) && value === LEGACY_REGISTER)
    return STACKIQ_REGISTER;
  if (/^_(extend|fields|facets?)(\[\])?$/.test(key)) {
    return value
      .split(',')
      .map((v) => PROPERTY_TO_STACKIQ[v] || v)
      .join(',');
  }
  return value;
}

/**
 * Rewrite a relative API URL from the UI's vocabulary to stackiq's.
 * URLs that do not address the softwarecatalogus are returned unchanged.
 */
export function toStackiqUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let [path, query] = url.split('?');

  path = path
    .replace(/\/softwarecatalog\/api\//, '/stackiq/api/')
    .replace(
      /(\/openregister\/api\/(?:objects|registers)\/)voorzieningen(?=\/|$)/,
      `$1${STACKIQ_REGISTER}`
    )
    .replace(
      /(\/openregister\/api\/objects\/stackiq\/)([^/]+)/,
      (m, pre, slug) => `${pre}${SCHEMA_TO_STACKIQ[slug] || slug}`
    )
    .replace(
      /(\/openregister\/api\/schemas\/)([^/]+)/,
      (m, pre, slug) => `${pre}${SCHEMA_TO_STACKIQ[slug] || slug}`
    );

  if (query === undefined) return path;
  const translated = query
    .split('&')
    .map((pair) => {
      if (!pair) return pair;
      const eq = pair.indexOf('=');
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawValue = eq === -1 ? null : pair.slice(eq + 1);
      let key;
      let value;
      try {
        key = decodeURIComponent(rawKey);
        value =
          rawValue === null
            ? null
            : decodeURIComponent(rawValue.replace(/\+/g, ' '));
      } catch (e) {
        return pair;
      }
      const newKey = translateQueryKey(key);
      const newValue = value === null ? null : translateQueryValue(key, value);
      if (newKey === key && newValue === value) return pair;
      return newValue === null
        ? encodeURIComponent(newKey)
        : `${encodeURIComponent(newKey)}=${encodeURIComponent(newValue)}`;
    })
    .join('&');
  return `${path}?${translated}`;
}

/** Translate axios `params` (object form) the same way as a query string. */
export function toStackiqParams(params) {
  if (!isPlainObject(params)) return params;
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    const newKey = translateQueryKey(key);
    out[newKey] =
      typeof value === 'string' ? translateQueryValue(key, value) : value;
  });
  return out;
}

/**
 * Translate an object body the UI sends for a stackiq schema to stackiq's
 * property names. When several Dutch aliases map to one stackiq property
 * (organisation `beschrijving` and `beschrijvingLang` both mean
 * `description`), the alias whose value differs from the stackiq value
 * already in the body wins: that is the field the user edited.
 */
export function toStackiqBody(body, stackiqSchemaSlug) {
  if (!isPlainObject(body)) return body;
  const map = PROPERTIES_FROM_STACKIQ[stackiqSchemaSlug];
  if (!map) return body;
  const out = { ...body };
  Object.entries(map).forEach(([english, dutchNames]) => {
    const present = dutchNames.filter((d) =>
      Object.prototype.hasOwnProperty.call(out, d)
    );
    if (present.length === 0) return;
    const original = out[english];
    const edited = present.find(
      (d) => JSON.stringify(out[d]) !== JSON.stringify(original)
    );
    out[english] = edited !== undefined ? out[edited] : out[present[0]];
    present.forEach((d) => delete out[d]);
  });
  Object.keys(VALUES_FROM_STACKIQ[stackiqSchemaSlug] || {}).forEach((prop) => {
    if (prop in out) out[prop] = valueToStackiq(prop, out[prop]);
  });
  return out;
}

/** The stackiq schema slug a request URL addresses, if any. */
export function stackiqSchemaOfUrl(url) {
  const m = (url || '').match(/\/openregister\/api\/objects\/stackiq\/([^/?]+)/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------- responses

function schemaSlugOf(self) {
  const s = self && self.schema;
  if (isPlainObject(s)) return s.slug;
  return null;
}

function renameObject(obj, stackiqSlug) {
  Object.keys(VALUES_FROM_STACKIQ[stackiqSlug] || {}).forEach((prop) => {
    if (prop in obj) obj[prop] = valueFromStackiq(stackiqSlug, prop, obj[prop]);
  });
  const map = PROPERTIES_FROM_STACKIQ[stackiqSlug];
  if (!map) return obj;
  Object.entries(map).forEach(([english, dutchNames]) => {
    if (!Object.prototype.hasOwnProperty.call(obj, english)) return;
    const value = obj[english];
    dutchNames.forEach((d) => {
      if (!Object.prototype.hasOwnProperty.call(obj, d)) obj[d] = value;
    });
    delete obj[english];
  });
  return obj;
}

function translateSchema(schema) {
  const stackiqSlug = schema.slug;
  const map = PROPERTIES_FROM_STACKIQ[stackiqSlug];
  const values = VALUES_FROM_STACKIQ[stackiqSlug] || {};
  if (isPlainObject(schema.properties)) {
    Object.entries(values).forEach(([prop, vmap]) => {
      const def = schema.properties[prop];
      if (!def) return;
      if (Array.isArray(def.enum)) def.enum = def.enum.map((v) => vmap[v] || v);
      if (def.items && Array.isArray(def.items.enum))
        def.items.enum = def.items.enum.map((v) => vmap[v] || v);
    });
  }
  if (isPlainObject(schema.properties) && map) {
    const props = {};
    Object.entries(schema.properties).forEach(([key, def]) => {
      const names = map[key] || [key];
      names.forEach((n) => {
        props[n] = def;
      });
    });
    schema.properties = props;
    if (Array.isArray(schema.required)) {
      schema.required = schema.required.map((r) => (map[r] ? map[r][0] : r));
    }
  }
  if (SCHEMA_FROM_STACKIQ[stackiqSlug]) {
    schema.stackiqSlug = stackiqSlug;
    schema.slug = SCHEMA_FROM_STACKIQ[stackiqSlug];
  }
  if (SCHEMA_TITLE_FROM_STACKIQ[stackiqSlug]) {
    schema.stackiqTitle = schema.title;
    schema.title = SCHEMA_TITLE_FROM_STACKIQ[stackiqSlug];
  }
  return schema;
}

function isSchemaEntity(node) {
  return (
    isPlainObject(node.properties) &&
    typeof node.slug === 'string' &&
    !node['@self'] &&
    'title' in node
  );
}

/**
 * Walk a response body and translate every stackiq object and schema in it
 * to the UI's vocabulary. Objects are recognised by `@self.schema` (when
 * extended) or by the schema the request addressed; schemas by their shape.
 * Mutates and returns `data`.
 */
export function fromStackiqResponse(
  data,
  requestSchemaSlug = null,
  seen = new WeakSet()
) {
  if (Array.isArray(data)) {
    data.forEach((item) => fromStackiqResponse(item, requestSchemaSlug, seen));
    return data;
  }
  if (!isPlainObject(data) || seen.has(data)) return data;
  seen.add(data);

  if (
    isSchemaEntity(data) &&
    (PROPERTIES_FROM_STACKIQ[data.slug] || SCHEMA_FROM_STACKIQ[data.slug])
  ) {
    translateSchema(data);
    return data;
  }

  // The register itself: the UI addresses it as `voorzieningen`.
  if (
    data.slug === STACKIQ_REGISTER &&
    Array.isArray(data.schemas) &&
    'title' in data
  ) {
    data.stackiqSlug = STACKIQ_REGISTER;
    data.slug = LEGACY_REGISTER;
  }

  const self = data['@self'];
  if (isPlainObject(self)) {
    // stackiq's /api/aanbod tags each row with the schema it came from.
    const slug = schemaSlugOf(self) || data._aanbod_type || requestSchemaSlug;
    if (isPlainObject(self.schema)) fromStackiqResponse(self.schema, null, seen);
    if (isPlainObject(self.register)) fromStackiqResponse(self.register, null, seen);
    if (slug) renameObject(data, slug);
  }

  Object.keys(data).forEach((key) => {
    const v = data[key];
    if (v && typeof v === 'object') {
      // results arrays of a stackiq list carry the request's schema
      const childSlug =
        key === 'results' || key === 'objects' ? requestSchemaSlug : null;
      fromStackiqResponse(v, childSlug, seen);
    }
  });
  return data;
}

/**
 * Install the translation on an axios instance. Safe to call more than once
 * per instance.
 */
export function installStackiqVocabulary(instance) {
  if (!instance || instance.__stackiqVocabulary) return instance;
  // eslint-disable-next-line no-param-reassign
  instance.__stackiqVocabulary = true;
  instance.interceptors.request.use((config) => {
    if (!isStackiqUrl(config.url)) return config;
    // eslint-disable-next-line no-param-reassign
    config.url = toStackiqUrl(config.url);
    if (config.params) {
      // eslint-disable-next-line no-param-reassign
      config.params = toStackiqParams(config.params);
    }
    const schema = stackiqSchemaOfUrl(config.url);
    if (
      schema &&
      config.data &&
      typeof config.data === 'object' &&
      !(config.data instanceof FormData)
    ) {
      // eslint-disable-next-line no-param-reassign
      config.data = toStackiqBody(config.data, schema);
    }
    return config;
  });
  instance.interceptors.response.use((response) => {
    const url = response?.config?.url || '';
    if (isStackiqUrl(url) && response.data && typeof response.data === 'object') {
      fromStackiqResponse(response.data, stackiqSchemaOfUrl(url));
    }
    return response;
  });
  return instance;
}

/**
 * Apply the same translation to `window.fetch`. About twenty views call
 * OpenRegister and stackiq with fetch() directly instead of through an axios
 * client, so the interceptors never see them (`/objects/voorzieningen/
 * organisatie/{id}/uses` from "Mijn organisatie", for one). They also send no
 * credentials, so the wrapper adds the same Authorization header the axios
 * clients add. Only same-origin OpenRegister/stackiq URLs are touched.
 */
export function installStackiqFetch(win, getAuthHeader = () => null) {
  if (!win || typeof win.fetch !== 'function' || win.fetch.__stackiqVocabulary)
    return;
  const original = win.fetch.bind(win);
  const wrapped = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url || !isStackiqUrl(url) || /^https?:\/\//.test(url)) {
      return original(input, init);
    }
    const newUrl = toStackiqUrl(url);
    const opts = { ...init };
    const schema = stackiqSchemaOfUrl(newUrl);
    if (schema && typeof opts.body === 'string') {
      try {
        opts.body = JSON.stringify(toStackiqBody(JSON.parse(opts.body), schema));
      } catch (e) {
        // not JSON: send as is
      }
    }
    const headers = new win.Headers(
      opts.headers || (typeof input === 'object' ? input.headers : undefined)
    );
    const auth = getAuthHeader();
    if (auth && !headers.has('Authorization')) headers.set('Authorization', auth);
    opts.headers = headers;
    const response = await original(
      typeof input === 'string' ? newUrl : new win.Request(newUrl, input),
      opts
    );
    const json = response.json.bind(response);
    response.json = async () => fromStackiqResponse(await json(), schema);
    return response;
  };
  wrapped.__stackiqVocabulary = true;
  // eslint-disable-next-line no-param-reassign
  win.fetch = wrapped;
}
