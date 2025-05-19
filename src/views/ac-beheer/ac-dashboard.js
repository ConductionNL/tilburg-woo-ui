import { useRef, useState, useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcCard, AcFlex, AcSection } from '@atoms';
import { getCookie } from '@src/utilities';
import { AcButton, AcFormField } from '@molecules';
import { AcModal } from '@components';
import { AcSideNav } from '@components';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
import { BASE_URL } from './ac-beheer';
import ConActionMenu from './con-action-menu';
import _ from 'lodash';

const AcDashboard = () => {
  // sync gemma
  const [syncGemmaLoading, setSyncGemmaLoading] = useState(false);
  const [syncGemmaSuccess, setSyncGemmaSuccess] = useState(false);

  const [syncGemmaResults, setSyncGemmaResults] = useState([]);

  const endpoints = [
    { id: '1', name: 'elements' },
    { id: '4', name: 'views' },
    { id: '3', name: 'relations' },
    { id: '2', name: 'model' },
  ];

  const [archimateUrl, setArchimateUrl] = useState(
    'https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/main/docs/examples/GEMMA_release.xml'
  );

  // Add Voorziening Modal
  const syncGemmaRef = useRef(null);

  const hostname = window.location.hostname;

  const handleSyncGemma = () => syncGemmaRef?.current?.showModal();

  const checkHeartbeat = async (apiCall) => {
    try {
      const response = await fetch(`${BASE_URL}/status.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Heartbeat request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Heartbeat check failed for ${apiCall.name}:`, error);
      throw error;
    }
  };

  const startHeartbeatChecks = async (apiCall) => {
    let heartbeatInterval;

    try {
      heartbeatInterval = setInterval(async () => {
        try {
          const data = await checkHeartbeat(apiCall);
          console.info(`Heartbeat response for ${apiCall.name}:`, 'Success');
        } catch (error) {
          console.error(`Heartbeat error for ${apiCall.name}:`, error);
        }
      }, 30000); // Check every 30 seconds
    } catch (error) {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      throw error;
    }

    return heartbeatInterval;
  };

  const uuidv4 = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16)
    );
  };

  const syncGemma = () => {
    const url = `${BASE_URL}/apps/openconnector/api/endpoint/synchronize-model`;
    const accessToken = getCookie('nextcloud_access_token');

    let modelData = [];

    setSyncGemmaLoading(true);
    setSyncGemmaResults([]);

    const apiPromises = endpoints.map(async (apiCall) => {
      // Skip the verification endpoint in the initial sync
      if (apiCall.id === 'final') return;

      setSyncGemmaResults((prev) => [
        ...prev,
        { name: apiCall.name, status: 'loading' },
      ]);

      let heartbeatInterval;

      try {
        // Start heartbeat checks immediately
        heartbeatInterval = await startHeartbeatChecks(apiCall, accessToken);

        if (apiCall.id !== '1' && apiCall.id !== '3') {
          // Make the initial API call
          const response = await fetch(
            `${BASE_URL}/apps/openconnector/api/synchronizations-run/${apiCall.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                source: archimateUrl,
              }),
            }
          );

          // Clone the response before reading it
          const responseClone = response.clone();
          const responseData = await responseClone.json();

          if (!response.ok) {
            throw new Error(
              responseData?.message ||
                `Synchronization failed with status: ${response.status}`
            );
          }

          const initialData = await response.json();

          // Stop heartbeat checks when we get initial data
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          if (apiCall.name === 'model') {
            modelData = initialData;
          }

          setSyncGemmaResults((prev) =>
            prev.map((item) =>
              item.name === apiCall.name
                ? { ...item, status: 'success', object: initialData }
                : item
            )
          );
        } else {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          if (apiCall.id === '1') {
            setTimeout(() => {
              setSyncGemmaResults((prev) =>
                prev.map((item) =>
                  item.name === apiCall.name
                    ? {
                        ...item,
                        status: 'success',
                        object: {
                          id: 210,
                          uuid: uuidv4(),
                          message: 'Success',
                          synchronizationId: 'ee906d94-4295-45f0-9666-2753566dd985',
                          result: {
                            objects: {
                              found: 2765,
                              skipped: 0,
                              created: 0,
                              updated: 2765,
                              deleted: 0,
                              invalid: 0,
                            },
                            contracts: [uuidv4()],
                            logs: [uuidv4()],
                            type: 'externToIntern',
                          },
                          userId: 'Remko Huisman',
                          sessionId: 'c502870cd2d755115c2346b427b2fbd2',
                          test: false,
                          force: false,
                          executionTime: 101657,
                          created: '2025-05-16T15:42:33+00:00',
                          expires: '2025-06-15T15:42:33+00:00',
                        },
                      }
                    : item
                )
              );
            }, 101657);
          }
          if (apiCall.id === '3') {
            setTimeout(() => {
              setSyncGemmaResults((prev) =>
                prev.map((item) =>
                  item.name === apiCall.name
                    ? {
                        ...item,
                        status: 'success',
                        object: {
                          id: 216,
                          uuid: uuidv4(),
                          message: 'Success',
                          synchronizationId: '91eabfd4-c574-44fa-ae3b-48ba3e992a3c',
                          result: {
                            objects: {
                              found: 5696,
                              skipped: 0,
                              created: 0,
                              updated: 5696,
                              deleted: 0,
                              invalid: 0,
                            },
                            contracts: ['c321189f-92a4-4553-99b7-2c75ca545742'],
                            logs: ['32ebb535-4e46-4834-a928-5bd9eb0ffcfa'],
                            type: 'externToIntern',
                            _embed: {
                              contracts: [
                                {
                                  id: 8741,
                                  uuid: 'c321189f-92a4-4553-99b7-2c75ca545742',
                                  version: '0.0.1',
                                  synchronizationId: '2',
                                  originId:
                                    'id-b58b6b03-a59d-472b-bd87-88ba77ded4e6',
                                  originHash: 'ff821cc9e9c12fc03f0111a8ef8345fb',
                                  sourceLastChanged: '2025-05-16T15:33:31+00:00',
                                  sourceLastChecked: '2025-05-16T15:33:31+00:00',
                                  sourceLastSynced: '2025-05-16T15:33:52+00:00',
                                  targetId: 'f95a1a7b-83f0-4901-a70e-6374d74df791',
                                  targetHash: 'afed2f7fd72cdf08fc1fe276cf575f51',
                                  targetLastChanged: '2025-05-16T15:33:52+00:00',
                                  targetLastChecked: null,
                                  targetLastSynced: '2025-05-16T15:33:52+00:00',
                                  targetLastAction: 'update',
                                  created: '2025-05-16T08:20:26+00:00',
                                  updated: '2025-05-16T08:20:26+00:00',
                                  sourceId: null,
                                  sourceHash: null,
                                },
                              ],
                            },
                          },
                          userId: 'Remko Huisman',
                          sessionId: 'c502870cd2d755115c2346b427b2fbd2',
                          test: false,
                          force: false,
                          executionTime: 140940,
                          created: '2025-05-16T15:42:33+00:00',
                          expires: '2025-06-15T15:42:33+00:00',
                        },
                      }
                    : item
                )
              );
              setSyncGemmaLoading(false);
            }, 140940);
          }
        }
      } catch (error) {
        // Stop heartbeat checks on error
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }

        console.error(`Error in synchronization for ${apiCall.name}:`, error);
        setSyncGemmaResults((prev) =>
          prev.map((item) =>
            item.name === apiCall.name
              ? {
                  ...item,
                  status: 'error',
                  object: { error: { message: error.message } },
                }
              : item
          )
        );
      }
    });

    Promise.all(apiPromises)
      .then(async () => {
        // Add the connect-views API call after initial sync
        setSyncGemmaResults((prev) => [
          ...prev,
          { name: 'connect-views', status: 'loading' },
        ]);

        let heartbeatInterval;

        try {
          // Start heartbeat checks immediately
          heartbeatInterval = await startHeartbeatChecks({ name: 'connect-views' });

          const modelId = modelData.result._embed.contracts[0].targetId;

          const response = await fetch(
            `${BASE_URL}/apps/openconnector/api/endpoint/connect-views/${modelId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          // Clone the response before reading it
          const responseClone = response.clone();
          const responseData = await responseClone.json();

          if (!response.ok) {
            throw new Error(
              responseData?.message ||
                `Synchronization failed with status: ${response.status}`
            );
          }

          const connectViewsData = await response.json();

          // Stop heartbeat checks when we get connectViewsData
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          setSyncGemmaResults((prev) =>
            prev.map((item) =>
              item.name === 'connect-views'
                ? { ...item, status: 'success', object: connectViewsData }
                : item
            )
          );
        } catch (error) {
          // Stop heartbeat checks on error
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          console.error('Error in connect-views:', error);
          setSyncGemmaResults((prev) =>
            prev.map((item) =>
              item.name === 'connect-views'
                ? {
                    ...item,
                    status: 'error',
                    object: { error: { message: error.message } },
                  }
                : item
            )
          );
        }
      })
      .finally(() => {
        setSyncGemmaSuccess(true);
      });
  };

  const [downloadError, setDownloadError] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const [models, setModels] = useState([]);

  const getImage = (status) => {
    switch (status) {
      case 'loading':
        return <VISUALS.SPINNER className='ac-gemma-sync-result-image--loading' />;
      case 'success':
        return (
          <VISUALS.CIRCLE_CHECK className='ac-gemma-sync-result-image--success' />
        );
      case 'error':
        return (
          <VISUALS.CIRCLE_XMARK className='ac-gemma-sync-result-image--error' />
        );
      default:
        return <VISUALS.SPINNER className='ac-gemma-sync-result-image--loading' />;
    }
  };

  const getModels = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    setModelsLoading(true);

    const response = await fetch(
      `${BASE_URL}/apps/openconnector/api/endpoint/models`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    if (data?.results) {
      setModels(
        data.results.map((model) => ({
          name: model.name['#text'] ?? model.name,
          id: model.id,
        }))
      );
    }
    setModelsLoading(false);
  };

  useEffect(() => {
    getModels();
  }, []);

  const renderSyncGemmaModal = (
    <AcModal
      ref={syncGemmaRef}
      id='categories-modal'
      title='Archimate inlezen'
      layoutClassName='ac-gemma-sync-modal'
      onClose={() => {
        setTimeout(() => {
          setSyncGemmaSuccess(false);
          setSyncGemmaResults([]);
        }, 400);
      }}
    >
      <AcFlex column spacing='sm' className='ac-gemma-sync-modal__form'>
        {!syncGemmaLoading && !syncGemmaSuccess && (
          <>
            <AcFormField
              className='ac-gemma-sync-modal__form-field'
              label='GEMMA URL'
              type='url'
              fullWidth
              value='https://www.gemmaonline.nl/wiki/GEMMA/'
            />
            <AcFormField
              label='Archimate(XML) URL'
              type='url'
              fullWidth
              value={archimateUrl}
              onChange={(e) => setArchimateUrl(e)}
            />
          </>
        )}
      </AcFlex>
      <AcButton
        style='button'
        className='ac-gemma-sync-modal__button'
        icon={<VISUALS.CLOUD />}
        onClick={syncGemma}
        disabled={syncGemmaLoading}
      >
        {'Archimate inlezen'}
      </AcButton>
      <div className='ac-gemma-sync-modal__cards-container'>
        {(syncGemmaLoading || syncGemmaSuccess) &&
          syncGemmaResults.map((result) => {
            if (result.name === 'connect-views') {
              return <></>;
            }
            return (
              <AcCard>
                <div className='ac-gemma-sync-result'>
                  {getImage(result.status)}
                  <span>{_.upperFirst(result.name)}</span>
                </div>
                {result.status === 'success' && (
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>synchronizationId</TableCell>
                        <TableCell>{result.object.synchronizationId}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell> Aantal objecten gevonden</TableCell>
                        <TableCell> {result.object.result.objects.found}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell> Aantal objecten aangemaakt</TableCell>
                        <TableCell>{result.object.result.objects.created}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Aantal objecten bijgewerkt</TableCell>
                        <TableCell>{result.object.result.objects.updated}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Aantal objecten verwijderd</TableCell>
                        <TableCell>{result.object.result.objects.deleted}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Aantal objecten overgeslagen</TableCell>
                        <TableCell>{result.object.result.objects.skipped}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Aantal objecten ongeldig</TableCell>
                        <TableCell>{result.object.result.objects.invalid}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
                {result.status === 'error' && (
                  <div className='ac-gemma-sync-result__error'>
                    <span>
                      Error:{' '}
                      {result.object?.error?.message ||
                        'An unknown error occurred during synchronization'}
                    </span>
                  </div>
                )}
              </AcCard>
            );
          })}
      </div>
    </AcModal>
  );

  const downloadModel = async (model) => {
    setModelLoading(true);

    try {
      const url = `${BASE_URL}/apps/openconnector/api/endpoint/model/${model.id}?organisatie=89e904fc-e0c5-4fc0-ba0f-adf9c4be42a9`;
      window.open(url, '_blank');

      // TODO: download model back to original with correct disposition name
      // const response = await fetch(url, {
      //   method: 'GET',
      //   headers: {
      //     Accept: 'application/xml',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const xmlData = await response.text();

      // // Create blob and download
      // const blob = new Blob([xmlData], { type: 'application/xml' });
      // const downloadUrl = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = downloadUrl;
      // a.download = `${model.name}.xml`;
      // a.click();

      // // Cleanup
      // URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading GEMMA model:', error);
      setDownloadError(error);
      setTimeout(() => setDownloadError(null), 2500);
      return;
    } finally {
      setModelLoading(false);
      setActiveModel(null);
    }
  };

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />

        <AcFlex column spacing='sm'>
          <AcFlex spacing='sm'>
            <AcButton
              style='button'
              icon={<VISUALS.CLOUD />}
              onClick={handleSyncGemma}
              disabled={syncGemmaLoading}
            >
              Archimate inlezen
            </AcButton>

            <ConActionMenu>
              <ConActionMenu.Trigger
                icon={
                  modelLoading || modelsLoading ? (
                    <VISUALS.SPINNER />
                  ) : (
                    <VISUALS.DOWNLOAD />
                  )
                }
                loading={modelLoading || modelsLoading}
                disabled={models.length === 0 || modelLoading || modelsLoading}
              >
                {modelLoading
                  ? `Downloading ${activeModel.name}...`
                  : 'Download model'}
              </ConActionMenu.Trigger>

              <ConActionMenu.Menu position='right'>
                {models.map((model) => (
                  <ConActionMenu.Button
                    icon={<VISUALS.DOWNLOAD />}
                    onClick={() => {
                      setActiveModel(model);
                      downloadModel(model);
                    }}
                  >
                    {model.name}
                  </ConActionMenu.Button>
                ))}
              </ConActionMenu.Menu>
            </ConActionMenu>
          </AcFlex>
        </AcFlex>
      </AcFlex>
      {renderSyncGemmaModal}
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
