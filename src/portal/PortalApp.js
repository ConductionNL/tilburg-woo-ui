// Portaliq per-subject portal — the tilburg-woo (softwarecatalogus) frontend
// wired to Portaliq's subject-scoped /portal/api (ADR-063, Decision-0). It reuses
// the tilburg design system (theme, layout shell, CSS) and renders the subject's
// contribution manifest: pages of typed blocks (collection tables, create forms,
// rich text) over per-subject data. No OpenRegister, no Nextcloud chrome.

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { portalApi, getToken } from './portalApi';

import './portal.scss';

function Header({ session, onLogout }) {
  return (
    <header className='ac-header portaliq-portal-header'>
      <div className='ac-header__inner portaliq-portal-header__inner'>
        <span className='portaliq-portal-brand'>Portaal</span>
        {session && (
          <div className='portaliq-portal-user'>
            <span>{session.subjectRef} · {session.audience}</span>
            <button type='button' className='ac-button ac-button--secondary' onClick={onLogout}>Uitloggen</button>
          </div>
        )}
      </div>
    </header>
  );
}

function CollectionTable({ collection, rows }) {
  const columns = useMemo(() => {
    if (Array.isArray(collection.columns) && collection.columns.length > 0) {
      return collection.columns;
    }
    const skip = new Set(['@self', 'id', 'uuid']);
    const fields = [];
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => {
      if (!skip.has(k) && !fields.includes(k)) { fields.push(k); }
    }));
    return fields.map((f) => ({ field: f }));
  }, [collection, rows]);

  if (!rows || rows.length === 0) {
    return <p className='portaliq-portal-empty'>Geen items.</p>;
  }

  const fmt = (value, render) => {
    if (value === null || value === undefined || value === '') { return ''; }
    if (render === 'date') { try { return new Date(value).toLocaleDateString('nl-NL'); } catch (e) { return String(value); } }
    if (render === 'boolean') { return value ? 'Ja' : 'Nee'; }
    return String(value);
  };

  return (
    <table className='con-table portaliq-portal-table'>
      <thead>
        <tr>{columns.map((c) => <th key={c.field}>{c.label || c.field}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id || row['@self']?.id || i}>
            {columns.map((c) => (
              <td key={c.field}>
                {c.render === 'badge'
                  ? <span className={`portaliq-portal-badge portaliq-portal-badge--${String(row[c.field] || '').toLowerCase()}`}>{fmt(row[c.field])}</span>
                  : fmt(row[c.field], c.render)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CreateForm({ action, onSubmitted }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const fieldConfigs = action.fieldConfigs || {};
  const optionsProviders = action.optionsProviders || {};

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await portalApi.createObject(action, values);
    setBusy(false);
    if (!result.ok) { setMessage('Opslaan is niet gelukt.'); return; }
    setValues({});
    setMessage(action.successMessage || 'Opgeslagen.');
    if (onSubmitted) { onSubmitted(); }
  }

  return (
    <form className='portaliq-portal-form' onSubmit={submit}>
      {(action.fields || []).map((field) => {
        const cfg = fieldConfigs[field] || {};
        const provider = optionsProviders[field];
        return (
          <div key={field} className='portaliq-portal-field'>
            <label htmlFor={`f-${action.id}-${field}`}>{cfg.label || field}{cfg.required ? ' *' : ''}</label>
            {provider && provider.type === 'static'
              ? (
                <select id={`f-${action.id}-${field}`} value={values[field] || ''} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}>
                  <option value=''>—</option>
                  {(provider.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )
              : (cfg.size === 'large' || cfg.size === 'full')
                ? <textarea id={`f-${action.id}-${field}`} value={values[field] || ''} placeholder={cfg.placeholder || ''} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))} />
                : <input id={`f-${action.id}-${field}`} type='text' value={values[field] || ''} placeholder={cfg.placeholder || ''} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))} />}
          </div>
        );
      })}
      <button type='submit' className='ac-button ac-button--primary' disabled={busy}>{busy ? '…' : (action.submitLabel || action.label || 'Opslaan')}</button>
      {message && <p className='portaliq-portal-msg'>{message}</p>}
    </form>
  );
}

