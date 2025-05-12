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
import ConActionMenu from './con-action-menu';
import _ from 'lodash';

const AcDashboard = () => {
  // sync gemma
  const [syncGemmaLoading, setSyncGemmaLoading] = useState(false);
  const [syncGemmaSuccess, setSyncGemmaSuccess] = useState(false);

  const [syncGemmaResults, setSyncGemmaResults] = useState([]);

  const endpointsTest = [
    { id: '3', name: 'elements' },
    { id: '4', name: 'views' },
    { id: '2', name: 'relations' },
    { id: '1', name: 'model' },
  ];
  const endpointsAccept = [
    { id: '7', name: 'elements' },
    { id: '4', name: 'views' },
    { id: '8', name: 'relations' },
    { id: '10', name: 'model' },
  ];

  const [archimateUrl, setArchimateUrl] = useState(
    'https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/main/docs/examples/GEMMA_release.xml'
  );

  // Add Voorziening Modal
  const syncGemmaRef = useRef(null);

  const hostname = window.location.hostname;

  const baseUrl =
    hostname === 'vng.test.opencatalogi.nl'
      ? 'https://vng.test.commonground.nu'
      : 'https://vng.accept.commonground.nu';

  const handleSyncGemma = () => syncGemmaRef?.current?.showModal();

  const checkHeartbeat = async (apiCall) => {
    try {
      const response = await fetch(`${baseUrl}/status.php`, {
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

  const syncGemma = () => {
    const url = `${baseUrl}/apps/openconnector/api/endpoint/synchronize-model`;
    const accessToken = getCookie('nextcloud_access_token');

    setSyncGemmaLoading(true);
    setSyncGemmaResults([]);

    const endpoints = hostname === 'localhost' ? endpointsTest : endpointsAccept;

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

        // Make the initial API call
        const response = await fetch(
          `${baseUrl}/apps/openconnector/api/synchronizations-run/${apiCall.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            source: archimateUrl,
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

        setSyncGemmaResults((prev) =>
          prev.map((item) =>
            item.name === apiCall.name
              ? { ...item, status: 'success', object: initialData }
              : item
          )
        );
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

          const response = await fetch(
            `${baseUrl}/apps/openconnector/api/endpoint/connect-views`,
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
        setSyncGemmaLoading(false);
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
      `${baseUrl}/apps/openconnector/api/endpoint/models`,
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
          syncGemmaResults.map((result) => (
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
                      <TableCell> {result.object.result.objects.created}</TableCell>
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
                      <TableCell>{result.object.result.objects.deleted}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Aantal objecten ongeldig</TableCell>
                      <TableCell>{result.object.result.objects.deleted}</TableCell>
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
          ))}
      </div>
    </AcModal>
  );

  const downloadModel = async (model) => {
    setModelLoading(true);
    try {
      const url = `${baseUrl}/apps/openconnector/api/endpoint/model/${model.id}?organisatie=89e904fc-e0c5-4fc0-ba0f-adf9c4be42a9`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlData = await response.text();

      // Create blob and download
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${model.name}.xml`;
      a.click();

      // Cleanup
      URL.revokeObjectURL(downloadUrl);
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
