import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcButton } from '@src/molecules';
import { AcSideNav, AcLoader } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

import AcOvereenkomstFormModal from '../modals/ac-overeenkomst-form-modal';
import AcDeleteOvereenkomstenModal from '../modals/ac-delete-overeenkomsten-modal';
import ConActionMenu from '../../con-action-menu';
import { getCookie } from '@src/utilities';

const AcBeheerOvereenkomstenDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        `https://vng.test.commonground.nu/apps/openregister/api/objects/contract/contract/${id}`,
        [
          ['_extend[]', 'voorzieningAanbod'],
          ['_extend[]', 'voorzieningGebruik'],
        ],
        null,
        `/beheer/contracten/${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [versionTabIndex, setVersionTabIndex] = useState(0);

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const [openModal, setOpenModal] = useState(null);

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <AcFlex column spacing='xl'>
                <AcFlex spacing='sm' justifyContent='between'>
                  <Heading>{data.contractNummer}</Heading>

                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button icon={<VISUALS.PLUS />}>
                        Toevoegen
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => setOpenModal('edit')}
                      >
                        Bijwerken
                      </ConActionMenu.Button>
                      <ConActionMenu.Divider />
                      <ConActionMenu.Button
                        icon={<VISUALS.TRASHCAN />}
                        onClick={() => setOpenModal('delete')}
                      >
                        Verwijderen
                      </ConActionMenu.Button>
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                </AcFlex>

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      <div>
                        <strong>Voorziening aanbod:</strong>
                        <Paragraph>{data.voorzieningAanbod}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorziening gebruik:</strong>
                        <Paragraph>{data.voorzieningGebruik}</Paragraph>
                      </div>

                      <div>
                        <strong>Start datum:</strong>
                        <Paragraph>{data.startDatum}</Paragraph>
                      </div>

                      <div>
                        <strong>Eind datum:</strong>
                        <Paragraph>{data.eindDatum}</Paragraph>
                      </div>

                      <div>
                        <strong>Contract type:</strong>
                        <Paragraph>{data.contractType}</Paragraph>
                      </div>

                      <div>
                        <strong>Kosten:</strong>
                        <Paragraph>€{data.kosten}</Paragraph>
                      </div>

                      <div>
                        <strong>Kosten periode:</strong>
                        <Paragraph>{data.kostenPeriode}</Paragraph>
                      </div>

                      <div>
                        <strong>Contact persoon aanbieder:</strong>
                        <Paragraph>{data.contactPersoonAanbieder?.naam}</Paragraph>
                        <Paragraph>{data.contactPersoonAanbieder?.email}</Paragraph>
                      </div>

                      <div>
                        <strong>Contact persoon gebruiker:</strong>
                        <Paragraph>{data.contactPersoonGebruiker?.naam}</Paragraph>
                        <Paragraph>{data.contactPersoonGebruiker?.email}</Paragraph>
                      </div>

                      <div>
                        <strong>Document referentie:</strong>
                        <Paragraph>{data.documentReferentie}</Paragraph>
                      </div>

                      <div>
                        <strong>Status:</strong>
                        <Paragraph>{data.status}</Paragraph>
                      </div>

                      <div>
                        <strong>Opmerkingen:</strong>
                        <Paragraph>{data.opmerkingen}</Paragraph>
                      </div>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcOvereenkomstFormModal
                  overeenkomst={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteOvereenkomstenModal
                  overeenkomsten={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/overeenkomsten');
                  }}
                />
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOvereenkomstenDetails));
