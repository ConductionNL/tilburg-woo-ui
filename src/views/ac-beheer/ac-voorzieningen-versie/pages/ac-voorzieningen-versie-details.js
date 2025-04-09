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

import AcEditVoorzieningVersieModal from '../modals/ac-voorziening-versie-form-modal';
import AcDeleteVoorzieningVersieModal from '../modals/ac-delete-voorziening-versie-modal';
import ConActionMenu from '../../con-action-menu';

const AcBeheerVoorzieningenVersieDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/voorzieningversies/${id}`
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
                  <Heading>{data.naam}</Heading>

                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Items>
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
                    </ConActionMenu.Items>
                  </ConActionMenu>
                </AcFlex>

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      <div>
                        <strong>Omschrijving:</strong>
                        <Paragraph>{data.omschrijving}</Paragraph>
                      </div>

                      <div>
                        <strong>Release Notes:</strong>
                        <Paragraph>{data.releaseNotes}</Paragraph>
                      </div>

                      <div>
                        <strong>Nummer:</strong>
                        <Paragraph>{data.nummer}</Paragraph>
                      </div>

                      <div>
                        <strong>Status:</strong>
                        <Paragraph>{data.status}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorziening Aanbod ID:</strong>
                        <Paragraph>{data.voorzieningaanbodId}</Paragraph>
                      </div>

                      <div>
                        <strong>Productie datum:</strong>
                        <Paragraph>{data.productieDatum}</Paragraph>
                      </div>

                      <div>
                        <strong>Eind datum:</strong>
                        <Paragraph>{data.eindeDatum}</Paragraph>
                      </div>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcEditVoorzieningVersieModal
                  voorziening={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteVoorzieningVersieModal
                  voorzieningen={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/voorzieningen-versie');
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

export default withStore(observer(AcBeheerVoorzieningenVersieDetails));
