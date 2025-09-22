import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcContainer, AcFlex, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import {
  Heading,
  Paragraph,
  Alert,
  Link,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import _ from 'lodash';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { AcButton } from '@src/molecules';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
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
import { commongroundApiUrl } from '@src/config';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationProduct = ({
  store: { publications, object, user },
  //   schema,
}) => {
  const { id } = useParams();
  const {
    get_single,
    loading,
    // attachmentPagination,
    // setAttachmentsPage,
    // getFilteredAttachments,
    // attachments,
  } = publications;
  const navigate = useNavigate();

  const data = get_single || null;

  // Use the same related actions hook as beheer pages
  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      // For publication pages, we'll navigate to the beheer page with modal open
      // TODO: Handle outgoing relationship metadata in beheer page URL params
      if (metadata.isOutgoing) {
        // handle outgoing relationship metadata
      }
      navigate(`/beheer/${targetType}?showCreateModal=true&productId=${id}`);
    },
    [navigate, id]
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: data?.['@self']?.schema?.slug,
    currentType: data?.['@self']?.schema?.slug, // Use schema slug as current type
    openDynamicCreate,
    currentObject: data, // Pass current object for organization permission checks
    currentObjectRegister: 'voorzieningen', // Pass current object register (for publication pages)
    currentObjectSchema: data?.['@self']?.schema?.slug, // Pass current object schema
  });

  // Generate action menu items
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate action menu items
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
  }, [data?.['@self']?.schema?.slug, id, makeActionsForContext]);

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

  const pageContent = () => {
    if (loading.status || !data) return null;
    return (
      <AcFlex column spacing='xl'>
        <AcFlex justifyContent='end'>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={data?.['@self']?.schema?.slug}
            title={data['@self']?.name || data.id}
            published={data?.['@self']?.published}
            object={data}
            showViewAction={false}
            showEditAction={true}
            showPublishActions={true}
            uniqueActions={[
              {
                key: 'delete',
                label: 'Verwijderen',
                icon: VISUALS.TRASHCAN,
                onClick: handleDelete,
              },
            ]}
            relatedActions={actionMenuItems}
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
          />
        </AcFlex>

        <div className='con-product-details--header'>
          <AcFlex column spacing='xs'>
            <div className='con-beheer-details--header-container'>
              {(data?.logo || data?.['@self']?.image) && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={data?.logo || data?.['@self']?.image}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {data?.naam || data?.['@self']?.name || data.id}
              </Heading>
            </div>

            <Paragraph>
              {data?.beschrijvingKort || data?.['@self']?.summary || ''}
            </Paragraph>

            <Separator />

            {/* Short stats grid (2 columns x 3 rows) */}
            {(() => {
              const afnemersCount = Array.isArray(used) ? used.length : 0;

              // Prefer extended aanbieder, fallback to aanbiederNaam
              const leverancierNaam =
                data?.aanbieder?.naam || data?.aanbiederNaam || '-';
              const hostingLocatie = data?.hostingLocatie || '-';
              // TODO: If product status uses another key, adjust here
              const statusLabel =
                typeof data?.inGebruik === 'boolean'
                  ? data.inGebruik
                    ? 'In gebruik'
                    : 'Niet in gebruik'
                  : data?.status || '-'; // @TODO: Confirm correct key for status on product
              const hostingType =
                data?.cloudDienstverleningsmodel || data?.hostingType || '-'; // @TODO: Confirm if hostingType maps to cloudDienstverleningsmodel
              const dataOpslag = data?.hostingJurisdictie || '-';

              const items = [
                { label: 'Leverancier', value: leverancierNaam },
                { label: 'De applicatie wordt gehost in', value: hostingLocatie },
                { label: 'Status', value: statusLabel },
                { label: 'Hosting type', value: hostingType },
                { label: 'De data wordt opgeslagen in', value: dataOpslag },
                { label: 'Aantal afnemers', value: String(afnemersCount) },
              ];

              return (
                <div className='con-product-details--header-short-stats'>
                  {items.map((item) => (
                    <p
                      key={item.label}
                      className='con-product-details--header-short-stats-item'
                    >
                      <span>{item.label}:</span>
                      <span style={{ fontWeight: 600 }}>{item.value || '-'}</span>
                    </p>
                  ))}
                </div>
              );
            })()}
          </AcFlex>

          {data?.contactpersoon && (
            <>
              <Separator />

              <AcFlex column spacing='xs' alignItems='end'>
                <div className='ac-register-review__contact-image'>
                  {data?.contactpersoon?.image ? (
                    <ConLogoPreview
                      logoUrl={data.contactpersoon.image}
                      className='ac-register-review__contact-image--round'
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className='ac-register-review__contact-image--round'>
                      <VISUALS.USER_CIRCLE />
                    </div>
                  )}
                </div>

                {/* @TODO: contactpersoon has no logo / image, so its hard to show a contact persoon image */}
                <i>Contactinformatie:</i>
                {(() => {
                  // Glitch: sometimes an array with two objects is returned; use the first
                  const contact = Array.isArray(data.contactpersoon)
                    ? data.contactpersoon[0]
                    : data.contactpersoon;

                  if (contact && typeof contact === 'object') {
                    return (
                      <>
                        <p>
                          {[
                            contact.voornaam,
                            contact.tussenvoegsel,
                            contact.achternaam,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                        {contact['e-mailadres'] && (
                          <Link href={`mailto:${contact['e-mailadres']}`}>
                            {contact['e-mailadres']}
                          </Link>
                        )}
                        {contact.telefoonnummer && (
                          <Link
                            href={`tel:${String(contact.telefoonnummer)
                              .split('')
                              .filter((i) => i !== ' ')
                              .join('')}`}
                          >
                            {contact.telefoonnummer}
                          </Link>
                        )}
                        {contact.functie && <p>{contact.functie}</p>}
                      </>
                    );
                  }

                  // Only an ID present
                  return (
                    <>
                      {/* @TODO: Only an ID present. Consider extending 'contactpersoon' to show details. */}
                      <p>ID: {String(contact)}</p>
                    </>
                  );
                })()}
              </AcFlex>
            </>
          )}
        </div>

        <Separator />

        <AcFlex spacing='xl' className='con-product-details--content'>
          <AcColumn gap='tiger' className='con-product-details--content-main'>
            <MDEditor.Markdown
              wrapperElement={{
                'data-color-mode': 'light',
              }}
              source={(() => {
                // deserialize the beschrijvingLang
                if (!data.beschrijvingLang) return '';
                try {
                  return JSON.parse(data.beschrijvingLang) || '';
                } catch (e) {
                  return data.beschrijvingLang;
                }
              })()}
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
          </AcColumn>

          <Separator />

          {/* Side area next to editable descriptions with mock data */}
          <SuitableForList modules={data.modules} />
        </AcFlex>

        <DetailsPageTabs uses={uses} used={used} userStore={user} />
      </AcFlex>
    );
  };

  return (
    <AcContainer margin='xl'>
      {loading.status && <AcLoader />}
      {!loading.status && !data && <Heading>Er is een fout opgetreden</Heading>}
      {!loading.status && data && pageContent()}

      <AcGenericBeheerDeleteModal
        objects={data ? [data] : []}
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => navigate('/zoeken')}
      />
    </AcContainer>
  );
};

// separate component for tabs
// @TODO: make generic and use on all details pages
const DetailsPageTabs = observer(({ userStore, uses: usesData, used: usedData }) => {
  const user = userStore;
  const [tabIndex, setTabIndex] = useState(0);

  // Uses/Used unique schemas for tabs
  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel) return [];
    const uniq = _.uniqBy(rel, (item) => item['@self']?.schema?.id);
    return uniq
      .map((item) => item['@self']?.schema)
      .filter(Boolean)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, []);

  // Mark schemas that have duplicate titles between uses/used
  const filterWantedSchemas = useCallback((schemas) => {
    const wanted = new Set(['standaard', 'koppeling', 'dienst', 'module']);
    return (schemas || []).filter((s) => wanted.has(s.slug || s.id || s));
  }, []);

  const usesSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(usesData)),
    [usesData]
  );
  const usedSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(usedData)),
    [usedData]
  );

  const getUsesCount = useCallback(
    (schema) => {
      return usesData?.filter((r) => r['@self']?.schema?.id === schema.id).length;
    },
    [usesData]
  );
  const getUsedCount = useCallback(
    (schema) => {
      return usedData?.filter((r) => r['@self']?.schema?.id === schema.id).length;
    },
    [usedData]
  );

  if (!usesSchemas?.length && !usedSchemas?.length) return null;

  return (
    <div className='ac-beheer-details--tabs-container'>
      <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
        <AcTabList>
          {usesSchemas.length > 0 &&
            usesSchemas.map((schema, idx) => (
              <AcTab key={`uses-${schema.id}`} selected={tabIndex === idx + 1}>
                {schema.title || schema.id}{' '}
                {getUsesCount(schema) ? `(${getUsesCount(schema)})` : ''}
              </AcTab>
            ))}
          {usedSchemas.length > 0 &&
            usedSchemas.map((schema, idx) => (
              <AcTab
                key={`used-${schema.id}`}
                selected={tabIndex === idx + 1 + usesSchemas.length}
              >
                {schema.title || schema.id}{' '}
                {getUsedCount(schema) ? `(${getUsedCount(schema)})` : ''}
              </AcTab>
            ))}
        </AcTabList>
        {usesSchemas.length > 0 &&
          usesSchemas.map((schema, idx) => {
            const metadata = usesData?.find(
              (r) => r['@self']?.schema?.id === schema.id
            )?.['@self'];
            const rows = (usesData || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            );
            return (
              <AcTabPanel key={`uses-${schema.id}`} selected={tabIndex === idx + 1}>
                {metadata ? (
                  <BeheerTable
                    type={schema.slug}
                    metadata={metadata}
                    data={rows}
                    dataProperties={schema.properties}
                    user={user}
                    actionButtons={(config) =>
                      !!config.navigateView && {
                        id: 'actions',
                        label: 'Acties',
                        key: '',
                        customContent: (row) => (
                          <AcFlex column spacing='xs'>
                            <AcButton
                              style='buttonSlim'
                              buttonType='secondary'
                              onClick={() => config.navigateView(row.id)}
                            >
                              <VISUALS.EYE className='ac-button__icon' /> Bekijken
                            </AcButton>
                          </AcFlex>
                        ),
                      }
                    }
                    tableProps={{
                      renderSelectRowButtons: false,
                      truncateLines: 1,
                    }}
                  />
                ) : (
                  <Alert type='error'>
                    Er is een fout opgetreden bij het laden van deze gegevens.
                  </Alert>
                )}
              </AcTabPanel>
            );
          })}
        {usedSchemas.length > 0 &&
          usedSchemas.map((schema, idx) => {
            const metadata = usedData?.find(
              (r) => r['@self']?.schema?.id === schema.id
            )?.['@self'];
            const rows = (usedData || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            );
            return (
              <AcTabPanel
                key={`used-${schema.id}`}
                selected={tabIndex === idx + 1 + usesSchemas.length}
              >
                {metadata ? (
                  <BeheerTable
                    type={schema.slug}
                    metadata={metadata}
                    data={rows}
                    dataProperties={schema.properties}
                    user={user}
                    actionButtons={(config) =>
                      !!config.navigateView && {
                        id: 'actions',
                        label: 'Acties',
                        key: '',
                        customContent: (row) => (
                          <AcFlex column spacing='xs'>
                            <AcButton
                              style='buttonSlim'
                              buttonType='secondary'
                              onClick={() => config.navigateView(row.id)}
                            >
                              <VISUALS.EYE className='ac-button__icon' /> Bekijken
                            </AcButton>
                          </AcFlex>
                        ),
                      }
                    }
                    tableProps={{
                      renderSelectRowButtons: false,
                      truncateLines: 1,
                    }}
                  />
                ) : (
                  <Alert type='error'>
                    Er is een fout opgetreden bij het laden van deze gegevens.
                  </Alert>
                )}
              </AcTabPanel>
            );
          })}
      </AcTabs>
    </div>
  );
});

// Small helper components for the side area using mock data
const SuitableForList = ({ modules }) => {
  if (!modules) return null;

  // little patch so there is something to show
  // @TODO: remove this
  modules = modules.map((m) => (typeof m === 'string' ? { id: m, naam: m } : m));

  return (
    <AcFlex column spacing='sm' className='con-product-details--content-side'>
      <AcFlex spacing='sm'>
        <p style={{ fontWeight: 'bold' }}>Pakket geschikt voor:</p>
        <p style={{ fontWeight: 'bold' }}>Ingevuld door:</p>
      </AcFlex>
      <ul style={{ marginLeft: '1rem' }}>
        {modules.map((m) => (
          <li key={m.id}>{m.naam}</li>
        ))}
      </ul>
    </AcFlex>
  );
};

export default withStore(observer(AcPublicationProduct));
