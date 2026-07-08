// Portaliq portal data + auth adapter (in the tilburg-woo frontend).
//
// The single seam between this SPA and Portaliq's SUBJECT-SCOPED /portal/api.
// Every call carries the bearer session (localStorage) and fails closed. This is
// the tilburg frontend wired to /portal/api instead of OpenRegister — the design
// system, theme and schema-driven components are reused; the data is per-subject.

const TOKEN_KEY = 'portaliq_token';
const API_BASE = '/index.php/apps/portaliq/portal/api';

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    /* storage unavailable */
  }
  // Mirror into the cookie the OpenRegister store's request interceptor reads, so
  // the reused engine authenticates with the same portal session (portal mode).
  try {
    if (token) {
      document.cookie = `nextcloud_access_token=${token}; path=/`;
    } else {
      document.cookie = 'nextcloud_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  } catch (e) {
    /* document unavailable */
  }
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function send(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const json = await res.json().catch(() => ({}));
  return { ok: true, object: json.object || json };
}

const col = (register, schema) =>
  `/collections/${encodeURIComponent(register)}/${encodeURIComponent(schema)}`;

export const portalApi = {
  async getSession() {
    const body = await get('/session');
    return body && body.authenticated ? body : null;
  },
  async getContributions() {
    return (await get('/contributions')) || { contributions: [] };
  },
  async fetchCollection(collection) {
    const body = await get(`${col(collection.register, collection.schema)}?collection=${encodeURIComponent(collection.id)}`);
    return (body && Array.isArray(body.objects)) ? body.objects : [];
  },
  async createObject(action, data) {
    return send('POST', col(action.register, action.schema), data);
  },
  async updateObject(action, id, data) {
    return send('PATCH', `${col(action.register, action.schema)}/${encodeURIComponent(id)}?action=${encodeURIComponent(action.id)}`, data);
  },
  async fetchOptions(provider) {
    const body = await get(`${col(provider.register, provider.schema)}`);
    const rows = (body && Array.isArray(body.objects)) ? body.objects : [];
    return rows
      .map((r) => ({
        value: r[provider.valueField] ?? r.id ?? r['@self']?.id,
        label: r[provider.labelField] ?? r.title ?? r.name ?? r.id,
      }))
      .filter((o) => o.value !== undefined && o.value !== null);
  },
  async uploadFile(collection, id, file) {
    const form = new FormData();
    form.append('file', file);
    const url = `${API_BASE}${col(collection.register, collection.schema)}/${encodeURIComponent(id)}/files?collection=${encodeURIComponent(collection.id)}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', ...authHeaders() }, body: form });
      if (!res.ok) {
        return { ok: false, status: res.status };
      }
      const json = await res.json().catch(() => ({}));
      return { ok: true, file: json.file || json };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  },
  async devLogin(audience) {
    const res = await fetch(`${API_BASE}/session/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ audience: audience || 'supplier' }),
    });
    if (!res.ok) {
      return null;
    }
    const body = await res.json().catch(() => null);
    if (body && body.token) {
      setToken(body.token);
      return body.token;
    }
    return null;
  },
  async logout() {
    try {
      await fetch(`${API_BASE}/session`, { method: 'DELETE', headers: authHeaders() });
    } catch (e) {
      /* best-effort */
    }
    setToken(null);
  },
};
