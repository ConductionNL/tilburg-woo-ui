import React from 'react';
import { AcColumn } from '@atoms';
import { AcLink } from '@src/molecules';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { isJsonString } from '@src/utilities';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import _ from 'lodash';
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

      // removed plural alias 'extendviews'
      case 'applicaties':
      case 'modules':
        return {
          ...baseConfig,
          schemaSlug: 'module',
          paginationKey: 'applicaties',
          title: 'Applicaties',
          routeType: 'applicaties',
          disableRelatedCreateActions: true, // Enable koppeling toevoegen for applicaties
          disableDeleteAction: false, // Enable delete action for applicaties
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
          uniqueActions: [
            // Commented out: Versie toevoegen action (not reliable yet)
            //   {
            //     key: 'addVersion',
            //     label: 'Versie toevoegen',
            //     icon: <VISUALS.PLUS />,
            //     condition: (row) => true,
            //     action: 'addModuleVersion',
            //   },
            {
              key: 'addKoppeling',
              label: 'Koppeling toevoegen',
              icon: <VISUALS.WAND_SPARKLES_SOLID />,
              condition: (row) => row?.id,
              action: 'wizard', // Special action type to indicate wizard navigation
              wizardPath: '/forms/koppeling',
              wizardParams: (row) => ({
                type: 'aanbieden-koppeling',
                applicatie: row.id,
              }),
            },
          ],
          modals: [...baseConfig.modals],
        };

      case 'diensten':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieningaanbod',
          paginationKey: 'diensten',
          title: 'Beheer Dienst',
          routeType: 'diensten',
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
          },
          modals: [...baseConfig.modals],
        };

      case 'voorzieningen-versie':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieningversie',
          paginationKey: 'voorzieningen-versie',
          title: 'Beheer Voorzieningen Versie',
          routeType: 'voorzieningen-versie',
          defaultHeaders: ['name', 'versienummer', 'releaseDatum', 'status'],
          customHeaders: {
            kwetsbaarheden: {
              id: 'kwetsbaarheden',
              label: 'Kwetsbaarheden',
              key: '',
              customContent: (row) => {
                return (
                  row?.kwetsbaarheden
                    ?.map((kwetsbaarheid) => kwetsbaarheid.titel)
                    .join(', ') || '-'
                );
              },
              sortComparator: byNested((r) => r?.kwetsbaarheden?.[0]?.titel),
            },
            voorzieningName: {
              id: 'voorzieningName',
              label: 'Applicatie',
              key: '',
              customContent: (row) => {
                return row?.voorziening?.naam || '-';
              },
              sortComparator: byNested((r) => r?.voorziening?.naam),
            },
          },
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

      case 'organisaties':
        return {
          ...baseConfig,
          schemaSlug: 'organisatie',
          paginationKey: 'organisaties',
          title: 'Beheer Organisaties',
          routeType: 'organisaties',
          defaultHeaders: [
            'organizationName',
            'website',
            'beoordeling',
            'e-mailadres',
            'type',
          ],
          customHeaders: {
            naam: {
              id: 'organizationName',
              label: 'Naam',
              key: 'naam',
              customContent: (row) => {
                return row.naam || row.naam || '-';
              },
              sortComparator: byNested((r) => r?.naam),
            },
            contactgegevens: {
              id: 'contactDetails',
              label: 'Contactgegevens',
              key: 'contactgegevens',
              customContent: (row) => {
                if (!row?.contactgegevens) return '-';
                return (
                  <AcColumn key={row.id}>
                    <span>
                      {row.contactgegevens.voornaam}{' '}
                      {row.contactgegevens.tussenvoegsel}{' '}
                      {row.contactgegevens.achternaam} / {row.contactgegevens.email}{' '}
                      / {row.contactgegevens.telefoon}
                    </span>
                  </AcColumn>
                );
              },
              sortComparator: byNested((r) => r?.contactgegevens?.voornaam),
            },
            website: {
              id: 'website',
              label: 'Website',
              key: 'website',
              customContent: (row) => {
                if (!row.website) {
                  return '-';
                }

                try {
                  const url = new URL(row.website);
                  return (
                    <AcLink href={url.href} target='_blank'>
                      {url.href}
                    </AcLink>
                  );
                } catch {
                  return row.website;
                }
              },
            },
          },
          statusIcon: {
            customContent: (row) => (
              <div className='ac-beheer-organisaties-name-container'>
                <div
                  className='ac-beheer-organisaties-name-container__icon'
                  data-tooltip-id={TOOLTIP_ID}
                  data-tooltip-content={
                    row['@self'].published ? 'Gepubliceerd' : 'Niet gepubliceerd'
                  }
                >
                  {row['@self'].published ? (
                    <VISUALS.CIRCLE_CHECK className='ac-beheer-publish-icon__check' />
                  ) : (
                    <VISUALS.CIRCLE_EXCLAMATION className='ac-beheer-publish-icon__exclamation' />
                  )}
                </div>
              </div>
            ),
            customHeader: (
              <div className='ac-beheer-organisaties-name-container__icon'></div>
            ),
          },
          uniqueActions: [
            {
              key: 'activate',
              label: 'Activeren',
              icon: <VISUALS.CHECK />,
              condition: (row) => row.beoordeling?.toLowerCase?.() !== 'actief',
              action: 'activate',
            },
            {
              key: 'deactivate',
              label: 'Deactiveren',
              icon: <VISUALS.CLOSE />,
              condition: (row) => row.beoordeling?.toLowerCase?.() === 'actief',
              action: 'deactivate',
            },
            {
              key: 'depublish',
              label: 'Depubliceren',
              icon: <VISUALS.PUBLISH_OFF />,
              condition: (row) =>
                row['@self'].published &&
                row?.beoordeling?.toLowerCase?.() !== 'concept',
              action: 'depublish',
            },
            {
              key: 'addDeelname',
              label: 'Deelname toevoegen',
              icon: <VISUALS.PLUS />,
              condition: (row) => row?.beoordeling?.toLowerCase?.() !== 'concept',
              action: 'addDeelname',
            },
            {
              key: 'removeDeelname',
              label: 'Deelname verlaten',
              icon: <VISUALS.MINUS />,
              condition: (row) =>
                row?.beoordeling?.toLowerCase?.() !== 'concept' &&
                row?.deelnames &&
                row?.deelnames?.length > 0,
              action: 'removeDeelname',
            },
          ],
          modals: [
            ...baseConfig.modals,
            'activate',
            'deactivate',
            'publish',
            'depublish',
            'addDeelname',
            'removeDeelname',
          ],
          customFilterDrawer: 'organisaties',
        };

      case 'kwetsbaarheden':
        return {
          ...baseConfig,
          schemaSlug: 'kwetsbaarheid',
          paginationKey: 'kwetsbaarheden',
          title: 'Beheer Kwetsbaarheden',
          routeType: 'kwetsbaarheden',
          defaultHeaders: ['titel', 'ernst', 'detectedOn', 'status'],
          customHeaders: {
            ontdektOp: {
              id: 'detectedOn',
              label: 'Ontdekt op',
              key: 'ontdektOp',
              customContent: (row) =>
                row.ontdektOp
                  ? !isNaN(new Date(row.ontdektOp).getTime())
                    ? new Date(row.ontdektOp).toLocaleDateString()
                    : row.ontdektOp
                  : '-',
            },
            gepubliceerdOp: {
              id: 'publishedOn',
              label: 'Gepubliceerd op',
              key: 'gepubliceerdOp',
              customContent: (row) =>
                row.gepubliceerdOp
                  ? !isNaN(new Date(row.gepubliceerdOp).getTime())
                    ? new Date(row.gepubliceerdOp).toLocaleDateString()
                    : row.gepubliceerdOp
                  : '-',
            },
          },
          modals: [...baseConfig.modals],
        };

      case 'gebruiken':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieninggebruik',
          paginationKey: 'gebruiken',
          title: 'Beheer Gebruiken',
          routeType: 'gebruiken',
          defaultHeaders: ['voorzieningId', 'diensten', 'status', 'contact'],
          customHeaders: {
            versieId: {
              id: 'versionId',
              label: 'Versie ID',
              key: 'versieId',
              customContent: (row) => {
                return row?.versieId?.id ?? row?.versieId ?? '-';
              },
            },
            organisatieId: {
              id: 'organisatieId',
              label: 'Organisatie',
              key: 'organisatieId',
              customContent: (row) => {
                return (
                  <AcColumn key={row.id}>
                    <span>{row?.organisatieId?.naam ?? '-'}</span>
                  </AcColumn>
                );
              },
            },
            voorzieningId: {
              id: 'voorzieningId',
              label: 'Applicatie',
              key: 'voorzieningId',
              customContent: (row) => {
                return (
                  <AcColumn key={row.id}>
                    <span>{row?.voorzieningId?.naam ?? '-'}</span>
                  </AcColumn>
                );
              },
            },
            beheerder: {
              id: 'beheerderNaam',
              label: 'Beheerder naam',
              key: 'beheerder',
              customContent: (row) => {
                if (
                  typeof row.beheerder === 'string' &&
                  isJsonString(row.beheerder)
                ) {
                  return JSON.parse(row.beheerder)?.naam || '-';
                }
                if (
                  typeof row.beheerder === 'string' &&
                  !isJsonString(row.beheerder)
                ) {
                  return row.beheerder || '-';
                }
                return row?.beheerder?.naam || '-';
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;

                const newA = _.cloneDeep(a);
                const newB = _.cloneDeep(b);

                if (
                  typeof newA.beheerder === 'string' &&
                  isJsonString(newA.beheerder)
                ) {
                  newA.beheerder = JSON.parse(newA.beheerder);
                }
                if (
                  typeof newB.beheerder === 'string' &&
                  isJsonString(newB.beheerder)
                ) {
                  newB.beheerder = JSON.parse(newB.beheerder);
                }

                return ConSorterLogic(
                  newA?.beheerder?.naam,
                  newB?.beheerder?.naam,
                  direction
                );
              },
            },
          },
          uniqueActions: [
            {
              key: 'koppelen',
              label: 'Koppelen',
              icon: <VISUALS.LINK />,
              condition: () => true,
              action: 'koppelen',
            },
          ],
          modals: [...baseConfig.modals, 'koppelen'],
        };

      case 'overeenkomsten':
        return {
          ...baseConfig,
          schemaSlug: 'contract',
          paginationKey: 'overeenkomsten',
          title: 'Beheer Overeenkomsten',
          routeType: 'overeenkomsten',
          defaultHeaders: [
            'name',
            'startDatum',
            'eindDatum',
            'contactPersonProvider',
          ],
          customHeaders: {
            voorzieningAanbod: {
              id: 'voorzieningAanbodNaam',
              label: 'Voorziening aanbod naam',
              key: 'voorzieningAanbod',
              customContent: (row) => {
                return row?.voorzieningAanbod?.naam || '-';
              },
              sortComparator: byNested((r) => r?.voorzieningAanbod?.naam),
            },
            voorzieningGebruik: {
              id: 'voorzieningGebruikId',
              label: 'Voorziening gebruik ID',
              key: 'voorzieningGebruikId',
              customContent: (row) => {
                return row?.voorzieningGebruik?.id || '-';
              },
              sortComparator: byNested((r) => r?.voorzieningGebruik?.id),
            },
            contactpersoonAanbieder: {
              id: 'contactPersonProvider',
              label: 'contactpersoon Aanbieder',
              key: 'contactpersoonAanbieder',
              customContent: (row) => {
                if (!row?.contactpersoonAanbieder) return 'N/A';
                return row.contactpersoonAanbieder.naam;
              },
              sortComparator: byNested((r) => r?.contactpersoonAanbieder?.naam),
            },
            contactpersoonGebruiker: {
              id: 'contactPersonUser',
              label: 'contactpersoon Gebruiker',
              key: 'contactpersoonGebruiker',
              customContent: (row) => {
                if (!row?.contactpersoonGebruiker) return 'N/A';
                return row.contactpersoonGebruiker.naam;
              },
              sortComparator: byNested((r) => r?.contactpersoonGebruiker?.naam),
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
          },
          uniqueActions: [
            {
              key: 'addAccount',
              label: 'Account toevoegen',
              icon: <VISUALS.USER_PLUS />,
              condition: (row) => row.username === null,
              action: 'addAccount',
            },  
            {
              key: 'enableAccount',
              label: 'Account inschakelen',
              icon: <VISUALS.USER_CHECK />,
              condition: (row) => row?.enabled === false,
              action: 'enableAccount',
            },
            {
              key: 'disableAccount',
              label: 'Account uitschakelen',
              icon: <VISUALS.USER_XMARK />,
              condition: (row) => row?.enabled === true,
              action: 'disableAccount',
            },
          ],
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
        };
    }
  },
};

export default BeheerPageConfigFactory;