export default function PortalApp() {
  const [token, setTokenState] = useState(() => getToken());
  const [state, setState] = useState({ loading: true, session: null, contributions: null });
  const [dataByCollection, setDataByCollection] = useState({});
  const [activeKey, setActiveKey] = useState(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const session = await portalApi.getSession();
    const contributions = session ? await portalApi.getContributions() : null;
    setState({ loading: false, session, contributions });
  }, []);

  useEffect(() => { refresh(); }, [refresh, token]);

  const nav = useMemo(() => {
    const out = [];
    (state.contributions?.contributions || []).forEach((c) => {
      (c.pages || []).forEach((p) => out.push({ key: `${c.app}:${p.id}`, label: p.label || p.id, page: p, contribution: c }));
    });
    return out;
  }, [state.contributions]);

  useEffect(() => {
    if (nav.length > 0 && (activeKey === null || !nav.some((n) => n.key === activeKey))) {
      setActiveKey(nav[0].key);
    }
  }, [nav, activeKey]);

  const active = useMemo(() => nav.find((n) => n.key === activeKey) || null, [nav, activeKey]);

  const loadCollection = useCallback(async (collection) => {
    const objects = await portalApi.fetchCollection(collection);
    setDataByCollection((d) => ({ ...d, [collection.id]: objects }));
  }, []);

  useEffect(() => {
    if (!active) { return; }
    const ids = new Set();
    (active.page.blocks || []).forEach((b) => { if ((b.type === 'collection' || b.type === 'detail') && b.collection) { ids.add(b.collection); } });
    ids.forEach((id) => {
      const c = (active.contribution.collections || []).find((x) => x.id === id);
      if (c) { loadCollection(c); }
    });
  }, [active, loadCollection]);

  async function devLogin() {
    const minted = await portalApi.devLogin('supplier');
    if (minted) { setTokenState(minted); }
  }
  async function logout() { await portalApi.logout(); setTokenState(null); }

  const findCollection = (contribution, id) => (contribution.collections || []).find((c) => c.id === id) || null;
  const findAction = (contribution, id) => (contribution.actions || []).find((a) => a.id === id) || null;

  return (
    <div className='ac-app-container portaliq-portal'>
      <Header session={state.session} onLogout={logout} />
      <main id='main' className='ac-app-main portaliq-portal-main'>
        {state.loading && <p>…</p>}

        {!state.loading && !state.session && (
          <section className='portaliq-portal-login'>
            <h1>Welkom</h1>
            <p>Log in om uw gegevens te bekijken.</p>
            <button type='button' className='ac-button ac-button--primary' disabled>Inloggen met eHerkenning</button>
            <button type='button' className='ac-button ac-button--secondary' onClick={devLogin}>Dev-login (test)</button>
          </section>
        )}

        {!state.loading && state.session && (
          <div className='portaliq-portal-shell'>
            {nav.length > 0 && (
              <nav className='portaliq-portal-nav'>
                {nav.map((n) => (
                  <button key={n.key} type='button' className={n.key === activeKey ? 'portaliq-portal-nav-item is-active' : 'portaliq-portal-nav-item'} onClick={() => setActiveKey(n.key)}>{n.label}</button>
                ))}
              </nav>
            )}

            <section className='portaliq-portal-page'>
              {nav.length === 0 && <p>Nog geen bijdragen om weer te geven.</p>}
              {active && (active.page.blocks || []).map((block, i) => {
                if (block.type === 'richText') {
                  const lines = String(block.markdown || '').split('\n').filter((l) => l.trim() !== '');
                  return (
                    <div key={i} className='portaliq-portal-richtext'>
                      {lines.map((line, j) => {
                        const t = line.trim();
                        if (t.startsWith('## ')) { return <h2 key={j}>{t.slice(3)}</h2>; }
                        if (t.startsWith('# ')) { return <h1 key={j}>{t.slice(2)}</h1>; }
                        return <p key={j}>{t}</p>;
                      })}
                    </div>
                  );
                }
                if (block.type === 'collection') {
                  const c = findCollection(active.contribution, block.collection);
                  if (!c) { return null; }
                  return (
                    <div key={i} className='portaliq-portal-block'>
                      {c.label && <h2>{c.label}</h2>}
                      <CollectionTable collection={c} rows={dataByCollection[c.id] || []} />
                    </div>
                  );
                }
                if (block.type === 'action') {
                  const a = findAction(active.contribution, block.action);
                  if (!a || (a.type !== 'create' && a.type !== 'update')) { return null; }
                  return (
                    <div key={i} className='portaliq-portal-block'>
                      <h2>{a.label || a.id}</h2>
                      <CreateForm action={a} onSubmitted={() => {
                        (active.contribution.collections || []).forEach((c) => { if (c.register === a.register && c.schema === a.schema) { loadCollection(c); } });
                      }} />
                    </div>
                  );
                }
                return null;
              })}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
