import React, { useEffect, useState, useCallback } from 'react';
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
import _ from 'lodash';
import { ConCardOrganisationApplication, ConCardDienst } from '@molecules/con-cards';
import { AcSearchResult } from '@molecules';
import { getImageFromPublication } from '@utils';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';

// Markdown Editor
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';
import clsx from 'clsx';

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
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [tabIndexUses, setTabIndexUses] = useState(0);
  const [tabIndexUsed, setTabIndexUsed] = useState(0);

  const fetchUses = useCallback(async () => {
    setUsesLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching uses:', error);
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    setUsedLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  // Loading
  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer margin='xl'>
        <AcFlex column spacing='sm'>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
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
          </AcFlex>
          <AcFlex spacing='sm' justifyContent='between'>
            <AcFlex column spacing='md' style={{ flex: 3 }}>
              {!!get_single?.['@self']?.summary && (
                <div>{get_single?.['@self']?.summary}</div>
              )}

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
            </AcFlex>
            <AcFlex column spacing='sm' style={{ flex: 1 }}>
              <div className='ac-register-review__section'>
                <div style={{ marginTop: '12px' }}>
                  {get_single?.['e-mailadres'] && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Email: </strong>
                      <Link href={`mailto:${get_single['e-mailadres']}`}>
                        {get_single['e-mailadres']}
                      </Link>
                    </div>
                  )}
                  {get_single?.telefoonnummer && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Telefoon: </strong>
                      <Link
                        href={`tel:${get_single.telefoonnummer.replace(/\s/g, '')}`}
                      >
                        {get_single.telefoonnummer}
                      </Link>
                    </div>
                  )}
                  {get_single?.website && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Website: </strong>
                      <Link
                        href={
                          get_single.website.startsWith('http')
                            ? get_single.website
                            : `https://${get_single.website}`
                        }
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {get_single.website}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <AcTabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
                  <AcTabList className='ac-organisatie-contactpersonen'>
                    <AcTab>Contactpersonen</AcTab>
                  </AcTabList>
                  <AcTabPanel selected={tabIndex === 0}>
                    {get_single?.contactpersonen &&
                      get_single.contactpersonen.length > 0 && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            {get_single.contactpersonen.map((contact, index) => {
                              const fullName = [
                                contact.voornaam,
                                contact.tussenvoegsel,
                                contact.achternaam,
                              ]
                                .filter(Boolean)
                                .join(' ');

                              return (
                                <div key={index} style={{ marginBottom: '8px' }}>
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    {fullName || 'Naamloze contactpersoon'}
                                  </div>
                                  {contact['e-mailadres'] && (
                                    <div style={{ marginBottom: '2px' }}>
                                      <Link
                                        href={`mailto:${contact['e-mailadres']}`}
                                      >
                                        {contact['e-mailadres']}
                                      </Link>
                                    </div>
                                  )}
                                  {contact.telefoonnummer && (
                                    <div>
                                      <Link
                                        href={`tel:${contact.telefoonnummer.replace(
                                          /\s/g,
                                          ''
                                        )}`}
                                      >
                                        {contact.telefoonnummer}
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </AcTabPanel>
                </AcTabs>
              </div>
            </AcFlex>
          </AcFlex>

          <AcGenericBeheerDeleteModal
            objects={get_single ? [get_single] : []}
            showModal={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => navigate('/zoeken')}
          />

          <div>
            {(usesLoading ||
              (uses &&
                uses.filter((use) => use['@self']?.schema?.slug !== 'contactpersoon')
                  .length > 0)) && (
              <>
                {!usesLoading && <Heading level={2}>Maakt gebruik van</Heading>}
                {usesLoading ? (
                  <div>
                    <AcLoader className='con-publication-uses-used-loader' />
                  </div>
                ) : (
                  <AcTabs
                    selectedIndex={tabIndexUses}
                    onSelect={(index) => setTabIndexUses(index)}
                  >
                    <AcTabList>
                      {uses &&
                        uses.filter(
                          (use) => use['@self']?.schema?.slug !== 'contactpersoon'
                        ).length > 0 && (
                          <>
                            {uses &&
                              // show unique headers, excluding contactpersoon schema
                              _.uniqBy(
                                uses.filter(
                                  (use) =>
                                    use['@self']?.schema?.slug !== 'contactpersoon'
                                ),
                                (use) => use['@self'].schema.id
                              ).map((use, idx) => (
                                <AcTab
                                  key={use['@self'].schema.id}
                                  selected={tabIndexUses === idx}
                                >
                                  <span>{use['@self'].schema.title}</span>
                                </AcTab>
                              ))}
                          </>
                        )}
                    </AcTabList>

                    {uses &&
                      _.uniqBy(
                        uses.filter(
                          (use) => use['@self']?.schema?.slug !== 'contactpersoon'
                        ),
                        (use) => use['@self'].schema.id
                      )
                        .map((use) => use['@self'])
                        .map((metadata, idx) => {
                          // Build the items for ALL items with this schema, excluding contactpersoon
                          const itemsWithThisSchema = uses.filter(
                            (u) =>
                              u['@self'].schema.id === metadata.schema.id &&
                              u['@self']?.schema?.slug !== 'contactpersoon'
                          );

                          // Render cards based on schema type
                          const renderCards = itemsWithThisSchema.map((item) => {
                            const schemaSlug = item['@self']?.schema?.slug;

                            switch (schemaSlug) {
                              case 'product':
                              case 'module':
                              case 'organisatie':
                                return (
                                  <ConCardOrganisationApplication
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    logo={getImageFromPublication(item)}
                                    cardType={schemaSlug}
                                    type={item['@self']?.schema?.title}
                                    referenceComponents={item.referentieComponenten}
                                    updated={item['@self']?.updated}
                                    published={item['@self']?.published}
                                    organisation={item['@self']?.organisation}
                                    objectStore={object}
                                  />
                                );
                              case 'dienst':
                                return (
                                  <ConCardDienst
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    updated={item['@self']?.updated}
                                    published={item['@self']?.published}
                                    category={item['@self']?.schema?.title}
                                    themes={item.themes}
                                  />
                                );
                              default:
                                return (
                                  <AcSearchResult
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    published={item['@self']?.published}
                                    category={item['@self']?.schema?.title}
                                    themes={item.themes}
                                  />
                                );
                            }
                          });

                          return (
                            <AcTabPanel key={idx} selected={tabIndexUses === idx}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'repeat(auto-fit, minmax(300px, 1fr))',
                                  gap: '16px',
                                  marginTop: '16px',
                                }}
                              >
                                {renderCards}
                              </div>
                            </AcTabPanel>
                          );
                        })}
                  </AcTabs>
                )}
              </>
            )}
          </div>

          <div>
            {(usedLoading ||
              (used &&
                used.filter((use) => use['@self']?.schema?.slug !== 'contactpersoon')
                  .length > 0)) && (
              <>
                {usedLoading ? (
                  <div>
                    <AcLoader className='con-publication-uses-used-loader' />
                  </div>
                ) : (
                  <AcTabs
                    selectedIndex={tabIndexUsed}
                    onSelect={(index) => setTabIndexUsed(index)}
                  >
                    <AcTabList>
                      {used &&
                        used.filter(
                          (use) => use['@self']?.schema?.slug !== 'contactpersoon'
                        ).length > 0 && (
                          <>
                            {used &&
                              // show unique headers, excluding contactpersoon schema
                              _.uniqBy(
                                used.filter(
                                  (use) =>
                                    use['@self']?.schema?.slug !== 'contactpersoon'
                                ),
                                (use) => use['@self'].schema.id
                              ).map((use, idx) => (
                                <AcTab
                                  key={use['@self'].schema.id}
                                  selected={tabIndexUsed === idx}
                                >
                                  <span>{use['@self'].schema.title}</span>
                                </AcTab>
                              ))}
                          </>
                        )}
                    </AcTabList>

                    {used &&
                      _.uniqBy(
                        used.filter(
                          (use) => use['@self']?.schema?.slug !== 'contactpersoon'
                        ),
                        (use) => use['@self'].schema.id
                      )
                        .map((use) => use['@self'])
                        .map((metadata, idx) => {
                          // Build the items for ALL items with this schema, excluding contactpersoon
                          const itemsWithThisSchema = used.filter(
                            (u) =>
                              u['@self'].schema.id === metadata.schema.id &&
                              u['@self']?.schema?.slug !== 'contactpersoon'
                          );

                          // Render cards based on schema type
                          const renderCards = itemsWithThisSchema.map((item) => {
                            const schemaSlug = item['@self']?.schema?.slug;

                            switch (schemaSlug) {
                              case 'product':
                              case 'module':
                              case 'organisatie':
                                return (
                                  <ConCardOrganisationApplication
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    logo={getImageFromPublication(item)}
                                    cardType={schemaSlug}
                                    type={item['@self']?.schema?.title}
                                    referenceComponents={item.referentieComponenten}
                                    updated={item['@self']?.updated}
                                    published={item['@self']?.published}
                                    organisation={item['@self']?.organisation}
                                    objectStore={object}
                                  />
                                );
                              case 'dienst':
                                return (
                                  <ConCardDienst
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    updated={item['@self']?.updated}
                                    published={item['@self']?.published}
                                    category={item['@self']?.schema?.title}
                                    themes={item.themes}
                                  />
                                );
                              default:
                                return (
                                  <AcSearchResult
                                    key={item.id}
                                    id={item.id}
                                    title={
                                      item.title ??
                                      item.titel ??
                                      item.name ??
                                      item.naam ??
                                      item.id
                                    }
                                    summary={
                                      item.beschrijving ??
                                      item.beschrijvingKort ??
                                      ''
                                    }
                                    published={item['@self']?.published}
                                    category={item['@self']?.schema?.title}
                                    themes={item.themes}
                                  />
                                );
                            }
                          });

                          return (
                            <AcTabPanel key={idx} selected={tabIndexUsed === idx}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'repeat(auto-fit, minmax(300px, 1fr))',
                                  gap: '16px',
                                  marginTop: '16px',
                                }}
                              >
                                {renderCards}
                              </div>
                            </AcTabPanel>
                          );
                        })}
                  </AcTabs>
                )}
              </>
            )}
          </div>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
