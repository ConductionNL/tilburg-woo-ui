import { Heading, Paragraph } from '@amsterdam/design-system-react';
import { AcFlex, AcColumn, AcTabs, AcTabList, AcTab, AcTabPanel } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { Alert, Separator } from '@utrecht/component-library-react/dist/css-module';
import { Link } from 'react-router-dom';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { AcButton } from '@src/molecules';
import { commongroundApiUrl } from '@src/config';
import _ from 'lodash';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';

/**
 * Content for the product details page
 *
 * note:
 * Does not render the actions menu, this has to be done on the parent component.
 * Editing functionality is disabled by default, but can be enabled by setting canEdit to true.
 */
const ConProductDetailsPageContent = ({
  loading,
  data,
  userStore: user,
  id,
  canEdit = false,
}) => {
  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [contactImageFit, setContactImageFit] = useState('cover');

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

  // Detect if contact image looks already round (square with transparent corners)
  const handleContactImageLoad = useCallback((e) => {
    try {
      const img = e?.target;
      if (!img) return;
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Default behavior: crop to center
      let nextFit = 'cover';

      // If not square, we crop to circle center
      if (width !== height) {
        setContactImageFit(nextFit);
        return;
      }

      // Try to inspect corner transparency to guess if already circular
      // This may fail on cross-origin images; fall back to 'cover'.
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setContactImageFit(nextFit);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ];
      let transparentCorners = 0;
      for (const [x, y] of corners) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        if (data[3] < 10) transparentCorners += 1; // alpha channel near 0
      }
      if (transparentCorners >= 3) {
        nextFit = 'contain';
      }
      setContactImageFit(nextFit);
    } catch (err) {
      // Likely CORS taint; keep default cropping behavior
      setContactImageFit('cover');
    }
  }, []);

  const contact = Array.isArray(data.contactpersoon)
    ? data.contactpersoon[0]
    : data.contactpersoon;

  const aanbieder = Array.isArray(data?.aanbieder)
    ? data?.aanbieder[0]
    : data?.aanbieder;

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, []);

  if (loading || !data) return null;

  return (
    <AcFlex column spacing='xl'>
      <UnpublishedWarning data={data} />

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
          <div className='con-product-details--header--description'>
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
          </div>
          <Separator />

          {/* Short stats grid (2 columns x 3 rows) */}
          {(() => {
            // Prefer extended aanbieder, fallback to aanbiederNaam
            const leverancierNaam = data?.aanbieder
              ? Array.isArray(data?.aanbieder)
                ? data?.aanbieder[0]?.naam || data?.aanbieder[0]?.id
                : typeof data?.aanbieder === 'object'
                ? data?.aanbieder.value
                : data?.aanbieder?.naam ||
                  data?.aanbieder?.id ||
                  data?.aanbieder ||
                  '-'
              : '-';
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
              {
                label: 'Aantal afnemers',
                value: String(Array.isArray(used) ? used.length : 0),
              },
            ];

            return (
              <div className='con-product-details--header-short-stats'>
                {items.map((item) => (
                  <p
                    key={item.label}
                    className='con-product-details--header-short-stats-item'
                  >
                    <span>{item.label}:</span>
                    <ConUuidResolver style={{ fontWeight: 600 }}>
                      {item.value || '-'}
                    </ConUuidResolver>
                  </p>
                ))}
              </div>
            );
          })()}
        </div>

        {contact && (
          <div className='con-product-details--contact-info'>
            <div className='ac-register-review__contact-image'>
              {aanbieder?.logo && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={aanbieder.logo}
                />
              )}
            </div>

            {/* @TODO: contactpersoon has no logo / image, so its hard to show a contact persoon image */}
            <i>Contactinformatie:</i>
            {(() => {
              // Glitch: sometimes an array with two objects is returned; use the first

              if (contact && typeof contact === 'object') {
                return (
                  <div className='con-product-details--contact-info'>
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
                    {data?.website && (
                      <Link
                        href={`${
                          data?.website.startsWith('http')
                            ? data?.website
                            : `https://${data?.website}`
                        }`}
                      >
                        {data?.website}
                      </Link>
                    )}
                    {aanbieder?.website && (
                      <Link
                        href={`${
                          aanbieder?.website.startsWith('http')
                            ? aanbieder?.website
                            : `https://${aanbieder?.website}`
                        }`}
                      >
                        {aanbieder?.website}
                      </Link>
                    )}
                  </div>
                );
              }

              return (
                <>
                  <p>Niet beschikbaar</p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <Separator />

      <div className='con-product-details--content'>
        <AcColumn gap='tiger' className='con-product-details--content-main'>
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

        <Separator />

        {/* Side area next to editable descriptions with mock data */}
        <SuitableForList
          modules={data.modules}
          className='con-product-details--content-side'
        />
      </div>

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

  // Mark schemas that have duplicate titles between uses/used
  const filterWantedSchemas = useCallback((schemas) => {
    const wanted = new Set(['standaard', 'koppeling', 'dienst']);
    return (schemas || []).filter((s) => wanted.has(s.slug || ''));
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
          <li key={m?.['@self']?.id}>
            <ConUuidResolver>{m['@self']?.name || m.naam}</ConUuidResolver>
          </li>
        ))}
      </ul>
    </AcFlex>
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
