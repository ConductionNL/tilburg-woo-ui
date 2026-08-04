// Portaliq per-subject portal shell — reuses the softwarecatalogus OpenRegister
// engine (ConBeheerTable + object.store) repointed at Portaliq's subject-scoped
// /portal/api. This shell only resolves the subject's contribution manifest and
// arranges its collections; the actual table (fetch, headers-from-schema,
// pagination, search) is the real ConBeheerTable, self-fetching through the
// store, which the portal-mode axios adapter points at /portal/api.

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConBeheerTable } from '@views/ac-beheer/shared/components';

import { portalApi, getToken } from './portalApi';
import PortalCreateForm from './PortalCreateForm';

export default function PortalHome() {
  const [token, setToken] = useState(() => getToken());
  const [state, setState] = useState({ loading: true, session: null, contributions: null });
  const [activeKey, setActiveKey] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

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

  // Dev-only audience switcher: each entry mints a session for a different
  // subject so you can see how the SAME engine renders each app's contributions.
  const DEV_AUDIENCES = [
    { audience: 'supplier', subjectRef: 'dev-supplier', label: 'Leverancier (supplier)' },
    { audience: 'client', subjectRef: 'dev-client', label: 'Klant (client)' },
    { audience: 'manager', subjectRef: 'dev-manager', label: 'Manager (manager)' },
  ];

  async function devLogin(aud) {
    const minted = await portalApi.devLogin(aud.audience, aud.subjectRef, 'dev-org');
    if (minted) { setToken(minted); }
  }
  async function logout() { await portalApi.logout(); setToken(null); }

  const findCollection = (contribution, id) => (contribution.collections || []).find((c) => c.id === id) || null;
  const findAction = (contribution, id) => (contribution.actions || []).find((a) => a.id === id) || null;

  if (state.loading) {
    return <div className='portaliq-portal-loading'>…</div>;
  }

  if (!state.session) {
    return (
      <div className='portaliq-portal-login'>
        <h1>Welkom</h1>
        <p>Log in om uw gegevens te bekijken.</p>
        <button type='button' className='ac-button ac-button--primary' disabled>Inloggen met eHerkenning</button>
        <div className='portaliq-portal-devlogin'>
          <span className='portaliq-portal-devlogin-label'>Dev-login (test) — kies een rol:</span>
          <div className='portaliq-portal-devlogin-buttons'>
            {DEV_AUDIENCES.map((aud) => (
              <button
                key={aud.audience}
                type='button'
                className='ac-button ac-button--secondary'
                onClick={() => devLogin(aud)}
              >
                {aud.label}
              </button>
            ))}
          </div>
        </div>
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
          if (block.type === 'action') {
            const a = findAction(active.contribution, block.action);
            if (!a || a.type !== 'create') { return null; }
            // Create via the REAL ConDynamicSchemaForm; on success bump the tick
            // so the collection table below remounts and shows the new row.
            return (
              <div key={i} className='portaliq-portal-block portaliq-portal-block--action'>
                <PortalCreateForm action={a} user={portalUser} onCreated={() => setRefreshTick((t) => t + 1)} />
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
            // `key` includes refreshTick so a create remounts + refetches.
            return (
              <div key={i} className='portaliq-portal-block'>
                {c.label && <h2>{c.label}</h2>}
                <ConBeheerTable key={`${c.id}-${refreshTick}`} metadata={{ register: c.register, schema: c.schema }} user={portalUser} />
              </div>
            );
          }
          return null;
        })}
      </section>
    </div>
  );
}
