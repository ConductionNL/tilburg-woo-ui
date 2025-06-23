import React, { useEffect, useRef, useState, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import { AcBeheerError } from '@views/ac-beheer';
import { BASE_URL } from '../../ac-beheer';
import { sortPropertiesByOrder } from '@src/utilities';
import { AcCheckbox } from '@molecules';
import { ConFileDropZone } from '../../import-modal/con-file-dropzone';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@utrecht/component-library-react';
import AcColumn from '@atoms/ac-column/ac-column';
import AcApplicatiesFormModal from '../modals/ac-applicaties-form-modal';
import AcDeleteApplicatiesModal from '../modals/ac-delete-applicaties-modal';
import ConActionMenu from '../../con-action-menu';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import _ from 'lodash';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcGebruikenFormModal from '../../ac-gebruiken/modals/ac-gebruiken-form-modal';
import AcDienstFormModal from '../../ac-dienst/modals/ac-dienst-form-modal';
import ConObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';

const AcBeheerApplicatiesDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [files, setFiles] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [standardsDataProperties, setStandardsDataProperties] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorziening';

  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const extend = [
    ['_extend[]', 'standaarden'],
    ['_extend[]', 'standaarden.@self.schema'],
    ['_extend[]', 'referentieComponenten'],
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/apps/${endpoint}/${id}`,
          extend,
          null,
          `/beheer/applicaties/${id}`
        ),
        makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/${schemaSlug}`,
          null,
          null,
          `/beheer/applicaties/${id}`
        ),
      ]);

      if (!response.ok || !schemaResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const jsonResponse = response.data;
      const schemaJsonResponse = schemaResponse.data;

      const data = jsonResponse;
      const dataProperties = schemaJsonResponse.properties;
      const standardsDataProperties =
        response.data.standaarden?.[0]?.['@self']?.schema?.properties;

      setData(data);
      setDataProperties(dataProperties);
      setStandardsDataProperties(sortPropertiesByOrder(standardsDataProperties));
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

  const tableRef = useRef(null);

  const defaultHeaders = ['naam', 'beschrijving', 'standaardtype', 'versie'];

  const headers = useMemo(() => {
    if (!standardsDataProperties) return [];

    return Object.entries(standardsDataProperties)
      .filter(([key, value]) => value.visible !== false)
      .map(([key, value]) => {
        // Generate standard header from schema
        return {
          id: key,
          label: _.upperFirst(key),
          key: key,
        };
      });
  }, [standardsDataProperties]);

  useEffect(() => {
    if (headers.length > 0) {
      setTableHeaders(
        headers.filter((header) => defaultHeaders.includes(header.id))
      );
    }
  }, [headers]);

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

                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button
                        icon={<VISUALS.EYE />}
                        onClick={() => {
                          window.open(`/publicatie/${data.id}`, '_blank');
                        }}
                      >
                        Bekijk in catalogus
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => setOpenModal('edit')}
                      >
                        Bijwerken
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.CLOUD />}
                        onClick={() => setOpenModal('addGebruik')}
                      >
                        Gebruiken aanmaken
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.HAND_HOLDING />}
                        onClick={() => setOpenModal('addDienst')}
                      >
                        Dienst toevoegen
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
                      {Object.entries(dataProperties)
                        .filter(
                          ([key]) =>
                            ![
                              'id',
                              'naam',
                              'standaarden',
                              'referentieComponent',
                            ].includes(key)
                        )
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong>{_.startCase(key)}:</strong>
                            <Paragraph>
                              {formatBySchema(schemaProperties, data, key)}
                            </Paragraph>
                          </div>
                        ))}
                    </div>

                    <div>
                      <AcTabs
                        selectedIndex={tabIndex}
                        onSelect={(index) => setTabIndex(index)}
                      >
                        <AcTabList>
                          <AcTab selected={tabIndex === 0}>Bestanden</AcTab>
                          <AcTab selected={tabIndex === 1}>Standaarden</AcTab>
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          <ConObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 1}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableCell>Naam</TableCell>
                                <TableCell>ReferentieComponent</TableCell>
                                <TableCell>Compliancy</TableCell>
                                <TableCell>Testrapport</TableCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.standaarden.map((standard) => (
                                <TableRow
                                  className='ac-applicaties-details--table-row'
                                  key={standard.id}
                                >
                                  <TableCell>{standard.naam}</TableCell>
                                  <TableCell>
                                    {data.referentieComponenten[0].name}
                                  </TableCell>
                                  <TableCell className='ac-applicaties-details--compliance-checkbox'>
                                    <AcCheckbox />
                                  </TableCell>
                                  <TableCell>
                                    <ConFileDropZone
                                      className='ac-applicaties-details--file-dropzone'
                                      disabled={true}
                                      files={[]}
                                      onFilesChange={() => {}}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AcTabPanel>
                      </AcTabs>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcApplicatiesFormModal
                  applicatie={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteApplicatiesModal
                  applicaties={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/applicaties');
                  }}
                />

                <AcGebruikenFormModal
                  preSelectedVoorzieningId={data.id}
                  showModal={openModal === 'addGebruik'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={async (e) => {
                    const gebruik = e.data;
                    navigate(`/beheer/gebruiken/${gebruik.id}`);
                  }}
                />

                <AcDienstFormModal
                  showModal={openModal === 'addDienst'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={async (e) => {
                    const data = e.data;
                    navigate(`/beheer/diensten/${data.id}`);
                  }}
                  preSelectedVoorziening={data.id}
                />
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerApplicatiesDetails));
