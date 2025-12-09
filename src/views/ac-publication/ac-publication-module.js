import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import RelatedTabs from './con-related-tabs';
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
} from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { schemaCache } from '@services/schemaCache.service';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

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

  // Standards state for resolving compliance standards
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  // State for referentieComponenten data with standards
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate unique actions for applicaties (module) publication page
  const uniqueActions = useMemo(() => {
    // Only show actions for module/applicatie schema
    if (schemaSlug !== 'module') {
      return [];
    }

    // Get user groups for filtering
    const userGroups = user?.currentUser?.groups || user?.user?.groups || [];
    const hasAanbodBeheerder = userGroups.includes('aanbod-beheerder');
    const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

    // Check organization permissions
    const { canEdit, reason } = checkOrganizationPermissions(user, get_single);

    // Define action groups (same as beheer page)
    const actionGroups = [
      {
        groupKey: 'dienst',
        groupLabel: 'Dienst',
        groupIcon: <VISUALS.HAND_SHAKE />,
        actions: [
          {
            key: 'addDienstGebruik',
            label: 'Dienst toevoegen',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/dienst',
            wizardParams: () => ({
              type: 'ontbrekend-dienst',
              applicatie: id,
            }),
            userGroupFilter: ['gebruik-beheerder'],
          },
          {
            key: 'addDienstAanbod',
            label: 'Dienst publiceren',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/dienst',
            wizardParams: () => ({
              type: 'dienst',
              applicatie: id,
            }),
            userGroupFilter: ['aanbod-beheerder'],
          },
        ],
      },
      {
        groupKey: 'gebruik',
        groupLabel: 'Gebruik',
        groupIcon: <VISUALS.CLIPBOARD_CHECK />,
        actions: [
          {
            key: 'addGebruikGebruik',
            label: 'Applicatie toevoegen',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/gebruik',
            wizardParams: () => ({
              applicatie: id,
            }),
            userGroupFilter: ['gebruik-beheerder'],
          },
          {
            key: 'addGebruikAanbod',
            label: 'Applicatiegebruik melden',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/gebruik',
            wizardParams: () => ({
              type: 'ontbrekend-organisatie',
              applicatie: id,
            }),
            userGroupFilter: ['aanbod-beheerder'],
          },
        ],
      },
      {
        groupKey: 'koppeling',
        groupLabel: 'Koppeling',
        groupIcon: <VISUALS.LINK />,
        actions: [
          {
            key: 'addKoppelingGebruik',
            label: 'Koppeling toevoegen',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/koppeling',
            wizardParams: () => ({
              type: 'aanbieden-koppeling',
              applicatie: id,
            }),
            userGroupFilter: ['gebruik-beheerder'],
          },
          {
            key: 'addKoppelingAanbod',
            label: 'Koppeling publiceren',
            condition: () => !!id,
            action: 'wizard',
            wizardPath: '/forms/koppeling',
            wizardParams: () => ({
              type: 'eigen-organisatie',
              applicatie: id,
            }),
            userGroupFilter: ['aanbod-beheerder'],
          },
        ],
      },
    ];

    return actionGroups
      .map((actionConfig) => {
        // Filter actions within the group based on user groups and conditions
        const filteredActions = actionConfig.actions
          .filter((action) => {
            // Check condition first
            if (action.condition && !action.condition()) {
              return false;
            }

            // Filter by user groups if userGroupFilter is specified
            if (action.userGroupFilter && Array.isArray(action.userGroupFilter)) {
              const hasRequiredGroup = action.userGroupFilter.some((group) => {
                if (group === 'aanbod-beheerder') return hasAanbodBeheerder;
                if (group === 'gebruik-beheerder') return hasGebruikBeheerder;
                return userGroups.includes(group);
              });
              if (!hasRequiredGroup) {
                return false;
              }
            }

            return true;
          })
          .map((action) => ({
            key: action.key,
            label: action.label,
            onClick: () => {
              // Check if this is a wizard action
              if (action.action === 'wizard' && action.wizardPath) {
                // Navigate to wizard with params if provided
                const params = action.wizardParams ? action.wizardParams() : {};
                const searchParams = new URLSearchParams(params);
                const queryString = searchParams.toString();
                navigate(
                  `${action.wizardPath}${queryString ? '?' + queryString : ''}`
                );
              }
            },
            disabled: !canEdit,
            tooltipId: !canEdit ? TOOLTIP_ID : undefined,
            tooltipContent: !canEdit
              ? getDisabledActionTooltip(action.key, reason)
              : undefined,
          }));

        // Only return the group if it has at least one action
        if (filteredActions.length === 0) {
          return null;
        }

        return {
          type: 'group',
          groupKey: actionConfig.groupKey,
          label: actionConfig.groupLabel,
          icon: actionConfig.groupIcon,
          children: filteredActions,
          disabled:
            filteredActions.every((child) => child?.disabled ?? false) || !canEdit,
        };
      })
      .filter(Boolean);
  }, [schemaSlug, id, user, get_single, navigate]);

  // Fetch referentieComponenten data with their standards
  const fetchReferentieComponentenWithStandards = useCallback(async () => {
    if (!get_single?.referentieComponenten?.length) {
      setReferentieComponentenWithStandards([]);
      return;
    }

    console.info('📋 Fetching referentieComponenten with standards data...');

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
      });

      // Fetch referentieComponenten from openconnector endpoint
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Error fetching referentieComponenten:', response.statusText);
        return;
      }

      const data = await response.json();
      const allReferentieComponenten = data.results || data;

      // Filter to only the referentieComponenten that are used in this product
      const productReferentieComponenten = get_single.referentieComponenten
        .map((refId) => {
          const refData = allReferentieComponenten.find(
            (ref) =>
              String(ref.id) === String(refId) ||
              String(ref.value) === String(refId) ||
              String(ref.slug) === String(refId)
          );

          if (refData) {
            return {
              id: refId,
              naam:
                refData?.xml?.name?._value ||
                refData?.naam ||
                refData?.name ||
                refData?.title ||
                refData?.label ||
                refId,
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
        `✅ Loaded ${productReferentieComponenten?.length} referentieComponenten with standards data`
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to fetch referentieComponenten with standards:',
        error
      );
      setReferentieComponentenWithStandards([]);
    }
  }, [get_single?.referentieComponenten]);

  // Fetch standards from openconnector endpoint
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(
          'Error fetching openconnector standards:',
          response.statusText
        );
        return;
      }

      const data = await response.json();
      const fetchedStandards = data.results || data;

      setStandards(fetchedStandards);
      console.info(
        `✅ Loaded ${fetchedStandards?.length} standards for publication page`
      );
    } catch (error) {
      console.warn('⚠️ Failed to fetch standards:', error);
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandards();
    fetchReferentieComponentenWithStandards();
  }, [fetchStandards, fetchReferentieComponentenWithStandards]);

  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Extract contactpersoon from uses data instead of get_single
  const contact = useMemo(() => {
    if (!uses?.length) return null;

    // Find the first contactpersoon object in the uses array
    // (if multiple contactpersonen exist, we take the first one)
    const contactpersoonObject = uses.find((use) => {
      const useSchemaId = use?.['@self']?.schema;
      const useSchemaSlug = useSchemaId ? schemaCache.get(useSchemaId) : null;
      return useSchemaSlug === 'contactpersoon';
    });

    if (!contactpersoonObject) return null;

    return contactpersoonObject;
  }, [uses]);

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

  // Track which IDs we've already fetched to prevent duplicate calls
  const fetchedIds = useRef(new Set());

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses`,
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
  }, []);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used`,
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
  }, []);

  useEffect(() => {
    // Only fetch when the ID in the URL changes and we haven't fetched for this ID before
    if (!id || fetchedIds.current.has(id)) {
      return;
    }

    // Mark this ID as fetched
    fetchedIds.current.add(id);

    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

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
            justifyContent='between'
            alignItems='center'
            spacing='sm'
            className='con-module-publication--header-actions'
          >
            <Heading className='con-module-publication--header-type'>
              {schemaSlug &&
                (() => {
                  const Icon = getTabHeaderIcon(schemaSlug);
                  return <Icon />;
                })()}
              {schemaSlug && getTabHeaderName(schemaSlug, true)}
            </Heading>
            {schemaSlug && (
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
                    const wizards = Object.values(DASHBOARD_WIZARDS);
                    const wizard = wizards.find((w) => w.schema === schemaSlug);

                    if (wizard) {
                      const baseUrl = getWizardUrl(wizard);
                      const url = new URL(baseUrl, window.location.origin);
                      url.searchParams.set('id', id);
                      navigate(url.pathname + url.search);
                      return;
                    }

                    if (schemaSlug === 'module') {
                      const beheerUrl = `/beheer/applicaties/${id}`;
                      window.open(beheerUrl, '_blank');
                    }
                    if (schemaSlug === 'moduleversie') {
                      const beheerUrl = `/beheer/applicatieversie/${id}`;
                      window.open(beheerUrl, '_blank');
                    }
                  }
                  // Fallback to beheer legacy edit page in new tab
                  const beheerUrl = `/beheer/${schemaSlug}/${id}`;
                  window.open(beheerUrl, '_blank');
                }}
                uniqueActions={uniqueActions}
                triggerStyle='button'
              />
            )}
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

            {/* <TabList
              referentieComponenten={get_single.referentieComponenten}
              complianceStandards={get_single.compliancy}
              objectStore={object}
              standards={standards}
              standardsLoading={standardsLoading}
              referentieComponentenWithStandards={referentieComponentenWithStandards}
              className='con-product-details--content-side'
            /> */}
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
        id={id}
        uses={uses}
        used={used}
        usesLoading={usesLoading}
        usedLoading={usedLoading}
        gebruikId={id}
        gebruikSchemaId={schemaId}
        gebruikSchemaSlug={get_single?.['@self']?.schema?.slug}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        object={object}
        navigateTo='publication'
        user={user}
        // tabNameOverride={{
        //   schemaName: 'product',
        //   newTabName: 'Onderdeel van product(en)',
        // }}
        customTabsBefore={[
          {
            id: 'standaarden',
            label: `Standaarden`,
            icon: VISUALS.SCROLL,
            // Use dynamic count from the table to match visible rows
            count: standardsCount,
            render: () => (
              <ConStandardsTable
                referentieComponenten={get_single.referentieComponenten}
                complianceStandards={get_single.compliancy}
                enableScrolling={true}
                standards={standards}
                referentieComponentenWithStandards={
                  referentieComponentenWithStandards
                }
                loading={standardsLoading}
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

// // Helper function to get all standards from referentieComponenten data
// const getAllStandardsFromReferentieComponenten = (
//   referentieComponentenWithStandards
// ) => {
//   if (!referentieComponentenWithStandards?.length) return [];

//   const allStandards = [];

//   referentieComponentenWithStandards.forEach((refComp) => {
//     // Add verplichte standaarden
//     if (
//       refComp.verplichteStandaarden &&
//       Array.isArray(refComp.verplichteStandaarden)
//     ) {
//       refComp.verplichteStandaarden.forEach((standard) => {
//         const standardId =
//           typeof standard === 'string'
//             ? standard
//             : standard?.id ||
//               standard?.value ||
//               standard?.slug ||
//               standard?.naam ||
//               standard?.name;

//         if (standardId && !allStandards.find((s) => s.id === standardId)) {
//           allStandards.push({
//             id: standardId,
//             type: 'VERPLICHT',
//             referentieComponent: refComp.naam || `Component ${refComp.id}`,
//           });
//         }
//       });
//     }

//     // Add aanbevolen standaarden
//     if (
//       refComp.aanbevolenStandaarden &&
//       Array.isArray(refComp.aanbevolenStandaarden)
//     ) {
//       refComp.aanbevolenStandaarden.forEach((standard) => {
//         const standardId =
//           typeof standard === 'string'
//             ? standard
//             : standard?.id ||
//               standard?.value ||
//               standard?.slug ||
//               standard?.naam ||
//               standard?.name;

//         if (standardId) {
//           const existingStandard = allStandards.find((s) => s.id === standardId);
//           if (existingStandard) {
//             // If already exists as VERPLICHT, keep it as VERPLICHT
//             if (existingStandard.type !== 'VERPLICHT') {
//               existingStandard.type = 'AANBEVOLEN';
//             }
//           } else {
//             allStandards.push({
//               id: standardId,
//               type: 'AANBEVOLEN',
//               referentieComponent: refComp.naam || `Component ${refComp.id}`,
//             });
//           }
//         }
//       });
//     }
//   });

//   return allStandards;
// };

// const TabList = ({
//   referentieComponenten,
//   complianceStandards,
//   objectStore,
//   standards,
//   standardsLoading,
//   referentieComponentenWithStandards,
// }) => {
//   // Get all standards from referentieComponenten using the helper function
//   const allReferentieStandards = getAllStandardsFromReferentieComponenten(
//     referentieComponentenWithStandards
//   );

//   // Set default tab index based on whether we have standards from referentieComponenten
//   const hasStandards = allReferentieStandards && allReferentieStandards.length > 0;
//   const [tabIndex, setTabIndex] = useState(0);

//   // Update tab index when standards data becomes available
//   useEffect(() => {
//     if (hasStandards) {
//       setTabIndex(0); // Show standards tab
//     } else {
//       setTabIndex(1); // Show "Geschikt voor" tab
//     }
//   }, [hasStandards]);

//   // Custom hook to resolve UUIDs while keeping original IDs
//   const [resolvedReferentieComponenten, setResolvedReferentieComponenten] = useState(
//     []
//   );

//   useEffect(() => {
//     const resolveWithIds = async () => {
//       if (!referentieComponenten?.length || !objectStore) {
//         setResolvedReferentieComponenten([]);
//         return;
//       }

//       try {
//         const resolved = await Promise.all(
//           referentieComponenten.map(async (id) => {
//             try {
//               const name = await objectStore.getNamesForSingleId(id);
//               return { id, name };
//             } catch (error) {
//               return { id, name: id }; // Fallback to ID if resolution fails
//             }
//           })
//         );
//         setResolvedReferentieComponenten(resolved);
//       } catch (error) {
//         console.error('Error resolving referentie componenten:', error);
//         // Fallback to just IDs
//         setResolvedReferentieComponenten(
//           referentieComponenten.map((id) => ({ id, name: id }))
//         );
//       }
//     };

//     resolveWithIds();
//   }, [referentieComponenten, objectStore]);

//   return (
//     <div className='con-product-details--side-content-tabs'>
//       <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
//         <AcTabList>
//           <AcTab
//             selected={tabIndex === 0}
//           >{`Standaarden (${allReferentieStandards.length})`}</AcTab>
//           <AcTab
//             selected={tabIndex === 1}
//           >{`Geschikt voor (${referentieComponenten.length})`}</AcTab>
//         </AcTabList>
//         <AcTabPanel selected={tabIndex === 0} style={{ paddingInline: '0px' }}>
//           <ConStandardsTable
//             referentieComponenten={referentieComponenten}
//             complianceStandards={complianceStandards}
//             enableScrolling={true}
//             standards={standards}
//             referentieComponentenWithStandards={referentieComponentenWithStandards}
//             loading={standardsLoading}
//           />
//         </AcTabPanel>
//         <AcTabPanel selected={tabIndex === 1}>
//           {resolvedReferentieComponenten.map((item, idx) => {
//             // Find the actual referentieComponent object to get its real ID
//             const actualRefComponent = referentieComponentenWithStandards?.find(
//               (refComp) =>
//                 refComp.id === item.id ||
//                 refComp.fullData?.identifier === item.id ||
//                 refComp.fullData?.id === item.id
//             );

//             // Use the actual referentieComponent's ID, fallback to item.id if not found
//             const refComponentObjectId = actualRefComponent?.fullData?.id || item.id;

//             return (
//               <Link
//                 key={idx}
//                 href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${refComponentObjectId}`}
//                 target='_blank'
//               >
//                 {item.name}
//               </Link>
//             );
//           })}
//         </AcTabPanel>
//       </AcTabs>
//     </div>
//   );
// };

export default withStore(observer(AcPublicationProduct));
