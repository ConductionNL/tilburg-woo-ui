// TODO: do something with this file

import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

import { AcSearchResult, AcButton, AcFormField } from '@molecules';
import { AcFlex, AcSection } from '@atoms';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcModal, AcSideNav } from '@components';
import { withStore } from '@stores';

import {
  Alert,
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
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

  //   const {
  //     search_query,
  //     pagination,
  //     setPage,
  //     updateQuery,
  //     setSearchQuery,
  //     fetchAggregations,
  //     fetchPublications,
  //     is_loading,
  //     getSearchPageURL,
  //     all_publications,
  //     resetSearchQuery,
  //     resetAggregations,
  //   } = mijnOmgeving; // import mijnOmgeving from store

  // useEffect(() => {
  //   setQuery();

  //   fetchAggregations();

  //   return () => {
  //     resetSearchQuery();
  //     resetAggregations();
  //   };
  // }, []);

  // useEffect(() => {
  //   console.log(getSearchPageURL());
  //   console.log(location.pathname + location.mijnOmgeving);
  //   if (getSearchPageURL() === location.pathname + location.mijnOmgeving) {
  //     return;
  //   }

  //   navigate(getSearchPageURL());
  // }, [search_query, ...Object.values(search_query?.published || {})]);

  // // On GET params change.
  // useEffect(() => {
  //   console.group('LOCATION PARAMS CHANGED');
  //   console.log([location.mijnOmgeving]);
  //   console.groupEnd();

  //   setQuery();
  //   fetchPublications();
  // }, [location.mijnOmgeving]);

  //   const users = [
  //     {
  //       name: 'Lisa',
  //       last_name: 'Smith',
  //       function: 'Developer',
  //     },
  //     {
  //       name: 'Bram',
  //       last_name: 'van der Veen',
  //       function: 'Manager',
  //     },
  //     {
  //       name: 'Jeroen',
  //       last_name: 'Molenaar',
  //       function: 'Lead Developer',
  //     },
  //   ];

  //   const mapConfigurationRow = (row) => {
  //     return [
  //       <span key={row.name}>{row.name}</span>,
  //       <span key={row.last_name}>{row.last_name}</span>,
  //       <span key={row.function}>{row.function}</span>,
  //     ];
  //   };

  //   const screenReaderText = useMemo(() => {
  //     if (is_loading === true) {
  //       return LABELS.SEARCH_RESULTS_LOADING;
  //     }

  //     return `${LABELS.SEARCH_RESULTS_LOADED} ${LABELS_DYNAMIC.RESULTS(
  //       all_publications?.length
  //     )} ${LABELS.FOUND.toLowerCase()}.`;
  //   }, [is_loading, all_publications?.length]);

  //   const renderPublications = useMemo(() => {
  //     if (is_loading) {
  //       return Array.from({ length: pagination?.limit || 15 }).map((_, index) => (
  //         <AcSearchResult skeleton key={index} />
  //       ));
  //     }

  //     if (all_publications?.length < 1) {
  //       return (
  //         <Alert type='info'>
  //           <AcFlex spacing='sm'>
  //             <VISUALS.INFO_BLUE />
  //             <AcFlex column spacing='xs'>
  //               <Heading level={3}>{LABELS.NO_RESULTS}</Heading>
  //               <Paragraph>{LABELS.REFINE_SEARCH}</Paragraph>
  //             </AcFlex>
  //           </AcFlex>
  //         </Alert>
  //       );
  //     }

  //     return all_publications?.map((publication, index) => (
  //       <AcSearchResult {...publication} key={index} />
  //     ));
  //   }, [is_loading, all_publications, pagination?.limit]);

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
      // const baseUrl = 'https://vng.accept.commonground.nu/apps';
      const baseUrl = 'http://localhost:8080/apps';
      const url = `${baseUrl}/openconnector/api/endpoint/model`;

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
