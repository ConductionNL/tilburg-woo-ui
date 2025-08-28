import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { AcTable, AcLink } from '@molecules';
import { withStore } from '@stores';
import { LABELS, VISUALS } from '@constants';
import { Pagination } from '@amsterdam/design-system-react';
import { sortPropertiesByOrder } from '@src/utilities';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import formatBySchema from '@src/utilities/con-format-by-json-schema';

import _ from 'lodash';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '../ac-register/con-logo-preview';
import { canReadField } from '@utils/field-authorization';
import { TOOLTIP_ID } from '@src/index.web';

// Markdown Editor
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';

const getValueField = (key, value) => {
  if (!value) return <div>-</div>;

  const strValue = String(value);

  if (strValue.includes('https://')) {
    if (strValue.length > 50) {
      return (
        <AcLink to={strValue} target='_blank'>
          <span className='ellipsis-cell' title={strValue}>
            {strValue}
          </span>
          <span className='sr-only'>Opent in een nieuw tabblad</span>
          <VISUALS.EXTERNAL_LINK_PINK />
        </AcLink>
      );
    }
    return (
      <AcLink to={strValue} target='_blank'>
        {strValue}
        <span className='sr-only'>Opent in een nieuw tabblad</span>
        <VISUALS.EXTERNAL_LINK_PINK />
      </AcLink>
    );
  }

  if (key === 'logo') {
    return (
      <ConLogoPreview className='ac-publication-logo-container' logoUrl={strValue} />
    );
  }

  if (/\\[bfnrt"\\]/.test(strValue)) {
    const formattedValue = strValue
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    if (formattedValue.length > 50) {
      return (
        <span
          className='ellipsis-cell'
          title={formattedValue}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {formattedValue}
        </span>
      );
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{formattedValue}</span>;
  }

  // Only ellipsis for values longer than 50 characters
  if (strValue.length > 50) {
    return (
      <span className='ellipsis-cell' title={strValue}>
        {strValue}
      </span>
    );
  }

  return <span>{strValue}</span>;
};

const AcPublication = observer(
  ({ store: { publications, object, user }, schema }) => {
    const { id } = useParams();
    const {
      get_single,
      loading,
      attachmentPagination,
      setAttachmentsPage,
      getFilteredAttachments,
      attachments,
    } = publications;

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

    useEffect(() => {
      if (!get_single?.['@self']?.schema?.slug || !id) return;

      const items = makeActionsForContext(id).map(({ key, label, onClick }) => ({
        key,
        label,
        onClick,
        icon: <VISUALS.PLUS />,
      }));

      setActionMenuItems(items);
    }, [get_single?.['@self']?.schema?.slug, id, makeActionsForContext]);

    // Table
    // TODO: this just needs a code fix, headers and rows is not being used
    // eslint-disable-next-line no-unused-vars
    const [headers, setHeaders] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [rows, setRows] = useState([]);

    const getFilteredData = (data) => {
      const checkIfVisible = (property) => {
        return data['@self']?.schema?.properties?.[property]?.visible !== false;
      };

      const excludeKeys = [
        '@self',
        'title',
        'titel',
        'name',
        'naam',
        'id',
        ...Object.keys(data['@self']?.schema?.properties || {}).filter(
          (key) => !checkIfVisible(key)
        ),
      ];

      // It is possible to enricht the data with custom properties. This is not used for now.
      // const enrichedData = {
      //   publicatieDatum: data['@self']?.published,
      //   categorie: data['@self']?.schema?.title,
      //   ...data,
      // };

      return Object.entries(data)
        .filter(([key, value]) => {
          if (excludeKeys.includes(key)) return false;
          if (typeof value === 'object') return false;
          return true;
        })
        .sort((a, b) => {
          const orderA = data['@self']?.schema?.properties?.[a[0]]?.order;
          const orderB = data['@self']?.schema?.properties?.[b[0]]?.order;

          // If both have valid non-zero orders, sort normally
          if (orderA && orderB && orderA !== 0 && orderB !== 0) {
            return orderA - orderB;
          }

          // If orderA is valid and non-zero, it comes first
          if (orderA && orderA !== 0) return -1;
          // If orderB is valid and non-zero, it comes first
          if (orderB && orderB !== 0) return 1;

          // If orderA is 0 and orderB is null/undefined, orderA comes first
          if (orderA === 0 && !orderB) return -1;
          // If orderB is 0 and orderA is null/undefined, orderB comes first
          if (orderB === 0 && !orderA) return 1;

          // If both are 0 or both are null/undefined, maintain original order
          return 0;
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    };

    const getFilterdRows = (data) => {
      return Object.entries(data).map(([key, value]) => [
        <strong key={key}>{_.upperFirst(key)}</strong>,
        <>{getValueField(key, value)}</>,
      ]);
    };

    useEffect(() => {
      setHeaders(['Titel', 'Waarde']);
      setRows(getFilterdRows(getFilteredData(get_single)));
    }, [get_single]);

    // Tabs
    const [tabIndexUses, setTabIndexUses] = useState(0);
    const [tabIndexUsed, setTabIndexUsed] = useState(0);
    const [uses, setUses] = useState([]);
    const [used, setUsed] = useState([]);
    // TODO: this just needs a code fix, usesLoading and usedLoading is not being used
    // eslint-disable-next-line no-unused-vars
    const [usesLoading, setUsesLoading] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [usedLoading, setUsedLoading] = useState(false);

    const fetchUses = async () => {
      setUsesLoading(true);

      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching uses:', response.statusText);
        setUsesLoading(false);
        return;
      }
      const data = await response.json();

      setUses(data.results);
      setUsesLoading(false);
    };
    const fetchUsed = async () => {
      setUsedLoading(true);

      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching used:', response.statusText);
        setUsedLoading(false);
        return;
      }
      const data = await response.json();

      setUsed(data.results);
      setUsedLoading(false);
    };

    const configuredMetaFields = useMemo(() => {
      const cfg = schema?.configuration;
      return [
        cfg?.objectDescriptionField,
        cfg?.objectImageField,
        cfg?.objectNameField,
        cfg?.objectSummaryField,
      ].filter(Boolean);
    }, [schema]);

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
        <AcContainer compact margin='xl'>
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
                uniqueActions={[
                  {
                    key: 'delete',
                    label: 'Verwijderen',
                    icon: VISUALS.TRASHCAN,
                    onClick: () => {
                      // TODO: Implement delete modal for publications
                    },
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
                  ([key]) =>
                    !schema?.configuration?.excludedProperties?.includes(key)
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
                        {formatBySchema(
                          schema,
                          get_single,
                          key,
                          schema?.configuration?.formatBySchemaOptions || {}
                        )}
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
                        {formatBySchema(
                          schema,
                          get_single,
                          key,
                          schema?.configuration?.formatBySchemaOptions || {}
                        )}
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
                  {getFilteredAttachments()?.length >
                    attachmentPagination.perPage && (
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
                  <Heading level={2}>Gebruiken</Heading>
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
                                <AcTab key={use['@self'].schema.id} selected={tabIndexUses === idx}>
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
                            // Naam: fallback order
                            getValueField(
                              'naam',
                              item.title ??
                                item.titel ??
                                item.name ??
                                item.naam ??
                                item.id
                            ),
                            // Description: use 'beschrijving' or fallback to empty string
                            getValueField('beschrijving', item.beschrijving ?? ''),
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
                                <AcTab key={use['@self'].schema.id} selected={tabIndexUsed === idx}>
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

                          // 3. Each row: [Naam, Beschrijving]
                          const tabRows = itemsWithThisSchema.map((item) => [
                            // Naam: fallback order
                            getValueField(
                              'naam',
                              item.title ??
                                item.titel ??
                                item.name ??
                                item.naam ??
                                item.id
                            ),
                            // Description: use 'beschrijving' or fallback to empty string
                            getValueField('beschrijving', item.beschrijving ?? ''),
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
        </AcContainer>
      </>
    );
  }
);

export default withStore(AcPublication);
