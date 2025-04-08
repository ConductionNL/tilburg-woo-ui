import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';

import AcEditVoorzieningModal from '../modals/ac-voorzieningen-form-modal';
import AcDeleteVoorzieningModal from '../modals/ac-delete-voorzieningen-modal';
import ConActionMenu from '../../con-action-menu';

const AcBeheerVoorzieningenDetails = ({ id }) => {
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
          `/openconnector/api/endpoint/voorzieningen/${id}`
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
                        <Paragraph>{data.beschrijving}</Paragraph>
                      </div>

                      <div>
                        <strong>Type:</strong>
                        <Paragraph>{data.voorzieningstypeId}</Paragraph>
                      </div>

                      <div>
                        <strong>Categorie:</strong>
                        <Paragraph>{data.categorie}</Paragraph>
                      </div>

                      <div>
                        <strong>Functionaliteiten:</strong>
                        <Paragraph>{data.functionaliteiten?.join(', ')}</Paragraph>
                      </div>

                      <div>
                        <strong>Doelgroepen:</strong>
                        <Paragraph>{data.doelgroep?.join(', ')}</Paragraph>
                      </div>

                      <div>
                        <strong>Referentie componenten:</strong>
                        <Paragraph>
                          {data.referentieComponenten?.join(', ')}
                        </Paragraph>
                      </div>

                      <div>
                        <strong>standaarden:</strong>
                        <Paragraph>{data.standaarden}</Paragraph>
                      </div>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcEditVoorzieningModal
                  voorziening={data}
                  showModal={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteVoorzieningModal
                  voorzieningen={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/voorzieningen');
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

export default withStore(observer(AcBeheerVoorzieningenDetails));
