import { Heading, Paragraph } from '@amsterdam/design-system-react';
import { AcFlex, AcColumn, AcTabs, AcTabList, AcTab, AcTabPanel } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { Alert } from '@utrecht/component-library-react/dist/css-module';
import { Link, useNavigate } from 'react-router-dom';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { AcButton } from '@src/molecules';
import { commongroundApiUrl } from '@src/config';
import _ from 'lodash';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import { ConDetailsActionsMenu } from '@src/components';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { withStore } from '@src/stores';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useResolvedArray } from '@src/utilities/con-resolve-uuids-in-text';

/**
 * Content for the product details page
 *
 * note:
 * Does not render the actions menu, this has to be done on the parent component.
 * Editing functionality is disabled by default, but can be enabled by setting canEdit to true.
 */
const ConProductDetailsPageContent = ({
  loading,
  config,
  data,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
}) => {
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

  const contact = Array.isArray(data.contactpersoon)
    ? data.contactpersoon[0]
    : data.contactpersoon;

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, []);

  if (loading || !data) return null;

  return (
    <AcFlex column spacing='xl'>
      <AcFlex column spacing='sm'>
        <div className='con-product-details--header'>
          <div className='con-product-details--header--content'>
            <Heading level={4}>
              <div className='con-beheer-details--header-container'>
                {(data?.logo || data?.['@self']?.image) && (
                  <ConLogoPreview
                    className='con-beheer-details--logo-container'
                    logoUrl={data?.logo || data?.['@self']?.image}
                  />
                )}

                <Heading className='con-beheer-details--title'>
                  {data?.naam || data?.['@self']?.name || data?.['@self']?.id}
                </Heading>
              </div>
            </Heading>

            <UnpublishedWarning data={data} />
          </div>

          <div>
            <AcFlex column alignItems='end' spacing='sm' margin='sm'>
              <DetailsPageActionsMenu
                id={id}
                config={config}
                data={data}
                actionMenuProps={actionMenuProps}
              />
            </AcFlex>
          </div>
        </div>

        <div className='con-product-details--content'>
          <AcColumn gap='tiger' className='con-product-details--content-main'>
            <ConEditableDescription
              registerSlug={data['@self'].register.slug}
              schemaSlug={data['@self'].schema.slug}
              objectId={data?.['@self']?.id}
              field='beschrijvingKort'
              label='Korte beschrijving'
              placeholder='Een korte beschrijving van de product'
              tooltip='Een korte beschrijving van de product'
              maxLength={255}
              isMarkdown={false}
              value={data.beschrijvingKort}
              serialize={(v) => v}
              deserialize={(v) => v || ''}
              canEdit={canEdit}
            />

            <ConEditableDescription
              registerSlug={data['@self'].register.slug}
              schemaSlug={data['@self'].schema.slug}
              objectId={data?.['@self']?.id}
              field='beschrijvingLang'
              label='Lange beschrijving'
              placeholder='Een uitgebreide beschrijving van de product'
              tooltip='Een uitgebreide beschrijving van de product'
              maxLength={2000}
              isMarkdown={true}
              value={data.beschrijvingLang}
              serialize={(v) => JSON.stringify(v || '')}
              deserialize={(v) => {
                if (!v) return '';
                try {
                  return JSON.parse(v) || '';
                } catch (e) {
                  return v;
                }
              }}
              canEdit={canEdit}
            />
          </AcColumn>

          <AcFlex column spacing='sm' className='con-product-details--side-content'>
            {((contact && typeof contact === 'object') || data?.website) && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                {data?.website && (
                  <div>
                    <b>Website:</b>
                    <Link
                      href={`${
                        data?.website.startsWith('http')
                          ? data?.website
                          : `https://${data?.website}`
                      }`}
                    >
                      {data?.website}
                    </Link>
                  </div>
                )}
                {contact && typeof contact === 'object' && (
                  <AcFlex column spacing='xs'>
                    <b>Contactpersoon:</b>
                    <p>
                      {[contact.voornaam, contact.tussenvoegsel, contact.achternaam]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                    <div>
                      {contact['e-mailadres'] && (
                        <Link href={`mailto:${contact['e-mailadres']}`}>
                          {contact['e-mailadres']}
                        </Link>
                      )}
                    </div>
                    <div>
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
                    </div>
                  </AcFlex>
                )}
              </AcFlex>
            )}

            <SuitableForList
              modules={data.modules}
              objectStore={object}
              className='con-product-details--content-side'
            />
          </AcFlex>
        </div>
      </AcFlex>

      <DetailsPageTabs uses={uses} used={used} userStore={user} />
    </AcFlex>
  );
};

// separate component for tabs
// @TODO: make generic and use on all details pages
// @TODO: give smart support for optional files tab (should be able to be disabled hard coded & via configuration)
const DetailsPageTabs = observer(({ userStore, uses: usesData, used: usedData }) => {
  const user = userStore;
  const [tabIndex, setTabIndex] = useState(0);

  // Uses/Used unique schemas for tabs
  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel) return [];
    const uniq = _.uniqBy(rel, (item) => item['@self']?.schema?.['@self']?.id);
    return uniq
      .map((item) => item['@self']?.schema)
      .filter(Boolean)
      .sort((a, b) =>
        String(a?.['@self']?.id).localeCompare(String(b?.['@self']?.id))
      );
  }, []);

  const usesSchemas = useMemo(() => uniqueSchemasFrom(usesData), [usesData]);
  const usedSchemas = useMemo(() => uniqueSchemasFrom(usedData), [usedData]);

  const getUsesCount = useCallback(
    (schema) => {
      return usesData?.filter(
        (r) => r['@self']?.schema?.id === schema?.['@self']?.id
      ).length;
    },
    [usesData]
  );
  const getUsedCount = useCallback(
    (schema) => {
      return usedData?.filter(
        (r) => r['@self']?.schema?.id === schema?.['@self']?.id
      ).length;
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
              <AcTab
                key={`uses-${schema?.['@self']?.id}`}
                selected={tabIndex === idx + 1}
              >
                {schema.title || schema?.['@self']?.id}{' '}
                {getUsesCount(schema) ? `(${getUsesCount(schema)})` : ''}
              </AcTab>
            ))}
          {usedSchemas.length > 0 &&
            usedSchemas.map((schema, idx) => (
              <AcTab
                key={`used-${schema?.['@self']?.id}`}
                selected={tabIndex === idx + 1 + usesSchemas.length}
              >
                {schema.title || schema?.['@self']?.id}{' '}
                {getUsedCount(schema) ? `(${getUsedCount(schema)})` : ''}
              </AcTab>
            ))}
        </AcTabList>
        {usesSchemas.length > 0 &&
          usesSchemas.map((schema, idx) => {
            const metadata = usesData?.find(
              (r) => r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
            )?.['@self'];
            const rows = (usesData || []).filter(
              (r) => r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
            );
            return (
              <AcTabPanel
                key={`uses-${schema?.['@self']?.id}`}
                selected={tabIndex === idx + 1}
              >
                {metadata ? (
                  <BeheerTable
                    type={schema.slug}
                    metadata={metadata}
                    data={rows}
                    dataProperties={schema.properties}
                    headers={[{ id: 'naam', label: 'Naam', key: 'naam' }]}
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
                              onClick={() => config.navigateView(row['@self'].id)}
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
              (r) => r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
            )?.['@self'];
            const rows = (usedData || []).filter(
              (r) => r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
            );
            return (
              <AcTabPanel
                key={`used-${schema?.['@self']?.id}`}
                selected={tabIndex === idx + 1 + usesSchemas.length}
              >
                {metadata ? (
                  <BeheerTable
                    type={schema.slug}
                    metadata={metadata}
                    data={rows}
                    dataProperties={schema.properties}
                    headers={[{ id: 'naam', label: 'Naam', key: 'naam' }]}
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
                              onClick={() => config.navigateView(row?.['@self']?.id)}
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

const DetailsPageActionsMenu = withStore(
  observer(({ store, id, data, config, actionMenuProps = {} }) => {
    const navigate = useNavigate();

    const {
      setDynamicCreateTargetType,
      setDynamicCreatePreSelected,
      setDynamicCreateMetadata,
      setOpenModal,
    } = actionMenuProps;

    const { user, object } = store;

    const [actionMenuItems, setActionMenuItems] = useState([]);

    const openDynamicCreate = useCallback(
      (targetType, preSelected, metadata = {}) => {
        setDynamicCreateTargetType(targetType);
        setDynamicCreatePreSelected(preSelected);
        // Store metadata for outgoing relationship handling and optimization
        // Store all metadata for the modal to use
        setDynamicCreateMetadata(metadata);
        setOpenModal('dynamicCreate');
      },
      []
    );

    const { makeActionsForContext } = useRelatedCreateActions({
      object,
      user,
      schemaRef: config?.schemaSlug,
      currentType: config?.schemaSlug,
      openDynamicCreate,
      currentObject: data, // Pass current object for organization permission checks
      currentObjectRegister: config?.registerSlug, // Pass current object register
      currentObjectSchema: config?.schemaSlug, // Pass current object schema
    });

    useEffect(() => {
      if (!config?.schemaSlug || !data?.id) return;
      const items = makeActionsForContext(data.id).map(
        ({ key, label, onClick, schema, icon }) => ({
          key,
          label,
          onClick,
          schema,
          icon,
        })
      );
      setActionMenuItems(items);
    }, [config?.schemaSlug, data?.id, makeActionsForContext]);

    return (
      <ConDetailsActionsMenu
        user={user}
        id={id}
        schemaSlug={config?.schemaSlug}
        title={data['@self']?.name || data.id}
        published={data?.['@self']?.published}
        object={data}
        showViewAction={false}
        showEditAction={true}
        showPublishActions={true}
        uniqueActions={[
          ...(config?.uniqueActions
            ?.filter((action) => action.condition?.(data))
            .map((action) => ({
              key: action.key,
              label: action.label,
              icon: action.icon,
              onClick: () =>
                typeof action.onClick === 'function'
                  ? action.onClick(data)
                  : setOpenModal(action.action),
            })) || []),
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: VISUALS.TRASHCAN,
            onClick: () => setOpenModal('delete'),
          },
        ]}
        relatedActions={actionMenuItems}
        onEdit={() => {
          // Prefer wizard editing when available; fallback to legacy modal
          if (config?.schemaSlug) {
            const wizards = Object.values(DASHBOARD_WIZARDS);
            const wizard = wizards.find((w) => w.schema === config.schemaSlug);
            if (wizard) {
              const baseUrl = getWizardUrl(wizard);
              const url = new URL(baseUrl, window.location.origin);
              url.searchParams.set('id', data?.id);
              navigate(url.pathname + url.search);
              return;
            }
          }
          setOpenModal('edit');
        }}
        onPublish={() => setOpenModal('publish')}
        onDepublish={() => setOpenModal('depublish')}
      />
    );
  })
);

// Small helper components for the side area using mock data
const SuitableForList = ({ modules, objectStore }) => {
  const [tabIndex, setTabIndex] = useState(0);

  // Combine all referentieComponenten into a unique array
  const allReferentieComponenten = useMemo(() => {
    if (!modules?.length) return [];
    return [
      ...new Set(modules.flatMap((module) => module.referentieComponenten || [])),
    ];
  }, [modules]);

  const resolvedReferentieComponenten = useResolvedArray(
    allReferentieComponenten,
    objectStore
  );

  return (
    <div className='con-product-details--side-content-tabs'>
      <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
        <AcTabList>
          <AcTab selected={tabIndex === 0}>Geschikt voor:</AcTab>
          <AcTab selected={tabIndex === 1}>Ingevuld door:</AcTab>
        </AcTabList>
        <AcTabPanel selected={tabIndex === 0}>
          {resolvedReferentieComponenten.map((id, idx) => (
            <p key={idx}>{id}</p>
          ))}
        </AcTabPanel>
        <AcTabPanel selected={tabIndex === 1}></AcTabPanel>
      </AcTabs>
    </div>
  );
};

/* Warning card for unpublished objects */
const UnpublishedWarning = ({ data }) => {
  if (data?.['@self']?.published) return null;
  const schemaName = data?.['@self']?.schema?.title;
  const title = schemaName ? `${schemaName}` : '';
  const objectName = data?.['@self']?.name;

  return (
    <Alert type='warning'>
      <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
      <Paragraph>
        {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
        {schemaName || 'de catalogus'}. Gebruik de &quot;Publiceren&quot; actie om
        deze gegevens beschikbaar te maken voor bezoekers.
      </Paragraph>
    </Alert>
  );
};

export default ConProductDetailsPageContent;
