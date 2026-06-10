import React from 'react';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { ConExternalLink } from '@src/components';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import { schemaCache } from '@services/schemaCache.service';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useNavigate } from 'react-router-dom';

// Markdown Editor
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import { remarkMark } from 'remark-mark-highlight';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';

/**
 * Content for the dienst details page
 *
 * note:
 * Restructured to match con-module-details-page-content layout with vertical content flow
 * and integrated action menu with inline editing buttons.
 */
const ConDienstDetailsPageContent = ({
  loading,
  data,
  config,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
}) => {
  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  const navigate = useNavigate();

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUses(json.results || []);
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUsed(json.results || []);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  // Extract contactpersoon from data (extended) or fallback to uses data
  const contact = (() => {
    const contactpersoon = data?.contactpersoon;

    if (contactpersoon) {
      // If contactpersoon is an array of objects, use the first one
      if (Array.isArray(contactpersoon) && contactpersoon.length > 0) {
        const firstContact = contactpersoon[0];
        // Check if it's an object (extended) or just a string (UUID)
        if (typeof firstContact === 'object' && firstContact !== null) {
          return firstContact;
        }
      }
      // If contactpersoon is a single object (not array, not string UUID)
      if (typeof contactpersoon === 'object' && !Array.isArray(contactpersoon)) {
        return contactpersoon;
      }
    }

    // Fallback: Find contactpersoon in uses array
    if (!uses?.length) return null;

    const contactpersoonObject = uses.find((use) => {
      const useSchemaSlug = use?.['@self']?.schema?.slug;
      return useSchemaSlug === 'contactpersoon';
    });

    return contactpersoonObject || null;
  })();

  // For backward compatibility - get contactId for cases where we only have a UUID string
  const contactId = (() => {
    const contactpersoon = data?.contactpersoon;
    if (Array.isArray(contactpersoon) && contactpersoon.length > 0) {
      const firstContact = contactpersoon[0];
      if (typeof firstContact === 'string') {
        return firstContact;
      }
    }
    if (typeof contactpersoon === 'string') {
      return contactpersoon;
    }
    return null;
  })();

  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat de dienst niet gevonden is',
      };
  const actualCanEdit = canEdit && hasEditPermission;

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  // Filter out organisatie items from related tabs (aanbieder is redundant on dienst pages)
  const filteredUses = useMemo(
    () => uses.filter((item) => {
      const slug = item?.['@self']?.schema?.slug || schemaCache.get(item?.['@self']?.schema);
      return slug !== 'organisatie';
    }),
    [uses]
  );
  const filteredUsed = useMemo(
    () => used.filter((item) => {
      const slug = item?.['@self']?.schema?.slug || schemaCache.get(item?.['@self']?.schema);
      return slug !== 'organisatie';
    }),
    [used]
  );

  if (loading || !data) return null;

  return (
    <AcColumn gap='sm' horizontalOverflowWrapper>
      <div
        className='ac-register-review__organisation-header'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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

        <div className='ac-register-review__header-controls'>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ConActionMenu>
              <ConActionMenu.Trigger
                icon={<VISUALS.ELLIPSIS />}
                buttonType='primary'
              >
                Acties
              </ConActionMenu.Trigger>
              <ConActionMenu.Menu position='right'>
                <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => {
                    // Prefer wizard editing when available; fallback to legacy modal
                    if (config?.schemaSlug) {
                      const wizards = Object.values(DASHBOARD_WIZARDS);
                      const wizard = wizards.find((w) => w.schema === 'dienst');

                      if (wizard) {
                        const baseUrl = getWizardUrl(wizard);
                        const url = new URL(baseUrl, window.location.origin);
                        url.searchParams.set('id', id);
                        navigate(url.pathname + url.search);
                        return;
                      }
                    }

                    // Fallback to modal
                    actionMenuProps?.setOpenModal?.('edit');
                  }}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('edit', reason)
                      : undefined
                  }
                >
                  Bewerken
                </ConActionMenu.Button>

                {/* Publish/Depublish actions - LEGACY: No longer needed */}
                {/* {data && !data['@self']?.published && (
                  <ConActionMenu.Button
                    icon={<VISUALS.PUBLISH />}
                    onClick={() => actionMenuProps?.setOpenModal?.('publish')}
                    disabled={!actualCanEdit}
                    data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                    data-tooltip-content={
                      !actualCanEdit
                        ? getDisabledActionTooltip('publish', reason)
                        : undefined
                    }
                  >
                    Publiceren
                  </ConActionMenu.Button>
                )}

                {data && data['@self']?.published && (
                  <ConActionMenu.Button
                    icon={<VISUALS.PUBLISH_OFF />}
                    onClick={() => actionMenuProps?.setOpenModal?.('depublish')}
                    disabled={!actualCanEdit}
                    data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                    data-tooltip-content={
                      !actualCanEdit
                        ? getDisabledActionTooltip('depublish', reason)
                        : undefined
                    }
                  >
                    Depubliceren
                  </ConActionMenu.Button>
                )} */}

                <ConActionMenu.Button
                  icon={<VISUALS.TRASHCAN />}
                  onClick={() => actionMenuProps?.setOpenModal?.('delete')}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('delete', reason)
                      : undefined
                  }
                >
                  Verwijderen
                </ConActionMenu.Button>
              </ConActionMenu.Menu>
            </ConActionMenu>
          </div>
        </div>
      </div>

      {/* Unpublished warning - LEGACY: No longer needed */}
      {/* <UnpublishedWarning data={data} /> */}

      {/* Short description */}
      <div style={{ flex: 2 }}>
        {/* <ConEditableDescription
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder='Een korte beschrijving van de dienst'
          tooltip='Een korte beschrijving van de dienst'
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          serialize={(v) => v}
          deserialize={(v) => v || ''}
          onSuccess={(v) => {
            data.beschrijvingKort = v;
            // No data refresh needed - data already updated locally
          }}
        /> */}

        {/* Visual representation - Short description */}
        {!!data?.beschrijvingKort && <div>{data.beschrijvingKort}</div>}
      </div>

      {/* Long description */}
      <div>
        {/* <br />
        <ConEditableDescription
          markdownPreviewClassName='con-my-account-description'
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingLang'
          label='Lange beschrijving'
          placeholder='Een uitgebreide beschrijving van de dienst'
          tooltip='Een uitgebreide beschrijving van de dienst'
          maxLength={5000}
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
          onSuccess={(v) => {
            data.beschrijvingLang = v;
            // No data refresh needed - data already updated locally
          }}
        /> */}
        {!!data?.beschrijvingLang && (
          <>
            <br />
            <MDEditor.Markdown
              wrapperElement={{
                'data-color-mode': 'light',
              }}
              source={(() => {
                try {
                  return JSON.parse(data.beschrijvingLang) || '';
                } catch (e) {
                  return data.beschrijvingLang || '';
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
                [rehypeSanitize],
                [remarkRehype, { handlers: { ...defListHastHandlers } }],
              ]}
            />
          </>
        )}
      </div>

      {(contact || contactId || data?.website) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Contact informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.website && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <strong>Website:</strong>
                  <ConExternalLink href={data?.website} />
                </div>
              )}
              {contact && typeof contact === 'object' ? (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Contactpersoon: </strong>
                  <div style={{ minHeight: '24px' }}>
                    {[contact.voornaam, contact.tussenvoegsel, contact.achternaam]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  {contact['e-mailadres'] && (
                    <div>
                      <Link
                        href={`mailto:${contact['e-mailadres']}`}
                        style={{ minHeight: '24px' }}
                      >
                        {contact['e-mailadres']}
                      </Link>
                    </div>
                  )}
                  {contact.telefoonnummer && (
                    <div>
                      <Link
                        href={`tel:${String(contact.telefoonnummer)
                          .split('')
                          .filter((character) => character !== ' ')
                          .join('')}`}
                        style={{ minHeight: '24px' }}
                      >
                        {contact.telefoonnummer}
                      </Link>
                    </div>
                  )}
                </div>
              ) : contactId ? (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Contactpersoon: </strong>
                  <ConUuidResolver>{String(contactId)}</ConUuidResolver>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {data?.type && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Basisinformatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.type && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Diensttype: </strong>
                  {(() => {
                    const rawType = data.type;

                    // Check if it's a string that looks like a JSON array
                    if (
                      typeof rawType === 'string' &&
                      rawType.trim().startsWith('[')
                    ) {
                      try {
                        const parsed = JSON.parse(rawType);
                        if (Array.isArray(parsed)) {
                          return parsed.map((item, index) => (
                            <React.Fragment key={index}>
                              <ConUuidResolver>{String(item)}</ConUuidResolver>
                              {index < parsed.length - 1 ? ', ' : ''}
                            </React.Fragment>
                          ));
                        }
                      } catch (e) {
                        // If parsing fails, display as-is
                        return <ConUuidResolver>{String(rawType)}</ConUuidResolver>;
                      }
                    }

                    // Handle actual arrays
                    if (Array.isArray(rawType)) {
                      return rawType.map((typeId, index) => (
                        <React.Fragment key={index}>
                          <ConUuidResolver>{String(typeId)}</ConUuidResolver>
                          {index < rawType.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      ));
                    }

                    // Handle single value
                    return <ConUuidResolver>{String(rawType)}</ConUuidResolver>;
                  })()}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {id && (
        <div style={{ marginTop: '2rem' }}>
          <RelatedTabs
            id={id}
            uses={filteredUses}
            used={filteredUsed}
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

/* Warning card for unpublished objects - LEGACY: No longer needed */
// const UnpublishedWarning = ({ data }) => {
//   if (data?.['@self']?.published) return null;
//   const schemaName = data?.['@self']?.schema?.title;
//   const title = schemaName ? `${schemaName}` : '';
//   const objectName = data?.['@self']?.name;
//
//   return (
//     <div className='ac-alert ac-alert--warning' style={{ marginBottom: '1rem' }}>
//       <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
//       <Paragraph>
//         {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
//         {schemaName || 'de softwarecatalogus'}. Gebruik de &quot;Publiceren&quot; actie om
//         deze gegevens beschikbaar te maken voor bezoekers.
//       </Paragraph>
//     </div>
//   );
// };

export default ConDienstDetailsPageContent;
