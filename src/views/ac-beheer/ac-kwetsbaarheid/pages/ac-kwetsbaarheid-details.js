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

import AcKwetsbaarheidFormModal from '../modals/ac-kwetsbaarheid-form-modal';
import AcDeleteKwetsbaarheidModal from '../modals/ac-delete-kwetsbaarheid-modal';
import ConActionMenu from '../../con-action-menu';

const AcBeheerKwetsbaarheidDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/kwetsbaarheden/${id}`
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
                  <Heading>{data.titel}</Heading>

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
                        <strong>Voorzieningversie ID:</strong>
                        <Paragraph>{data.voorzieningversieId}</Paragraph>
                      </div>

                      <div>
                        <strong>CVE Nummer:</strong>
                        <Paragraph>{data.cveNummer}</Paragraph>
                      </div>

                      <div>
                        <strong>Beschrijving:</strong>
                        <Paragraph>{data.beschrijving}</Paragraph>
                      </div>

                      <div>
                        <strong>Ernst:</strong>
                        <Paragraph>{data.ernst}</Paragraph>
                      </div>

                      <div>
                        <strong>Ontdekt op:</strong>
                        <Paragraph>{data.ontdektOp}</Paragraph>
                      </div>

                      <div>
                        <strong>Gepubliceerd op:</strong>
                        <Paragraph>{data.gepubliceerdOp}</Paragraph>
                      </div>

                      <div>
                        <strong>Opgelost in:</strong>
                        <Paragraph>{data.opgelostIn}</Paragraph>
                      </div>

                      <div>
                        <strong>Mitigatie:</strong>
                        <Paragraph>{data.mitigatie}</Paragraph>
                      </div>

                      <div>
                        <strong>Referenties:</strong>
                        <Paragraph>
                          {data.referenties.map((ref, index) => (
                            <span key={index}>
                              <a
                                href={ref}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                {ref}
                              </a>
                              {index < data.referenties.length - 1 && ', '}
                            </span>
                          ))}
                        </Paragraph>
                      </div>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcKwetsbaarheidFormModal
                  kwetsbaarheid={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteKwetsbaarheidModal
                  kwetsbaarheden={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/kwetsbaarheden');
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

export default withStore(observer(AcBeheerKwetsbaarheidDetails));
