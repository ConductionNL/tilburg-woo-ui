// Portaliq per-subject portal shell — reuses the softwarecatalogus OpenRegister
// engine (ConBeheerTable + object.store) repointed at Portaliq's subject-scoped
// /portal/api. This shell only resolves the subject's contribution manifest and
// arranges its collections; the actual table (fetch, headers-from-schema,
// pagination, search) is the real ConBeheerTable, self-fetching through the
// store, which the portal-mode axios adapter points at /portal/api.

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConBeheerTable } from '@views/ac-beheer/shared/components';

import { portalApi, getToken } from './portalApi';

export default function PortalHome() {
  const [token, setToken] = useState(() => getToken());
  const [state, setState] = useState({ loading: true, session: null, contributions: null });
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

  // The field-level authorization check (canReadField) requires an authenticated
  // user; the portal subject IS authenticated (bearer session), so pass a minimal
  // user so the schema-driven columns render. Field-level RBAC groups aren't the
  // portal's model — the server already projects rows per subject.
  const portalUser = useMemo(() => (
    state.session
      ? { isAuthenticated: true, userGroups: ['user'], displayName: state.session.subjectRef }
      : null
  ), [state.session]);

  async function devLogin() {
    const minted = await portalApi.devLogin('supplier');
    if (minted) { setToken(minted); }
  }
  async function logout() { await portalApi.logout(); setToken(null); }

  const findCollection = (contribution, id) => (contribution.collections || []).find((c) => c.id === id) || null;

  if (state.loading) {
    return <div className='portaliq-portal-loading'>…</div>;
  }

  if (!state.session) {
    return (
      <div className='portaliq-portal-login'>
        <h1>Welkom</h1>
        <p>Log in om uw gegevens te bekijken.</p>
        <button type='button' className='ac-button ac-button--primary' disabled>Inloggen met eHerkenning</button>
        <button type='button' className='ac-button ac-button--secondary' onClick={devLogin}>Dev-login (test)</button>
      </div>
    );
  }

  return (
    <div className='portaliq-portal-shell'>
      <div className='portaliq-portal-topbar'>
        <span className='portaliq-portal-subject'>{state.session.subjectRef} · {state.session.audience}</span>
        <button type='button' className='ac-button ac-button--secondary' onClick={logout}>Uitloggen</button>
      </div>

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
            // The REAL softwarecatalogus table, self-fetching via the store which
            // the portal-mode adapter points at /portal/api. `metadata` supplies
            // the register/schema; the table fetches the collection + its schema
            // (for headers) through the scoped endpoints; `user` unlocks the
            // schema-driven columns (canReadField requires an authed user).
            return (
              <div key={i} className='portaliq-portal-block'>
                {c.label && <h2>{c.label}</h2>}
                <ConBeheerTable metadata={{ register: c.register, schema: c.schema }} user={portalUser} />
              </div>
            );
          }
          return null;
        })}
      </section>
    </div>
  );
}
