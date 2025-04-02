import { useRef, useState } from 'react';
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
import _ from 'lodash';

const AcDashboard = () => {
  // sync gemma
  const [syncGemmaLoading, setSyncGemmaLoading] = useState(false);
  const [syncGemmaSuccess, setSyncGemmaSuccess] = useState(false);

  const [syncGemmaResults, setSyncGemmaResults] = useState([]);

  const apiCalls = ['relations', 'model', 'views', 'elements'];
  const endpoints = [
    { id: '7', name: 'elements' },
    { id: '4', name: 'views' },
    { id: '8', name: 'relations' },
    { id: '10', name: 'model' },
  ];

  // Add Voorziening Modal
  const addVoorzieningModalRef = useRef(null);
  const syncGemmaRef = useRef(null);
  const [addVoorzieningFormData, setAddVoorzieningFormData] = useState({
    name: '',
    description: '',
    category: '',
    functionalities: '',
    standards: '',
    offerings: '',
  });

  const handleAddVoorzieningOpenModal = () =>
    addVoorzieningModalRef?.current?.showModal();

  const handleAddVoorzieningFieldChange = (field) => (value) => {
    setAddVoorzieningFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSyncGemma = () => syncGemmaRef?.current?.showModal();

  const handleAddVoorzieningSubmit = () => {
    // Here you can make your POST request with the formData
    console.info('Form data to submit:', addVoorzieningFormData);
  };

  const checkHeartbeat = async (apiCall) => {
    try {
      const response = await fetch(`https://vng.accept.commonground.nu/status.php`, {
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
    const baseUrl = 'https://vng.accept.commonground.nu/apps';
    const url = `${baseUrl}/openconnector/api/endpoint/synchronize-model`;
    const accessToken = getCookie('nextcloud_access_token');

    setSyncGemmaLoading(true);
    setSyncGemmaResults([]);

    const apiPromises = endpoints.map(async (apiCall) => {
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
          `https://vng.accept.commonground.nu/apps/openconnector/api/synchronizations-run/${apiCall.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const initialData = await response.json();

        // Stop heartbeat checks when we get initial data
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }

        if (initialData) {
          setSyncGemmaResults((prev) =>
            prev.map((item) =>
              item.name === apiCall.name
                ? { ...item, status: 'success', object: initialData }
                : item
            )
          );
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
              ? { ...item, status: 'error', object: initialData }
              : item
          )
        );
      }
    });

    Promise.all(apiPromises).finally(() => {
      setSyncGemmaLoading(false);
      setSyncGemmaSuccess(true);
    });
  };

  const renderAddVoorzieningModal = (
    <AcModal
      ref={addVoorzieningModalRef}
      id='categories-modal'
      title='Voorziening aanmaken'
      buttons={[{ label: 'opslaan', onClick: handleAddVoorzieningSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('name')}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('description')}
        />
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('category')}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('functionalities')}
        />
        <AcFormField
          label='Standaarden'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('standards')}
        />
        <AcFormField
          label='Aanbiedingen'
          type='text'
          onBlur={handleAddVoorzieningFieldChange('offerings')}
        />
      </AcFlex>
    </AcModal>
  );

  const [downloadGemmaError, setDownloadGemmaError] = useState(null);

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
              value='https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/main/docs/examples/GEMMA_release.xml'
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
              {(result.status === 'success' || result.status === 'error') && (
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
            </AcCard>
          ))}
      </div>
    </AcModal>
  );

  const downloadGemma = async () => {
    try {
      // const baseUrl = config.mijnOmgeving.baseURL;
      const baseUrl = 'https://vng.accept.commonground.nu/apps';
      // const baseUrl = 'http://localhost:8080/apps';
      const url = `${baseUrl}/openconnector/api/endpoint/model.xml`;

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
      a.download = 'gemma-model.xml';
      a.click();

      // Cleanup
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading GEMMA model:', error);
      setDownloadGemmaError(error);
      setTimeout(() => setDownloadGemmaError(null), 2500);
      return;
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
              icon={<VISUALS.DOCUMENT />}
              onClick={handleAddVoorzieningOpenModal}
            >
              Voorziening aanmaken
            </AcButton>

            <AcButton
              style='button'
              icon={<VISUALS.CLOUD />}
              onClick={handleSyncGemma}
              disabled={syncGemmaLoading}
            >
              Archimate inlezen
            </AcButton>

            <AcButton
              style='button'
              icon={<VISUALS.DOWNLOAD />}
              onClick={downloadGemma}
            >
              GEMMA downloaden
            </AcButton>
          </AcFlex>
        </AcFlex>
      </AcFlex>
      {renderAddVoorzieningModal}
      {renderSyncGemmaModal}
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
