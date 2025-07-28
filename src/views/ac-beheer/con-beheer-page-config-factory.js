// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcColumn } from '@atoms';
import { AcLink } from '@src/molecules';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { isJsonString } from '@src/utilities';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import _ from 'lodash';

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
    const baseConfig = {
      registerSlug: 'voorzieningen',
      extend: [],
      customHeaders: {},
      defaultHeaders: [],
      actionButtons: null,
      customFilterDrawer: null,
      modals: [],
      uniqueActions: [],
      statusIcon: null,
    };

    switch (type) {
      case 'applicaties':
        return {
          ...baseConfig,
          schemaSlug: 'voorziening',
          paginationKey: 'applicaties',
          title: 'Beheer Applicaties',
          routeType: 'applicaties',
          extend: [['_extend[]', 'standaarden']],
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
          modals: ['add', 'edit', 'delete', 'import'],
        };

      case 'diensten':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieningaanbod',
          paginationKey: 'diensten',
          title: 'Beheer Dienst',
          routeType: 'diensten',
          extend: [
            ['_extend[]', 'voorziening'],
            ['_extend[]', 'leverancier'],
          ],
          defaultHeaders: ['name', 'voorzieningName', 'email'],
          customHeaders: {
            voorziening: {
              id: 'voorzieningName',
              label: 'Applicatie',
              key: 'voorziening',
              customContent: (row) => {
                return row?.voorziening?.naam || '-';
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const nameA = a?.voorziening?.naam || '';
                const nameB = b?.voorziening?.naam || '';
                return ConSorterLogic(nameA, nameB, direction);
              },
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
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const idA = a?.leverancier?.id || '';
                const idB = b?.leverancier?.id || '';
                return ConSorterLogic(idA, idB, direction);
              },
            },
            leverancier_email: {
              id: 'email',
              label: 'Email',
              key: '',
              customContent: (row) => {
                return row?.leverancier?.contactgegevens?.email || '-';
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const emailA = a?.leverancier?.contactgegevens?.email || '';
                const emailB = b?.leverancier?.contactgegevens?.email || '';
                return ConSorterLogic(emailA, emailB, direction);
              },
            },
          },
          modals: ['add', 'edit', 'delete', 'import'],
        };

      case 'voorzieningen-versie':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieningversie',
          paginationKey: 'voorzieningen-versie',
          title: 'Beheer Voorzieningen Versie',
          routeType: 'voorzieningen-versie',
          extend: [
            ['_extend[]', 'voorziening'],
            ['_extend[]', 'kwetsbaarheden'],
          ],
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
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aTitle = a?.kwetsbaarheden?.[0]?.titel;
                const bTitle = b?.kwetsbaarheden?.[0]?.titel;
                return ConSorterLogic(aTitle, bTitle, direction);
              },
            },
            voorzieningName: {
              id: 'voorzieningName',
              label: 'Applicatie',
              key: '',
              customContent: (row) => {
                return row?.voorziening?.naam || '-';
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aTitle = a?.voorziening?.naam || '';
                const bTitle = b?.voorziening?.naam || '';
                return ConSorterLogic(aTitle, bTitle, direction);
              },
            },
          },
          modals: ['add', 'edit', 'delete', 'import'],
        };

      case 'organisaties':
        return {
          ...baseConfig,
          schemaSlug: 'organisatie',
          paginationKey: 'organisaties',
          title: 'Beheer Organisaties',
          routeType: 'organisaties',
          extend: [['_extend[]', 'contactgegevens']],
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
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aName = a.naam || a.naam || undefined;
                const bName = b.naam || b.naam || undefined;
                return ConSorterLogic(aName, bName, direction);
              },
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
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aName = a?.contactgegevens?.voornaam;
                const bName = b?.contactgegevens?.voornaam;
                return ConSorterLogic(aName, bName, direction);
              },
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
              key: 'publish',
              label: 'Publiceren',
              icon: <VISUALS.PUBLISH />,
              condition: (row) =>
                !row['@self'].published &&
                row?.beoordeling?.toLowerCase?.() !== 'concept',
              action: 'publish',
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
            'add',
            'edit',
            'delete',
            'import',
            'activate',
            'deactivate',
            'publish',
            'depublish',
            'addDeelname',
            'removeDeelname',
          ],
          customFilterDrawer: 'organisatie',
        };

      case 'kwetsbaarheden':
        return {
          ...baseConfig,
          schemaSlug: 'kwetsbaarheid',
          paginationKey: 'kwetsbaarheden',
          title: 'Beheer Kwetsbaarheden',
          routeType: 'kwetsbaarheden',
          extend: [],
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
          modals: ['add', 'edit', 'delete', 'import'],
        };

      case 'gebruiken':
        return {
          ...baseConfig,
          schemaSlug: 'voorzieninggebruik',
          paginationKey: 'gebruiken',
          title: 'Beheer Gebruiken',
          routeType: 'gebruiken',
          extend: [
            ['_extend[]', 'voorzieningId'],
            ['_extend[]', 'organisatieId'],
          ],
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
                  !isJsonString(newB.beheerder)
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
          modals: ['add', 'edit', 'delete', 'import', 'koppelen'],
        };

      case 'overeenkomsten':
        return {
          ...baseConfig,
          schemaSlug: 'contract',
          paginationKey: 'overeenkomsten',
          title: 'Beheer Overeenkomsten',
          routeType: 'overeenkomsten',
          extend: [['_extend[]', 'all']],
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
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aName = a?.voorzieningAanbod?.naam;
                const bName = b?.voorzieningAanbod?.naam;
                return ConSorterLogic(aName, bName, direction);
              },
            },
            voorzieningGebruik: {
              id: 'voorzieningGebruikId',
              label: 'Voorziening gebruik ID',
              key: 'voorzieningGebruikId',
              customContent: (row) => {
                return row?.voorzieningGebruik?.id || '-';
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aId = a?.voorzieningGebruik?.id;
                const bId = b?.voorzieningGebruik?.id;
                return ConSorterLogic(aId, bId, direction);
              },
            },
            contactpersoonAanbieder: {
              id: 'contactPersonProvider',
              label: 'contactpersoon Aanbieder',
              key: 'contactpersoonAanbieder',
              customContent: (row) => {
                if (!row?.contactpersoonAanbieder) return 'N/A';
                return row.contactpersoonAanbieder.naam;
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aName = a?.contactpersoonAanbieder?.naam;
                const bName = b?.contactpersoonAanbieder?.naam;
                return ConSorterLogic(aName, bName, direction);
              },
            },
            contactpersoonGebruiker: {
              id: 'contactPersonUser',
              label: 'contactpersoon Gebruiker',
              key: 'contactpersoonGebruiker',
              customContent: (row) => {
                if (!row?.contactpersoonGebruiker) return 'N/A';
                return row.contactpersoonGebruiker.naam;
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aName = a?.contactpersoonGebruiker?.naam;
                const bName = b?.contactpersoonGebruiker?.naam;
                return ConSorterLogic(aName, bName, direction);
              },
            },
          },
          modals: ['add', 'edit', 'delete', 'import'],
        };

      case 'contactpersonen':
        return {
          ...baseConfig,
          schemaSlug: 'contactpersoon',
          paginationKey: 'contactpersonen',
          title: 'Beheer Contactpersonen',
          routeType: 'contactpersonen',
          extend: [],
          defaultHeaders: ['name', 'status', 'lastActivity', 'email', 'organisatie'],
          customHeaders: {
            voornaam: {
              id: 'name',
              label: 'Naam',
              key: 'voornaam',
              customContent: (row) => `${row.voornaam} ${row.achternaam}`,
            },
            organisatie: {
              id: 'organisatie',
              label: 'Organisatie',
              key: 'organisatie',
              customContent: (row) =>
                row.organisatie?.naam || row.organisatie || '-',
            },
            actief: {
              id: 'status',
              label: 'Status',
              key: 'actief',
              customContent: (row) => (
                <span>{row.actief ? 'Actief' : 'Inactief'}</span>
              ),
            },
            voorkeuren: {
              id: 'preferences',
              label: 'Voorkeuren',
              key: 'voorkeuren',
              customContent: (row) => {
                if (!row?.voorkeuren) return '-';
                return `Taal: ${row.voorkeuren.taal}, Thema: ${row.voorkeuren.thema}`;
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                return ConSorterLogic(
                  a?.voorkeuren?.taal,
                  b?.voorkeuren?.taal,
                  direction
                );
              },
            },
          },
          uniqueActions: [
            {
              key: 'publish',
              label: 'Publiceren',
              icon: <VISUALS.PUBLISH />,
              condition: (row) => !row['@self'].published,
              action: 'publish',
            },
            {
              key: 'depublish',
              label: 'Depubliceren',
              icon: <VISUALS.PUBLISH_OFF />,
              condition: (row) => row['@self'].published,
              action: 'depublish',
            },
          ],
          modals: ['add', 'edit', 'delete', 'import', 'publish', 'depublish'],
        };

      default:
        throw new Error(`Unknown beheer page type: ${type}`);
    }
  },
};

export default BeheerPageConfigFactory;
