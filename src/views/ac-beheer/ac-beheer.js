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
import AcSideNav from '../../components/ac-sidenav/ac-side-nav';

// list pages
const AcBeheerVoorzieningenAanbod = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod'
  )
);
const AcBeheerVoorzieningenGebruik = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-gebruik/ac-voorzieningen-gebruik')
);
const AcBeheerVoorzieningenVersie = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-versie/ac-voorzieningen-versie')
);
const AcBeheerContracten = loadable(() =>
  import('@views/ac-beheer/ac-contracten/ac-contracten')
);
const AcBeheerOrganisaties = loadable(() =>
  import('@views/ac-beheer/ac-organisatie/ac-organisatie')
);
const AcBeheerKwetsbaarheden = loadable(() =>
  import('@views/ac-beheer/ac-kwetsbaarheid/ac-kwetsbaarheid')
);

// detail pages
const AcBeheerVoorzieningenAanbodDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod-details'
  )
);

const AcBeheer = () => {
  const navigate = useMemo(() => useNavigate(), []);

  // Add Voorziening Modal
  const addVoorzieningModalRef = useRef(null);
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
    console.log('Form data to submit:', addVoorzieningFormData);
  };

  const wrongPage = () => (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.WRONG_PAGE}</Heading>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );

  const dashboardPage = () => (
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
    </AcSection>
  );

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
    const baseUrl = 'https://vng.accept.commonground.nu/apps';
    // const baseUrl = 'http://localhost:8080/apps';
    const url = `${baseUrl}/openconnector/api/endpoint/synchronize-model`;

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

  const loggedIn = !!getCookie('nextcloud_user_id');
  useEffect(() => {
    if (!loggedIn) {
      navigate(`/login?redirect_url=${window.location.pathname}`);
    }
  }, [loggedIn]);

  const { type, id } = useParams();

  if (window.location.pathname === '/beheer') {
    return dashboardPage();
  }

  if (!id) {
    switch (type) {
      case 'voorzieningen-aanbod':
        return <AcBeheerVoorzieningenAanbod />;
      case 'voorzieningen-gebruik':
        return <AcBeheerVoorzieningenGebruik />;
      case 'voorzieningen-versie':
        return <AcBeheerVoorzieningenVersie />;
      case 'contracten':
        return <AcBeheerContracten />;
      case 'organisaties':
        return <AcBeheerOrganisaties />;
      case 'kwetsbaarheden':
        return <AcBeheerKwetsbaarheden />;
      default:
        return wrongPage();
    }
  }

  switch (type) {
    case 'voorzieningen-aanbod':
      return <AcBeheerVoorzieningenAanbodDetails id={id} />;
    default:
      return wrongPage();
  }
};

export default withStore(observer(AcBeheer));
