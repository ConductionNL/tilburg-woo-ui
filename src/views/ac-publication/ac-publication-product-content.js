import { Heading, Paragraph } from '@amsterdam/design-system-react';
import { AcFlex, AcColumn, AcTabs, AcTabList, AcTab, AcTabPanel } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { Alert } from '@utrecht/component-library-react/dist/css-module';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import _ from 'lodash';
import { ConDetailsActionsMenu, ConUuidResolver } from '@src/components';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { withStore } from '@src/stores';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useResolvedArray } from '@src/utilities/con-resolve-uuids-in-text';
import ConEditableDescription from '../ac-beheer/shared/components/con-editable-description/con-editable-description';
import {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardGebruik,
  ConCardContactpersoon,
} from '@molecules/con-cards';
import { AcSearchResult } from '@molecules';
import { getImageFromPublication, getTabHeaderIcon, getTabHeaderName } from '@utils';

/**
 * Content for the product details page
 *
 * note:
 * Does not render the actions menu, this has to be done on the parent component.
 * Editing functionality is disabled by default, but can be enabled by setting canEdit to true.
 */
const AcPublicationProductContent = ({
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

          {user?.isLoggedIn && (
            <AcFlex column alignItems='end' spacing='sm' margin='sm'>
              <DetailsPageActionsMenu
                id={id}
                config={config}
                data={data}
                actionMenuProps={actionMenuProps}
              />
            </AcFlex>
          )}
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

      <DetailsPageTabs
        uses={uses}
        used={used}
        userStore={user}
        objectStore={object}
      />
    </AcFlex>
  );
};

// separate component for tabs
// @TODO: make generic and use on all details pages
// @TODO: give smart support for optional files tab (should be able to be disabled hard coded & via configuration)
const DetailsPageTabs = observer(
  ({ uses: usesData, used: usedData, objectStore }) => {
    const object = objectStore;
    const [tabIndexUses, setTabIndexUses] = useState(0);
    const [tabIndexUsed, setTabIndexUsed] = useState(0);

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
      <>
        <div>
          {usesSchemas && usesSchemas.length > 0 && (
            <>
              <Heading level={2}>Maakt gebruik van</Heading>
              <AcTabs
                selectedIndex={tabIndexUses}
                onSelect={(index) => setTabIndexUses(index)}
              >
                <AcTabList>
                  {usesSchemas.map((schema, idx) => {
                    const IconComponent = getTabHeaderIcon(schema.slug);
                    const count = getUsesCount(schema);
                    return (
                      <AcTab
                        key={schema?.['@self']?.id}
                        selected={tabIndexUses === idx}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <IconComponent /> {getTabHeaderName(schema.slug)} ({count})
                        </span>
                      </AcTab>
                    );
                  })}
                </AcTabList>

                {usesSchemas.map((schema, idx) => {
                  const itemsWithThisSchema = usesData.filter(
                    (r) =>
                      r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
                            }
                            updated={item['@self']?.updated}
                            published={item['@self']?.published}
                            category={item['@self']?.schema?.title}
                            themes={item.themes}
                          />
                        );
                      case 'gebruik':
                        return (
                          <ConCardGebruik
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
                            }
                            updated={item['@self']?.updated}
                            published={item['@self']?.published}
                            category={item['@self']?.schema?.title}
                            themes={item.themes}
                          />
                        );
                      case 'contactpersoon':
                        return (
                          <ConCardContactpersoon
                            key={item.id}
                            id={item.id}
                            firstName={item.voornaam}
                            middleName={item.tussenvoegsel}
                            lastName={item.achternaam}
                            functie={item.functie}
                            image={item['@self'].image}
                            email={item['e-mailadres']}
                            telefoon={item.telefoonnummer}
                            organisation={item.organisatie}
                            objectStore={object}
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
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
            </>
          )}
        </div>

        <div>
          {usedSchemas && usedSchemas.length > 0 && (
            <>
              <Heading level={2}>Wordt gebruikt door</Heading>
              <AcTabs
                selectedIndex={tabIndexUsed}
                onSelect={(index) => setTabIndexUsed(index)}
              >
                <AcTabList>
                  {usedSchemas.map((schema, idx) => {
                    const IconComponent = getTabHeaderIcon(schema.slug);
                    const count = getUsedCount(schema);
                    return (
                      <AcTab
                        key={schema?.['@self']?.id}
                        selected={tabIndexUsed === idx}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <IconComponent /> {getTabHeaderName(schema.slug)} ({count})
                        </span>
                      </AcTab>
                    );
                  })}
                </AcTabList>

                {usedSchemas.map((schema, idx) => {
                  const itemsWithThisSchema = usedData.filter(
                    (r) =>
                      r['@self']?.schema?.['@self']?.id === schema?.['@self']?.id
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
                            }
                            updated={item['@self']?.updated}
                            published={item['@self']?.published}
                            category={item['@self']?.schema?.title}
                            themes={item.themes}
                          />
                        );
                      case 'gebruik':
                        return (
                          <ConCardGebruik
                            key={item.id}
                            id={item.id}
                            product={item.product}
                            module={item.module}
                            organisation={item['@self'].organisation}
                            referentieComponenten={
                              item.gebruiktVoorReferentiecomponenten
                            }
                            status={item.status}
                            objectStore={object}
                          />
                        );
                      case 'contactpersoon':
                        return (
                          <ConCardContactpersoon
                            key={item.id}
                            id={item.id}
                            firstName={item.voornaam}
                            middleName={item.tussenvoegsel}
                            lastName={item.achternaam}
                            functie={item.functie}
                            image={item['@self'].image}
                            email={item['e-mailadres']}
                            telefoon={item.telefoonnummer}
                            organisation={item.organisatie}
                            objectStore={object}
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
                              item.beschrijving ?? item.beschrijvingKort ?? ''
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
            </>
          )}
        </div>
      </>
    );
  }
);

const DetailsPageActionsMenu = withStore(
  observer(({ store, id, data, actionMenuProps = {} }) => {
    const navigate = useNavigate();

    const { handleDelete } = actionMenuProps;

    const { user, object } = store;

    const [actionMenuItems, setActionMenuItems] = useState([]);

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

    useEffect(() => {
      if (!data?.['@self']?.schema?.slug || !id) return;

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

    return (
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
          const schemaSlug = data?.['@self']?.schema?.slug;
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

export default AcPublicationProductContent;
