import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConUuidResolver } from '@components';
import { AcTable } from '@molecules';
import { withStore } from '@stores';
import { LABELS, VISUALS } from '@constants';
import { Pagination } from '@amsterdam/design-system-react';
import { sortPropertiesByOrder } from '@src/utilities';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import {
  resolveUUIDsInText,
  resolveUUIDsInArray,
  resolveUUIDsInObject,
} from '@src/utilities/con-resolve-uuids-in-text';

import _ from 'lodash';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '../ac-register/con-logo-preview';
import { canReadField } from '@utils/field-authorization';
import { TOOLTIP_ID } from '@src/index.web';
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

const AcPublication = ({ store: { publications, object, user }, schema }) => {
  const { id } = useParams();
  const {
    get_single,
    loading,
    attachmentPagination,
    setAttachmentsPage,
    getFilteredAttachments,
    attachments,
  } = publications;

  // Names cache for UUID resolution
  const namesMap = useMemo(() => {
    const map = {};
    Object.entries(object.namesCache || {}).forEach(([id, cacheEntry]) => {
      if (cacheEntry.name) {
        map[id] = cacheEntry.name;
      }
    });
    return map;
  }, [object?.namesCache]);

  // Component renderer that resolves UUIDs in strings, arrays, and objects before formatting
  const UuidFormattedValue = ({ schema, data, fieldKey, options }) => {
    const rawValue = fieldKey != null ? data[fieldKey] : data;
    const [resolvedValue, setResolvedValue] = useState(rawValue);

    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        try {
          let next = rawValue;
          if (typeof rawValue === 'string') {
            next = await resolveUUIDsInText(rawValue, object);
          } else if (Array.isArray(rawValue)) {
            const allStrings = rawValue.every((v) => typeof v === 'string');
            if (allStrings) {
              next = await resolveUUIDsInArray(rawValue, object);
            } else {
              const items = await Promise.all(
                rawValue.map(async (item) => {
                  if (typeof item === 'string') {
                    return resolveUUIDsInText(item, object);
                  }
                  if (Array.isArray(item) || (typeof item === 'object' && item)) {
                    return resolveUUIDsInObject(item, object);
                  }
                  return item;
                })
              );
              next = items;
            }
          } else if (typeof rawValue === 'object' && rawValue !== null) {
            next = await resolveUUIDsInObject(rawValue, object);
          }
          if (!cancelled) setResolvedValue(next);
        } catch (e) {
          if (!cancelled) setResolvedValue(rawValue);
        }
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [rawValue, object]);

    const renderData =
      fieldKey != null ? { ...data, [fieldKey]: resolvedValue } : resolvedValue;
    return formatBySchema(schema, renderData, fieldKey, options);
  };

  // Helper that returns a component so we can use hooks safely inside
  const formatWithUuidResolution = (schema, data, key, options) => (
    <UuidFormattedValue
      schema={schema}
      data={data}
      fieldKey={key}
      options={options}
    />
  );

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
  const [tabIndexUses, setTabIndexUses] = useState(0);
  const [tabIndexUsed, setTabIndexUsed] = useState(0);
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

  const configuredMetaFields = useMemo(() => {
    // Get configuration from the actual object's schema, not the schema parameter
    const cfg = get_single?.['@self']?.schema?.configuration;
    const fields = [
      cfg?.objectDescriptionField,
      cfg?.objectImageField,
      cfg?.objectNameField,
      cfg?.objectSummaryField,
    ].filter(Boolean);

    return fields;
  }, [get_single?.['@self']?.schema?.configuration]);

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
      <AcContainer compact margin='xl' className='ac-publication-container'>
        <AcFlex column spacing={'lg'}>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
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

          <div className='ac-beheer-details--grid'>
            {Object.entries(
              sortPropertiesByOrder(get_single?.['@self']?.schema?.properties)
            )
              .filter(
                ([key]) => !schema?.configuration?.excludedProperties?.includes(key)
              )
              .filter(([key]) => !configuredMetaFields.includes(key))
              // eslint-disable-next-line no-unused-vars
              .filter(([_, fieldSchema]) =>
                user?.isAuthenticated ? canReadField(user, fieldSchema) : true
              )
              .map(([key, schema]) => {
                // Check if this property should be displayed inline
                const isInline =
                  schema?.configuration?.formatBySchemaOptions?.profile?.[key]
                    ?.inline;

                if (isInline) {
                  // Inline rendering: label and value on same line
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                      }}
                    >
                      <strong
                        {...(schema?.description
                          ? {
                              'data-tooltip-id': TOOLTIP_ID,
                              'data-tooltip-content': schema.description,
                            }
                          : {})}
                      >
                        {_.startCase(key)}:
                      </strong>
                      {formatWithUuidResolution(schema, get_single, key, {
                        ...(schema?.configuration?.formatBySchemaOptions || {}),
                        objectStore: object,
                        namesMap,
                        // Add the missing includeUnknown option that the beheer page has
                        includeUnknown: true,
                      })}
                    </div>
                  );
                } else {
                  // Default block rendering: label above value
                  return (
                    <div key={key}>
                      <strong
                        {...(schema?.description
                          ? {
                              'data-tooltip-id': TOOLTIP_ID,
                              'data-tooltip-content': schema.description,
                            }
                          : {})}
                      >
                        {_.startCase(key)}:
                      </strong>{' '}
                      {formatWithUuidResolution(schema, get_single, key, {
                        ...(schema?.configuration?.formatBySchemaOptions || {}),
                        objectStore: object,
                        namesMap,
                        // Add the missing includeUnknown option that the beheer page has
                        includeUnknown: true,
                      })}
                    </div>
                  );
                }
              })}
          </div>

          {/* Show only when there are primary attachments */}
          {getFilteredAttachments(true)?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
              <AcFlex spacing={'xs'} className='notice'>
                <VISUALS.INFO />
                Documenten worden in een nieuw tabblad geopend.
              </AcFlex>
              <AcTable
                header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
                rows={getFilteredAttachments(true)?.map((attachment) =>
                  AcMappedAttachmentRow(attachment, true)
                )}
              />
            </div>
          )}

          {/* Show only if there are secondary attachments */}
          {getFilteredAttachments()?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>
              <AcFlex spacing={'md'} column>
                <AcTable
                  header={[LABELS.DOCUMENT]}
                  rows={getFilteredAttachments(
                    false,
                    attachmentPagination.page
                  )?.map((attachment) => AcMappedAttachmentRow(attachment))}
                />
                {getFilteredAttachments()?.length > attachmentPagination.perPage && (
                  <Pagination
                    totalPages={getFilteredAttachments().length}
                    page={1}
                    nextLabel=''
                    previousLabel=''
                    onPageChange={(page) => setAttachmentsPage(page)}
                  />
                )}
              </AcFlex>
            </div>
          )}

          <div>
            {uses && uses.length > 0 && (
              <>
                <Heading level={2}>Maakt gebruik van</Heading>
                <AcTabs
                  selectedIndex={tabIndexUses}
                  onSelect={(index) => setTabIndexUses(index)}
                >
                  <AcTabList>
                    {uses && uses.length > 0 && (
                      <>
                        {uses &&
                          // show unique headers
                          _.uniqBy(uses, (use) => use['@self'].schema.id).map(
                            (use, idx) => (
                              <AcTab
                                key={use['@self'].schema.id}
                                selected={tabIndexUses === idx}
                              >
                                <span>{use['@self'].schema.title}</span>
                              </AcTab>
                            )
                          )}
                      </>
                    )}
                  </AcTabList>

                  {uses &&
                    _.uniqBy(uses, (use) => use['@self'].schema.id)
                      .map((use) => use['@self'])
                      .map((metadata, idx) => {
                        // 1. Set the headers
                        const tabHeaders = ['Naam', 'Beschrijving'];

                        // 2. Build the rows for ALL items with this schema
                        const itemsWithThisSchema = uses.filter(
                          (u) => u['@self'].schema.id === metadata.schema.id
                        );

                        // 3. Each row: [Naam, Beschrijving]
                        const tabRows = itemsWithThisSchema.map((item) => [
                          // Naam: resolve UUIDs explicitly
                          <ConUuidResolver key={`uses-name-${item.id}`}>
                            {String(
                              item.title ??
                                item.titel ??
                                item.name ??
                                item.naam ??
                                item.id
                            )}
                          </ConUuidResolver>,
                          // Description: use formatBySchema with a basic string schema
                          formatBySchema(
                            { type: 'string' },
                            { value: item.beschrijving ?? '' },
                            'value',
                            {
                              objectStore: object,
                              namesMap,
                            }
                          ),
                          <button
                            key={item.id}
                            className='utrecht-button slim'
                            // variant='secondary'
                            onClick={() => {
                              window.location.href = `/publicatie/${item.id}`;
                            }}
                          >
                            <VISUALS.EYE className='ac-button__icon' /> Bekijken
                          </button>,
                        ]);

                        // 4. Render the table
                        return (
                          <AcTabPanel key={idx} selected={tabIndexUses === idx}>
                            <AcTable header={tabHeaders} rows={tabRows} />
                          </AcTabPanel>
                        );
                      })}
                </AcTabs>
              </>
            )}
          </div>

          <div>
            {used && used.length > 0 && (
              <>
                <Heading level={2}>Wordt gebruikt door</Heading>
                <AcTabs
                  selectedIndex={tabIndexUsed}
                  onSelect={(index) => setTabIndexUsed(index)}
                >
                  <AcTabList>
                    {used && used.length > 0 && (
                      <>
                        {used &&
                          // show unique headers
                          _.uniqBy(used, (use) => use['@self'].schema.id).map(
                            (use, idx) => (
                              <AcTab
                                key={use['@self'].schema.id}
                                selected={tabIndexUsed === idx}
                              >
                                <span>{use['@self'].schema.title}</span>
                              </AcTab>
                            )
                          )}
                      </>
                    )}
                  </AcTabList>

                  {used &&
                    _.uniqBy(used, (use) => use['@self'].schema.id)
                      .map((use) => use['@self'])
                      .map((metadata, idx) => {
                        // 1. Set the headers
                        const tabHeaders = ['Naam', 'Beschrijving'];

                        // 2. Build the rows for ALL items with this schema
                        const itemsWithThisSchema = used.filter(
                          (u) => u['@self'].schema.id === metadata.schema.id
                        );

                        // 3. Each row: [Naam, Beschrijving] (second occurrence)
                        const tabRows = itemsWithThisSchema.map((item) => [
                          // Naam: resolve UUIDs explicitly
                          <ConUuidResolver key={`used-name-${item.id}`}>
                            {String(
                              item.title ??
                                item.titel ??
                                item.name ??
                                item.naam ??
                                item.id
                            )}
                          </ConUuidResolver>,
                          // Description: use formatBySchema with a basic string schema
                          formatBySchema(
                            { type: 'string' },
                            { value: item.beschrijving ?? '' },
                            'value',
                            {
                              objectStore: object,
                              namesMap,
                            }
                          ),
                          <button
                            key={item.id}
                            className='utrecht-button slim'
                            // variant='secondary'
                            onClick={() => {
                              window.location.href = `/publicatie/${item.id}`;
                            }}
                          >
                            <VISUALS.EYE className='ac-button__icon' /> Bekijken
                          </button>,
                        ]);

                        // 4. Render the table
                        return (
                          <AcTabPanel key={idx} selected={tabIndexUsed === idx}>
                            <AcTable header={tabHeaders} rows={tabRows} />
                          </AcTabPanel>
                        );
                      })}
                </AcTabs>
              </>
            )}
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

export default withStore(observer(AcPublication));
