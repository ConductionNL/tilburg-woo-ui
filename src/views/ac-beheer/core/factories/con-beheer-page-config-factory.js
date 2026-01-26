import React from 'react';
import { AcColumn } from '@atoms';
import { VISUALS } from '@constants';
import { byNested } from '../utils/sorters';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';

/**
 * Beheer Page Configuration Factory
 * This factory creates configuration objects for different beheer page types
 */
const BeheerPageConfigFactory = {
  /**
   * Creates configuration for a specific beheer page type
   * @param {string} type - The beheer page type
   * @returns {Object} Configuration object
   */
  createConfig: (type) => {
    // Removed extend: ['all'] for performance reasons - use specific extends when needed

    const baseConfig = {
      registerSlug: 'voorzieningen',
      extend: [],
      customHeaders: {},
      defaultHeaders: [],
      actionButtons: null,
      customFilterDrawer: null,
      modals: ['add', 'edit', 'delete', 'import', 'publish', 'depublish'],
      uniqueActions: [],
      statusIcon: null,
      routeType: null,
      // function to filter out actions, receives all properties of a Schema (so filtering on slug is possible)
      // example: `dynamicActionFilter: ({ slug }) => !['module'].includes(slug)` - this filters out the Applicatie dynamic action
      dynamicActionFilter: null,
    };

    switch (type) {
      case 'view':
        return {
          ...baseConfig,
          registerSlug: 'vng-gemma',
          schemaSlug: 'view',
          paginationKey: 'views',
          title: 'Beheer Views',
          routeType: 'view',
          defaultHeaders: [],
          customHeaders: {},
          modals: [...baseConfig.modals],
        };

      // removed plural alias 'views'
      case 'extendview':
        return {
          ...baseConfig,
          registerSlug: 'vng-gemma',
          schemaSlug: 'extendview',
          paginationKey: 'extendviews',
          title: 'Beheer Extend Views',
          routeType: 'extendview',
          defaultHeaders: [],
          customHeaders: {},
          modals: [...baseConfig.modals],
        };

      case 'moduleversie':
      case 'applicatieversie':
      case 'applicatiesversie':
        return {
          ...baseConfig,
          schemaSlug: 'moduleversie',
          paginationKey: 'applicatiesversie',
          title: 'Applicatie Versies',
          routeType: 'applicatiesversie',
          defaultHeaders: ['naam', 'versie', 'status', 'releaseDatum'],
          customHeaders: {},
          dynamicActionFilter: ({ slug }) => !['module'].includes(slug),
          modals: [...baseConfig.modals],
        };

      // removed plural alias 'extendviews'
      case 'module':
      case 'applicaties':
      case 'applications':
      case 'modules':
        return {
          ...baseConfig,
          schemaSlug: 'module',
          paginationKey: 'applicaties',
          title: 'Applicaties',
          routeType: 'applicaties',
          disableRelatedCreateActions: true, // Enable koppeling toevoegen voor applicaties
          disableDeleteAction: false, // Enable delete action voor applicaties
          disableImport: true, // Import not needed for applicaties
          disableView: true, // View not needed for applicaties
          extend: ['moduleVersies'],
          defaultHeaders: [
            'naam',
            'referentieComponenten',
            'standaarden',
            'categorie',
            'links',
          ],
          customHeaders: {
            standaarden: {
              id: 'standaarden',
              label: 'Standaarden',
              key: 'standaarden',
              customContent: (row) => {
                if (row?.standaarden && typeof row?.standaarden === 'string') {
                  return <AcColumn key={row.id}>Data invalid</AcColumn>;
                }
                return (
                  <AcColumn key={row.id}>
                    {row?.standaarden?.map((standaard) => standaard.naam).join(', ')}
                  </AcColumn>
                );
              },
            },
          },
          // Unique actions that change based on user role (like publish/depublish toggle)
          // Each action shows different label/params based on user group
          uniqueActions: [
            // Dienst action - changes based on user role
            {
              key: 'addDienst',
              icon: <VISUALS.HAND_SHAKE />,
              condition: (row) => row?.['@self']?.id || row?.id,
              action: 'wizard',
              wizardPath: '/forms/dienst',
              // Dynamic label and params based on user role
              getLabel: (userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? 'Dienst toevoegen'
                  : 'Dienst publiceren',
              getWizardParams: (row, userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? {
                      type: 'ontbrekend-dienst',
                      applicatie: row['@self']?.id || row.id,
                    }
                  : {
                      type: 'dienst',
                      applicatie: row['@self']?.id || row.id,
                    },
              // Show for both user groups
              userGroupFilter: ['gebruik-beheerder', 'aanbod-beheerder'],
            },
            // Gebruik action - changes based on user role
            {
              key: 'addGebruik',
              icon: <VISUALS.CLIPBOARD_CHECK />,
              condition: (row) => row?.['@self']?.id || row?.id,
              action: 'wizard',
              wizardPath: '/forms/gebruik/applicatie',
              // Dynamic label and params based on user role
              getLabel: (userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? 'Applicatie toevoegen'
                  : 'Applicatiegebruik melden',
              getWizardParams: (row, userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? {
                      applicatie: row['@self']?.id || row.id,
                    }
                  : {
                      type: 'ontbrekend-organisatie',
                      applicatie: row['@self']?.id || row.id,
                    },
              // Show for both user groups
              userGroupFilter: ['gebruik-beheerder', 'aanbod-beheerder'],
            },
            // Koppeling action - changes based on user role
            {
              key: 'addKoppeling',
              icon: <VISUALS.LINK />,
              condition: (row) => row?.['@self']?.id || row?.id,
              action: 'wizard',
              wizardPath: '/forms/koppeling',
              // Dynamic label and params based on user role
              getLabel: (userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? 'Koppeling toevoegen'
                  : 'Koppeling publiceren',
              getWizardParams: (row, userGroups) =>
                userGroups.includes('gebruik-beheerder')
                  ? {
                      type: 'aanbieden-koppeling',
                      applicatie: row['@self']?.id || row.id,
                    }
                  : {
                      type: 'eigen-organisatie',
                      applicatie: row['@self']?.id || row.id,
                    },
              // Show for both user groups
              userGroupFilter: ['gebruik-beheerder', 'aanbod-beheerder'],
            },
          ],
          modals: [...baseConfig.modals],
        };

      case 'diensten':
      case 'dienst':
        return {
          ...baseConfig,
          schemaSlug: 'dienst',
          paginationKey: 'diensten',
          title: 'Diensten',
          routeType: 'diensten',
          disableImport: true, // Import not needed for diensten
          disableView: true, // View not needed for diensten
          defaultHeaders: ['name', 'voorzieningName', 'email'],
          customHeaders: {
            voorziening: {
              id: 'voorzieningName',
              label: 'Applicatie',
              key: 'voorziening',
              customContent: (row) => {
                return row?.voorziening?.naam || '-';
              },
              sortComparator: byNested((r) => r?.voorziening?.naam),
            },
            leverancier_naam: {
              id: 'leverancier',
              label: 'Leverancier',
              key: '',
              customContent: (row) => {
                return (
                  <AcColumn key={row.id}>
                    <span>{row?.leverancier?.naam ?? '-'}</span>
                  </AcColumn>
                );
              },
              sortComparator: byNested((r) => r?.leverancier?.id),
            },
            leverancier_email: {
              id: 'email',
              label: 'Email',
              key: '',
              customContent: (row) => {
                return row?.leverancier?.contactgegevens?.email || '-';
              },
              sortComparator: byNested(
                (r) => r?.leverancier?.contactgegevens?.email
              ),
            },
            type: {
              id: 'type',
              label: 'Type',
              key: 'type',
              customContent: (row) => {
                const rawType = row?.type;
                if (!rawType) return '-';
                
                // Check if it's a string that looks like a JSON array
                if (typeof rawType === 'string' && rawType.trim().startsWith('[')) {
                  try {
                    const parsed = JSON.parse(rawType);
                    if (Array.isArray(parsed)) {
                      return parsed
                        .map((item) => (typeof item === 'string' ? item : String(item)))
                        .join(', ');
                    }
                  } catch (e) {
                    // If parsing fails, return as-is
                    return rawType;
                  }
                }
                
                // Handle actual arrays
                if (Array.isArray(rawType) && rawType.length > 0) {
                  return rawType
                    .map((typeItem) =>
                      typeof typeItem === 'object'
                        ? typeItem.naam || typeItem.name || typeItem.label || typeItem
                        : String(typeItem)
                    )
                    .join(', ');
                }
                
                // Handle objects
                if (typeof rawType === 'object') {
                  return String(rawType.naam || rawType.name || rawType.label || rawType);
                }
                
                return String(rawType);
              },
            },
          },
          modals: [...baseConfig.modals],
        };

      case 'gebruiken':
      case 'gebruik':
        return {
          ...baseConfig,
          schemaSlug: 'gebruik',
          paginationKey: 'gebruiken',
          title: 'Gebruik',
          routeType: 'gebruik',
          disableRelatedCreateActions: true,
          disableImport: true, // Import not needed for gebruik
          disableView: true, // View not needed for gebruik
          defaultHeaders: ['type', 'voorzieningId', 'diensten', 'status', 'contact'],
          /**
           * Custom edit URL handler for gebruik
           * If koppelingen array is filled, redirect to koppeling wizard
           * If diensten array is filled, redirect to dienst wizard
           * Otherwise, use default gebruik wizard behavior
           * For Leverancier/Community organizations, use ontbrekend-organisatie type
           * @param {Object} row - The row data containing the gebruik to edit
           * @param {Object} fullActiveOrganisation - The full organization data containing type
           * @returns {string|null} The URL to navigate to for editing, or null to use default behavior
           */
          getEditUrl: (row, fullActiveOrganisation) => {
            const gebruikId = row?.['@self']?.id || row?.id;
            if (!gebruikId) return null;

            // Check if organization type is Leverancier or Community
            // These organization types don't have their own gebruik objects,
            // they only manage gebruik for gemeentes or other organizations
            const orgType = fullActiveOrganisation?.type;
            const isLeverancierOrCommunity =
              orgType === 'Leverancier' || orgType === 'Community';

            // Check if koppelingen array is filled - redirect to koppeling wizard
            // Also check @self.relations.koppelingen as fallback
            const koppelingen =
              row?.koppelingen || row?.['@self']?.relations?.koppelingen;
            if (Array.isArray(koppelingen) && koppelingen.length > 0) {
              const koppelingType = isLeverancierOrCommunity
                ? 'ontbrekend-organisatie'
                : 'eigen-organisatie';
              return `/forms/gebruik/koppeling?type=${koppelingType}&id=${gebruikId}`;
            }

            // Check if diensten array is filled - redirect to dienst wizard
            // Also check @self.relations.diensten as fallback
            const diensten = row?.diensten || row?.['@self']?.relations?.diensten;
            if (Array.isArray(diensten) && diensten.length > 0) {
              const dienstType = isLeverancierOrCommunity
                ? 'ontbrekend-organisatie'
                : 'dienst';
              return `/forms/gebruik/dienst?type=${dienstType}&id=${gebruikId}`;
            }

            // For Leverancier/Community, use ontbrekend-organisatie type for default gebruik wizard
            if (isLeverancierOrCommunity) {
              return `/forms/gebruik/applicatie?type=ontbrekend-organisatie&id=${gebruikId}`;
            }

            // Return null to use default wizard behavior
            return null;
          },
          // extend: ['contactpersoon'],
          // Virtual columns are columns that don't exist in the schema but are added to the table
          virtualColumns: [
            {
              id: 'type',
              order: 0,
              label: 'Type',
              key: 'type',
              customContent: (row) => {
                // Determine icon based on filled fields:
                // - koppelingen filled → Koppeling icon
                // - diensten filled → Dienst icon
                // - neither filled → Applicatie icon
                const hasKoppelingen =
                  Array.isArray(row?.koppelingen) && row.koppelingen.length > 0;
                const hasDiensten =
                  Array.isArray(row?.diensten) && row.diensten.length > 0;

                let IconComponent;
                let title;

                if (hasKoppelingen) {
                  IconComponent = VISUALS.LINK;
                  title = 'Koppeling';
                } else if (hasDiensten) {
                  IconComponent = VISUALS.HAND_SHAKE;
                  title = 'Dienst';
                } else {
                  IconComponent = VISUALS.CUBE;
                  title = 'Applicatie';
                }

                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={title}
                  >
                    <IconComponent
                      style={{
                        width: '24px',
                        height: '24px',
                        color: 'var(--tilburg-interaction-active-color)',
                      }}
                    />
                  </div>
                );
              },
              sortComparator: byNested((row) => {
                // Sort by type name: Applicatie, Dienst, Koppeling (alphabetical)
                const hasKoppelingen =
                  Array.isArray(row?.koppelingen) && row.koppelingen.length > 0;
                const hasDiensten =
                  Array.isArray(row?.diensten) && row.diensten.length > 0;

                if (hasKoppelingen) return 'Koppeling';
                if (hasDiensten) return 'Dienst';
                return 'Applicatie';
              }),
            },
          ],
          customHeaders: {
            contactpersoon: {
              id: 'contactpersoon',
              label: 'Contactpersoon',
              key: 'contactpersoon',
              customContent: (row) => {
                const fullName = `${row?.contactpersoon?.voornaam || ''} ${
                  row?.contactpersoon?.tussenvoegsel || ''
                } ${row?.contactpersoon?.achternaam || ''}`.trim();
                return (
                  fullName || (
                    <ConUuidResolver>{row.contactpersoon}</ConUuidResolver>
                  ) ||
                  '-'
                );
              },
            },
            module: {
              id: 'module',
              label: 'Applicatie',
              key: 'module',
              customContent: (row) => {
                // Try direct property first, then fallback to relations
                const moduleId = row.module || row['@self']?.relations?.module;
                if (!moduleId) return '-';
                return <ConUuidResolver>{String(moduleId)}</ConUuidResolver>;
              },
            },
            moduleVersie: {
              id: 'moduleVersie',
              label: 'Applicatie versie',
              key: 'moduleVersie',
              customContent: (row) => {
                // Try direct property first, then fallback to relations
                const moduleVersieId = row.moduleVersie || row['@self']?.relations?.moduleVersie;
                if (!moduleVersieId) return '-';
                return <ConUuidResolver>{String(moduleVersieId)}</ConUuidResolver>;
              },
            },
          },
          modals: [...baseConfig.modals],
        };

      case 'koppeling':
      case 'koppelingen':
        return {
          ...baseConfig,
          schemaSlug: 'koppeling',
          paginationKey: 'koppeling',
          title: 'Koppelingen',
          routeType: 'koppeling',
          disableImport: true, // Import not needed for koppelingen
          disableView: true, // View not needed for koppelingen
          // Ensure relations are present to compensate for backend bug (moduleA/moduleB null)
          extend: ['@self.relations'],
          defaultHeaders: [
            'naam',
            'moduleA',
            'moduleB',
            'gegevensuitwisselingRichting',
            'type',
          ],
          customHeaders: {
            moduleA: {
              id: 'moduleA',
              label: 'Applicatie A',
              key: 'moduleA',
              customContent: (row) => {
                // Use @self.relations.moduleA instead of direct moduleA property
                const moduleAId = row?.['@self']?.relations?.moduleA || null;
                if (!moduleAId) return '-';
                // Use ConUuidResolver to display the application name
                return <ConUuidResolver>{String(moduleAId)}</ConUuidResolver>;
              },
              sortComparator: byNested((r) => r?.['@self']?.relations?.moduleA),
            },
            moduleB: {
              id: 'moduleB',
              label: 'Applicatie B',
              key: 'moduleB',
              customContent: (row) => {
                // Use @self.relations.moduleB instead of direct moduleB property
                const moduleBId = row?.['@self']?.relations?.moduleB || null;
                if (!moduleBId) return '-';
                // Use ConUuidResolver to display the application name
                return <ConUuidResolver>{String(moduleBId)}</ConUuidResolver>;
              },
              sortComparator: byNested((r) => r?.['@self']?.relations?.moduleA),
            },
          },
          modals: [...baseConfig.modals],
        };

      case 'contactpersoon':
      case 'contactpersonen':
        return {
          ...baseConfig,
          schemaSlug: 'contactpersoon',
          paginationKey: 'contactpersoon',
          title: 'Contactpersoon',
          routeType: 'contactpersoon',
          disableRelatedCreateActions: true, // Only show basic actions for contactpersonen
          disableImport: true, // Import not needed for contactpersonen
          disableView: true, // View not needed for contactpersonen
          defaultHeaders: [
            'username',
            'name',
            'isAanspreekpunt',
            'functie',
            'e-mailadres',
          ],
          customHeaders: {
            username: {
              id: 'username',
              order: 1,
              label: 'Is gebruiker',
              key: 'username',
              customContent: (row) => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingInlineStart: '4px',
                    }}
                  >
                    {row.username ? (
                      <VISUALS.USER_CHECK
                        style={{
                          width: '30px',
                          height: '30px',
                          // color: row.enabled ? 'var(--tilburg-interaction-active-color)' : 'var(--tilburg-color-orange-300)',
                          color: 'var(--tilburg-interaction-active-color)',
                        }}
                      />
                    ) : (
                      <VISUALS.USER_XMARK
                        style={{
                          width: '30px',
                          height: '30px',
                          color: '#9298a0',
                        }}
                      />
                    )}
                  </div>
                );
              },
            },
            voornaam: {
              id: 'name',
              label: 'Naam',
              key: 'voornaam',
              customContent: (row) => {
                const voornaam =
                  row.voornaam && row.voornaam !== 'null' ? row.voornaam : '';
                const achternaam =
                  row.achternaam && row.achternaam !== 'null' ? row.achternaam : '';
                const fullName = [voornaam, achternaam].filter(Boolean).join(' ');
                return fullName || '-';
              },
            },
            eMailadres: {
              id: 'e-mailadres',
              label: 'E-mailadres',
              key: 'eMailadres',
              customContent: (row) => {
                // Display email address from API response
                return row.eMailadres || '-';
              },
            },
          },
          uniqueActions: [],
          modals: [...baseConfig.modals, 'addAccount'],
        };

      default:
        // Generic configuration for dynamic types
        // Assumes: schemaSlug = type, paginationKey = type, routeType = type
        // Title = capitalized type (schema title will override this if available)
        return {
          ...baseConfig,
          schemaSlug: type,
          paginationKey: type,
          title: type.charAt(0).toUpperCase() + type.slice(1), // Remove "Beheer" prefix
          routeType: type,
          extend: [...baseConfig.extend],
          defaultHeaders: [],
          customHeaders: {},
          isDynamicEntry: true,
        };
    }
  },
};

export default BeheerPageConfigFactory;
