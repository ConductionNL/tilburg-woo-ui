import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '../ac-register/con-logo-preview';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

// Markdown Editor
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';

const AcPublication = ({ store: { publications, object, user } }) => {
  const { id } = useParams();
  const { get_single, loading, attachments } = publications;

  const navigate = useNavigate();

  // Use the same related actions hook as beheer pages
  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      // For publication pages, we'll navigate to the beheer page with modal open
      // TODO: Handle outgoing relationship metadata in beheer page URL params
      if (metadata.isOutgoing) {
        // handle outgoing relationship metadata
      }
      navigate(`/beheer/${targetType}?showCreateModal=true&voorzieningId=${id}`);
    },
    [navigate, id]
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: get_single?.['@self']?.schema?.slug,
    currentType: get_single?.['@self']?.schema?.slug, // Use schema slug as current type
    openDynamicCreate,
    currentObject: get_single, // Pass current object for organization permission checks
    currentObjectRegister: 'voorzieningen', // Pass current object register (for publication pages)
    currentObjectSchema: get_single?.['@self']?.schema?.slug, // Pass current object schema
  });

  // Generate action menu items
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  useEffect(() => {
    if (!get_single?.['@self']?.schema?.slug || !id) return;

    const items = makeActionsForContext(id).map(
      ({ key, label, onClick, schema, icon }) => ({
        key,
        label,
        onClick,
        schema,
        icon,
      })
    );

    setActionMenuItems(items);
  }, [get_single?.['@self']?.schema?.slug, id, makeActionsForContext]);

  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);

  const fetchUses = async () => {
    const response = await fetch(
      `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      console.error('Error fetching uses:', response.statusText);
      return;
    }
    const data = await response.json();

    setUses(data.results);
  };
  const fetchUsed = async () => {
    const response = await fetch(
      `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      console.error('Error fetching used:', response.statusText);
      return;
    }
    const data = await response.json();

    setUsed(data.results);
  };

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, []);

  // Loading
  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer margin='xl'>
        <div className='con-publication-detail__organisation_actions'>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={get_single?.['@self']?.schema?.slug}
            title={get_single?.['@self']?.name || get_single?.id}
            published={get_single?.['@self']?.published}
            object={get_single}
            showViewAction={false}
            showEditAction={true}
            showPublishActions={true}
            onDelete={handleDelete}
            onEdit={() => {
              const schemaSlug = get_single?.['@self']?.schema?.slug;
              if (schemaSlug) {
                const wizards = Object.values(DASHBOARD_WIZARDS);
                const wizard = wizards.find((w) => w.schema === schemaSlug);

                if (wizard) {
                  const baseUrl = getWizardUrl(wizard);
                  const url = new URL(baseUrl, window.location.origin);
                  url.searchParams.set('id', id);
                  navigate(url.pathname + url.search);
                  return;
                }
              }
              // Fallback to beheer legacy edit page in new tab
              const beheerUrl = `/beheer/${schemaSlug}/${id}`;
              window.open(beheerUrl, '_blank');
            }}
            uniqueActions={[
              {
                key: 'delete',
                label: 'Verwijderen',
                icon: VISUALS.TRASHCAN,
                onClick: handleDelete,
              },
            ]}
            triggerStyle='button'
            relatedActions={actionMenuItems}
          />
        </div>
        <AcFlex column spacing={'lg'}>
          <div className='con-publication-detail__organisation_header'>
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
                    {get_single?.['@self']?.name ||
                      get_single?.id ||
                      get_single?.name ||
                      'Organisatie'}
                  </Heading>
                </div>
              </Heading>
              {!!get_single?.['@self']?.summary && (
                <div>{get_single?.['@self']?.summary}</div>
              )}
              <br />
              <br />
              <br />
              <div className='con-publication-detail__organisation_header_info'>
                <div>
                  Website:
                  <div>
                    {get_single?.website ? (
                      <Link
                        href={
                          get_single?.website.startsWith('http')
                            ? get_single?.website
                            : `https://${get_single?.website}`
                        }
                        target='_blank'
                        rel='noreferrer'
                      >
                        {get_single?.website}
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
                      <Link href={`tel:${get_single?.telefoonnummer}`}>
                        {get_single?.telefoonnummer}
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
                    <div>{get_single?.kvkNummer || '-'}</div>
                  </div>
                )}
              </div>
            </div>
            <div className='con-publication-detail__organisation_header_contact'>
              <div className='ac-register-review__contact-details'>
                <div className='ac-register-review__contact-image'>
                  {get_single?.contactpersonen[0]?.image ? (
                    <img
                      src={get_single?.contactpersonen[0].image}
                      alt='Contactpersoon'
                      className='ac-register-review__contact-image--round'
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className='ac-register-review__contact-image--round'>
                      <VISUALS.USER_CIRCLE />
                    </div>
                  )}
                </div>
                <Heading level={5}>Contactpersoon</Heading>
                <div className='ac-register-review__contact-info'>
                  <div>
                    {[
                      get_single?.contactpersonen[0]?.voornaam,
                      get_single?.contactpersonen[0]?.tussenvoegsel,
                      get_single?.contactpersonen[0]?.achternaam,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  <div>
                    {get_single?.contactpersonen[0]?.['e-mailadres'] ? (
                      <Link
                        href={`mailto:${get_single?.contactpersonen[0]?.['e-mailadres']}`}
                      >
                        {get_single?.contactpersonen[0]?.['e-mailadres']}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div>
                    {get_single?.contactpersonen[0]?.telefoonnummer ? (
                      <Link
                        href={`tel:${get_single?.contactpersonen[0]?.telefoonnummer}`}
                      >
                        {get_single?.contactpersonen[0]?.telefoonnummer}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!!get_single?.beschrijvingLang && (
            <MDEditor.Markdown
              wrapperElement={{
                'data-color-mode': 'light',
              }}
              source={get_single?.beschrijvingLang}
              remarkPlugins={[
                [remarkGfm, { singleTilde: false }],
                remarkDefinitionList,
                remarkEmoji,
                remarkSupersub,
                remarkMark,
              ]}
              rehypePlugins={[
                rehypeSlug,
                [remarkRehype, { handlers: { ...defListHastHandlers } }],
              ]}
            />
          )}

          <div style={{ marginTop: '1rem' }}>
            <AccountOrganisationTabs uses={uses} used={used} />
          </div>
        </AcFlex>

        <AcGenericBeheerDeleteModal
          objects={get_single ? [get_single] : []}
          showModal={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => navigate('/zoeken')}
        />
      </AcContainer>
    </>
  );
};

const AccountOrganisationTabs = observer(({ uses, used }) => {
  // Pull related data for tabs

  const uniqueSchemasFrom = useCallback((rel) => {
    const items = Array.isArray(rel) ? rel : rel?.results;
    if (!items) return [];

    const map = new Map();
    for (const item of items) {
      const schema = item?.['@self']?.schema;
      if (!schema) continue;
      const key = schema.id || schema.slug || schema;
      if (!map.has(key)) map.set(key, schema);
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.id || a.slug || a).localeCompare(String(b.id || b.slug || b))
    );
  }, []);

  // Only show specific categories: producten, diensten, koppelingen, modules
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

  const [tabIndex, setTabIndex] = useState(0);

  if (!usesSchemas?.length && !usedSchemas?.length) return null;

  return (
    <div className='ac-account--tabs-container'>
      <AcTabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
        <AcTabList>
          {usesSchemas.map((schema, idx) => {
            const items = Array.isArray(uses) ? uses : uses?.results || [];
            const count = items.filter(
              (r) =>
                (r['@self']?.schema?.id || r['@self']?.schema?.slug) ===
                (schema.id || schema.slug)
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
            const items = Array.isArray(used) ? used : used?.results || [];
            const count = items.filter(
              (r) =>
                (r['@self']?.schema?.id || r['@self']?.schema?.slug) ===
                (schema.id || schema.slug)
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
          const items = Array.isArray(uses) ? uses : uses?.results || [];
          const rows = items.filter(
            (r) =>
              (r['@self']?.schema?.id || r['@self']?.schema?.slug) ===
              (schema.id || schema.slug)
          );
          return (
            <AcTabPanel key={`uses-panel-${schema.id}`} selected={tabIndex === idx}>
              <ul
                style={{ margin: 0, paddingInlineStart: '1rem', textAlign: 'right' }}
              >
                {rows.map((r) => {
                  const href =
                    r['@self']?.schema?.slug && r['@self']?.id
                      ? `/beheer/${r['@self']?.schema?.slug}/${r['@self']?.id}`
                      : undefined;
                  return (
                    <li key={r.id || r['@self']?.id}>
                      {href ? (
                        <Link href={href}>{r['@self']?.name || r.id}</Link>
                      ) : (
                        r['@self']?.name || r.id
                      )}
                    </li>
                  );
                })}
              </ul>
            </AcTabPanel>
          );
        })}

        {usedSchemas.map((schema, idx) => {
          const items = Array.isArray(used) ? used : used?.results || [];
          const rows = items.filter(
            (r) =>
              (r['@self']?.schema?.id || r['@self']?.schema?.slug) ===
              (schema.id || schema.slug)
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
                {rows.map((r) => {
                  const href =
                    r['@self']?.schema?.slug && r['@self']?.id
                      ? `/beheer/${r['@self']?.schema?.slug}/${r['@self']?.id}`
                      : undefined;
                  return (
                    <li key={r.id || r['@self']?.id}>
                      {href ? (
                        <Link href={href}>{r['@self']?.name || r.id}</Link>
                      ) : (
                        r['@self']?.name || r.id
                      )}
                    </li>
                  );
                })}
              </ul>
            </AcTabPanel>
          );
        })}
      </AcTabs>
    </div>
  );
});

export default withStore(observer(AcPublication));
