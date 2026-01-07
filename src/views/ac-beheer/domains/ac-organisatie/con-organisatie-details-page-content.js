import {
  Heading,
  Paragraph,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
// import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { ConExternalLink } from '@src/components';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
// import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';

/**
 * Content for the organisation details page
 *
 * note:
 * Structured to match con-module-details-page-content layout with vertical content flow.
 * Content is based on con-my-organisation.js but adapted for the beheer details page pattern.
 */
const ConOrganisatieDetailsPageContent = ({
  loading,
  config,
  data,
  userStore: user,
  objectStore: object,
  id,
  // canEdit = false,
  // actionMenuProps,
}) => {
  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  // Editing state for inline editing
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_published=false`,
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
      const responseData = await response.json();
      setUses(responseData.results || []);
    } catch (error) {
      console.error('Error fetching uses:', error);
      setUses([]);
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_limit=500&_published=false`,
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
      const responseData = await response.json();
      setUsed(responseData.results || []);
    } catch (error) {
      console.error('Error fetching used:', error);
      setUsed([]);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  if (loading || !data) return null;

  const shortTooltip = 'Een korte beschrijving van de organisatie';
  const longTooltip = 'Een uitgebreide beschrijving van de organisatie';

  return (
    <AcColumn gap='sm' horizontalOverflowWrapper>
      {/* Header with logo, title and actions */}
      <div
        className='ac-register-review__organisation-header'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
      </div>

      {/* Unpublished warning */}
      <UnpublishedWarning data={data} />

      {/* Short description */}
      <div style={{ flex: 2 }}>
        <ConEditableDescription
          registerSlug={config?.registerSlug || 'voorzieningen'}
          schemaSlug={config?.schemaSlug || 'organisatie'}
          objectId={data?.['@self']?.id || data?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder={shortTooltip}
          tooltip={shortTooltip}
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          isEditingCustomTrigger={editingSummary}
          serialize={(value) => value}
          deserialize={(value) => value || ''}
          onSuccess={(value) => {
            setEditingSummary(false);
            data.beschrijvingKort = value;
          }}
          onCancel={() => setEditingSummary(false)}
        />
      </div>

      {/* Long description */}
      <div>
        <br />
        <ConEditableDescription
          markdownPreviewClassName='con-my-account-description'
          registerSlug={config?.registerSlug || 'voorzieningen'}
          schemaSlug={config?.schemaSlug || 'organisatie'}
          objectId={data?.['@self']?.id || data?.id}
          field='beschrijvingLang'
          label='Lange beschrijving'
          placeholder={longTooltip}
          tooltip={longTooltip}
          maxLength={5000}
          isMarkdown={true}
          isEditingCustomTrigger={editingDescription}
          value={data.beschrijvingLang}
          serialize={(value) => JSON.stringify(value || '')}
          deserialize={(value) => {
            if (!value) return '';
            try {
              return JSON.parse(value) || '';
            } catch (error) {
              return value;
            }
          }}
          onCancel={() => setEditingDescription(false)}
          onSuccess={(value) => {
            setEditingDescription(false);
            data.beschrijvingLang = value;
          }}
        />
      </div>

      {/* Contact Information Section */}
      {(data?.['e-mailadres'] || data?.telefoonnummer || data?.website) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Contact informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.['e-mailadres'] && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Email: </strong>
                  <Link href={`mailto:${data['e-mailadres']}`}>
                    {data['e-mailadres']}
                  </Link>
                </div>
              )}
              {data?.telefoonnummer && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Telefoon: </strong>
                  <Link href={`tel:${data.telefoonnummer.replace(/\s/g, '')}`}>
                    {data.telefoonnummer}
                  </Link>
                </div>
              )}
              {data?.website && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <strong>Website:</strong>
                  <ConExternalLink href={data.website} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Related tabs */}
      {id && (
        <div style={{ marginTop: '2rem' }}>
          <RelatedTabs
            id={id}
            uses={uses}
            used={used}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            gebruikId={id}
            gebruikSchemaId={data?.['@self']?.schema}
            tabIndex={relatedTabIndex}
            setTabIndex={setRelatedTabIndex}
            object={object}
            navigateTo='beheer'
            user={user}
          />
        </div>
      )}
    </AcColumn>
  );
};

/* Warning card for unpublished objects */
const UnpublishedWarning = ({ data }) => {
  if (data?.['@self']?.published) return null;
  const schemaName = data?.['@self']?.schema?.title || 'Organisatie';
  const objectName = data?.['@self']?.name || data?.naam;

  return (
    <div className='ac-alert ac-alert--warning' style={{ marginBottom: '1rem' }}>
      <Heading level={4}>{schemaName} is nog niet gepubliceerd</Heading>
      <Paragraph>
        {objectName} is momenteel niet zichtbaar in de zoekfunctie van de catalogus.
        Gebruik de &quot;Publiceren&quot; actie om deze gegevens beschikbaar te maken
        voor bezoekers.
      </Paragraph>
    </div>
  );
};

export default ConOrganisatieDetailsPageContent;
