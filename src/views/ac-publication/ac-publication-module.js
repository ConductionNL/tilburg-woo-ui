import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import RelatedTabs from './con-related-tabs-new';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import {
  AcLoader,
  ConDetailsActionsMenu,
  ConStandardsTable,
  ConUuidResolver,
  ConPublicationTypeBadge,
} from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { AcButton } from '@molecules';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { schemaCache } from '@services/schemaCache.service';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';

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
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationProduct = ({
  store: { publications, user, object },
  //   schema,
}) => {
  const { id } = useParams();
  const { get_single, loading } = publications;
  const navigate = useNavigate();

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [actionMenuItems, setActionMenuItems] = useState([]);

  // Standards state for resolving compliance standards (extracted from uses data)
  const [standards, setStandards] = useState([]);
  const [standaardversies, setStandaardversies] = useState([]);
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate unique actions for applicaties (module) publication page
  // These actions change based on user role (similar to publish/depublish toggle)
  const uniqueActions = useMemo(() => {
    // Only show actions for module/applicatie schema
    if (schemaSlug !== 'module') {
      return [];
    }

    // Only show actions for logged-in users
    if (!user?.isAuthenticated) {
      return [];
    }

    // Only show if we have an id
    if (!id) {
      return [];
    }

    // Get user groups to determine which action variant to show
    const userGroups = user?.currentUser?.groups || user?.user?.groups || [];
    const hasAanbodBeheerder = userGroups.includes('aanbod-beheerder');
    const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

    // Note: These actions (dienst, gebruik, koppeling) are available to all logged-in users
    // regardless of organization. The label and wizard params change based on user role.

    const actions = [];

    // Dienst action - changes based on user role
    if (hasGebruikBeheerder) {
      actions.push({
        key: 'addDienst',
        label: 'Dienst toevoegen',
        icon: <VISUALS.HAND_SHAKE />,
        onClick: () => {
          const params = new URLSearchParams({
            type: 'ontbrekend-dienst',
            applicatie: id,
          });
          navigate(`/forms/dienst?${params.toString()}`);
        },
        disabled: false,
      });
    } else if (hasAanbodBeheerder) {
      actions.push({
        key: 'addDienst',
        label: 'Dienst publiceren',
        icon: <VISUALS.HAND_SHAKE />,
        onClick: () => {
          const params = new URLSearchParams({
            type: 'dienst',
            applicatie: id,
          });
          navigate(`/forms/dienst?${params.toString()}`);
        },
        disabled: false,
      });
    }

    // Gebruik action - changes based on user role
    if (hasGebruikBeheerder) {
      actions.push({
        key: 'addGebruik',
        label: 'Applicatie toevoegen',
        icon: <VISUALS.CLIPBOARD_CHECK />,
        onClick: () => {
          const params = new URLSearchParams({
            applicatie: id,
          });
          navigate(`/forms/gebruik/applicatie?${params.toString()}`);
        },
        disabled: false,
      });
    } else if (hasAanbodBeheerder) {
      actions.push({
        key: 'addGebruik',
        label: 'Applicatiegebruik melden',
        icon: <VISUALS.CLIPBOARD_CHECK />,
        onClick: () => {
          const params = new URLSearchParams({
            type: 'ontbrekend-organisatie',
            applicatie: id,
          });
          navigate(`/forms/gebruik/applicatie?${params.toString()}`);
        },
        disabled: false,
      });
    }

    // Koppeling action - changes based on user role
    if (hasGebruikBeheerder) {
      actions.push({
        key: 'addKoppeling',
        label: 'Koppeling toevoegen',
        icon: <VISUALS.LINK />,
        onClick: () => {
          const params = new URLSearchParams({
            type: 'aanbieden-koppeling',
            applicatie: id,
          });
          navigate(`/forms/koppeling?${params.toString()}`);
        },
        disabled: false,
      });
    } else if (hasAanbodBeheerder) {
      actions.push({
        key: 'addKoppeling',
        label: 'Koppeling publiceren',
        icon: <VISUALS.LINK />,
        onClick: () => {
          const params = new URLSearchParams({
            type: 'eigen-organisatie',
            applicatie: id,
          });
          navigate(`/forms/koppeling?${params.toString()}`);
        },
        disabled: false,
      });
    }

    return actions;
  }, [schemaSlug, id, user, navigate]);

  // Process vng-gemma/element data from uses response
  const processVngGemmaData = useCallback((usesData) => {
    if (!usesData || !Array.isArray(usesData)) {
      console.info('No uses data to process');
      return;
    }

    console.info('📋 Processing vng-gemma/element data from uses response...');

    // Find vng-gemma/element items by looking for items with a gemmaType property
    const elementItems = usesData.filter((item) => item?.gemmaType);

    if (!elementItems.length) {
      console.info('No vng-gemma/element items found in uses data');
      return;
    }

    // Separate by gemmaType
    const standardsData = elementItems.filter(
      (item) => item.gemmaType === 'Standaard'
    );
    const standaardversiesData = elementItems.filter(
      (item) => item.gemmaType === 'Standaardversie'
    );
    const referentieComponentenData = elementItems.filter(
      (item) => item.gemmaType === 'Referentiecomponent'
    );

    // Transform standards to add name property from @self.name
    const transformedStandards = standardsData.map((item) => ({
      ...item,
      name: item?.['@self']?.name || item.name || item.id,
    }));

    // Transform standaardversies to add name property from @self.name
    const transformedStandaardversies = standaardversiesData.map((item) => ({
      ...item,
      name: item?.['@self']?.name || item.name || item.id,
    }));

    setStandards(transformedStandards);
    setStandaardversies(transformedStandaardversies);

    // Process referentieComponenten with standards for the product
    if (get_single?.referentieComponenten?.length) {
      const productReferentieComponenten = get_single.referentieComponenten
        .map((refId) => {
          const refData = referentieComponentenData.find(
            (ref) =>
              String(ref.id) === String(refId) ||
              String(ref.value) === String(refId) ||
              String(ref.slug) === String(refId)
          );

          if (refData) {
            return {
              id: refId,
              naam: refData?.['@self']?.name || refId,
              moduleId: 0, // For publication view, we don't have specific modules
              applicatieId: 0,
              // Extract standards from the API data
              aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
              verplichteStandaarden: refData.verplichteStandaarden || [],
              // Store the full API data for future use
              fullData: refData,
            };
          }
          return null;
        })
        .filter(Boolean);

      setReferentieComponentenWithStandards(productReferentieComponenten);
      console.info(
        `✅ Processed ${productReferentieComponenten?.length} referentieComponenten with standards data`
      );
    } else {
      setReferentieComponentenWithStandards([]);
    }

    console.info(
      `✅ Processed vng-gemma data: ${standardsData.length} standards, ${standaardversiesData.length} standaardversies, ${referentieComponentenData.length} referentiecomponenten`
    );
  }, [get_single?.referentieComponenten]);

  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [gebruik, setGebruik] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [gebruikLoading, setGebruikLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Aggregated schemas from all endpoints (indexed by schema ID)
  const [aggregatedSchemas, setAggregatedSchemas] = useState({});

  // Extract contactpersoon from get_single (extended) or fallback to uses data
  const contact = useMemo(() => {
    // First, check if contactpersoon is extended in get_single
    const contactpersoon = get_single?.contactpersoon;

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
      const useSchemaId = use?.['@self']?.schema;
      const useSchemaSlug = useSchemaId ? schemaCache.get(useSchemaId) : null;
      return useSchemaSlug === 'contactpersoon';
    });

    if (!contactpersoonObject) return null;

    return contactpersoonObject;
  }, [get_single?.contactpersoon, uses]);

  const moduleVersies = useMemo(() => {
    if (!used?.length) return null;

    // Find the first contactpersoon object in the uses array
    // (if multiple contactpersonen exist, we take the first one)
    const moduleVersiesObjects = used.filter((use) => {
      const useSchemaId = use?.['@self']?.schema;
      const useSchemaSlug = useSchemaId ? schemaCache.get(useSchemaId) : null;
      return useSchemaSlug === 'moduleversie';
    });

    if (!moduleVersiesObjects.length) return null;

    return moduleVersiesObjects;
  }, [used]);

  // Resolved referentieComponenten names for custom tab rendering
  const [resolvedReferentieComponenten, setResolvedReferentieComponenten] = useState(
    []
  );

  // Actual count of visible standards (as rendered by ConStandardsTable)
  const [standardsCount, setStandardsCount] = useState(0);

  // Resolve referentieComponenten display names
  useEffect(() => {
    const resolveWithIds = async () => {
      if (!get_single?.referentieComponenten?.length || !object) {
        setResolvedReferentieComponenten([]);
        return;
      }

      try {
        const resolved = await Promise.all(
          get_single.referentieComponenten.map(async (refId) => {
            try {
              const name = await object.getNamesForSingleId(refId);
              return { id: refId, name };
            } catch (e) {
              return { id: refId, name: refId };
            }
          })
        );
        setResolvedReferentieComponenten(resolved);
      } catch (e) {
        setResolvedReferentieComponenten(
          get_single.referentieComponenten.map((refId) => ({
            id: refId,
            name: refId,
          }))
        );
      }
    };

    resolveWithIds();
  }, [get_single?.referentieComponenten, object]);

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=_schema`,
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
      const usesResults = data.results || [];
      setUses(usesResults);
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
      
      // Process vng-gemma/element data from the uses response
      processVngGemmaData(usesResults);
    } catch (error) {
      console.error('Error fetching uses:', error);
    } finally {
      setUsesLoading(false);
    }
  }, [id, processVngGemmaData]);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=_schema`,
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
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  const fetchGebruik = useCallback(async () => {
    if (!id) return;
    setGebruikLoading(true);
    try {
      // Fetch gebruik data related to this publication (as applicatie/module)
      const response = await fetch(
        `${commongroundApiUrl()}/softwarecatalog/api/gebruik?_limit=1000&_extend[]=_schema&${schemaSlug === 'product' ? 'product' : 'module'}=${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching gebruik:', response.statusText);
        return;
      }
      const data = await response.json();
      setGebruik(data.results || []);
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
    } catch (error) {
      console.error('Error fetching gebruik:', error);
    } finally {
      setGebruikLoading(false);
    }
  }, [id, schemaSlug]);

  useEffect(() => {
    if (!id) return;
    
    fetchUses();
    fetchUsed();
    fetchGebruik();
  }, [id, fetchUses, fetchUsed, fetchGebruik]);

  // Loading
  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl'>
      <AcFlex column spacing='sm'>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading level={4} className='con-module-publication--header-container'>
            <div className='con-beheer-details--header-container'>
              {(get_single?.['@self']?.image || get_single?.logo) && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={get_single?.['@self']?.image || get_single?.logo}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {get_single?.['@self']?.name ||
                  get_single?.id ||
                  get_single?.name ||
                  'Applicatie'}{' '}
                {'('}
                <ConUuidResolver>{get_single?.aanbieder}</ConUuidResolver>
                {')'}
              </Heading>
            </div>
          </Heading>
          <AcFlex
            justifyContent='end'
            alignItems='center'
            spacing='sm'
            className='con-module-publication--header-actions'
          >
            <Heading className='con-module-publication--header-type'>
              <ConPublicationTypeBadge schemaSlug={schemaSlug} />
            </Heading>
            {schemaSlug &&
              (() => {
                const userGroups =
                  user?.currentUser?.groups || user?.user?.groups || [];
                const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

                // Check if user is the owner of the object
                const userActiveOrg = user?.activeOrganization;
                const objectOrg = get_single?.['@self']?.organisation;
                const userOrgId = userActiveOrg?.uuid || userActiveOrg?.id;
                const objectOrgId =
                  typeof objectOrg === 'string'
                    ? objectOrg
                    : objectOrg?.id || objectOrg?.uuid;
                const isOwner =
                  userOrgId && objectOrgId && userOrgId === objectOrgId;

                // For GebruikBeheerder, show a single button only if not the owner
                // If owner, show the actions menu
                if (hasGebruikBeheerder && !isOwner) {
                  return (
                    <AcButton
                      style='button'
                      buttonType='primary'
                      icon={<VISUALS.PLUS />}
                      onClick={() => {
                        const params = new URLSearchParams({
                          applicatie: id,
                        });
                        navigate(`/forms/gebruik/applicatie?${params.toString()}`);
                      }}
                    />
                  );
                }

                // For AanbodBeheerder or GebruikBeheerder who owns the object, show the actions menu
                return (
                  <ConDetailsActionsMenu
                    user={user}
                    id={id}
                    schemaSlug={schemaSlug}
                    title={get_single?.['@self']?.name || get_single?.id}
                    published={get_single?.['@self']?.published}
                    object={get_single}
                    showViewAction={false}
                    showEditAction={true}
                    showPublishActions={true}
                    onDelete={handleDelete}
                    onEdit={() => {
                      if (schemaSlug) {
                        const wizardSchemaName =
                          normalizeSchemaName(schemaSlug).toLowerCase();
                        const wizards = Object.values(DASHBOARD_WIZARDS);
                        const wizard = wizards.find(
                          (w) => w.schema === wizardSchemaName
                        );

                        if (wizard) {
                          const baseUrl = getWizardUrl(wizard);
                          const url = new URL(baseUrl, window.location.origin);
                          url.searchParams.set('id', id);
                          navigate(url.pathname + url.search);
                          return;
                        }
                      }
                      // Fallback to beheer detail page in same tab with edit modal
                      const beheerUrl = `/beheer/${schemaSlug}/${id}?showEditModal=true`;
                      navigate(beheerUrl);
                    }}
                    uniqueActions={uniqueActions}
                    triggerStyle='button'
                  />
                );
              })()}
          </AcFlex>
        </AcFlex>
        <AcFlex spacing='sm' justifyContent='between'>
          <AcFlex column spacing='md' style={{ flex: 2 }}>
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
                  [rehypeSanitize],
                  [remarkRehype, { handlers: { ...defListHastHandlers } }],
                ]}
              />
            )}
          </AcFlex>
          <AcFlex column spacing='sm' style={{ flex: 1 }}>
            {(get_single?.website || get_single?.contactpersoon) && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                {get_single?.website && (
                  <AcFlex column>
                    <b>Website:</b>
                    <Link
                      href={get_single?.website}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <p>{get_single?.website}</p>
                    </Link>
                  </AcFlex>
                )}
                {typeof contact === 'object' && contact !== null ? (
                  <AcFlex column>
                    <b>Contactpersoon:</b>
                    <p>
                      {contact?.voornaam} {contact?.tussenvoegsel}{' '}
                      {contact?.achternaam}
                    </p>
                    <Link
                      href={`mailto:${contact?.['e-mailadres']}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <p>{contact?.['e-mailadres']}</p>
                    </Link>
                    <Link
                      href={`tel:${contact?.telefoonnummer}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <p>{contact?.telefoonnummer}</p>
                    </Link>
                  </AcFlex>
                ) : (
                  typeof get_single?.contactpersoon === 'string' &&
                  get_single?.contactpersoon?.trim?.() && (
                    <AcFlex column>
                      <b>Contactpersoon:</b>
                      <ConUuidResolver>{get_single?.contactpersoon}</ConUuidResolver>
                    </AcFlex>
                  )
                )}
              </AcFlex>
            )}
            <AcFlex
              column
              spacing='sm'
              className='con-product-details--contact-info'
            >
              {get_single?.licentietype && (
                <div>
                  <b>Licentietype:</b>
                  <p>{get_single?.licentietype}</p>
                </div>
              )}
              {get_single?.licentie && (
                <div>
                  <b>Licentie:</b>
                  <p>{get_single?.licentie}</p>
                </div>
              )}

              {Array.isArray(moduleVersies) && moduleVersies.length > 0 && (
                <div>
                  <b>Huidige versie:</b>
                  <p>
                    {moduleVersies?.find((versie) => versie.status === 'in gebruik')
                      ?.versie || 'Geen versie in gebruik'}
                  </p>
                </div>
              )}
              {get_single?.hostingLocatie && (
                <div>
                  <b>De applicatie wordt gehost in:</b>
                  <p>{get_single.hostingLocatie}</p>
                </div>
              )}
              {get_single?.hostingJurisdictie && (
                <div>
                  <b>De data wordt opgeslagen in:</b>
                  <p>{get_single.hostingJurisdictie}</p>
                </div>
              )}
              {Array.isArray(get_single?.cloudDienstverleningsmodel) &&
                get_single.cloudDienstverleningsmodel.length > 0 && (
                  <div>
                    <b>Hosting type:</b>
                    <ul style={{ margin: 0, paddingLeft: '1.25em' }}>
                      {get_single.cloudDienstverleningsmodel.map((model, idx) => (
                        <li key={idx}>{model}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </AcFlex>
          </AcFlex>
        </AcFlex>
      </AcFlex>

      <AcGenericBeheerDeleteModal
        objects={get_single ? [get_single] : []}
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => navigate('/zoeken')}
      />

      <RelatedTabs
        uses={uses}
        used={used}
        gebruik={gebruik}
        schemas={aggregatedSchemas}
        usesLoading={usesLoading}
        usedLoading={usedLoading}
        gebruikLoading={gebruikLoading}
        excludeObjectIds={[]}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        object={object}
        navigateTo='publication'
        user={user}
        customTabsBefore={[
          {
            id: 'standaarden',
            label: `Standaarden`,
            icon: VISUALS.SCROLL,
            count: standardsCount,
            render: () => (
              <ConStandardsTable
                referentieComponenten={get_single.referentieComponenten}
                complianceStandards={get_single.compliancy}
                compliantVersieIds={
                  get_single.standaardVersies || get_single.standaardversies || []
                }
                enableScrolling={true}
                standards={standards}
                standaardversies={standaardversies}
                referentieComponentenWithStandards={
                  referentieComponentenWithStandards
                }
                loading={usesLoading}
                onStandardsCountChange={(n) => setStandardsCount(n)}
              />
            ),
          },
          {
            id: 'geschikt-voor',
            label: 'Geschikt voor',
            icon: VISUALS.NETWORK_STRENGTH_4_COG,
            items: resolvedReferentieComponenten,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resolvedReferentieComponenten.map((item, idx) => {
                  const actualRefComponent =
                    referentieComponentenWithStandards?.find(
                      (refComp) =>
                        refComp.id === item.id ||
                        refComp.fullData?.identifier === item.id ||
                        refComp.fullData?.id === item.id
                    );
                  const refComponentObjectId =
                    actualRefComponent?.fullData?.id || item.id;
                  return (
                    <Link
                      key={idx}
                      href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${refComponentObjectId}`}
                      target='_blank'
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ),
          },
        ]}
      />
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationProduct));
