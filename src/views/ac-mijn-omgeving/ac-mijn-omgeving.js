// TODO: do something with this file

import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

import { AcButton, AcFormField } from '@molecules';
import { AcFlex, AcSection } from '@atoms';
import { VISUALS } from '@constants';
import { AcModal, AcSideNav } from '@components';
import { withStore } from '@stores';

import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
// import { Pagination } from '@amsterdam/design-system-react';

function getCookie(name) {
  // Split document.cookie on `;` to handle multiple cookies
  const cookieArr = document.cookie.split(';');

  for (let cookie of cookieArr) {
    // Remove leading spaces
    cookie = cookie.trim();
    // Check if this cookie starts with "<name>="
    if (cookie.startsWith(`${encodeURIComponent(name)}=`)) {
      // Return everything after the "<name>="
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;
}

const AcMijnOmgeving = () => {
  const navigate = useNavigate();

  const nextcloud_user_id = getCookie('nextcloud_user_id');
  useEffect(() => {
    if (!nextcloud_user_id) return;
    navigate('/login?redirect_url=/mijn-omgeving');
  }, [nextcloud_user_id]);

  // Add Voorziening Modal
  const addVoorzieningModalRef = useRef(null);
  // eslint-disable-next-line no-unused-vars -- is going to be used in the future
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

  const handleAddVoorzieningSubmit = () => {
    // Here you can make your POST request with the formData
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

  // sync gemma
  const [syncGemmaLoading, setSyncGemmaLoading] = useState(false);
  const [syncGemmaError, setSyncGemmaError] = useState(null);
  const [syncGemmaSuccess, setSyncGemmaSuccess] = useState(false);

  const syncGemma = async () => {
    // const baseUrl = config.mijnOmgeving.baseURL;
    // const baseUrl = 'https://vng.accept.commonground.nu/apps';
    const baseUrl = 'http://localhost:8080/apps';
    const url = `${baseUrl}/openregister/api/objects/vng-gemma/synchronize-model`;

    try {
      setSyncGemmaLoading(true);

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSyncGemmaSuccess(true);
      setTimeout(() => setSyncGemmaSuccess(false), 2500);
    } catch (error) {
      console.error('Error syncing GEMMA:', error);

      setSyncGemmaError(error);
      setTimeout(() => setSyncGemmaError(null), 2500);
    } finally {
      setSyncGemmaLoading(false);
    }
  };

  // gemma download
  const [downloadGemmaError, setDownloadGemmaError] = useState(null);

  const downloadGemma = async () => {
    try {
      // const baseUrl = config.mijnOmgeving.baseURL;
      // const baseUrl = 'https://vng.accept.commonground.nu/apps';
      const baseUrl = 'http://localhost:8080/apps';
      const url = `${baseUrl}/openregister/api/objects/vng-gemma/model`;

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
              onClick={syncGemma}
              disabled={syncGemmaLoading}
            >
              {syncGemmaLoading ? 'Archimate inlezen...' : 'Archimate inlezen'}
            </AcButton>

            <AcButton
              style='button'
              icon={<VISUALS.DOWNLOAD />}
              onClick={downloadGemma}
            >
              GEMMA downloaden
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
    </AcSection>
  );
};

export default withStore(observer(AcMijnOmgeving));
