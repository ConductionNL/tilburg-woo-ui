import { useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { getCookie } from '@src/utilities';
import { AcSearchResult, AcButton, AcFormField } from '@molecules';
import { AcModal } from '@components';
import loadable from '@loadable/component';
import AcColumn from '@atoms/ac-column/ac-column';
import { AcSideNav } from '@components';

const AcDashboard = () => {
  // sync gemma
  const [syncGemmaLoading, setSyncGemmaLoading] = useState(false);
  const [syncGemmaError, setSyncGemmaError] = useState(null);
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

  const checkHeartbeat = async (apiCall, accessToken) => {
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

  const startHeartbeatChecks = async (apiCall, accessToken) => {
    let heartbeatInterval;

    try {
      heartbeatInterval = setInterval(async () => {
        try {
          const data = await checkHeartbeat(apiCall, accessToken);
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
        { id: apiCall.name, status: 'loading' },
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
              item.id === apiCall.name ? { ...item, status: 'succes' } : item
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
            item.id === apiCall.name ? { ...item, status: 'error' } : item
          )
        );
      }
    });

    Promise.all(apiPromises).finally(() => {
      setSyncGemmaLoading(false);
      setSyncGemmaSuccess(true);
      setTimeout(() => setSyncGemmaSuccess(false), 4000);
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

  const getImage = (name) => {
    const result = syncGemmaResults.find((result) => result.id === name);

    const status = result?.status;

    switch (status) {
      case 'loading':
        return <VISUALS.SPINNER className='ac-gemma-sync-result-image--loading' />;
      case 'succes':
        return (
          <VISUALS.CIRCLE_CHECK className='ac-gemma-sync-result-image--success' />
        );
      case 'error':
        return (
          <VISUALS.CIRCLE_XMARK className='ac-gemma-sync-result-image--error' />
        );
      case 'dash':
        return '-';
    }
  };

  const renderSyncGemmaModal = (
    <AcModal ref={syncGemmaRef} id='categories-modal' title='Voorziening aanmaken'>
      <AcFlex column spacing='sm'>
        {!syncGemmaLoading && (
          <>
            <AcFormField
              label='url gemma'
              type='url'
              value='https://www.gemmaonline.nl/index.php?title=DisplayArchiMateViews&elementtype=ArchiMateView&model=GEMMA%2Fid-2b2b88ba-8efe-46d3-8b40-47af290bc418'
            />
            <AcFormField
              label='url naar Archimate(XML)'
              type='url'
              value='https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/main/docs/examples/GEMMA_release.xml'
            />
          </>
        )}
      </AcFlex>
      <br />
      <AcButton
        style='button'
        icon={<VISUALS.CLOUD />}
        onClick={syncGemma}
        disabled={syncGemmaLoading}
      >
        {'Gemma inlezen'}
      </AcButton>
      <br />
      <br />
      <br />
      <div>
        {(syncGemmaLoading || syncGemmaSuccess) &&
          apiCalls.map((apiCall) => (
            <div className='ac-gemma-sync-result'>
              {getImage(apiCall)}
              <span>{apiCall}</span>
            </div>
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
              {syncGemmaLoading ? 'Gemma inlezen...' : 'Gemma inlezen'}
            </AcButton>

            <AcButton
              style='button'
              icon={<VISUALS.DOWNLOAD />}
              onClick={downloadGemma}
            >
              Gemma downloaden
            </AcButton>
          </AcFlex>

          <AcFlex column spacing='sm' alignItems='end'>
            {syncGemmaSuccess && <Paragraph>Succesvol gemma ingelezen.</Paragraph>}
            {syncGemmaError && <Paragraph>Fout bij gemma inlezen.</Paragraph>}
            {downloadGemmaError && <Paragraph>Fout bij gemma downloaden.</Paragraph>}
          </AcFlex>
        </AcFlex>
      </AcFlex>
      {renderAddVoorzieningModal}
      {renderSyncGemmaModal}
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
