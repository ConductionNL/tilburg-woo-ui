import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useParams } from 'react-router-dom';
import { AcContainer, AcFlex, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcLoader } from '@components';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { commongroundApiUrl } from '@config';

const PublicationOrganisationTabs = ({ publicationId }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchUses = async () => {
      try {
        const res = await fetch(
          `${commongroundApiUrl()}/opencatalogi/api/publications/${publicationId}/uses?extend[]=@self.schema`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUses(Array.isArray(data.results) ? data.results : []);
      } catch (e) {
        // ignore network errors for this lightweight listing
      }
    };
    const fetchUsed = async () => {
      try {
        const res = await fetch(
          `${commongroundApiUrl()}/opencatalogi/api/publications/${publicationId}/used?extend[]=@self.schema`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUsed(Array.isArray(data.results) ? data.results : []);
      } catch (e) {
        // ignore network errors for this lightweight listing
      }
    };
    fetchUses();
    fetchUsed();
    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  const uniqueSchemasFrom = useCallback((arr) => {
    if (!arr?.length) return [];
    const map = new Map();
    for (const item of arr) {
      const schema = item?.['@self']?.schema;
      if (!schema) continue;
      if (!map.has(schema.id)) map.set(schema.id, schema);
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
  }, []);

  const filterWantedSchemas = useCallback((schemas) => {
    const wanted = new Set(['product', 'dienst', 'koppeling', 'module']);
    return (schemas || []).filter((s) => wanted.has(s.slug || s.id || s));
  }, []);

  const usesSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(uses)),
    [uses]
  );
  const usedSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(used)),
    [used]
  );

  if (!usesSchemas.length && !usedSchemas.length) return null;

  return (
    <div className='ac-account--tabs-container'>
      <AcTabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
        <AcTabList>
          {usesSchemas.map((schema, idx) => {
            const count = (uses || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            ).length;
            return (
              <AcTab key={`uses-${schema.id}`} selected={tabIndex === idx}>
                {(schema.slug === 'product'
                  ? 'Producten'
                  : schema.slug === 'dienst'
                  ? 'Diensten'
                  : schema.slug === 'koppeling'
                  ? 'Koppelingen'
                  : schema.slug === 'module'
                  ? 'Applicaties'
                  : schema.title || schema.id) + (count ? ` (${count})` : '')}
              </AcTab>
            );
          })}
          {usedSchemas.map((schema, idx) => {
            const count = (used || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            ).length;
            return (
              <AcTab
                key={`used-${schema.id}`}
                selected={tabIndex === idx + usesSchemas.length}
              >
                {(schema.slug === 'product'
                  ? 'Producten'
                  : schema.slug === 'dienst'
                  ? 'Diensten'
                  : schema.slug === 'koppeling'
                  ? 'Koppelingen'
                  : schema.slug === 'module'
                  ? 'Applicaties'
                  : schema.title || schema.id) + (count ? ` (${count})` : '')}
              </AcTab>
            );
          })}
        </AcTabList>

        {usesSchemas.map((schema, idx) => {
          const rows = (uses || []).filter(
            (r) => r['@self']?.schema?.id === schema.id
          );
          return (
            <AcTabPanel key={`uses-panel-${schema.id}`} selected={tabIndex === idx}>
              <ul
                style={{ margin: 0, paddingInlineStart: '1rem', textAlign: 'right' }}
              >
                {rows.map((r) => (
                  <li key={r.id || r['@self']?.id}>
                    <Link href={`/publicatie/${r.id || r['@self']?.id}`}>
                      {r['@self']?.name || r.title || r.naam || r.id}
                    </Link>
                  </li>
                ))}
              </ul>
            </AcTabPanel>
          );
        })}

        {usedSchemas.map((schema, idx) => {
          const rows = (used || []).filter(
            (r) => r['@self']?.schema?.id === schema.id
          );
          const index = idx + usesSchemas.length;
          return (
            <AcTabPanel
              key={`used-panel-${schema.id}`}
              selected={tabIndex === index}
            >
              <ul
                style={{ margin: 0, paddingInlineStart: '1rem', textAlign: 'right' }}
              >
                {rows.map((r) => (
                  <li key={r.id || r['@self']?.id}>
                    <Link href={`/publicatie/${r.id || r['@self']?.id}`}>
                      {r['@self']?.name || r.title || r.naam || r.id}
                    </Link>
                  </li>
                ))}
              </ul>
            </AcTabPanel>
          );
        })}
      </AcTabs>
    </div>
  );
};

const AcPublicationOrganisation = ({ store: { publications } }) => {
  const { id } = useParams();
  const { get_single, loading } = publications;

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const contact = (get_single?.contactpersonen || [])[0] || {};

  return (
    <AcContainer compact margin='xl'>
      <AcFlex column gap='lg'>
        <div className='ac-register-review__section'>
          <div className='ac-account-review__header'>
            <div>
              <Heading level={4}>
                <div className='con-beheer-details--header-container'>
                  {get_single?.['@self']?.image && (
                    <ConLogoPreview
                      className='con-beheer-details--logo-container'
                      logoUrl={get_single?.['@self']?.image}
                    />
                  )}

                  <Heading className='con-beheer-details--title'>
                    {get_single?.['@self']?.name || get_single?.id}
                  </Heading>
                </div>
              </Heading>

              {!!get_single?.['@self']?.summary && (
                <div style={{ marginTop: '0.5rem' }}>
                  {get_single?.['@self']?.summary}
                </div>
              )}

              <div className='ac-account-review__header-info'>
                <div>
                  Website:
                  <div>
                    {get_single?.website ? (
                      <Link
                        href={
                          get_single.website.startsWith('http')
                            ? get_single.website
                            : `https://${get_single.website}`
                        }
                        target='_blank'
                        rel='noreferrer'
                      >
                        {get_single.website}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div>
                  Telefoon:
                  <div>
                    {get_single?.telefoonnummer ? (
                      <Link href={`tel:${get_single.telefoonnummer}`}>
                        {get_single.telefoonnummer}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div>{get_single?.type || '-'}</div>
                {get_single?.type === 'Leverancier' && (
                  <div>
                    KVK-nummer:
                    <div>{get_single?.['@self']?.kvkNummer || '-'}</div>
                  </div>
                )}
              </div>
            </div>
            <div className='ac-register-review__contact'>
              <div className='ac-register-review__contact-details'>
                <Heading level={5}>Contactpersoon</Heading>
                <div className='ac-register-review__contact-info'>
                  <div>
                    {[contact?.voornaam, contact?.tussenvoegsel, contact?.achternaam]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  <div>
                    {contact?.['e-mailadres'] ? (
                      <Link href={`mailto:${contact['e-mailadres']}`}>
                        {contact['e-mailadres']}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div>
                    {contact?.telefoonnummer ? (
                      <Link href={`tel:${contact.telefoonnummer}`}>
                        {contact.telefoonnummer}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Long description (markdown is already stored as string) */}
          {!!get_single?.beschrijvingLang && (
            <div style={{ marginTop: '1rem' }}>{get_single?.beschrijvingLang}</div>
          )}

          {/* Tabs */}
          <div style={{ marginTop: '1rem' }}>
            <PublicationOrganisationTabs publicationId={id} />
          </div>
        </div>
      </AcFlex>
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationOrganisation));
